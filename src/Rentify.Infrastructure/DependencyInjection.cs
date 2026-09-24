using System.Text;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.IdentityModel.Tokens;
using Rentify.Application.Interfaces;
using Rentify.Infrastructure.Identity;
using Rentify.Infrastructure.Payments;
using Rentify.Infrastructure.Persistence;
using Rentify.Infrastructure.Persistence.Repositories;
using Rentify.Infrastructure.Services;

namespace Rentify.Infrastructure;

/// <summary>
/// Composition-root entry point for the Infrastructure layer. Rentify.API calls this once,
/// from Program.cs, alongside AddApplicationServices().
///
/// Phase 4 additions: ASP.NET Core Identity (AddIdentityCore, not AddIdentity — see the
/// comment below), JWT bearer authentication, the real ICurrentUserService, and the
/// Authentication use-case services (IAuthService, IJwtTokenGenerator, IEmailSender).
///
/// Still to come in later phases: repository implementations beyond DbContext, Serilog
/// sinks, Hangfire storage, SignalR hub infrastructure, a real (non-logging) email provider.
/// </summary>
public static class DependencyInjection
{
    public static IServiceCollection AddInfrastructureServices(this IServiceCollection services, IConfiguration configuration)
    {
        services.AddDbContext<RentifyDbContext>(options =>
            options.UseSqlServer(
                configuration.GetConnectionString("DefaultConnection"),
                sqlOptions => sqlOptions.MigrationsAssembly(typeof(RentifyDbContext).Assembly.FullName)));

        // AddIdentityCore (not AddIdentity<TUser, TRole>) deliberately: AddIdentity also
        // registers cookie authentication as the default scheme, which we don't want in a
        // pure JWT API — AddIdentityCore + AddSignInManager gives us UserManager/
        // SignInManager/RoleManager without pulling cookie auth in alongside JWT bearer.
        services.AddIdentityCore<ApplicationUser>(options =>
            {
                options.Password.RequiredLength = 8;
                options.Password.RequireNonAlphanumeric = false;
                options.User.RequireUniqueEmail = true;
                options.SignIn.RequireConfirmedEmail = true;
                options.Lockout.MaxFailedAccessAttempts = 5;
                options.Lockout.DefaultLockoutTimeSpan = TimeSpan.FromMinutes(15);
            })
            .AddRoles<IdentityRole>()
            .AddEntityFrameworkStores<RentifyDbContext>()
            .AddSignInManager()
            .AddDefaultTokenProviders();

        var jwtOptions = configuration.GetSection(JwtOptions.SectionName).Get<JwtOptions>()
            ?? throw new InvalidOperationException("Missing 'Jwt' configuration section.");

        if (string.IsNullOrWhiteSpace(jwtOptions.SigningKey) || Encoding.UTF8.GetByteCount(jwtOptions.SigningKey) < 32)
        {
            // Fail fast and loudly rather than starting up with an empty/weak signing key.
            throw new InvalidOperationException(
                "Jwt:SigningKey is missing or shorter than 32 bytes. Set it with " +
                "'dotnet user-secrets set \"Jwt:SigningKey\" \"<a-random-32+-byte-string>\"' " +
                "from Rentify.API, or in appsettings.Development.json for local dev — never in appsettings.json.");
        }

        services.AddSingleton(jwtOptions);

        services.AddAuthentication(options =>
            {
                options.DefaultAuthenticateScheme = JwtBearerDefaults.AuthenticationScheme;
                options.DefaultChallengeScheme = JwtBearerDefaults.AuthenticationScheme;
            })
            .AddJwtBearer(options =>
            {
                options.TokenValidationParameters = new TokenValidationParameters
                {
                    ValidateIssuer = true,
                    ValidIssuer = jwtOptions.Issuer,
                    ValidateAudience = true,
                    ValidAudience = jwtOptions.Audience,
                    ValidateIssuerSigningKey = true,
                    IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtOptions.SigningKey)),
                    ValidateLifetime = true,
                    ClockSkew = TimeSpan.FromSeconds(30),
                };
            });

        services.AddAuthorization();

        services.AddHttpContextAccessor();
        services.AddScoped<ICurrentUserService, CurrentUserService>();

        services.AddScoped<IJwtTokenGenerator, JwtTokenGenerator>();
        services.AddScoped<IAuthService, AuthService>();

        // Email: use real SMTP when EmailSettings is fully configured, otherwise fall back to
        // the logging sender so a missing setting never stops the app from starting.
        services.Configure<EmailOptions>(configuration.GetSection(EmailOptions.SectionName));
        var emailOptions = configuration.GetSection(EmailOptions.SectionName).Get<EmailOptions>();
        if (emailOptions is { IsConfigured: true })
        {
            services.AddScoped<IEmailSender, SmtpEmailSender>();
        }
        else
        {
            services.AddScoped<IEmailSender, LoggingEmailSender>();
        }

        // Paymob settings are bound now but not used until the Payments phase.
        services.Configure<PaymobOptions>(configuration.GetSection(PaymobOptions.SectionName));

        // Phase 5: repository implementations for the first "real" business resources.
        services.AddScoped<IPropertyRepository, PropertyRepository>();
        services.AddScoped<IUnitRepository, UnitRepository>();
        services.AddScoped<IOwnerProfileRepository, OwnerProfileRepository>();

        // Phase 6: rental contract workflow.
        services.AddScoped<IContractRepository, ContractRepository>();
        services.AddScoped<ITenantProfileRepository, TenantProfileRepository>();

        return services;
    }
}

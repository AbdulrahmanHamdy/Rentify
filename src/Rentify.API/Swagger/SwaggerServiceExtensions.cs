using Microsoft.OpenApi.Models;

namespace Rentify.API.Swagger;

/// <summary>
/// Keeps Swagger configuration out of Program.cs, in the same "one Add*/Use* call per concern"
/// style as AddApplicationServices / AddInfrastructureServices.
/// </summary>
public static class SwaggerServiceExtensions
{
    public const string BearerSchemeName = "Bearer";

    public static IServiceCollection AddRentifySwagger(this IServiceCollection services)
    {
        services.AddEndpointsApiExplorer();

        services.AddSwaggerGen(options =>
        {
            options.SwaggerDoc("v1", new OpenApiInfo
            {
                Title = "Rentify API",
                Version = "v1",
                Description =
                    "Property rental management API for owners, tenants and administrators.\n\n" +
                    "**Authenticating in this UI:** call `POST /api/auth/login`, copy `accessToken` from the " +
                    "response, click **Authorize** and paste the token (no `Bearer ` prefix needed). " +
                    "Access tokens are short-lived; use `POST /api/auth/refresh` when it expires.",
            });

            // HTTP bearer scheme: Swagger UI prepends "Bearer " itself.
            options.AddSecurityDefinition(BearerSchemeName, new OpenApiSecurityScheme
            {
                Type = SecuritySchemeType.Http,
                Scheme = "bearer",
                BearerFormat = "JWT",
                In = ParameterLocation.Header,
                Name = "Authorization",
                Description = "Paste the JWT access token returned by /api/auth/login.",
            });

            // Adds the lock icon + the 401/403/404/409/422/500 responses per endpoint (see filter).
            options.OperationFilter<AuthAndErrorResponsesOperationFilter>();

            // /// summaries from the API and Application (DTO) assemblies.
            foreach (var xmlFile in new[] { "Rentify.API.xml", "Rentify.Application.xml" })
            {
                var path = Path.Combine(AppContext.BaseDirectory, xmlFile);
                if (File.Exists(path))
                {
                    options.IncludeXmlComments(path);
                }
            }
        });

        return services;
    }

    public static IApplicationBuilder UseRentifySwagger(this IApplicationBuilder app)
    {
        app.UseSwagger();
        app.UseSwaggerUI(options =>
        {
            options.SwaggerEndpoint("/swagger/v1/swagger.json", "Rentify API v1");
            options.DocumentTitle = "Rentify API";
            options.DisplayRequestDuration();

            // Keeps the pasted token across browser refreshes while developing.
            options.EnablePersistAuthorization();
        });

        return app;
    }
}

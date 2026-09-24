using Rentify.API.Filters;
using Rentify.API.Middleware;
using Rentify.API.Swagger;
using Rentify.Application;
using Rentify.Infrastructure;
using Rentify.Infrastructure.Identity;

var builder = WebApplication.CreateBuilder(args);

// ---------------------------------------------------------------------------------
// Each layer exposes a single Add*Services() extension method so Program.cs stays a
// thin composition root and never needs to know the internals of Application or
// Infrastructure. AddApplicationServices now also wires AutoMapper, FluentValidation
// validators, and the Property/Unit services (Phase 5).
// ---------------------------------------------------------------------------------
builder.Services.AddApplicationServices();
builder.Services.AddInfrastructureServices(builder.Configuration);

// GlobalExceptionHandler (Phase 5) is the single place every unhandled exception is
// mapped to a consistent ApiErrorResponse + status code. AddProblemDetails() is required
// alongside AddExceptionHandler for ASP.NET Core's exception-handling middleware to be
// fully wired, even though GlobalExceptionHandler writes its own response body rather
// than the built-in ProblemDetails shape.
builder.Services.AddExceptionHandler<GlobalExceptionHandler>();
builder.Services.AddProblemDetails();

builder.Services.AddControllers(options =>
{
    // Registered globally (not per-controller) so every action whose bound argument type
    // has a matching FluentValidation IValidator<T> is validated automatically — see
    // ValidationFilter's own doc comment for why this throws AppValidationException rather
    // than short-circuiting with its own response shape.
    options.Filters.Add<ValidationFilter>();
});

// Phase 7: OpenAPI document + Swagger UI with a JWT "Authorize" button.
builder.Services.AddRentifySwagger();

var app = builder.Build();

// Must be the first middleware in the pipeline so it can catch exceptions thrown by
// anything after it (authentication, authorization, model binding, controllers, ...).
app.UseExceptionHandler();

// Swagger sits after the exception handler but before authentication: the UI and its JSON
// are static documentation and must be reachable without a token. Development-only unless
// Swagger:Enabled is set (see appsettings.json).
if (app.Environment.IsDevelopment() || app.Configuration.GetValue<bool>("Swagger:Enabled"))
{
    app.UseRentifySwagger();
}

app.UseHttpsRedirection();

// Authentication must run before Authorization so User is populated before [Authorize]
// checks it.
app.UseAuthentication();
app.UseAuthorization();

app.MapControllers();

// Seed the fixed Admin/Owner/Tenant roles on startup. Deliberately does not seed a
// default Admin user — see IdentitySeeder's doc comment for why.
using (var scope = app.Services.CreateScope())
{
    await IdentitySeeder.SeedRolesAsync(scope.ServiceProvider);
}

app.Run();

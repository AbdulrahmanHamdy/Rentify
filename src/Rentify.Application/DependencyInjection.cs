using FluentValidation;
using Microsoft.Extensions.DependencyInjection;
using Rentify.Application.Interfaces;
using Rentify.Application.Services;

namespace Rentify.Application;

/// <summary>
/// Composition-root entry point for the Application layer. Rentify.API calls this once,
/// from Program.cs, so the API project never needs to know which concrete Application
/// services exist.
///
/// Phase 5 additions: AutoMapper (entity -> DTO mapping profiles), FluentValidation
/// (request-DTO validators, run by Rentify.API's global ValidationFilter — see that class
/// for why validation is invoked there rather than here), and the first real business
/// services (Property, Unit).
/// </summary>
public static class DependencyInjection
{
    public static IServiceCollection AddApplicationServices(this IServiceCollection services)
    {
        services.AddAutoMapper(typeof(DependencyInjection).Assembly);

        // Registers every AbstractValidator<T> in this assembly (Validators/Auth,
        // Validators/Properties, Validators/Units, ...) so IValidator<T> can be resolved
        // for any request DTO going forward without a registration line per validator.
        services.AddValidatorsFromAssembly(typeof(DependencyInjection).Assembly);

        services.AddScoped<IPropertyService, PropertyService>();
        services.AddScoped<IUnitService, UnitService>();
        services.AddScoped<IContractService, ContractService>();

        return services;
    }
}

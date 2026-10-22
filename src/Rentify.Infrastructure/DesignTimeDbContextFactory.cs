using System;
using System.IO;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Design;
using Microsoft.Extensions.Configuration;
using Rentify.Infrastructure.Persistence;
using Rentify.Application.Interfaces;

namespace Rentify.Infrastructure;

/// <summary>
/// Design‑time factory for EF Core tools.
/// It builds the <see cref="RentifyDbContext"/> using the connection string provided via the
/// environment variable <c>ConnectionStrings__DefaultConnection</c>. The JWT signing key is not
/// required for migrations, so we supply a minimal <see cref="ICurrentUserService"/> implementation.
/// </summary>
public class DesignTimeDbContextFactory : IDesignTimeDbContextFactory<RentifyDbContext>
{
    public RentifyDbContext CreateDbContext(string[] args)
    {
        // 1. Try environment variable directly
        var connectionString = Environment.GetEnvironmentVariable("ConnectionStrings__DefaultConnection");

        // 2. Fall back to configuration files (appsettings.json, appsettings.Development.json)
        if (string.IsNullOrWhiteSpace(connectionString))
        {
            var environment = Environment.GetEnvironmentVariable("ASPNETCORE_ENVIRONMENT") ?? "Development";
            var basePath = Path.Combine(Directory.GetCurrentDirectory(), "..", "Rentify.API");
            if (!Directory.Exists(basePath))
            {
                basePath = Directory.GetCurrentDirectory();
            }

            var configuration = new ConfigurationBuilder()
                .SetBasePath(basePath)
                .AddJsonFile("appsettings.json", optional: true)
                .AddJsonFile($"appsettings.{environment}.json", optional: true)
                .AddEnvironmentVariables()
                .Build();

            connectionString = configuration.GetConnectionString("DefaultConnection");
        }

        if (string.IsNullOrWhiteSpace(connectionString))
        {
            throw new InvalidOperationException("Could not find connection string 'DefaultConnection' in configuration or 'ConnectionStrings__DefaultConnection' environment variable.");
        }

        var optionsBuilder = new DbContextOptionsBuilder<RentifyDbContext>();
        optionsBuilder.UseSqlServer(connectionString, sql =>
            sql.MigrationsAssembly(typeof(RentifyDbContext).Assembly.FullName));

        // Minimal stub for the current-user service required by the DbContext constructor.
        var currentUserService = new DesignTimeCurrentUserService();
        return new RentifyDbContext(optionsBuilder.Options, currentUserService);
    }
}

/// <summary>
/// Simple stub that returns <c>null</c> for the user id. This is sufficient for design‑time operations.
/// </summary>
public class DesignTimeCurrentUserService : ICurrentUserService
{
    public string? UserId => null;
    public bool IsAuthenticated => false;
    public bool IsInRole(string role) => false;
}

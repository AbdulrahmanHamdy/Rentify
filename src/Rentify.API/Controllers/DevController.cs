using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Rentify.Infrastructure.Data;

namespace Rentify.API.Controllers;

[ApiController]
[Route("api/dev")]
public class DevController : ControllerBase
{
    private readonly IServiceProvider _serviceProvider;

    public DevController(IServiceProvider serviceProvider)
    {
        _serviceProvider = serviceProvider;
    }

    [HttpPost("reset-and-seed")]
    [AllowAnonymous]
    public async Task<IActionResult> ResetAndSeed()
    {
        using var scope = _serviceProvider.CreateScope();
        await DbSeeder.ResetAndSeedAsync(scope.ServiceProvider);

        return Ok(new
        {
            message = "Database reset and populated with fresh seed data successfully.",
            accounts = new object[]
            {
                new { role = "Owner", email = "owner@rentify.com", password = "Rentify2026!", company = "Rentify Prime Real Estate" },
                new { role = "Owner", email = "hamdy.owner@rentify.com", password = "Rentify2026!", company = "Nile Crest Developments" },
                new { role = "Tenant", email = "tenant@rentify.com", password = "Rentify2026!", name = "Karim Mahmoud" },
                new { role = "Tenant", email = "sarah.tenant@rentify.com", password = "Rentify2026!", name = "Sarah Hamdy" },
                new { role = "Admin", email = "admin@rentify.com", password = "Rentify2026!", name = "Rentify Administrator" }
            }
        });
    }
}

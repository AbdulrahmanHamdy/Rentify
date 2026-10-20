using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Rentify.Application.DTOs.Profile;
using Rentify.Application.Interfaces;

namespace Rentify.API.Controllers;

[ApiController]
[Route("api/profile")]
[Authorize]
public class ProfileController : ControllerBase
{
    private readonly IProfileService _profileService;

    public ProfileController(IProfileService profileService)
    {
        _profileService = profileService;
    }

    [HttpGet]
    public async Task<ActionResult<UserProfileDto>> GetProfile(CancellationToken cancellationToken)
    {
        var profile = await _profileService.GetProfileAsync(cancellationToken);
        return Ok(profile);
    }

    [HttpPut]
    public async Task<ActionResult<UserProfileDto>> UpdateProfile(
        [FromBody] UpdateProfileRequest request,
        CancellationToken cancellationToken)
    {
        var updatedProfile = await _profileService.UpdateProfileAsync(request, cancellationToken);
        return Ok(updatedProfile);
    }

    [HttpPost("change-password")]
    public async Task<IActionResult> ChangePassword(
        [FromBody] ChangePasswordRequest request,
        CancellationToken cancellationToken)
    {
        await _profileService.ChangePasswordAsync(request, cancellationToken);
        return Ok(new { message = "Password updated successfully." });
    }
}

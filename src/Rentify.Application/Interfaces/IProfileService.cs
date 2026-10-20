using Rentify.Application.DTOs.Profile;

namespace Rentify.Application.Interfaces;

public interface IProfileService
{
    Task<UserProfileDto> GetProfileAsync(CancellationToken cancellationToken = default);

    Task<UserProfileDto> UpdateProfileAsync(UpdateProfileRequest request, CancellationToken cancellationToken = default);

    Task ChangePasswordAsync(ChangePasswordRequest request, CancellationToken cancellationToken = default);
}

using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Rentify.Application.Common.Exceptions;
using Rentify.Application.DTOs.Profile;
using Rentify.Application.Interfaces;
using Rentify.Domain.Enums;
using Rentify.Infrastructure.Persistence;

namespace Rentify.Infrastructure.Identity;

public class ProfileService : IProfileService
{
    private readonly UserManager<ApplicationUser> _userManager;
    private readonly RentifyDbContext _dbContext;
    private readonly ICurrentUserService _currentUserService;

    public ProfileService(
        UserManager<ApplicationUser> userManager,
        RentifyDbContext dbContext,
        ICurrentUserService currentUserService)
    {
        _userManager = userManager;
        _dbContext = dbContext;
        _currentUserService = currentUserService;
    }

    public async Task<UserProfileDto> GetProfileAsync(CancellationToken cancellationToken = default)
    {
        var userId = _currentUserService.UserId
            ?? throw new AppUnauthorizedException("User is not authenticated.");

        var user = await _userManager.FindByIdAsync(userId)
            ?? throw new AppNotFoundException("User could not be found.");

        var roles = await _userManager.GetRolesAsync(user);

        int? ownerProfileId = null;
        string? companyName = null;
        int propertiesCount = 0;
        int unitsCount = 0;

        int? tenantProfileId = null;
        string? nationalId = null;
        int activeContractsCount = 0;

        var owner = await _dbContext.OwnerProfiles
            .Include(o => o.Properties)
                .ThenInclude(p => p.Units)
            .FirstOrDefaultAsync(o => o.UserId == userId, cancellationToken);

        if (owner is not null)
        {
            ownerProfileId = owner.Id;
            companyName = owner.CompanyName;
            propertiesCount = owner.Properties.Count;
            unitsCount = owner.Properties.Sum(p => p.Units.Count);
        }

        var tenant = await _dbContext.TenantProfiles
            .Include(t => t.RentalContracts)
            .FirstOrDefaultAsync(t => t.UserId == userId, cancellationToken);

        if (tenant is not null)
        {
            tenantProfileId = tenant.Id;
            nationalId = tenant.NationalId;
            activeContractsCount = tenant.RentalContracts.Count(c => c.Status == ContractStatus.Active);
        }

        return new UserProfileDto(
            UserId: user.Id,
            Email: user.Email ?? string.Empty,
            FirstName: user.FirstName,
            LastName: user.LastName,
            PhoneNumber: user.PhoneNumber,
            Roles: roles.ToList(),
            CreatedAt: user.CreatedAt,
            OwnerProfileId: ownerProfileId,
            CompanyName: companyName,
            PropertiesCount: propertiesCount,
            UnitsCount: unitsCount,
            TenantProfileId: tenantProfileId,
            NationalId: nationalId,
            ActiveContractsCount: activeContractsCount
        );
    }

    public async Task<UserProfileDto> UpdateProfileAsync(UpdateProfileRequest request, CancellationToken cancellationToken = default)
    {
        var userId = _currentUserService.UserId
            ?? throw new AppUnauthorizedException("User is not authenticated.");

        var user = await _userManager.FindByIdAsync(userId)
            ?? throw new AppNotFoundException("User could not be found.");

        user.FirstName = string.IsNullOrWhiteSpace(request.FirstName) ? null : request.FirstName.Trim();
        user.LastName = string.IsNullOrWhiteSpace(request.LastName) ? null : request.LastName.Trim();
        user.PhoneNumber = string.IsNullOrWhiteSpace(request.PhoneNumber) ? null : request.PhoneNumber.Trim();

        var updateResult = await _userManager.UpdateAsync(user);
        if (!updateResult.Succeeded)
        {
            throw new AppValidationException(updateResult.Errors.Select(e => e.Description));
        }

        var owner = await _dbContext.OwnerProfiles
            .FirstOrDefaultAsync(o => o.UserId == userId, cancellationToken);

        if (owner is not null)
        {
            owner.CompanyName = string.IsNullOrWhiteSpace(request.CompanyName) ? null : request.CompanyName.Trim();
            owner.PhoneNumber = user.PhoneNumber;
        }

        var tenant = await _dbContext.TenantProfiles
            .FirstOrDefaultAsync(t => t.UserId == userId, cancellationToken);

        if (tenant is not null)
        {
            tenant.NationalId = string.IsNullOrWhiteSpace(request.NationalId) ? null : request.NationalId.Trim();
            tenant.PhoneNumber = user.PhoneNumber;
        }

        await _dbContext.SaveChangesAsync(cancellationToken);

        return await GetProfileAsync(cancellationToken);
    }

    public async Task ChangePasswordAsync(ChangePasswordRequest request, CancellationToken cancellationToken = default)
    {
        var userId = _currentUserService.UserId
            ?? throw new AppUnauthorizedException("User is not authenticated.");

        var user = await _userManager.FindByIdAsync(userId)
            ?? throw new AppNotFoundException("User could not be found.");

        var result = await _userManager.ChangePasswordAsync(user, request.CurrentPassword, request.NewPassword);
        if (!result.Succeeded)
        {
            throw new AppValidationException(result.Errors.Select(e => e.Description));
        }
    }
}

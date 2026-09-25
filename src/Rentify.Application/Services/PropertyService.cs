using AutoMapper;
using Rentify.Application.Common.Exceptions;
using Rentify.Application.Common.Pagination;
using Rentify.Application.DTOs.Properties;
using Rentify.Application.Interfaces;
using Rentify.Domain.Constants;
using Rentify.Domain.Entities;

namespace Rentify.Application.Services;

/// <summary>
/// Implements every Property use case. Lives in the Application layer (not Infrastructure,
/// unlike AuthService) because it needs no direct dependency on ASP.NET Core Identity —
/// only on the repository interfaces and ICurrentUserService, both of which are Application
/// abstractions. Ownership is enforced here, not in the controller or the database: "a user
/// must never access another user's private resources simply by changing an ID in the URL"
/// (see the project spec's Authorization section) is exactly what <see cref="EnsureCanManage"/>
/// exists to guarantee.
/// </summary>
public class PropertyService : IPropertyService
{
    private readonly IPropertyRepository _propertyRepository;
    private readonly IOwnerProfileRepository _ownerProfileRepository;
    private readonly ICurrentUserService _currentUserService;
    private readonly IMapper _mapper;

    public PropertyService(
        IPropertyRepository propertyRepository,
        IOwnerProfileRepository ownerProfileRepository,
        ICurrentUserService currentUserService,
        IMapper mapper)
    {
        _propertyRepository = propertyRepository;
        _ownerProfileRepository = ownerProfileRepository;
        _currentUserService = currentUserService;
        _mapper = mapper;
    }

    public async Task<PagedResult<PropertyDto>> GetPagedAsync(PaginationRequest request, bool mineOnly, CancellationToken cancellationToken)
    {
        int? ownerProfileId = null;

        if (mineOnly)
        {
            var ownerProfile = await RequireOwnerProfileAsync(cancellationToken);
            ownerProfileId = ownerProfile.Id;
        }

        var paged = await _propertyRepository.GetPagedAsync(request, ownerProfileId, cancellationToken);
        return paged.Map(_mapper.Map<PropertyDto>);
    }

    public async Task<PropertyDto> GetByIdAsync(int id, CancellationToken cancellationToken)
    {
        var property = await _propertyRepository.GetByIdAsync(id, cancellationToken, includeUnits: true)
            ?? throw new AppNotFoundException(nameof(Property), id);

        return _mapper.Map<PropertyDto>(property);
    }

    public async Task<PropertyDto> CreateAsync(CreatePropertyRequest request, CancellationToken cancellationToken)
    {
        var ownerProfile = await RequireOwnerProfileAsync(cancellationToken);

        var property = new Property
        {
            OwnerProfileId = ownerProfile.Id,
            Name = request.Name,
            Address = request.Address,
            City = request.City,
            Description = request.Description,
        };

        var created = await _propertyRepository.AddAsync(property, cancellationToken);
        return _mapper.Map<PropertyDto>(created);
    }

    public async Task<PropertyDto> UpdateAsync(int id, UpdatePropertyRequest request, CancellationToken cancellationToken)
    {
        var property = await _propertyRepository.GetByIdAsync(id, cancellationToken)
            ?? throw new AppNotFoundException(nameof(Property), id);

        EnsureCanManage(property);

        property.Name = request.Name;
        property.Address = request.Address;
        property.City = request.City;
        property.Description = request.Description;

        await _propertyRepository.UpdateAsync(property, cancellationToken);
        return _mapper.Map<PropertyDto>(property);
    }

    public async Task DeleteAsync(int id, CancellationToken cancellationToken)
    {
        var property = await _propertyRepository.GetByIdAsync(id, cancellationToken)
            ?? throw new AppNotFoundException(nameof(Property), id);

        EnsureCanManage(property);

        if (await _propertyRepository.HasNonTerminalContractsAsync(property.Id, cancellationToken))
        {
            throw new AppConflictException("This property has units with pending or active rental contracts and cannot be deleted.");
        }

        await _propertyRepository.DeleteAsync(property, cancellationToken);
    }

    /// <summary>Resolves the caller's OwnerProfile. Throws AppForbiddenException if the caller isn't an authenticated Owner with a profile — should only be reachable when [Authorize(Roles = "Owner")] has already let the request through, but this is checked again since a service should never trust its caller blindly.</summary>
    private async Task<OwnerProfile> RequireOwnerProfileAsync(CancellationToken cancellationToken)
    {
        var userId = _currentUserService.UserId
            ?? throw new AppForbiddenException("You must be logged in as an Owner to do this.");

        var ownerProfile = await _ownerProfileRepository.GetByUserIdAsync(userId, cancellationToken)
            ?? throw new AppForbiddenException("Only Owners can manage properties.");

        return ownerProfile;
    }

    /// <summary>Admins may manage any property; Owners may only manage a property whose OwnerProfile.UserId matches the caller.</summary>
    private void EnsureCanManage(Property property)
    {
        if (_currentUserService.IsInRole(Roles.Admin))
        {
            return;
        }

        if (property.Owner is not null && property.Owner.UserId == _currentUserService.UserId)
        {
            return;
        }

        throw new AppForbiddenException("You do not have permission to manage this property.");
    }
}

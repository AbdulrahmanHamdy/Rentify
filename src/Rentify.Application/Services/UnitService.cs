using AutoMapper;
using Rentify.Application.Common.Exceptions;
using Rentify.Application.Common.Pagination;
using Rentify.Application.DTOs.Units;
using Rentify.Application.Interfaces;
using Rentify.Domain.Constants;
using Rentify.Domain.Entities;
using Rentify.Domain.Enums;

namespace Rentify.Application.Services;

/// <summary>
/// Implements every Unit use case. Ownership is enforced through the parent Property (a
/// Unit has no owner of its own) — the same "Owner may only manage what they own, Admin may
/// manage anything" rule as PropertyService, duplicated deliberately rather than factored
/// into a shared base class, since the two services check ownership through different
/// navigation paths (Property.Owner directly vs. Unit.Property.Owner) and a premature
/// abstraction here would cost more clarity than it saves for two call sites.
/// </summary>
public class UnitService : IUnitService
{
    private readonly IUnitRepository _unitRepository;
    private readonly IPropertyRepository _propertyRepository;
    private readonly ICurrentUserService _currentUserService;
    private readonly IMapper _mapper;

    public UnitService(
        IUnitRepository unitRepository,
        IPropertyRepository propertyRepository,
        ICurrentUserService currentUserService,
        IMapper mapper)
    {
        _unitRepository = unitRepository;
        _propertyRepository = propertyRepository;
        _currentUserService = currentUserService;
        _mapper = mapper;
    }

    public async Task<PagedResult<UnitDto>> GetPagedByPropertyAsync(int propertyId, PaginationRequest request, CancellationToken cancellationToken)
    {
        _ = await _propertyRepository.GetByIdAsync(propertyId, cancellationToken)
            ?? throw new AppNotFoundException(nameof(Property), propertyId);

        var paged = await _unitRepository.GetPagedByPropertyAsync(propertyId, request, cancellationToken);
        return paged.Map(_mapper.Map<UnitDto>);
    }

    public async Task<UnitDto> GetByIdAsync(int id, CancellationToken cancellationToken)
    {
        var unit = await _unitRepository.GetByIdAsync(id, cancellationToken)
            ?? throw new AppNotFoundException(nameof(Unit), id);

        return _mapper.Map<UnitDto>(unit);
    }

    public async Task<UnitDto> CreateAsync(int propertyId, CreateUnitRequest request, CancellationToken cancellationToken)
    {
        var property = await _propertyRepository.GetByIdAsync(propertyId, cancellationToken)
            ?? throw new AppNotFoundException(nameof(Property), propertyId);

        EnsureCanManage(property);

        if (await _unitRepository.UnitNumberExistsAsync(propertyId, request.UnitNumber, excludeUnitId: null, cancellationToken))
        {
            throw new AppConflictException($"Unit '{request.UnitNumber}' already exists in this property.");
        }

        var unit = new Unit
        {
            PropertyId = propertyId,
            UnitNumber = request.UnitNumber,
            Floor = request.Floor,
            AreaSqm = request.AreaSqm,
            Bedrooms = request.Bedrooms,
            Bathrooms = request.Bathrooms,
            MonthlyRent = request.MonthlyRent,
            DepositAmount = request.DepositAmount,
            Status = UnitStatus.Available,
        };

        var created = await _unitRepository.AddAsync(unit, cancellationToken);
        return _mapper.Map<UnitDto>(created);
    }

    public async Task<UnitDto> UpdateAsync(int id, UpdateUnitRequest request, CancellationToken cancellationToken)
    {
        var unit = await _unitRepository.GetByIdAsync(id, cancellationToken)
            ?? throw new AppNotFoundException(nameof(Unit), id);

        EnsureCanManage(unit.Property!);

        // The validator already confirmed this parses to a real UnitStatus; here we enforce
        // the business rule of *which* values are settable through a direct PUT.
        var requestedStatus = Enum.Parse<UnitStatus>(request.Status, ignoreCase: true);
        if (requestedStatus is UnitStatus.Reserved or UnitStatus.Rented && requestedStatus != unit.Status)
        {
            throw new AppValidationException(new[]
            {
                "Status 'Reserved' and 'Rented' are set automatically by the rental contract workflow and cannot be set directly.",
            });
        }

        // Phase 6: now that the contract workflow exists, a Reserved/Rented unit's status is
        // owned by that workflow. Without this, an owner could PUT Status=Available on a
        // rented unit and break the "one active contract per unit" invariant.
        if ((unit.Status is UnitStatus.Reserved or UnitStatus.Rented) && requestedStatus != unit.Status)
        {
            throw new AppConflictException(
                $"This unit is '{unit.Status}' because of a rental contract; its status changes automatically when the contract is activated, cancelled or terminated.");
        }

        if (!string.Equals(unit.UnitNumber, request.UnitNumber, StringComparison.Ordinal)
            && await _unitRepository.UnitNumberExistsAsync(unit.PropertyId, request.UnitNumber, excludeUnitId: unit.Id, cancellationToken))
        {
            throw new AppConflictException($"Unit '{request.UnitNumber}' already exists in this property.");
        }

        unit.UnitNumber = request.UnitNumber;
        unit.Floor = request.Floor;
        unit.AreaSqm = request.AreaSqm;
        unit.Bedrooms = request.Bedrooms;
        unit.Bathrooms = request.Bathrooms;
        unit.MonthlyRent = request.MonthlyRent;
        unit.DepositAmount = request.DepositAmount;
        unit.Status = requestedStatus;

        await _unitRepository.UpdateAsync(unit, cancellationToken);
        return _mapper.Map<UnitDto>(unit);
    }

    public async Task DeleteAsync(int id, CancellationToken cancellationToken)
    {
        var unit = await _unitRepository.GetByIdAsync(id, cancellationToken)
            ?? throw new AppNotFoundException(nameof(Unit), id);

        EnsureCanManage(unit.Property!);

        if (await _unitRepository.HasNonTerminalContractAsync(unit.Id, cancellationToken))
        {
            throw new AppConflictException("This unit has a pending or active rental contract and cannot be deleted.");
        }

        await _unitRepository.DeleteAsync(unit, cancellationToken);
    }

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

        throw new AppForbiddenException("You do not have permission to manage units on this property.");
    }
}

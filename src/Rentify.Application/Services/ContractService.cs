using AutoMapper;
using Rentify.Application.Common.Exceptions;
using Rentify.Application.Common.Pagination;
using Rentify.Application.DTOs.Contracts;
using Rentify.Application.Interfaces;
using Rentify.Domain.Constants;
using Rentify.Domain.Entities;
using Rentify.Domain.Enums;

namespace Rentify.Application.Services;

/// <summary>
/// The rental-contract workflow. Two rules shape everything here:
///
/// 1. Visibility is party-based. A contract is visible only to its tenant, the owner of the
///    unit's property, or an Admin. Anyone else gets 404 (not 403), so contract ids can't be
///    probed. Acting on a contract you can see but aren't allowed to act on (e.g. a tenant
///    trying to activate) is 403.
///
/// 2. Contract status and Unit status change together. The contract's own methods
///    (Activate/Cancel/Terminate) enforce which contract transitions are legal and throw
///    DomainException otherwise; this service then moves the Unit to match. Both entities are
///    tracked by the same scoped DbContext, so a single SaveChanges commits them atomically.
///
///    Contract      Unit
///    created    →  Available → Reserved
///    Activate   →  Reserved  → Rented
///    Cancel     →  Reserved  → Available
///    Terminate  →  Rented    → Available
///
/// (Active → Expired is reserved for the Hangfire "expiring contracts" job.)
/// </summary>
public class ContractService : IContractService
{
    private readonly IContractRepository _contractRepository;
    private readonly IUnitRepository _unitRepository;
    private readonly ITenantProfileRepository _tenantProfileRepository;
    private readonly ICurrentUserService _currentUserService;
    private readonly IMapper _mapper;

    public ContractService(
        IContractRepository contractRepository,
        IUnitRepository unitRepository,
        ITenantProfileRepository tenantProfileRepository,
        ICurrentUserService currentUserService,
        IMapper mapper)
    {
        _contractRepository = contractRepository;
        _unitRepository = unitRepository;
        _tenantProfileRepository = tenantProfileRepository;
        _currentUserService = currentUserService;
        _mapper = mapper;
    }

    public async Task<PagedResult<ContractDto>> GetPagedAsync(PaginationRequest request, ContractStatus? status, CancellationToken cancellationToken)
    {
        var userId = RequireUserId();
        var partyUserId = _currentUserService.IsInRole(Roles.Admin) ? null : userId;

        var paged = await _contractRepository.GetPagedAsync(request, status, partyUserId, cancellationToken);
        return paged.Map(_mapper.Map<ContractDto>);
    }

    public async Task<ContractDto> GetByIdAsync(int id, CancellationToken cancellationToken)
    {
        var contract = await LoadVisibleAsync(id, cancellationToken);
        return _mapper.Map<ContractDto>(contract);
    }

    public async Task<ContractDto> CreateAsync(CreateContractRequest request, CancellationToken cancellationToken)
    {
        var userId = RequireUserId();

        var tenant = await _tenantProfileRepository.GetByUserIdAsync(userId, cancellationToken)
            ?? throw new AppForbiddenException("Only Tenants can create rental contracts.");

        var unit = await _unitRepository.GetByIdAsync(request.UnitId, cancellationToken)
            ?? throw new AppNotFoundException(nameof(Unit), request.UnitId);

        if (unit.Property?.Owner?.UserId == userId)
        {
            throw new AppForbiddenException("You cannot rent a unit in your own property.");
        }

        // "A rented unit cannot be rented again while it has an active contract." The status
        // check is the fast path; the contract-existence check guards against a unit whose
        // status drifted out of sync; the filtered unique index on RentalContracts is the
        // last line of defense against two simultaneous requests.
        if (unit.Status != UnitStatus.Available)
        {
            throw new AppConflictException($"This unit is not available for rent (current status: {unit.Status}).");
        }

        if (await _unitRepository.HasNonTerminalContractAsync(unit.Id, cancellationToken))
        {
            throw new AppConflictException("This unit already has a pending or active rental contract.");
        }

        var contract = new RentalContract
        {
            UnitId = unit.Id,
            Unit = unit,
            TenantProfileId = tenant.Id,
            StartDate = request.StartDate,
            EndDate = request.EndDate,
            // Snapshot: later edits to the unit's advertised rent must not change an
            // existing contract, and the tenant never supplies these values.
            MonthlyRent = unit.MonthlyRent,
            SecurityDeposit = unit.DepositAmount,
        };

        unit.Status = UnitStatus.Reserved;

        var created = await _contractRepository.AddAsync(contract, cancellationToken);
        return _mapper.Map<ContractDto>(created);
    }

    public async Task<ContractDto> ActivateAsync(int id, CancellationToken cancellationToken)
    {
        var contract = await LoadVisibleAsync(id, cancellationToken);
        EnsureOwnerOrAdmin(contract, "activate");

        if (contract.Status == ContractStatus.Pending && contract.EndDate < Today())
        {
            throw new AppValidationException(new[] { "This contract's end date has already passed and it can no longer be activated." });
        }

        contract.Activate(); // DomainException (409) unless currently Pending

        var unit = contract.Unit!;
        if (unit.Status != UnitStatus.Reserved)
        {
            throw new AppConflictException($"The unit must be 'Reserved' to activate its contract (current status: {unit.Status}).");
        }

        unit.Status = UnitStatus.Rented;

        await _contractRepository.SaveChangesAsync(cancellationToken);
        return _mapper.Map<ContractDto>(contract);
    }

    public async Task<ContractDto> TerminateAsync(int id, CancellationToken cancellationToken)
    {
        var contract = await LoadVisibleAsync(id, cancellationToken);
        EnsureOwnerOrAdmin(contract, "terminate");

        contract.Terminate(); // DomainException (409) unless currently Active
        contract.Unit!.Status = UnitStatus.Available;

        await _contractRepository.SaveChangesAsync(cancellationToken);
        return _mapper.Map<ContractDto>(contract);
    }

    public async Task<ContractDto> CancelAsync(int id, CancellationToken cancellationToken)
    {
        // Any party who can see the contract may cancel it (tenant withdrawing, owner
        // rejecting, or Admin) — LoadVisibleAsync already limits who that is.
        var contract = await LoadVisibleAsync(id, cancellationToken);

        contract.Cancel(); // DomainException (409) unless currently Pending

        if (contract.Unit!.Status == UnitStatus.Reserved)
        {
            contract.Unit.Status = UnitStatus.Available;
        }

        await _contractRepository.SaveChangesAsync(cancellationToken);
        return _mapper.Map<ContractDto>(contract);
    }

    private async Task<RentalContract> LoadVisibleAsync(int id, CancellationToken cancellationToken)
    {
        var userId = RequireUserId();

        var contract = await _contractRepository.GetByIdAsync(id, cancellationToken)
            ?? throw new AppNotFoundException(nameof(RentalContract), id);

        var isParty = contract.Tenant?.UserId == userId
            || contract.Unit?.Property?.Owner?.UserId == userId;

        if (!isParty && !_currentUserService.IsInRole(Roles.Admin))
        {
            throw new AppNotFoundException(nameof(RentalContract), id);
        }

        return contract;
    }

    private void EnsureOwnerOrAdmin(RentalContract contract, string action)
    {
        if (_currentUserService.IsInRole(Roles.Admin))
        {
            return;
        }

        if (contract.Unit?.Property?.Owner?.UserId == _currentUserService.UserId)
        {
            return;
        }

        throw new AppForbiddenException($"Only the property owner or an administrator can {action} this contract.");
    }

    private string RequireUserId() =>
        _currentUserService.UserId ?? throw new AppUnauthorizedException("Authentication is required.");

    private static DateOnly Today() => DateOnly.FromDateTime(DateTime.UtcNow);
}

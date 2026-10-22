using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Rentify.Application.Common.Exceptions;
using Rentify.Application.Common.Pagination;
using Rentify.Application.DTOs.Maintenance;
using Rentify.Application.Interfaces;
using Rentify.Domain.Constants;
using Rentify.Domain.Entities;
using Rentify.Domain.Enums;
using Rentify.Infrastructure.Identity;
using Rentify.Infrastructure.Persistence;

namespace Rentify.Infrastructure.Services;

public class MaintenanceService : IMaintenanceService
{
    private readonly RentifyDbContext _dbContext;
    private readonly ICurrentUserService _currentUserService;
    private readonly UserManager<ApplicationUser> _userManager;

    public MaintenanceService(
        RentifyDbContext dbContext,
        ICurrentUserService currentUserService,
        UserManager<ApplicationUser> userManager)
    {
        _dbContext = dbContext;
        _currentUserService = currentUserService;
        _userManager = userManager;
    }

    public async Task<PagedResult<MaintenanceRequestDto>> GetPagedAsync(
        PaginationRequest request,
        MaintenanceStatus? status = null,
        CancellationToken cancellationToken = default)
    {
        var userId = _currentUserService.UserId
            ?? throw new AppUnauthorizedException("User is not authenticated.");

        var query = _dbContext.MaintenanceRequests
            .AsNoTracking()
            .Include(m => m.Unit)
                .ThenInclude(u => u!.Property)
                    .ThenInclude(p => p!.Owner)
            .Include(m => m.Tenant)
            .Include(m => m.Updates)
            .AsQueryable();

        if (!_currentUserService.IsInRole(Roles.Admin))
        {
            if (_currentUserService.IsInRole(Roles.Tenant))
            {
                var tenant = await _dbContext.TenantProfiles
                    .AsNoTracking()
                    .FirstOrDefaultAsync(t => t.UserId == userId, cancellationToken)
                    ?? throw new AppNotFoundException("Tenant profile not found.");

                query = query.Where(m => m.TenantProfileId == tenant.Id);
            }
            else if (_currentUserService.IsInRole(Roles.Owner))
            {
                var owner = await _dbContext.OwnerProfiles
                    .AsNoTracking()
                    .FirstOrDefaultAsync(o => o.UserId == userId, cancellationToken)
                    ?? throw new AppNotFoundException("Owner profile not found.");

                query = query.Where(m => m.Unit!.Property!.OwnerProfileId == owner.Id);
            }
            else
            {
                throw new AppForbiddenException("User does not have permission to view maintenance requests.");
            }
        }

        if (status.HasValue)
        {
            query = query.Where(m => m.Status == status.Value);
        }

        if (!string.IsNullOrWhiteSpace(request.Search))
        {
            var term = request.Search.Trim();
            query = query.Where(m =>
                EF.Functions.Like(m.Title, $"%{term}%") ||
                EF.Functions.Like(m.Description, $"%{term}%") ||
                (m.Unit != null && m.Unit.Property != null && EF.Functions.Like(m.Unit.Property.Name, $"%{term}%")));
        }

        var totalCount = await query.CountAsync(cancellationToken);

        var items = await query
            .OrderByDescending(m => m.CreatedAt)
            .Skip((request.Page - 1) * request.PageSize)
            .Take(request.PageSize)
            .ToListAsync(cancellationToken);

        var dtos = new List<MaintenanceRequestDto>();
        foreach (var m in items)
        {
            dtos.Add(await MapToDtoAsync(m, cancellationToken));
        }

        return new PagedResult<MaintenanceRequestDto>(dtos, totalCount, request.Page, request.PageSize);
    }

    public async Task<MaintenanceRequestDto> GetByIdAsync(int id, CancellationToken cancellationToken = default)
    {
        var userId = _currentUserService.UserId
            ?? throw new AppUnauthorizedException("User is not authenticated.");

        var request = await _dbContext.MaintenanceRequests
            .Include(m => m.Unit)
                .ThenInclude(u => u!.Property)
                    .ThenInclude(p => p!.Owner)
            .Include(m => m.Tenant)
            .Include(m => m.Updates)
            .FirstOrDefaultAsync(m => m.Id == id, cancellationToken)
            ?? throw new AppNotFoundException($"Maintenance request with ID {id} not found.");

        EnsureCanView(request, userId);

        return await MapToDtoAsync(request, cancellationToken);
    }

    public async Task<MaintenanceRequestDto> CreateAsync(
        CreateMaintenanceRequest request,
        CancellationToken cancellationToken = default)
    {
        var userId = _currentUserService.UserId
            ?? throw new AppUnauthorizedException("User is not authenticated.");

        var tenant = await _dbContext.TenantProfiles
            .FirstOrDefaultAsync(t => t.UserId == userId, cancellationToken)
            ?? throw new AppForbiddenException("Only tenants can create maintenance requests.");

        var unit = await _dbContext.Units
            .Include(u => u.Property)
            .FirstOrDefaultAsync(u => u.Id == request.UnitId, cancellationToken)
            ?? throw new AppNotFoundException($"Unit with ID {request.UnitId} not found.");

        var hasContract = await _dbContext.RentalContracts
            .AnyAsync(c => c.UnitId == request.UnitId &&
                           c.TenantProfileId == tenant.Id &&
                           (c.Status == ContractStatus.Active || c.Status == ContractStatus.Pending),
                      cancellationToken);

        if (!hasContract && !_currentUserService.IsInRole(Roles.Admin))
        {
            throw new AppForbiddenException("You can only file maintenance requests for units you lease.");
        }

        var entity = new MaintenanceRequest
        {
            UnitId = request.UnitId,
            TenantProfileId = tenant.Id,
            Title = request.Title.Trim(),
            Description = request.Description.Trim(),
            Priority = request.Priority
        };

        _dbContext.MaintenanceRequests.Add(entity);
        await _dbContext.SaveChangesAsync(cancellationToken);

        return await GetByIdAsync(entity.Id, cancellationToken);
    }

    public async Task<MaintenanceRequestDto> UpdateStatusAsync(
        int id,
        UpdateMaintenanceStatusRequest request,
        CancellationToken cancellationToken = default)
    {
        var userId = _currentUserService.UserId
            ?? throw new AppUnauthorizedException("User is not authenticated.");

        var entity = await _dbContext.MaintenanceRequests
            .Include(m => m.Unit)
                .ThenInclude(u => u!.Property)
            .Include(m => m.Tenant)
            .Include(m => m.Updates)
            .FirstOrDefaultAsync(m => m.Id == id, cancellationToken)
            ?? throw new AppNotFoundException($"Maintenance request with ID {id} not found.");

        var isOwner = entity.Unit?.Property != null &&
            await _dbContext.OwnerProfiles.AnyAsync(o => o.UserId == userId && o.Id == entity.Unit.Property.OwnerProfileId, cancellationToken);

        var isTenant = entity.Tenant != null && entity.Tenant.UserId == userId;
        var isAdmin = _currentUserService.IsInRole(Roles.Admin);

        if (!isOwner && !isTenant && !isAdmin)
        {
            throw new AppForbiddenException("You do not have permission to update this maintenance request.");
        }

        if (isTenant && !isOwner && !isAdmin && request.Status != MaintenanceStatus.Cancelled)
        {
            throw new AppForbiddenException("Tenants may only cancel their own maintenance requests.");
        }

        entity.ChangeStatus(request.Status, userId, request.Note?.Trim());
        await _dbContext.SaveChangesAsync(cancellationToken);

        return await GetByIdAsync(id, cancellationToken);
    }

    private void EnsureCanView(MaintenanceRequest entity, string userId)
    {
        if (_currentUserService.IsInRole(Roles.Admin)) return;

        if (entity.Tenant != null && entity.Tenant.UserId == userId) return;

        if (entity.Unit?.Property?.Owner != null && entity.Unit.Property.Owner.UserId == userId) return;

        throw new AppForbiddenException("You do not have permission to view this maintenance request.");
    }

    private async Task<MaintenanceRequestDto> MapToDtoAsync(MaintenanceRequest m, CancellationToken cancellationToken)
    {
        string tenantName = "Tenant";
        if (m.Tenant != null)
        {
            var user = await _userManager.FindByIdAsync(m.Tenant.UserId);
            if (user != null)
            {
                var full = $"{user.FirstName} {user.LastName}".Trim();
                tenantName = string.IsNullOrWhiteSpace(full) ? user.Email ?? "Tenant" : full;
            }
        }

        var updateDtos = m.Updates
            .OrderByDescending(u => u.CreatedAt)
            .Select(u => new MaintenanceUpdateDto(
                Id: u.Id,
                OldStatus: u.OldStatus,
                NewStatus: u.NewStatus,
                UpdatedByUserId: u.UpdatedByUserId,
                Note: u.Note,
                CreatedAt: u.CreatedAt
            ))
            .ToList();

        return new MaintenanceRequestDto(
            Id: m.Id,
            UnitId: m.UnitId,
            UnitNumber: m.Unit?.UnitNumber ?? string.Empty,
            PropertyId: m.Unit?.PropertyId ?? 0,
            PropertyName: m.Unit?.Property?.Name ?? "Property",
            TenantProfileId: m.TenantProfileId,
            TenantName: tenantName,
            Title: m.Title,
            Description: m.Description,
            Priority: m.Priority,
            Status: m.Status,
            CreatedAt: m.CreatedAt,
            Updates: updateDtos
        );
    }
}

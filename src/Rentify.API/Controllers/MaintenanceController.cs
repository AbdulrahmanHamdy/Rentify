using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Rentify.Application.Common.Pagination;
using Rentify.Application.DTOs.Maintenance;
using Rentify.Application.Interfaces;
using Rentify.Domain.Enums;

namespace Rentify.API.Controllers;

[ApiController]
[Route("api/maintenance")]
[Authorize]
public class MaintenanceController : ControllerBase
{
    private readonly IMaintenanceService _maintenanceService;

    public MaintenanceController(IMaintenanceService maintenanceService)
    {
        _maintenanceService = maintenanceService;
    }

    [HttpGet]
    public async Task<ActionResult<PagedResult<MaintenanceRequestDto>>> GetPaged(
        [FromQuery] PaginationRequest request,
        [FromQuery] MaintenanceStatus? status,
        CancellationToken cancellationToken)
    {
        var result = await _maintenanceService.GetPagedAsync(request, status, cancellationToken);
        return Ok(result);
    }

    [HttpGet("{id:int}")]
    public async Task<ActionResult<MaintenanceRequestDto>> GetById(
        int id,
        CancellationToken cancellationToken)
    {
        var result = await _maintenanceService.GetByIdAsync(id, cancellationToken);
        return Ok(result);
    }

    [HttpPost]
    public async Task<ActionResult<MaintenanceRequestDto>> Create(
        [FromBody] CreateMaintenanceRequest request,
        CancellationToken cancellationToken)
    {
        var result = await _maintenanceService.CreateAsync(request, cancellationToken);
        return CreatedAtAction(nameof(GetById), new { id = result.Id }, result);
    }

    [HttpPut("{id:int}/status")]
    public async Task<ActionResult<MaintenanceRequestDto>> UpdateStatus(
        int id,
        [FromBody] UpdateMaintenanceStatusRequest request,
        CancellationToken cancellationToken)
    {
        var result = await _maintenanceService.UpdateStatusAsync(id, request, cancellationToken);
        return Ok(result);
    }
}

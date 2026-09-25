using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Rentify.Application.Common.Pagination;
using Rentify.Application.DTOs.Properties;
using Rentify.Application.DTOs.Units;
using Rentify.Application.Interfaces;
using Rentify.Domain.Constants;

namespace Rentify.API.Controllers;

/// <summary>
/// Thin controller — all business logic and ownership enforcement lives in
/// IPropertyService. Exceptions thrown by the service (AppNotFoundException,
/// AppForbiddenException, ...) are not caught here; they flow to GlobalExceptionHandler,
/// which maps them to the appropriate status code with a consistent response shape.
/// </summary>
[ApiController]
[Route("api/properties")]
public class PropertiesController : ControllerBase
{
    private readonly IPropertyService _propertyService;
    private readonly IUnitService _unitService;

    public PropertiesController(IPropertyService propertyService, IUnitService unitService)
    {
        _propertyService = propertyService;
        _unitService = unitService;
    }

    /// <summary>
    /// Public catalog by default (no [Authorize] — matches the spec's "Tenant can view
    /// available properties", which really means anyone can browse). Pass `mine=true` as an
    /// authenticated Owner to list only your own properties instead.
    /// </summary>
    [HttpGet]
    [AllowAnonymous]
    public async Task<ActionResult<PagedResult<PropertyDto>>> GetAll(
        [FromQuery] PaginationRequest request, [FromQuery] bool mine, CancellationToken cancellationToken)
    {
        var result = await _propertyService.GetPagedAsync(request, mine, cancellationToken);
        return Ok(result);
    }

    [HttpGet("{id:int}")]
    [AllowAnonymous]
    public async Task<ActionResult<PropertyDto>> GetById(int id, CancellationToken cancellationToken)
    {
        var property = await _propertyService.GetByIdAsync(id, cancellationToken);
        return Ok(property);
    }

    [HttpPost]
    [Authorize(Roles = Roles.Owner)]
    public async Task<ActionResult<PropertyDto>> Create([FromBody] CreatePropertyRequest request, CancellationToken cancellationToken)
    {
        var created = await _propertyService.CreateAsync(request, cancellationToken);
        return CreatedAtAction(nameof(GetById), new { id = created.Id }, created);
    }

    [HttpPut("{id:int}")]
    [Authorize(Roles = $"{Roles.Owner},{Roles.Admin}")]
    public async Task<ActionResult<PropertyDto>> Update(int id, [FromBody] UpdatePropertyRequest request, CancellationToken cancellationToken)
    {
        var updated = await _propertyService.UpdateAsync(id, request, cancellationToken);
        return Ok(updated);
    }

    [HttpDelete("{id:int}")]
    [Authorize(Roles = $"{Roles.Owner},{Roles.Admin}")]
    public async Task<IActionResult> Delete(int id, CancellationToken cancellationToken)
    {
        await _propertyService.DeleteAsync(id, cancellationToken);
        return NoContent();
    }

    /// <summary>Nested under Properties per the spec's endpoint list (GET/POST /api/properties/{propertyId}/units); PUT/DELETE for a single unit live on UnitsController at /api/units/{id}.</summary>
    [HttpGet("{propertyId:int}/units")]
    [AllowAnonymous]
    public async Task<ActionResult<PagedResult<UnitDto>>> GetUnits(
        int propertyId, [FromQuery] PaginationRequest request, CancellationToken cancellationToken)
    {
        var result = await _unitService.GetPagedByPropertyAsync(propertyId, request, cancellationToken);
        return Ok(result);
    }

    [HttpPost("{propertyId:int}/units")]
    [Authorize(Roles = $"{Roles.Owner},{Roles.Admin}")]
    public async Task<ActionResult<UnitDto>> CreateUnit(
        int propertyId, [FromBody] CreateUnitRequest request, CancellationToken cancellationToken)
    {
        var created = await _unitService.CreateAsync(propertyId, request, cancellationToken);
        return CreatedAtAction(nameof(UnitsController.GetById), "Units", new { id = created.Id }, created);
    }
}

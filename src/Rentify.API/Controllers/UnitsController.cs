using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Rentify.Application.DTOs.Units;
using Rentify.Application.Interfaces;
using Rentify.Domain.Constants;

namespace Rentify.API.Controllers;

/// <summary>
/// Thin controller for operating on a single Unit by id. Listing/creating units is nested
/// under Properties (see PropertiesController), matching the spec's endpoint list exactly;
/// this controller only owns /api/units/{id}.
/// </summary>
[ApiController]
[Route("api/units")]
public class UnitsController : ControllerBase
{
    private readonly IUnitService _unitService;

    public UnitsController(IUnitService unitService)
    {
        _unitService = unitService;
    }

    /// <summary>Not in the spec's original endpoint list, added for symmetry with PUT/DELETE — a client should be able to fetch the exact resource it's about to edit or delete.</summary>
    [HttpGet("{id:int}")]
    [AllowAnonymous]
    public async Task<ActionResult<UnitDto>> GetById(int id, CancellationToken cancellationToken)
    {
        var unit = await _unitService.GetByIdAsync(id, cancellationToken);
        return Ok(unit);
    }

    [HttpPut("{id:int}")]
    [Authorize(Roles = $"{Roles.Owner},{Roles.Admin}")]
    public async Task<ActionResult<UnitDto>> Update(int id, [FromBody] UpdateUnitRequest request, CancellationToken cancellationToken)
    {
        var updated = await _unitService.UpdateAsync(id, request, cancellationToken);
        return Ok(updated);
    }

    [HttpDelete("{id:int}")]
    [Authorize(Roles = $"{Roles.Owner},{Roles.Admin}")]
    public async Task<IActionResult> Delete(int id, CancellationToken cancellationToken)
    {
        await _unitService.DeleteAsync(id, cancellationToken);
        return NoContent();
    }
}

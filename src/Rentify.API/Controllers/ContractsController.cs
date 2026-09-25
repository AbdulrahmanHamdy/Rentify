using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Rentify.Application.Common.Pagination;
using Rentify.Application.DTOs.Contracts;
using Rentify.Application.Interfaces;
using Rentify.Domain.Constants;
using Rentify.Domain.Enums;

namespace Rentify.API.Controllers;

/// <summary>
/// Thin controller. [Authorize(Roles = ...)] only answers "what kind of user is this";
/// which contracts the caller may see or act on is decided inside IContractService.
/// </summary>
[ApiController]
[Route("api/contracts")]
[Authorize]
public class ContractsController : ControllerBase
{
    private const string AnyRole = $"{Roles.Tenant},{Roles.Owner},{Roles.Admin}";
    private const string OwnerOrAdmin = $"{Roles.Owner},{Roles.Admin}";

    private readonly IContractService _contractService;

    public ContractsController(IContractService contractService)
    {
        _contractService = contractService;
    }

    /// <summary>Contracts visible to the caller (tenant: own; owner: on own properties; admin: all). Optional `status` filter.</summary>
    [HttpGet]
    [Authorize(Roles = AnyRole)]
    public async Task<ActionResult<PagedResult<ContractDto>>> GetAll(
        [FromQuery] PaginationRequest request, [FromQuery] ContractStatus? status, CancellationToken cancellationToken)
    {
        var result = await _contractService.GetPagedAsync(request, status, cancellationToken);
        return Ok(result);
    }

    [HttpGet("{id:int}")]
    [Authorize(Roles = AnyRole)]
    public async Task<ActionResult<ContractDto>> GetById(int id, CancellationToken cancellationToken)
    {
        var contract = await _contractService.GetByIdAsync(id, cancellationToken);
        return Ok(contract);
    }

    /// <summary>A tenant requests to rent a unit. Creates a Pending contract and reserves the unit.</summary>
    [HttpPost]
    [Authorize(Roles = Roles.Tenant)]
    public async Task<ActionResult<ContractDto>> Create([FromBody] CreateContractRequest request, CancellationToken cancellationToken)
    {
        var created = await _contractService.CreateAsync(request, cancellationToken);
        return CreatedAtAction(nameof(GetById), new { id = created.Id }, created);
    }

    /// <summary>Owner approval: Pending → Active, unit becomes Rented.</summary>
    [HttpPost("{id:int}/activate")]
    [Authorize(Roles = OwnerOrAdmin)]
    public async Task<ActionResult<ContractDto>> Activate(int id, CancellationToken cancellationToken)
    {
        var contract = await _contractService.ActivateAsync(id, cancellationToken);
        return Ok(contract);
    }

    /// <summary>Active → Terminated, unit becomes Available again.</summary>
    [HttpPost("{id:int}/terminate")]
    [Authorize(Roles = OwnerOrAdmin)]
    public async Task<ActionResult<ContractDto>> Terminate(int id, CancellationToken cancellationToken)
    {
        var contract = await _contractService.TerminateAsync(id, cancellationToken);
        return Ok(contract);
    }

    /// <summary>Not in the spec's endpoint list, but Pending → Cancelled is a required transition and otherwise unreachable. Tenant withdraws / owner rejects.</summary>
    [HttpPost("{id:int}/cancel")]
    [Authorize(Roles = AnyRole)]
    public async Task<ActionResult<ContractDto>> Cancel(int id, CancellationToken cancellationToken)
    {
        var contract = await _contractService.CancelAsync(id, cancellationToken);
        return Ok(contract);
    }
}

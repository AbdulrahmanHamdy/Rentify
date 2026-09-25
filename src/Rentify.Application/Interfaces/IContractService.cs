using Rentify.Application.Common.Pagination;
using Rentify.Application.DTOs.Contracts;
using Rentify.Domain.Enums;

namespace Rentify.Application.Interfaces;

public interface IContractService
{
    /// <summary>Tenant: own contracts. Owner: contracts on own properties. Admin: all.</summary>
    Task<PagedResult<ContractDto>> GetPagedAsync(PaginationRequest request, ContractStatus? status, CancellationToken cancellationToken);

    /// <summary>Not-found (404) for anyone who isn't a party to the contract, so ids can't be probed.</summary>
    Task<ContractDto> GetByIdAsync(int id, CancellationToken cancellationToken);

    /// <summary>Tenant only. Creates a Pending contract and moves the unit Available → Reserved.</summary>
    Task<ContractDto> CreateAsync(CreateContractRequest request, CancellationToken cancellationToken);

    /// <summary>Owner-of-record or Admin. Pending → Active; unit Reserved → Rented.</summary>
    Task<ContractDto> ActivateAsync(int id, CancellationToken cancellationToken);

    /// <summary>Owner-of-record or Admin. Active → Terminated; unit → Available.</summary>
    Task<ContractDto> TerminateAsync(int id, CancellationToken cancellationToken);

    /// <summary>Either party (tenant withdraws / owner rejects) or Admin. Pending → Cancelled; unit Reserved → Available.</summary>
    Task<ContractDto> CancelAsync(int id, CancellationToken cancellationToken);
}

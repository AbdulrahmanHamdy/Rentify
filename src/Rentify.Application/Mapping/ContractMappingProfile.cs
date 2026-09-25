using AutoMapper;
using Rentify.Application.DTOs.Contracts;
using Rentify.Domain.Entities;

namespace Rentify.Application.Mapping;

public class ContractMappingProfile : Profile
{
    public ContractMappingProfile()
    {
        CreateMap<RentalContract, ContractDto>()
            .ForCtorParam(nameof(ContractDto.UnitNumber), opt => opt.MapFrom(src => src.Unit!.UnitNumber))
            .ForCtorParam(nameof(ContractDto.PropertyId), opt => opt.MapFrom(src => src.Unit!.PropertyId))
            .ForCtorParam(nameof(ContractDto.PropertyName), opt => opt.MapFrom(src => src.Unit!.Property!.Name))
            .ForCtorParam(nameof(ContractDto.Status), opt => opt.MapFrom(src => src.Status.ToString()));

        // CreateContractRequest -> RentalContract is intentionally NOT mapped: rent, deposit,
        // tenant and status all come from server-side logic (ContractService), never the body.
    }
}

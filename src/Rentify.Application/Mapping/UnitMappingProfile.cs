using AutoMapper;
using Rentify.Application.DTOs.Units;
using Rentify.Domain.Entities;

namespace Rentify.Application.Mapping;

public class UnitMappingProfile : Profile
{
    public UnitMappingProfile()
    {
        CreateMap<Unit, UnitDto>()
            .ForCtorParam(nameof(UnitDto.Status), opt => opt.MapFrom(src => src.Status.ToString()));

        // CreateUnitRequest/UpdateUnitRequest -> Unit is intentionally NOT mapped here, for
        // the same reason as Property: PropertyId/Id/Status transitions are business rules
        // (see UnitService), not a blind field copy.
    }
}

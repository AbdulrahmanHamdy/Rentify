using AutoMapper;
using Rentify.Application.DTOs.Properties;
using Rentify.Domain.Entities;

namespace Rentify.Application.Mapping;

public class PropertyMappingProfile : Profile
{
    public PropertyMappingProfile()
    {
        CreateMap<Property, PropertyDto>()
            .ForCtorParam(nameof(PropertyDto.UnitCount), opt => opt.MapFrom(src => src.Units.Count));

        // CreatePropertyRequest/UpdatePropertyRequest -> Property is deliberately NOT
        // mapped here. OwnerProfileId, Id, and audit fields must never be settable from a
        // request DTO, so PropertyService assigns Property's fields explicitly instead of
        // risking a mapping profile silently overwriting something it shouldn't.
    }
}

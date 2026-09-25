using AutoMapper;
using Rentify.Application.DTOs.Payments;
using Rentify.Domain.Entities;

namespace Rentify.Application.Mapping;

public class PaymentMappingProfile : Profile
{
    public PaymentMappingProfile()
    {
        CreateMap<Payment, PaymentDto>()
            .ForMember(d => d.Status, opt => opt.MapFrom(s => s.Status.ToString()))
            .ForMember(d => d.Method, opt => opt.MapFrom(s => s.Method != null ? s.Method.ToString() : null));
    }
}

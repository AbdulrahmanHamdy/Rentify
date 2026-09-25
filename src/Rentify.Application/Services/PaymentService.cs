using AutoMapper;
using Rentify.Application.Common.Exceptions;
using Rentify.Application.Common.Pagination;
using Rentify.Application.DTOs.Payments;
using Rentify.Application.Interfaces;
using Rentify.Domain.Constants;
using Rentify.Domain.Entities;
using Rentify.Domain.Enums;

namespace Rentify.Application.Services;

public class PaymentService : IPaymentService
{
    private readonly IPaymentRepository _paymentRepository;
    private readonly IContractRepository _contractRepository;
    private readonly ITenantProfileRepository _tenantProfileRepository;
    private readonly IOwnerProfileRepository _ownerProfileRepository;
    private readonly IPaymentProcessor _paymentProcessor;
    private readonly ICurrentUserService _currentUserService;
    private readonly IMapper _mapper;

    public PaymentService(
        IPaymentRepository paymentRepository,
        IContractRepository contractRepository,
        ITenantProfileRepository tenantProfileRepository,
        IOwnerProfileRepository ownerProfileRepository,
        IPaymentProcessor paymentProcessor,
        ICurrentUserService currentUserService,
        IMapper mapper)
    {
        _paymentRepository = paymentRepository;
        _contractRepository = contractRepository;
        _tenantProfileRepository = tenantProfileRepository;
        _ownerProfileRepository = ownerProfileRepository;
        _paymentProcessor = paymentProcessor;
        _currentUserService = currentUserService;
        _mapper = mapper;
    }

    public async Task<PagedResult<PaymentDto>> GetPagedAsync(PaginationRequest request, PaymentStatus? status, CancellationToken cancellationToken)
    {
        int? tenantId = null;
        int? ownerId = null;

        if (_currentUserService.IsInRole(Roles.Tenant))
        {
            var tenant = await _tenantProfileRepository.GetByUserIdAsync(_currentUserService.UserId!, cancellationToken);
            if (tenant == null) throw new AppForbiddenException("Tenant profile not found.");
            tenantId = tenant.Id;
        }
        else if (_currentUserService.IsInRole(Roles.Owner))
        {
            var owner = await _ownerProfileRepository.GetByUserIdAsync(_currentUserService.UserId!, cancellationToken);
            if (owner == null) throw new AppForbiddenException("Owner profile not found.");
            ownerId = owner.Id;
        }
        // Admin sees all

        var result = await _paymentRepository.GetPagedAsync(request, tenantId, ownerId, status, cancellationToken);
        return result.Map(p => _mapper.Map<PaymentDto>(p));
    }

    public async Task<PaymentDto> GetByIdAsync(int id, CancellationToken cancellationToken)
    {
        var payment = await _paymentRepository.GetByIdAsync(id, cancellationToken);
        if (payment == null) throw new AppNotFoundException($"Payment {id} not found.");

        EnsureCanAccessPayment(payment);

        return _mapper.Map<PaymentDto>(payment);
    }

    public async Task<PaymentDto> MarkAsPaidAsync(int id, MarkPaymentPaidRequest request, CancellationToken cancellationToken)
    {
        var payment = await _paymentRepository.GetByIdAsync(id, cancellationToken);
        if (payment == null) throw new AppNotFoundException($"Payment {id} not found.");

        // Only Admin or the Property Owner can mark a payment as paid manually.
        if (_currentUserService.IsInRole(Roles.Tenant))
        {
            throw new AppForbiddenException("Tenants cannot manually mark payments as paid.");
        }
        EnsureCanAccessPayment(payment);

        var method = Enum.Parse<PaymentMethod>(request.Method, ignoreCase: true);

        var (success, processedAtUtc) = await _paymentProcessor.ProcessManualPaymentAsync(payment, method, request.ReferenceNumber, cancellationToken);
        
        if (!success)
        {
            throw new AppConflictException("Payment processing failed.");
        }

        payment.MarkAsPaid(method, request.ReferenceNumber, processedAtUtc);
        
        await _paymentRepository.UpdateAsync(payment, cancellationToken);
        await _contractRepository.SaveChangesAsync(cancellationToken);

        return _mapper.Map<PaymentDto>(payment);
    }

    private void EnsureCanAccessPayment(Payment payment)
    {
        if (_currentUserService.IsInRole(Roles.Admin)) return;

        if (_currentUserService.IsInRole(Roles.Tenant))
        {
            if (payment.TenantProfileId.ToString() != _currentUserService.UserId)
            {
                var tenantProfile = _tenantProfileRepository.GetByUserIdAsync(_currentUserService.UserId!, CancellationToken.None).GetAwaiter().GetResult();
                if (tenantProfile == null || payment.TenantProfileId != tenantProfile.Id)
                {
                    throw new AppNotFoundException($"Payment {payment.Id} not found.");
                }
            }
        }
        else if (_currentUserService.IsInRole(Roles.Owner))
        {
            var ownerProfile = _ownerProfileRepository.GetByUserIdAsync(_currentUserService.UserId!, CancellationToken.None).GetAwaiter().GetResult();
            if (ownerProfile == null || payment.RentalContract?.Unit?.Property?.OwnerProfileId != ownerProfile.Id)
            {
                throw new AppNotFoundException($"Payment {payment.Id} not found.");
            }
        }
    }
}

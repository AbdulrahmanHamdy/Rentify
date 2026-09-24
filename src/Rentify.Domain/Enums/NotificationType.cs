namespace Rentify.Domain.Enums;

public enum NotificationType
{
    NewRentalContract = 1,
    ContractApproved = 2,
    PaymentDue = 3,
    PaymentOverdue = 4,
    MaintenanceRequestCreated = 5,
    MaintenanceRequestUpdated = 6,
    ContractExpiringSoon = 7
}

namespace Rentify.Application.Interfaces;

/// <summary>
/// Abstraction over sending transactional email (confirmation, password reset). Kept
/// behind an interface — same pattern as payment processing — so a real provider
/// (SendGrid, SES, SMTP) can be dropped in later without touching AuthService. Phase 4
/// registers a development-only implementation that logs instead of sending.
/// </summary>
public interface IEmailSender
{
    Task SendEmailAsync(string to, string subject, string htmlBody, CancellationToken cancellationToken = default);
}

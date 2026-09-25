using Microsoft.Extensions.Logging;
using Rentify.Application.Interfaces;

namespace Rentify.Infrastructure.Services;

/// <summary>
/// Development-only IEmailSender: logs the message instead of sending real email, so
/// registration/email-confirmation/password-reset flows are testable without an SMTP
/// account. Replace with a real provider (SendGrid, SES, SMTP client) behind this same
/// interface before production — and stop logging the full body at that point, since it
/// currently contains the confirmation/reset token, which is sensitive.
/// </summary>
public class LoggingEmailSender : IEmailSender
{
    private readonly ILogger<LoggingEmailSender> _logger;

    public LoggingEmailSender(ILogger<LoggingEmailSender> logger)
    {
        _logger = logger;
    }

    public Task SendEmailAsync(string to, string subject, string htmlBody, CancellationToken cancellationToken = default)
    {
        _logger.LogInformation(
            "[DEV EMAIL — not actually sent] To: {To} | Subject: {Subject} | Body: {Body}",
            to, subject, htmlBody);
        return Task.CompletedTask;
    }
}

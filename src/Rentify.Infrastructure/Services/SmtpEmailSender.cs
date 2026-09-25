using System.Net;
using System.Net.Mail;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using Rentify.Application.Interfaces;

namespace Rentify.Infrastructure.Services;

/// <summary>
/// Real SMTP implementation of IEmailSender (STARTTLS, e.g. Gmail on port 587 with an app
/// password). Registered instead of LoggingEmailSender only when EmailSettings is configured.
///
/// Deliberately never logs the message body (it contains confirmation/reset tokens) or the
/// recipient address — only the subject.
///
/// Failures are logged and swallowed rather than thrown: ForgotPasswordAsync silently returns for
/// unknown emails to avoid revealing which addresses are registered, and a thrown SMTP error for
/// known addresses would leak exactly that difference (500 vs 200).
///
/// Uses System.Net.Mail.SmtpClient to avoid a new dependency; MailKit is the better choice for a
/// production provider and can replace this class behind the same interface.
/// </summary>
public class SmtpEmailSender : IEmailSender
{
    private readonly EmailOptions _options;
    private readonly ILogger<SmtpEmailSender> _logger;

    public SmtpEmailSender(IOptions<EmailOptions> options, ILogger<SmtpEmailSender> logger)
    {
        _options = options.Value;
        _logger = logger;
    }

    public async Task SendEmailAsync(string to, string subject, string htmlBody, CancellationToken cancellationToken = default)
    {
        try
        {
            using var message = new MailMessage
            {
                From = new MailAddress(_options.SenderEmail, _options.SenderName),
                Subject = subject,
                Body = htmlBody,
                IsBodyHtml = true,
            };
            message.To.Add(to);

            using var client = new SmtpClient(_options.SmtpHost, _options.SmtpPort)
            {
                EnableSsl = true,
                Credentials = new NetworkCredential(_options.SenderEmail, _options.SenderPassword),
            };

            await client.SendMailAsync(message).WaitAsync(cancellationToken);

            _logger.LogInformation("Email sent. Subject: {Subject}", subject);
        }
        catch (Exception ex) when (ex is not OperationCanceledException)
        {
            _logger.LogError(ex, "Failed to send email. Subject: {Subject}", subject);
        }
    }
}

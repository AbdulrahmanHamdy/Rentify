namespace Rentify.Infrastructure.Services;

/// <summary>
/// Binding of the "EmailSettings" configuration section. SenderPassword must never live in
/// appsettings.json — set it in appsettings.Development.json (gitignored), user-secrets, or the
/// environment variable EmailSettings__SenderPassword.
/// </summary>
public class EmailOptions
{
    public const string SectionName = "EmailSettings";

    public string SmtpHost { get; set; } = string.Empty;

    public int SmtpPort { get; set; } = 587;

    public string SenderName { get; set; } = "Rentify";

    public string SenderEmail { get; set; } = string.Empty;

    public string SenderPassword { get; set; } = string.Empty;

    /// <summary>True only when there's enough configuration to actually send; otherwise DI keeps the logging sender.</summary>
    public bool IsConfigured =>
        !string.IsNullOrWhiteSpace(SmtpHost)
        && !string.IsNullOrWhiteSpace(SenderEmail)
        && !string.IsNullOrWhiteSpace(SenderPassword);
}

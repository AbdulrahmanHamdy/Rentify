namespace Rentify.Infrastructure.Payments;

/// <summary>
/// Binding of the "Paymob" configuration section. Configuration only for now — the Paymob
/// integration itself arrives with the Payments phase, behind a payment-processor interface
/// (the spec says not to couple the app to a provider). ApiKey and HmacSecret are secrets:
/// never in appsettings.json; use appsettings.Development.json (gitignored), user-secrets, or
/// environment variables (Paymob__ApiKey, Paymob__HmacSecret).
/// </summary>
public class PaymobOptions
{
    public const string SectionName = "Paymob";

    public string BaseUrl { get; set; } = "https://accept.paymob.com";

    public string ApiKey { get; set; } = string.Empty;

    public string PublicKey { get; set; } = string.Empty;

    /// <summary>Used to verify the HMAC signature on Paymob's transaction callbacks.</summary>
    public string HmacSecret { get; set; } = string.Empty;

    public string IntegrationId { get; set; } = string.Empty;

    public string IframeId { get; set; } = string.Empty;

    public string UserRedirectUrl { get; set; } = string.Empty;

    public string AdminRedirectUrl { get; set; } = string.Empty;
}

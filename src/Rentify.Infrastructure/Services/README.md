# Services

Implementations of Application-layer interfaces:

- `CurrentUserService.cs` — real `ICurrentUserService`, reads the authenticated user's Id
  from the JWT's claims via `IHttpContextAccessor`.
- `LoggingEmailSender.cs` — development-only `IEmailSender`; logs instead of sending real
  email. Swap for a real provider (SendGrid/SES/SMTP) behind the same interface later.

Payment processing, notification delivery, etc. will be added here per-feature in later phases.

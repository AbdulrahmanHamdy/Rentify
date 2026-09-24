# Identity

ApplicationUser (IdentityUser), Identity/JWT configuration, and the Phase 4 authentication
implementation:

- `ApplicationUser.cs` — the concrete Identity user (adds FirstName/LastName/CreatedAt).
- `JwtOptions.cs` — strongly-typed binding of the "Jwt" config section.
- `JwtTokenGenerator.cs` — signs JWT access tokens.
- `AuthService.cs` — implements `Application.Interfaces.IAuthService`; all the actual
  register/login/refresh/logout/forgot-reset-password logic.
- `IdentitySeeder.cs` — seeds the Admin/Owner/Tenant roles on startup.

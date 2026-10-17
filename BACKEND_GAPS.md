# Rentify Backend Gaps & Integration Notes (BACKEND_GAPS.md)

This document outlines backend observations, missing endpoints, security considerations, and necessary integration changes identified during frontend development.

---

## 1. CORS Policy Configuration (Applied)
* **Gap Identified:** The ASP.NET Core API (`src/Rentify.API/Program.cs`) had no CORS middleware configured. Any cross-origin request from a standalone Single Page Application (`http://localhost:5173` or `http://localhost:3000`) was rejected by browsers with a preflight CORS violation.
* **Backend Change Applied:**
  - Added `builder.Services.AddCors(...)` with named policy `"SpaCorsPolicy"` allowing `http://localhost:5173`, `https://localhost:5173`, and `http://localhost:3000` with credentials, any method, and any header.
  - Added `app.UseCors("SpaCorsPolicy");` in the middleware pipeline prior to `app.UseAuthentication()`.
* **Recommendation for Production:** Bind allowed CORS origins dynamically to `appsettings.json` / environment variables (`Cors:AllowedOrigins`) rather than hardcoding.

---

## 2. Refresh Token Storage & HttpOnly Cookies (Recommendation)
* **Current State:**
  - `POST /api/auth/login` and `POST /api/auth/refresh` return both `accessToken` and `refreshToken` in the JSON response body.
  - The frontend keeps both tokens strictly in JavaScript memory to avoid persistent storage risks. Consequently, a hard browser page refresh clears the in-memory session and requires re-authentication.
* **Security Recommendation:**
  - Store the refresh token in an `HttpOnly`, `SameSite=Strict`, `Secure` cookie issued by the server.
  - The frontend can then issue a credentials-enabled silent refresh request (`POST /api/auth/refresh` with `withCredentials: true`) upon initial application load to restore the session securely without exposing the refresh token to JavaScript.

---

## 3. Maintenance Module API Endpoints
* **Current State:**
  - The database entities (`MaintenanceRequest`), EF Core mappings, and `DbSet<MaintenanceRequest>` exist in `Rentify.Domain` and `Rentify.Infrastructure`.
  - However, no REST controller (`MaintenanceController.cs`) is exposed in `Rentify.API`.
* **Frontend Handling:**
  - The frontend renders an informative, production-quality status screen at `/maintenance` outlining the scheduled maintenance capabilities, preventing user confusion while avoiding disconnected or fake state.

---

## 4. Payment Gateway Integration (Paymob Phase 8)
* **Current State:**
  - Paymob configuration (`PaymobOptions`) is loaded in `appsettings.json`, and database entities exist for `Payment`.
  - However, automated checkout endpoints and webhook controllers for Paymob are part of Phase 8 and are not yet exposed by the API.
* **Frontend Handling:**
  - The frontend `/payments` page displays real scheduled rental obligations and deposit records derived from active rental contracts (`/api/contracts`), with a clear notice explaining the Phase 8 gateway status. No simulated or fake payment completions are permitted.

---

## 5. Seeded Test Accounts
* **Current State:**
  - `IdentitySeeder.cs` automatically seeds the roles (`Admin`, `Owner`, `Tenant`) into `AspNetRoles` upon startup, but intentionally does not seed user accounts to prevent default password security vulnerabilities.
* **Creation Instructions for Testing:**
  - **Owner:** Register via frontend at `/register` selecting role `Owner`. Verify email using confirmation code logged to the backend console (or via SMTP).
  - **Tenant:** Register via frontend at `/register` selecting role `Tenant`.
  - **Admin:** Register an account via `/register`, then run SQL command:
    ```sql
    INSERT INTO AspNetUserRoles (UserId, RoleId)
    SELECT u.Id, r.Id FROM AspNetUsers u, AspNetRoles r
    WHERE u.Email = 'your_admin_email@example.com' AND r.Name = 'Admin';
    ```

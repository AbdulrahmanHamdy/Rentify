# Rentify

A production-style ASP.NET Core Web API for property rental management (property owners,
tenants, and administrators). Being built incrementally, phase by phase.

## Solution layout

```
Rentify.sln
src/
  Rentify.Domain/          Entities, enums, domain constants — no dependencies on other layers
  Rentify.Application/     DTOs, interfaces, validators, mapping, use-case logic — depends on Domain
  Rentify.Infrastructure/  EF Core, Identity, external services — depends on Application + Domain
  Rentify.API/              Controllers, middleware, composition root — depends on Application + Infrastructure
```

Dependency direction: `API → Application → Domain`, with `Infrastructure → Application + Domain`.
Controllers stay thin; business logic lives in Application.

## Current status

See `PROJECT_STATUS.md` for the up-to-date phase tracker (safe to paste into a new chat
session to resume work).

## Prerequisites

* [.NET 8 SDK](https://dotnet.microsoft.com/download/dotnet/8.0)
* SQL Server (from the phase that introduces persistence onward)

## Running

```bash
dotnet restore
dotnet build
dotnet run --project src/Rentify.API
```

As of Phase 2 the API exposes no endpoints yet (no controllers) — this just confirms the
solution boots. `dotnet build` should succeed with zero warnings and zero errors.

## Database (Phase 3 onward)

1. Have SQL Server reachable (local install, Docker, or Azure SQL) and update
   `ConnectionStrings:DefaultConnection` — via `appsettings.Development.json`,
   `dotnet user-secrets`, or an environment variable. Never commit a real connection string.
2. Install the EF Core CLI tool once, if you don't already have it:
   ```bash
   dotnet tool install --global dotnet-ef
   ```
3. Create and apply the initial migration:
   ```bash
   dotnet ef migrations add InitialCreate \
     --project src/Rentify.Infrastructure \
     --startup-project src/Rentify.API \
     --output-dir Persistence/Migrations

   dotnet ef database update \
     --project src/Rentify.Infrastructure \
     --startup-project src/Rentify.API
   ```

> **Note on this repo as delivered:** the sandbox this was built in has no network access
> to nuget.org, so the EF Core packages referenced in `Rentify.Infrastructure.csproj`
> (`Microsoft.EntityFrameworkCore.SqlServer`, `Microsoft.EntityFrameworkCore.Design`)
> could not be restored or compiled there, and no migration has been generated yet. The
> Domain and Application/Infrastructure DI foundation *were* fully built and verified
> (`dotnet build`, 0 warnings/0 errors) before persistence code was added. Run
> `dotnet restore && dotnet build` on your machine to verify the persistence layer, and
> report back anything that doesn't compile — package APIs occasionally shift between
> patch versions and `Version="8.0.*"` intentionally floats to whatever is newest.

## Authentication (Phase 4)

ASP.NET Core Identity + JWT bearer authentication, on top of the Phase 3 persistence layer.

### Setup

1. Set a JWT signing key (32+ characters) — **never** in `appsettings.json`:
   ```bash
   cd src/Rentify.API
   dotnet user-secrets set "Jwt:SigningKey" "$(openssl rand -base64 48)"
   ```
   (Alternatively, edit the placeholder value directly in `appsettings.Development.json` —
   same convention as the SQL Server password placeholder there. User-secrets take
   precedence automatically in the Development environment, so either works.)
2. Generate the migration that adds Identity's tables (`AspNetUsers`, `AspNetRoles`, etc.)
   alongside the Phase 3 tables:
   ```bash
   dotnet ef migrations add AddIdentity \
     --project src/Rentify.Infrastructure \
     --startup-project src/Rentify.API \
     --output-dir Persistence/Migrations

   dotnet ef database update \
     --project src/Rentify.Infrastructure \
     --startup-project src/Rentify.API
   ```
3. Run the API:
   ```bash
   dotnet run --project src/Rentify.API
   ```
   On startup, the Admin/Owner/Tenant roles are seeded automatically if they don't already
   exist. No default Admin *user* is created — see Known Issues in `PROJECT_STATUS.md`.

### Endpoints

| Method | Route                        | Auth       | Notes |
|--------|------------------------------|------------|-------|
| POST   | `/api/auth/register`         | Anonymous  | Role must be `Owner` or `Tenant` |
| POST   | `/api/auth/confirm-email`    | Anonymous  | `{ userId, token }` from the (logged, not emailed) confirmation link |
| POST   | `/api/auth/login`            | Anonymous  | Fails with 401 if email isn't confirmed yet |
| POST   | `/api/auth/refresh`          | Anonymous  | Rotates the refresh token; reuse of an already-used token revokes all of that user's sessions |
| POST   | `/api/auth/logout`           | Bearer JWT | Revokes the given refresh token; the access token stays valid until it naturally expires |
| POST   | `/api/auth/forgot-password`  | Anonymous  | Always returns 200, whether or not the email exists |
| POST   | `/api/auth/reset-password`   | Anonymous  | Revokes all of that user's refresh tokens on success |

No real email provider is wired up yet — `LoggingEmailSender` logs the confirmation/reset
link (with its token) via `ILogger` instead of sending it, so you can copy the token out of
the console to test `confirm-email` / `reset-password` locally.

### Compile status

Same limitation as Phase 3: this sandbox cannot reach nuget.org, so the two new packages
this phase adds (`Microsoft.AspNetCore.Identity.EntityFrameworkCore`,
`Microsoft.AspNetCore.Authentication.JwtBearer`, `System.IdentityModel.Tokens.Jwt`) could
not be restored or compiled here either. What *was* verified in this sandbox:
`Rentify.Domain` and `Rentify.Application` (which needed no new packages this phase) both
build clean, 0 warnings/0 errors, with an offline NuGet source — confirming the interfaces,
DTOs and exceptions added this phase are syntactically correct. The Infrastructure/API code
(`AuthService`, `JwtTokenGenerator`, `RentifyDbContext`, `AuthController`, `Program.cs`, DI
wiring) was written and manually cross-checked (every interface method signature matched
against its implementation, every DTO field checked against its usages, brace-balance and
using-directive checks run on every file) but needs `dotnet restore && dotnet build` on a
machine with real NuGet access to get a compiler's final word. Report back anything that
doesn't compile.

## Properties & Units, Validation, Pagination, Global Error Handling (Phase 5)

The first "real" business-resource controllers, now that a user can authenticate and be
authorized — plus the cross-cutting pieces the spec calls for around them.

### What's new

* **Global exception handling middleware** (`Rentify.API/Middleware/GlobalExceptionHandler.cs`,
  a .NET 8 `IExceptionHandler`) — every Application exception (`AppNotFoundException` → 404,
  `AppForbiddenException` → 403, `AppConflictException` → 409, `AppValidationException` → 422,
  `AppUnauthorizedException` → 401, `Rentify.Domain.Common.DomainException` → 409, anything
  else → 500) is mapped to one consistent JSON shape (`ApiErrorResponse`). `AuthController`'s
  Phase-4 local try/catch blocks are gone — they were explicitly temporary, and this replaces
  them without changing where or why any exception is thrown.
* **FluentValidation**, wired through a single global `ValidationFilter`
  (`Rentify.API/Filters/ValidationFilter.cs`): for every action argument, if a matching
  `IValidator<T>` is registered, it runs automatically before the action executes. Validators
  now exist for every Auth DTO from Phase 4 (Register, Login, ForgotPassword, ResetPassword,
  ConfirmEmail, Refresh, Logout) as well as the new Property/Unit DTOs — a validation failure
  always comes back as the same 422 `ApiErrorResponse` shape, whether it's a malformed email
  or an invalid unit area.
* **AutoMapper** — `PropertyMappingProfile` / `UnitMappingProfile` map entities to their
  response DTOs. Request DTOs (Create/Update) are deliberately *not* auto-mapped onto
  entities — see the profiles' own comments for why (ownership fields must never be settable
  from a request body).
* **Reusable pagination** (`Rentify.Application/Common/Pagination/`) — `PaginationRequest`
  (page, pageSize [max 50], search, sortBy, sortDirection) and `PagedResult<T>`, bound
  straight from the query string (`[FromQuery] PaginationRequest request`).
* **Property & Unit CRUD**, with ownership enforced in the Application layer
  (`PropertyService`/`UnitService`), never trusted from a route id alone:
  - `IPropertyRepository` / `IUnitRepository` / `IOwnerProfileRepository` (Application
    interfaces) implemented in `Rentify.Infrastructure/Persistence/Repositories/` using EF
    Core, `AsNoTracking()` for the paged list reads, real `Skip`/`Take` paging.
  - A brand-new unit always starts `Available`; `PUT /api/units/{id}` can only toggle between
    `Available` and `Maintenance` directly — `Reserved`/`Rented` are reserved for the (not yet
    built) rental-contract workflow, enforced in `UnitService.UpdateAsync`.
  - Deleting a unit is blocked while it has a `Pending` or `Active` `RentalContract`.
  - Deletes are soft deletes (via the existing `RentifyDbContext` interceptor from Phase 3) —
    history is preserved.

### Endpoints

| Method | Route                                  | Auth                  | Notes |
|--------|-----------------------------------------|------------------------|-------|
| GET    | `/api/properties`                       | Anonymous               | Paged, searchable, sortable public catalog. `?mine=true` restricts to the caller's own properties (must be an authenticated Owner) |
| GET    | `/api/properties/{id}`                  | Anonymous               | |
| POST   | `/api/properties`                       | Owner                   | Created under the caller's own `OwnerProfile` |
| PUT    | `/api/properties/{id}`                  | Owner (own only), Admin | |
| DELETE | `/api/properties/{id}`                  | Owner (own only), Admin | Soft delete |
| GET    | `/api/properties/{propertyId}/units`    | Anonymous               | Paged |
| POST   | `/api/properties/{propertyId}/units`    | Owner (own only), Admin | |
| GET    | `/api/units/{id}`                       | Anonymous               | Not in the original spec list — added for symmetry with PUT/DELETE |
| PUT    | `/api/units/{id}`                       | Owner (own only), Admin | Rejects `Status: Reserved`/`Rented` |
| DELETE | `/api/units/{id}`                       | Owner (own only), Admin | Blocked if a Pending/Active contract exists |

### Compile status

Same sandbox limitation as Phases 3–4 — no network access to nuget.org here, so the two new
packages this phase adds to `Rentify.Application.csproj` (`AutoMapper`, `FluentValidation` +
`FluentValidation.DependencyInjectionExtensions`) could not be restored or compiled in this
environment. Every new/changed file (11 in Infrastructure/API, ~30 in Application) was
manually cross-checked — interface signatures against implementations, DTO field names
against usages, navigation properties against the `Include()` calls that load them, brace
balance and using-directives — but not compiler-verified. Run
`dotnet restore && dotnet build` and report back anything that breaks.


## Rental Contract Workflow (Phase 6)

### What's new

* **Contract lifecycle** — `POST /api/contracts` (a Tenant requests a unit) → `activate` (owner
  approves) → `terminate`, or `cancel` while still Pending. The legal contract transitions
  live on the `RentalContract` entity itself (Phase 2); `ContractService` calls them and
  moves the `Unit` to match, in a single `SaveChanges` (one transaction):

  | Action    | Contract            | Unit                   | Who                                  |
  |-----------|---------------------|------------------------|--------------------------------------|
  | create    | → Pending           | Available → Reserved   | Tenant                               |
  | activate  | Pending → Active    | Reserved → Rented      | Owner of the property, Admin         |
  | cancel    | Pending → Cancelled | Reserved → Available   | Tenant (own), Owner of property, Admin |
  | terminate | Active → Terminated | Rented → Available     | Owner of the property, Admin         |

  An invalid transition (e.g. activating a Cancelled contract) → `409` via `DomainException`.
* **"A rented unit can't be rented again"** enforced three ways: unit must be `Available`;
  no Pending/Active contract may exist for it; and a filtered unique index on
  `RentalContracts(UnitId)` (Pending+Active, non-deleted) catches two simultaneous requests,
  translated to `409` by `ContractRepository`.
* **Server-decided money and identity** — the request body is just `unitId`, `startDate`,
  `endDate`. Tenant = the caller; `MonthlyRent`/`SecurityDeposit` are snapshotted from the unit.
* **Party-based visibility** — Tenant sees own contracts, Owner sees contracts on own
  properties, Admin sees all. Anyone else gets `404` (not `403`) on a specific id, so ids
  can't be probed. A visible-but-not-allowed action (tenant → activate) is `403`.
* **Phase 5 integrity fixes** now that contracts exist: `PUT /api/units/{id}` can no longer
  change the status of a Reserved/Rented unit (`409`), and `DELETE /api/properties/{id}` is
  blocked while any of its units has a Pending/Active contract (`409`).

### Endpoints

| Method | Route                            | Auth                    | Notes |
|--------|-----------------------------------|--------------------------|-------|
| GET    | `/api/contracts`                  | Tenant, Owner, Admin     | Paged; scoped to caller. `?status=Pending`, `search` (unit no. / property name), `sortBy` = startDate/endDate/monthlyRent/createdAt |
| GET    | `/api/contracts/{id}`             | Tenant, Owner, Admin     | 404 if not a party |
| POST   | `/api/contracts`                  | Tenant                   | Body: `{ "unitId", "startDate", "endDate" }` (`yyyy-MM-dd`) |
| POST   | `/api/contracts/{id}/activate`    | Owner (own), Admin       | |
| POST   | `/api/contracts/{id}/terminate`   | Owner (own), Admin       | |
| POST   | `/api/contracts/{id}/cancel`      | Tenant/Owner (party), Admin | Not in the original spec list; needed for Pending → Cancelled |

### Database change

The unique index on `RentalContracts.UnitId` changed filter (Active → Pending+Active, and
excludes soft-deleted rows). **Add a migration**:

```bash
dotnet ef migrations add ContractUniqueIndexPendingActive \
  --project src/Rentify.Infrastructure --startup-project src/Rentify.API
dotnet ef database update --project src/Rentify.Infrastructure --startup-project src/Rentify.API
```

### Trying it

1. Register + confirm an **Owner**, a **Tenant** (and make an Admin if you need one); log in as each to get tokens.
2. Owner: `POST /api/properties`, then `POST /api/properties/{id}/units`.
3. Tenant: `POST /api/contracts` with the unit id → `201`, contract `Pending`, unit now `Reserved`.
4. A second Tenant repeating step 3 → `409`.
5. Owner: `POST /api/contracts/{id}/activate` → `Active`, unit `Rented`.
6. Owner: `PUT /api/units/{id}` with `Status: Available` → `409`. `POST .../terminate` → unit `Available` again.

### Compile status

Same sandbox limitation as earlier phases — no .NET SDK / nuget access here, so this phase
is **not compiler-verified** (all new code uses packages already referenced; no new
`PackageReference`). Files were cross-checked by hand. Run `dotnet build` and report anything that breaks.

## Swagger / OpenAPI (Phase 7)

### What's new

* **Swagger UI** at `/swagger` (the launch profiles already pointed there) and the raw
  OpenAPI document at `/swagger/v1/swagger.json`, via Swashbuckle. Wiring lives in
  `Rentify.API/Swagger/` (`SwaggerServiceExtensions`, `AuthAndErrorResponsesOperationFilter`);
  `Program.cs` only calls `AddRentifySwagger()` / `UseRentifySwagger()`.
* **JWT "Authorize" button** (HTTP bearer scheme). Only endpoints that actually require
  authorization show a lock and carry the security requirement — anonymous endpoints
  (public property catalog, register/login, ...) do not.
* **Error responses documented from the code**, not hand-annotated: protected endpoints list
  401/403; routes with an id list 404; POST/PUT/DELETE list 409; endpoints with a body list
  422; all list 500. Every one uses the real `ApiErrorResponse` shape from
  `GlobalExceptionHandler`.
* **XML doc comments** (`///`) from `Rentify.API` and `Rentify.Application` (DTOs) are shown
  in the UI (`GenerateDocumentationFile` enabled on both; CS1591 suppressed).
* **Environment gating**: always on in Development; elsewhere only if `Swagger:Enabled` is
  `true` (env var `Swagger__Enabled=true`). Off by default in `appsettings.json`.

### Testing protected endpoints in Swagger UI

1. `POST /api/auth/register` (role `Owner` or `Tenant`).
2. Copy the confirmation `userId` + `token` from the console log (`[DEV EMAIL — not actually sent]`)
   and call `POST /api/auth/confirm-email`.
3. `POST /api/auth/login`, copy `accessToken` from the response.
4. Click **Authorize**, paste the token (no `Bearer ` prefix), **Authorize**. The lock icons close and
   requests now carry the token. The token is remembered across page refreshes.
5. To act as a different user (e.g. Owner → Tenant for the contract flow), click **Authorize** →
   **Logout**, then repeat steps 3–4 with the other account's token.

### Notes

* New package: `Swashbuckle.AspNetCore` **6.9.\*** in `Rentify.API`, deliberately pinned to 6.x
  (8.x moves to Microsoft.OpenApi 2.x, which changes the security-scheme types used here).
  Run `dotnet restore`.
* No database change and no migration this phase.
* **Compile status:** not compiler-verified (no .NET SDK / nuget in the sandbox). Run `dotnet build`.

## Email (SMTP) & Paymob configuration (Phase 7.1)

* **Real email sending.** `SmtpEmailSender` (STARTTLS, port 587) is used automatically when
  `EmailSettings` has `SmtpHost`, `SenderEmail` and `SenderPassword`; otherwise the app falls
  back to `LoggingEmailSender` (console only). Registration, confirm-email and forgot-password
  mails now really arrive. Send failures are logged (subject only — never the body/tokens/recipient)
  and not thrown, so forgot-password can't reveal which addresses are registered. There is still
  no "resend confirmation" endpoint.
* **Paymob settings** are bound to `PaymobOptions` but **not used yet** — the integration comes
  with the Payments phase behind a payment-processor interface.
* **Where the values live:** blank placeholders in `appsettings.json`; the test values in
  `appsettings.Development.json`, which is now covered by a new `.gitignore` (the project had
  none). Prefer `dotnet user-secrets` / environment variables (`EmailSettings__SenderPassword`,
  `Paymob__ApiKey`, `Paymob__HmacSecret`) for anything beyond throwaway testing.
* Emails currently show the sender name "Rujta" and Paymob's redirect URLs point at the Rujta
  frontend — change `SenderName` and the redirect URLs when this is Rentify's own.

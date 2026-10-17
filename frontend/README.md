# Rentify Frontend — Property Rental Management System

A modern, high-performance web client built with **React 18**, **Vite**, **TypeScript**, **Tailwind CSS**, and **TanStack Query**, integrated directly with the Rentify ASP.NET Core 8 Web API.

---

## 🚀 Quick Start

### 1. Prerequisites
- **Node.js**: v18.0.0 or later (v20+ recommended)
- **.NET SDK**: 8.0 or later
- **SQL Server**: Running instance (LocalDB or standard instance)

### 2. Environment Configuration
Create a `.env` file in the `frontend` folder (or copy from `.env.example`):
```env
VITE_API_BASE_URL=http://localhost:5261
```

### 3. Install Dependencies
```bash
cd frontend
npm install
```

### 4. Run Development Servers

**Terminal 1 — ASP.NET Core 8 Backend:**
```bash
# From the root workspace directory
dotnet run --project src/Rentify.API
```
*API will listen on `http://localhost:5261` and `https://localhost:7208`.*

**Terminal 2 — React + Vite Frontend:**
```bash
# From the frontend directory
npm run dev
```
*Frontend will open at `http://localhost:5173`.*

---

## 🛠 Available Scripts

In the `frontend` directory:

| Command | Description |
| :--- | :--- |
| `npm run dev` | Starts Vite local development server with HMR |
| `npm run build` | Compiles TypeScript and builds optimized production bundle in `dist/` |
| `npm run typecheck` | Runs `tsc --noEmit` to verify type safety |
| `npm run lint` | Runs ESLint 9 across all TypeScript files |
| `npm test` | Runs unit and integration test suite with Vitest + MSW |
| `npm run preview` | Locally previews the production build output |

---

## 👥 Test Accounts Instructions

The backend seeds roles (`Admin`, `Owner`, `Tenant`) into `AspNetRoles` upon startup, but does not hardcode default user passwords. To create test accounts:

### 1. Create Tenant & Owner Accounts
1. Visit `http://localhost:5173/register`.
2. Choose account type: **Tenant** or **Property Owner**.
3. Fill in email and password (minimum 8 characters).
4. After submission, view the backend terminal output to retrieve the confirmation token, then verify at `/confirm-email`.

### 2. Promote an Account to Admin
To grant administrative privileges to a registered user, run the following SQL command in `RentifyDb`:
```sql
INSERT INTO AspNetUserRoles (UserId, RoleId)
SELECT u.Id, r.Id 
FROM AspNetUsers u, AspNetRoles r
WHERE u.Email = 'admin@example.com' AND r.Name = 'Admin';
```

---

## 🏗 Architecture & Security Highlights

- **In-Memory JWT Tokens:** Access tokens and refresh tokens are stored purely in memory (`src/lib/token-manager.ts`). Never persisted to `localStorage` to guard against XSS token harvesting.
- **Concurrent 401 Interceptor:** Transparently queues simultaneous API requests when a token expires, avoiding race conditions during refresh token rotation.
- **Cross-Tab Logout:** Uses `BroadcastChannel` to synchronize logout actions across all open browser tabs without reading or writing storage.
- **OpenAPI Type Generation:** Types are generated directly from the backend's OpenAPI v3 schema via `openapi-typescript`.
- **Accessible UI:** Built with WCAG 2.1 AA compliant color contrast (refined emerald brand palette on charcoal neutrals), keyboard navigation, focus trapping, and screen-reader accessible form controls.

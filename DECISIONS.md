# Rentify Frontend Architectural Decisions & Assumptions (DECISIONS.md)

This document records the architectural decisions, trade-offs, and design rationales made during the development of the Rentify React + Vite + TypeScript frontend.

---

## 1. Authentication & Token Security Architecture

### Decision: Strict In-Memory Token Management
* **Chosen Approach:** JWT Access Tokens and Refresh Tokens are maintained strictly in JavaScript heap memory inside `tokenManager` (`src/lib/token-manager.ts`). Neither token is stored in `localStorage` or `sessionStorage`.
* **Alternatives Considered:**
  1. *localStorage / sessionStorage*: Highly vulnerable to Cross-Site Scripting (XSS) extraction attacks.
  2. *HttpOnly Cookies*: Ideal industry standard, but the existing ASP.NET Core API currently returns tokens inside the JSON response payload of `/api/auth/login` and `/api/auth/refresh`.
* **Rationale:** Adheres strictly to OWASP SPA Security Guidance and the prompt constraint. To synchronize logout across active browser tabs without storing tokens on disk, a `BroadcastChannel('rentify_auth_sync')` is used to broadcast logout events.
* **Refresh Interceptor:** When an access token expires (HTTP 401), Axios transparently queues concurrent requests using an in-flight promise to avoid race conditions against the backend's token-rotation mechanism.

---

## 2. API Contract & TypeScript Types

### Decision: OpenAPI-Generated Types with openapi-typescript
* **Chosen Approach:** Fetch the live OpenAPI v3 contract from `http://localhost:5261/swagger/v1/swagger.json` and generate TypeScript types using `openapi-typescript` (`src/types/api.generated.ts`). Domain DTOs are mapped cleanly in `src/types/index.ts`.
* **Rationale:** Guarantees 100% type safety and prevents field drift between the ASP.NET Core controllers/validators and the React frontend.

---

## 3. UI/UX & Design Tokens

### Decision: Refined Emerald Palette with WCAG AA Compliance
* **Chosen Approach:** Custom design system built with Tailwind CSS, utilizing a refined forest/emerald green palette (`#059669` / `#047857`) for primary brand accents, dark charcoal neutrals (`#111827`, `#374151`, `#6b7280`), and light neutral backgrounds (`#f9fafb`, `#ffffff`).
* **Contrast Compliance:** All primary interactive elements and text meet or exceed WCAG 2.1 AA standards (contrast ratio >= 4.5:1 for regular text, >= 3:1 for large text and UI components).
* **Motion Accessibility:** Respects `prefers-reduced-motion` to suppress animations for sensitive users.
* **Image Fallbacks:** Visible, transparent "No photo available" placeholder cards to avoid fabricating false property imagery.

---

## 4. Internationalization, Currency & Date Formatting

### Decision: Centralized Intl Utility Formatters
* **Currency:** Egyptian Pound (`EGP`), formatted using `Intl.NumberFormat('en-EG', { style: 'currency', currency: 'EGP' })`.
* **Dates:** Formatted via `Intl.DateTimeFormat` (`formatDate`, `formatDateTime`).
* **i18n Readiness:** All UI copy is structured and centralized, avoiding hardcoded formatting logic.

---

## 5. State Management & Data Fetching

### Decision: TanStack Query (React Query)
* **Chosen Approach:** Server state is managed exclusively by TanStack Query with query caching, 2-minute stale time, and automatic cache invalidation upon mutations.
* **Retry Strategy:** Client 4xx errors (400, 401, 403, 404, 409, 422) are explicitly suppressed from retrying, preventing wasteful loops on validation and authorization failures.
* **Session Cache Clearance:** `queryClient.clear()` is called automatically upon user sign-out to prevent data leakage between user sessions.

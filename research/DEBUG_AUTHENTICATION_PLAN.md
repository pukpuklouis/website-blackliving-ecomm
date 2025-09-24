# Authentication Debugging Plan: Black Living Admin App

# Authentication Debugging Plan: Black Living Admin App

## ⚠️ Important Safeguards

*   **Do NOT modify API Endpoints in `/apps/api/`:** The existing API endpoints are considered tested and stable. Focus primarily on debugging and configuration, not altering the API itself.
*   **Do NOT modify `apps/web/`:** The customer-facing website (`apps/web/`) is also considered tested and stable. All changes should be confined to `apps/admin/` or shared packages if absolutely necessary and without affecting `apps/web/`.

## 🎯 Task Goal
Diagnose and resolve the continuous login loop issue in the Black Living Admin application, specifically focusing on the `better-auth.session_token` cookie handling and server-side session data parsing, which is currently resulting in "empty role session data" and incorrect authentication state.

## 🔧 Execution Steps

### Phase 1: Backend Debugging (High Priority)

1.  **Enable Detailed Logging in Cloudflare Worker/Local API**
    *   **Description:** Ensure `NODE_ENV` is set to `development` for the `/apps/api/` project. This will enable the extensive logging statements already present in `apps/api/src/middleware/auth.ts` and `apps/api/src/index.ts`.
    *   **Action:**
        *   If running locally, set `NODE_ENV=development` in your `.env` file within `apps/api/`.
        *   If deploying to a staging/development Cloudflare Worker, configure the `NODE_ENV` environment variable for the Worker.
    *   **Expected Outcome:** More verbose console output in the Cloudflare Worker logs (or local console) related to authentication flow.

2.  **Inspect Backend Session Creation and Content**
    *   **Description:** Trace a full login attempt from the admin frontend and observe the backend logs to verify that `better-auth` successfully creates a session and populates user data, including the `role`.
    *   **Actions:**
        *   **Initiate Login:** Attempt to log in to the admin application (e.g., via email/password or Google OAuth).
        *   **Review `createEnhancedAuthMiddleware` Logs:** Monitor the Cloudflare Worker logs (or local console) for output from `apps/api/src/middleware/auth.ts`, specifically the `Auth middleware - Session result` (lines 27-33) and `Authenticated request` (lines 40-43) logs.
            *   **Focus:** Confirm `hasSession: true`, `hasUser: true`. Critically, verify `userId`, `userEmail`, and confirm that the `user` object includes the `role: 'admin'` property.
        *   **Utilize Debug Endpoints:** Access the `/api/auth/debug/oauth-flow` and `/api/auth/debug/sessions` endpoints (if in development) after a login attempt to directly inspect the session data stored in the database.
            *   **Focus:** Confirm that the `sessions` table contains an active session, and the associated `users` table entry (retrievable via `userId`) has `role: 'admin'`.

3.  **Verify `better-auth.session_token` Cookie (Frontend Network Tab)**
    *   **Description:** Examine the browser's developer tools during and immediately after a login attempt to ensure the `better-auth.session_token` cookie is correctly set by the backend.
    *   **Action:**
        *   Open your browser's developer tools and navigate to the "Network" tab.
        *   Perform a login on the admin app.
        *   Inspect the response headers from the API call that completes the login (e.g., `/api/auth/sign-in/email` or the OAuth callback).
        *   **Focus:** Look for the `Set-Cookie` header. Verify that:
            *   `better-auth.session_token` is present.
            *   Its `Domain` attribute is correctly set for the admin application's domain (e.g., `admin.blackliving.com` or `staging.blackliving-admin.pages.dev`).
            *   Its `Path` attribute is `/`.
            *   The `Expires` date is in the future.
            *   `Secure` and `HttpOnly` flags are enabled (for security best practices).
        *   **Potential Detail Issue: HttpOnly Flag Validation:** While the `Secure` flag is crucial for HTTPS connections, the `HttpOnly` flag prevents client-side scripts from accessing the cookie. Typically, session token cookies *should* be `HttpOnly`. However, if the `better-auth` frontend client (e.g., in `packages/auth/client.ts`) *requires* reading this cookie via JavaScript for its operation, then enabling the `HttpOnly` flag could inadvertently cause issues. This is not an error but a detail to be aware of, ensuring the `HttpOnly` setting aligns with the `better-auth` library's specific implementation and expected behavior.

4.  **Check Environment Variables & Base URLs**
    *   **Description:** Ensure all relevant `BASE_URL` environment variables are consistent across frontend and backend configurations to avoid mismatches that could invalidate cookies or redirects.
    *   **Action:**
        *   Review `VITE_API_URL` in `apps/admin/.env` (or equivalent).
        *   Review `API_BASE_URL`, `WEB_BASE_URL`, `ADMIN_BASE_URL` in `apps/api/.env` (or Cloudflare Worker configuration).
        *   **Focus:** Verify that `ADMIN_BASE_URL` configured on the backend matches the `baseURL` resolved by `packages/auth/client.ts` for the admin app. Inconsistencies can cause session tokens to be rejected.

5.  **Review User Role Persistence in Database**
    *   **Description:** Confirm that when a user is expected to have the `admin` role, this role is correctly stored and retrieved from the database.
    *   **Action:**
        *   Examine `packages/db/schema.ts` to ensure the `users` table has a `role` column of type `enum('admin', 'customer')` or similar.
        *   Review any user creation or update logic (e.g., `apps/api/src/index.ts` lines 161-168 for `assign-admin-role` or any user registration/social login callbacks) to ensure the `role` is explicitly set to `admin` for administrators.

### Phase 2: Frontend State Updates (After Backend Session Confirmed)

1.  **Refine Frontend `login` Function (if necessary)**
    *   **Description:** Address the potential race condition in the `login` function in `apps/admin/app/contexts/AuthContext.tsx` if the backend is confirmed to correctly set sessions.
    *   **Suggestion:** Change `apps/admin/app/contexts/AuthContext.tsx:70` from `return user?.role === 'admin';` to `return true;` If the `checkAuth()` call (line 69) successfully updates the `user` state, the `ProtectedRoute` component (`apps/admin/app/components/ProtectedRoute.tsx`) should react accordingly. The `login` function's immediate return should simply indicate the API call's basic success.

### Summary of Core Hypothesis and Priority:

The most likely cause of the login loop is a failure in the backend to correctly set the `better-auth.session_token` cookie or for `auth.api.getSession()` to retrieve a valid user object with the `admin` role from that session. Debugging the backend with detailed logging is the highest priority.

## 📋 Principle Application Summary
**KISS:** Focuses on debugging existing components and configurations rather than introducing new ones.
**YAGNI:** Avoids unnecessary refactoring unless a direct problem is identified.
**DRY:** Leverages existing logging infrastructure.
**SOLID:** Maintains clear separation of concerns by debugging backend and frontend independently after identifying the likely interaction points.

This plan prioritizes debugging the backend because if the session cookie isn't correctly generated or parsed server-side, the frontend will continuously receive an unauthenticated state, leading to the loop. Once the backend reliably provides correct session and role data, the frontend can be re-evaluated.

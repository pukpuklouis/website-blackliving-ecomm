# Development Environment Setup - Complete ✅

## What Has Been Implemented

### ✅ 1. Separate Development D1 Database (DONE)
- **Created:** `blackliving-db-dev` (ID: `442f8982-9320-4815-824d-ad16067d3faa`)
- **Location:** Cloudflare APAC region
- **Isolation:** Completely separate from staging/production databases
- **Migrations:** All 5 migrations applied successfully
- **Seed Data:** Admin user seeded (pukpuk.tw@gmail.com)

### ✅ 2. Updated Configuration Files (DONE)
- **apps/api/wrangler.toml:** Development environment now uses separate database
- **apps/api/package.json:** Dev script uses `--env development` (local mode with dev database)
- **apps/admin/package.json:** Points to localhost:8787
- **apps/admin/wrangler.toml:** Default vars point to localhost:8787
- **apps/web/.env.local:** Points to localhost:8787

### ✅ 3. Security Improvements (DONE)
- **Separation of Concerns:** Dev, staging, production all use separate databases
- **No Cross-Environment Contamination:** Local dev cannot corrupt staging/production
- **Clear Environment Boundaries:** Each environment has isolated resources

---

## What You Need to Do (Manual Steps)

### 🔴 REQUIRED: Step 1 - Create Separate Google OAuth App

**Why:** For security, localhost and production should use separate OAuth apps.

**Instructions:** Follow the guide at `apps/api/GOOGLE_OAUTH_SETUP.md`

**Quick Steps:**
1. Go to https://console.cloud.google.com/apis/credentials
2. Create new OAuth 2.0 Client ID named "Black Living - Local Development"
3. Add redirect URI: `http://localhost:8787/api/auth/callback/google`
4. Copy Client ID and Client Secret

### 🔴 REQUIRED: Step 2 - Update .dev.vars

After creating the OAuth app, update `apps/api/.dev.vars`:

```bash
# Replace these two lines with your NEW development OAuth credentials
GOOGLE_CLIENT_ID=your-new-dev-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=GOCSPX-your-new-dev-client-secret
```

**Other secrets already configured:**
- ✅ BETTER_AUTH_SECRET (generated)
- ✅ JWT_SECRET (generated)
- ✅ TURNSTILE_SECRET_KEY (from staging)
- ✅ RESEND_API_KEY (from user)

---

## Testing Your Setup

### Start Development Servers

```bash
# Terminal 1: API Server
cd apps/api
pnpm dev

# Terminal 2: Admin App
cd apps/admin
pnpm dev

# Terminal 3: Web App (optional)
cd apps/web
pnpm dev
```

### Test Login Flow

1. Open http://localhost:5173 (admin app)
2. Click "Sign in with Google"
3. Should redirect to Google OAuth consent
4. After authentication, should redirect back to http://localhost:8787/api/auth/callback/google
5. Then redirect to admin dashboard

### Expected Behavior

✅ **Working:**
- OAuth redirects to localhost (not staging)
- Login completes successfully
- User session created in development database
- No writes to staging/production databases

❌ **Errors to Watch For:**
- `redirect_uri_mismatch` → Check OAuth app redirect URI
- `invalid_client` → Check GOOGLE_CLIENT_ID/SECRET in .dev.vars
- `no such table: verifications` → Migrations not applied (should be fixed)

---

## Architecture Summary

```
┌─────────────────────────────────────────────────────────┐
│                    DEVELOPMENT                           │
│  ┌────────────┐  ┌────────────┐  ┌──────────────────┐  │
│  │ localhost  │  │ localhost  │  │ Development D1   │  │
│  │   :5173    │→ │   :8787    │→ │  (isolated)      │  │
│  │  (admin)   │  │   (API)    │  │  442f8982...     │  │
│  └────────────┘  └────────────┘  └──────────────────┘  │
│                        ↓                                │
│              Google OAuth (Dev App)                     │
│         http://localhost:8787/callback                  │
└─────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────┐
│                      STAGING                             │
│  ┌────────────┐  ┌────────────┐  ┌──────────────────┐  │
│  │ staging.   │  │ api-staging│  │ Staging D1       │  │
│  │ pages.dev  │→ │ workers.dev│→ │  (isolated)      │  │
│  └────────────┘  └────────────┘  └──────────────────┘  │
│                        ↓                                │
│         Google OAuth (Production App)                   │
│    https://api-staging.../callback                      │
└─────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────┐
│                    PRODUCTION                            │
│  ┌────────────┐  ┌────────────┐  ┌──────────────────┐  │
│  │ blackliving│  │ blackliving│  │ Production D1    │  │
│  │ -web       │→ │ -api       │→ │  (isolated)      │  │
│  └────────────┘  └────────────┘  └──────────────────┘  │
│                        ↓                                │
│         Google OAuth (Production App)                   │
│         https://blackliving-api.../callback             │
└─────────────────────────────────────────────────────────┘
```

---

## Benefits of This Setup

### 🔒 Security
- Localhost not an authorized redirect in production OAuth
- Development database isolated from staging/production
- Separate secrets per environment
- No accidental writes to production data

### 🚀 Development Experience
- Full hot reload with local code changes
- Real database operations (not mocked)
- Complete testing environment
- Fast iteration cycles

### 🎯 Simple & Clean
- Clear environment boundaries
- Follows KISS principle
- Easy to understand which resources are used
- No confusion about what's local vs remote

---

## Troubleshooting

### Problem: "redirect_uri_mismatch"
**Cause:** OAuth app doesn't have localhost redirect URI
**Fix:** Add `http://localhost:8787/api/auth/callback/google` to Google Cloud Console

### Problem: Login redirects to staging URL
**Cause:** Using wrong environment or old .dev.vars
**Fix:**
1. Ensure `pnpm dev` uses `--env development`
2. Restart API server to pick up new .dev.vars
3. Check Better Auth baseURL uses localhost for development

### Problem: Database table not found
**Cause:** Migrations not applied to development database
**Fix:** Already done! All migrations applied to `blackliving-db-dev`

### Problem: No admin user in database
**Cause:** Seed data not inserted
**Fix:** Already done! Admin user `pukpuk.tw@gmail.com` seeded

---

## Next Steps After Manual Setup

Once you complete the Google OAuth setup (Steps 1-2 above):

1. Restart API server: `pnpm dev` in `apps/api`
2. Open admin app: http://localhost:5173
3. Click "Sign in with Google"
4. Test complete login flow
5. Verify you can access admin dashboard
6. Start developing! 🎉

---

## Questions?

- **Google OAuth Setup:** See `apps/api/GOOGLE_OAUTH_SETUP.md`
- **Configuration Details:** Check updated `wrangler.toml` and `package.json`
- **Database Info:** Run `wrangler d1 list` to see all databases

## Summary

✅ **Automated (Done):**
- Created development database
- Applied all migrations
- Seeded admin user
- Updated all configuration files
- Set up secure, isolated development environment

🔴 **Manual (You Need to Do):**
- Create Google OAuth app for localhost
- Update .dev.vars with new OAuth credentials
- Test login flow

**This follows:**
- ✅ KISS Principle (Simple, clear configuration)
- ✅ Separation of Concerns (Isolated environments)
- ✅ Security Best Practices (Separate OAuth apps, isolated databases)
- ✅ DRY Principle (Reusable configuration patterns)

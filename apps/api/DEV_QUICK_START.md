# Development Quick Start

## Daily Development Workflow

### 1. Start Dev Servers

```bash
# Terminal 1: API
cd apps/api && pnpm dev

# Terminal 2: Admin
cd apps/admin && pnpm dev

# Terminal 3: Web (optional)
cd apps/web && pnpm dev
```

### 2. Access Applications

- **Admin:** http://localhost:5173
- **API:** http://localhost:8787
- **Web:** http://localhost:4321

### 3. Test Login

Visit http://localhost:5173 → Click "Sign in with Google"

---

## Environment Overview

| Environment | Database | OAuth App | Secrets |
|------------|----------|-----------|---------|
| **Development** (Local) | `blackliving-db-dev` ✅ | Localhost OAuth (manual setup needed) | `.dev.vars` |
| **Staging** (Remote) | `blackliving-db` | Production OAuth | Cloudflare Dashboard |
| **Production** (Remote) | `blackliving-db` | Production OAuth | Cloudflare Dashboard |

---

## Database Commands

```bash
# List all databases
wrangler d1 list

# View development database
wrangler d1 info blackliving-db-dev

# Execute SQL (remote dev DB)
wrangler d1 execute blackliving-db-dev --env development --remote --command "SELECT * FROM users;"

# Apply new migrations
wrangler d1 migrations apply blackliving-db-dev --env development --remote
```

---

## Deployment Commands

```bash
# Deploy to staging
cd apps/api && pnpm deploy:staging

# Deploy to production
cd apps/api && pnpm deploy
```

---

## Common Issues

### Login redirects to staging
→ Restart API server to pick up .dev.vars changes

### OAuth redirect mismatch
→ Check Google Console has `http://localhost:8787/api/auth/callback/google`

### Table not found
→ Apply migrations: `wrangler d1 migrations apply blackliving-db-dev --env development --remote`

---

## Configuration Files

- **API Config:** `apps/api/wrangler.toml`
- **API Secrets:** `apps/api/.dev.vars` (gitignored)
- **Admin Config:** `apps/admin/wrangler.toml`
- **Web Config:** `apps/web/.env.local`

---

## First Time Setup

If you haven't completed the Google OAuth setup:

1. Read: `apps/api/GOOGLE_OAUTH_SETUP.md`
2. Create OAuth app with redirect: `http://localhost:8787/api/auth/callback/google`
3. Update `apps/api/.dev.vars` with new credentials
4. Restart API server

Full details: `apps/api/DEVELOPMENT_SETUP_COMPLETE.md`

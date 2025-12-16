# Configuration Guide

This document explains how to configure environment variables and secrets across the monorepo.

## 🏗️ Architecture Overview

```
┌─────────────────────┐
│   apps/web          │  ← Client-side (Astro + React)
│   (Cloudflare Pages)│  ← Only PUBLIC_ variables
└─────────────────────┘
           ↓
┌─────────────────────┐
│   apps/api          │  ← Server-side (Hono + Workers)
│   (Cloudflare       │  ← All secrets live here
│    Workers)         │
└─────────────────────┘
           ↓
┌─────────────────────┐
│   Cloudflare        │  ← D1, R2, KV (Remote only)
│   Services          │  ← No local database
└─────────────────────┘
```

## 📦 Apps Configuration

### apps/web (Client-Side)

**Files:**

- `.env.local` - Local development (Astro dev server)
- `wrangler.toml` - Cloudflare Pages deployment

**Required Variables:**

```bash
# Client-safe PUBLIC variables only!
PUBLIC_API_BASE_URL=https://blackliving-api-staging.pukpuk-tw.workers.dev
PUBLIC_API_URL=https://blackliving-api-staging.pukpuk-tw.workers.dev
PUBLIC_SITE_URL=http://localhost:4321
PUBLIC_ADMIN_URL=http://localhost:5173
PUBLIC_IMAGE_CDN_URL=https://blackliving-api-staging.pukpuk-tw.workers.dev/media
PUBLIC_R2_PUBLIC_URL=https://blackliving-api-staging.pukpuk-tw.workers.dev/media
PUBLIC_TURNSTILE_SITE_KEY=0x4AAAAAAB4PpO44CivW_wQr
```

**❌ DO NOT ADD:**

- API keys
- Auth secrets
- Database credentials
- Any non-PUBLIC variables

---

### apps/api (Server-Side)

**Files:**

- `.dev.vars` - Local development secrets (gitignored)
- `.dev.vars.example` - Template for local setup
- `wrangler.toml` - Cloudflare Workers deployment

**Required Secrets:**

```bash
BETTER_AUTH_SECRET=<openssl rand -base64 32>
GOOGLE_CLIENT_ID=<from Google Cloud Console>
GOOGLE_CLIENT_SECRET=<from Google Cloud Console>
JWT_SECRET=<openssl rand -base64 32>
TURNSTILE_SECRET_KEY=<from Cloudflare Turnstile>
RESEND_API_KEY=<from Resend dashboard>
```

**Setup:**

```bash
# 1. Copy template
cd apps/api
cp .dev.vars.example .dev.vars

# 2. Fill in real values in .dev.vars

# 3. For staging/production, use wrangler secrets
wrangler secret put BETTER_AUTH_SECRET --env staging
wrangler secret put GOOGLE_CLIENT_ID --env staging
# ... etc
```

---

### apps/admin (Admin Dashboard)

**Files:**

- `wrangler.toml` - Cloudflare Pages/Workers deployment

**Required Variables:**

```bash
NODE_ENV=development
API_BASE_URL=http://localhost:8787
PUBLIC_API_BASE_URL=http://localhost:8787
PUBLIC_API_URL=http://localhost:8787
PUBLIC_IMAGE_CDN_URL=http://localhost:8787/media
PUBLIC_SITE_URL=http://localhost:5173
PUBLIC_WEB_URL=http://localhost:4321
```

---

## 🔐 Security Best Practices

### 1. Public vs Secret Variables

| Variable Type | Where                   | Example          |
| ------------- | ----------------------- | ---------------- |
| `PUBLIC_*`    | Client-side (web/admin) | `PUBLIC_API_URL` |
| Non-prefixed  | Server-side (api) only  | `JWT_SECRET`     |

### 2. Service-Specific Configuration

#### Cloudflare Turnstile

| Key                         | Location | Purpose                 |
| --------------------------- | -------- | ----------------------- |
| `PUBLIC_TURNSTILE_SITE_KEY` | apps/web | Client renders CAPTCHA  |
| `TURNSTILE_SECRET_KEY`      | apps/api | Server validates tokens |

**Why both?**

- Site key is PUBLIC (safe in browser)
- Secret key validates tokens (server-only)

#### Resend Email

| Key                 | Location | Purpose        |
| ------------------- | -------- | -------------- |
| `RESEND_API_KEY`    | apps/api | Send emails    |
| `RESEND_FROM_EMAIL` | apps/api | Sender address |

**Why API only?**

- Emails sent from server
- API key must never be exposed to client

#### Better Auth

| Key                    | Location | Purpose            |
| ---------------------- | -------- | ------------------ |
| `BETTER_AUTH_SECRET`   | apps/api | Session encryption |
| `GOOGLE_CLIENT_ID`     | apps/api | OAuth flow         |
| `GOOGLE_CLIENT_SECRET` | apps/api | OAuth flow         |

**Why API only?**

- Auth logic runs on server
- OAuth callback handled by API
- Client just receives session token

---

## 🚀 Deployment Environments

### Local Development

```bash
# apps/web - uses .env.local
pnpm dev

# apps/api - uses .dev.vars
pnpm dev
```

### Staging (Preview)

- **web**: Cloudflare Pages (staging branch)
- **api**: Cloudflare Workers (--env staging)
- **Resources**: Staging D1, R2, KV

### Production

- **web**: Cloudflare Pages (main branch)
- **api**: Cloudflare Workers (--env production)
- **Resources**: Production D1, R2, KV

---

## 📋 Quick Setup Checklist

### First Time Setup

- [ ] Copy `apps/api/.dev.vars.example` to `apps/api/.dev.vars`
- [ ] Fill in secrets in `apps/api/.dev.vars`
- [ ] Verify `apps/web/.env.local` has only PUBLIC\_ variables
- [ ] Set staging secrets: `wrangler secret put <NAME> --env staging`
- [ ] Test local dev: `pnpm dev` (from root)

### Adding New Secrets

1. **Determine scope**: Client (PUBLIC\_) or Server (SECRET)?
2. **Add to correct location**:
   - Client → `apps/web/wrangler.toml` + `.env.local`
   - Server → `apps/api/.dev.vars.example` + set via wrangler
3. **Update this guide**

---

## 🔍 Verification

### Check Staging Configuration

```bash
# API secrets
cd apps/api
wrangler secret list --env staging

# API bindings
wrangler d1 list
wrangler r2 bucket list
wrangler kv namespace list
```

### Test Local Setup

```bash
# Run all apps
pnpm dev

# Apps should start:
# - web: http://localhost:4321
# - api: http://localhost:8787
# - admin: http://localhost:5173
```

---

## ❓ Common Questions

### Q: Where do I put database credentials?

**A:** You don't! D1 is bound via wrangler.toml bindings. No credentials needed.

### Q: Can I use environment variables in apps/web for API calls?

**A:** Only PUBLIC\_ prefixed variables. Use `import.meta.env.PUBLIC_API_URL`.

### Q: How do I share secrets between environments?

**A:** Don't share production secrets. Each environment should have unique secrets.

### Q: What if I need a new API key?

**A:** Add to `apps/api/.dev.vars` for local, use `wrangler secret put` for remote.

---

## 🆘 Troubleshooting

### "Turnstile validation failed"

- Check `TURNSTILE_SECRET_KEY` in apps/api
- Verify `PUBLIC_TURNSTILE_SITE_KEY` in apps/web

### "Failed to send email"

- Check `RESEND_API_KEY` in apps/api
- Verify sender address is verified in Resend

### "Database not found"

- Run `wrangler d1 list` to check database ID
- Verify database_id in `apps/api/wrangler.toml`

---

## 📚 Related Documentation

- [Cloudflare Workers Environment Variables](https://developers.cloudflare.com/workers/configuration/environment-variables/)
- [Wrangler Secrets](https://developers.cloudflare.com/workers/wrangler/commands/#secret)
- [Better Auth Configuration](https://better-auth.com/docs/configuration)
- [Resend API](https://resend.com/docs)
- [Cloudflare Turnstile](https://developers.cloudflare.com/turnstile/)

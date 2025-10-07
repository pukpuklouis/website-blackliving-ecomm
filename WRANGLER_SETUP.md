# Wrangler Configuration Setup Guide

> **SECURITY NOTICE**: Wrangler configuration files (`wrangler.toml`) contain sensitive resource IDs and should **NEVER** be committed to version control. This guide explains how to set up your local configuration securely.

## 🔒 What Happened?

Wrangler configuration files were previously tracked in git, exposing:
- Cloudflare D1 Database IDs
- KV Namespace IDs
- R2 Bucket names
- Turnstile site keys
- Worker deployment URLs

**All git history has been cleaned** and these files are now properly gitignored. However, **all exposed resource IDs must be rotated** (see below).

---

## 📋 Quick Setup (For New Developers)

### 1. Copy Template Files

For each app that needs wrangler configuration:

```bash
# API (required)
cd apps/api
cp wrangler.example.toml wrangler.toml

# Web (optional - mainly for Pages preview)
cd apps/web
cp wrangler.example.toml wrangler.toml

# Admin (required)
cd apps/admin
cp wrangler.example.toml wrangler.toml
```

### 2. Get Resource IDs from Team

Ask your team lead for the correct resource IDs to fill in:

**For `apps/api/wrangler.toml`:**
- D1 Database IDs (production and staging)
- KV Namespace IDs (production and staging)
- R2 Bucket names (production and staging)
- Worker URLs (production and staging)

**For `apps/web/wrangler.toml`:**
- Turnstile site key
- API and admin URLs

**For `apps/admin/wrangler.toml`:**
- API URLs
- Site URLs

### 3. Set Secrets (API Only)

Secrets are NEVER stored in wrangler.toml files. Set them via CLI:

```bash
cd apps/api

# Staging secrets
wrangler secret put BETTER_AUTH_SECRET --env staging
wrangler secret put GOOGLE_CLIENT_ID --env staging
wrangler secret put GOOGLE_CLIENT_SECRET --env staging
wrangler secret put JWT_SECRET --env staging
wrangler secret put TURNSTILE_SECRET_KEY --env staging
wrangler secret put RESEND_API_KEY --env staging

# Production secrets (when deploying to prod)
wrangler secret put BETTER_AUTH_SECRET --env production
wrangler secret put GOOGLE_CLIENT_ID --env production
wrangler secret put GOOGLE_CLIENT_SECRET --env production
wrangler secret put JWT_SECRET --env production
wrangler secret put TURNSTILE_SECRET_KEY --env production
wrangler secret put RESEND_API_KEY --env production
```

### 4. Local Development Secrets (.dev.vars)

For local development, create a `.dev.vars` file in `apps/api/`:

```bash
cd apps/api
cat > .dev.vars << 'EOF'
BETTER_AUTH_SECRET=your-dev-secret-here
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
JWT_SECRET=your-dev-jwt-secret
TURNSTILE_SECRET_KEY=your-dev-turnstile-key
RESEND_API_KEY=your-dev-resend-key
EOF
```

**Note**: `.dev.vars` is gitignored and safe for local secrets.

---

## 🔄 For Existing Team Members (After Security Fix)

### ⚠️ IMPORTANT: Pull the Cleaned History

The git history has been rewritten. You **MUST** update your local repository:

```bash
# Save any uncommitted work first!
git stash

# Fetch the new history
git fetch origin

# HARD RESET to the new staging branch (WARNING: This discards local commits)
git checkout staging
git reset --hard origin/staging

# Restore your work
git stash pop
```

**Alternative (if you have local commits to preserve):**

```bash
# Create backup branch
git branch backup-before-history-rewrite

# Fetch and rebase onto new history
git fetch origin
git checkout staging
git rebase origin/staging
```

### Then Follow Quick Setup Steps Above

Your local `wrangler.toml` files still exist, so you can keep using them. But **verify they match the current templates** in case there have been updates.

---

## 🚨 Security Incident Response (Rotate Resources)

**All resource IDs in the previous git history are now considered compromised** and should be rotated:

### 1. Create New Cloudflare Resources

#### D1 Database
```bash
# Create new production database
wrangler d1 create blackliving-db-new

# Migrate data from old database
wrangler d1 export blackliving-db --output backup.sql
wrangler d1 execute blackliving-db-new --file backup.sql

# Update wrangler.toml with new database_id
```

#### KV Namespace
```bash
# Create new KV namespace
wrangler kv:namespace create "CACHE" --env production
wrangler kv:namespace create "CACHE" --env staging

# Copy data (use Cloudflare dashboard bulk export/import)
# Update wrangler.toml with new namespace IDs
```

#### R2 Bucket
```bash
# Create new bucket
wrangler r2 bucket create blackliving-images-new

# Copy objects (use rclone or Cloudflare API)
# Update wrangler.toml with new bucket name
```

#### Turnstile Site Key
1. Go to Cloudflare Dashboard → Turnstile
2. Create new site key
3. Update `apps/web/wrangler.toml` with new key
4. Delete old site key

### 2. Update All wrangler.toml Files

After creating new resources, update all team members' local `wrangler.toml` files with the new IDs.

### 3. Deploy with New Resources

```bash
# Test staging first
cd apps/api
wrangler deploy --env staging

# Then production
wrangler deploy --env production
```

### 4. Decommission Old Resources

After verifying everything works:

```bash
# Delete old D1 database
wrangler d1 delete blackliving-db

# Delete old KV namespace
wrangler kv:namespace delete --namespace-id <old-id>

# Delete old R2 bucket
wrangler r2 bucket delete blackliving-images
```

---

## 📚 Additional Resources

- [Wrangler Documentation](https://developers.cloudflare.com/workers/wrangler/)
- [Secrets Management](https://developers.cloudflare.com/workers/configuration/secrets/)
- [D1 Database Guide](https://developers.cloudflare.com/d1/)
- [KV Storage Guide](https://developers.cloudflare.com/kv/)
- [R2 Storage Guide](https://developers.cloudflare.com/r2/)

---

## ❓ FAQ

**Q: Why can't I see wrangler.toml files in git?**
A: They're now properly gitignored to prevent exposing sensitive IDs.

**Q: How do I share configuration with teammates?**
A: Share the specific resource IDs through a secure channel (password manager, encrypted message). Never commit them to git.

**Q: What if I accidentally commit wrangler.toml?**
A: Stop immediately! Run `git reset HEAD~ && git restore wrangler.toml` before pushing. If already pushed, contact the team lead to rotate resources.

**Q: Do I need wrangler.toml for local development?**
A: Yes for the API. The `wrangler dev` command uses it to connect to Cloudflare resources. Web and Admin can use `.env.local` instead.

**Q: How do I know which environment I'm deploying to?**
A: Use the `--env` flag: `wrangler deploy --env staging` or `wrangler deploy --env production`

---

## ✅ Verification Checklist

After setup, verify:

- [ ] `wrangler.toml` files exist locally in apps/api, apps/web, apps/admin
- [ ] All placeholder values replaced with actual resource IDs
- [ ] `.dev.vars` file created in apps/api with local secrets
- [ ] Secrets set via `wrangler secret put` for staging/production
- [ ] `git status` shows wrangler.toml as "Untracked" (gitignored)
- [ ] Can run `pnpm dev` in apps/api successfully
- [ ] Can deploy to staging: `cd apps/api && wrangler deploy --env staging`

---

**Last Updated**: 2025-01-07
**Incident**: Security breach remediation (wrangler.toml exposure)

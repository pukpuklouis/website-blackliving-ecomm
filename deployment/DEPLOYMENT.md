# Black Living E-commerce Deployment Guide

This guide covers the deployment process for the Black Living e-commerce platform to Cloudflare services.

## Prerequisites

1. **Cloudflare Account** with the following resources created:
   - Workers subscription
   - Pages subscription
   - D1 database (`blackliving-db`)
   - R2 buckets (`blackliving-images-dev`, `blackliving-images-staging`, `blackliving-images-prod`)
   - KV namespace (`CACHE`)

2. **MeiliSearch Instance** (for search functionality):
   - Self-hosted MeiliSearch instance or cloud service
   - Master key for administration
   - Search-only key for frontend queries

2. **Wrangler CLI** installed and authenticated:

   ```bash
   pnpm install -g wrangler
   wrangler login
   ```

3. **Google Cloud Console** OAuth 2.0 credentials set up

## Stage 2.2: Google OAuth Configuration

### 1. Google Cloud Console Setup

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing one
3. Enable Google+ API
4. Go to "Credentials" → "Create Credentials" → "OAuth 2.0 Client IDs"
5. Set authorized redirect URIs:
   - `https://api.blackliving.com/api/auth/callback/google` (production)
   - `https://api-staging.blackliving.com/api/auth/callback/google` (staging)
   - `http://localhost:8787/api/auth/callback/google` (development)

### 2. Set Cloudflare Worker Secrets

```bash
# Production environment
wrangler secret put BETTER_AUTH_SECRET --env production
# Enter a secure random string (at least 32 characters)

wrangler secret put GOOGLE_CLIENT_ID --env production
# Enter your Google OAuth Client ID

wrangler secret put GOOGLE_CLIENT_SECRET --env production
# Enter your Google OAuth Client Secret

# Staging environment (optional)
wrangler secret put BETTER_AUTH_SECRET --env staging
wrangler secret put GOOGLE_CLIENT_ID --env staging
wrangler secret put GOOGLE_CLIENT_SECRET --env staging
```

## Stage 2.3: MeiliSearch Configuration

### 1. MeiliSearch Instance Setup

You can use either a self-hosted MeiliSearch instance or a cloud service:

#### Option A: Self-hosted with Docker
```bash
# Run MeiliSearch with Docker
docker run -p 7700:7700 -e MEILI_MASTER_KEY=masterKey123 getmeili/meilisearch:latest
```

#### Option B: Cloud Service
- Use [MeiliSearch Cloud](https://cloud.meilisearch.com/) or similar service
- Get your instance URL and API keys

### 2. Create Search-Only Key

After setting up MeiliSearch, create a search-only key:

```bash
# Using MeiliSearch HTTP API
curl \
  -X POST 'http://localhost:7700/keys' \
  -H 'Authorization: Bearer masterKey123' \
  -H 'Content-Type: application/json' \
  --data-binary '{
    "description": "Search-only key for frontend",
    "actions": ["search"],
    "indexes": ["*"],
    "expiresAt": null
  }'
```

### 3. Set Cloudflare Worker Secrets

```bash
# Production environment
wrangler secret put MEILISEARCH_HOST --env production
# Enter your MeiliSearch instance URL (e.g., https://meilisearch.anlstudio.cc)

wrangler secret put MEILISEARCH_MASTER_KEY --env production
# Enter your MeiliSearch master key

# Staging environment (optional)
wrangler secret put MEILISEARCH_HOST --env staging
wrangler secret put MEILISEARCH_MASTER_KEY --env staging
```

### 4. Configure Search Indexes

After deployment, configure the search indexes through the admin interface:

1. Go to Admin Settings → Search Configuration
2. Enter your MeiliSearch Host URL and Master Key
3. Click "Save Configuration"
4. Click "Re-index All Content" to populate the search indexes

**Expected Indexes:**
- `products`: Product catalog search
- `posts`: Blog posts and articles
- `pages`: Static pages and content

## Stage 3: Application Deployment

### Method 1: Automated Deployment (Recommended)

Use the provided deployment script:

```bash
# Deploy to production
./deploy.sh production

# Deploy to staging
./deploy.sh staging
```

### Method 2: Manual Deployment

#### Step 1: Build All Applications

```bash
# Install dependencies and build
pnpm install
pnpm type-check
pnpm lint
pnpm build
```

#### Step 2: Deploy API (Cloudflare Workers)

```bash
cd apps/api

# Deploy to production
pnpm wrangler deploy --env production

# Deploy to staging
pnpm wrangler deploy --env staging

cd ../..
```

#### Step 3: Deploy Web Application (Cloudflare Pages)

```bash
cd apps/web

# Deploy to production
pnpm wrangler pages deploy dist --project-name blackliving-web

# Deploy to staging
pnpm wrangler pages deploy dist --project-name blackliving-web-staging

cd ../..
```

#### Step 4: Deploy Admin Application (Cloudflare Pages)

```bash
cd apps/admin

# Deploy to production
pnpm wrangler pages deploy dist --project-name blackliving-admin

# Deploy to staging
pnpm wrangler pages deploy dist --project-name blackliving-admin-staging

cd ../..
```

## Custom Domain Setup

### Cloudflare Pages Custom Domains

1. Go to Cloudflare Dashboard → Pages
2. Select your project
3. Go to "Custom domains" tab
4. Add custom domains:
   - **Web**: `blackliving.com`, `www.blackliving.com`
   - **Admin**: `admin.blackliving.com`
   - **Staging Web**: `staging.blackliving.com`
   - **Staging Admin**: `admin-staging.blackliving.com`

### Workers Custom Domain

1. Go to Cloudflare Dashboard → Workers & Pages
2. Select your API worker
3. Go to "Settings" → "Triggers"
4. Add custom domains:
   - **Production**: `api.blackliving.com`
   - **Staging**: `api-staging.blackliving.com`

## Environment URLs

After deployment, your applications will be available at:

### Production

- **Web**: https://blackliving.com
- **Admin**: https://admin.blackliving.com
- **API**: https://api.blackliving.com

### Staging

- **Web**: https://staging.blackliving.com
- **Admin**: https://admin-staging.blackliving.com
- **API**: https://api-staging.blackliving.com

## GitHub Actions (CI/CD)

The repository includes GitHub Actions workflows for automated deployments:

### Required GitHub Secrets

Add these secrets to your GitHub repository settings:

1. `CLOUDFLARE_API_TOKEN`: Cloudflare API token with necessary permissions

### Workflow Triggers

- **Push to `main`**: Deploys to production
- **Push to `staging`**: Deploys to staging
- **Pull requests**: Runs tests only

## Database Migrations

Ensure your database is up to date before deployment:

```bash
# Run migrations on production database
pnpm -F db db:migrate:prod

# Seed database (if needed)
pnpm -F db db:seed:prod
```

## Monitoring and Logs

### Cloudflare Workers Logs

```bash
# View live logs
wrangler tail --env production
wrangler tail --env staging
```

### Cloudflare Pages Logs

View deployment logs in the Cloudflare Dashboard under Pages → [Project] → Deployments.

## Troubleshooting

### Common Issues

1. **Build failures**: Check that all dependencies are installed and TypeScript compiles
2. **Secret not found**: Ensure all required secrets are set using `wrangler secret put`
3. **Domain not resolving**: Check DNS settings and custom domain configuration
4. **Auth not working**: Verify Google OAuth redirect URIs match your domain
5. **Search not working**: Check MeiliSearch configuration and ensure indexes are populated
6. **MeiliSearch connection failed**: Verify MEILISEARCH_HOST and MEILISEARCH_MASTER_KEY secrets are set correctly

### Debug Commands

```bash
# Check worker status
wrangler dev --env production

# Test database connection
pnpm -F db db:studio

# Verify secrets
wrangler secret list --env production
```

## Rollback Procedures

### Workers Rollback

```bash
# List deployments
wrangler deployments list --env production

# Rollback to specific version
wrangler rollback [DEPLOYMENT_ID] --env production
```

### Pages Rollback

1. Go to Cloudflare Dashboard → Pages → [Project]
2. Go to "Deployments" tab
3. Find the stable deployment
4. Click "Retry deployment" or promote it to production

## Security Checklist

- [ ] All secrets are set in Cloudflare Workers
- [ ] Google OAuth redirect URIs are correctly configured
- [ ] HTTPS is enforced on all domains
- [ ] Database access is restricted to Workers
- [ ] R2 bucket permissions are properly configured
- [ ] CORS is correctly set up for cross-domain requests
- [ ] MeiliSearch master key is securely stored and not exposed to frontend
- [ ] Search-only key is used for frontend queries with minimal permissions
- [ ] MeiliSearch instance is properly secured with authentication

# Local Development Setup with .dev.vars

  1. Create .dev.vars file for API

  apps/api/.dev.vars (this file should NOT be committed):
  # Better Auth Configuration
  BETTER_AUTH_SECRET=your-local-better-auth-secret-32-characters-long
  BETTER_AUTH_URL=http://localhost:8787

  # Google OAuth (get from Google Cloud Console)
  GOOGLE_CLIENT_ID=your-google-client-id.apps.googleusercontent.com
  GOOGLE_CLIENT_SECRET=your-google-client-secret

  # JWT Secret (optional)
  JWT_SECRET=your-local-jwt-secret-32-characters-long

  # Database URLs (for local D1)
  DATABASE_URL=file:./local.db

  2. Create .dev.vars for different environments

  apps/api/.dev.vars.staging:
  BETTER_AUTH_SECRET=your-staging-better-auth-secret
  BETTER_AUTH_URL=https://api-staging.blackliving.com
  GOOGLE_CLIENT_ID=your-staging-google-client-id
  GOOGLE_CLIENT_SECRET=your-staging-google-client-secret
  JWT_SECRET=your-staging-jwt-secret

  3. Update wrangler.toml for local development

  apps/api/wrangler.toml:
  name = "blackliving-api"
  main = "src/index.ts"
  compatibility_date = "2024-09-23"
  compatibility_flags = ["nodejs_compat"]

  [env.development]
  name = "blackliving-api-dev"

  [env.staging]
  name = "blackliving-api-staging"

  [env.production]
  name = "blackliving-api"

  # Local D1 Database (uses --local flag)
  [[d1_databases]]
  binding = "DB"
  database_name = "blackliving-db"
  database_id = "local-db-id"  # This can be anything for local dev

  [[env.development.d1_databases]]
  binding = "DB"
  database_name = "blackliving-db-dev"
  database_id = "local-dev-db-id"

  # Local R2 Storage (uses --local flag)
  [[r2_buckets]]
  binding = "R2"
  bucket_name = "blackliving-images"

  [[env.development.r2_buckets]]
  binding = "R2"
  bucket_name = "blackliving-images-dev"

  # Local KV Storage (uses --local flag)
  [[kv_namespaces]]
  binding = "CACHE"
  id = "local-kv-id"
  preview_id = "local-preview-kv-id"

  [[env.development.kv_namespaces]]
  binding = "CACHE"
  id = "local-dev-kv-id"
  preview_id = "local-dev-preview-kv-id"

  # Public environment variables (can be in version control)
  [vars]
  NODE_ENV = "development"
  API_BASE_URL = "http://localhost:8787"
  WEB_BASE_URL = "http://localhost:4321"

  [env.development.vars]
  NODE_ENV = "development"
  API_BASE_URL = "http://localhost:8787"
  WEB_BASE_URL = "http://localhost:4321"

  [env.staging.vars]
  NODE_ENV = "staging"
  API_BASE_URL = "https://api-staging.blackliving.com"
  WEB_BASE_URL = "https://staging.blackliving.com"

  [env.production.vars]
  NODE_ENV = "production"
  API_BASE_URL = "https://api.blackliving.com"
  WEB_BASE_URL = "https://blackliving.com"

  4. Frontend Environment Files

  apps/web/.env.local (not committed):
  PUBLIC_API_URL=http://localhost:8787

  apps/admin/.env.local (not committed):
  VITE_API_URL=http://localhost:8787

  5. Generate Local Secrets

  # Generate secrets for your .dev.vars file
  echo "BETTER_AUTH_SECRET=$(openssl rand -base64 32)"
  echo "JWT_SECRET=$(openssl rand -base64 32)"

  6. Development Commands

  Start all apps locally:
  # From project root
  pnpm dev

  Start API with local Cloudflare services:
  # From apps/api directory
  pnpm dev --local  # This uses local D1, R2, KV instead of remote

  Start API with staging environment:
  # From apps/api directory  
  pnpm wrangler dev --env staging --local
  # Or using environment variable
  CLOUDFLARE_ENV=staging pnpm dev

  7. Database Setup for Local Development

  # From apps/api directory
  # Create local database and run migrations
  pnpm wrangler d1 migrations apply blackliving-db --local

  # Or for development environment
  pnpm wrangler d1 migrations apply blackliving-db-dev --env development --local

  8. Update .gitignore

  Make sure these files are ignored:

  .gitignore (add these lines):
  # Local environment files
  .dev.vars
  .dev.vars.*
  .env.local
  .env.*.local

  # Local Wrangler state
  .wrangler/

  9. Package.json Scripts Update

  apps/api/package.json:
  {
    "scripts": {
      "dev": "wrangler dev --local",
      "dev:staging": "wrangler dev --env staging --local",
      "dev:remote": "wrangler dev",
      "build": "wrangler deploy --dry-run",
      "deploy": "wrangler deploy",
      "deploy:staging": "wrangler deploy --env staging"
    }
  }

  10. Complete Local Setup Process

  # 1. Clone repo and install dependencies
  git clone <repo>
  cd website-blackliving-ecomm
  pnpm install

  # 2. Create .dev.vars file
  cd apps/api
  cp .dev.vars.example .dev.vars  # If you create an example file
  # Or create manually with the secrets above

  # 3. Set up local database
  pnpm wrangler d1 migrations apply blackliving-db --local

  # 4. Start development
  cd ../..
  pnpm dev

  Benefits of Using .dev.vars:

  ✅ Local-only secrets - Never accidentally commit secrets✅ Per-environment 
  configs - Easy switching between local/staging/prod✅ No remote dependencies -
  Works completely offline with --local flag✅ Fast development - No network
  calls to Cloudflare services✅ Team-friendly - Each developer has their own
  local config

  Google OAuth Setup for Local

  For local development, add these redirect URIs in Google Cloud Console:
  - http://localhost:8787/api/auth/callback/google
  - http://localhost:4321/api/auth/callback/google
# Essential Development Commands

## Primary Development Commands (Run from Root)

### Core Development Workflow

```bash
# Start all applications in development mode
pnpm dev

# Start individual applications (if needed)
pnpm dev-web      # Astro web app on localhost:4321
pnpm dev-admin    # React admin on localhost:5173
pnpm dev-api      # Cloudflare Worker API on localhost:8787

# Build all applications for production
pnpm build

# Type check all applications
pnpm type-check

# Lint all code
pnpm lint

# Format all code
pnpm format
pnpm format:check  # Check formatting without changes
```

### Database Operations

```bash
# Database studio (includes local sync)
pnpm db:studio

# Sync local database from schema
pnpm db:sync

# Individual database commands (run from packages/db/)
cd packages/db
pnpm db:studio:local     # Drizzle Studio for local DB
pnpm db:studio:remote    # Drizzle Studio for remote DB
pnpm db:generate         # Generate migrations
pnpm db:push            # Push schema changes
pnpm db:seed:local      # Seed local database
pnpm db:migrate:local   # Apply migrations locally
```

## Application-Specific Commands

### Web App (Astro) - `/apps/web/`

```bash
cd apps/web

# Development
pnpm dev                    # Start dev server (localhost:4321)
pnpm build                  # Build for production
pnpm build:staging         # Build for staging environment
pnpm preview               # Preview with Wrangler Pages
pnpm preview:astro         # Preview with Astro

# Quality Checks
pnpm type-check            # Astro check (TypeScript + Astro)
pnpm format                # Format TypeScript/React files
pnpm format:astro          # Fix Astro className issues

# Deployment
pnpm deploy                # Deploy to production (Cloudflare Pages)
pnpm deploy:staging        # Deploy to staging
```

### Admin App (React Router) - `/apps/admin/`

```bash
cd apps/admin

# Development
pnpm dev                   # Start dev server (localhost:5173)
pnpm build                 # Build for production
pnpm build:staging         # Build for staging
pnpm start                 # Start production server
pnpm typecheck             # Generate types + TypeScript check

# Deployment
pnpm deploy                # Deploy to production
pnpm deploy:staging        # Deploy to staging
```

### API (Cloudflare Workers) - `/apps/api/`

```bash
cd apps/api

# Development
pnpm dev                   # Start local Wrangler dev (localhost:8787)
pnpm dev:staging           # Dev with staging environment
pnpm dev:remote            # Dev with remote Cloudflare

# Testing
pnpm test                  # Run all tests
pnpm test:unit             # Unit tests only
pnpm test:integration      # Integration tests
pnpm test:watch            # Watch mode
pnpm test:coverage         # With coverage report

# Quality
pnpm type-check            # TypeScript check
pnpm lint                  # ESLint

# Deployment
pnpm build                 # Dry run deployment
pnpm deploy                # Deploy to production
pnpm deploy:staging        # Deploy to staging

# Secrets Management
pnpm secret:put            # Set production secrets
pnpm secret:put:staging    # Set staging secrets
```

## System Commands (macOS/Darwin)

### Git Operations

```bash
git status                 # Check working tree status
git add .                  # Stage all changes
git commit -m "message"    # Commit changes
git push                   # Push to remote
git pull                   # Pull latest changes
```

### File System

```bash
ls -la                     # List files with details
find . -name "*.ts"        # Find TypeScript files
rg "pattern"               # Search content (ripgrep - faster than grep)
cd path/to/directory       # Change directory
mkdir dirname              # Create directory
touch filename             # Create file
rm filename                # Remove file
```

### Process Management

```bash
ps aux | grep node         # Find Node processes
lsof -i :4321             # Check what's using port 4321
kill -9 PID               # Force kill process
```

## Package Management (PNPM Only)

### Workspace Commands

```bash
# Install dependencies (from root)
pnpm install

# Add dependency to specific workspace
pnpm add package-name --filter web
pnpm add package-name --filter admin
pnpm add package-name --filter api

# Add dev dependency
pnpm add -D package-name

# Remove dependency
pnpm remove package-name --filter workspace-name
```

### Turbo Commands

```bash
# Run commands across workspaces
turbo run build           # Build all apps
turbo run dev             # Dev all apps
turbo run lint            # Lint all apps
turbo run test            # Test all apps
turbo run clean           # Clean build artifacts

# Run for specific workspace
turbo run build --filter web
turbo run dev --filter admin
```

## Quality Assurance Pipeline

### Pre-Commit Checklist

```bash
pnpm format               # Format all code
pnpm lint                 # Check linting rules
pnpm type-check           # Verify TypeScript types
pnpm build                # Ensure build succeeds
pnpm test                 # Run test suites
```

### Deployment Checklist

```bash
pnpm format:check         # Verify formatting
pnpm lint                 # Check code quality
pnpm type-check           # Verify types
pnpm build                # Test production build
pnpm test                 # Run full test suite
```

## Troubleshooting Commands

### Common Issues

```bash
# Clear package manager cache
pnpm store prune

# Reinstall dependencies
rm -rf node_modules
rm pnpm-lock.yaml
pnpm install

# Check port conflicts
lsof -i :4321             # Web app port
lsof -i :5173             # Admin app port
lsof -i :8787             # API port

# Database issues
pnpm db:sync              # Resync local database
```

### Environment Issues

```bash
node --version            # Check Node version (should be >=18)
pnpm --version            # Check PNPM version (should be >=8)
wrangler --version        # Check Wrangler CLI
```

## Important Notes

- **Always use PNPM**: Never use npm or yarn in this project
- **Run from root**: Most commands should be executed from project root
- **Port conflicts**: Ensure ports 4321, 5173, and 8787 are available
- **Cloudflare CLI**: Some API commands require `wrangler` authentication
- **Database sync**: Always run `pnpm db:sync` before database operations

# Task Completion Checklist

## When a Development Task is Completed

### Code Quality Checks (Always Required)

```bash
# 1. Format all code
pnpm format

# 2. Run linting
pnpm lint

# 3. Type check all applications
pnpm type-check

# 4. Build verification
pnpm build
```

### Testing Requirements

```bash
# 5. Run relevant tests
pnpm test                 # All tests
# OR for specific component:
cd apps/api && pnpm test:unit
cd apps/admin && pnpm test  # If Playwright tests exist
```

### Database Changes

If database schema or data was modified:

```bash
# 6. Generate migrations (if schema changed)
cd packages/db && pnpm db:generate

# 7. Test migration locally
cd packages/db && pnpm db:migrate:local

# 8. Verify with database studio
pnpm db:studio
```

### Application-Specific Verification

#### Web App Changes

```bash
cd apps/web
pnpm type-check           # Astro-specific checks
pnpm build                # Verify Astro build
pnpm preview              # Test production build locally
```

#### Admin Dashboard Changes

```bash
cd apps/admin
pnpm typecheck            # React Router type generation
pnpm build                # Verify React Router build
```

#### API Changes

```bash
cd apps/api
pnpm type-check           # Worker TypeScript check
pnpm test:integration     # API integration tests
pnpm build                # Wrangler dry-run deploy
```

## Documentation Updates

### When to Update Documentation

- **New Features**: Update README, API docs, component docs
- **API Changes**: Update API endpoint documentation
- **Schema Changes**: Update database schema documentation
- **Configuration Changes**: Update setup/deployment guides
- **New Dependencies**: Update tech stack documentation

### Files to Consider

- `README.md` (if it exists)
- `CLAUDE.md` (project instructions)
- Component JSDoc comments
- API endpoint comments
- Database schema comments

## Git Workflow

### Pre-Commit Standards

```bash
# Verify all checks pass
pnpm format:check         # Formatting is correct
pnpm lint                 # No linting errors
pnpm type-check           # No TypeScript errors
pnpm build                # Build succeeds
```

### Commit Message Standards

Follow conventional commits format:

- `feat:` new features
- `fix:` bug fixes
- `chore:` maintenance tasks
- `docs:` documentation updates
- `style:` formatting changes
- `refactor:` code restructuring
- `test:` test additions/updates

### Branch Management

- **Current Branch**: staging
- **Feature Branches**: Create from staging for new features
- **Hotfix Branches**: For critical production fixes
- **PR Requirements**: All quality checks must pass

## Deployment Considerations

### Staging Deployment

```bash
# Web app
cd apps/web && pnpm deploy:staging

# Admin app
cd apps/admin && pnpm deploy:staging

# API
cd apps/api && pnpm deploy:staging
```

### Production Deployment

Only after thorough staging testing:

```bash
# Ensure secrets are set (API only)
cd apps/api && pnpm secret:put

# Deploy applications
cd apps/web && pnpm deploy
cd apps/admin && pnpm deploy
cd apps/api && pnpm deploy
```

## Performance Checks

### Bundle Analysis (Web App)

```bash
cd apps/web
pnpm build                # Check build output size
pnpm preview              # Test performance locally
```

### API Performance

```bash
cd apps/api
pnpm test:integration     # Test response times
pnpm dev:remote           # Test with Cloudflare edge
```

## Security Checklist

### Code Security

- No hardcoded secrets or API keys
- Proper input validation with Zod schemas
- Authentication checks on protected routes
- CORS configuration for API endpoints

### Dependency Security

```bash
pnpm audit                # Check for vulnerable packages
pnpm audit --fix          # Fix auto-fixable vulnerabilities
```

## Monorepo Considerations

### Workspace Dependencies

- Verify shared package changes don't break dependent apps
- Test cross-package type definitions
- Ensure workspace:\* references are correct

### Cache Management

```bash
turbo run build --force   # Force rebuild all apps
pnpm store prune          # Clean package cache if needed
```

## Final Verification

### End-to-End Testing

1. **Web App**: Navigate key user flows (product pages, cart, checkout)
2. **Admin App**: Test management functions (CRUD operations)
3. **API**: Verify endpoints respond correctly
4. **Database**: Confirm data integrity and relationships

### Cross-App Integration

- API endpoints work with web app
- Admin changes reflect in web app
- Authentication flows across all apps
- Shared UI components render correctly

This checklist ensures all code changes meet the project's quality standards and don't break existing functionality.

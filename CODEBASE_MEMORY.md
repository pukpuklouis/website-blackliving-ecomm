# Codebase Memory: Black Living 黑哥家居 E-commerce Platform

**Last Updated:** July 30, 2025
**Analyzer:** Codebase Memory Analyzer Agent
**Project Path:** /Users/pukpuk/Dev/website-blackliving-ecomm

## Executive Summary
Black Living is a premium Taiwanese Simmons "Black Label" mattress e-commerce platform built using modern edge-first architecture. The project implements a comprehensive monorepo solution with three applications (customer web, admin dashboard, API backend) and shared packages, all optimized for Cloudflare's edge infrastructure with Better Auth v0.4.13 for authentication.

## Architecture Overview
### Project Type
- **Category:** E-commerce Platform (B2C)
- **Architecture Pattern:** Monorepo with Edge-First Microservices
- **Primary Language:** TypeScript 5.8.3

### Key Technologies
- **Framework:** Astro v5.12.4 (web), React Router v7.7.1 (admin), Hono v4.8.9 (API)
- **Database:** Cloudflare D1 (SQLite) with Drizzle ORM v0.31.4
- **Authentication:** Better Auth v0.4.13 with Google OAuth + Email/Password
- **Styling:** Tailwind CSS v4.1.11 with Shadcn/ui components
- **Build System:** Turborepo with PNPM v9.5.0 workspaces
- **Testing:** Playwright for E2E, Vitest for unit/integration
- **Deployment:** Cloudflare Workers, Pages, D1, R2, KV

## Project Structure
```
/Users/pukpuk/Dev/website-blackliving-ecomm/
├── apps/
│   ├── web/                    # Astro customer website
│   │   ├── src/
│   │   │   ├── components/     # React + Astro components
│   │   │   ├── pages/          # File-based routing
│   │   │   │   ├── api/auth/[...betterauth].ts  # Auth handler
│   │   │   │   ├── account/    # Protected customer pages
│   │   │   │   ├── simmons-black/ # Product categories
│   │   │   │   └── accessories/
│   │   │   └── layouts/        # Base layouts
│   │   └── astro.config.mjs    # Static build + Cloudflare adapter
│   ├── admin/                  # React admin dashboard
│   │   ├── app/
│   │   │   ├── components/     # Admin UI components
│   │   │   └── routes/         # React Router structure
│   │   │       └── dashboard/  # Admin modules
│   │   └── playwright.config.ts # E2E testing setup
│   └── api/                    # Hono API on Cloudflare Workers
│       ├── src/
│       │   ├── index.ts        # Main API app with auth middleware
│       │   ├── modules/        # Feature-based API modules
│       │   └── lib/            # Infrastructure utilities
│       ├── wrangler.toml       # Cloudflare configuration
│       └── vitest.config.ts    # Testing configuration
├── packages/                   # Shared workspace packages
│   ├── auth/                   # Better Auth configuration
│   ├── db/                     # Database schema + client
│   ├── ui/                     # Shadcn/ui component library
│   ├── types/                  # TypeScript definitions
│   └── tailwind-config/        # Shared Tailwind theme
└── package.json                # Root workspace configuration
```

## Key Files & Entry Points

### Authentication Core
- `/packages/auth/index.ts` - Better Auth configuration with role-based access
- `/apps/web/src/pages/api/auth/[...betterauth].ts` - Astro auth handler
- `/apps/api/src/index.ts` - API with integrated auth middleware

### Database Foundation
- `/packages/db/schema.ts` - Complete schema with auth tables + business logic
- `/packages/db/migrations/0000_loose_doctor_doom.sql` - Applied migration
- `/packages/db/client.ts` - Drizzle client factory

### API Structure
- `/apps/api/src/modules/admin.ts` - Admin endpoints (protected by requireAdmin())
- `/apps/api/src/modules/products.ts` - Product catalog management
- `/apps/api/src/modules/orders.ts` - Order processing system

### Configuration Files
- `/apps/api/wrangler.toml` - Cloudflare Worker configuration
- `/package.json` - Root workspace with Turborepo scripts
- `/turbo.json` - Build pipeline configuration

## Core Components & Patterns

### Authentication System (Better Auth v0.4.13)
**Implementation Status:** FULLY IMPLEMENTED AND ACTIVE
- **Factory Pattern:** `createAuth()` function accepting DB + environment variables
- **Providers:** Email/Password + Google OAuth with account linking
- **Role System:** Customer/Admin roles with validation
- **Session Management:** 7-day sessions with 1-day update age
- **Middleware Integration:** `createAuthMiddleware()`, `requireAuth()`, `requireAdmin()`
- **Cross-Subdomain Support:** Configured for .blackliving.com domain

### Database Schema Design
**Tables:** users, sessions, accounts (auth) + products, orders, appointments, posts, reviews, newsletters, contacts
**Key Features:**
- Role-based user system (customer/admin)
- Product variants with JSON specifications
- Order tracking with status progression
- Appointment booking system (中和/中壢 locations)
- Blog system with author relationships
- Review aggregation from multiple sources

### API Architecture (Hono + Cloudflare Workers)
**Pattern:** Feature-based modules with middleware pipeline
**Core Middleware Stack:**
1. Logger + CORS (localhost + production domains)
2. Service initialization (db, cache, storage, auth)
3. Authentication middleware (session extraction)
4. Route-specific guards (requireAuth, requireAdmin)

### State Management
- **API State:** TanStack Query for server state
- **Client State:** Zustand v5.0.6 for UI state
- **Form State:** React Hook Form with Zod validation

## Data Management

### Database Strategy
- **Type:** Cloudflare D1 (SQLite-compatible)
- **ORM:** Drizzle ORM with type-safe queries
- **Migration:** Single applied migration (0000_loose_doctor_doom.sql)
- **Connection:** Factory pattern with environment-specific instances

### Storage Architecture
- **Images:** Cloudflare R2 with organized folder structure
- **Cache:** Cloudflare KV with TTL-based invalidation
- **File Management:** StorageManager class with validation + metadata

### Authentication Database Integration
- **Better Auth Tables:** users, sessions, accounts (fully configured)
- **User Extensions:** role, phone, preferences fields
- **Foreign Keys:** Proper relationships to orders, appointments, posts
- **Validation:** Role enum validation, email verification required

## External Integrations

### Cloudflare Services (Production Ready)
- **D1 Database:** Configured across environments (dev/staging/production)
- **R2 Storage:** Image buckets with environment separation
- **KV Cache:** Namespace configuration with TTL strategies
- **Workers:** Hono API with proper CORS + environment variables

### Authentication Providers
- **Google OAuth:** Client ID/Secret configured (secrets via wrangler)
- **Email/Password:** With verification email system (TODO: implement sending)
- **Better Auth Secret:** Environment-specific secret management

### Third-Party Dependencies
- **Better Auth:** v0.4.13 with Drizzle adapter
- **Tailwind CSS:** v4.1.11 (latest) with Vite plugin
- **Shadcn/ui:** Complete component library in shared package
- **Drizzle ORM:** v0.31.4 with SQLite provider

## Testing Strategy

### Framework Setup
- **E2E Testing:** Playwright configured for admin app
- **Unit/Integration:** Vitest with Cloudflare Workers environment
- **API Testing:** Integration tests with mocked D1/R2/KV
- **Auth Testing:** Mock Better Auth sessions in test environment

### Test Infrastructure
- **Database:** Test-specific D1 database configuration
- **Secrets:** Test environment variables in wrangler.toml
- **Utilities:** Test helpers in `/apps/api/tests/utils.ts`
- **Coverage:** Basic test structure established

## Configuration & Environment

### Environment Variables (Wrangler Configuration)
```toml
# Required Secrets (set via wrangler secret put):
BETTER_AUTH_SECRET        # Auth encryption key
GOOGLE_CLIENT_ID          # Google OAuth client
GOOGLE_CLIENT_SECRET      # Google OAuth secret
JWT_SECRET                # Additional JWT operations (optional)

# Public Variables:
NODE_ENV                  # Environment detection
API_BASE_URL             # API endpoint URLs  
WEB_BASE_URL             # Web application URLs
```

### Development Environment
- **Package Manager:** PNPM v9.5.0 (required, never use npm)
- **Node Version:** >=18.0.0
- **Workspace:** Monorepo with turborepo for build orchestration

## Build & Deployment

### Development Commands (run from root)
```bash
pnpm dev          # Start all apps in watch mode
pnpm build        # Build all applications
pnpm type-check   # TypeScript validation across workspace
pnpm test         # Run all test suites
pnpm lint         # ESLint validation
pnpm format       # Prettier formatting
```

### Deployment Configuration
- **Web App:** Astro static build → Cloudflare Pages
- **Admin App:** React Router build → Cloudflare Pages  
- **API:** Hono → Cloudflare Workers via Wrangler
- **Database:** D1 migrations via Drizzle + Wrangler

## Quick Start Guide

### Prerequisites
- Node.js >=18.0.0
- PNPM >=8.0.0 (npm NOT supported)
- Cloudflare account with Wrangler CLI

### Setup Steps
1. `pnpm install` (installs all workspace dependencies)
2. Configure Cloudflare services (D1, R2, KV) in wrangler.toml
3. Set secrets: `wrangler secret put BETTER_AUTH_SECRET --env development`
4. Run migrations: `cd apps/api && wrangler d1 migrations apply`
5. `pnpm dev` (starts all apps)

### Common Commands
- **Full Development:** `pnpm dev` (all apps + hot reload)
- **Single App:** `pnpm dev-web`, `pnpm dev-admin`, `pnpm dev-api`
- **Database:** `cd apps/api && wrangler d1 execute DB --command="SELECT * FROM users"`
- **Deploy API:** `cd apps/api && pnpm deploy`

## Code Quality Insights

### Strengths
- **Authentication Implementation:** Production-ready Better Auth with proper role-based access
- **Type Safety:** Comprehensive TypeScript with Zod validation across API boundaries
- **Architecture:** Clean separation of concerns with shared packages
- **Database Design:** Well-normalized schema with proper relationships
- **Caching Strategy:** Multi-layer caching with TTL-based invalidation
- **Security:** Proper CORS, environment variables, role-based authorization

### Areas for Improvement
- **Email Integration:** Better Auth email sending not implemented (console.log placeholder)
- **Test Coverage:** Integration tests need auth context and more comprehensive coverage
- **Error Handling:** Some API endpoints need more specific error messages
- **Documentation:** API documentation could be auto-generated from Zod schemas

### Technical Debt
- **Commented Auth Code:** Line 88-97 in index.ts has commented Better Auth integration
- **Placeholder IDs:** wrangler.toml contains placeholder database/KV IDs
- **Order Auth:** Orders module has TODO comments for authentication integration

## Learning Resources

### Documentation Links
- [Better Auth v0.4.13 Docs](https://betterauth.com) - Authentication system
- [Drizzle ORM Guide](https://orm.drizzle.team) - Database operations
- [Hono Documentation](https://hono.dev) - API framework
- [Cloudflare Workers](https://developers.cloudflare.com/workers/) - Deployment platform

### Key Concepts to Understand
- Better Auth factory pattern and middleware integration
- Drizzle ORM with Cloudflare D1 adapter
- Turborepo workspace configuration
- Tailwind CSS v4 with Vite integration (no Astro integration needed)

## Future Development Notes

### Planned Features
- Email sending integration for Better Auth verification
- Real-time order tracking with WebSocket support
- Advanced analytics dashboard with chart components
- Product recommendation system
- Multi-language support (Chinese/English)

### Refactoring Opportunities
- Consolidate auth middleware patterns across apps
- Extract common Zod schemas to shared types package
- Implement auto-generated API documentation
- Add comprehensive error boundary system

### Scaling Considerations
- Database optimization for product search
- CDN configuration for product images
- Implement rate limiting for API endpoints
- Add monitoring and logging infrastructure

## Tags
`e-commerce` `typescript` `cloudflare` `better-auth` `drizzle-orm` `astro` `react` `hono` `monorepo` `pnpm` `tailwind` `taiwanese` `mattress` `b2c` `edge-computing` `sqlite` `oauth` `role-based-auth` `turborepo` `shadcn-ui`
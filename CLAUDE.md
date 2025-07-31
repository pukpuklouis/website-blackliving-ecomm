# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is an e-commerce website for **Black Living 黑哥家居**, a Taiwanese premium Simmons "Black Label" mattress retailer. The project is in planning phase and will be built using a modern edge-first architecture with Cloudflare services.

## Planned Architecture

The project will use a **Monorepo structure** with three main applications:

### `/apps/web/` - Customer Website (Astro)
- **Framework**: Astro with React islands
- **Styling**: Tailwind CSS + Shadcn components
- **Authentication**: Better Auth integration
- **Key Pages**:
  - Homepage with hero slider, brand story, product categories
  - Product pages: `/simmons-black/`, `/accessories/`, `/us-imports/`
  - Customer account area (protected by Better Auth)
  - Appointment booking system

### `/apps/admin/` - Management Dashboard (React SPA)
- **Framework**: Vite + React Router
- **UI**: Shadcn/ui components
- **Data Management**: TanStack Query + TanStack Table
- **Features**: Product management, order management, blog composer (Novel.sh editor)

### `/apps/api/` - Backend Services (Cloudflare Workers)
- **Framework**: Hono web framework
- **Database**: Cloudflare D1 (SQLite) with Drizzle ORM
- **Storage**: Cloudflare R2 for images
- **Cache**: Cloudflare KV for API responses
- **Auth**: Better Auth middleware integration

### Shared Packages (`/packages/`)
- `/packages/auth`: 共享的 Better Auth 認證設定。
- `/packages/db`: 共享的 Drizzle ORM Schema 與資料庫客戶端。
- `/packages/ui`: 共享的 Shadcn/ui 元件庫。
- `/packages/types`: 共享的 TypeScript 型別定義。
- `/packages/tailwind-config`: 共享的 Tailwind CSS 主題與設定。

## Key Features & Requirements

### Technical Implementation
- **SEO**: Centralized SEO.astro component for meta tags, Open Graph, schema markup


## Development Guidelines

- Follow the planned monorepo structure when implementing
- Use Cloudflare services (D1, R2, KV, Workers) for backend infrastructure
- Implement Better Auth for all authentication needs
- Use Drizzle ORM for database operations
- Apply Shadcn/ui components for consistent UI
- Ensure mobile-responsive design
- Implement proper SEO with structured data
- Use Zod for runtime data validation
- Follow Taiwanese e-commerce UX patterns

## Development Environment & Setup

### Package Manager & Workspace
- **Package Manager**: PNPM (v9.5.0+) - `packageManager: "pnpm@9.5.0"`
- **Workspace Configuration**: Monorepo using PNPM workspaces
- **Build System**: Turborepo for efficient builds and caching
- **Node Version**: >=18.0.0

### Tech Stack Summary

#### Frontend Technologies
- **Web App**: Astro v5.12.4 with React v19.1.0 islands
- **Admin App**: React Router v7.7.1 with React v19.1.0
- **Styling**: Tailwind CSS v4.1.11 (latest version)
- **UI Components**: Shadcn/ui components in shared workspace packages
- **State Management**: Zustand v5.0.6
- **Type Safety**: TypeScript v5.8.3 with Zod v3/v4 validation

#### Backend Technologies  
- **API Framework**: Hono v4.8.9 on Cloudflare Workers
- **Database**: Cloudflare D1 with Drizzle ORM v0.31.4
- **Storage**: Cloudflare R2 buckets for images
- **Cache**: Cloudflare KV storage
- **Deployment**: Wrangler v4.26.0

#### Development Tools
- **Linting**: ESLint v9.0.0 with TypeScript support
- **Formatting**: Prettier v3.6.2 with Astro plugin
- **Testing**: Playwright for E2E testing
- **Type Checking**: TypeScript strict mode across all apps

### Available Scripts

#### Root Level Commands (use these for development)
```bash
# Development - starts all apps in watch mode
pnpm dev

# Build all applications
pnpm build  

# Lint all code
pnpm lint

# Type check all applications  
pnpm type-check

# Format all code
pnpm format

# Clean build artifacts
pnpm clean

# Run tests
pnpm test
```

#### Individual App Commands (if needed)
```bash
# Web app (Astro)
cd apps/web
pnpm dev          # Start dev server at localhost:4321
pnpm build        # Build for production (includes Astro check)
pnpm preview      # Preview production build

# Admin app (React Router)  
cd apps/admin
pnpm dev          # Start dev server with --host flag
pnpm build        # Build for production
pnpm typecheck    # Type check and generate types

# API (Cloudflare Workers)
cd apps/api  
pnpm dev          # Start Wrangler dev server
pnpm build        # Dry run deployment
pnpm deploy       # Deploy to Cloudflare
pnpm type-check   # TypeScript check without emit
```

### Environment Configuration

#### Cloudflare Worker Configuration (apps/api/wrangler.toml)
- **D1 Database**: `blackliving-db` bound as `DB`
- **R2 Storage**: `blackliving-images` bound as `R2` 
- **KV Cache**: Bound as `CACHE`
- **Environments**: development, staging, production

#### Important Notes
- **Never use npm** - this project uses PNPM exclusively
- **Never install packages individually** - use workspace dependencies
- **Always run commands from root** unless specifically working on single app
- **Astro uses Tailwind v4** - no @astrojs/tailwind integration needed
- **Shared packages** use workspace:* references for internal dependencies

### Deployment Configuration
- **Web**: Static build with Cloudflare Pages adapter
- **Admin**: React Router with Vite build  
- **API**: Cloudflare Workers with Wrangler
- **Secrets**: Set via `wrangler secret put` for production
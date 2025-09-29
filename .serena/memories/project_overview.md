# Black Living E-commerce Platform - Project Overview

## Project Purpose

**Black Living 黑哥家居** is a premium Taiwanese e-commerce platform specializing in Simmons "Black Label" mattresses and home accessories. The project is designed as a modern, edge-first architecture leveraging Cloudflare's ecosystem for optimal performance and scalability.

## Architecture Overview

The project uses a **monorepo structure** with three main applications and shared packages:

### Applications (`/apps/`)

#### `/apps/web/` - Customer Website (Astro v5.12.4)

- **Framework**: Astro with React v19.1.1 islands architecture
- **Styling**: Tailwind CSS v4.1.11 (no @astrojs/tailwind integration needed)
- **Deployment**: Cloudflare Pages with SSR adapter
- **Port**: localhost:4321
- **Key Features**: Product catalog, appointment booking, customer accounts

#### `/apps/admin/` - Management Dashboard (React Router v7.7.1)

- **Framework**: React Router v7 with React v19.1.1
- **UI**: Shadcn/ui components with Tailwind v4
- **Build**: Vite v6.3.5 + TypeScript v5.9.2
- **Port**: localhost:5173
- **Features**: Product management, order management, blog editor (Novel.sh)

#### `/apps/api/` - Backend Services (Cloudflare Workers)

- **Framework**: Hono v4.8.9 web framework
- **Runtime**: Cloudflare Workers
- **Port**: localhost:8787
- **Deployment**: Wrangler v4.26.0

### Shared Packages (`/packages/`)

- **`@blackliving/auth`**: Better Auth integration across all apps
- **`@blackliving/db`**: Drizzle ORM v0.44.4 with Cloudflare D1 SQLite
- **`@blackliving/ui`**: Shadcn/ui component library
- **`@blackliving/types`**: Shared TypeScript type definitions
- **`@blackliving/tailwind-config`**: Shared Tailwind CSS theme configuration

## Infrastructure & Services

### Cloudflare Services

- **D1 Database**: `blackliving-db` for data persistence
- **R2 Storage**: `blackliving-images` for media assets
- **KV Cache**: Performance optimization for API responses
- **Workers**: Serverless compute for API endpoints
- **Pages**: Static site hosting with edge optimization

### Development Environment

- **Package Manager**: PNPM v10.15.0 (strict requirement)
- **Build System**: Turborepo v2.5.6 for monorepo orchestration
- **Node Version**: >=18.0.0
- **TypeScript**: v5.8.3 with strict mode across all apps

## Key Technologies

### Frontend Stack

- **Astro v5.12.4**: Static site generation with React islands
- **React v19.1.1**: Interactive components and state management
- **Tailwind v4.1.11**: Utility-first CSS framework
- **Zustand v5.0.6**: Lightweight state management
- **Lucide React**: Icon system with custom tree-shaking resolver

### Backend Stack

- **Hono v4.8.9**: Fast web framework for Cloudflare Workers
- **Drizzle ORM v0.44.4**: Type-safe database operations
- **Better Auth**: Authentication system across all applications
- **Zod v3/v4**: Runtime type validation

### Development Tools

- **ESLint v9.0.0**: Code linting with TypeScript support
- **Prettier v3.6.2**: Code formatting with Astro plugin
- **Playwright**: End-to-end testing framework
- **Vitest v3.2.4**: Unit and integration testing

## Project Status

- **Current Branch**: staging
- **Main Branch**: (not specified - typically main/master)
- **Repository Status**: Clean working directory
- **Phase**: Active development with established architecture

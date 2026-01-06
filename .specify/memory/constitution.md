<!--
Sync Impact Report:
- Version change: 0.0.0 → 1.0.0
- List of modified principles:
  - [PRINCIPLE_1_NAME] → I. Monorepo Structure
  - [PRINCIPLE_2_NAME] → II. Edge-First Architecture
  - [PRINCIPLE_3_NAME] → III. Test-Driven Development
  - [PRINCIPLE_4_NAME] → IV. API-First Design
  - [PRINCIPLE_5_NAME] → V. Shared UI Components
- Added sections:
  - Technology Stack
  - Development Workflow
- Removed sections: None
- Templates requiring updates:
  - ✅ .specify/templates/plan-template.md
  - ✅ .specify/templates/spec-template.md
  - ✅ .specify/templates/tasks-template.md
- Follow-up TODOs: None
-->
# Black Living E-commerce Website Constitution

## Core Principles

### I. Monorepo Structure
The project will use a Monorepo structure with three main applications: `/apps/web/`, `/apps/admin/`, and `/apps/api/`. Shared packages will be located in `/packages/`.

### II. Edge-First Architecture
The project will be built using a modern edge-first architecture with Cloudflare services (Workers, D1, R2, KV).

### III. Test-Driven Development
TDD is mandatory. Tests are written, user-approved, and fail before implementation. The Red-Green-Refactor cycle is strictly enforced.

### IV. API-First Design
The backend API will be designed and implemented first, using Hono and Cloudflare Workers. The frontend applications will consume the API.

### V. Shared UI Components
A shared UI component library will be created in `/packages/ui` using Shadcn/ui components to ensure a consistent user experience across all applications.

## Technology Stack

The technology stack is defined in `CLAUDE.md` and includes Astro, React, Hono, Cloudflare services, Drizzle ORM, and PNPM.

## Development Workflow

The development workflow is defined in `CLAUDE.md` and includes using PNPM workspaces, Turborepo for builds, and running commands from the root of the monorepo.

## Governance

All pull requests and reviews must verify compliance with the constitution. Complexity must be justified. Use `CLAUDE.md` for runtime development guidance.

**Version**: 1.0.0 | **Ratified**: 2025-10-30 | **Last Amended**: 2025-10-30
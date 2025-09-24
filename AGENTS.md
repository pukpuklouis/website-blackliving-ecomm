# Agents

Specialized agents that do heavy work and return concise summaries to preserve context.

## Core Philosophy

> “Don't anthropomorphize subagents. Use them to organize your prompts and elide context. Subagents are best when they can do lots of work but then provide small amounts of information back to the main conversation thread.”
>
> – Adam Wolff, Anthropic

## Available Agents

### 🔍 `code-analyzer`

- **Purpose**: Hunt bugs across multiple files without polluting main context
- **Pattern**: Search many files → Analyze code → Return bug report
- **Usage**: When you need to trace logic flows, find bugs, or validate changes
- **Returns**: Concise bug report with critical findings only

### 📄 `file-analyzer`

- **Purpose**: Read and summarize verbose files (logs, outputs, configs)
- **Pattern**: Read files → Extract insights → Return summary
- **Usage**: When you need to understand log files or analyze verbose output
- **Returns**: Key findings and actionable insights (80-90% size reduction)

### 🧪 `test-runner`

- **Purpose**: Execute tests without dumping output to main thread
- **Pattern**: Run tests → Capture to log → Analyze results → Return summary
- **Usage**: When you need to run tests and understand failures
- **Returns**: Test results summary with failure analysis

### 🔀 `parallel-worker`

- **Purpose**: Coordinate multiple parallel work streams for an issue
- **Pattern**: Read analysis → Spawn sub-agents → Consolidate results → Return summary
- **Usage**: When executing parallel work streams in a worktree
- **Returns**: Consolidated status of all parallel work

## Why Agents?

Agents are **context firewalls** that protect the main conversation from information overload:

```
Without Agent:
Main thread reads 10 files → Context explodes → Loses coherence

With Agent:
Agent reads 10 files → Main thread gets 1 summary → Context preserved
```

## How Agents Preserve Context

1. **Heavy Lifting** - Agents do the messy work (reading files, running tests, implementing features)
2. **Context Isolation** - Implementation details stay in the agent, not the main thread
3. **Concise Returns** - Only essential information returns to main conversation
4. **Parallel Execution** - Multiple agents can work simultaneously without context collision

## Example Usage

```bash
# Analyzing code for bugs
Task: "Search for memory leaks in the codebase"
Agent: code-analyzer
Returns: "Found 3 potential leaks: [concise list]"
Main thread never sees: The hundreds of files examined

# Running tests
Task: "Run authentication tests"
Agent: test-runner
Returns: "2/10 tests failed: [failure summary]"
Main thread never sees: Verbose test output and logs

# Parallel implementation
Task: "Implement issue #1234 with parallel streams"
Agent: parallel-worker
Returns: "Completed 4/4 streams, 15 files modified"
Main thread never sees: Individual implementation details
```

## Creating New Agents

New agents should follow these principles:

1. **Single Purpose** - Each agent has one clear job
2. **Context Reduction** - Return 10-20% of what you process
3. **No Roleplay** - Agents aren't "experts", they're task executors
4. **Clear Pattern** - Define input → processing → output pattern
5. **Error Handling** - Gracefully handle failures and report clearly

## Anti-Patterns to Avoid

❌ **Creating "specialist" agents** (database-expert, api-expert)
Agents don't have different knowledge - they're all the same model

❌ **Returning verbose output**
Defeats the purpose of context preservation

❌ **Making agents communicate with each other**
Use a coordinator agent instead (like parallel-worker)

❌ **Using agents for simple tasks**
Only use agents when context reduction is valuable

## Integration with PM System

Agents integrate seamlessly with the PM command system:

- `/pm:issue-analyze` → Identifies work streams
- `/pm:issue-start` → Spawns parallel-worker agent
- parallel-worker → Spawns multiple sub-agents
- Sub-agents → Work in parallel in the worktree
- Results → Consolidated back to main thread

This creates a hierarchy that maximizes parallelism while preserving context at every level.
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
- **Shared packages** use workspace:\* references for internal dependencies

### Deployment Configuration

- **Web**: Static build with Cloudflare Pages adapter
- **Admin**: React Router with Vite build
- **API**: Cloudflare Workers with Wrangler
- **Secrets**: Set via `wrangler secret put` for production

## Claude Code Assistant Rules

> Think carefully and implement the most concise solution that changes as little code as possible.

### USE SUB-AGENTS FOR CONTEXT OPTIMIZATION

#### 1. Always use the file-analyzer sub-agent when asked to read files.

The file-analyzer agent is an expert in extracting and summarizing critical information from files, particularly log files and verbose outputs. It provides concise, actionable summaries that preserve essential information while dramatically reducing context usage.

#### 2. Always use the code-analyzer sub-agent when asked to search code, analyze code, research bugs, or trace logic flow.

The code-analyzer agent is an expert in code analysis, logic tracing, and vulnerability detection. It provides concise, actionable summaries that preserve essential information while dramatically reducing context usage.

#### 3. Always use the test-runner sub-agent to run tests and analyze the test results.

Using the test-runner agent ensures:

- Full test output is captured for debugging
- Main conversation stays clean and focused
- Context usage is optimized
- All issues are properly surfaced
- No approval dialogs interrupt the workflow

### Philosophy

#### Error Handling

- **Fail fast** for critical configuration (missing text model)
- **Log and continue** for optional features (extraction model)
- **Graceful degradation** when external services unavailable
- **User-friendly messages** through resilience layer

#### Testing

- Always use the test-runner agent to execute tests.
- Do not use mock services for anything ever.
- Do not move on to the next test until the current test is complete.
- If the test fails, consider checking if the test is structured correctly before deciding we need to refactor the codebase.
- Tests to be verbose so we can use them for debugging.

### Tone and Behavior

- Criticism is welcome. Please tell me when I am wrong or mistaken, or even when you think I might be wrong or mistaken.
- Please tell me if there is a better approach than the one I am taking.
- Please tell me if there is a relevant standard or convention that I appear to be unaware of.
- Be skeptical.
- Be concise.
- Short summaries are OK, but don't give an extended breakdown unless we are working through the details of a plan.
- Do not flatter, and do not give compliments unless I am specifically asking for your judgement.
- Occasional pleasantries are fine.
- Feel free to ask many questions. If you are in doubt of my intent, don't guess. Ask.

### ABSOLUTE RULES:

- **NO PARTIAL IMPLEMENTATION**
- **NO SIMPLIFICATION**: no "//This is simplified stuff for now, complete implementation would blablabla"
- **NO CODE DUPLICATION**: check existing codebase to reuse functions and constants Read files before writing new functions. Use common sense function name to find them easily.
- **NO DEAD CODE**: either use or delete from codebase completely
- **IMPLEMENT TEST FOR EVERY FUNCTIONS**
- **NO CHEATER TESTS**: test must be accurate, reflect real usage and be designed to reveal flaws. No useless tests! Design tests to be verbose so we can use them for debuging.
- **NO INCONSISTENT NAMING** - read existing codebase naming patterns.
- **NO OVER-ENGINEERING** - Don't add unnecessary abstractions, factory patterns, or middleware when simple functions would work. Don't think "enterprise" when you need "working"
- **NO MIXED CONCERNS** - Don't put validation logic inside API handlers, database queries inside UI components, etc. instead of proper separation
- **NO RESOURCE LEAKS** - Don't forget to close database connections, clear timeouts, remove event listeners, or clean up file handles

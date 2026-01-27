# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is an e-commerce website for **Black Living 黑哥居家**, a Taiwanese premium Simmons "Black Label" mattress retailer. The project is in planning phase and will be built using a modern edge-first architecture with Cloudflare services.

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

- **NO ULTRACITE FIX WITHOUT FILE PATHS**: NEVER run `npx ultracite fix` without specifying exact file paths. This will modify files across the entire monorepo. Always use: `npx ultracite fix <specific-files>`
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


# Ultracite Code Standards

This project uses **Ultracite**, a zero-config Biome preset that enforces strict code quality standards through automated formatting and linting.

## Quick Reference

- **Format specific files**: `npx ultracite fix path/to/file.ts path/to/other.tsx`
- **Check specific files**: `npx ultracite check path/to/file.ts`
- **Diagnose setup**: `npx ultracite doctor`

## ⚠️ CRITICAL: NEVER Run Without File Paths

**ABSOLUTE RULE**: NEVER run `npx ultracite fix` without specifying exact file paths.

```bash
# ❌ FORBIDDEN - Fixes ALL files in the project
npx ultracite fix

# ✅ CORRECT - Fixes only specified files
npx ultracite fix apps/admin/app/routes/admin.settings.tsx
```

Running Ultracite without file paths will modify files across the entire monorepo, causing unwanted side effects and potentially breaking code that was intentionally structured differently.

Biome (the underlying engine) provides extremely fast Rust-based linting and formatting. Most issues are automatically fixable.

---

## Core Principles

Write code that is **accessible, performant, type-safe, and maintainable**. Focus on clarity and explicit intent over brevity.

### Type Safety & Explicitness

- Use explicit types for function parameters and return values when they enhance clarity
- Prefer `unknown` over `any` when the type is genuinely unknown
- Use const assertions (`as const`) for immutable values and literal types
- Leverage TypeScript's type narrowing instead of type assertions
- Use meaningful variable names instead of magic numbers - extract constants with descriptive names

### Modern JavaScript/TypeScript

- Use arrow functions for callbacks and short functions
- Prefer `for...of` loops over `.forEach()` and indexed `for` loops
- Use optional chaining (`?.`) and nullish coalescing (`??`) for safer property access
- Prefer template literals over string concatenation
- Use destructuring for object and array assignments
- Use `const` by default, `let` only when reassignment is needed, never `var`

### Async & Promises

- Always `await` promises in async functions - don't forget to use the return value
- Use `async/await` syntax instead of promise chains for better readability
- Handle errors appropriately in async code with try-catch blocks
- Don't use async functions as Promise executors

### React & JSX

- Use function components over class components
- Call hooks at the top level only, never conditionally
- Specify all dependencies in hook dependency arrays correctly
- Use the `key` prop for elements in iterables (prefer unique IDs over array indices)
- Nest children between opening and closing tags instead of passing as props
- Don't define components inside other components
- Use semantic HTML and ARIA attributes for accessibility:
  - Provide meaningful alt text for images
  - Use proper heading hierarchy
  - Add labels for form inputs
  - Include keyboard event handlers alongside mouse events
  - Use semantic elements (`<button>`, `<nav>`, etc.) instead of divs with roles

### Error Handling & Debugging

- Remove `console.log`, `debugger`, and `alert` statements from production code
- Throw `Error` objects with descriptive messages, not strings or other values
- Use `try-catch` blocks meaningfully - don't catch errors just to rethrow them
- Prefer early returns over nested conditionals for error cases

### Code Organization

- Keep functions focused and under reasonable cognitive complexity limits
- Extract complex conditions into well-named boolean variables
- Use early returns to reduce nesting
- Prefer simple conditionals over nested ternary operators
- Group related code together and separate concerns

### Security

- Add `rel="noopener"` when using `target="_blank"` on links
- Avoid `dangerouslySetInnerHTML` unless absolutely necessary
- Don't use `eval()` or assign directly to `document.cookie`
- Validate and sanitize user input

### Performance

- Avoid spread syntax in accumulators within loops
- Use top-level regex literals instead of creating them in loops
- Prefer specific imports over namespace imports
- Avoid barrel files (index files that re-export everything)
- Use proper image components (e.g., Next.js `<Image>`) over `<img>` tags

### Framework-Specific Guidance

**Next.js:**
- Use Next.js `<Image>` component for images
- Use `next/head` or App Router metadata API for head elements
- Use Server Components for async data fetching instead of async Client Components

**React 19+:**
- Use ref as a prop instead of `React.forwardRef`

**Solid/Svelte/Vue/Qwik:**
- Use `class` and `for` attributes (not `className` or `htmlFor`)

---

## Testing

- Write assertions inside `it()` or `test()` blocks
- Avoid done callbacks in async tests - use async/await instead
- Don't use `.only` or `.skip` in committed code
- Keep test suites reasonably flat - avoid excessive `describe` nesting

## When Biome Can't Help

Biome's linter will catch most issues automatically. Focus your attention on:

1. **Business logic correctness** - Biome can't validate your algorithms
2. **Meaningful naming** - Use descriptive names for functions, variables, and types
3. **Architecture decisions** - Component structure, data flow, and API design
4. **Edge cases** - Handle boundary conditions and error states
5. **User experience** - Accessibility, performance, and usability considerations
6. **Documentation** - Add comments for complex logic, but prefer self-documenting code

---

Most formatting and common issues are automatically fixed by Biome. Run `npx ultracite fix <changed-files>` before committing to ensure compliance.


# Ultracite Code Standards

This project uses **Ultracite**, a zero-config preset that enforces strict code quality standards through automated formatting and linting.

## Quick Reference

- **Format code**: `pnpm dlx ultracite fix`
- **Check for issues**: `pnpm dlx ultracite check`
- **Diagnose setup**: `pnpm dlx ultracite doctor`

Biome (the underlying engine) provides robust linting and formatting. Most issues are automatically fixable.

---

## Core Principles

Write code that is **accessible, performant, type-safe, and maintainable**. Focus on clarity and explicit intent over brevity.

### Type Safety & Explicitness

- Use explicit types for function parameters and return values when they enhance clarity
- Prefer `unknown` over `any` when the type is genuinely unknown
- Use const assertions (`as const`) for immutable values and literal types
- Leverage TypeScript's type narrowing instead of type assertions
- Use meaningful variable names instead of magic numbers - extract constants with descriptive names

### Modern JavaScript/TypeScript

- Use arrow functions for callbacks and short functions
- Prefer `for...of` loops over `.forEach()` and indexed `for` loops
- Use optional chaining (`?.`) and nullish coalescing (`??`) for safer property access
- Prefer template literals over string concatenation
- Use destructuring for object and array assignments
- Use `const` by default, `let` only when reassignment is needed, never `var`

### Async & Promises

- Always `await` promises in async functions - don't forget to use the return value
- Use `async/await` syntax instead of promise chains for better readability
- Handle errors appropriately in async code with try-catch blocks
- Don't use async functions as Promise executors

### React & JSX

- Use function components over class components
- Call hooks at the top level only, never conditionally
- Specify all dependencies in hook dependency arrays correctly
- Use the `key` prop for elements in iterables (prefer unique IDs over array indices)
- Nest children between opening and closing tags instead of passing as props
- Don't define components inside other components
- Use semantic HTML and ARIA attributes for accessibility:
  - Provide meaningful alt text for images
  - Use proper heading hierarchy
  - Add labels for form inputs
  - Include keyboard event handlers alongside mouse events
  - Use semantic elements (`<button>`, `<nav>`, etc.) instead of divs with roles

### Error Handling & Debugging

- Remove `console.log`, `debugger`, and `alert` statements from production code
- Throw `Error` objects with descriptive messages, not strings or other values
- Use `try-catch` blocks meaningfully - don't catch errors just to rethrow them
- Prefer early returns over nested conditionals for error cases

### Code Organization

- Keep functions focused and under reasonable cognitive complexity limits
- Extract complex conditions into well-named boolean variables
- Use early returns to reduce nesting
- Prefer simple conditionals over nested ternary operators
- Group related code together and separate concerns

### Security

- Add `rel="noopener"` when using `target="_blank"` on links
- Avoid `dangerouslySetInnerHTML` unless absolutely necessary
- Don't use `eval()` or assign directly to `document.cookie`
- Validate and sanitize user input

### Performance

- Avoid spread syntax in accumulators within loops
- Use top-level regex literals instead of creating them in loops
- Prefer specific imports over namespace imports
- Avoid barrel files (index files that re-export everything)
- Use proper image components (e.g., Next.js `<Image>`) over `<img>` tags

### Framework-Specific Guidance

**Next.js:**
- Use Next.js `<Image>` component for images
- Use `next/head` or App Router metadata API for head elements
- Use Server Components for async data fetching instead of async Client Components

**React 19+:**
- Use ref as a prop instead of `React.forwardRef`

**Solid/Svelte/Vue/Qwik:**
- Use `class` and `for` attributes (not `className` or `htmlFor`)

---

## Testing

- Write assertions inside `it()` or `test()` blocks
- Avoid done callbacks in async tests - use async/await instead
- Don't use `.only` or `.skip` in committed code
- Keep test suites reasonably flat - avoid excessive `describe` nesting

## When Biome Can't Help

Biome's linter will catch most issues automatically. Focus your attention on:

1. **Business logic correctness** - Biome can't validate your algorithms
2. **Meaningful naming** - Use descriptive names for functions, variables, and types
3. **Architecture decisions** - Component structure, data flow, and API design
4. **Edge cases** - Handle boundary conditions and error states
5. **User experience** - Accessibility, performance, and usability considerations
6. **Documentation** - Add comments for complex logic, but prefer self-documenting code

---

Most formatting and common issues are automatically fixed by Biome. Run `pnpm dlx ultracite fix` before committing to ensure compliance.

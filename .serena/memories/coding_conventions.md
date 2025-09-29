# Coding Conventions & Style Guide

## Code Formatting (Prettier)

Based on `.prettierrc.js` configuration:

### General Rules

- **Print Width**: 100 characters
- **Indentation**: 2 spaces (no tabs)
- **Semicolons**: Always required
- **Quotes**: Single quotes for JavaScript/TypeScript
- **Trailing Commas**: ES5 style
- **Bracket Spacing**: Enabled
- **Arrow Functions**: Avoid parentheses when possible (`x => x`)
- **Line Endings**: LF (Unix style)

### File-Specific Formatting

- **Astro Files (.astro)**:
  - Parser: astro
  - Allow shorthand attributes
  - HTML whitespace sensitivity: ignore
  - JSX single quotes: true
  - Embedded language formatting: off (preserves CSS in style tags)

- **TypeScript/JavaScript (.ts, .tsx, .js, .jsx)**:
  - Parser: typescript
  - Single quotes, ES5 trailing commas

- **JSON (.json, .jsonc)**:
  - Double quotes (JSON standard)

- **Markdown (.md)**:
  - Preserve prose wrapping

## TypeScript Configuration

### Strictness Level

- **Web App**: Extends `astro/tsconfigs/strict` (very strict)
- **All Apps**: TypeScript v5.8.3 with strict mode enabled
- **Type Safety**: Zod v3/v4 for runtime validation across all applications

### Import Aliases

- **Web App**:
  - `~`: `./src` (local app files)
  - `@`: `../../packages/ui` (shared UI components)
  - Development: Full lucide-react package for better DX
  - Production: Individual icon imports for tree-shaking

## Component Architecture

### File Organization

- **Astro Components**: `.astro` extension for static/server-side components
- **React Components**: `.tsx` extension for client-side interactive components
- **Shared Components**: Located in `/packages/ui/components/`
- **App-Specific Components**: Located in each app's `/src/components/`

### Component Naming

- **PascalCase**: All component files and exports
- **Descriptive Names**: `AddToCartButton.tsx`, `ProductImageCarousel.tsx`
- **Astro Components**: Use `.astro` extension for SSR components
- **React Islands**: Use `.tsx` for client-side interactivity

### UI Component Patterns

Based on Shadcn/ui architecture:

- **Variant Props**: Using `cva` (class-variance-authority) for styling variants
- **Compound Components**: Button component example shows proper TypeScript typing
- **Slot Pattern**: Using `@radix-ui/react-slot` for component composition
- **Forward Refs**: Proper ref forwarding for accessibility
- **Data Attributes**: `data-slot` for component identification

## State Management

- **Zustand v5.0.6**: Lightweight state management
- **React v19**: Latest React features with concurrent rendering
- **Server State**: Handled by Astro's SSR capabilities

## Database & API Patterns

### Database (Drizzle ORM)

- **Type Safety**: Full TypeScript integration with Drizzle ORM v0.44.4
- **Schema Definition**: Centralized in `/packages/db/schema.ts`
- **Client Access**: Exposed through `/packages/db/client.ts`
- **Migrations**: Managed via `drizzle-kit` commands

### API Structure (Hono)

- **Framework**: Hono v4.8.9 for Cloudflare Workers
- **Validation**: Zod schemas for request/response validation
- **Type Safety**: Full TypeScript support with proper typing

## Import Conventions

### Import Order (Inferred from configs)

1. Node modules / External libraries
2. Internal workspace packages (`@blackliving/*`)
3. Relative imports (`./`, `../`)
4. Type-only imports (when applicable)

### Workspace Dependencies

- **Never use npm**: Project exclusively uses PNPM
- **Workspace References**: Use `workspace:*` for internal package dependencies
- **Shared Packages**: Import from `@blackliving/*` namespace

## Build & Bundle Optimization

### Code Splitting (Astro Config)

- **Vendor Chunk**: All node_modules except specific packages
- **UI Chunk**: `@blackliving/ui` components get separate chunk
- **Icons Chunk**: Lucide React icons (tree-shaken in production)
- **Development**: Full packages for better developer experience
- **Production**: Optimized tree-shaken builds

## Environment-Specific Patterns

### Development vs Production

- **Icon Loading**: Full lucide-react package in dev, individual icons in production
- **Server Optimization**: Different React DOM server import for edge runtime
- **API Proxy**: Astro dev server proxies `/api` to `localhost:8787`

## Authentication & Security

- **Better Auth**: Integrated across all applications
- **Type Safety**: Shared types in `@blackliving/types`
- **Secrets Management**: Wrangler secret management for production

## Testing Conventions

- **Framework**: Vitest v3.2.4 for unit/integration tests
- **E2E Testing**: Playwright for admin dashboard
- **Coverage**: Built-in coverage reporting with Vitest

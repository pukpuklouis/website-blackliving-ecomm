# Black Living Project Structure

## Directory Organization

Black Living follows a **Turborepo-managed monorepo architecture** with clear separation of applications and shared packages:

```
website-blackliving-ecomm/
├── .bmad-core/              # BMad method configuration and tooling
│   ├── agents/             # Specialized AI agent definitions
│   ├── checklists/         # QA and development checklists
│   ├── core-config.yaml    # BMad method configuration
│   ├── data/               # Knowledge base and reference data
│   ├── tasks/              # Executable workflow definitions
│   └── templates/          # Document and code templates
├── .spec-workflow/          # Specification workflow system
│   ├── steering/           # Steering documents (this file)
│   ├── templates/          # Specification templates
│   └── approvals/          # Document approval system
├── apps/                    # Application packages
│   ├── admin/              # React-based administrative dashboard
│   │   ├── app/            # React Router application structure
│   │   ├── components/     # Admin-specific UI components
│   │   ├── functions/      # Cloudflare Pages Functions
│   │   └── public/         # Static assets
│   ├── api/                # Cloudflare Workers API backend
│   │   ├── src/            # API source code (Hono routes)
│   │   └── middleware/     # Authentication and other middleware
│   └── web/                # Astro-based customer-facing website
│       ├── src/            # Astro pages and components
│       └── public/         # Static assets (images, fonts)
├── packages/                # Shared code packages
│   ├── auth/               # Authentication and session management
│   ├── cloudflare-adapter/ # Cloudflare service adapters
│   ├── db/                 # Database schema and migrations (Drizzle ORM)
│   ├── tailwind-config/    # Shared Tailwind CSS configuration
│   ├── tailwindcss-typography/  # Typography plugin extension
│   ├── types/              # Shared TypeScript type definitions
│   └── ui/                 # Reusable UI component library (Shadcn)
├── docs/                   # Project documentation
│   ├── api-documentation.md # API endpoint documentation
│   ├── architecture/       # Architecture decision records
│   └── qa/                 # Quality assurance documentation
├── research/               # Business analysis and requirements research
├── scripts/                # Development and deployment scripts
├── deployment/             # Deployment configuration and tooling
├── public/                 # Shared static assets
└── config files            # Project configuration (*.config.*, *.json)
```

## Monorepo Organization Principles

### Application Packages (`apps/`)

Each application is a **self-contained deployable unit** with minimal cross-dependencies:

- **`web`**: Customer-facing e-commerce platform (Astro + React)
- **`admin`**: Administrative dashboard for content management (React + React Router)
- **`api`**: Serverless backend API (Cloudflare Workers + Hono)

**Isolation Rules:**
- Applications can depend on packages but not on other applications
- Each application has its own build configuration and deployment pipeline
- Cross-application communication only through public APIs

### Shared Packages (`packages/`)

Packages provide reusable functionality across applications:

- **`auth`**: Centralized authentication logic using Better Auth
- **`db`**: Database schema, migrations, and query utilities
- **`ui`**: Design system components built with Shadcn UI
- **`types`**: TypeScript interfaces shared across applications
- **`cloudflare-adapter`**: Abstractions for Cloudflare services (KV, R2, D1)

**Package Rules:**
- Packages can depend on other packages but not on applications
- Must be platform-agnostic and framework-independent where possible
- Versioned independently with semantic versioning

## Naming Conventions

### Files and Directories

**General Rules:**
- **Directories**: `kebab-case` (e.g., `user-management`, `order-processing`)
- **React Components**: `PascalCase.jsx` or `PascalCase.tsx`
- **TypeScript Types**: `PascalCase.ts`
- **Utility Functions**: `camelCase.ts`
- **Configuration Files**: `kebab-case.config.js` or `kebab-case.config.ts`
- **Test Files**: `[filename].test.ts` or `[filename].spec.ts`

**Application-Specific:**
```
apps/admin/
├── components/              # kebab-case directories
│   ├── user-list/
│   └── order-modal/
└── routes/                  # Feature-based organization
    ├── dashboard/
    ├── products/
    └── orders/

apps/api/
├── modules/                 # Domain-driven organization
│   ├── auth/
│   ├── products/
│   └── orders/
└── routes/                  # RESTful route organization
    ├── v1/
    └── health/
```

### Code Naming

**TypeScript/JavaScript:**
```
Variables/Functions:     camelCase
Classes/Types:           PascalCase
Constants:               SCREAMING_SNAKE_CASE
Enums:                   PascalCase
Interfaces:              PascalCase (prefixed with 'I' optional)
Database Tables:         snake_case
Database Columns:        snake_case
API Endpoints:           kebab-case
CSS Classes:             kebab-case
File Names:              kebab-case for utilities, PascalCase for components
```

**Examples:**
```typescript
// Variables and functions
const userName = 'john';
function getUserById(id: string) { ... }

// Types and interfaces
interface UserProfile { ... }
type OrderStatus = 'pending' | 'completed';

// Constants
const MAX_RETRY_COUNT = 3;
const API_BASE_URL = '/api/v1';

// Database schema (from packages/db/schema.ts)
export const users = table('users', {
  id: text('id').primaryKey(),
  email: text('email').notNull().unique(),
  createdAt: integer('created_at', { mode: 'timestamp' }),
});
```

## Import Patterns

### Import Order (within files)

1. **External Dependencies** (npm packages)
2. **Internal Packages** (`@blackliving/*`)
3. **Relative Imports** (`./`, `../`)
4. **Type Imports** (TypeScript `import type`)
5. **CSS/SCSS Imports** (at end)

**Example File Structure:**
```typescript
// 1. External dependencies
import { useState } from 'react';
import { z } from 'zod';

// 2. Internal packages
import { Button } from '@blackliving/ui';
import { createUser } from '@blackliving/auth';

// 3. Relative imports
import { formatUser } from './utils';
import { UserForm } from '../components/UserForm';

// 4. Type imports
import type { User, Order } from '../../../types';

// 5. Styles (if needed)
import './UserList.css';
```

### Module Resolution (`tsconfig.json`)

All projects use **path mapping** for clean imports:

```json
{
  "compilerOptions": {
    "paths": {
      "@/*": ["./src/*"],                    // Within packages
      "@blackliving/*": ["../../packages/*"] // Cross-package imports
    }
  }
}
```

### Barrel Exports

Packages use **index files** for clean public APIs:

```typescript
// packages/ui/index.ts - Barrel export
export { Button } from './components/Button';
export { Input } from './components/Input';
export { Card } from './components/Card';

// Usage in apps
import { Button, Input, Card } from '@blackliving/ui';
```

## Code Structure Patterns

### React Component Organization (`apps/`)

**File Structure per Component:**
```
ComponentName/
├── ComponentName.tsx        # Main component
├── ComponentName.test.tsx   # Unit tests
├── index.ts                 # Barrel export
└── types.ts                 # Component-specific types
```

**Component File Organization:**
```tsx
// ComponentName.tsx
import { useState } from 'react';
import type { ComponentProps } from './types';

// Types (at top)
interface Props {
  user: User;
  onUpdate: (user: User) => void;
}

// Constants
const DEFAULT_AVATAR = '/default-avatar.png';

// Main component
export function UserProfile({ user, onUpdate }: Props) {
  const [isEditing, setIsEditing] = useState(false);

  // Event handlers
  const handleSave = () => {
    onUpdate(user);
    setIsEditing(false);
  };

  // Render
  return (
    <div className="user-profile">
      {/* Component JSX */}
    </div>
  );
}
```

### API Route Organization (`apps/api/`)

**Hono Route Structure:**
```typescript
// routes/users.ts
import { Hono } from 'hono';
import { getUsers, createUser } from '../modules/users';

const app = new Hono();

// GET /api/users
app.get('/', async (c) => {
  const users = await getUsers();
  return c.json({ users });
});

// POST /api/users
app.post('/', async (c) => {
  const body = await c.req.json();
  const user = await createUser(body);
  return c.json({ user }, 201);
});

export default app;
```

### Database Module Organization (`packages/db/`)

**Drizzle ORM Structure:**
```typescript
// schema.ts
import { sqliteTable, text, integer } from 'drizzle-orm/sqlite-core';

export const users = sqliteTable('users', {
  id: text('id').primaryKey(),
  email: text('email').notNull().unique(),
  name: text('name'),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
});

// queries.ts
import { eq } from 'drizzle-orm';
import { db } from './client';

export async function getUserById(id: string) {
  return db.select().from(users).where(eq(users.id, id)).limit(1);
}

export async function createUser(data: { email: string; name?: string }) {
  return db.insert(users).values(data).returning();
}
```

## Code Organization Principles

### 1. Single Responsibility Principle
- Each file has one clear, focused responsibility
- Functions handle one operation or calculation
- Components render one piece of UI or handle one interaction pattern

### 2. Feature-Based Organization
- Code organized by business domain/feature rather than technical layer
- Related components, logic, and types stay together
- Clear boundaries between different features

### 3. Dependency Direction
- **apps** → **packages** (applications depend on shared packages)
- **packages** → **packages** (can depend on other packages)
- **apps** ↛ **apps** (applications cannot depend on each other)

### 4. DRY (Don't Repeat Yourself)
- Shared logic abstracted into utility functions or packages
- Common UI patterns become reusable components
- Database queries and business logic centralized

### 5. Testability First
- Functions designed to be easily unit tested
- Components structured for meaningful integration tests
- Clear separation of concerns enables focused testing

## Module Boundaries

### Internal vs External APIs

**Internal APIs** (within applications):
- Can use direct imports and internal data structures
- Loose coupling within feature boundaries
- Application-specific optimizations allowed

**External APIs** (between applications/packages):
- RESTful HTTP APIs for inter-application communication
- Public TypeScript APIs with clear contracts
- Versioned interfaces with backward compatibility

### Business Domain Separation

**Domain Examples:**
- `auth`: User authentication and session management
- `products`: Product catalog and inventory management
- `orders`: Order processing and fulfillment
- `content`: Blog posts, CMS, and static content

**Domain Rules:**
- Each domain has clear ownership and responsibility
- Domains communicate through APIs, not direct database access
- Shared types defined in `packages/types`

## Code Size Guidelines

### File Size Limits
- **Component files**: < 300 lines
- **Utility files**: < 200 lines
- **API route files**: < 150 lines
- **Type definition files**: < 100 lines

### Function Size Limits
- **Component functions**: < 50 lines
- **Utility functions**: < 30 lines
- **API handlers**: < 40 lines

### Complexity Limits
- **Cyclomatic complexity**: < 10 per function
- **Nesting depth**: < 4 levels per function
- **Parameters per function**: < 5 parameters

## Documentation Standards

### Code Comments
- Complex business logic requires explanation comments
- Public APIs must have JSDoc comments
- TODO comments include issue references
- Deprecation notices for phased-out code

### Documentation Files
- README.md files required for all packages
- Architecture decisions documented as ADRs
- API endpoints documented with OpenAPI spec
- Component usage documented with examples

## Development Workflow Integration

### Turbo Build System
- Build tasks declared in `turbo.json`
- Caching enabled for unchanged packages
- Parallel execution of independent tasks

### Testing Structure
```
├── apps/*/src/**/__tests__/     # Unit and integration tests
├── packages/*/src/**/__tests__/  # Package unit tests
└── apps/*/e2e/                   # End-to-end tests
```

### Configuration Management
**Environment-Based Config:**
- `.env` files for development environment variables
- Wrangler secrets for production environment variables
- Configuration

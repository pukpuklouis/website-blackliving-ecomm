# Design Document: Dynamic Page CMS Module

## Overview

This document outlines the technical design for implementing a complete content management system for dynamic pages within the Black Living e-commerce monorepo. The system enables administrators to create and edit pages using a visual block editor (BlockNote), which are then serialized to Markdown and rendered dynamically by the web application. This design follows established patterns in the codebase while ensuring seamless integration with existing Cloudflare infrastructure and UI components.

## Steering Document Alignment

### Technical Standards (tech.md)
This design follows documented technical patterns and standards:
- **Modular Architecture**: Each component handles a specific concern or domain, following single responsibility principle
- **Cloudflare-First Architecture**: Leverages Cloudflare Workers, D1, R2, and KV for backend infrastructure
- **Drizzle ORM Patterns**: Uses consistent database schema patterns established in `packages/db/schema.ts`
- **Component Reusability**: Leverages shared UI components and follows existing admin interface patterns

### Project Structure (structure.md)
The implementation follows project organization conventions:
- **API Module Pattern**: New `pages.ts` module follows the structure seen in `apps/api/src/modules/`
- **Admin Components**: New admin components follow patterns in `apps/admin/app/components/`
- **Web Application Routes**: Dynamic route follows Astro conventions in `apps/web/src/pages/`
- **Database Migrations**: New table follows migration pattern in `packages/db/migrations/`

## Code Reuse Analysis

### Existing Components to Leverage
- **BlockNoteEditor**: Already implemented in `apps/admin/app/components/editor/BlockNoteEditor.tsx` and used in `ProductEditPage.tsx`
  - Will be reused for page content editing with dual storage (blocks_json + rendered_markdown)
  - Integration with existing media library dialog for image uploads

- **StorageManager**: Implemented in `apps/api/src/lib/storage.ts`
  - Reuses existing Cloudflare R2 integration
  - Provides uploadFile method with metadata support
  - Handles image optimization and URL generation

- **SEO Component**: Implemented in `apps/web/src/components/SEO.astro`
  - Centralized SEO component with Open Graph support
  - Supports custom schema injection
  - Already configured for Black Living brand

### Integration Points
- **Database (D1)**: New `pages` table integrates with existing Drizzle ORM schema
- **Storage (R2)**: Reuses existing image upload infrastructure for editor assets
- **Admin Authentication**: Uses existing Better Auth integration for admin-only access
- **Cache Layer**: Integrates with existing Cloudflare KV caching patterns
- **API Routes**: Follows established CRUD patterns in Cloudflare Workers API

## Architecture

The architecture follows a modular design with clear separation of concerns across three main application layers:

```mermaid
graph TD
    A[Admin Dashboard] --> B[API Layer]
    B --> C[Database (D1)]
    A --> D[Cloudflare R2]
    B --> D
    E[Web Application] --> B
    E --> F[Dynamic Route Handler]
    F --> C
    B --> G[Cache Layer]
    G --> F
```

### Modular Design Principles
- **Single File Responsibility**: Each file handles one specific concern or domain
- **Component Isolation**: Create small, focused components rather than large monolithic files
- **Service Layer Separation**: Separate data access, business logic, and presentation layers
- **Utility Modularity**: Break utilities into focused, single-purpose modules

## Components and Interfaces

### Admin Components

#### 1. PageList Component (`apps/admin/app/routes/dashboard/pages.tsx`)
- **Purpose:** Lists all dynamic pages with CRUD operations
- **Interfaces:** 
  - `GET /api/pages` - Fetch all pages with pagination
  - `DELETE /api/pages/:id` - Delete page
- **Dependencies:** React Router, AuthContext, Better Auth
- **Reuses:** `BatchOperationsToolbar` for bulk operations

#### 2. PageEditor Component (`apps/admin/app/components/PageEditor.tsx`)
- **Purpose:** Create and edit page content using BlockNoteEditor
- **Interfaces:**
  - `POST /api/pages` - Create new page
  - `PUT /api/pages/:id` - Update existing page
  - `GET /api/pages/:id` - Fetch page for editing
- **Dependencies:** BlockNoteEditor, ImageUploadContext, AuthContext
- **Reuses:** 
  - `BlockNoteEditor` component from existing editor folder
  - `ImageUploadContext` for R2 integration
  - Form validation patterns from `ProductEditPage.tsx`

#### 3. PageForm Component (`apps/admin/app/components/PageForm.tsx`)
- **Purpose:** Form component for page metadata (title, slug, status, SEO fields)
- **Interfaces:** Validates slug uniqueness, handles form submission
- **Dependencies:** React Hook Form, Zod validation
- **Reuses:** Form patterns from existing admin forms

### API Layer Components

#### 1. Pages Module (`apps/api/src/modules/pages.ts`)
- **Purpose:** CRUD operations for pages
- **Interfaces:**
  - `GET /api/pages` - List pages (admin only)
  - `POST /api/pages` - Create page (admin only)
  - `GET /api/pages/:slug` - Get published page by slug
  - `PUT /api/pages/:id` - Update page (admin only)
  - `DELETE /api/pages/:id` - Delete page (admin only)
- **Dependencies:** Drizzle DB client, Cache, Auth middleware
- **Reuses:** 
  - Module structure from `products.ts`, `posts.ts`
  - Cache invalidation patterns from `admin.ts`
  - Auth middleware patterns

#### 2. Page Serialization Service
- **Purpose:** Convert BlockNote blocks to Markdown
- **Interfaces:** Static methods for serialization/deserialization
- **Dependencies:** BlockNote types, markdown-it or marked
- **Reuses:** No existing equivalent - new utility

### Web Application Components

#### 1. Dynamic Route Handler (`apps/web/src/pages/[...slug].astro`)
- **Purpose:** Catch-all route for dynamic page rendering
- **Interfaces:** Server-side rendering with API query
- **Dependencies:** API client, SEO component, markdown renderer
- **Reuses:**
  - Layout patterns from existing pages
  - SEO component integration
  - Error handling patterns

#### 2. Markdown Renderer Component
- **Purpose:** Render Markdown content with syntax highlighting
- **Interfaces:** Accepts Markdown string, returns HTML
- **Dependencies:** marked/astro-remote, Tailwind Typography
- **Reuses:** No existing equivalent - new component

## Data Models

### Page Model (packages/db/schema.ts)
```typescript
export const pages = pgTable('pages', {
  id: text('id').primaryKey().$defaultFn(() => nanoid()),
  slug: text('slug').unique().notNull(),
  title: text('title').notNull(),
  blocksJson: jsonb('blocks_json'),
  renderedMarkdown: text('rendered_markdown'),
  status: text('status').notNull().default('draft'),
  metaTitle: text('meta_title'),
  metaDescription: text('meta_description'),
  featuredImage: text('featured_image'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

export type Page = typeof pages.$inferSelect;
export type NewPage = typeof pages.$inferInsert;
```

### Page API Types (apps/api/src/types/pages.ts)
```typescript
export interface PageCreate {
  slug: string;
  title: string;
  blocksJson: any;
  renderedMarkdown: string;
  status: 'draft' | 'published';
  metaTitle?: string;
  metaDescription?: string;
  featuredImage?: string;
}

export interface PageUpdate extends Partial<PageCreate> {
  id: string;
}

export interface PagePublic {
  slug: string;
  title: string;
  renderedMarkdown: string;
  metaTitle?: string;
  metaDescription?: string;
  featuredImage?: string;
  createdAt: string;
  updatedAt: string;
}
```

## Error Handling

### Error Scenarios

1. **Slug Conflict**
   - **Scenario:** Admin tries to create page with existing or reserved slug
   - **Handling:** Validate against database and reserved route list before save
   - **User Impact:** Display error message "URL slug already exists or is reserved"

2. **Invalid Content Serialization**
   - **Scenario:** BlockNote blocks fail to serialize to Markdown
   - **Handling:** Fallback to storing blocks_json only, log error
   - **User Impact:** Show warning but allow saving

3. **Image Upload Failure**
   - **Scenario:** Image upload to R2 fails during content editing
   - **Handling:** Revert to original image, show retry option
   - **User Impact:** Image remains as base64/blob until upload succeeds

4. **Page Not Found (404)**
   - **Scenario:** Visitor accesses non-existent dynamic URL
   - **Handling:** Return 404 page template with proper HTTP status
   - **User Impact:** Standard 404 error page with navigation

5. **Authentication Failure**
   - **Scenario:** Non-admin user attempts to access admin endpoints
   - **Handling:** Return 403 with login prompt
   - **User Impact:** Redirect to login or show access denied message

## Testing Strategy

### Unit Testing
- **Page Serialization**: Test BlockNote to Markdown conversion
- **Slug Validation**: Test uniqueness and reserved route checking
- **SEO Metadata Mapping**: Test SEO component integration
- **Markdown Rendering**: Test HTML generation from Markdown

### Integration Testing
- **Admin CRUD Flow**: Test complete page creation/editing workflow
- **Image Upload Integration**: Test R2 upload during content editing
- **Public Page Access**: Test dynamic route fetching and rendering
- **Cache Invalidation**: Test cache updates on page changes

### End-to-End Testing
- **Admin Page Creation**: Full admin workflow from creating to publishing
- **Public Page Viewing**: Visitor experience from URL access to content display
- **SEO Integration**: Verify meta tags and structured data in public pages
- **Content Management**: Test editing, updating, and deleting pages

## Implementation Phases

### Phase 1: Database & API Foundation
1. Create `pages` table migration following existing migration patterns
2. Implement `pages.ts` module with CRUD operations
3. Add API routes to Cloudflare Workers configuration
4. Integrate with existing auth middleware

### Phase 2: Admin Interface
1. Create `PageEditor` component extending BlockNoteEditor patterns
2. Implement `PageList` component with existing admin patterns
3. Add routing for admin pages section
4. Integrate with existing form validation

### Phase 3: Web Application
1. Create dynamic route `[...slug].astro`
2. Implement Markdown renderer component
3. Integrate with SEO component
4. Add 404 handling for non-existent pages

### Phase 4: Integration & Polish
1. Add comprehensive error handling
2. Implement caching strategy
3. Add caching invalidation patterns
4. Performance optimization and testing

This design ensures full compatibility with the existing codebase while providing a robust foundation for dynamic page management within the Black Living e-commerce platform.

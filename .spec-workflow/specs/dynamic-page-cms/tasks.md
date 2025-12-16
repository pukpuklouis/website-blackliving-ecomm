# Tasks Document: Dynamic Page CMS Module

- [x] 1. Update database schema in packages/db/schema.ts
  - File: packages/db/schema.ts
  - Add pages table definition with proper types and relationships
  - Export Page and NewPage types
  - Purpose: Define TypeScript schema for pages table
  - _Leverage: existing table definitions in packages/db/schema.ts_
  - _Requirements: 4.1_
  - _Prompt: Implement the task for spec dynamic-page-cms, first run spec-workflow-guide to get the workflow guide then implement the task: Role: TypeScript Developer with Drizzle ORM expertise | Task: Add pages table schema to packages/db/schema.ts following requirement 4.1, using existing table patterns and type exports | Restrictions: Must follow Drizzle schema conventions, include all required fields from design, export proper types | Success: Schema compiles without errors, types are properly exported, follows existing patterns_

- [x] 2. Generate pages table migration using Drizzle
  - Command: pnpm -F db db:generate
  - Generate SQL migration file for pages table
  - Follow existing migration naming patterns
  - Purpose: Create database migration for pages table
  - _Leverage: existing migration files in packages/db/migrations/_
  - _Requirements: 4.1_
  - _Prompt: Implement the task for spec dynamic-page-cms, first run spec-workflow-guide to get the workflow guide then implement the task: Role: Database Developer specializing in Drizzle ORM | Task: Generate pages table migration using pnpm -F db db:generate following requirement 4.1, ensuring migration includes all schema changes | Restrictions: Must run generate command after schema update, do not modify generated SQL files manually | Success: Migration file is generated correctly, contains all pages table changes, follows Drizzle naming conventions_

- [x] 3. Create shared constants for reserved routes
  - File: packages/types/src/constants.ts
  - Define RESERVED_ROUTES array with protected slugs (/admin, /api, /shop, etc.)
  - Export for use in both API validation and admin form validation
  - Purpose: Centralized source of truth for route validation
  - _Leverage: existing constants patterns in packages/types_
  - _Requirements: 1.2_
  - _Prompt: Implement the task for spec dynamic-page-cms, first run spec-workflow-guide to get the workflow guide then implement the task: Role: TypeScript Developer | Task: Create shared constants file with RESERVED_ROUTES array following requirement 1.2, ensuring both API and admin client can reference the same validation rules | Restrictions: Must include all protected routes, follow existing constants patterns, export properly for cross-package usage | Success: Constants file created, routes defined, both API and admin can import and use the same list_

- [x] 4. Create pages API module in apps/api/src/modules/pages.ts
  - File: apps/api/src/modules/pages.ts
  - Implement CRUD operations for pages (create, read, update, delete)
  - Add slug uniqueness validation and reserved route checking
  - Integrate with existing auth middleware for admin-only access
  - Purpose: Provide backend API for page management
  - _Leverage: apps/api/src/modules/products.ts, apps/api/src/middleware/auth.ts_
  - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 1.6, 1.7, 4.2_
  - _Prompt: Implement the task for spec dynamic-page-cms, first run spec-workflow-guide to get the workflow guide then implement the task: Role: Cloudflare Workers API Developer | Task: Create pages module with full CRUD operations following requirements 1.1-1.7 and 4.2, leveraging products module patterns and auth middleware | Restrictions: Must validate slugs against reserved routes, implement admin-only access, follow existing API patterns | Success: All CRUD operations work correctly, slug validation prevents conflicts, auth middleware properly integrated_

- [x] 4.5. Add page serialization service utility
  - File: apps/api/src/lib/pageSerialization.ts
  - Create utility to convert BlockNote blocks to Markdown
  - Handle image URLs and formatting
  - Purpose: Enable dual storage of blocks and rendered markdown
  - _Leverage: BlockNote types, marked library_
  - _Requirements: 1.5_
  - _Prompt: Implement the task for spec dynamic-page-cms, first run spec-workflow-guide to get the workflow guide then implement the task: Role: JavaScript Developer specializing in content serialization | Task: Create page serialization utility following requirement 1.5, converting BlockNote blocks to Markdown with proper formatting | Restrictions: Must handle all BlockNote block types, preserve image URLs, ensure clean Markdown output | Success: BlockNote blocks serialize to valid Markdown, images are properly handled, utility is testable and reusable_

- [x] 5. Add API routes for pages in Cloudflare Workers
  - File: apps/api/src/routes/pages.ts
  - Create routes for admin CRUD operations and public read by slug
  - Integrate with pages module and auth middleware
  - Purpose: Expose page API endpoints
  - _Leverage: apps/api/src/routes/products.ts, existing route patterns_
  - _Requirements: 4.2_
  - _Prompt: Implement the task for spec dynamic-page-cms, first run spec-workflow-guide to get the workflow guide then implement the task: Role: API Routing Developer | Task: Create page routes following requirement 4.2, implementing admin CRUD and public read endpoints using existing route patterns | Restrictions: Must separate admin and public routes, apply auth middleware correctly, follow REST conventions | Success: Routes are properly configured, admin endpoints require auth, public endpoints work for published pages_

- [x] 6. Update wrangler.toml with page routes
  - File: apps/api/wrangler.toml
  - Add page route patterns to Cloudflare Workers configuration
  - Purpose: Enable page API endpoints in deployment
  - _Leverage: existing route configurations in wrangler.toml_
  - _Requirements: 4.2_
  - _Prompt: Implement the task for spec dynamic-page-cms, first run spec-workflow-guide to get the workflow guide then implement the task: Role: Cloudflare Developer | Task: Update wrangler.toml to include page routes following requirement 4.2, using existing configuration patterns | Restrictions: Must not break existing routes, follow Cloudflare Workers routing syntax | Success: Page routes are properly configured, deployment includes new endpoints_

- [x] 7. Create PageList admin component with TanStack Table
  - File: apps/admin/app/routes/dashboard/pages.tsx
  - Implement page listing with TanStack Table, CRUD operations, and comprehensive filtering
  - Add search by title/slug, status filtering, date range filtering, and sorting
  - Include pagination, bulk operations, and responsive design
  - Purpose: Advanced admin interface for managing pages with powerful data table features
  - _Leverage: apps/admin/app/routes/dashboard/products.tsx, BatchOperationsToolbar, TanStack Table_
  - _Requirements: 1.1_
  - _Prompt: Implement the task for spec dynamic-page-cms, first run spec-workflow-guide to get the workflow guide then implement the task: Role: React Admin Developer specializing in data tables | Task: Create PageList component with TanStack Table following requirement 1.1, implementing comprehensive search/filtering (title, slug, status, date range), sorting, pagination, and bulk operations using existing admin patterns | Restrictions: Must use TanStack Table for data management, implement robust filtering/search capabilities, follow admin UI patterns, maintain consistent styling and performance | Success: Page list displays with advanced filtering/search, TanStack Table works correctly, CRUD operations functional, follows admin design patterns_

- [x] 8. Create PageForm component in apps/admin/app/components/PageForm.tsx
  - Form for page title, slug, status, and SEO metadata
  - Include slug validation and auto-generation
  - Purpose: Handle page metadata input
  - _Leverage: existing admin form components, ProductEditPage.tsx_
  - _Requirements: 1.2, 1.6_
  - _Prompt: Implement the task for spec dynamic-page-cms, first run spec-workflow-guide to get the workflow guide then implement the task: Role: React Form Developer | Task: Create PageForm component following requirements 1.2 and 1.6, using existing form patterns and validation | Restrictions: Must validate slugs properly, auto-generate slugs from titles, follow form validation patterns | Success: Form validates correctly, slug generation works, integrates with page creation/editing_

- [x] 9. Create PageEditor component with dual storage
  - File: apps/admin/app/components/PageEditor.tsx
  - Extend BlockNoteEditor patterns for dual storage (blocks_json + rendered_markdown)
  - Capture both BlockNote blocks JSON and serialized Markdown on changes
  - Handle image uploads to R2 storage
  - Purpose: Visual page content editor with dual format storage
  - _Leverage: apps/admin/app/components/editor/BlockNoteEditor.tsx, ImageUploadContext_
  - _Requirements: 1.3, 1.4, 1.5_
  - _Prompt: Implement the task for spec dynamic-page-cms, first run spec-workflow-guide to get the workflow guide then implement the task: Role: React Editor Developer | Task: Create PageEditor component extending BlockNoteEditor patterns for dual storage following requirements 1.3-1.5, capturing both blocks JSON and rendered Markdown | Restrictions: Must extend existing BlockNoteEditor patterns, handle image uploads to R2, store both formats simultaneously, follow existing editor architecture | Success: Editor captures blocks_json and rendered_markdown correctly, images upload to R2, integrates with existing patterns_

- [x] 10. Add admin routing for pages
  - File: apps/admin/app/routes.ts
  - Add page management routes to admin routing
  - Purpose: Enable navigation to page management
  - _Leverage: existing admin route patterns_
  - _Requirements: 1.1_
  - _Prompt: Implement the task for spec dynamic-page-cms, first run spec-workflow-guide to get the workflow guide then implement the task: Role: React Router Developer | Task: Add page routes to admin routing following requirement 1.1, using existing route patterns | Restrictions: Must follow React Router conventions, integrate with existing admin navigation | Success: Page routes are accessible, navigation works correctly_

- [x] 11. Create dynamic route handler in web app
  - File: apps/web/src/pages/[...slug].astro
  - Implement catch-all route for dynamic pages
  - Fetch page by slug from API
  - Render 404 for non-existent pages
  - Purpose: Dynamic page rendering
  - _Leverage: existing Astro page patterns, SEO component_
  - _Requirements: 2.1, 2.2, 2.3, 2.5_
  - _Prompt: Implement the task for spec dynamic-page-cms, first run spec-workflow-guide to get the workflow guide then implement the task: Role: Astro Developer | Task: Create dynamic route handler following requirements 2.1-2.3 and 2.5, using existing page patterns | Restrictions: Must handle SSR properly, implement 404 fallback, follow Astro conventions | Success: Dynamic routes work correctly, published pages render, 404 shows for missing pages_

- [x] 12. Create Markdown renderer component
  - File: apps/web/src/components/MarkdownRenderer.astro
  - Render Markdown content with syntax highlighting
  - Apply site typography and styling
  - Purpose: Display page content
  - _Leverage: marked library, Tailwind Typography_
  - _Requirements: 2.4, 2.6_
  - _Prompt: Implement the task for spec dynamic-page-cms, first run spec-workflow-guide to get the workflow guide then implement the task: Role: Astro Component Developer | Task: Create Markdown renderer following requirements 2.4 and 2.6, using marked and Tailwind Typography | Restrictions: Must sanitize content for security, apply consistent styling, support GFM | Success: Markdown renders correctly, styling matches site design, content is properly sanitized_

- [x] 13. Integrate SEO component with dynamic pages
  - File: apps/web/src/pages/[...slug].astro (modify)
  - Map page metadata to SEO component props
  - Handle featured images and descriptions
  - Purpose: Enable SEO for dynamic pages
  - _Leverage: apps/web/src/components/SEO.astro_
  - _Requirements: 3.1, 3.2, 3.3_
  - _Prompt: Implement the task for spec dynamic-page-cms, first run spec-workflow-guide to get the workflow guide then implement the task: Role: SEO Integration Developer | Task: Integrate SEO component with dynamic pages following requirements 3.1-3.3, mapping metadata correctly | Restrictions: Must handle missing metadata gracefully, use proper Open Graph types, follow existing SEO patterns | Success: SEO metadata renders correctly, Open Graph images work, search engines can index pages_

- [x] 14. Configure sitemap integration for dynamic pages
  - File: apps/web/astro.config.mjs (modify)
  - Add dynamic page slugs to sitemap generation
  - Fetch published page slugs from API
  - Purpose: Ensure dynamic pages appear in sitemap.xml
  - _Leverage: @astrojs/sitemap configuration, existing API patterns_
  - _Requirements: 3.4_
  - _Prompt: Implement the task for spec dynamic-page-cms, first run spec-workflow-guide to get the workflow guide then implement the task: Role: Astro Configuration Developer | Task: Configure sitemap integration following requirement 3.4, fetching dynamic page slugs from API for sitemap generation | Restrictions: Must handle API failures gracefully, only include published pages, follow Astro sitemap conventions | Success: Dynamic pages appear in sitemap.xml, sitemap generates correctly, published pages only_

- [x] 15. Add comprehensive error handling
  - Files: apps/api/src/modules/pages.ts, apps/web/src/pages/[...slug].astro
  - Handle serialization failures, API errors, 404s
  - Add proper error logging and user feedback
  - Purpose: Improve system reliability
  - _Leverage: existing error handling patterns_
  - _Requirements: NFR Reliability, Security_
  - _Prompt: Implement the task for spec dynamic-page-cms, first run spec-workflow-guide to get the workflow guide then implement the task: Role: Error Handling Developer | Task: Add comprehensive error handling following NFR requirements, handling serialization failures and API errors | Restrictions: Must not expose sensitive information, provide user-friendly error messages, follow existing error patterns | Success: Errors are handled gracefully, users see appropriate messages, system remains stable_

- [x] 15. Implement caching strategy in apps/api/src/modules/pages.ts (modify), apps/api/src/modules/pages.ts (modify)
  - Add page response caching with invalidation
  - Cache published page content
  - Purpose: Improve performance
  - _Leverage: existing cache patterns in apps/api/src/lib/cache.ts_
  - _Requirements: NFR Performance_
  - _Prompt: Implement the task for spec dynamic-page-cms, first run spec-workflow-guide to get the workflow guide then implement the task: Role: Caching Developer | Task: Implement caching strategy following NFR Performance requirements, using existing cache patterns | Restrictions: Must invalidate cache on page updates, follow existing caching conventions, ensure cache consistency | Success: Page responses are cached appropriately, cache invalidates on updates, performance improves_

- [x] 16. Add unit tests for page serialization
  - File: apps/api/test/pageSerialization.test.ts
  - Test BlockNote to Markdown conversion
  - Test image URL handling
  - Purpose: Ensure serialization reliability
  - _Leverage: existing test patterns in apps/api/test/_
  - _Requirements: Testing Strategy_
  - _Prompt: Implement the task for spec dynamic-page-cms, first run spec-workflow-guide to get the workflow guide then implement the task: Role: Test Developer | Task: Add unit tests for page serialization following testing strategy, covering BlockNote conversion and image handling | Restrictions: Must test edge cases, follow existing test patterns, ensure good coverage | Success: Serialization tests pass, edge cases covered, tests are maintainable_

- [x] 17. Add integration tests for pages API
  - File: apps/api/test/pages.integration.test.ts
  - Test CRUD operations and slug validation
  - Test auth middleware integration
  - Purpose: Ensure API reliability
  - _Leverage: existing integration test patterns_
  - _Requirements: Testing Strategy_
  - _Prompt: Implement the task for spec dynamic-page-cms, first run spec-workflow-guide to get the workflow guide then implement the task: Role: Integration Test Developer | Task: Add integration tests for pages API following testing strategy, covering CRUD and auth | Restrictions: Must test real database operations, follow existing test patterns, ensure isolation | Success: API integration tests pass, auth works correctly, tests are reliable_

- [x] 18. Add E2E tests for admin page management
  - File: apps/admin/test/pages.e2e.test.ts
  - Test complete page creation and editing workflow
  - Test BlockNote editor integration
  - Purpose: Validate end-to-end functionality
  - _Leverage: existing E2E test patterns with Playwright_
  - _Requirements: Testing Strategy_
  - _Prompt: Implement the task for spec dynamic-page-cms, first run spec-workflow-guide to get the workflow guide then implement the task: Role: E2E Test Developer | Task: Add E2E tests for admin page management following testing strategy, using Playwright for complete workflows | Restrictions: Must test real user interactions, follow existing E2E patterns, ensure test stability | Success: E2E tests validate complete workflows, editor integration works, tests run reliably_

- [x] 19. Performance optimization and final polish
  - Files: Various files as needed
  - Optimize Markdown rendering performance
  - Add loading states and error boundaries
  - Final code cleanup and documentation
  - Purpose: Production readiness
  - _Leverage: existing performance patterns_
  - _Requirements: NFR Performance, Implementation Phases 4_
  - _Prompt: Implement the task for spec dynamic-page-cms, first run spec-workflow-guide to get the workflow guide then implement the task: Role: Performance Optimization Developer | Task: Perform final optimization and polish following NFR Performance and Phase 4 requirements | Restrictions: Must not break existing functionality, focus on performance improvements, ensure production readiness | Success: Performance is optimized, code is clean, system is production-ready_
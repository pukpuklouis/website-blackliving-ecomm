# Requirements Document: Dynamic Page CMS Module

## Introduction

This module establishes a complete workflow for content production to frontend rendering within the monorepo architecture. It enables administrators to create and edit pages using a visual block editor (BlockNote), which are then serialized to Markdown and stored. A dynamic catch-all route in the web application then retrieves and renders this content, allowing for flexible page creation without code changes.

## Alignment with Product Vision

This feature empowers the marketing and content teams to manage website content independently, reducing dependency on developers for creating standard informational pages (e.g., landing pages, policy pages, promotional content). It leverages the existing "Black Living" premium brand aesthetic through shared UI components and ensures high performance and SEO optimization using Astro and Cloudflare R2.

## Requirements

### Requirement 1: Admin Page Management

**User Story:** As an Admin, I want to create, edit, and manage dynamic pages using a visual editor, so that I can easily publish new content to the website without writing code.

#### Acceptance Criteria

1.  WHEN the admin navigates to the "Pages" section in the dashboard, THEN they SHALL see a list of existing dynamic pages.
2.  WHEN the admin clicks "Create New Page", THEN they SHALL be presented with a form to enter the Page Title, URL Slug, and Content.
3.  WHEN the admin edits the content, THEN they SHALL use the `BlockNoteEditor` component.
4.  **Image Upload:** WHEN the admin pastes or uploads an image in the editor, THEN the system SHALL upload the file to Cloudflare R2, return the public URL, and replace the local blob/base64 in the editor with the permanent R2 URL.
5.  **Dual Storage:** WHEN the admin saves the page, THEN the system SHALL store BOTH:
    *   `blocks_json` (JSONB): The raw BlockNote state for full editing fidelity.
    *   `rendered_markdown` (Text): The serialized Markdown for efficient frontend rendering.
6.  IF the slug is already in use OR matches a reserved route (e.g., `admin`, `login`, `api`, `about`, `shop`,`/blog`,`/appointments`,`/shop`,`/account`,`/login`,`/register`,`/forgot-password`,`/reset-password`,`/verify-email`,`/cart`), THEN the system SHALL prevent saving and show an error message to avoid conflicts with static Astro pages.
7.  WHEN the admin sets the status to "Published", THEN the page SHALL be accessible on the public website.

### Requirement 2: Dynamic Web Routing & Rendering

**User Story:** As a Website Visitor, I want to view pages created by the admin at their specific URLs, so that I can access the latest content.

#### Acceptance Criteria

1.  **Routing:** The web app SHALL use Astro's dynamic route `src/pages/[...slug].astro` to catch all undefined paths.
2.  **SSR/Hybrid:** The Astro configuration SHALL be set to `output: 'server'` (SSR) or `hybrid` to enable dynamic content fetching from the database.
3.  **Content Fetching:** WHEN a visitor accesses a dynamic URL, THEN the system SHALL query the database for the published page matching the slug.
4.  **Rendering:** IF a page is found, THEN the system SHALL render the `rendered_markdown` content using a lightweight Markdown parser (e.g., `marked` or `astro-remote`) with GitHub Flavored Markdown (GFM) support.
5.  **404 Fallback:** IF no matching page is found, THEN the system SHALL render the standard 404 error page.
6.  **Styling:** The rendered content SHALL use the site's standard typography and layout components (Tailwind CSS typography plugin).

### Requirement 3: SEO Integration

**User Story:** As a Marketing Manager, I want dynamic pages to be fully optimized for search engines, so that they rank well and look good when shared on social media.

#### Acceptance Criteria

1.  **Centralized SEO:** The dynamic page template SHALL use the existing `apps/web/src/components/SEO.astro` component.
2.  **Metadata Mapping:** The system SHALL map the dynamic page's metadata to the SEO component props:
    *   `title`: Page Title
    *   `description`: Page Description (or auto-generated excerpt)
    *   `image`: Featured Image (if available) or default OG image
    *   `type`: 'article' or 'website'
3.  **Structured Data:** The system SHALL optionally support injecting JSON-LD schema for specific page types if defined in the admin.

### Requirement 4: Data Storage & API

**User Story:** As a Developer, I want a structured data schema for pages, so that content is stored efficiently and can be retrieved quickly by slug.

#### Acceptance Criteria

1.  **Schema:** The database SHALL include a `pages` table with the following fields:
    *   `id` (UUID)
    *   `slug` (String, Unique, Indexed)
    *   `title` (String)
    *   `blocks_json` (JSONB) - For Admin Editor
    *   `rendered_markdown` (Text) - For Web Renderer
    *   `status` (Enum: Draft, Published)
    *   `meta_title` (String, Optional)
    *   `meta_description` (String, Optional)
    *   `featured_image` (String, Optional)
    *   `created_at`, `updated_at`
2.  **API:** The API SHALL provide endpoints for:
    *   Admin: CRUD operations for pages (using `blocks_json`).
    *   Web: Read-only fetch by slug (using `rendered_markdown`).

## Non-Functional Requirements

### Code Architecture and Modularity
-   **Single Responsibility Principle**: The CMS logic should be encapsulated in its own modules (e.g., `apps/api/src/modules/pages.ts`, `packages/db/schema.ts`).
-   **Modular Design**: The renderer component in the web app should be reusable.
-   **Shared Components**: Use `BlockNoteEditor` from the shared admin components.

### Performance
-   **Caching**: Dynamic page responses should be cached (e.g., using Cloudflare KV or similar mechanism if available in the future) to ensure fast load times.
-   **Optimization**: Markdown parsing should be efficient and not block the main thread significantly.

### Security
-   **Input Validation**: Slugs must be validated to ensure they are URL-safe and do not conflict with reserved routes.
-   **Sanitization**: Markdown content rendered on the client must be sanitized to prevent XSS attacks.
-   **Access Control**: Only authenticated admins can create/edit pages.

### Reliability
-   **Fallback**: The catch-all route must correctly fallback to 404 without crashing the application if a slug is not found.

### Usability
-   **Editor Experience**: The BlockNote editor should provide a "WYSIWYG-like" experience that closely resembles the final output.
-   **Slug Management**: The system should suggest a slug based on the title but allow manual editing.
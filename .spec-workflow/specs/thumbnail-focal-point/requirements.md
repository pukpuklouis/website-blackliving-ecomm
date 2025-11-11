# Requirements Document

## Introduction

Implement focal point editing for blog post thumbnails so editors can control how images appear across the storefront. The feature adds thumbnail uploads via Cloudflare R2, focal point persistence in D1, and front-end rendering that respects the stored focus coordinates.

## Alignment with Product Vision

Precise thumbnail presentation supports Black Living’s premium brand story by ensuring editorial content, product highlights, and hero imagery stay visually balanced across devices without manual image editing.

## Requirements

### Requirement 1

**User Story:** As a content editor, I want to save thumbnail focal coordinates for each post so that the preview cards highlight the intended subject.

#### Acceptance Criteria

1. WHEN the composer PATCHes `/api/posts/:id/thumbnail-focal` with `thumbFocalX` or `thumbFocalY` outside 0..1 THEN the API SHALL respond with 400 and a validation error.
2. IF the post ID does not exist THEN the API SHALL respond with 404 `{"error":"not found"}`.
3. WHEN valid coordinates are saved THEN the API SHALL persist `thumb_focal_x`, `thumb_focal_y`, `thumb_render_mode` and update `updated_at`.

### Requirement 2

**User Story:** As a content editor, I want to upload a thumbnail through the admin composer so that the file is stored securely in R2 with a public URL.

#### Acceptance Criteria

1. WHEN the composer POSTs `/api/uploads` without a `file` field THEN the API SHALL respond with 400 `{"error":"file required"}`.
2. WHEN a valid file is posted THEN the API SHALL write it to R2 using `thumbnails/${timestamp}-${uuid}.${ext}` and respond with 200 including the object key and public URL.
3. WHEN the upload succeeds THEN the admin SHALL persist the returned URL into `posts.thumbnail_url`.

### Requirement 3

**User Story:** As a shopper, I want blog cards to frame thumbnails around the stored focal point so that key subjects stay centered on every layout.

#### Acceptance Criteria

1. WHEN a post has `thumbnail_url` THEN the web card SHALL render the image with `object-position` derived from `(thumb_focal_x, thumb_focal_y)` and default to `50% 50%` if values are missing.
2. WHEN a post lacks `thumbnail_url` THEN the card SHALL hide the image container or show the existing placeholder without errors.
3. WHEN designers preview cards in 1:1, 4:3, or 16:9 wrappers THEN the rendered subject SHALL align with the chosen focal point.

## Non-Functional Requirements

### Code Architecture and Modularity
- **Single Responsibility Principle**: Keep upload handling, focal persistence, and rendering concerns isolated across API, admin UI, and web layers.
- **Modular Design**: Reuse shared packages (db schema, types, UI) instead of duplicating logic inside apps.
- **Dependency Management**: Use existing Better Auth/Breadcrumb patterns; avoid introducing new storage libraries.
- **Clear Interfaces**: Expose focal point props through typed interfaces between admin components and API calls.

### Performance
- Persist focal metadata alongside the existing `posts` row to avoid extra lookups; uploads must stream directly to R2 without buffering entire files in memory.

### Security
- All uploads route through the Worker API; enforce MIME checks and reject disallowed types; never expose R2 credentials to clients.

### Reliability
- Default focal values to 0.5/0.5 to keep legacy posts stable; ensure trigger updates `updated_at`; handle R2 or DB failures with surfaced errors.

### Usability
- Admin picker provides keyboard/mouse adjustments, reset, and numeric inputs with immediate visual feedback; front-end fallbacks prevent layout shifts on missing thumbnails.
`

# Code Review: Meilisearch Integration

## Overview
Reviewed the implementation of the Meilisearch integration across the monorepo. The implementation largely follows the PRD and Design documents, with a clear separation of concerns and robust error handling.

## Status
- **Backend**: Implemented (`SearchModule`, Routes, Sync Hooks).
- **Frontend**: Implemented (`MeiliSearchService`, `SearchStore`, Analytics).
- **Admin**: Implemented (`Settings` page, Service).
- **Shared**: Implemented (Types, Sync Utils).

## Findings

### 1. Code Duplication in Reindexing Logic (High Priority)
- **Issue**: `apps/api/src/modules/search.ts` contains inline logic for transforming products, posts, and pages into search documents within the `reindexAll` function.
- **Conflict**: A dedicated utility `apps/api/src/utils/searchSync.ts` was created later with `transformProduct`, `transformPost`, and `transformPage` functions.
- **Risk**: If the transformation logic changes (e.g., how we strip HTML or format dates), we have to update it in two places (the sync hooks and the reindex function).
- **Recommendation**: Refactor `apps/api/src/modules/search.ts` to import and use the transformation functions from `apps/api/src/utils/searchSync.ts`.

### 2. Security & Configuration
- **Strengths**:
  - Master key is never sent to the frontend.
  - Admin routes (`/config`, `/reindex`) are protected by `requireAdmin`.
  - Public key endpoint is cached.
- **Observation**: In `apps/api/src/routes/search-keys.ts`, there is a fallback: `const publicKey = config.searchKey || 'placeholder-search-key';`. Ensure this doesn't cause issues if a key isn't actually generated yet.

### 3. Error Handling & Fallbacks
- **Strengths**:
  - `MeiliSearchService` in the frontend gracefully falls back to the legacy API (`fetchUnifiedSearch`) if Meilisearch is unreachable or fails.
  - Sync hooks in `products.ts`, `posts.ts`, etc., use `.catch()` to prevent search indexing failures from blocking the main database operations.

### 4. Analytics
- **Strengths**:
  - Dedicated `AnalyticsService` created.
  - Tracks queries, clicks, and errors.
  - Privacy-focused (no PII logged by default).

### 5. Testing
- **Strengths**:
  - Integration tests added in `apps/api/src/tests/search.integration.test.ts`.
  - Mocks Meilisearch client to avoid needing a running instance for tests.

## Next Steps
1.  **Refactor `apps/api/src/modules/search.ts`** to use `searchSync.ts`.
2.  **Verify `apps/api/src/index.ts`** exports/routes to ensure everything is wired up (looks correct in diffs).
3.  **Run Tests**: Execute the new integration tests to confirm functionality.

# Search Performance Improvement Plan: Migrating to Fuse.js

**Project:** Black Living E-commerce Website
**Date:** 2025-09-27
**Author:** Gemini
**Status:** Proposed

## 1. Executive Summary

### Problem
The current site-wide search functionality relies on real-time `LIKE` queries directly against the D1 database. This approach has significant performance drawbacks:
- **High Latency:** `LIKE` queries, especially with wildcards (`%term%`), are inefficient and slow down as the dataset grows.
- **Heavy Database Load:** Every search keystroke (after debounce) triggers expensive queries, putting unnecessary strain on our D1 database resources.
- **Limited Search Quality:** Standard SQL `LIKE` provides basic substring matching but lacks true fuzzy search capabilities (typo tolerance, relevance scoring).

### Solution
This plan outlines a migration from the current database-driven search to a pre-indexed, client-side search architecture powered by **Fuse.js**.

We will generate a static JSON file (`search-index.json`) containing all searchable content (products, posts, pages) during the website's build process. The frontend will fetch this file once, initialize Fuse.js with the data, and perform all subsequent searches in the user's browser.

### Benefits
- **Drastic Performance Increase:** Search will be nearly instantaneous, as it will run locally on the client without any network latency.
- **Zero Database Load:** The D1 database will no longer be involved in search queries, freeing up resources for core transactional operations.
- **Improved Search Experience:** Fuse.js provides superior fuzzy search capabilities, offering more relevant results and tolerance for typos.
- **Reduced Complexity:** The backend API endpoint for search can be deprecated, simplifying the codebase.

## 2. Key Technologies

- **Fuse.js:** A lightweight and powerful fuzzy-search library for client-side searching on JSON data.
- **Cloudflare Pages/Workers:** To serve the static `search-index.json` file efficiently.
- **Drizzle ORM:** To fetch the initial data from the D1 database during the indexing step.
- **pnpm Scripts:** To orchestrate the index generation during the build process.

## 3. Phased Implementation Plan

### Phase 1: Create the Data Indexing Script

The first step is to create a script that fetches all necessary data from the database and formats it into a single JSON file.

1.  **Create the Script File:**
    -   Create a new file at `apps/api/src/scripts/build-search-index.ts`.

2.  **Implement the Script Logic:**
    -   The script will connect to the D1 database using the existing Drizzle client.
    -   It will fetch all published `products` and `posts`.
    -   It will incorporate the `STATIC_PAGES` array currently defined in `apps/api/src/routes/search.ts`.
    -   All data will be mapped and normalized into a unified format suitable for Fuse.js. Example structure:
        ```json
        [
          { "type": "product", "id": "...", "title": "...", "description": "...", "slug": "...", "href": "..." },
          { "type": "post", "id": "...", "title": "...", "description": "...", "slug": "...", "href": "..." },
          { "type": "page", "id": "...", "title": "...", "description": "...", "slug": "...", "href": "..." }
        ]
        ```
    -   The final array will be written to `apps/web/public/search-index.json`.

3.  **Add `package.json` Script:**
    -   In `apps/api/package.json`, add a new script:
        ```json
        "scripts": {
          "build:search-index": "tsx src/scripts/build-search-index.ts"
        }
        ```

### Phase 2: Refactor the Frontend Search Store

Next, we'll modify the frontend Zustand store to use Fuse.js instead of the API.

1.  **Install Fuse.js:**
    -   Run `pnpm --filter web add fuse.js`.

2.  **Update `searchStore.ts` (`apps/web/src/stores/searchStore.ts`):**
    -   **Add New State:** Introduce state to hold the complete dataset and the Fuse.js instance:
        ```typescript
        interface SearchStoreState {
          // ... existing state
          searchData: UnifiedSearchResult[];
          fuseInstance: Fuse<UnifiedSearchResult> | null;
          isInitialized: boolean;
        }
        ```
    -   **Create an Initialization Function:** Add a new async function `initializeSearch` to the store.
        -   This function will fetch `/search-index.json`.
        -   It will instantiate Fuse.js with the fetched data and configure the keys to search (e.g., `title`, `description`, `slug`).
        -   `const fuse = new Fuse(data, { keys: ['title', 'description'], includeScore: true });`
        -   It will set `searchData` and `fuseInstance` in the store.
    -   **Modify the `search` Function:**
        -   Remove the call to `fetchUnifiedSearch`.
        -   If the `fuseInstance` is ready, call `fuseInstance.search(query)`.
        -   Map the Fuse.js results (which are in the format `{ item, refIndex, score }`) back to the `SearchResultSections` format expected by the UI.
        -   Update the `results` state.
    -   **Trigger Initialization:** In `SearchModal.tsx`, use a `useEffect` hook to call the `initializeSearch` function once when the component mounts.

### Phase 3: Update Build Process & Deprecate Old API

Finally, we'll integrate the indexing script into the build process and clean up the old code.

1.  **Integrate into Build:**
    -   In the root `package.json`, modify the `build` script to run the indexing script before building the web app.
        ```json
        "scripts": {
          "build": "pnpm --filter api run build:search-index && turbo run build"
        }
        ```
    -   This ensures a fresh `search-index.json` is generated with every deployment.

2.  **Cleanup:**
    -   Once the frontend is fully migrated and tested, the following can be safely removed:
        -   The `/api/search` route handler: `apps/api/src/routes/search.ts`.
        -   The `searchRouter` registration in `apps/api/src/index.ts`.
        -   The `fetchUnifiedSearch` function in `apps/web/src/services/searchService.ts`.
        -   The cache logic in `apps/api/src/lib/search-cache.ts`.

## 4. Trade-offs & Considerations

-   **Data Freshness:** The search index will only be as fresh as the last deployment. Content added to the CMS will not appear in search results until the site is rebuilt and redeployed. For this project's scale, this is an acceptable trade-off for the immense performance gain.
-   **Initial Load:** The `search-index.json` file will be fetched on the first load of a page containing the search modal. We must monitor its size, but given the current data volume, it is expected to be small and not impact initial page load significantly.

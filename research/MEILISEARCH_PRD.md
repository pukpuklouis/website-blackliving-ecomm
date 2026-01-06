# Meilisearch Integration PRD

## 1. Overview
Integrate **Meilisearch** into the Black Living e-commerce platform to provide fast, typo-tolerant, and instant search capabilities for Products, Blog Posts, and Pages.

**Meilisearch Instance**: `https://meilisearch.anlstudio.cc/`

## 2. Goals
- **Instant Search**: Replace the current SQL-based search with Meilisearch for sub-50ms response times.
- **Unified Search**: Search across Products, Posts, and Pages simultaneously.
- **Admin Configuration**: Allow admins to configure Meilisearch credentials and trigger re-indexing from the dashboard.
- **Automatic Syncing**: Automatically update the search index when content is created, updated, or deleted.

## 3. Architecture

### 3.1 Frontend (`apps/web`)
- **Library**: Use `meilisearch-js` directly or `react-instantsearch` (if advanced UI features are needed). Given the current custom UI in `SearchModal.tsx`, using the `meilisearch-js` client directly within `searchService.ts` is recommended to maintain full control over the UI.
- **Search Key**: The frontend will use a **Public Search Key** (safe to expose) to query Meilisearch directly. This reduces load on the `apps/api` backend.

### 3.2 Admin (`apps/admin`)
- **Settings Page**: Add a "Search Configuration" section to `apps/admin/app/routes/dashboard/settings.tsx`.
- **Features**:
  - Input fields for `Meilisearch Host` and `Master Key` (or Admin Key).
  - "Save Configuration" button (saves to Backend KV/D1).
  - "Re-index All" button (triggers a backend job to wipe and re-fill indexes).

### 3.3 Backend (`apps/api`)
- **Configuration Storage**: Store Meilisearch credentials securely (e.g., in Cloudflare KV or D1 Settings table).
- **Indexing Endpoints**:
  - `POST /api/search/config`: Save host and keys.
  - `POST /api/search/reindex`: Trigger a full re-index of all content.
  - `GET /api/search/keys`: Endpoint for Frontend to fetch the Public Search Key (optional, or bake into build env).
- **Data Syncing**:
  - Implement hooks in `products.ts`, `posts.ts`, and `pages.ts` modules.
  - On `create`/`update`: `index.addDocuments(...)`
  - On `delete`: `index.deleteDocument(...)`

## 4. Implementation Plan

### Phase 1: Backend & Admin Configuration
1.  **API**: Create `SearchModule` in `apps/api/src/modules/search.ts`.
    -   Implement `saveConfig`, `getConfig`, `reindexAll`.
    -   `reindexAll` should fetch all Products, Posts, and Pages and push them to Meilisearch.
2.  **Admin**: Update `apps/admin/app/routes/dashboard/settings.tsx`.
    -   Add form for Host and Master Key.
    -   Add "Re-index" button with loading state.

### Phase 2: Data Syncing
1.  **Modify Modules**: Update `apps/api/src/modules/{products,posts,pages}.ts`.
    -   Inject `SearchModule` or a helper to sync changes to Meilisearch immediately after DB operations.
    -   Ensure "Draft" items are NOT indexed (or indexed with a `published: false` filter).

### Phase 3: Frontend Integration
1.  **Service**: Rewrite `apps/web/src/services/searchService.ts`.
    -   Initialize `MeiliSearch` client.
    -   Implement `fetchUnifiedSearch` to query multiple indexes (`products`, `posts`, `pages`) or a single unified index.
    -   *Recommendation*: Use separate indexes for relevance tuning, or a single index with a `type` attribute for simplicity. A single index is usually easier for a global search bar.
2.  **Store**: Update `apps/web/src/stores/searchStore.ts` if necessary (likely minimal changes if `searchService` interface is kept).

## 5. Data Structure (Index Schema)

**Index Name**: `blackliving_content` (or separate `products`, `posts`, `pages`)

**Common Fields**:
- `id`: Unique ID (e.g., `product_123`, `post_456`)
- `type`: `product` | `post` | `page`
- `title`: String
- `slug`: String
- `description`: String
- `content`: String (truncated/stripped HTML)
- `image`: String (URL)
- `category`: String (for filtering)
- `tags`: Array<String>
- `updatedAt`: Timestamp

## 6. Security
- **Frontend**: Only has access to the **Public Search Key**.
- **Backend/Admin**: Has access to the **Master Key** (stored securely).
- **Meilisearch Instance**: Ensure it is secured and only accepts requests with valid keys.

## 7. Tasks Checklist
- [ ] **Backend**: Implement `SearchService` in `apps/api`.
- [ ] **Backend**: Implement `POST /api/search/config` & `POST /api/search/reindex`.
- [ ] **Backend**: Add sync hooks to Product/Post/Page CRUD.
- [ ] **Admin**: Create Search Settings UI.
- [ ] **Frontend**: Replace `fetchUnifiedSearch` with Meilisearch client.

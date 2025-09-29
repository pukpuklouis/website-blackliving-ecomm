# Black Living 黑哥家居 - README

歡迎來到 Black Living 黑哥家居電商平台專案！本文件將引導您完成專案的設定、開發與部署流程。

## 📜 專案概覽 (Project Overview)

"Black Living 黑哥家居" 是一個現代化的電商平台，旨在提供高品質的家居產品購物體驗。此專案包含一個面向顧客的網站、一個管理後台，以及支援所有業務邏輯的強大 API。

## 🛠️ 技術棧 (Tech Stack)

本專案採用 Monorepo 架構，整合了多種現代技術，以實現高效開發與部署。

| 類別            | 技術                                 | 用途                                   |
| :-------------- | :----------------------------------- | :------------------------------------- |
| **套件管理**    | PNPM, Turborepo                      | 管理 Monorepo 中的相依性與建置流程     |
| **前端 (顧客)** | Astro                                | `apps/web` - 顧客購物網站              |
| **前端 (管理)** | React, Vite, React Router            | `apps/admin` - 內部管理儀表板          |
| **後端 API**    | Cloudflare Workers, Hono             | `apps/api` - 無伺服器 API              |
| **資料庫**      | Cloudflare D1 (SQLite), Drizzle ORM  | `packages/db` - 資料庫結構與查詢       |
| **認證系統**    | Better Auth                          | `packages/auth` - 使用者認證與會話管理 |
| **雲端儲存**    | Cloudflare R2                        | 圖片與靜態資源儲存                     |
| **快取**        | Cloudflare KV                        | API 回應快取                           |
| **UI 元件庫**   | Shadcn UI, Tailwind CSS              | `packages/ui` - 共享的 UI 元件與樣式   |
| **部署平台**    | Cloudflare Pages, Cloudflare Workers | Staging 與 Production 環境             |
| **CI/CD**       | GitHub Actions                       | 自動化測試與部署流程                   |

## 🏗️ 系統架構 (Architecture)

本專案使用 Turborepo 管理的 Monorepo 架構，將不同的應用程式與共享的程式碼包組織在同一個儲存庫中。

```
website-blackliving-ecomm/
├── apps/
│   ├── web/          # (Astro) 面向顧客的網站
│   ├── admin/        # (React) 內部管理儀表板
│   └── api/          # (Cloudflare Workers) 核心後端 API
├── packages/
│   ├── auth/         # (Better Auth) 共享的認證邏輯
│   ├── db/           # (Drizzle ORM) 資料庫 schema 與遷移腳本
│   ├── ui/           # (React/Shadcn) 共享的 UI 元件
│   ├── types/        # (TypeScript) 共享的型別定義
│   └── tailwind-config/  # 共享的 Tailwind CSS 設定
├── deploy.sh         # 自動化部署腳本
└── .github/          # GitHub Actions CI/CD 設定
```

## 🚀 環境設定與快速入門 (Setup & Quick Start)

請依照以下步驟在本機環境中啟動專案。

**先決條件:**

- [Node.js](https://nodejs.org/) >= `18.0.0`
- [PNPM](https://pnpm.io/installation) >= `9.5.0`
- [Git](https://git-scm.com/)

**步驟:**

1.  **複製儲存庫**

    ```bash
    git clone <repository-url>
    cd website-blackliving-ecomm
    ```

2.  **安裝相依套件**

    ```bash
    pnpm install
    ```

3.  **設定環境變數**
    複製範例檔案並填入您的密鑰。

    ```bash
    cp .env.example .env
    ```

    您需要在 `.env` 檔案中填寫 `BETTER_AUTH_SECRET`, `JWT_SECRET`, `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET` 等變數（詳見下方「環境變數」章節）。

4.  **初始化本地資料庫**
    此指令會清除舊的本地 D1 實例並套用最新的資料庫遷移。

    ```bash
    rm -rf .wrangler/state/v3/d1/ && pnpm -F db db:migrate:prod
    ```

5.  **啟動所有開發伺服器**
    此指令會同時啟動 `web`, `admin`, `api` 三個應用程式。

    ```bash
    pnpm dev
    ```

6.  **瀏覽本地服務**
    - **顧客網站**: [http://localhost:4321](http://localhost:4321)
    - **管理後台**: [http://localhost:5173](http://localhost:5173)
    - **API 端點**: [http://localhost:8787](http://localhost:8787)

## ⚙️ 常用指令 (Essential Scripts)

以下是開發過程中最常用的指令：

| 指令                         | 描述                                        |
| :--------------------------- | :------------------------------------------ |
| `pnpm dev`                   | 同時啟動所有應用程式的開發伺服器。          |
| `pnpm dev -F <app>`          | 啟動特定應用程式，例如 `pnpm dev -F api`。  |
| `pnpm build`                 | 建置所有應用程式，用於部署前測試。          |
| `pnpm lint`                  | 執行 ESLint 程式碼風格檢查。                |
| `pnpm type-check`            | 執行 TypeScript 型別檢查。                  |
| `pnpm test`                  | 執行單元測試與整合測試。                    |
| `pnpm -F db db:generate`     | 根據 `schema` 變更產生新的資料庫遷移檔案。  |
| `pnpm -F db db:migrate:prod` | 將遷移套用到 Cloudflare D1 生產環境資料庫。 |
| `pnpm -F db db:studio`       | 啟動 Drizzle Studio 以瀏覽本地資料庫。      |

## ☁️ 部署流程 (Deployment)

我們使用 Cloudflare Pages 和 Workers 部署 Staging 與 Production 環境。

**1. Cloudflare 資源設定 (首次部署)**
您需要使用 `wrangler` CLI 工具建立必要的 Cloudflare 資源。

```bash
# 登入 Cloudflare
wrangler whoami

# 建立 Staging 環境資源
wrangler d1 create blackliving-db-staging
wrangler r2 bucket create blackliving-images-staging
wrangler kv:namespace create CACHE --preview

# 建立 Production 環境資源
wrangler d1 create blackliving-db
wrangler r2 bucket create blackliving-images
wrangler kv:namespace create CACHE
```

**2. 更新 `wrangler.toml`**
將上一步產生的資源 ID 填入 `apps/api/wrangler.toml` 的對應環境中。

**3. 設定環境密鑰**
將必要的密鑰設定到 Cloudflare 環境中（詳見下方「環境變數」章節）。

```bash
# 範例：設定 Staging 環境的密鑰
wrangler secret put BETTER_AUTH_SECRET --env staging
```

**4. 部署應用程式**
我們提供自動化腳本簡化部署流程。

```bash
# 部署到 Staging 環境
./deploy.sh staging

# 部署到 Production 環境
./deploy.sh production
```

**手動部署流程：**

- **API (Workers):**
  ```bash
  cd apps/api
  wrangler deploy --env <staging|production>
  ```
- **Web/Admin (Pages):**
  ```bash
  # 以 Web App 為例
  cd apps/web
  pnpm build
  wrangler pages deploy dist --project-name <blackliving-web-staging|blackliving-web>
  ```

## 🔑 環境變數與密鑰管理 (Environment & Secrets)

以下是專案運作所需的環境變數。本地開發時請存放於根目錄的 `.env` 檔案；部署時需透過 `wrangler secret put` 指令設定。

| 變數                   | 描述                             | 如何取得                                                                            |
| :--------------------- | :------------------------------- | :---------------------------------------------------------------------------------- |
| `BETTER_AUTH_SECRET`   | Better Auth 用於加密會話的密鑰。 | 使用 `openssl rand -base64 32` 產生。                                               |
| `JWT_SECRET`           | 用於簽發與驗證 JWT 的密鑰。      | 使用 `openssl rand -base64 32` 產生。                                               |
| `GOOGLE_CLIENT_ID`     | Google OAuth 2.0 用戶端 ID。     | 從 [Google Cloud Console](https://console.cloud.google.com/apis/credentials) 取得。 |
| `GOOGLE_CLIENT_SECRET` | Google OAuth 2.0 用戶端密鑰。    | 從 [Google Cloud Console](https://console.cloud.google.com/apis/credentials) 取得。 |

**設定密鑰範例:**

### Magic Link 驗證相關環境變數

新的預約驗證流程需要額外設定以下變數：

- `TURNSTILE_SECRET_KEY`、`PUBLIC_TURNSTILE_SITE_KEY`：分別供 API 與前端執行 Cloudflare Turnstile 驗證。
- `RESEND_API_KEY`、`RESEND_FROM_EMAIL`：用於透過 Resend 寄送一次性 Magic Link。寄件位址必須先完成 Resend 驗證。
- `JWT_SECRET`：重新簽發 Access/Refresh Token 時使用，請確保與 Cloudflare Workers 端設定一致。

```bash
# 設定 Production 環境的 Google Client ID
wrangler secret put GOOGLE_CLIENT_ID --env production
```

**Blog Categories — Dynamic Source + Caching (2025-09-21)**

- Admin Blog Composer no longer uses hardcoded or z.enum categories. It loads categories from the database via the API and stores `categoryId` in posts. The legacy `category` string field is still sent for backward compatibility.
- Categories are cached in Cloudflare KV to avoid excessive DB queries. Cache is only invalidated when categories change.

API Endpoints
- `GET /api/posts/categories` — Returns active post categories. Cached with KV for 24h. Tag: `post-categories`.
- `GET /api/posts/categories/:slug` — Returns a single category plus `postsCount`. Cached for 24h. Tag: `post-categories`.
- `POST /api/posts/categories/cache/invalidate` — Admin-only. Invalidates all category caches (use after add/edit/delete category).

Caching Details
- KV keys: `blog:categories:active`, `blog:category:{slug}`.
- TTL: 86400 seconds (24h).
- Invalidation: tag-based via `post-categories`.

Admin UI Behavior
- File: `apps/admin/app/components/BlogComposer.tsx`
- Loads categories from `PUBLIC_API_URL + /api/posts/categories` on mount.
- Form stores `categoryId` and also syncs `category` (name) for compatibility.
- On create, defaults to the first active category.

Database Schema
- Table: `post_categories` (see `packages/db/schema.ts`).
- Seed sample categories in `apps/api/scripts/seed-database.ts` (function `seedPostCategories`).

Environment
- Admin app uses `PUBLIC_API_URL` to reach the API (see `apps/admin/package.json` dev script setting).

Operational Notes
- When you add or modify categories, call the invalidation endpoint to refresh cache:
  - Example:
    ```bash
    curl -X POST -H "Authorization: Bearer <admin-token>" \
      "${PUBLIC_API_URL}/api/posts/categories/cache/invalidate"
    ```
- Consider wiring category CRUD (when implemented) to call this invalidation endpoint automatically upon mutations.

Verification Checklist
- Start API and Admin apps.
- Ensure categories appear in the Blog Composer category dropdown.
- Update or add a category in DB; call the invalidate endpoint; refresh the Admin page and confirm the list updates.

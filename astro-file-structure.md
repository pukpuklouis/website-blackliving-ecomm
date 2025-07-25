# 專案架構建議：採用 Monorepo

考量到儀表板、產品管理 (CMS) 和支付等複雜功能，建議採用 Monorepo 架構。這能提供更好的擴展性、安全性和開發彈性。

以下是根據 **2025-07-22 會議結論**並整合 **Better Auth** 認證機制的完整建議結構：

```
/
├── apps/
│   │
│   ├── web/                  # 公開的客戶端網站 (Astro)
│   │   ├── src/
│   │   │   ├── components/         # 可重複使用的 UI 元件
│   │   │   │   ├── Header.astro
│   │   │   │   ├── Footer.astro
│   │   │   │   ├── HeroSlider.astro
│   │   │   │   ├── FeatureIcons.astro
│   │   │   │   ├── ProductCard.astro
│   │   │   │   ├── TestimonialWall.astro
│   │   │   │   ├── SEO.astro
│   │   │   │   ├── FloatingButtons.astro
│   │   │   │   ├── AppointmentForm.tsx
│   │   │   │   ├── ProductVariantSelector.tsx
│   │   │   │   └── ShoppingCart.tsx
│   │   │   │
│   │   │   ├── layouts/
│   │   │   │   ├── BaseLayout.astro
│   │   │   │   ├── ProductLayout.astro
│   │   │   │   └── PostLayout.astro
│   │   │   │
│   │   │   ├── pages/
│   │   │   │   ├── index.astro
│   │   │   │   ├── about.astro
│   │   │   │   ├── testimonials.astro
│   │   │   │   ├── appointment.astro
│   │   │   │   ├── cart.astro
│   │   │   │   ├── checkout.astro
│   │   │   │   │
│   │   │   │   ├── simmons-black/
│   │   │   │   │   ├── index.astro
│   │   │   │   │   └── [productSlug].astro
│   │   │   │   │
│   │   │   │   ├── accessories/
│   │   │   │   │   ├── index.astro
│   │   │   │   │   └── [productSlug].astro
│   │   │   │   │
│   │   │   │   ├── us-imports/
│   │   │   │   │   └── index.astro
│   │   │   │   │
│   │   │   │   ├── posts/
│   │   │   │   │   ├── index.astro
│   │   │   │   │   └── [postSlug].astro
│   │   │   │   │
│   │   │   │   ├── account/              # 會員中心 (由 Better Auth 保護)
│   │   │   │   │   ├── index.astro         # 登入頁 (Better Auth UI)
│   │   │   │   │   ├── profile.astro       # 個人資料
│   │   │   │   │   ├── orders.astro        # 訂單歷史
│   │   │   │   │   └── appointments.astro  # 預約狀態與更新
│   │   │   │   │
│   │   │   │   ├── api/
│   │   │   │   │   └── auth/
│   │   │   │   │       └── [...betterauth].ts # Better Auth 的 API 路由
│   │   │   │   │
│   │   │   │   └── 404.astro
│   │   │   │
│   │   │   ├── styles/
│   │   │   │   └── global.css
│   │   │   │
│   │   │   └── content/
│   │   │       ├── config.ts
│   │   │       ├── posts/
│   │   │       │   └── post-1.mdx
│   │   │       └── products/
│   │   │           └── product-1.json
│   │   │
│   │   ├── public/
│   │   │   └── favicon.svg
│   │   │
│   │   ├── astro.config.mjs
│   │   └── package.json
│   │
│   ├── admin/                # 管理後台 (Vite + React + TanStack + shadcn/ui)
│   │   ├── src/
│   │   │   ├── api/          # TanStack Query API 客戶端定義
│   │   │   │   ├── products.ts
│   │   │   │   ├── orders.ts
│   │   │   │   └── appointments.ts
│   │   │   │
│   │   │   ├── components/
│   │   │   │   ├── layout/       # Dashboard layout (sidebar, header)
│   │   │   │   └── ui/           # UI components from shadcn/ui
│   │   │   │
│   │   │   ├── lib/            # Shadcn utils, helper functions
│   │   │   │
│   │   │   ├── pages/
│   │   │   │   ├── LoginPage.tsx
│   │   │   │   ├── DashboardPage.tsx
│   │   │   │   ├── ProductsPage.tsx
│   │   │   │   ├── OrdersPage.tsx
│   │   │   │   ├── PostManagement.tsx
│   │   │   │   ├── BlogComposer.tsx
│   │   │   │   └── AppointmentsPage.tsx
│   │   │   │
│   │   │   ├── main.tsx
│   │   │   └── App.tsx
│   │   │
│   │   ├── index.html
│   │   ├── package.json
│   │   ├── postcss.config.js
│   │   ├── tailwind.config.ts
│   │   └── vite.config.ts
│   │
│   └── api/                  # 後端服務 (Hono on Cloudflare Workers)
│       ├── src/
│       │   ├── index.ts      # Hono 入口，將整合 Better Auth 中介軟體
│       │   │
│       │   └── modules/      # API 模組
│       │       ├── products.ts
│       │       ├── orders.ts
│       │       └── appointments.ts
│       │
│       ├── package.json
│       ├── tsconfig.json
│       └── wrangler.toml
│
├── packages/
│   │
│   ├── auth/                 # 共享的 Better Auth 設定
│   │   ├── index.ts          # Better Auth 實例與提供者設定
│   │   └── package.json
│   │
│   ├── ui/                   # 共享的 shadcn/ui 元件庫
│   │   ├── components/
│   │   │   └── ui/
│   │   ├── lib/
│   │   │   └── utils.ts
│   │   └── package.json
│   │
│   ├── db/
│   │   ├── schema.prisma     # User schema 會由 Better Auth 管理
│   │   └── client.ts
│   │
│   └── types/
│       └── index.ts
│
├── package.json
├── pnpm-workspace.yaml
└── turborepo.json
```

### 功能對應說明：

1.  **使用者認證 (User Authentication)**:
    *   **核心技術**: 整個認證流程將由 **Better Auth** 框架處理。
    *   **共享設定**: `packages/auth` 將包含所有 Better Auth 的核心設定，例如資料庫適配器 (Drizzle)、認證提供者 (Email/Password、Google 等)，供 `web` 和 `api` 應用程式共享。
    *   **前端處理**: `apps/web` 中的 `src/pages/api/auth/[...betterauth].ts` 將作為 Better Auth 的端點，處理登入、登出、回呼等所有 HTTP 請求。
    *   **後端整合**: `apps/api` 的 Hono 服務將使用 Better Auth 的中介軟體來保護需要認證的路由 (例如 `/api/orders`, `/api/appointments/update`)。

2.  **儀表板 (Dashboard) & 產品管理 (CMS)**:
    *   建置在 `apps/admin`，後台管理員的認證也將由 Better Auth 處理，只是角色權限不同。
    *   這些功能將建置在 `apps/admin` 應用程式中，採用 **Vite + React Router** 的 SPA (單頁應用程式) 架構。
        *   **UI 設計**: 整個儀表板的 UI 將由 **shadcn/ui** 和 **Tailwind CSS** 驅動，提供一個現代化、一致且易於客製化的介面。
        *   **路由管理**: 使用 **React Router** 處理所有客戶端路由 (例如 `/dashboard`, `/products`, `/orders`)。
        *   **數據管理**: 使用 **TanStack Query** 來管理與後端 `api` 服務的數據同步。它會處理所有數據的獲取、緩存、重新驗證和狀態更新，是儀表板的核心。
        *   **數據表格**: 對於產品和訂單列表，強烈建議使用 **TanStack Table** 搭配 `shadcn/ui` 的表格元件，以實現強大的數據展示功能。
        *   `admin` 應用程式將會是一個受密碼保護的獨立網站（例如 `admin.blackliving.com`），提供極佳的性能和互動體驗。
    
3.  **支付流程 (Payment Process)**:
    *    支付邏輯應由後端處理，以確保安全。這部分會放在 `apps/api` 服務中。
        - **流程**:
          1. 客戶在 `apps/web` 的結帳頁面點擊「付款」。
          2. apps/web` 向 `apps/api` 發送請求，建立一個支付訂單。
          3. 建立支付訂單後，引導去預約試躺表單。
          4. 客戶希望維持 **公司帳戶匯款** 的設定。使用者必須登入後不須連到付款。
    
4.  **SEO 管理 (SEO Management)**:
    *   **核心元件**: `src/components/SEO.astro` 是管理全站 SEO 標籤的中心化模組。
    *   **功能**: 此元件將統一處理所有頁面的 `<title>`, `<meta description>`, `canonical` URL，以及 Open Graph (for Facebook, LINE) 和 Twitter Cards 的社群分享標籤，以及 `LocalBusiness` schema , sitemap and `google tag manager`  及 llm.txt 。
    *   **運作方式**: 在 `BaseLayout.astro`  `ProductLayout.astro` `PostLayout.astro` 或其他佈局檔案中引用 `SEO.astro`，並將每頁的標題、描述、特色圖片等資訊作為 props 傳入。這樣既能確保 SEO 結構的一致性，又能為不同頁面（如商品頁、文章頁）動態產生專屬的 SEO 內容。

5.  **程式碼共享**:
    *   `packages/auth`: 共享 Better Auth 設定，確保前後端認證邏輯一致。
    *   `packages/types`: 共享 TypeScript 類型定義。
    *   `packages/db`: `schema.prisma` 中的 `User` 模型將根據 Better Auth 的要求進行定義。
    *   `packages/ui`: 共享 UI 元件庫。

這個更新後的架構將 Better Auth 作為核心，提供了一個更專業、更安全的認證解決方案。


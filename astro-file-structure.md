# 專案架構建議：採用 Monorepo

考量到儀表板、產品管理 (CMS) 和支付等複雜功能，建議採用 Monorepo 架構。這能提供更好的擴展性、安全性和開發彈性。

以下是使用 `pnpm` 和 `Turborepo` 的建議結構：

```
/
├── apps/
│   │
│   ├── web/                  # 公開的客戶端網站 (Astro)
│   │   ├── src/
│   │   │   ├── components/         # 可重複使用的 UI 元件
│   │   │   │   ├── Header.astro
│   │   │   │   ├── Footer.astro
│   │   │   │   ├── ProductCard.astro
│   │   │   │   ├── PromotionBanner.astro
│   │   │   │   ├── AppointmentForm.astro
│   │   │   │   ├── ReviewCard.astro
│   │   │   │   └── ShoppingCart.tsx    # 購物車 (建議使用React/Svelte等客戶端框架以處理狀態)
│   │   │   │
│   │   │   ├── layouts/            # 頁面佈局
│   │   │   │   ├── BaseLayout.astro
│   │   │   │   ├── ProductLayout.astro
│   │   │   │   └── PostLayout.astro
│   │   │   │
│   │   │   ├── pages/              # 網站路由 (每個檔案都是一個頁面)
│   │   │   │   ├── index.astro
│   │   │   │   ├── about.astro
│   │   │   │   ├── faq.astro
│   │   │   │   ├── appointment.astro
│   │   │   │   ├── cart.astro          # 購物車頁面
│   │   │   │   ├── checkout.astro      # 結帳頁面
│   │   │   │   │
│   │   │   │   ├── products/
│   │   │   │   │   ├── index.astro
│   │   │   │   │   └── [productSlug].astro
│   │   │   │   │
│   │   │   │   ├── categories/
│   │   │   │   │   └── [categorySlug].astro
│   │   │   │   │
│   │   │   │   ├── blog/
│   │   │   │   │   ├── index.astro
│   │   │   │   │   └── [postSlug].astro
│   │   │   │   │
│   │   │   │   ├── legal/
│   │   │   │   │   ├── privacy-policy.astro
│   │   │   │   │   ├── shipping-policy.astro
│   │   │   │   │   ├── warranty.astro
│   │   │   │   │   └── terms.astro
│   │   │   │   │
│   │   │   │   └── 404.astro
│   │   │   │
│   │   │   ├── styles/
│   │   │   │   └── global.css
│   │   │   │
│   │   │   └── content/            # Markdown/JSON 內容集合
│   │   │       ├── config.ts
│   │   │       ├── blog/
│   │   │       │   ├── post-1.mdx
│   │   │       │   └── post-2.mdx
│   │   │       └── products/
│   │   │           ├── purple-harmony-pillow.json
│   │   │           └── simmons-black-series.json
│   │   │
│   │   └── astro.config.mjs
│   │
│   ├── admin/                # 管理後台 (Vite + React + TanStack + shadcn/ui)
│   │   ├── src/
│   │   │   ├── api/          # TanStack Query API 客戶端定義
│   │   │   │   ├── index.ts
│   │   │   │   ├── products.ts
│   │   │   │   ├── orders.ts
│   │   │   │   └── customers.ts
│   │   │   │
│   │   │   ├── components/
│   │   │   │   ├── layout/       # Dashboard layout (sidebar, header)
│   │   │   │   └── ui/           # UI components from shadcn/ui (e.g., Button, Card, Table)
│   │   │   │
│   │   │   ├── lib/            # Shadcn utils, helper functions
│   │   │   │
│   │   │   ├── pages/
│   │   │   │   ├── LoginPage.tsx
│   │   │   │   ├── DashboardPage.tsx
│   │   │   │   ├── ProductsPage.tsx
│   │   │   │   ├── OrdersPage.tsx
│   │   │   │   └── CustomersPage.tsx
│   │   │   │
│   │   │   ├── main.tsx
│   │   │   └── App.tsx
│   │   │
│   │   ├── index.html
│   │   ├── package.json
│   │   ├── postcss.config.js   # For Tailwind CSS
│   │   ├── tailwind.config.ts  # For Tailwind CSS
│   │   └── vite.config.ts
│   │
│   └── api/                  # 後端服務 (建議使用 Hono)
│       ├── src/
│       │   ├── modules/
│       │   │   ├── auth/
│       │   │   ├── products/
│       │   │   ├── orders/
│       │   │   ├── customers/  # 客戶管理 (CRUD)
│       │   │   └── payments/
│       │   └── main.ts
│       └── ...
│
├── packages/
│   │
│   ├── ui/                   # 共享的 shadcn/ui 元件庫
│   │   ├── components/
│   │   │   └── ui/           # 由 shadcn/ui CLI 產生的元件 (e.g., button.tsx, card.tsx)
│   │   ├── lib/
│   │   │   └── utils.ts      # Shadcn utils
│   │   └── package.json
│   │
│   ├── db/
│   │   ├── schema.prisma
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

1.  **儀表板 (Dashboard) & 產品管理 (CMS)**:
    *   這些功能將建置在 `apps/admin` 應用程式中，採用 **Vite + React** 的 SPA (單頁應用程式) 架構。
    *   **UI 設計**: 整個儀表板的 UI 將由 **shadcn/ui** 和 **Tailwind CSS** 驅動，提供一個現代化、一致且易於客製化的介面。
    *   **路由管理**: 使用 **React Router** 處理所有客戶端路由 (例如 `/dashboard`, `/products`, `/orders`)。
    *   **數據管理**: 使用 **TanStack Query** 來管理與後端 `api` 服務的數據同步。它會處理所有數據的獲取、緩存、重新驗證和狀態更新，是儀表板的核心。
    *   **數據表格**: 對於產品和訂單列表，強烈建議使用 **TanStack Table** 搭配 `shadcn/ui` 的表格元件，以實現強大的數據展示功能。
    *   `admin` 應用程式將會是一個受密碼保護的獨立網站（例如 `admin.blackliving.com`），提供極佳的性能和互動體驗。

2.  **支付流程 (Payment Process)**:
    *   支付邏輯應由後端處理，以確保安全。這部分會放在 `apps/api` 服務中。
    *   **流程**:
        1.  客戶在 `apps/web` 的結帳頁面點擊「付款」。
        2.  `apps/web` 向 `apps/api` 發送請求，建立一個支付訂單。
        3.  `apps/api` 與支付閘道（如 Stripe、藍新金流）互動，產生一個支付 session。
        4.  `apps/api` 將支付 session 的資訊回傳給 `apps/web`。
        5.  `apps/web` 將用戶重導向至支付閘道的頁面完成付款。
        6.  支付閘道透過 Webhook 通知 `apps/api` 付款成功，`apps/api` 更新訂單狀態。

3.  **程式碼共享**:
    *   `packages/types`: `api`, `admin`, `web` 三個應用程式可以共享相同的 TypeScript 類型定義（例如 `Product`, `Order` 的類型），確保資料一致性。
    *   `packages/db`: `api` 和需要讀取資料的後端任務可以共享 `Prisma` 的 schema 和客戶端。
    *   `packages/ui`: 這將是一個共享的 UI 元件庫，基於 `shadcn/ui`。`admin` 應用程式將直接使用這些元件。`web` 應用程式（Astro）也可以透過整合 React 元件的方式，使用這個共享庫中的元件，從而確保整個平台的視覺風格一致。

這個 Monorepo 架構為專案的長期發展提供了堅實的基礎，能夠清晰地分離不同部分的職責，同時又能在需要時方便地共享程式碼。

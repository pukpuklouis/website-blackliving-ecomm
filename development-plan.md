### **Black Living 黑哥居家 - 全功能電商網站建置計畫 (Cloudflare Edge & Astro)**

這個計畫的核心是將運算、資料儲存和靜態資源全部推向「邊緣 (Edge)」，以最大化全球使用者的載入速度和互動體驗。

---

#### **技術棧總覽 (Tech Stack Overview)**

*   **前端框架 (Frontend Framework):** **Astro** - 用於建構以內容為主的頁面，並透過「島嶼架構」嵌入互動元件。
*   **UI 元件庫 (UI Library):** **Shadcn** - 用於開發需要高度互動性的「Island」，例如購物車、管理後台等。
*   **認證 (Authentication):** **Better Auth** - 用於處理使用者登入、Session 管理與路由保護。
*   **狀態管理 (State Management):** **Zustand** - 一個輕量、快速的 React 狀態管理函式庫。
*   **樣式方案 (Styling):** **Tailwind CSS** - 一個 Utility-First 的 CSS 框架，能快速建構現代化介面。
*   **內容編輯器(CMSEditor)**：Novel.sh - 一個Notion like 的內文編輯，能快速編輯Blog post
*   **後端運算 (Backend Compute):** **Cloudflare Workers** - 在 Cloudflare 的全球網路上運行的 Serverless Functions。
*   **API 框架 (API Framework):** **Hono** - 一個專為 Edge 環境設計的輕量級 Web 框架，用於在 Worker 中建構 API。
*   **主要資料庫 (Primary Database):** **Cloudflare D1** (基於 SQLite) 或 **Neon** (Serverless Postgres)。我們將使用 **Drizzle ORM** 來操作資料庫，它對 Serverless 環境非常友好。
*   **資料庫快取 (Database Cache):** **Cloudflare Hyperdrive** - 用於加速 Worker 對 D1 的連線。
*   **物件儲存 (Object Storage):** **Cloudflare R2** - 用於儲存所有產品圖片、使用者上傳的檔案等。
*   **鍵值儲存 (Key-Value Store):** **Cloudflare KV** - 用於快取 API 回應、儲存 Session 資料等，以進一步優化速度。
*   **資料驗證 (Schema Validation):** **Zod** - 用於驗證前端表單輸入和後端 API 的資料格式，確保資料一致性。
*   **部署 (Deployment):** **Cloudflare Pages** - 用於部署 Astro 前端，並與 Cloudflare Workers 無縫整合。

---

#### **第一階段：Cloudflare 後端與資料層建置**

此階段的目標是使用 Cloudflare 生態系建立一個穩固、高效的後端服務。

1.  **環境與資料庫設定：**
    *   使用 `wrangler` 初始化 Cloudflare Workers 專案。
    *   選擇 D1 或 Neon 作為主要資料庫，並使用 **Drizzle ORM** 定義 `Product`, `Order` 的資料庫綱要 (Schema)。`User` 綱要將由 Better Auth 管理。
    *   設定 **R2** 儲存桶 (Bucket) 用於存放商品圖片。
    *   設定 **KV** 命名空間 (Namespace) 用於快取。
    *   如果使用 Neon，設定 **Hyperdrive** 來連接資料庫。
2.  **API 開發 (with Hono on Cloudflare Workers):**
    *   **認證機制 (Authentication with Better Auth):**
        *   導入 **Better Auth** 作為主要的認證解決方案，取代手動實作。
        *   在 Hono 中介軟體 (Middleware) 中整合 Better Auth，用於驗證與保護需要登入的 API 路由。
        *   Astro 前端將建立一個 `pages/api/auth/[...betterauth].ts` 路由，來處理所有由 Better Auth 管理的認證端點。
    *   **產品 API (`/api/products/*`):**
        *   `GET /`: 獲取熱門產品列表，優先從 **KV** 快取讀取，若無則從 D1/Neon 查詢並寫入快取。
        *   `GET /:id`: 獲取單一產品詳情。
    *   **管理員 API (需 Better Auth Admin 角色驗證):**
        *   `POST /admin/products`: 新增產品，並將圖片上傳至 **R2**。
        *   `PUT /admin/products/:id`: 更新產品資訊。
        *   `GET /admin/orders`: 查詢所有訂單。
        *   `PUT /admin/orders/:id`: 更新訂單狀態。

---

#### **第二階段：Astro 前端與 React 島嶼開發**

此階段專注於打造使用者介面與核心購物體驗。

1.  **Astro 專案設定：**
    *   初始化 Astro 專案，並整合 **React** 和 **Tailwind CSS**。
    *   建立全站共用的版面 (`Layout.astro`)，包含頁首、頁尾。
2.  **靜態頁面開發 (Astro):**
    *   `index.astro` (首頁): 根據 `insights.md` 規劃，建構大部分的靜態內容。
    *   `products/[...slug].astro` (產品詳情頁): 伺服器端渲染 (SSR) 產生每個產品的靜態頁面。
    *   `about.astro`, `faq.astro`, `contact.astro` 等內容頁面。
3.  **互動式島嶼開發 (React + Zustand + Zod):**
    *   **`AddToCartButton.tsx`:** 一個互動按鈕，點擊後使用 Zustand 更新全域的購物車狀態。
    *   **`ShoppingCart.tsx`:** 一個懸浮或獨立頁面的購物車元件，顯示 Zustand 中的購物車內容，並可與後端 API 同步。
    *   **`Auth.tsx`:** 使用 **Better Auth** 提供的 React Hooks 或預建元件來處理登入、註冊、登出及顯示使用者狀態。
    *   **`ProductGallery.tsx`:** 產品詳情頁中的圖片瀏覽器。

---

#### **第三階段：完整流程整合與管理後台**

此階段將前後端串連，並完成金流與管理功能。

1.  **結帳與金流 (公司帳戶匯款流程)：**
    *   建立結帳頁面 (`checkout.astro`)，此頁面將受 Better Auth 保護，未登入者會被導向登入。
    *   使用者點擊「下單」後，前端將訂單資訊傳送至後端 `POST /api/orders` API。
    *   後端 API 在資料庫中建立訂單，並將其狀態設為「待付款」。
    *   訂單成功建立後，前端會將使用者引導至「預約試躺」表單頁面，完成下單流程。
    *   付款方式為「公司帳戶匯款」，相關資訊將顯示在訂單確認頁面與會員中心，不需串接即時金流服務。
2.  **使用者中心 (React  Island):**
    *   建立 `/account/profile`, `/account/orders`, 和 `/account/appointments` 路由，由 Better Auth 保護。
    *   開發 `ProfileEditor.tsx` 和 `OrderHistory.tsx` 元件，讓使用者管理個人資料與查詢訂單。
    *   新增 `AppointmentManager.tsx` 元件，讓登入使用者可以查看、更新或取消自己的預約。
3.  **管理後台 (Admin Dashboard):**
    *   建立一個受密碼保護的 `/admin` 路由群組。
    *   開發一系列 React 管理介面元件：使用Shadcn ui 建立完整的Dashboard
        *   `Dashboard.tsx`: 顯示銷售數據圖表。
        *   `ProductManagement.tsx`: 完整的產品 CRUD 操作介面。
        *   `OrderManagement.tsx`: 查看訂單詳情並更新出貨狀態。
        *   `PostManagemnt.tsx` ：用table 管理發文, CRUD操作介面。
        *   `BlogComposer.tsx`：novel.sh Markdown編輯器，快速編輯發文
4.  **部署與優化：**
    *   將 Astro 前端專案部署至 **Cloudflare Pages**。
    *   將 Worker 後端專案部署至 **Cloudflare Workers**。
    *   設定自訂網域，並確保所有 Cloudflare 服務 (R2, KV, D1) 都已正確配置。

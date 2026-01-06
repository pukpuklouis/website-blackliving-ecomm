# Black Living 黑哥家居 - 客戶網站

Black Living（黑哥家居）台灣頂級 Simmons 床墊零售商的現代化電商網站。採用 Astro、React 和 Cloudflare 技術建置，實現最佳效能和 SEO。

## 🚀 概述

這是 Black Living 線上商店的客戶端網頁應用程式，提供頂級床墊和家居用品的無縫購物體驗，特色包括：

- **現代化 UI**：採用 React islands 和 shadcn/ui 元件
- **Edge 效能**：部署在 Cloudflare Pages 上，全域 CDN
- **SEO 優化**：使用 Astro 的伺服器端渲染，提供卓越的搜尋排名
- **行動優先**：回應式設計，觸控優化互動
- **認證系統**：安全的用戶帳戶和訂單管理
- **多語言支援**：支援繁體中文 (zh-TW) 和英文

## 🏗️ 架構

### 技術棧

- **框架**：[Astro 5](https://astro.build/) 搭配 React islands
- **樣式**：[Tailwind CSS v4](https://tailwindcss.com/) 自訂設計系統
- **UI 元件**：[shadcn/ui](https://ui.shadcn.com/) 元件
- **部署**：[Cloudflare Pages](https://pages.cloudflare.com/)
- **後端 API**：Cloudflare Workers（見 `apps/api/`）
- **資料庫**：Cloudflare D1 (SQLite)
- **儲存**：Cloudflare R2 圖片儲存
- **認證**：Better Auth 整合

### 主要特色

- **伺服器端渲染**：快速初始頁面載入和卓越 SEO
- **Edge 運算**：Cloudflare 邊緣網路的全域部署
- **圖片優化**：自動圖片處理和 CDN 交付
- **型別安全**：完整的 TypeScript 支援和嚴格型別檢查
- **測試**：使用 Vitest 的完整測試套件
- **效能監控**：內建效能追蹤和優化

## 📁 專案結構

```
apps/web/
├── src/
│   ├── components/     # React 元件
│   ├── layouts/        # Astro 頁面佈局
│   ├── pages/          # Astro 頁面（基於檔案的路由）
│   ├── styles/         # 全域樣式和 CSS
│   ├── assets/         # 靜態資源（字體、圖片）
│   └── lib/            # 工具函數和助手
├── public/             # 在根目錄提供服務的靜態檔案
├── .env.local          # 本地開發環境
├── .env.staging        # 測試環境建置
├── astro.config.mjs    # Astro 配置
├── tailwind.config.js  # Tailwind CSS 配置
├── components.json     # shadcn/ui 配置
├── package.json        # 依賴和指令碼
├── tsconfig.json       # TypeScript 配置
├── vitest.config.ts    # 測試配置
└── wrangler.toml       # Cloudflare 部署配置
```

## 🛠️ 開發

### 環境需求

- **Node.js**：>=18.0.0
- **PNPM**：>=9.5.0 (工作區套件管理器)
- **Cloudflare 帳戶**：部署和 API 整合用

### 本地開發

1. **安裝依賴**：
   ```bash
   pnpm install
   ```

2. **啟動開發伺服器**：
   ```bash
   pnpm dev
   ```
   - 在 `http://localhost:4321` 運行
   - 啟用熱重載
   - API 代理到本地後端 (`apps/api/`)

3. **環境設定**：
   ```bash
   cp .env.local.example .env.local
   # 編輯 .env.local 設定您的本地配置
   ```

### 可用指令碼

| 指令 | 說明 |
|------|------|
| `pnpm dev` | 啟動帶有熱重載的開發伺服器 |
| `pnpm build` | 建置生產版本到 `./dist/` |
| `pnpm build:staging` | 建置測試環境版本 |
| `pnpm preview` | 本地預覽生產建置 |
| `pnpm type-check` | 執行 TypeScript 型別檢查 |
| `pnpm test` | 使用 Vitest 執行測試套件 |
| `pnpm test:watch` | 監看模式下執行測試 |
| `pnpm lint:astro` | 執行 Astro 檢查和型別檢查 |
| `pnpm format` | 使用 Prettier 格式化程式碼 |

### 環境配置

應用程式支援多種環境：

- **本地開發**：`.env.local` - 連接到本地 API
- **測試環境**：`.env.staging` - 連接到測試 API
- **生產環境**：Cloudflare Pages 環境變數

所有環境變數都以 `PUBLIC_` 為前綴，因為這是客戶端應用程式。

## 🚀 部署

### Cloudflare Pages

應用程式設計用於 Cloudflare Pages 部署：

1. **建置配置**：
   - 建置指令：`NODE_OPTIONS='--loader=./loader.mjs' astro build`
   - 建置輸出目錄：`dist`
   - 啟用 Node.js 相容性

2. **環境變數**（在 Cloudflare Pages 儀表板中設定）：
   - `PUBLIC_API_BASE_URL` - API worker URL
   - `PUBLIC_SITE_URL` - 用於 meta 標籤的網站 URL
   - `PUBLIC_IMAGE_CDN_URL` - 圖片 CDN URL
   - `PUBLIC_TURNSTILE_SITE_KEY` - Cloudflare Turnstile 金鑰

3. **分支式部署**：
   - `main`/`master` → 生產環境
   - `staging` → 預覽環境
   - 其他所有分支 → 預覽

### 手動部署

```bash
# 生產環境部署
pnpm deploy

# 測試環境部署
pnpm deploy:staging
```

## 🔧 配置

### Astro 配置 (`astro.config.mjs`)

- **配接器**：Cloudflare Pages 搭配伺服器端渲染
- **整合**：React、網站地圖、字體載入
- **字體**：自訂網頁字體（Agatho、Noto Sans TC、Crimson Text）
- **Vite 外掛**：Tailwind CSS v4、Lucide 圖示解析器

### Tailwind CSS v4

專案使用 Tailwind CSS v4，具有：
- 自訂設計符記
- 基於元件的架構
- 深色模式支援
- 自訂字體整合

### Cloudflare 整合

- **Pages 函數**：伺服器端渲染和 API 路由
- **資源**：優化的靜態資源交付
- **安全性**：Turnstile CAPTCHA 整合
- **分析**：內建效能監控

## 🧪 測試

### 測試設定

- **框架**：Vitest 搭配 jsdom 環境
- **涵蓋率**：元件和工具的單元測試
- **CI/CD**：部署時的自動化測試

### 執行測試

```bash
# 執行所有測試
pnpm test

# 監看模式執行測試
pnpm test:watch

# 執行涵蓋率測試
pnpm test:coverage
```

## 🌐 國際化

應用程式支援繁體中文 (zh-TW)，具有：

- **字體**：中文文字的 Noto Sans TC
- **RTL 支援**：內建從右到左文字支援
- **本地化路由**：基於 URL 的本地化切換
- **內容管理**：多語言內容的 CMS 整合

## 🔐 安全性

### 客戶端安全性

- **僅公開變數**：僅暴露 `PUBLIC_` 前綴變數
- **伺服器端機密**：所有敏感資料由 `apps/api/` 處理
- **CAPTCHA**：Cloudflare Turnstile 整合
- **CSP 標頭**：內容安全政策強制執行

### 認證

- **提供者**：Better Auth 整合
- **OAuth**：Google OAuth 支援
- **工作階段管理**：基於權杖的安全認證
- **API 安全性**：所有認證操作都在伺服器端

## 📊 效能

### 優化特色

- **Edge 運算**：Cloudflare 的全域 CDN
- **圖片優化**：自動格式轉換和壓縮
- **程式碼分割**：自動分塊和延遲載入
- **字體載入**：優化的網頁字體載入
- **快取**：積極的快取策略

### 監控

- **Core Web Vitals**：效能指標追蹤
- **套件分析**：建置大小監控
- **運行時效能**：真實用戶監控 (RUM)

## 🤝 貢獻

1. 遵循既定的程式碼風格和模式
2. 為新功能撰寫測試
3. 視需要更新文件
4. 確保 TypeScript 嚴格模式相容性
5. 跨裝置和瀏覽器測試

## 📝 授權

此專案為 Black Living 電商平台的一部分。請參閱根目錄 `README.md` 以取得授權資訊。

## 📞 支援

如有問題或問題：
- 檢查根專案文件
- 檢閱 `apps/api/` 以取得後端整合詳細資訊
- 參閱 `packages/ui/` 以取得元件庫文件

---

使用 ❤️ 為 Black Living 床墊零售而建置。

---

📖 [English Version](README.md) | [繁體中文版](README-zh-TW.md)
# 目標

- 圖片固定 16:9。
- 行動版仍維持橫向雙欄。
- 右側文字區在行動版只縮小 padding。
- 支援圖片疊加漸層與文字 Overlay。

# 範圍

- 新增 `overlayGradient`、`overlayText`、`overlayPlacement`、`overlayCTA` 等屬性。
- **新增**: Admin interface in `apps/admin/blog-composer.tsx` for overlay text input。
- **新增**: Database schema updates to store overlay data per post。
- **新增**: API endpoints for overlay CRUD operations。
- 響應式：桌機與行動皆為橫向雙欄；行動版僅縮小文字內距；圖片維持 16:9。

# 非範圍

- 後台 WYSIWYG 編輯器。
- 影像裁切與自動偵測焦點。
- **新增**: Overlay image upload (uses existing featured image).

# 使用情境

- 行銷卡片需在圖上直接疊字與 CTA，提高可讀性與點擊率。
- 深色漸層提升白字對比，避免圖像背景干擾。

# UX 規格

## 版面

- 布局：左右雙欄。左圖 40% 寬，右文 60% 寬。
- 圖片：固定比例 16:9，`object-fit: cover`。
- Overlay：覆蓋整個圖片容器，可開關。
- 文字 Overlay：可選擇顯示標題、副標、CTA。

## 漸層 Overlay

- 預設：關閉。
- 類型：`linear`（0–360deg）。
- 參數：
  - `angle` 預設 180。
  - `stops`: 最多 4 組，格式 `[{at:0–100, color:rgba}]`。
  - 預設值：`angle:180`，`stops:[{0,'rgba(0,0,0,0)'},{65,'rgba(0,0,0,0.35)'},{100,'rgba(0,0,0,0.6)'}]`。
- 混合模式：`normal`；可選 `multiply`。

## 文字 Overlay

- 位置 `overlayPlacement`：`'bottom-left' | 'bottom-right' | 'center' | 'top-left'`。
- 文字樣式：
  - 標題：白色，字重 700，陰影 `text-shadow: 0 2px 8px rgba(0,0,0,.4)`。
  - 副標：白色 80% 透明。
  - 行距：1.2–1.4。
- 文字容器內距：
  - 桌機：16–20px。
  - 行動：12–16px。
- 省略規則：
  - 標題最多 2 行，副標 2 行，超出以省略號。
- CTA：
  - 類型：`text | button`，預設 `text`。
  - 互動：hover/active 提升整卡陰影。

## 右側文字區

- 維持原階層：H1、前言、次級 CTA。
- 行動版文字區 padding 減半（例如 24 → 12）。

## 狀態

- Hover：圖片 1.02 縮放，陰影 +1 階；Overlay 不變。
- Focus 可見環 `outline: 2px solid currentColor`。
- Disabled：整卡 60% 透明，禁用指標與互動。

# 響應式規則

- ≥ md：左右雙欄。左圖 40%，右文 60%。
- < md：仍維持橫向雙欄。左圖固定寬度以保持 16:9 高度，右文填滿剩餘寬度。
- 行動版僅縮小右文 padding；圖片比例固定 16:9，不改直向堆疊。

# 結構

```
<a class="group block rounded-2xl shadow hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-primary/50">
  <article class="flex w-full items-stretch">
    <!-- 左：圖片 + overlay -->
    <div class="relative shrink-0 overflow-hidden rounded-l-2xl aspect-[16/9] basis-[40%] md:basis-[40%] w-[40%]">
      <img class="h-full w-full object-cover transition-transform duration-200 group-hover:scale-[1.02]" />
      <!-- 漸層 -->
      <div class="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/60 via-black/35 to-transparent mix-blend-normal"></div>
      <!-- 文字 overlay（可選位置）-->
      <div class="absolute inset-x-0 bottom-0 p-4 md:p-5 text-white">
        <h2 class="line-clamp-2 text-lg md:text-xl font-bold drop-shadow">...</h2>
        <p class="mt-1 line-clamp-2 text-sm/6 text-white/80 drop-shadow">...</p>
        <span class="mt-2 inline-block text-sm underline underline-offset-2">繼續閱讀 →</span>
      </div>
    </div>

    <!-- 右：文字 -->
    <div class="flex-1 rounded-r-2xl bg-white p-3 md:p-6">
      <h2 class="text-2xl md:text-3xl font-extrabold tracking-tight text-gray-900">...</h2>
      <p class="mt-3 text-sm md:text-base leading-relaxed text-gray-600">...</p>
      <span class="mt-4 inline-block text-sm text-primary">繼續閱讀 →</span>
    </div>
  </article>
</a>
```

# Tailwind 規格

## 外框

- `rounded-2xl shadow transition-shadow duration-200 hover:shadow-lg`
- 整塊 `<a>` 作為可點擊區，`focus:ring-2 ring-primary/50`

## 版面與比例

- 容器：`flex items-stretch`
- 圖片欄寬：`basis-[40%] w-[40%]`（行動與桌機相同，保持橫向）
- 圖片比例：`aspect-[16/9]` + `object-cover`
- 文字欄：`flex-1`

## 圖片與 Overlay

- 圖片：`object-cover h-full w-full`
- 漸層：`absolute inset-0 bg-gradient-to-t from-black/60 via-black/35 to-transparent`
   可選混合：`mix-blend-multiply` 或 `mix-blend-normal`
- Hover 動效：`group-hover:scale-[1.02]`

## 文字 Overlay

- 容器內距：`p-5`，行動 `p-4`
- 位置預設：`bottom-0 inset-x-0`；其他位置：
  - `top-left`：`top-0 left-0`
  - `bottom-right`：`bottom-0 right-0 text-right`
  - `center`：`inset-0 grid place-items-center text-center`
- 標題：`h2.line-clamp-2 text-lg md:text-xl font-bold text-white drop-shadow`
- 副標：`text-sm/6 text-white/80 line-clamp-2`
- CTA：`text-sm underline underline-offset-2`

## 右側文字區（標準內容）

- 內距：桌機 `p-6`，行動縮小 `p-3`
- 標題元素：`h2.text-2xl md:text-3xl font-extrabold`
- 內文：`text-sm md:text-base text-gray-600`
- 次級 CTA：`text-sm text-primary`

## 響應式

- 行動仍橫向：不切直向。
- 行動只縮小右欄 padding：`md:p-6` → 行動 `p-3`。
- 圖片一律 `aspect-[16/9]`，不可變形。

## 狀態

- `hover:shadow-lg`，圖片 `group-hover:scale-[1.02]`
- `focus:outline-none focus:ring-2 focus:ring-primary/50`
- 停用：外層加 `opacity-60 pointer-events-none`

# 可配置 Props（對應 Tailwind）

```ts
type GradientStop = { at: number; color: string }; // 0–100
type OverlayGradient = {
  enabled?: boolean;                // default false
  direction?: 't'|'tr'|'r'|'br'|'b'|'bl'|'l'|'tl'; // 對應 bg-gradient-to-*
  stops?: GradientStop[];           // 用 style="background-image: linear-gradient(...)"
  blend?: 'normal'|'multiply';      // 決定 mix-blend-*
};

type OverlayText = {
  enabled?: boolean;
  title?: string;
  subtitle?: string;
  cta?: { label: string; href?: string; asButton?: boolean };
  placement?: 'bottom-left'|'bottom-right'|'top-left'|'center';
  padding?: { base?: string; md?: string }; // 例如 base:'p-4', md:'p-5'
  maxLines?: { title?: number; subtitle?: number }; // 預設 2,2 -> 使用 line-clamp
};

type CardProps = {
  href: string;
  image: { src: string; alt: string };
  overlayGradient?: OverlayGradient;
  overlayText?: OverlayText;
  // 右欄
  title: string;        // 渲染到 h2
  excerpt?: string;
  ctaLabel?: string;
};
```

# ASCII（行動仍橫向）

```
┌──────────────────────────────────────────────┐
│ ┌──── IMG 16:9 ────┐ ┌── TEXT(p-3) ────────┐ │
│ │██████ gradient██ │ │ h2 標題              │ │
│ │  overlay text    │ │ 副標                 │ │
│ │  CTA →           │ │ CTA →               │ │
│ └──────────────────┘ └─────────────────────┘ │
└──────────────────────────────────────────────┘
```

# Admin Interface Requirements

## Blog Composer Overlay Section

**新增卡片區域**: 在 BlogComposer 中新增 "圖片疊加文字" 設定區域

```
卡片位置: Sidebar (與其他設定並列)
標題: 🎨 圖片疊加文字
展開/收起: 可折疊
```

**表單欄位**:
```typescript
// 新增到 blogPostSchema
overlayEnabled: z.boolean().default(false),
overlayTitle: z.string().max(50, '標題不能超過50個字元').optional(),
overlaySubtitle: z.string().max(100, '副標不能超過100個字元').optional(),
overlayPlacement: z.enum(['bottom-left', 'bottom-right', 'top-left', 'center']).default('bottom-left'),
overlayCtaText: z.string().max(20, 'CTA文字不能超過20個字元').optional(),
overlayGradientEnabled: z.boolean().default(true),
overlayGradientDirection: z.enum(['t', 'tr', 'r', 'br', 'b', 'bl', 'l', 'tl']).default('b'),
```

**UI 元件**:
- Switch: "啟用圖片疊加文字"
- Text Input: "疊加標題" (當啟用時顯示)
- Text Input: "疊加副標" (當啟用時顯示)
- Select: "文字位置" (bottom-left, bottom-right, top-left, center)
- Text Input: "CTA 文字" (可選)
- Switch: "啟用漸層背景" (預設開啟)
- Select: "漸層方向" (t, tr, r, br, b, bl, l, tl)

# Database Schema Updates

## Posts Table Extensions

**新增欄位到 posts 表**:
```sql
-- Overlay Text Settings
overlay_enabled BOOLEAN DEFAULT FALSE,
overlay_title TEXT,                    -- 疊加標題 (max 50 chars)
overlay_subtitle TEXT,                 -- 疊加副標 (max 100 chars)
overlay_placement TEXT DEFAULT 'bottom-left', -- 位置設定
overlay_cta_text TEXT,                 -- CTA 文字 (max 20 chars)

-- Overlay Gradient Settings
overlay_gradient_enabled BOOLEAN DEFAULT TRUE,
overlay_gradient_direction TEXT DEFAULT 'b', -- 漸層方向
```

### Migration Strategy

**資料遷移**:
- 新欄位皆為可選，預設值確保向後相容
- 現有文章預設 `overlay_enabled = FALSE`
- 無需資料遷移腳本 (新增欄位有預設值)

# API Updates

## Posts CRUD Operations

**GET /api/posts/:id** (更新回應):
```json
{
  "success": true,
  "data": {
    "id": "post-123",
    "title": "文章標題",
    // ... 其他欄位
    "overlayEnabled": false,
    "overlayTitle": "探索更多",
    "overlaySubtitle": "深入了解我們的產品特色",
    "overlayPlacement": "bottom-left",
    "overlayCtaText": "立即查看",
    "overlayGradientEnabled": true,
    "overlayGradientDirection": "b"
  }
}
```

**POST/PUT /api/posts** (更新請求):
- 接受新的 overlay 欄位
- 驗證文字長度限制
- 儲存到對應資料庫欄位

# Component Updates

## BlogPostCard Props Extension

```typescript
export interface BlogPostCardProps {
  post: BlogPost & {
    // 新增 overlay 屬性
    overlayEnabled?: boolean;
    overlayTitle?: string;
    overlaySubtitle?: string;
    overlayPlacement?: 'bottom-left' | 'bottom-right' | 'top-left' | 'center';
    overlayCtaText?: string;
    overlayGradientEnabled?: boolean;
    overlayGradientDirection?: string;
  };
  variant?: 'vertical' | 'horizontal';
  className?: string;
  href: string;
}
```

## Overlay Rendering Logic

**條件渲染**:
- 只有當 `overlayEnabled: true` 時才渲染 overlay
- 根據 `overlayPlacement` 決定位置
- 根據 `overlayGradientEnabled` 決定是否顯示漸層

**文字截斷**:
- 標題: `line-clamp-2` (2行)
- 副標: `line-clamp-2` (2行)
- CTA: 單行顯示

# Implementation Order

1. **資料庫**: 新增 overlay 欄位到 posts 表
2. **API**: 更新 posts CRUD 操作
3. **Admin UI**: 在 BlogComposer 新增 overlay 設定區域
4. **Frontend**: 更新 BlogPostCard 支援 overlay 渲染
5. **測試**: 驗證完整功能流程

# 驗收

1. 圖片在所有斷點維持 `aspect-[16/9]`，無拉伸。
2. 行動版為橫向雙欄，右欄 padding 較桌機縮小≥30%。
3. **新增**: Admin 可為每篇文章設定 overlay 文字
4. **新增**: Overlay 資料正確儲存到資料庫
5. **新增**: API 正確處理 overlay 欄位
6. Overlay 漸層與文字可開關，四種位置可切換。
7. 標題用 `h2`，`line-clamp-2` 正常截斷。
8. 焦點環與鍵盤導覽可用。

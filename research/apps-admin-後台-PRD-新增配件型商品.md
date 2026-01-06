# 後台 PRD：新增配件型商品管理（最小改動版）

## 範圍

新增與編輯「配件型商品」全流程。

- 保持與現有 Schema/設計一致為原則（最小改動）。
- 新增專用「商品編輯頁」取代現有大量功能集中於彈窗 Modal 的做法（可階段性共存）。
- 新增「featuresMarkdown」文字欄位（Markdown 內容），維持既有 features[] 相容（前後台均允許 fallback）。

變體模板、批次定價、批次庫存、圖片、SKU 規則、CSV 匯入。

權限、審核、日誌。

API 與資料模型。

## 2. 角色與權限

Admin：可建/編/上架/下架/批次操作。

Editor：可建/編，需 Admin 審核才能上架。

Viewer：唯讀。

## 3. 產品型別與預設模板

productType 影響可選變體軸與 UI 表單。

mattress(床墊)：firmness: extra firm | firm | medium | plush x size: twinxl | full | queen | king | calking

protector（保潔墊）：size

sheet-set（床包組）：size × color

pillow（枕頭）：firmness/loft

duvet（被子）：size × weight

topper（墊層）：size × thickness(選配)

adjustable-base (電動床墊)：size x 

other：自訂 options[]


模板可擴充。各模板提供預設值與選項列。



## 4. 使用者流程（後台）

### 建立商品

選 productType

輸入基本資訊：名稱、系列/型號、品牌、主圖、描述、保固、材質、原產地、SEO（slug、meta）。

設定選項模板：可新增/刪除值，例如 size=["twinxl","queen","king","calking"]。

生成變體矩陣（僅勾選需販售的組合）。

### 批次設定

價格：基礎價 + 差額表（以 size 或 weight 等單一軸套用）。

庫存：以軸向或全選批次填入，支援「同值覆蓋」與「僅填空」。

圖片：以顏色或款式批次指派；允許單變體覆寫。

### 編輯商品（專用頁面）

- 於列表「操作」中的編輯按鈕，導向新頁：/dashboard/products/{id}/edit（新增：/dashboard/products/new）。
- 專用頁以分段區塊呈現：
  - 基本資訊：名稱、分類、描述、SEO。
  - 媒體：主圖/圖集。
  - 規格：variants、specifications。
  - 特色說明：featuresMarkdown（Markdown 區塊編輯器，支援文字/圖片/小標題）。
  - 進階：排序、精選、上架狀態。
- 支援草稿自動儲存（localStorage）與離開保護提示。
- Modal 僅保留「快速新增」的漸進替代方案；完整維護移至新頁以降低單檔複雜度。

### SKU 與條碼

SKU 規則：{類別}-{系列/款式}-{尺寸}-{顏色/重量}

例：保潔墊 PROT-CMX-Q；床包 SHEET-LUXE-K-CHR；枕頭 PILLOW-AIR-M。

條碼可選填，唯一檢查。

### 審核與上架

狀態：draft → in_review → published

上架檢查：主圖、至少一個變體可售、價格與庫存不可為空。

版本化：保存差異日誌。

### 匯入 / 匯出

CSV 欄位：productId, productType, title, option:size, option:color, option:weight, sku, price, stock, barcode, imageUrl, status

驗證：SKU 唯一、非法組合拒絕、未知選項值拒絕。

匯出支援篩選（狀態、系列、類型）。

## 5. 資料模型（符合現有 Schema）

基於現有 products 表結構，擴展配件功能：

```json
{
  "product": {
    "id": "SHEET-LUXE",
    "name": "Luxe 天絲床包組",
    "slug": "luxe-sheet-set",
    "description": "高品質天絲床包組，提供絕佳觸感與耐用性",
    "category": "bedding",
    "images": ["/img/sheet-luxe-cover.jpg"],
    "variants": [
      {
        "id": "variant-1",
        "name": "Queen - White",
        "price": 2000,
        "sku": "SHEET-LUXE-Q-WHT",
        "size": "queen",
        "color": "white"
      },
      {
        "id": "variant-2",
        "name": "King - Charcoal",
        "price": 2400,
        "sku": "SHEET-LUXE-K-CHR",
        "size": "king",
        "color": "charcoal"
      }
    ],
    // 新增：以 Markdown 儲存商品特色（最小改動：新增欄位）
    "featuresMarkdown": "## 產品特色\n- 天絲材質\n- 抗皺設計\n- 易於清潔\n\n![細節圖](/img/sheet-luxe-detail.jpg)",
    // 既有 features[] 維持相容（前/後台皆以 featuresMarkdown 優先，無值時 fallback）
    "features": ["天絲材質", "抗皺設計", "易於清潔"],
    "specifications": {
      "material": "100%天絲",
      "thread_count": "400",
      "care_instructions": "機洗中溫"
    },
    "inStock": true,
    "featured": false,
    "sortOrder": 0,
    "seoTitle": "Luxe 天絲床包組 - 高品質寢具",
    "seoDescription": "購買 Luxe 天絲床包組，享受絲滑觸感與卓越品質",
    // 新增配件欄位（由 Drizzle 生成之 accessory 欄位遷移）
    "accessoryType": "standalone",
    "parentProductId": null
  }
}
```

**配件商品範例：**
```json
{
  "product": {
    "id": "PROTECTOR-CMX",
    "name": "防水床墊保潔墊",
    "slug": "waterproof-mattress-protector",
    "description": "防水防潮床墊保潔墊，提供全方位保護",
    "category": "bedding",
    "images": ["/img/protector-cmx.jpg"],
    "variants": [
      {
        "id": "variant-1",
        "name": "Queen Size",
        "price": 800,
        "sku": "PROT-CMX-Q",
        "size": "queen"
      }
    ],
    "featuresMarkdown": "### 商品亮點\n1. 防水材質\n2. 防螨抗菌\n3. 易於安裝",
    "features": ["防水材質", "防螨抗菌", "易於安裝"],
    "specifications": {
      "material": "TPU防水膜",
      "thickness": "0.5mm",
      "warranty": "1年"
    },
    "inStock": true,
    "featured": false,
    "sortOrder": 0,
    // 配件設定
    "accessoryType": "accessory",
    "parentProductId": "MATTRESS-LUXE" // 關聯到主要床墊商品
  }
}
```

### 5.1 資料庫最小變更（與現有相容）

- products 新增欄位：features_markdown TEXT NOT NULL DEFAULT ''（Drizzle 對應欄位：featuresMarkdown: text('features_markdown')）。
- 不移除既有 features（JSON 字串，預設 []）。
- 前/後台讀取策略：優先使用 featuresMarkdown；若空字串則 fallback 至 features 陣列（以清單渲染）。
- 遷移策略：可提供一次性批次轉換（features[] → Markdown 清單），非強制。

## 6. 後台 UI 要點

選項編輯器：Chip 多選，支援新增/排序/刪除值。

變體矩陣：可切換「表格式」與「卡片式」。

批次工具列：價格、庫存、圖片、開關 active。

驗證提示：即時標示缺失與非法組合。

預覽：選任一變體生成 PDP 預覽連結。

商品編輯頁（新）：

- 路由：/dashboard/products/new 與 /dashboard/products/{id}/edit。
- 將原 ProductManagement.tsx 之編輯相關 UI 拆分至頁面與多個小型元件，降低單檔 >1000 行複雜度。
- 「特色說明」區塊使用 Block Editor（採用現有 BlockNoteEditor.tsx），儲存為 Markdown。
- 列表頁保留「快速新增」Modal（選用），編輯導向新頁（主路徑）。

## 7. 驗證規則

必填：title, productType, slug。

變體至少一筆 active=true。

price ≥ 0，stock ≥ 0。

SKU 唯一、長度 ≤ 32。

optionValues 僅允許使用該商品 options 內的值。

圖片可空但上架時至少一張主圖。

## 8. API（REST 草案）

POST /admin/products 建立商品

PUT /admin/products/{id} 更新商品

POST /admin/products/{id}/variants:generate 以 options 生成矩陣

PUT /admin/variants/batch 批次更新價格/庫存/圖片/active

POST /admin/variants/import CSV 匯入

GET /admin/products?type=&status=&q= 查詢

POST /admin/products/{id}:publish 上架

POST /admin/products/{id}:archive 下架

### 8.1 資料契約補充（最小改動）

- 請求/回應 payload 於 product 區塊中新增可選欄位：featuresMarkdown?: string。
- 保留既有 features?: string[]；後端若同時收到兩者，featuresMarkdown 優先寫入；features 僅作相容用途。
- 前台查詢 /api/products 時，若 product.featuresMarkdown 為非空字串，於 PDP 優先渲染 Markdown（fallback：將 features[] 以項目清單顯示）。

## 9. 日誌與審計

紀錄操作者、欄位差異、時間。

可按商品或變體回溯歷史。

## 10. 匯入映射與錯誤回報

顯示逐列錯誤，提供更正模板下載。

允許「跳過錯誤列並先匯入正確列」。

## 11. 接受標準（後台）

以 模板新增商品，3 分鐘內可完成 12 個變體設定並上架。

任一非法選項值導致儲存失敗並有明確訊息。

匯入 100 筆變體於 30 秒內完成，錯誤列報告可下載。

SKU 唯一性在建立與匯入時都會被攔截。

欄位權限依角色正確限制。

— 新增（專用編輯頁與 Markdown 最小改動驗收）—

- 在產品列表點擊「編輯」，於 1 秒內導向 /dashboard/products/{id}/edit，並載入商品資料。
- 在編輯頁可完整修改基本資訊、圖片、變體、規格，並以 Block Editor 編輯 featuresMarkdown；儲存後重新整理仍能看到正確 Markdown。
- 未填寫 featuresMarkdown 時，後台顯示提示（可選）；前台仍以既有 features[] 顯示，不影響上線。
- ProductManagement.tsx 檔案行數顯著下降（編輯 UI 拆分後 < 500 行；數字可調整），維護性提升。

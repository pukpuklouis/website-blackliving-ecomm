-----

# **產品需求文件 (PRD): `StoreMaps.astro`**

  - **版本:** 1.0
  - **日期:** 2025年9月25日
  - **作者:** Gemini

-----

## **1. 總覽**

`StoreMaps.astro` 是一個可重複使用的 Astro 元件，用於在網頁中嵌入 Google 地圖並疊加一個可自訂樣式和位置的資訊卡。此元件旨在簡化在地圖上顯示商店或地點資訊的流程，同時保持響應式設計，確保在桌面和行動裝置上都有良好的使用者體驗。

- 元件位置: `/apps/web/src/components/StoreMaps.astro`
-----

## **2. 功能需求**

| ID | 需求描述 | 備註 |
| :--- | :--- | :--- |
| **FR-1** | **地圖嵌入** | 元件必須能夠根據傳入的 `embedUrl` 屬性，使用 `<iframe>` 渲染一個 Google 地圖。地圖應填滿其容器的寬度和高度。 |
| **FR-2** | **資訊卡顯示** | 元件必須在地圖上方疊加一個資訊卡，用於顯示地點的詳細資訊。 |
| **FR-3** | **資訊卡內容** | 資訊卡的內容（如名稱、地址、營業時間、電話）必須由 `infoBox` 物件屬性動態傳入。 |
| **FR-4** | **樣式自訂** | 開發者可以透過 `bgColor`, `textColor`, 和 `textAlign` 屬性自訂資訊卡的背景顏色、文字顏色和文字對齊方式。 |
| **FR-5** | **響應式佈局** | 元件必須是響應式的。資訊卡的位置會根據螢幕寬度自動調整。 |
| **FR-6** | **桌面位置** | 在桌面視圖（例如 \>768px）中，資訊卡的位置由 `infoBoxPosition` 屬性控制（左上、右上、左下、右下）。 |
| **FR-7** | **行動裝置位置** | 在行動裝置視圖（例如 \<768px）中，資訊卡的位置由 `responsivePosition` 屬性控制（頂部或底部），並通常會橫跨整個寬度。 |

-----

## **3. 元件 API (Props)**

`StoreMaps.astro` 元件接受以下屬性 (props)：

| 屬性 (Prop) | 類型 | 必要性 | 預設值 | 描述 |
| :--- | :--- | :--- | :--- | :--- |
| `embedUrl` | `string` | **必要** | `N/A` | Google 地圖的嵌入 `<iframe>` 來源 URL。 |
| `infoBox` | `object` | **必要** | `N/A` | 包含地點資訊的物件，結構如下：<br>`{ name: string, address: string, hours?: string, phone?: string }` |
| `bgColor` | `string` | 可選 | `'bg-white/90'` | 資訊卡的背景顏色。建議使用 Tailwind CSS class。 |
| `textColor` | `string` | 可選 | `'text-slate-800'` | 資訊卡的文字顏色。建議使用 Tailwind CSS class。 |
| `textAlign` | `string` | 可選 | `'left'` | 資訊卡內的文字對齊方式。可選值：`'left'`, `'center'`, `'right'`。 |
| `infoBoxPosition` | `string` | 可選 | `'top-left'` | **桌面版**資訊卡的位置。可選值：`'top-left'`, `'top-right'`, `'bottom-left'`, `'bottom-right'`。 |
| `responsivePosition` | `string` | 可選 | `'bottom'` | **行動版**資訊卡的位置。可選值：`'top'`, `'bottom'`。 |

-----

## **4. 技術細節與實作建議**

  - **地圖渲染**: 為了簡單性和性能，應直接使用 Google 地圖提供的 `<iframe>` 嵌入程式碼，避免客戶端 JavaScript API 的複雜性。
  - **佈局**: 使用一個相對定位 (`relative`) 的外層容器，並將地圖 `<iframe>` 和絕對定位 (`absolute`) 的資訊卡包裹在內。
  - **樣式**: 優先使用 Tailwind CSS 進行樣式設定，以便於透過 props 進行客製化。
  - **響應式處理**: 使用 Tailwind CSS 的響應式前綴 (如 `md:`) 來根據斷點切換 `infoBoxPosition` 和 `responsivePosition` 的對應樣式。例如，行動裝置預設使用 `responsivePosition` 的樣式，而在 `md` 或更大的螢幕上則應用 `infoBoxPosition` 的樣式。

-----

## **5. 使用範例**

```astro
---
import StoreMaps from './StoreMaps.astro';

const myStore = {
  name: '範例咖啡店',
  address: '台中市西屯區台灣大道三段99號',
  hours: '09:00 - 18:00',
  phone: '04-1234-5678'
};

const mapUrl = "https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3640.613337905953!2d120.64539131542903!3d24.15011898439467!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x34693d9657712345%3A0x123456789abcdef0!2sTaichung%20City%20Hall!5e0!3m2!1sen!2stw!4v1663821888888!5m2!1sen!2stw";
---

<div class="w-full h-[500px]">
  <StoreMaps
    embedUrl={mapUrl}
    infoBox={myStore}
    infoBoxPosition="bottom-right"
    responsivePosition="bottom"
    bgColor="bg-zinc-900/90"
    textColor="text-white"
    textAlign="center"
  />
</div>
```

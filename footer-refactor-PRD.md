# 產品需求文件：可複用頁尾連結元件

文件版本： 1.0

發布日期： 2025年9月25日

作者： Gemini

### 1. 簡介

本文件旨在定義一個可複用、由資料驅動的頁尾連結元件 (Footer Link Component)。目前網站頁尾的連結是靜態寫死在 HTML 中的，導致每次需要新增、修改或刪除連結時，都必須直接更改程式碼，不僅效率低落，也容易出錯。

為了遵循 **DRY (Don't Repeat Yourself)** 原則，我們將建立一個動態元件，其內容完全由一個獨立的 JSON 檔案 (`footer.json`) 控制。這將使內容管理與程式碼邏輯分離，讓非開發人員也能輕鬆維護頁尾資訊。

### 2. 產品目標

- **提高可維護性：** 未來更新頁尾連結時，只需修改 `footer.json` 檔案，無需改動任何程式碼。
- **確保視覺一致性：** 所有頁尾區塊的樣式將由元件統一控制，確保風格一致。
- **提升開發效率：** 將重複的 HTML 結構抽象化為一個可複用的元件，簡化開發流程。
- **內容與結構分離：** 實現關注點分離，讓內容管理更直觀、更安全。

### 3. 功能需求

#### 3.1 資料驅動

- 元件必須能讀取並解析 `public/footer.json` 的資料結構。
- `footer.json` 應為一個陣列，每個陣列元素代表一個頁尾區塊 (Column)。

#### 3.2 渲染邏輯

- 元件需遍歷 `footer.json` 陣列中的每一個物件。
- 對於每一個物件，元件應渲染出一個包含 `<h4>` 標題和 `<ul>` 列表的區塊。
- `<h4>` 標題的內容應對應 JSON 物件中的 `title` 欄位。
- `<ul>` 列表中的每個 `<li>` 項目應對應 JSON 物件中 `links` 陣列的元素。
- 每個 `<li>` 內應包含一個 `<a>` 連結，其文字內容為 `text` 欄位，`href` 屬性為 `url` 欄位。

#### 3.3 樣式與結構

- 元件產生的 HTML 結構與樣式（包含 Tailwind CSS class）必須與提供的原始碼範例完全一致。
- 每個區塊的根 `<div>` 元素應包含 `md:col-span-1` class，以確保在中等尺寸以上的螢幕上能正確排版。
- 標題和連結的文字顏色、滑鼠懸停效果 (hover effect) 皆須保留。

### 4. 技術規格

#### 4.1 資料來源 (`footer.json`)

此檔案應存放於專案的 `public` 或 `data` 目錄下，其結構如下：

```
[
  {
    "title": "關於我們",
    "links": [
      { "text": "關於黑哥", "url": "/about" },
      { "text": "門市資訊", "url": "/contact" }
    ]
  },
  {
    "title": "購物須知",
    "links": [
      { "text": "保固說明", "url": "/warranty" },
      { "text": "購物說明", "url": "/shipping" }
    ]
  },
  {
    "title": "聯絡我們",
    "links": [
      { "text": "客戶服務", "url": "/contact" },
      { "text": "預約參觀", "url": "/appointment" },
      { "text": "異業合作", "url": "/business-cooperation" }
    ]
  }
]
```

#### 4.2 程式碼範例 (以 Astro 框架為例)

Astro 是一個多頁面應用程式 (MPA) 框架，非常適合建立內容驅動的網站。以下是如何使用 Astro 元件來實現此功能。

**`src/components/Footer.astro` (主元件)**

```
---
// 1. 導入 JSON 數據和子元件
import footerData from '../../public/footer.json';
import FooterLinkColumn from './FooterLinkColumn.astro';
---
<!-- 3. 在頁尾主元件中使用 -->
<footer class="container mx-auto grid grid-cols-1 md:grid-cols-3 gap-8 py-12">
  {footerData.map((column) => (
    <FooterLinkColumn title={column.title} links={column.links} />
  ))}
</footer>
```

**`src/components/FooterLinkColumn.astro` (可複用子元件)**

```
---
// 2. 定義元件接收的 props
interface Link {
  text: string;
  url: string;
}
interface Props {
  title: string;
  links: Link[];
}
const { title, links } = Astro.props;
---
<div class="md:col-span-1">
  <h4 class="text-lg font-semibold text-stone-800 mb-3">{title}</h4>
  <ul class="space-y-2">
    {links.map((link) => (
      <li>
        <a href={link.url} class="text-stone-600 hover:text-stone-800 transition-colors">
          {link.text}
        </a>
      </li>
    ))}
  </ul>
</div>
```

### 5. 不在範圍內 (Out of Scope)

- 此元件不包含頁尾的 Logo、社群媒體圖示或版權聲明部分。其職責僅限於渲染連結區塊。
  - 不處理連結的有效性驗證。

### 6. 成功指標

- 頁尾連結區塊能成功從 `footer.json` 動態生成。
- 在不重新部署程式碼的情況下，修改 `footer.json` 即可更新頁尾內容。
- 最終渲染出的頁面在視覺上與原始硬編碼版本無任何差異。

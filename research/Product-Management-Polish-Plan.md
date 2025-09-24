# Product Management Page Polish Plan

This document outlines the necessary steps to enhance and complete the Product Management page, addressing placeholders, hardcoded values, and improving the overall user experience.

## Schema Alignment Confirmation

**Verification Complete:** This plan has been cross-referenced with the `products` table schema in `packages/db/schema.ts`.

-   **Full Coverage:** The plan accounts for all fields in the database schema.
-   **No Missing Fields:** All critical fields (`variants`, `features`, `specifications`, `seoTitle`, etc.) that are currently missing from the UI have been identified and are included in the implementation phases below.

This ensures that the final polished component will be in full sync with the required data structure.

## Phase 1: Critical Fixes & Core Functionality

This phase focuses on resolving immediate issues and implementing the most critical missing features for basic product management.

### 1.1. Environment Variable for API Endpoint

-   **Problem:** The API base URL (`http://localhost:8787`) is currently hardcoded in the `ProductManagement.tsx` component for all `fetch` calls. This is not suitable for different environments (development, staging, production).
-   **Solution:**
    -   Introduce an environment variable (e.g., `VITE_API_URL` or `REMIX_PUBLIC_API_URL`, depending on the project's convention) to store the API base URL.
    -   Update all `fetch` calls to use this environment variable, ensuring the application can be configured to run in different environments without code changes.

### 1.2. Complete the Product Form - Core Fields

-   **Problem:** The product creation/edit form is missing UI for several key fields defined in the `Product` type and Zod schema.
-   **Solution:**
    -   **Implement Variant Management:** This is the highest priority.
        -   Create a dynamic list UI within the form where users can add, edit, and remove product variants.
        -   Each variant entry should have inputs for `name`, `price`, `sku`, and `size`.
        -   Update the `formData` state and validation logic to handle the array of variants.
    -   **Implement Feature Management:**
        -   Create a UI for adding and removing text-based features (e.g., a list of tags or text inputs).
    -   **Implement Specification Management:**
        -   Create a UI for managing key-value pairs for specifications (e.g., two inputs per row for "Key" and "Value", with "Add" and "Remove" buttons).

## Phase 2: Feature Completion & Backend Integration

This phase involves implementing the remaining features to make the page fully functional.

### 2.1. Implement Image Upload Functionality

-   **Problem:** The image upload section is currently a static placeholder.
-   **Solution:**
    -   **Frontend:**
        -   Replace the placeholder with a functional file input component, preferably with drag-and-drop support.
        -   Display image previews for selected files.
        -   Allow reordering of images.
        -   Show upload progress indicators.
    -   **Backend Integration:**
        -   Coordinate with the backend to implement the Cloudflare R2 integration. This will likely involve creating a new API endpoint to get a signed URL for direct client-to-R2 uploads.
        -   Update the form submission logic to first upload images and then save the product with the resulting image URLs.

### 2.2. Add Remaining SEO and Sorting Fields

-   **Problem:** The form is missing inputs for SEO and sorting fields.
-   **Solution:**
    -   Add a dedicated "SEO Settings" section to the form with `Textarea` inputs for `seoTitle` and `seoDescription`.
    -   Add a `NumberInput` for the `sortOrder` field, likely in the "Status & Settings" section.

## Phase 3: UI/UX Refinements & Refactoring

This phase focuses on polishing the user experience and improving the code quality for better maintainability.

### 3.1. Refactor Data Fetching

-   **Problem:** Initial product data is fetched client-side using `useEffect`, which can lead to a flash of loading content.
-   **Solution:**
    -   Leverage Remix's capabilities by moving the data fetching logic into a `loader` function within the `apps/admin/app/routes/dashboard/products.tsx` route file.
    -   Pass the server-fetched data to the `ProductManagement` component via props using `useLoaderData`. This will enable server-side rendering of the initial product list.

### 3.2. Enhance User Feedback

-   **Problem:** Loading and submission states are basic, and error messages are generic.
-   **Solution:**
    -   **Loading States:** Replace the simple spinner with a skeleton loader that mimics the table's structure for a smoother perceived loading experience.
    -   **Submission States:** Disable the "Save" button and display a loading indicator (e.g., a spinner on the button) during form submission to prevent duplicate requests.
    -   **Error Handling:** Improve error toasts by displaying more specific messages from the API response when available, instead of generic "Failed to save" messages.

### 3.3. Improve Table Functionality

-   **Problem:** The table pagination is basic.
-   **Solution:**
    -   Enhance the pagination controls to include page numbers, a "go to page" input, and a "rows per page" selector for better navigation of large datasets.

### 3.4. Code Structure and Refactoring

-   **Problem:** The dialog form logic is complex and resides entirely within the main `ProductManagement` component.
-   **Solution:**
    -   **Component Extraction:** Extract the entire dialog form into a separate, dedicated component (e.g., `ProductForm.tsx`). This will improve readability and separation of concerns.
    -   **Form State Management:** For better state management and validation, consider integrating a form library like `react-hook-form` with `@hookform/resolvers/zod` to connect it seamlessly with the existing `productSchema`.

## UI Wireframe: Product Form Dialog

This wireframe illustrates the layout for the complete "Add/Edit Product" dialog, incorporating all fields from the database schema.

```plaintext
+--------------------------------------------------------------------------------+
| 新增/編輯產品                                                       [ X ]      |
+--------------------------------------------------------------------------------+
|                                                                                |
| --- 基本資訊 ---                                                               |
|                                                                                |
|   產品名稱*                                  URL Slug*                         |
|   [ Simmons Black Beauty B-Class ]           [ simmons-black-beauty-b-class ]  |
|                                                                                |
|   產品描述*                                                                    |
|   +--------------------------------------------------------------------------+ |
|   | A detailed description of the mattress, highlighting its key       | |
|   | features and benefits for the customer. (Textarea)                 | |
|   +--------------------------------------------------------------------------+ |
|                                                                                |
|   產品分類*                                                                    |
|   [ 席夢思黑牌 v ]                                                             |
|                                                                                |
| --- 產品圖片 ---                                                               |
|                                                                                |
|   +--------------------------------------------------------------------------+ |
|   | [img1.jpg][X]  [img2.jpg][X]  [img3.jpg][X]                             | |
|   |                                                                          | |
|   |                  +----------------------------------+                    | |
|   |                  |      拖曳檔案或 <選擇檔案>       |                    | |
|   |                  +----------------------------------+                    | |
|   +--------------------------------------------------------------------------+ |
|                                                                                |
| --- 產品選項與規格 ---                                                         |
|                                                                                |
|   # 選項 (Variants)                                                            |
|   +--------------------------------------------------------------------------+ |
|   | 名稱         | 價格      | SKU          | 尺寸         |              | |
|   |--------------|-----------|--------------|--------------|--------------| |
|   | [ Standard ] | [ 50000 ] | [ BLK-STD-01 ] | [ 180x200cm ]|  <刪除>      | |
|   | [ King     ] | [ 65000 ] | [ BLK-KNG-01 ] | [ 200x200cm ]|  <刪除>      | |
|   +--------------------------------------------------------------------------+ |
|   < 新增選項 >                                                                 |
|                                                                                |
|   # 特色 (Features)                                                            |
|   - [ 獨立筒彈簧 ] <X>                                                         |
|   - [ 涼感記憶棉 ] <X>                                                         |
|   [ 新增特色... ] <新增>                                                       |
|                                                                                |
|   # 規格 (Specifications)                                                      |
|   Key                                     Value                              |
|   [ 硬度         ]                        [ 適中偏硬     ] <X>                 |
|   [ 高度         ]                        [ 30cm         ] <X>                 |
|   < 新增規格 >                                                                 |
|                                                                                |
| --- 狀態與 SEO ---                                                             |
|                                                                                |
|   [x] 有庫存         [ ] 精選產品         排序順序: [ 0 ]                      |
|                                                                                |
|   SEO 標題                                                                     |
|   [ 席夢思黑牌床墊 B-Class | Black Living ]                                   |
|                                                                                |
|   SEO 描述                                                                     |
|   +--------------------------------------------------------------------------+ |
|   | 購買最優質的席夢思黑牌 B-Class 床墊，享受極致睡眠體驗。 (Textarea) | |
|   +--------------------------------------------------------------------------+ |
|                                                                                |
+--------------------------------------------------------------------------------+
|                                                     < 取消 >  < 儲存產品 >     |
+--------------------------------------------------------------------------------+
```

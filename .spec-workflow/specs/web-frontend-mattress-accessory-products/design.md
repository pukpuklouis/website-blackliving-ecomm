# Web Frontend – Mattress & Accessory Products (PDP/PLP) – Design

## Overview

- Goal: Present mattress and accessory products clearly with the fewest steps to select a valid variant and add to cart. Preserve the client‑approved layout with minimal changes.
- Scope: PDP (product detail page) and PLP (listing) essentials, variant selection, pricing display, stock state, images, URL preselect, SEO/accessibility/performance.

## Steering Document Alignment

### Technical Standards (tech.md)
- Astro (React islands), Tailwind + Shadcn, TypeScript strict, Zod
- State management: Zustand for global app state (reuse `useCartStore`); keep variant selection local; do not add new stores

### Project Structure (structure.md)
- Pages under `apps/web/src/pages/shop/[category]/[productSlug].astro`
- Components under `apps/web/src/components/*`
- Minimal change policy: Reuse existing components; avoid layout shifts

## Code Reuse

- `ProductDetail.tsx`: PDP right‑hand detail card; uses Zustand `useCartStore` for add‑to‑cart (keep)
- `ProductVariantSelector.tsx`: Variant dropdowns for size + firmness with Zod validation (keep, minimal tweaks only if needed)
- `ProductTabs.tsx`: Product details tab; extend to render Markdown features, fallback to list
- `BlogContent.astro`: Existing Markdown renderer (marked) for rich content rendering

## Integration Points

- API: `/api/products/:slug` returns `product` including `images`, `variants`, `features[]`, and optional `featuresMarkdown`.
- URL preselect: `/p/{slug}?size=queen&firmness=medium` auto‑selects dropdowns; changing options updates query parameters.

## Architecture

- Islands: `ProductDetail` (parent card), `ProductVariantSelector` (child), `ProductTabs` (content)
- State: Local for variant selection; global via Zustand (`useCartStore`) for cart actions; no new global stores
- Rendering: Prefer `featuresMarkdown` via `BlogContent.astro`; fallback to existing features list with icons

## Components & Interfaces

- ProductVariantSelector (existing)
  - Props: `{ productId, variants, onVariantChange, onAddToCart?, className? }`.
  - Behavior: Both `size` and `firmness` are dropdowns. Dynamic Zod schema from available options. Show price + SKU after both selected.

- ProductTabs (extend minimally)
  - Props: `{ features: string[]; categoryFeatures: string[]; categoryName: string; featuresMarkdown?: string }`.
  - Behavior: If `featuresMarkdown` is non‑empty, render via `BlogContent.astro` within the existing card; else render current icon+line list using `displayFeatures` logic.

## Data Models

- Product (subset): `{ id, name, slug, images: string[], variants: { size, firmness, price, stock, sku }[], features?: string[], featuresMarkdown?: string }`.
- Variant: `{ size: string; firmness: string; price: number; stock: number; sku: string }`.

## PDP Behavior

- Layout: Keep current two‑column desktop and stacked mobile layout.
- Variant selection: Size and firmness dropdowns; disable add‑to‑cart until valid.
- Price visibility: Render price after both dropdowns selected.
- Stock behavior: Show error if quantity exceeds stock; disable add‑to‑cart when invalid.
- Features: Prefer `featuresMarkdown` (rich text + images). Fallback to `features[]` list with icons.
- Delivery note: Keep existing informational note.

## PLP Behavior (unchanged essentials)

- Card shows image, title, lowest variant price, available options count. Hover swatch optional when colors exist.

## SEO

- Canonical: Use product canonical; do not generate separate variant canonicals.
- Structured data (optional): Product schema with price/availability of selected or lowest variant.

## Accessibility

- Dropdowns have visible labels and `aria-invalid` on error. Keyboard navigable.
- Icon list items include readable text. Any color chips include text alternatives.

## Performance

- Lazy‑load images; SSR islands hydrate minimally.
- Load only needed variant data initially; avoid large payloads.

## Error Handling

- Invalid combinations: Inline validation messages; disable add‑to‑cart.
- Add‑to‑cart failure: Non‑blocking toast/alert with reason.

## Testing Strategy

- Unit: Variant schema generation; URL preselect parsing; markdown vs. list fallback logic.
- Integration: Changing dropdowns updates price/SKU; invalid combos blocked.
- E2E: Load PDP with query preselect; select variant; add to cart succeeds.

## Acceptance Criteria

- Mobile: Variant select and add to cart in ≤3 taps.
- URL preselect selects both dropdowns correctly.
- Features render as Markdown when available; fallback to list when absent.
- No layout regressions from approved design.

## ASCII Wireframes (reference only)

Desktop (Two‑Column + Tabs)

  ┌──────────────────────────────────────────────────────────────────────────────┐
  │ [Carousel / Images]                  │ [Product Detail Card]                 │
  │  • main image                        │  [Series Badge]                       │
  │  • thumbnails                        │  Product Name (H1)                    │
  │                                      │  ★ Rating + count                     │
  │                                      │  Short Description                    │
  │                                      │  Variant Selector                     │
  │                                      │   - Dropdown: Firmness  ▾             │
  │                                      │   - Dropdown: Size      ▾             │
  │                                      │   - Quantity (optional)               │
  │                                      │   - Price (after selection)           │
  │                                      │   [Add to Cart]                       │
  │                                      │  Delivery info note                   │
  └──────────────────────────────────────────────────────────────────────────────┘
  [Tabs]
  ┌──────────────────────────────────────────────────────────────────────────────┐
  │ 商品詳情                                                                     │
  ├──────────────────────────────────────────────────────────────────────────────┤
  │ 產品特色                                                                     │
  │  • If featuresMarkdown present → render Markdown (text + images)             │
  │  • Else → existing icon + line items from features[] / categoryFeatures      │
  └──────────────────────────────────────────────────────────────────────────────┘

Mobile (Stacked)

  [Carousel]
  [Product Detail Card: badge, H1, rating, desc]
  [Variant Selector: Firmness ▾, Size ▾, Qty, Price, Add to Cart]
  [Delivery info]
  [Tabs: 商品詳情 → 產品特色 (Markdown or list)]

## Minimal Implementation Notes

- Extend `ProductTabs` to accept `featuresMarkdown?: string`.
- In `[productSlug].astro`, pass `product.featuresMarkdown` when present to `ProductTabs`.
- Use `BlogContent.astro` to render Markdown safely within the existing card.

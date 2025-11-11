# Tasks – Web Frontend Mattress & Accessory Products (Minimal Change)

This plan aligns with the design, current Astro layout, existing components, and Zustand usage. It avoids introducing new route families, providers, or package UI components.

## Phase 1: API (Hono) – Ensure payload parity

- [ ] 1.1 Ensure featuresMarkdown is returned in product detail
  - File: `apps/api/src/modules/products.ts`
  - Details: Include `featuresMarkdown` (when non-empty) in the response for GET `/api/products/:slug` alongside existing fields (`images`, `variants`, `features[]`).
  - Acceptance: Response shape matches design; frontend receives `featuresMarkdown` when present.

## Phase 2: Shared Types

- [ ] 2.1 Extend product types with optional markdown field
  - File: `packages/types/index-fixed.ts`
  - Details: Add `featuresMarkdown?: string` to `Product` while keeping `features?: string[]` for fallback.
  - Acceptance: Types compile; API, web, and admin share consistent product type.

## Phase 3: PDP wiring (Astro + React islands)

- [ ] 3.1 Extend ProductTabs to support Markdown features
  - File: `apps/web/src/components/ProductTabs.tsx`
  - Details: Add optional prop `featuresMarkdown?: string`. If provided and non-empty, render via `BlogContent.astro` inside the existing card. Otherwise keep current icon+list from `features[]/categoryFeatures`.
  - Acceptance: Visual layout unchanged; Markdown renders when available.

- [ ] 3.2 Pass featuresMarkdown from PDP page to ProductTabs
  - File: `apps/web/src/pages/shop/[category]/[productSlug].astro`
  - Details: Pass `featuresMarkdown={product.featuresMarkdown}` to `ProductTabs` without removing `features` props.
  - Acceptance: ProductTabs receives and renders Markdown when present.

- [ ] 3.3 URL preselect for dropdowns (size, firmness)
  - File: `apps/web/src/components/ProductVariantSelector.tsx`
  - Details: On mount, parse `?size=` and `?firmness=` from location and preselect if values exist and are valid. On change, update the URL query using `history.replaceState` (no reload). Do not alter layout.
  - Acceptance: Refresh preserves selection; selecting updates query; invalid params are ignored gracefully.

## Phase 4: PLP (confirm essentials only)

- [ ] 4.1 Verify lowest price display on cards
  - File: `apps/web/src/pages/shop/[category]/index.astro` and relevant components
  - Details: Confirm lowest variant price is displayed; no redesign.
  - Acceptance: Lowest price visible; no layout regressions.

## Phase 5: Testing

- [ ] 5.1 Unit – Variant schema and URL preselect
  - File: `apps/web/src/components/__tests__/ProductVariantSelector.test.tsx`
  - Details: Test dynamic schema derivation, valid/invalid preselect params, and query updates on change.
  - Acceptance: Tests pass; cover main decision paths.

- [ ] 5.2 Unit – Markdown vs. list fallback
  - File: `apps/web/src/components/__tests__/ProductTabs.markdown.test.tsx`
  - Details: Render with `featuresMarkdown` → Markdown; without → icon list. Ensure no layout shift in wrapper elements.
  - Acceptance: Tests pass; snapshot or role-based assertions validated.

- [ ] 5.3 E2E – PDP selection and add-to-cart
  - File: `apps/web/tests/e2e/pdp-variants.spec.ts`
  - Details: Visit PDP with `?size=…&firmness=…`, verify preselect, change selection, add to cart, assert cart contents. Mobile viewport run included.
  - Acceptance: E2E passes in CI.

Notes
- Do NOT introduce a new global `ProductProvider` or move state to a new context. Reuse local state and existing Zustand `useCartStore` only for cart actions.
- Do NOT move components to `packages/ui/*`. Keep web components in `apps/web/src/components/*`.
- Avoid layout changes; only augment behavior (Markdown features, URL preselect).

# PRD – Accessories Submenu Filter Support

## Objective
Enable navigation submenu entries (e.g., 枕頭、寢具、電動床架／下墊) under “精選周邊” to open the accessories category page with a pre-filtered product list such as `/shop/accessories?type=pillow`, without introducing new routes or large refactors.

## Background
- Current submenu links point to `/shop/accessories/<productSlug>`, which skips the listing page entirely.
- `CategoryPageLayout.astro` ignores query parameters and always fetches `/api/products?category=<slug>`.
- `/api/products` rejects unknown filters; only `category`, `featured`, `inStock`, `search`, `limit`, `offset`, `sortBy`, and `sortOrder` are supported.
- Accessory subtypes already exist in data via `productType` templates (see “Accessory subtype source”), so we only need to plumb this discriminator through the API and frontend.

## Requirements

### Functional
1. Visiting `/shop/accessories?type=<subtype>` must render the standard accessories listing with only the matching subtype visible.
2. `/shop/accessories` without query params continues to show all accessories.
3. Navigation submenu entries open URLs that set the appropriate `type` query so users land on the filtered view.
4. Filtered views should indicate the active subtype near the “found X items” text to confirm state.
5. Missing or unknown `type` queries default to the unfiltered accessories list, surface “All accessories” as the active subtype, and emit an analytics event for observability (no 404s).

### Non-Functional / Constraints
- Touch only the navigation JSON, `CategoryPageLayout.astro`, and the `/api/products` handler to keep the change minimal.
- Preserve existing caching and pagination; the new filter simply augments the query key.
- No new DB columns or routes; reuse existing `products.productType` (backed by templates) as the filter field.
- SEO canonical remains `/shop/accessories`; filtered URLs are allowed but canonicalized to the base category.

## Proposed Solution

### Backend (`apps/api/src/modules/products.ts`)
- Extend `productQuerySchema` with optional `subCategory` (string, lowercase slug, same validation as `category`). Allowed values are derived from the accessory templates in `packages/types/product-templates.ts` so web/admin/api layers share one source of truth.
- When `query.category === 'accessories'` and `query.subCategory` is present, add condition `eq(products.productType, query.subCategory)`; for all other categories the filter is ignored.
- The existing cache key already includes the serialized query; no extra work needed.
- Tests: add coverage for `GET /api/products?category=accessories&subCategory=pillow` returning only pillow products; ensure other categories ignore `subCategory`, and calling with an unsupported subtype falls back to the unfiltered list.

### Frontend (`apps/web`)
1. **Category page:** In `CategoryPageLayout.astro`, read `const subtype = Astro.url.searchParams.get('type')` and append `&subCategory=${subtype}` (URL-encoded) when calling the API. Surface the active subtype label in the results summary as `已篩選：<localized subtype label>` (falls back to `全部精選周邊`). If the API rejects the subtype, strip it from the UI and quietly show the default state.
2. **Navigation JSON:** Update `apps/web/src/content/navigation/main-menu.json` submenu hrefs to `/shop/accessories?type=pillow`, `/shop/accessories?type=sheet-set`, `/shop/accessories?type=adjustable-base`, etc., matching the template IDs below. The label/href mapping lives alongside the menu content so editors can see the canonical values.

#### Navigation entries
| Label (existing copy) | `type` query | Template ID |
| --- | --- | --- |
| 枕頭 | `pillow` | `pillow` |
| 寢具組 | `sheet-set` | `sheet-set` |
| 保潔墊 | `protector` | `protector` |
| 羽絨被 | `duvet` | `duvet` |
| 記憶床墊／Topper | `topper` | `topper` |
| 電動床架／下墊 | `adjustable-base` | `adjustable-base` |

Any additional accessory types added to `product-templates.ts` must also add a localized label + href entry in the navigation JSON to stay in sync.

### Accessory subtype source (Open question resolved)
Use the existing product type templates defined in `packages/types/product-templates.ts`. Valid accessory subtypes today are:
- `protector`
- `sheet-set`
- `pillow`
- `duvet`
- `topper`
- `adjustable-base`

Each template already ties to the `accessories` category and drives `productType`. Adding/removing options in that file automatically updates the permissible filter values, and the nav/menu validation step above ensures inconsistencies are caught during code review.

## Acceptance Criteria
- ✅ `/shop/accessories?type=pillow` only fetches pillow products via `/api/products?category=accessories&subCategory=pillow`.
- ✅ `/shop/accessories` behaves exactly as before.
- ✅ Header submenu links navigate to the filtered listing instead of product detail pages.
- ✅ UI indicates the active filter using the localized label block and remains accessible (screen readers announce the state change).
- ✅ Pagination, sorting, search, and count copy continue to function when a subtype filter is present.
- ✅ Missing/invalid `type` queries gracefully fall back to the unfiltered view and emit the analytics signal.
- ✅ Regression: other categories and `/api/products` queries are unaffected when `subCategory` is absent.

## Open Items
- SEO team to confirm whether filtered URLs need `<link rel="alternate">` entries (default assumption: canonical stays `/shop/accessories`). This answer is required before code freeze so meta tags can be updated in the same change if needed.

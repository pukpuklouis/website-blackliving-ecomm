# Tasks: Flexible Logistic Settings (Simplified)

- [x] 1. Database Implementation
    - [x] 1.1 Create `settings` table in `packages/db/schema.ts`
        - Define generic KV table: `id`, `key`, `value` (JSON), `updatedAt`
    - [x] 1.2 Generate migration (`pnpm -F db db:generate`)
        - Command: `pnpm -F db db:generate`
        - Purpose: Generate migration file from schema changes (never write manually)
    - [x] 1.3 Apply migration locally (`pnpm -F db db:migration:local`)
        - Command: `pnpm -F db db:migration:local`
        - Purpose: Apply generated migration to local database
- [x] 2. API Implementation
    - [x] 2.1 Create `modules/settings.ts`
        - Define Zod schema for `LogisticSettings` (baseFee, threshold, remoteZones)
    - [x] 2.2 Implement `GET /api/settings/:key`
    - [x] 2.3 Implement `PUT /api/settings/:key` (Admin only)
    - [x] 2.4 Register module in `index.ts`

- [x] 3. Admin Panel Implementation
    - [x] 3.1 Create `SettingsPage.tsx` (or update existing)
        - Add "Logistics" tab
    - [x] 3.2 Implement `GlobalSettingsForm` component
        - Inputs for `baseFee` and `freeShippingThreshold`
    - [x] 3.3 Implement `ZoneList` component
        - Dynamic list for `remoteZones` (City, District, Surcharge)
        - Add/Remove/Edit functionality

- [x] **Verify Admin Panel**
    - [x] Go to "Logistic Settings"
    - [x] Change "Free Shipping Threshold" to a new value (e.g., 5000)
    - [x] Click "Save" and verify toast notification
    - [x] Refresh page to ensure settings persisted
- [x] **Verify Web App**
    - [x] Add items to cart > Threshold
    - [x] Verify "Free Shipping" badge appears
    - [x] Verify shipping fee is 0
    - [x] Add items < Threshold
    - [x] Verify shipping fee is calculated correctly

- [x] 4. Web App Implementation
    - [x] 4.1 Update `cartStore.ts`
        - Add `fetchLogisticSettings` action
        - Update `calculateShippingFee` logic (Base + Surcharge)
    - [x] 4.2 Update `CartDrawer` (or relevant component)
        - Call `fetchLogisticSettings` on mount
    - [x] 4.3 Verify `calculateShippingFee` logic with unit tests (or manual verification) when Address (City/District) changes

- [x] 5. Verification
    - [x] 5.1 Configure settings in Admin (e.g., Free > 5000, Surcharge for 'Hualien' +200)
    - [x] 5.2 Verify correct fee in Web App Cart/Checkout for different addresseshipping.
        - Check free shipping threshold.
        - Check address in Hualien triggers surcharge.

# Flexible Logistic Settings Walkthrough

This document outlines the changes made to implement flexible logistic settings and how to verify them.

## Changes Implemented

### 1. Database & API
- **New Table**: `settings` table created in database to store global configuration.
- **API Endpoints**:
    - `GET /api/settings/:key`: Retrieve settings.
    - `PUT /api/settings/:key`: Update settings (Admin only).
- **Validation**: Zod schemas added for `logistic_settings` validation.

### 2. Admin Panel
- **New UI**: Added "Logistics" tab in `/dashboard/settings`.
- **Features**:
    - Configure "Base Shipping Fee".
    - Configure "Free Shipping Threshold".
    - Manage "Remote Zones" (City, District, Surcharge).
- **UX Improvements**:
    - Added toast notifications for successful saves.
    - Added loading states for save button.

### 3. Web App
- **Cart Store**: Updated `cartStore.ts` to fetch settings from API.
- **Dynamic Calculation**: Shipping fee is now calculated based on:
    - Subtotal vs Free Shipping Threshold.
    - Customer's Shipping Address vs Remote Zones.
- **UI Components**:
    - Updated `MiniCart` and `ShoppingCart` to use dynamic `freeShippingThreshold` from store instead of hardcoded values.
- **Cart Drawer**: Fetches settings automatically when mounted.

### 4. Smart Updates & Persistence
- **Optimized Fetching**: The `fetchLogisticSettings` action in `cartStore.ts` now checks if the data has actually changed before updating the state. This prevents unnecessary re-renders and ensures a smoother user experience.
- **Persistence**: Logistic settings are now persisted in `localStorage` so they remain available across page reloads.
- **Stale State Fix**: Bumped the `cart-store` persist version to `1` to ensure that any stale state (specifically `subtotal` being persisted as a static value instead of a getter) is cleared, restoring correct cart calculation logic.

### 5. Verification
- **Admin Panel**: Verified that settings can be saved and toast notifications appear.
- **Web App**: Verified that the cart correctly uses the dynamic `freeShippingThreshold` and calculates shipping fees based on the configured settings. Debugged and fixed an issue where the "Spend more" message was appearing incorrectly due to stale local storage data.

## Verification Steps

### Automated Tests
Unit tests for the shipping fee calculation logic have been added and passed:
```bash
pnpm -F web test
```

### Manual Verification

#### 1. Configure Settings (Admin)
1.  Navigate to `/dashboard/settings`.
2.  Click on the **Logistics** (Truck icon) tab.
3.  Set **Base Fee** to `100`.
4.  Set **Free Shipping Threshold** to `1000`.
5.  Add a **Remote Zone**:
    - City: `花蓮縣`
    - Surcharge: `200`
6.  Click **Save Settings**.

#### 2. Verify Shipping Fee (Web Shop)
1.  Go to the shop and add items to your cart.
2.  **Scenario A: Standard Shipping**
    - Ensure subtotal is **below 1000** (e.g., 500).
    - Proceed to checkout.
    - Enter address: City `台北市`.
    - **Expected Fee**: `100` (Base Fee).
3.  **Scenario B: Free Shipping**
    - Add more items so subtotal is **above 1000** (e.g., 1500).
    - **Expected Fee**: `0`.
4.  **Scenario C: Remote Zone Surcharge**
    - Change address: City `花蓮縣`.
    - **Expected Fee**: `200` (0 Base + 200 Surcharge).
5.  **Scenario D: Remote Zone + Base Fee**
    - Remove items so subtotal is **below 1000** (e.g., 500).
    - Address: City `花蓮縣`.
    - **Expected Fee**: `300` (100 Base + 200 Surcharge).

# Design Document

## Overview

The Flexible Logistic Settings feature allows admins to configure global shipping rules and simple zone-based surcharges. To keep the architecture simple and flexible, we will store these configurations as a JSON object in a generic `settings` table. The frontend will fetch these settings and perform the cost calculation logic.

## Architecture

### Data Storage Strategy
Instead of creating complex relational tables for zones (`shipping_methods`, `zones`, `rates`), we will use a **Document-based approach** within SQLite.
- **Table**: `settings` (Key-Value store)
- **Key**: `logistic_settings`
- **Value**: JSON object containing all rules.

This approach is perfect for "Basic settings + simple zones" as it allows easy schema evolution without database migrations if we add new fields (e.g., "isSurchargeWaivedForFreeShipping") later.

### Data Models

#### Logistic Settings JSON Structure
```typescript
interface LogisticSettings {
  // Global Rules
  baseFee: number;            // Default: 1500
  freeShippingThreshold: number; // Default: 30000
  
  // Simple Zones
  remoteZones: RemoteZone[];
}

interface RemoteZone {
  id: string;                 // UUID for UI management
  city: string;               // e.g., "Hualien County"
  district?: string;          // e.g., "Xiulin Township" (If null, applies to whole city)
  surcharge: number;          // e.g., 500
}
```

## Components

### 1. Database Schema (`packages/db/schema.ts`)
We will add a generic `settings` table.
```typescript
export const settings = sqliteTable('settings', {
  id: text('id').primaryKey(),
  key: text('key').notNull().unique(),
  value: text('value', { mode: 'json' }).notNull(),
  updatedAt: integer('updated_at', { mode: 'timestamp' }),
});
```

### 2. API (`apps/api`)
- **Module**: `modules/settings.ts`
- **Endpoints**:
  - `GET /api/settings/logistic_settings`: Returns the JSON object.
  - `PUT /api/settings/logistic_settings`: Validates and saves the JSON object.

### 3. Admin UI (`apps/admin`)
- **Page**: `SettingsPage.tsx`
- **Components**:
  - `GlobalSettingsForm`: Inputs for Base Fee & Threshold.
  - `ZoneList`: A dynamic list to add/remove Remote Zones.
  - Uses `react-hook-form` and `zod` for validation.

### 4. Web App (`apps/web`)
- **Store**: `cartStore.ts`
  - Fetch settings on init.
  - `calculateShippingFee(subtotal, address)`:
    ```typescript
    function calculateShippingFee(subtotal, address, settings) {
      let fee = subtotal >= settings.freeShippingThreshold ? 0 : settings.baseFee;
      
      const zone = settings.remoteZones.find(z => 
        z.city === address.city && 
        (!z.district || z.district === address.district)
      );
      
      if (zone) fee += zone.surcharge;
      
      return fee;
    }
    ```

## Integration Points

- **Checkout Page**: Needs to pass the selected `city` and `district` to the `cartStore` to update the shipping fee in real-time.

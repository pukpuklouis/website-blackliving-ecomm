# Requirements Document

## Introduction

This feature enables administrators to configure logistic fees, free shipping thresholds, and basic delivery zones (e.g., remote area surcharges) directly via the admin panel. This replaces hardcoded values in the frontend, providing flexibility to adjust shipping costs based on business needs without code changes.

## Alignment with Product Vision

This aligns with the goal of creating a user-friendly e-commerce platform where business rules are managed by administrators. It ensures that shipping costs accurately reflect operational realities (like extra costs for remote areas) while keeping the system simple and maintainable.

## Requirements

### Requirement 1: Global Shipping Configuration

**User Story:** As an Administrator, I want to set a base shipping fee and a free shipping threshold, so that standard orders are charged correctly.

#### Acceptance Criteria

1. WHEN the admin navigates to the "Logistic Settings" page, THEN the system SHALL display inputs for "Base Shipping Fee" and "Free Shipping Threshold".
2. IF the settings are not configured, THEN the system SHALL use default values (1500 for fee, 30000 for threshold).
3. WHEN the admin saves changes, THEN the system SHALL update the global settings.

### Requirement 2: Simple Zone Management (Remote Areas)

**User Story:** As an Administrator, I want to define specific areas (e.g., remote cities or districts) that incur an additional shipping surcharge, so that we cover the extra logistic costs.

#### Acceptance Criteria

1. WHEN on the settings page, THEN the admin SHALL be able to add "Remote Zones".
2. A Remote Zone SHALL consist of:
   - **City/County** (e.g., Hualien County)
   - **District** (Optional, e.g., Xiulin Township)
   - **Surcharge** (e.g., +500)
3. The admin SHALL be able to add, edit, and remove these zones.

### Requirement 3: Dynamic Shipping Calculation

**User Story:** As a Customer, I want the shipping fee to be calculated based on my delivery address and cart total, so that I see the correct cost.

#### Acceptance Criteria

1. **Base Rule**: IF subtotal >= Free Threshold, THEN Base Fee is 0. ELSE Base Fee is the configured amount.
2. **Surcharge Rule**: IF the delivery address matches a configured "Remote Zone", THEN add the Surcharge to the fee.
   - *Note: Surcharges typically apply even if the base shipping is free, unless specified otherwise. For this MVP, surcharges are always added.*
3. **Total Fee** = (Base Fee (or 0)) + (Remote Surcharge (if applicable)).
4. The frontend cart and checkout pages SHALL update the fee dynamically when the address changes.

## Non-Functional Requirements

### Usability
- The admin UI for adding zones should be simple (e.g., a list with "Add Row" button).
- Address selection on the frontend should trigger a fee recalculation.

### Performance
- Settings should be cached on the client side where possible to prevent lag during checkout.

### Security
- Only Admins can modify these settings.

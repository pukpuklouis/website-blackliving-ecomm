# Admin Settings System Requirements

## Introduction

The Admin Settings System will provide Black Living administrators with a centralized interface to manage system configuration, user permissions, and operational settings for the furniture e-commerce platform. This system will replace the current placeholder component and enable secure, auditable configuration management across the entire platform.

## Alignment with Product Vision

This feature directly supports Black Living's operational excellence objective by providing administrators with the tools needed to maintain 98% on-time delivery rates and achieve 4.8+ star customer satisfaction. The settings system enables efficient management of business-critical configurations without developer intervention, supporting the platform's goal of becoming the most trusted furniture e-commerce brand in Taiwan.

## Requirements

### Requirement 1: User Permission Management

**User Story:** As a Black Living administrator, I want to manage user roles and permissions so that I can control access to different system functions and maintain security.

#### Acceptance Criteria

1. WHEN an admin accesses the settings page THEN the system SHALL display a user permissions management section
2. WHEN an admin views user permissions THEN the system SHALL show all current admin users with their roles (Super Admin, Admin, Editor, Viewer)
3. WHEN an admin assigns a role to a user THEN the system SHALL validate the assignment and log the change with timestamp and admin attribution
4. WHEN an admin removes admin privileges THEN the system SHALL require fresh session confirmation and audit logging
5. IF a user attempts to access unauthorized settings THEN the system SHALL deny access and log the security event

### Requirement 2: Website Basic Settings Management

**User Story:** As a Black Living administrator, I want to manage core website information so that customers see accurate and up-to-date business details.

#### Acceptance Criteria

1. WHEN an admin accesses website settings THEN the system SHALL display sections for site title, contact information, and business hours
2. WHEN an admin updates the site title THEN the system SHALL validate the input and update both the admin interface and public website
3. WHEN an admin modifies contact information THEN the system SHALL validate email format and phone number format
4. WHEN an admin updates business hours THEN the system SHALL support multiple time slots and special holiday schedules
5. WHEN settings are saved THEN the system SHALL provide immediate visual feedback and cache invalidation for public site updates

### Requirement 3: Payment & Logistics Settings Management

**User Story:** As a Black Living administrator, I want to configure payment processing and shipping options so that the platform can handle transactions and deliveries efficiently.

#### Acceptance Criteria

Current Milestone (Placeholder) Acceptance Criteria

1. WHEN an admin accesses payment and logistics settings AND the features are disabled THEN the API SHALL return placeholder responses; the UI SHOULD display read-only explanatory text and disabled controls (Traditional Chinese copy).
2. WHEN `features.payments.enabled = false` THEN the UI SHOULD hide payment gateway credential inputs and show a "即將推出 / Coming soon" notice (server remains authoritative regardless).
3. WHEN `features.logistics.enabled = false` THEN the UI SHOULD hide carrier configuration and show disabled shipping method options with clear messaging (server remains authoritative regardless).
4. WHEN an admin views bank transfer information WHILE payments are disabled THEN any sensitive fields MUST be redacted in API responses; the UI MAY display informational text but any writes SHALL be rejected by the server.
5. WHEN placeholder settings are displayed THEN the server SHALL prevent save operations for deferred capabilities and SHALL log the access in the audit log.
6. Feature flags SHALL default to disabled: `features.payments.enabled = false`, `features.logistics.enabled = false`.

Interim Admin UI Compatibility (No Code Changes This Milestone)

To align with the existing admin UI (which currently renders editable forms and calls website/payment/logistics endpoints without feature flag gating), the API SHALL behave and the UI SHOULD behave as follows until UI gating is implemented:

1. Reads: `GET /api/admin/settings/payment` and `GET /api/admin/settings/logistics` MAY be called by the UI. When the feature is disabled, the API SHALL return 200 with a placeholder payload:
   - `{ status: 'placeholder', readonly: true, message: '功能尚未開放（即將推出）', data: null }`
   - The UI SHOULD render the message and treat the section as read-only; if it does not, server responses remain authoritative.
2. Writes: `PUT /api/admin/settings/payment` and `PUT /api/admin/settings/logistics` SHALL return 403 with `{ code: 'FEATURE_DISABLED', message: '此功能尚未開放' }` when disabled.
3. Save Controls: When disabled, the UI SHOULD display disabled save buttons with tooltip "即將推出" and SHOULD NOT attempt to send writes. If the UI attempts writes, the server SHALL return 403.
4. Audit: Viewing these sections while disabled SHALL create a non-sensitive audit entry with action `view_placeholder` and resource `settings:payments` or `settings:logistics`.
5. Localization: The placeholder copy SHOULD be in Traditional Chinese and concise. Recommended primary string: "功能尚未開放（即將推出）"; secondary helper: "此區域將於未來更新釋出。"

Future (Post-MVP) Acceptance Criteria

1. WHEN an admin accesses payment settings THEN the system SHALL display secure forms for bank account configuration
2. WHEN an admin configures bank accounts THEN the system SHALL encrypt sensitive information and validate account formats
3. WHEN an admin sets up shipping methods THEN the system SHALL support multiple carriers with pricing and delivery timeframes
4. WHEN an admin configures payment gateways THEN the system SHALL support Taiwan payment providers with proper PCI compliance
5. IF payment settings are modified THEN the system SHALL require fresh session confirmation and send notification alerts

Deferred Scope for Current Milestone

- Third-party payment gateway integrations (tokenization, webhooks, refunds, reconciliation)
- Carrier integrations (rate shopping, labels, tracking, pickup scheduling)
- Shipping zones, rules engine, and negotiated-rate management
- PCI DSS audit artifacts and penetration test sign-off

Versioning & Migration Plan

- Phase 0 (current): Maintain compatibility with existing UI endpoints; payments/logistics run in placeholder mode with feature-disabled responses for writes.
- Phase 1: Introduce feature-flagged UI gating (hide advanced inputs; no network calls when disabled).
- Phase 2: Migrate to namespaced settings API with optimistic concurrency (see API Contracts v1). Provide a deprecation window where both v0 and v1 endpoints are served.

### Requirement 4: Settings Audit & Security

**User Story:** As a Black Living administrator, I want all settings changes to be audited so that I can maintain accountability and security compliance.

#### Acceptance Criteria

1. WHEN any setting is modified THEN the system SHALL log the change with user ID, timestamp, old value, and new value
2. WHEN sensitive settings are accessed THEN the system SHALL require fresh session authentication
3. WHEN settings are exported THEN the system SHALL provide secure, encrypted backup files
4. IF unauthorized access is attempted THEN the system SHALL log security events and alert administrators
5. WHEN settings are restored from backup THEN the system SHALL validate data integrity and provide rollback capability

## Non-Functional Requirements

### Code Architecture and Modularity
- **Single Responsibility Principle**: Each settings module shall handle one specific domain (permissions, website, payments)
- **Modular Design**: Settings components shall be isolated and reusable across different admin interfaces
- **Dependency Management**: Settings modules shall not have circular dependencies
- **Clear Interfaces**: Settings APIs shall provide typed interfaces with validation schemas

### Performance
- Settings pages shall load within 2 seconds under normal network conditions
- Settings updates shall take effect within 30 seconds across all system components
- The system shall handle concurrent admin users without data conflicts
- Settings caching shall reduce database load by 80% for read operations

### Security
- All settings changes shall be encrypted in transit and at rest
- Sensitive payment information shall follow PCI DSS compliance standards
- Role-based access control shall prevent unauthorized settings modifications
- Audit logs shall be tamper-proof and retained for regulatory compliance periods
- Re-authentication TTL for sensitive operations SHALL be 5 minutes (step-up required for role changes, payment/logistics, and exports)
- Audit retention period SHALL be at least 24 months
- Audit log integrity SHALL be ensured via hash chaining (`prev_hash` + `hash`) and periodic anchoring

### Reliability
- Settings system shall maintain 99.9% uptime during business hours
- All settings changes shall support transactional rollback on failure
- The system shall provide graceful degradation when external services are unavailable
- Data validation shall prevent corrupted settings from being saved
- Concurrency control SHALL use optimistic versioning; conflicting writes SHALL return 409 with guidance to retry

### Usability
- Settings interface shall follow Black Living's design system and accessibility standards
- Form validation shall provide clear, actionable error messages in Traditional Chinese
- Settings shall be organized in logical groups with progressive disclosure for complex options
- The system shall provide contextual help and validation feedback for all settings

### Feature Flags
- Flags SHALL be centrally managed and default to disabled for deferred capabilities.
- Recommended environment variable names: `FEATURES_PAYMENTS_ENABLED=false`, `FEATURES_LOGISTICS_ENABLED=false`.
- Admin UI behavior: When a flag is `false`, the corresponding section SHOULD render a placeholder message in read-only mode and SHOULD NOT issue network writes; server enforcement SHALL reject writes regardless.

### Caching & Consistency
- Public-site settings reads SHALL use a read-through cache (Cloudflare KV) with versioned keys: `settings:{namespace}:{key}:v{version}`
- Cache TTL SHALL be 60 seconds for public reads; admin reads SHALL bypass cache after a successful save
- On successful write, the system SHALL bump the version, update KV, and publish a `settings-updated` event to trigger downstream revalidation
- Admin APIs SHALL support optimistic concurrency via `If-Match: <version>` header and return 409 on version mismatch

## Data Model (Cloudflare D1)

### Table: `settings`
- `id` (PK)
- `namespace` (TEXT; e.g., `permissions`, `website`, `payments`, `logistics`)
- `key` (TEXT)
- `value_json` (TEXT; validated by Zod schemas per namespace)
- `version` (INTEGER; monotonically increasing)
- `updated_by` (TEXT; admin user ID)
- `updated_at` (DATETIME)

Constraints
- (`namespace`, `key`) SHALL be unique
- Sensitive fields SHALL be encrypted at the application layer (AES-GCM); encryption keys SHALL be managed via Wrangler secrets

### Table: `settings_audit`
- `id` (PK)
- `namespace` (TEXT)
- `key` (TEXT)
- `old_value_json` (TEXT, nullable)
- `new_value_json` (TEXT)
- `acted_by` (TEXT; admin user ID)
- `acted_at` (DATETIME)
- `prev_hash` (TEXT)
- `hash` (TEXT)

Rules
- Each audit record SHALL chain to the previous one via `prev_hash`
- Exports SHALL include a signed checksum for integrity verification

## API Contracts (Workers + Hono)

### API v0 (Current UI Compatibility)
- Website
  - `GET /api/admin/settings/website` → 200 `{ data }`
  - `PUT /api/admin/settings/website` → 200 on success
- Payments (Deferred Placeholder)
  - `GET /api/admin/settings/payment` → 200 `{ status: 'placeholder', readonly: true, message, data: null }` when disabled
  - `PUT /api/admin/settings/payment` → 403 `{ code: 'FEATURE_DISABLED', message }` when disabled
- Logistics (Deferred Placeholder)
  - `GET /api/admin/settings/logistics` → 200 `{ status: 'placeholder', readonly: true, message, data: null }` when disabled
  - `PUT /api/admin/settings/logistics` → 403 `{ code: 'FEATURE_DISABLED', message }` when disabled
- Permissions
  - `GET /api/admin/settings/admin-users` → 200 list
  - `PUT /api/admin/settings/admin-users/:userId/role` → 200 on success
  - `DELETE /api/admin/settings/admin-users/:userId` → 200 on success
- Audit
  - `GET /api/admin/settings/audit-logs?limit=` → 200 list

Notes
- For disabled features, 403 with `FEATURE_DISABLED` is preferred over 501 to clearly communicate a policy decision.
- Admin responses SHALL set `Cache-Control: no-store`.

### API v1 (Planned)
- Settings
  - `GET /admin/settings/:namespace` → 200 JSON list of `{ key, value, version }` (admin; cache-bypassed)
  - `PUT /admin/settings/:namespace/:key` → Validates with Zod, requires `If-Match: <version>`; on success: 200 with new `{ version }`; on conflict: 409
- Security
  - Sensitive namespaces (`payments`, `logistics`) SHALL require step-up auth within 5 minutes

### Permissions
- `GET /admin/permissions/users` → 200 JSON of admin users and roles
- `PUT /admin/permissions/users/:userId/role` → Step-up auth + audit logging

### Audit
- `GET /admin/audit?namespace=&key=&since=` → 200 paginated JSON; supports secure export with checksum

Security
- All endpoints SHALL be behind Better Auth middleware with RBAC checks
- Admin responses SHALL set `Cache-Control: no-store`

## Testing & Validation
- Unit: Schema validation (Zod), encryption/decryption behavior, version bump logic
- API: RBAC matrix per role, step-up auth flows (fresh/expired), optimistic concurrency conflicts (409), audit logging
- API v0 (Compatibility): Disabled features return placeholders for reads and 403 `FEATURE_DISABLED` for writes; no writes are persisted
- E2E (Admin UI):
  - Permissions: assign/revoke roles with audit assertions
  - Website settings: update title/contact/hours and verify cache bust
  - Payments/Logistics (current milestone): either
    - UI renders placeholder with disabled controls and Traditional Chinese messaging (preferred), OR
    - UI attempts writes and surfaces server 403 gracefully (e.g., error toast)
- Audit Integrity: Hash-chain continuity and export checksum verification

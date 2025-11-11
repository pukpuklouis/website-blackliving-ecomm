# Admin Accessory Product Management Requirements

## Introduction

This feature adds comprehensive accessory-type product management capabilities to the Black Living admin backend. It enables administrators and editors to create, manage, and publish accessory products (such as mattress protectors, pillow sets, and bedding accessories) with full variant support, batch operations, and approval workflows. The implementation maintains minimal changes to existing schema while adding new functionality for accessory products.

## Alignment with Product Vision

This feature directly supports Black Living's mission to provide Taiwanese consumers with a seamless, trustworthy online shopping experience for home furnishings. By expanding product management capabilities to include accessories, we enable the platform to offer complete bedding solutions, increasing customer satisfaction and purchase value. The feature aligns with our commitment to quality, transparency, and operational excellence by providing robust administrative tools while maintaining data integrity and user experience standards.

## Requirements

### Requirement 1: Product Type Templates

**User Story:** As an admin, I want to create products using predefined templates for different accessory types, so that I can efficiently manage various bedding accessories with appropriate variant options.

#### Acceptance Criteria

1. WHEN an admin selects a product type (mattress, protector, sheet-set, pillow, duvet, topper, adjustable-base, other) THEN the system SHALL display appropriate variant axes and default options
2. WHEN creating a mattress product THEN the system SHALL provide firmness (extra firm, firm, medium, plush) and size (twinxl, full, queen, king, calking) axes
3. WHEN creating a protector product THEN the system SHALL provide size axis only
4. WHEN creating a sheet-set product THEN the system SHALL provide size and color axes
5. WHEN creating a pillow product THEN the system SHALL provide firmness/loft axis
6. WHEN creating a duvet product THEN the system SHALL provide size and weight axes
7. WHEN creating a topper product THEN the system SHALL provide size axis and optional thickness axis
8. WHEN creating an adjustable-base product THEN the system SHALL provide size axis only
9. WHEN selecting "other" product type THEN the system SHALL allow custom option definition

### Requirement 2: Features Markdown Support

**User Story:** As an admin, I want to create rich product feature descriptions using Markdown, so that I can provide detailed, formatted product information to customers.

#### Acceptance Criteria

1. WHEN editing product features THEN the system SHALL provide a Markdown editor with support for text, images, and formatting
2. WHEN featuresMarkdown is populated THEN the system SHALL display the Markdown content on product detail pages
3. WHEN featuresMarkdown is empty THEN the system SHALL fallback to displaying the existing features array as a bulleted list
4. WHEN saving product data THEN the system SHALL store both featuresMarkdown and maintain backward compatibility with features array

### Requirement 3: Dedicated Product Edit Page

**User Story:** As an admin, I want a dedicated product edit page instead of modal-based editing, so that I can efficiently manage complex product configurations with better user experience.

#### Acceptance Criteria

1. WHEN clicking "Edit" on a product in the list THEN the system SHALL navigate to `/dashboard/products/{id}/edit`
2. WHEN creating a new product THEN the system SHALL navigate to `/dashboard/products/new`
3. WHEN on the edit page THEN the system SHALL display organized sections: Basic Info, Media, Specifications, Features, Advanced Settings
4. WHEN using the features section THEN the system SHALL provide a BlockNote editor for Markdown content
5. WHEN leaving the page with unsaved changes THEN the system SHALL display a confirmation dialog
6. WHEN the page loads THEN the system SHALL auto-save drafts to localStorage
7. WHEN viewing variants THEN the system SHALL support switching between table and card view modes
8. WHEN editing a product THEN the system SHALL provide a preview link to the product detail page
9. WHEN refactoring is complete THEN the system SHALL maintain ProductManagement.tsx under 500 lines through component extraction

### Requirement 4: Variant Matrix Generation

**User Story:** As an admin, I want to automatically generate product variants from selected options, so that I can efficiently create all possible product combinations.

#### Acceptance Criteria

1. WHEN selecting option values THEN the system SHALL generate a matrix of all possible variant combinations
2. WHEN generating variants THEN the system SHALL allow admins to deselect unwanted combinations
3. WHEN a variant is active THEN the system SHALL require price and stock values
4. WHEN generating variants THEN the system SHALL auto-generate SKUs following the pattern: {category}-{series}-{dimensions}-{attributes}

### Requirement 5: Batch Operations

**User Story:** As an admin, I want to perform batch operations on multiple variants, so that I can efficiently update pricing, inventory, and images across similar products.

#### Acceptance Criteria

1. WHEN selecting multiple variants THEN the system SHALL show batch operation toolbar
2. WHEN performing batch pricing THEN the system SHALL support base price + differential pricing by option values
3. WHEN performing batch inventory THEN the system SHALL support three modes: overwrite (set to new value), fill-empty (only update zero/null values), increment (add to existing value)
4. WHEN performing batch image assignment THEN the system SHALL allow assigning images by color or style options
5. WHEN performing batch operations THEN the system SHALL provide clear feedback on affected variants

### Requirement 6: SKU and Barcode Management

**User Story:** As an admin, I want automatic SKU generation and optional barcode support, so that I can maintain consistent product identification across the system.

#### Acceptance Criteria

1. WHEN generating variants THEN the system SHALL auto-create SKUs using the format: {CATEGORY}-{SERIES}-{SIZE}-{ATTR...} with a maximum length of 32 characters and established abbreviations (SIZE/COLOR/WEIGHT/THICKNESS/LOFT)
2. WHEN entering custom SKUs THEN the system SHALL validate uniqueness across all products and maximum length of 32 characters
3. WHEN entering barcodes THEN the system SHALL validate uniqueness (optional field)
4. WHEN importing products THEN the system SHALL validate SKU uniqueness and reject duplicates

### Requirement 7: Approval Workflow

**User Story:** As an editor, I want a structured approval process for product publishing, so that quality standards are maintained while enabling efficient content creation.

#### Acceptance Criteria

1. WHEN an editor creates or edits a product THEN the system SHALL set status to "draft"
2. WHEN submitting for review THEN the system SHALL change status to "in_review"
3. WHEN an admin approves THEN the system SHALL change status to "published"
4. WHEN an admin archives a product THEN the system SHALL change status to "archived"
5. WHEN publishing THEN the system SHALL validate required fields: main image, at least one active variant, valid prices and stock, SKU length ≤32 characters, optionValues only from product options
6. WHEN status changes THEN the system SHALL log the action with user, timestamp, and field-level differences for audit tracking
7. WHEN a product is archived THEN the system SHALL remove it from public visibility on the frontend

### Requirement 8: CSV Import/Export

**User Story:** As an admin, I want to bulk import and export product data via CSV, so that I can efficiently manage large product catalogs.

#### Acceptance Criteria

1. WHEN exporting products THEN the system SHALL support filtering by status, series, and type with filename including timestamp and filter summary
2. WHEN exporting products THEN the system SHALL include columns: productId, productType, title, option:size, option:color, option:weight, sku, price, stock, barcode, imageUrl, status
3. WHEN importing CSV THEN the system SHALL validate SKU uniqueness and reject invalid option combinations
4. WHEN import fails THEN the system SHALL provide detailed error reports with row numbers and issues
5. WHEN importing THEN the system SHALL support "skip errors" mode to import valid rows while reporting issues

### Requirement 9: Role-Based Permissions

**User Story:** As a system administrator, I want granular permissions for product management, so that different user roles have appropriate access levels.

#### Acceptance Criteria

1. WHEN a user has Admin role THEN the system SHALL allow full CRUD operations and publishing
2. WHEN a user has Editor role THEN the system SHALL allow create/edit operations but require admin approval for publishing
3. WHEN a user has Viewer role THEN the system SHALL provide read-only access to product data
4. WHEN permissions are insufficient THEN the system SHALL display clear error messages and hide restricted UI elements

### Requirement 10: API Endpoints

**User Story:** As a frontend developer, I want comprehensive REST API endpoints, so that I can build rich product management interfaces.

#### Acceptance Criteria

1. WHEN calling POST /admin/products THEN the system SHALL create a new product and return the created resource
2. WHEN calling PUT /admin/products/{id} THEN the system SHALL update the product and return the updated resource
3. WHEN calling POST /admin/products/{id}:archive THEN the system SHALL archive the product and remove from public visibility
4. WHEN calling POST /admin/products/{id}/variants:generate THEN the system SHALL generate variants from provided options and support exclude parameter for unwanted combinations
5. WHEN calling PUT /admin/variants/batch THEN the system SHALL apply batch updates with mode parameter (overwrite/fill-empty/increment)
6. WHEN calling POST /admin/variants/import THEN the system SHALL process CSV import and return results
7. WHEN calling GET /admin/products THEN the system SHALL return paginated product list with filtering options
8. WHEN calling POST /admin/products/{id}:publish THEN the system SHALL publish the product if validation passes

## Non-Functional Requirements

### Code Architecture and Modularity
- **Single Responsibility Principle**: Each component shall handle one aspect of product management
- **Modular Design**: Product management features shall be isolated from other admin functionality
- **Dependency Management**: Minimize coupling between product management and other system components
- **Clear Interfaces**: Define clean contracts between frontend components and API endpoints

### Performance
- Page load time for product edit page SHALL be under 2 seconds
- Variant generation for products with up to 100 variants SHALL complete within 5 seconds
- CSV import of 1000 products SHALL complete within 30 seconds
- API response time for product operations SHALL be under 500ms for 95th percentile

### Security
- All product management operations SHALL require authentication
- Role-based access control SHALL be enforced at API and UI levels
- Input validation SHALL prevent injection attacks and data corruption
- File uploads SHALL be validated for type and content

### Reliability
- Product data SHALL maintain consistency during concurrent operations
- Failed operations SHALL not leave system in inconsistent state
- Error handling SHALL provide clear feedback to users
- System SHALL maintain data integrity during bulk operations

### Usability
- Product creation workflow SHALL be completable within 3 minutes for standard accessory products
- Error messages SHALL be clear and actionable
- Progress indicators SHALL be shown for long-running operations
- Keyboard navigation SHALL be supported throughout the interface

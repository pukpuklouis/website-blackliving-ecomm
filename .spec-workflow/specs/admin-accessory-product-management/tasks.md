# Admin Accessory Product Management Tasks

- [x] 1. Extend Zod validation schemas for accessory product fields
  - File: packages/db/schema.ts (modify existing), apps/api/src/modules/products.ts (modify existing), packages/types/index-fixed.ts (modify existing)
  - Extend existing product validation schemas to include accessoryType, parentProductId, featuresMarkdown, and enhanced variant fields
  - Add validation for SKU length (≤32 characters), optionValues constraints, and accessory-specific fields
  - Purpose: Establish type safety and validation for accessory product data structures
  - _Leverage: existing product schema in packages/db/schema.ts, existing Zod validation in apps/api/src/modules/products.ts, shared types in packages/types/index-fixed.ts_
  - _Requirements: 1, 6, 7_
  - _Prompt: Role: Backend Developer specializing in TypeScript and data validation | Task: Extend existing Zod schemas in products module to support accessory product fields (accessoryType, parentProductId, featuresMarkdown) and enhanced variant validation including SKU length limits and optionValues constraints as specified in requirements 1, 6, and 7 | Restrictions: Do not break existing product validation, maintain backward compatibility, follow existing schema patterns | Success: All accessory fields are properly validated, existing product creation still works, new validation rules prevent invalid accessory data_

- [x] 2. Create product type templates configuration
  - File: packages/types/product-templates.ts (new), apps/admin/app/lib/product-templates.ts (new)
  - Define TypeScript interfaces for ProductTypeTemplate, VariantAxis, and ProductOptions
  - Implement template configurations for mattress, protector, sheet-set, pillow, duvet, topper, adjustable-base, and other types
  - Create utility functions for template selection and validation
  - Purpose: Provide predefined templates for different accessory categories with appropriate variant axes
  - _Leverage: existing type definitions in packages/types/index-fixed.ts, existing utility patterns in apps/admin/app/lib/_
  - _Requirements: 1_
  - _Prompt: Role: TypeScript Developer specializing in configuration and type systems | Task: Create comprehensive product type template system with TypeScript interfaces and configurations for all accessory types as specified in requirement 1, including mattress, protector, sheet-set, pillow, duvet, topper, adjustable-base templates with their respective variant axes and default options | Restrictions: Must support optional thickness axis for toppers, maintain type safety, follow existing naming conventions | Success: All product types have complete template definitions, templates are easily selectable and validated, TypeScript compilation passes without errors_

- [x] 3. Implement SKU generation utilities
  - File: apps/admin/app/lib/sku-generator.ts (new), apps/admin/app/lib/__tests__/sku-generator.test.ts (new)
  - Create SKU generation function following format: {CATEGORY}-{SERIES}-{SIZE}-{ATTR...}
  - Implement abbreviation mapping for SIZE/COLOR/WEIGHT/THICKNESS/LOFT
  - Add uniqueness validation and length checking (≤32 characters)
  - Create SKU suggestion functionality for conflicts
  - Purpose: Provide consistent SKU generation and validation for accessory products
  - _Leverage: existing utility patterns in apps/admin/app/lib/_, existing validation patterns_
  - _Requirements: 6_
  - _Prompt: Role: Frontend Developer specializing in business logic and utility functions | Task: Implement comprehensive SKU generation system following requirement 6 format with abbreviation mappings, uniqueness validation, and conflict resolution suggestions, ensuring SKUs are ≤32 characters and follow the established pattern | Restrictions: Must handle all accessory-specific attributes, provide meaningful suggestions for conflicts, maintain performance for bulk operations | Success: SKU generation works for all product types, uniqueness is validated, suggestions are helpful for resolving conflicts, all edge cases handled_

- [x] 4. Extend admin API module with accessory endpoints
  - File: apps/api/src/modules/admin.ts (modify existing)
  - Add POST /api/admin/products/{id}/variants:generate endpoint with exclude parameter
  - Add PUT /api/admin/variants/batch endpoint with mode parameter (overwrite/fill-empty/increment)
  - Add POST /api/admin/products/{id}:archive endpoint for product archival
  - Add CSV import/export endpoints with filtering support
  - Invalidate caches after mutations: products:featured, products:categories, products:list:*, products:detail:*
  - Purpose: Provide comprehensive API support for accessory product management operations
  - _Leverage: existing admin module structure, existing Hono patterns, existing validation utilities_
  - _Requirements: 10_
  - _Prompt: Role: Backend Developer specializing in REST API design and Hono framework | Task: Extend existing admin API module with new accessory-specific endpoints following requirement 10, including variant generation with exclusions, batch operations with modes, archival functionality, and CSV operations with filtering. Ensure cache invalidation for affected keys | Restrictions: Must maintain existing API compatibility, follow REST conventions, implement proper error handling and validation | Success: All new endpoints function correctly, caches are invalidated, and admin access control is enforced_

- [x] 5. Create dedicated ProductEditPage component
  - File: apps/admin/app/components/ProductEditPage.tsx (new)
  - Create organized sections: Basic Info, Media, Features, Advanced Settings (Note: Specifications section removed per user requirement)
  - Implement featuresMarkdown field with Textarea (BlockNote integration pending - see Task 5d)
  - Purpose: Reusable form component for product editing
  - _Leverage: existing form components, existing validation patterns_
  - _Requirements: 3_
  - _Prompt: Role: React Developer specializing in complex forms | Task: Create ProductEditPage component with organized sections following requirement 3, implementing proper validation and form handling | Restrictions: Must maintain existing product creation flow, ensure mobile responsiveness, handle large forms efficiently | Success: Form sections are well-organized, validation works correctly, component is reusable_

- [x] 5a. Create dedicated route files for product edit pages
  - File: apps/admin/app/routes/dashboard/products_.new.tsx (new), apps/admin/app/routes/dashboard/products_.$productId.edit.tsx (new)
  - Implement React Router routes at /dashboard/products/new and /dashboard/products/{id}/edit
  - Load product data via loader functions using productId from params
  - Render ProductEditPage component with proper props
  - **Note**: Use underscore `_` syntax for nested routes in React Router v7 (e.g., `products_.new.tsx` → `/products/new`)
  - Purpose: Enable dedicated page navigation instead of modal dialogs
  - _Leverage: existing React Router patterns in apps/admin/app/routes/dashboard/, existing loader patterns_
  - _Requirements: 3_
  - _Prompt: Role: React Developer specializing in React Router v7 | Task: Create dedicated route files for product editing following React Router v7 file-based routing conventions with underscore syntax for nested routes, implementing loader functions to fetch product data and render ProductEditPage component on dedicated pages | Restrictions: Follow React Router v7 naming conventions (use _ for nested routes), maintain consistent loader patterns, handle loading states | Success: Routes /dashboard/products/new and /dashboard/products/{id}/edit work correctly, product data loads properly, navigation is smooth_

- [x] 5b. Update ProductManagement to use navigation instead of dialogs
  - File: apps/admin/app/components/ProductManagement.tsx (modify existing)
  - Remove Dialog-related state: isCreateDialogOpen, isEditDialogOpen, selectedProduct
  - Remove Dialog wrapper and DialogContent from render
  - Update "新增產品" button to navigate to /dashboard/products/new
  - Update "編輯" button in table to navigate to /dashboard/products/{id}/edit
  - Purpose: Transition from modal-based to page-based editing flow
  - _Leverage: existing useNavigate hook from react-router, existing button handlers_
  - _Requirements: 3_
  - _Prompt: Role: React Developer specializing in UI refactoring | Task: Refactor ProductManagement component to remove Dialog wrappers and use React Router navigation to dedicated pages instead, maintaining all existing functionality while improving UX | Restrictions: Do not break existing product list display, maintain table functionality, ensure smooth navigation | Success: Product list remains functional, navigation to edit pages works correctly, no Dialog artifacts remain_

- [x] 5c. Update ProductEditPage to work as standalone page with navigation
  - File: apps/admin/app/components/ProductEditPage.tsx (modify existing)
  - Update component to receive productId via props instead of direct product object
  - Implement data fetching logic within component using productId
  - Add navigation logic after successful save (navigate back to /admin/products)
  - Update "返回" button to navigate back to product list
  - Remove onSave and onCancel callback props (use navigation instead)
  - Purpose: Adapt component for standalone page usage instead of dialog context
  - _Leverage: existing useNavigate hook, existing API calls, existing form logic_
  - _Requirements: 3_
  - _Prompt: Role: React Developer | Task: Refactor ProductEditPage to work as a standalone page component with its own data fetching and navigation logic, removing dependency on parent component callbacks | Restrictions: Maintain all existing form functionality, preserve validation logic, ensure proper error handling | Success: Component loads product data independently, saves successfully and navigates back to list, all form features work correctly_

- [ ] 5d. Integrate BlockNote editor for featuresMarkdown
  - File: apps/admin/app/components/ProductEditPage.tsx (modify existing)
  - Replace Textarea with BlockNote editor for featuresMarkdown field
  - Implement markdown serialization/deserialization
  - Add fallback handling for browsers without BlockNote support
  - Add auto-save to localStorage for draft content
  - Purpose: Provide rich text editing experience for product features
  - _Leverage: existing BlockNote editor from blog composer (apps/admin/app/routes/dashboard/blog-composer.tsx), existing editor patterns_
  - _Requirements: 3_
  - _Prompt: Role: React Developer specializing in rich text editors | Task: Integrate BlockNote editor for featuresMarkdown field following existing blog-composer patterns, implementing markdown conversion, auto-save, and graceful fallback | Restrictions: Must work with existing form state management, maintain markdown compatibility, handle large content efficiently | Success: BlockNote editor renders correctly, markdown conversion works both ways, auto-save prevents data loss, fallback to Textarea works when needed_

- [x] 6. Implement VariantMatrixGenerator component
  - File: apps/admin/app/components/VariantMatrixGenerator.tsx (new), apps/admin/app/components/__tests__/VariantMatrixGenerator.test.tsx (new)
  - Create component for automatic variant generation from option combinations
  - Implement exclude functionality for unwanted combinations
  - Add table/card view switching for large matrices
  - Integrate with SKU generation for automatic SKU assignment
  - Purpose: Enable efficient creation of product variants from selected options
  - _Leverage: existing table components, existing form patterns, SKU generation utilities_
  - _Requirements: 4_
  - _Prompt: Role: React Developer specializing in data manipulation and complex UI interactions | Task: Implement VariantMatrixGenerator component following requirement 4 with automatic variant generation, exclusion support, view switching, and SKU integration for efficient accessory product variant management | Restrictions: Must handle large matrices efficiently, provide clear feedback for complex combinations, maintain performance with 100+ variants | Success: Variant generation works for all product types, exclusion functionality prevents unwanted combinations, UI remains responsive with large datasets_

- [x] 7. Build BatchOperationsToolbar component
  - File: apps/admin/app/components/BatchOperationsToolbar.tsx (new), apps/admin/app/components/__tests__/BatchOperationsToolbar.test.tsx (new)
  - Implement batch operations with three modes: overwrite, fill-empty, increment
  - Support pricing updates with differential calculations
  - Add inventory management with stock level operations
  - Include image batch assignment by color/style options
  - Purpose: Provide bulk editing capabilities for efficient accessory product management
  - _Leverage: existing modal patterns, existing form validation, existing batch operation patterns_
  - _Requirements: 5_
  - _Prompt: Role: React Developer specializing in bulk operations and data manipulation | Task: Build BatchOperationsToolbar component implementing three operation modes (overwrite/fill-empty/increment) following requirement 5, supporting pricing differentials, inventory management, and image batch assignment | Restrictions: Must provide clear preview of changes, prevent accidental data loss, handle large selections efficiently | Success: All batch operations work correctly, changes are previewed clearly, operations complete efficiently even with large selections_

- [x] 8. Refactor ProductManagement.tsx to reduce complexity
  - File: apps/admin/app/components/ProductManagement.tsx (modify existing)
  - Extract shared logic into separate utility functions
  - Split large component into smaller focused components
  - Reduce file size to under 500 lines as specified
  - Maintain existing functionality while improving maintainability
  - Purpose: Improve code maintainability and reduce technical debt in product management
  - _Leverage: existing component patterns, existing utility functions, extracted components from previous tasks_
  - _Requirements: 3_
  - _Prompt: Role: Senior React Developer specializing in code refactoring and maintainability | Task: Refactor ProductManagement.tsx following requirement 3 to reduce complexity below 500 lines by extracting utilities and components while maintaining all existing functionality and improving code organization | Restrictions: Must not break existing functionality, maintain backward compatibility, improve rather than degrade user experience | Success: File size reduced below 500 lines, functionality preserved, code is more maintainable and better organized_

- [ ] 9. PDP: Render featuresMarkdown with fallback
  - File: apps/web/src/components/ProductTabs.tsx (modify existing), apps/web/src/components/ProductDetail.tsx (modify if needed)
  - Render Markdown from featuresMarkdown when available; fallback to features[] list otherwise
  - Use a safe Markdown renderer suitable for Astro/React islands
  - Purpose: Ensure rich features content is visible on PDP with backward compatibility
  - _Leverage: existing PDP components and rendering patterns_
  - _Requirements: 2_
  - _Prompt: Role: Frontend Developer | Task: Render product features using Markdown when provided, otherwise use legacy list, ensuring accessibility and SEO | Restrictions: Do not change PDP layout beyond content block; sanitize output | Success: PDP displays rich content when available; regressions avoided_

- [ ] 10. Integrate approval workflow UI components
  - File: apps/admin/app/components/ProductApprovalWorkflow.tsx (new), apps/admin/app/hooks/useProductApproval.ts (new)
  - Implement status transitions: draft → in_review → published → archived
  - Add role-based permissions for editors vs admins
  - Create audit logging for status changes with field-level diffs
  - Integrate with existing product management UI
  - Purpose: Enable structured approval process for accessory product publishing
  - _Leverage: existing permission system, existing status management, existing audit patterns_
  - _Requirements: 7, 9_
  - _Prompt: Role: Full-stack Developer specializing in workflow and permission systems | Task: Integrate approval workflow UI following requirements 7 and 9 with status transitions, role-based permissions, and audit logging for field-level changes in accessory product management | Restrictions: Must respect existing permission system, provide clear status feedback, maintain data integrity during transitions | Success: Approval workflow works seamlessly, permissions are properly enforced, audit trail captures all changes accurately_

- [ ] 11. Implement CSV import/export functionality
  - File: apps/admin/app/components/ProductCsvImport.tsx (new), apps/admin/app/components/ProductCsvExport.tsx (new), apps/admin/app/lib/csv-processor.ts (new)
  - Add export filtering by status, series, and type with timestamped filenames
  - Implement CSV parsing with validation and error reporting
  - Support "skip errors" mode for partial imports
  - Create downloadable error reports with row numbers
  - Purpose: Enable bulk product management through CSV operations
  - _Leverage: existing file upload patterns, existing validation utilities, existing export patterns_
  - _Requirements: 8_
  - _Prompt: Role: Full-stack Developer specializing in data import/export and file processing | Task: Implement comprehensive CSV import/export functionality following requirement 8 with filtering, validation, error reporting, and partial import support for efficient accessory product bulk management | Restrictions: Must handle large files efficiently, provide clear error feedback, maintain data consistency during imports | Success: CSV operations work reliably, error reporting is helpful, large datasets are processed efficiently_

- [ ] 12. Add comprehensive testing coverage
  - File: apps/admin/app/components/__tests__/ProductEditPage.test.tsx (new), apps/admin/app/components/__tests__/VariantMatrixGenerator.test.tsx (new), apps/admin/app/components/__tests__/BatchOperationsToolbar.test.tsx (new), apps/api/src/modules/__tests__/products-accessory.test.ts (new)
  - Write unit tests for all new components and utilities
  - Create integration tests for API endpoints
  - Add end-to-end tests for critical user workflows
  - Ensure test coverage meets project standards
  - Purpose: Validate accessory product management functionality and prevent regressions
  - _Leverage: existing test patterns, existing test utilities, existing testing framework (Vitest)_
  - _Requirements: All_
  - _Prompt: Role: QA Engineer specializing in React component testing and API integration testing | Task: Create comprehensive test coverage for all accessory product management features including unit tests for components, integration tests for APIs, and E2E tests for critical workflows to ensure reliability and prevent regressions | Restrictions: Must achieve adequate test coverage, tests must run in CI/CD pipeline, focus on business logic rather than implementation details | Success: All critical paths tested, tests run reliably, coverage meets project standards, regressions are caught early_

- [ ] 13. Performance optimization and accessibility improvements
  - File: apps/admin/app/components/VariantMatrixGenerator.tsx (modify), apps/admin/app/components/ProductEditPage.tsx (modify), apps/admin/app/lib/sku-generator.ts (modify)
  - Optimize variant matrix rendering for large datasets (100+ variants)
  - Implement virtual scrolling for performance
  - Add keyboard navigation and screen reader support
  - Optimize SKU generation for bulk operations
  - Purpose: Ensure accessory product management scales and is accessible to all users
  - _Leverage: existing performance patterns, existing accessibility utilities, React performance best practices_
  - _Requirements: All_
  - _Prompt: Role: Senior Frontend Developer specializing in performance optimization and accessibility | Task: Optimize accessory product management components for large datasets and improve accessibility following all requirements, implementing virtual scrolling, keyboard navigation, and performance optimizations | Restrictions: Must maintain existing functionality, improve rather than degrade performance, meet WCAG accessibility standards | Success: Large variant matrices render efficiently, keyboard navigation works throughout, screen readers are properly supported, performance benchmarks are met_

- [ ] 14. Documentation and final integration
  - File: docs/admin-accessory-products.md (new), apps/admin/README-accessory-products.md (new)
  - Create comprehensive documentation for accessory product features
  - Update existing admin documentation with new capabilities
  - Perform final integration testing across all components
  - Ensure all acceptance criteria from requirements are met
  - Purpose: Complete the accessory product management implementation with proper documentation
  - _Leverage: existing documentation patterns, existing README structures, testing utilities_
  - _Requirements: All_
  - _Prompt: Role: Technical Writer and Integration Engineer | Task: Complete accessory product management implementation with comprehensive documentation and final integration testing, ensuring all requirements are met and the feature is ready for production use | Restrictions: Must document all features thoroughly, ensure integration works across all components, validate against all acceptance criteria | Success: Documentation is complete and accurate, all components integrate seamlessly, acceptance criteria are validated, feature is production-ready_

- [x] 15. Update shared product types with accessory fields
  - File: packages/types/index-fixed.ts (modify existing)
  - Add optional fields: featuresMarkdown?: string; accessoryType?: 'standalone' | 'accessory' | 'bundle'; parentProductId?: string
  - Purpose: Prevent type drift across API, admin, and web apps
  - _Leverage: existing ProductSchema and related types_
  - _Requirements: 1, 6_
  - _Prompt: Role: TypeScript Developer | Task: Extend shared product types to include accessory-related fields and featuresMarkdown while keeping backward compatibility | Restrictions: Do not break existing consumers; all fields optional | Success: Types compile and match API payloads_

- [ ] 16. Generate and apply database migrations
  - File: packages/db (run scripts)
  - Run: `pnpm -F db db:generate` then apply locally/remote as needed
  - Purpose: Keep database in sync with schema changes via drizzle-kit
  - _Leverage: packages/db/DRIZZLE_BEST_PRACTICES.md_
  - _Requirements: 1
  - _Prompt: Role: Backend Developer | Task: Generate and apply database migrations using drizzle-kit for features_markdown and accessory fields | Restrictions: Do not write manual SQL; validate snapshots | Success: Migration files generated, applied, and snapshots consistent

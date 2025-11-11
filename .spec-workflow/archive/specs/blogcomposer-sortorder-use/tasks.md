# Tasks Document

- [x] 1. Verify and optimize database schema for sort order functionality
  - File: packages/db/schema.ts (verify existing), packages/db/migrations/ (if needed)
  - Use wrangler d1 to inspect actual posts table schema in database
  - Verify existing sortOrder field matches schema.ts definition
  - Add database indexes for efficient three-layer sorting queries
  - Purpose: Ensure database foundation supports sort order operations
  - _Leverage: packages/db/schema.ts, packages/db/client.ts, wrangler d1 commands
  - _Requirements: 1.1, 1.4
  - _Prompt: Role: Database Engineer with expertise in Cloudflare D1 and Drizzle ORM | Task: Use wrangler d1 execute command to inspect the actual posts table schema in the database, verify sortOrder field exists and matches schema.ts, then add composite indexes for three-layer sorting (sort_order = 0, sort_order ASC, updated_at DESC) following requirements 1.1 and 1.4 | Restrictions: Do not modify existing schema unnecessarily, ensure backward compatibility, create migration if indexes are added, use wrangler d1 commands to verify actual database state | Success: Database schema supports sort order operations, indexes improve query performance, existing data remains intact, actual database matches schema definition

- [x] 2. Update API routes to implement three-layer sorting logic
  - File: apps/api/src/routes/posts.ts (modify existing)
  - Modify GET /api/posts endpoint to apply three-layer sorting
  - Add sort order validation to POST/PUT endpoints
  - Purpose: Enable API to return posts in correct sort order
  - _Leverage: apps/api/src/routes/posts.ts, packages/db/schema.ts
  - _Requirements: 5.1, 5.2, 5.3
  - _Prompt: Role: Backend API Developer with expertise in Hono and database queries | Task: Update posts API routes to implement three-layer sorting logic (ORDER BY sort_order = 0, sort_order ASC, updated_at DESC) and add sort order validation following requirements 5.1, 5.2, and 5.3 | Restrictions: Maintain existing API contract, do not break existing functionality, ensure proper error handling for invalid sort orders | Success: API returns posts in correct order, sort order validation prevents invalid data, existing endpoints remain functional

- [x] 3. Create batch sort order update API endpoint
  - File: apps/api/src/routes/posts.ts (add new endpoint)
  - Implement POST /api/posts/batch-sort-order endpoint
  - Add transaction handling for atomic updates
  - Purpose: Support drag-and-drop reordering operations
  - _Leverage: apps/api/src/routes/posts.ts, packages/db/client.ts
  - _Requirements: 5.4
  - _Prompt: Role: Backend API Developer with expertise in batch operations and transactions | Task: Create new POST /api/posts/batch-sort-order endpoint to handle drag-and-drop reordering with atomic transaction updates following requirement 5.4 | Restrictions: Must use database transactions for consistency, validate all sort order values, handle concurrent update conflicts | Success: Batch updates work atomically, drag-and-drop operations are reliable, proper error handling for conflicts

- [x] 4. Create SortOrderField component for blog composer
  - File: apps/admin/app/components/SortOrderField.tsx (new)
  - Implement form field with validation for sort order input
  - Add user-friendly display for sort order = 0 as "自動排序"
  - Purpose: Provide UI for manual sort order input in blog composer
  - _Leverage: packages/ui/, apps/admin/app/components/BlogComposer.tsx
  - _Requirements: 2.1, 2.2, 4.1, 4.2
  - _Prompt: Role: React Frontend Developer with expertise in form components and validation | Task: Create SortOrderField component with numeric input validation, user-friendly display for sort_order = 0, and proper error handling following requirements 2.1, 2.2, 4.1, and 4.2 | Restrictions: Must integrate with existing form validation, follow UI component patterns, provide clear user feedback | Success: Component validates input correctly, displays sort order intuitively, integrates seamlessly with blog composer form

- [x] 5. Integrate SortOrderField into BlogComposer component
  - File: apps/admin/app/components/BlogComposer.tsx (modify existing)
  - Add SortOrderField to the basic information section
  - Update form schema to include sort order validation
  - Purpose: Enable sort order input in blog post creation/editing
  - _Leverage: apps/admin/app/components/BlogComposer.tsx, apps/admin/app/components/SortOrderField.tsx
  - _Requirements: 2.3, 2.4
  - _Prompt: Role: React Frontend Developer with expertise in form integration and Zod validation | Task: Integrate SortOrderField into BlogComposer form, update Zod schema for sort order validation, and handle form submission with sort order data following requirements 2.3 and 2.4 | Restrictions: Do not break existing form functionality, maintain form validation flow, ensure sort order saves correctly | Success: Sort order field appears in blog composer, form validates sort order input, data saves to database properly

- [x] 6. Add sort order column to PostManagement table
  - File: apps/admin/app/components/PostManagement.tsx (modify existing)
  - Add sort order column to display current sort order values
  - Show "自動排序" for sort_order = 0 values
  - Purpose: Display current sort order status in admin interface
  - _Leverage: apps/admin/app/components/PostManagement.tsx, @tanstack/react-table
  - _Requirements: 3.4, 3.5
  - _Prompt: Role: React Frontend Developer with expertise in TanStack Table | Task: Add sort order column to PostManagement table displaying current values with user-friendly labels for sort_order = 0 following requirements 3.4 and 3.5 | Restrictions: Do not break existing table functionality, maintain table performance, follow existing column patterns | Success: Sort order column displays correctly, table remains performant, users can see current sort order values

- [x] 7. Create DragHandle component for dnd-kit integration
  - File: apps/admin/app/components/DragHandle.tsx (new)
  - Implement visual drag handle with grip icon
  - Add dnd-kit listeners and accessibility attributes
  - Purpose: Provide visual drag activation point for table rows
  - _Leverage: @dnd-kit/core, packages/ui/
  - _Requirements: 5.1, 5.2, 5.3
  - _Prompt: Role: React Frontend Developer with expertise in dnd-kit and accessibility | Task: Create DragHandle component with visual grip icon, dnd-kit integration, and proper ARIA attributes following requirements 5.1, 5.2, and 5.3 | Restrictions: Must work with dnd-kit's drag activation, provide proper accessibility, follow existing UI patterns | Success: Drag handle is visually clear, integrates with dnd-kit properly, accessible for keyboard navigation

- [x] 8. Integrate dnd-kit into PostManagement component
  - File: apps/admin/app/components/PostManagement.tsx (modify existing)
  - Add dnd-kit providers and sensors to table
  - Implement drag start/end event handlers
  - Add logic to only enable drag-and-drop when table is in default three-layer sorting
  - Purpose: Enable drag-and-drop functionality for table rows with proper state management
  - _Leverage: apps/admin/app/components/PostManagement.tsx, @dnd-kit/core, @dnd-kit/sortable
  - _Requirements: 5.4, 5.5, 5.6
  - _Prompt: Role: React Frontend Developer with expertise in dnd-kit integration and state management | Task: Integrate dnd-kit into PostManagement table with proper providers, sensors, and event handling for drag-and-drop reordering, ensuring drag-and-drop is only enabled when table is in default three-layer sorting state following requirements 5.4, 5.5, and 5.6 | Restrictions: Do not break existing table functionality, maintain table sorting and filtering, disable drag-and-drop when user sorts by other columns, handle drag conflicts properly | Success: Drag and drop works smoothly when in default sorting, is disabled for other sort states, table maintains other functionality, visual feedback is clear during drag operations

- [x] 9. Implement sort order update logic for drag-and-drop
  - File: apps/admin/app/components/PostManagement.tsx (modify existing)
  - Add logic to calculate new sort orders after drag operations
  - Implement optimistic UI updates with error handling
  - Purpose: Update sort orders when posts are reordered via drag-and-drop
  - _Leverage: apps/admin/app/components/PostManagement.tsx, apps/api/src/routes/posts.ts
  - _Requirements: 5.4, 5.5, 5.6
  - _Prompt: Role: React Frontend Developer with expertise in state management and API integration | Task: Implement sort order recalculation logic after drag operations, add optimistic updates with rollback on errors, and call batch sort order API following requirements 5.4, 5.5, and 5.6 | Restrictions: Must handle concurrent updates properly, provide user feedback for errors, maintain data consistency | Success: Drag operations update sort orders correctly, UI provides feedback, errors are handled gracefully with rollback

- [x] 10. Add DragHandle to table rows conditionally
  - File: apps/admin/app/components/PostManagement.tsx (modify existing)
  - Show DragHandle only for posts with sort_order > 0
  - Add visual indicators for draggable vs non-draggable rows
  - Purpose: Provide clear drag activation points for sortable posts
  - _Leverage: apps/admin/app/components/PostManagement.tsx, apps/admin/app/components/DragHandle.tsx
  - _Requirements: 5.1, 5.2
  - _Prompt: Role: React Frontend Developer with expertise in conditional rendering and UI states | Task: Add DragHandle component to table rows conditionally for posts with sort_order > 0, with clear visual indicators following requirements 5.1 and 5.2 | Restrictions: Only show drag handles for sortable posts, maintain table layout, provide clear visual hierarchy | Success: Drag handles appear only where appropriate, UI is clear about draggable items, table layout remains intact

- [x] 11. Update PostManagement sorting to use three-layer logic
  - File: apps/admin/app/components/PostManagement.tsx (modify existing)
  - Modify table sorting to use three-layer sorting by default
  - Ensure sorting works with drag-and-drop operations
  - Purpose: Display posts in correct order according to business logic
  - _Leverage: apps/admin/app/components/PostManagement.tsx, @tanstack/react-table
  - _Requirements: 3.1, 3.2, 3.3
  - _Prompt: Role: React Frontend Developer with expertise in table sorting and data manipulation | Task: Update PostManagement table to use three-layer sorting (sort_order = 0, sort_order ASC, updated_at DESC) as default, ensuring compatibility with drag-and-drop following requirements 3.1, 3.2, and 3.3 | Restrictions: Maintain existing filter and search functionality, ensure sorting works with drag operations, preserve user sorting preferences | Success: Table displays posts in correct order, sorting works with drag-and-drop, existing functionality remains intact

- [x] 12. Add comprehensive error handling and user feedback
  - File: apps/admin/app/components/PostManagement.tsx (modify existing)
  - Add error handling for drag operations and API failures
  - Implement loading states and success notifications
  - Purpose: Provide clear user feedback for all operations
  - _Leverage: apps/admin/app/components/PostManagement.tsx, sonner (toast library)
  - _Requirements: All error handling requirements
  - _Prompt: Role: React Frontend Developer with expertise in error handling and user experience | Task: Add comprehensive error handling for drag operations, API failures, and loading states with clear user notifications following all error handling requirements | Restrictions: Provide helpful error messages, maintain optimistic updates, don't block user interactions unnecessarily | Success: Users receive clear feedback for all operations, errors are handled gracefully, loading states are appropriate

- [x] 13. Create unit tests for SortOrderField component
  - File: apps/admin/app/components/SortOrderField.test.tsx (new)
  - Test input validation and display logic
  - Test error states and user interactions
  - Purpose: Ensure SortOrderField component reliability
  - _Leverage: apps/admin/app/components/SortOrderField.tsx, vitest
  - _Requirements: 2.1, 2.2, 4.1, 4.2
  - _Prompt: Role: QA Engineer with expertise in React component testing | Task: Create comprehensive unit tests for SortOrderField component covering validation, display logic, and user interactions following requirements 2.1, 2.2, 4.1, and 4.2 | Restrictions: Test component in isolation, cover edge cases, ensure tests are maintainable | Success: Component behavior is well-tested, edge cases covered, tests provide confidence in component reliability

- [x] 14. Create unit tests for DragHandle component
  - File: apps/admin/app/components/DragHandle.test.tsx (new)
  - Test dnd-kit integration and accessibility features
  - Test visual states and user interactions
  - Purpose: Ensure DragHandle component works correctly with dnd-kit
  - _Leverage: apps/admin/app/components/DragHandle.tsx, vitest, @testing-library/react
  - _Requirements: 5.1, 5.2, 5.3
  - _Prompt: Role: QA Engineer with expertise in accessibility testing and dnd-kit | Task: Create unit tests for DragHandle component covering dnd-kit integration, accessibility features, and visual states following requirements 5.1, 5.2, and 5.3 | Restrictions: Mock dnd-kit dependencies appropriately, test accessibility compliance, ensure tests are reliable | Success: DragHandle integrates properly with dnd-kit, accessibility features work correctly, component is thoroughly tested

- [x] 15. Create integration tests for drag-and-drop functionality
  - File: apps/admin/app/components/PostManagement.test.tsx (modify/add)
  - Test complete drag-and-drop workflows
  - Test sort order updates and API integration
  - Purpose: Ensure drag-and-drop feature works end-to-end
  - _Leverage: apps/admin/app/components/PostManagement.tsx, vitest, @testing-library/react
  - _Requirements: 5.4, 5.5, 5.6
  - _Prompt: Role: QA Engineer with expertise in integration testing and user workflows | Task: Create integration tests for drag-and-drop functionality covering complete user workflows, sort order updates, and API integration following requirements 5.4, 5.5, and 5.6 | Restrictions: Test realistic user scenarios, mock API calls appropriately, ensure tests are maintainable | Success: Drag-and-drop workflows work correctly, integration points are tested, user experience is validated

- [x] 16. Create API integration tests for sort order endpoints
  - File: apps/api/src/routes/posts.test.ts (modify/add)
  - Test three-layer sorting API responses
  - Test batch sort order update endpoint
  - Purpose: Ensure API endpoints work correctly with sort order functionality
  - _Leverage: apps/api/src/routes/posts.ts, vitest
  - _Requirements: 5.1, 5.2, 5.3, 5.4
  - _Prompt: Role: QA Engineer with expertise in API testing and database integration | Task: Create API integration tests for sort order functionality covering three-layer sorting responses and batch update operations following requirements 5.1, 5.2, 5.3, and 5.4 | Restrictions: Test with real database operations, ensure data consistency, cover error scenarios | Success: API endpoints return correct data, sort order operations work reliably, error handling is comprehensive

- [x] 17. Perform end-to-end testing and final integration
  - File: Multiple files (integration testing)
  - Test complete user workflows from blog composer to drag-and-drop
  - Verify data consistency across all components
  - Purpose: Ensure complete feature works correctly end-to-end
  - _Leverage: All implemented components and API endpoints
  - _Requirements: All requirements
  - _Prompt: Role: QA Engineer with expertise in end-to-end testing and system integration | Task: Perform comprehensive end-to-end testing of the complete sort order feature covering all user workflows, data consistency, and integration points following all requirements | Restrictions: Test in realistic environments, verify cross-browser compatibility, ensure performance meets requirements | Success: Complete feature works correctly, all user workflows succeed, system is ready for production

- [x] 18. Update documentation and cleanup
  - File: README files, inline code comments
  - Add documentation for new sort order functionality
  - Clean up temporary code and add final comments
  - Purpose: Ensure codebase is well-documented and maintainable
  - _Leverage: All modified files
  - _Requirements: All requirements
  - _Prompt: Role: Technical Writer and Senior Developer with expertise in documentation | Task: Update all relevant documentation, add comprehensive code comments, and perform final cleanup following all requirements | Restrictions: Maintain existing documentation standards, ensure comments are helpful and accurate, do not leave debug code | Success: Codebase is well-documented, new functionality is clearly explained, code is clean and maintainable

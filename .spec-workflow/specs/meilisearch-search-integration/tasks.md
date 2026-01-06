# Meilisearch Search Integration Tasks

## Phase 0: Shared Definitions

- [x] 0.1 Define shared search types
  - File: packages/types/src/search.ts
  - Define SearchDocument interface (products, posts, pages)
  - Define SearchConfig interface
  - Define SearchAnalyticsEvent interface
  - Purpose: Ensure type safety across frontend, backend, and admin
  - _Requirements: Design Document Data Models_
  - _Prompt: Role: TypeScript Developer | Task: Create shared TypeScript interfaces for search documents and configuration | Restrictions: Must be exported from packages/types, follow existing type patterns | Success: Types are available to all apps_

## Phase 1: Backend & Admin Configuration

- [x] 1.1 Create SearchModule in apps/api/src/modules/search.ts
  - File: apps/api/src/modules/search.ts
  - Implement SearchService class with MeiliSearch client initialization
  - Add methods: saveConfig, getConfig, reindexAll, indexDocument, deleteDocument
  - Purpose: Provide centralized search service for MeiliSearch operations
  - _Leverage: apps/api/src/lib/storage.ts for configuration storage (KV/D1 abstraction), existing module patterns_
  - _Requirements: PRD Section 3.3, Security Requirements_
  - _Prompt: Role: Backend Developer specializing in search engines and API design | Task: Create SearchModule with MeiliSearch client integration, implementing configuration management and indexing operations following PRD architecture | Restrictions: Use secure credential storage, implement proper error handling, follow existing module patterns | Success: SearchModule initializes MeiliSearch client correctly, configuration is securely stored, all methods work with proper error handling_

- [x] 1.2 Add search configuration endpoints
  - File: apps/api/src/routes/search-config.ts
  - Implement POST /api/search/config for saving host and keys
  - Implement GET /api/search/config for retrieving configuration
  - Add input validation and authentication middleware
  - Purpose: Enable admin configuration of MeiliSearch settings
  - _Leverage: apps/api/src/middleware/auth.ts, existing route patterns_
  - _Requirements: PRD Section 3.3, Security Requirements_
  - _Prompt: Role: API Developer with expertise in secure configuration endpoints | Task: Implement search configuration endpoints with proper authentication and validation following existing API patterns | Restrictions: Must use admin authentication, validate all inputs, store credentials securely | Success: Configuration endpoints work correctly with proper security, admin can save/retrieve MeiliSearch settings_

- [x] 1.3 Add reindex endpoint
  - File: apps/api/src/routes/search-reindex.ts
  - Implement POST /api/search/reindex for full content reindexing
  - Add progress tracking and error handling
  - Purpose: Allow admins to trigger full search index rebuild
  - _Leverage: apps/api/src/modules/search.ts, existing batch operation patterns_
  - _Requirements: PRD Section 3.3, Phase 1_
  - _Prompt: Role: Backend Developer specializing in batch operations and indexing | Task: Implement reindex endpoint that fetches all content and rebuilds MeiliSearch indexes with progress tracking | Restrictions: Must handle large datasets efficiently, provide progress feedback, implement proper error recovery | Success: Reindex operation completes successfully, all content is indexed, progress is trackable_

- [x] 1.4 Update admin settings page
  - File: apps/admin/app/routes/dashboard/settings.tsx
  - Add "Search Configuration" section with form fields
  - Include Host URL and Master Key inputs
  - Add "Save Configuration" and "Re-index All" buttons
  - Purpose: Provide admin UI for MeiliSearch configuration
  - _Leverage: existing settings page patterns, apps/admin/app/services/api.ts_
  - _Requirements: PRD Section 3.2, Phase 1_
  - _Prompt: Role: React Developer with expertise in admin interfaces | Task: Add search configuration section to admin settings with form validation and API integration | Restrictions: Follow existing UI patterns, implement proper loading states, handle errors gracefully | Success: Admin can configure MeiliSearch settings through UI, configuration is saved and reindex can be triggered_

## Phase 2: Data Syncing

- [x] 2.1 Create search sync utilities
  - File: apps/api/src/utils/searchSync.ts
  - Implement document transformation functions for products/posts/pages
  - Add content extraction and sanitization utilities
  - Purpose: Prepare content for MeiliSearch indexing
  - _Leverage: existing content processing utilities, data structure from PRD Section 5_
  - _Requirements: PRD Section 5, Data Structure_
  - _Prompt: Role: Data Engineer specializing in content processing and search indexing | Task: Create utilities to transform content into MeiliSearch document format with proper field mapping | Restrictions: Must handle HTML content sanitization, maintain data integrity, follow schema requirements | Success: Content is properly transformed for indexing, all required fields are populated, HTML is sanitized_

- [x] 2.2 Add sync hooks to products module
  - File: apps/api/src/modules/products.ts (modify existing)
  - Inject SearchModule dependency
  - Add indexDocument calls to create/update operations
  - Add deleteDocument calls to delete operations
  - Purpose: Automatically sync product changes to search index
  - _Leverage: apps/api/src/modules/search.ts, existing product CRUD patterns_
  - _Requirements: PRD Section 3.3, Phase 2_
  - _Prompt: Role: Backend Developer with expertise in data synchronization | Task: Integrate search indexing into product CRUD operations with proper error handling | Restrictions: Must not block main operations, handle sync failures gracefully, maintain transaction consistency | Success: Product changes are automatically indexed, sync operations don't interfere with main business logic_

- [x] 2.3 Add sync hooks to posts module
  - File: apps/api/src/modules/posts.ts (modify existing)
  - Inject SearchModule dependency
  - Add indexDocument calls to create/update operations
  - Add deleteDocument calls to delete operations
  - Purpose: Automatically sync blog post changes to search index
  - _Leverage: apps/api/src/modules/search.ts, existing post CRUD patterns_
  - _Requirements: PRD Section 3.3, Phase 2_
  - _Prompt: Role: Backend Developer with expertise in content management systems | Task: Integrate search indexing into post CRUD operations ensuring draft posts are not indexed | Restrictions: Must check published status, handle content updates efficiently, maintain sync reliability | Success: Post changes are automatically indexed when published, drafts are excluded from search_

- [x] 2.4 Add sync hooks to pages module
  - File: apps/api/src/modules/pages.ts (modify existing)
  - Inject SearchModule dependency
  - Add indexDocument calls to create/update operations
  - Add deleteDocument calls to delete operations
  - Purpose: Automatically sync page changes to search index
  - _Leverage: apps/api/src/modules/search.ts, existing page CRUD patterns_
  - _Requirements: PRD Section 3.3, Phase 2_
  - _Prompt: Role: Backend Developer with expertise in CMS and static content | Task: Integrate search indexing into page CRUD operations with proper content extraction | Restrictions: Must handle page content properly, maintain sync performance, ensure published pages only | Success: Page changes are automatically indexed, content is properly extracted and sanitized_

## Phase 3: Frontend Integration

- [x] 3.1 Create MeiliSearch service
  - File: apps/web/src/services/meiliSearchService.ts
  - Initialize MeiliSearch client with public search key
  - Implement search methods for unified content search
  - Add error handling and fallback logic
  - Purpose: Provide frontend interface to MeiliSearch
  - _Leverage: existing service patterns, PRD Section 3.1_
  - _Requirements: PRD Section 3.1, Frontend Architecture_
  - _Prompt: Role: Frontend Developer specializing in search interfaces | Task: Create MeiliSearch service with client initialization and search methods following existing patterns | Restrictions: Use public search key only, implement graceful degradation, maintain existing service interface | Success: MeiliSearch client works correctly, search methods return proper results, errors are handled gracefully_

- [x] 3.2 Update search store
  - File: apps/web/src/stores/searchStore.ts (modify existing)
  - Update state management for MeiliSearch results
  - Add loading states and error handling
  - Maintain compatibility with existing SearchModal interface
  - Purpose: Integrate MeiliSearch results into frontend state
  - _Leverage: existing store patterns, apps/web/src/services/meiliSearchService.ts_
  - _Requirements: PRD Section 3.1, Phase 3_
  - _Prompt: Role: Frontend Developer with expertise in state management | Task: Update search store to handle MeiliSearch results while maintaining existing interface | Restrictions: Must preserve existing API, add proper loading states, handle search errors appropriately | Success: Store integrates MeiliSearch seamlessly, existing components work unchanged, user experience is maintained_

- [x] 3.3 Update search service interface
  - File: apps/web/src/services/searchService.ts (modify existing)
  - Replace fetchUnifiedSearch implementation with MeiliSearch
  - Maintain existing method signatures and return types
  - Add MeiliSearch-specific features (facets, highlighting)
  - Purpose: Upgrade search functionality with MeiliSearch performance
  - _Leverage: apps/web/src/services/meiliSearchService.ts, existing search patterns_
  - _Requirements: PRD Section 3.1, Phase 3_
  - _Prompt: Role: Frontend Developer specializing in API integration | Task: Replace search implementation with MeiliSearch while maintaining backward compatibility | Restrictions: Must keep existing interface, add MeiliSearch features progressively, ensure no breaking changes | Success: Search service uses MeiliSearch internally, existing components work seamlessly, new features are available_

- [x] 3.4 Add search key endpoint
  - File: apps/api/src/routes/search-keys.ts
  - Implement GET /api/search/keys for public search key
  - Add caching and security validation
  - Purpose: Provide frontend with MeiliSearch public key
  - _Leverage: apps/api/src/lib/cache.ts, existing route patterns_
  - _Requirements: PRD Section 3.1, Security_
  - _Prompt: Role: API Developer with expertise in key management | Task: Implement secure endpoint for public search key distribution with proper caching | Restrictions: Must validate requests, cache appropriately, never expose master key | Success: Frontend can securely retrieve public search key, endpoint is properly secured and cached_

- [x] 3.5 Implement search analytics
  - File: apps/api/src/routes/analytics.ts & apps/web/src/services/analyticsService.ts
  - Implement POST /api/analytics/search for logging search events
  - Update frontend to track queries and clicks
  - Purpose: Track search usage and performance
  - _Requirements: Req 4, Design Document Analytics Service_
  - _Prompt: Role: Full Stack Developer | Task: Implement search analytics logging endpoint and frontend tracking | Restrictions: Low latency, privacy-focused logging | Success: Search events are logged to database/KV_

## Testing & Validation

- [x] 4.1 Create search integration tests
  - File: apps/api/src/modules/search.test.ts
  - Test SearchModule methods with mocked MeiliSearch
  - Test error handling and configuration management
  - Purpose: Ensure search module reliability
  - _Leverage: existing test patterns, vitest framework_
  - _Requirements: All search functionality_
  - _Prompt: Role: QA Engineer specializing in integration testing | Task: Create comprehensive tests for SearchModule with proper mocking and error scenarios | Restrictions: Must mock external MeiliSearch API, test all methods thoroughly, maintain test isolation | Success: All search operations are tested, error cases covered, tests run reliably_

- [x] 4.2 Create frontend search tests
  - File: apps/web/src/services/meiliSearchService.test.ts
  - Test MeiliSearch service methods
  - Test error handling and fallback behavior
  - Purpose: Ensure frontend search reliability
  - _Leverage: existing test patterns, vitest framework_
  - _Requirements: Frontend search functionality_
  - _Prompt: Role: QA Engineer specializing in frontend testing | Task: Create tests for MeiliSearch service covering all methods and error scenarios | Restrictions: Must mock MeiliSearch client, test service interface thoroughly, ensure proper error handling | Success: Frontend search service is fully tested, all edge cases covered, tests validate user experience_

- [x] 4.3 Test end-to-end search flow
  - File: apps/web/e2e/search.e2e.test.ts
  - Test complete search user journey
  - Verify MeiliSearch integration works end-to-end
  - Purpose: Validate complete search functionality
  - _Leverage: playwright framework, existing e2e patterns_
  - _Requirements: All requirements from requirements.md_
  - _Prompt: Role: QA Engineer specializing in E2E testing | Task: Create comprehensive E2E tests covering the complete search user journey with MeiliSearch | Restrictions: Must test real user interactions, verify performance requirements, ensure accessibility | Success: Complete search flow works correctly, performance meets requirements, user experience is validated_

## Final Integration & Deployment

- [x] 5.1 Update documentation
  - File: README.md sections
  - Document MeiliSearch configuration and setup
  - Update deployment instructions
  - Purpose: Enable proper system setup and maintenance
  - _Leverage: existing documentation patterns_
  - _Requirements: All phases_
  - _Prompt: Role: Technical Writer with expertise in developer documentation | Task: Update all relevant documentation with MeiliSearch setup and configuration details | Restrictions: Must be clear and comprehensive, include troubleshooting, maintain existing documentation standards | Success: Documentation is complete and accurate, developers can set up and maintain MeiliSearch integration_

- [x] 5.2 Perform initial reindex
  - Manual task: Run full reindex after deployment
  - Verify all content is indexed correctly
  - Test search functionality with real data
  - Purpose: Ensure search index is populated and working
  - _Requirements: Phase 1, Phase 2_
  - _Prompt: Role: DevOps Engineer with expertise in data migration | Task: Execute initial reindex and validate search functionality with production data | Restrictions: Must verify data integrity, test search performance, ensure no data loss | Success: All content is searchable, search performance meets requirements, no data inconsistencies_

- [x] 5.3 Monitor and optimize
  - Set up search performance monitoring
  - Configure alerts for search failures
  - Optimize MeiliSearch configuration as needed
  - Purpose: Ensure ongoing search reliability and performance
  - _Leverage: existing monitoring patterns_
  - _Requirements: Non-functional requirements_
  - _Prompt: Role: Site Reliability Engineer with expertise in search engine optimization | Task: Set up monitoring and optimization for MeiliSearch integration ensuring reliability and performance | Restrictions: Must meet NFRs, implement proper alerting, optimize for cost and performance | Success: Search is monitored effectively, performance is optimized, system is reliable and cost-effective_
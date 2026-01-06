# Requirements Document

## Introduction

The Blog Composer Sort Order Use feature enhances the blog management system by implementing sort order functionality for blog posts. This feature allows content creators to control the display order of blog posts in the admin interface and potentially on the frontend, improving content organization and presentation flexibility. The implementation will add sort order controls to the blog composer interface and update the database schema to support post ordering.

## Alignment with Product Vision

This feature supports Black Living's e-commerce platform goals by:
- **Enhancing Content Management**: Providing better organization tools for content creators to manage blog post presentation
- **Improving User Experience**: Allowing logical ordering of content for better navigation and discovery
- **Supporting Content Strategy**: Enabling featured content placement and strategic content positioning
- **Maintaining Performance**: Using efficient database queries for sorted content retrieval

## Requirements

### Requirement 1: Sort Order Database Schema

**User Story:** As a developer, I want sort order data to be properly stored in the database, so that blog post ordering persists and can be retrieved for display.

#### Acceptance Criteria

1. WHEN the posts table is extended THEN it SHALL include a sort_order column with INTEGER type and default value 0
2. WHEN posts are created/updated THEN sort_order SHALL be validated as a non-negative integer
3. WHEN posts are retrieved THEN sort_order SHALL be included in API responses for admin operations
4. WHEN existing posts are migrated THEN they SHALL default to sort_order = 0

### Requirement 2: Blog Composer Sort Order Controls

**User Story:** As a content creator, I want to set sort order values for blog posts, so that I can control their display sequence in the admin interface.

#### Acceptance Criteria

1. WHEN I access the blog composer THEN I SHALL see a "排序順序" (Sort Order) field in the basic information section
2. WHEN I enter a sort order value THEN it SHALL accept numeric input with validation (0 or greater)
3. WHEN I save the post THEN the sort order SHALL be stored in the database
4. WHEN I view the posts list THEN posts SHALL be sorted using three-layer sorting: `(sort_order = 0)` ASC, `sort_order` ASC, `updated_at` DESC

### Requirement 3: Admin Posts List Sorting

**User Story:** As a content administrator, I want to see blog posts sorted by their sort order in the admin interface, so that I can easily manage content positioning.

#### Acceptance Criteria

1. WHEN I view the posts list in admin THEN posts SHALL be ordered using three-layer sorting: `(sort_order = 0)` ASC, `sort_order` ASC, `updated_at` DESC
2. WHEN sort_order = 0 THEN posts SHALL appear at the end of the sorted list (after all explicitly ordered posts)
3. WHEN multiple posts have the same sort_order THEN they SHALL be ordered by updated_at (newest first)
4. WHEN I filter or search posts THEN the sort order SHALL be maintained within filtered results
5. WHEN posts have sort_order > 0 THEN they SHALL be ordered numerically ascending (1, 2, 3...)

### Requirement 4: Sort Order Validation and Constraints

**User Story:** As a content creator, I want sort order input to be validated, so that I can ensure proper ordering values are entered.

#### Acceptance Criteria

1. WHEN I enter a sort order value THEN it SHALL only accept non-negative integers (0, 1, 2, ...)
2. WHEN I enter invalid input (negative numbers, decimals, text) THEN validation SHALL show an error message
3. WHEN I leave the field empty THEN it SHALL default to 0
4. WHEN I enter a very large number THEN it SHALL be accepted (no upper limit)

### Requirement 5: Drag & Drop Sorting Interface

**User Story:** As a content administrator, I want to reorder blog posts using drag and drop, so that I can easily set custom sort order values without manual number entry.

#### Acceptance Criteria

1. WHEN I view the posts list in admin THEN I SHALL see drag handles on posts with sort_order > 0
2. WHEN I drag and drop a post to reorder THEN the sort_order values SHALL be automatically updated (1, 2, 3...)
3. WHEN I drag a post from sort_order = 0 to an ordered position THEN it SHALL be assigned the appropriate sort_order value
4. WHEN I drag a post from an ordered position to the end THEN its sort_order SHALL be set to 0
5. WHEN drag and drop operation completes THEN the changes SHALL be saved to the database
6. WHEN drag and drop fails THEN the UI SHALL revert to the previous state with error notification

### Requirement 6: Frontend API Integration

**User Story:** As a frontend developer, I want the API to return properly sorted blog posts, so that the admin interface displays posts in the correct order.

#### Acceptance Criteria

1. WHEN the admin posts API is called THEN it SHALL return posts sorted using three-layer sorting: `(sort_order = 0)` ASC, `sort_order` ASC, `updated_at` DESC
2. WHEN posts have the same sort_order THEN they SHALL be sorted by updated_at DESC (newest first)
3. WHEN sort_order = 0 THEN those posts SHALL appear after all explicitly ordered posts (sort_order > 0)
4. WHEN the API response includes sort_order THEN it SHALL be included in the post data
5. WHEN filtering is applied THEN the three-layer sorting SHALL be maintained within filtered results

## Non-Functional Requirements

### Code Architecture and Modularity
- **Single Responsibility Principle**: Sort order logic shall be separated from core post functionality
- **Modular Design**: Sort order features shall be reusable across different admin interfaces
- **Dependency Management**: Sort order shall not impact existing post operations
- **Clear Interfaces**: Sort order props shall be clearly typed and documented

### Performance
- Sort order queries shall not impact page load times (< 2 seconds target)
- Database indexes shall be added for efficient sorting operations
- API responses shall maintain existing performance benchmarks

### Security
- Sort order input shall be validated server-side to prevent injection attacks
- Database fields shall have appropriate constraints to prevent invalid data
- API endpoints shall validate sort order parameters before processing

### Reliability
- Sort order settings shall survive post updates without data loss
- Invalid sort order configurations shall fallback to safe defaults (sort_order = 0)
- Database migrations shall be backward compatible

### Usability
- Sort order field shall have clear labeling and helpful placeholder text
- Validation errors shall be displayed inline with clear error messages
- Default sort order (0) shall be clearly indicated as "自動排序" (Auto Sort)
- Sort order shall work consistently across different admin views

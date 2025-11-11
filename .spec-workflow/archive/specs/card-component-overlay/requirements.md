# Requirements Document

## Introduction

The Card Component Overlay feature enhances the BlogPostCard component with configurable text and gradient overlays. This feature allows content creators to add compelling overlay text directly on blog post card images, improving visual hierarchy and user engagement. The overlay system supports customizable text positioning, gradient backgrounds, and responsive design while maintaining the existing card layout and functionality.

## Alignment with Product Vision

This feature supports Black Living's e-commerce platform goals by:
- **Enhancing Content Marketing**: Improving blog post visual appeal to drive higher engagement and conversion rates
- **Supporting Content Strategy**: Enabling more compelling content presentation for interior design and product showcase articles
- **Maintaining Performance**: Using efficient CSS-based overlays without impacting page load times
- **Ensuring Accessibility**: Implementing proper contrast ratios and keyboard navigation support

## Requirements

### Requirement 1: Overlay Text Management

**User Story:** As a content creator, I want to add custom overlay text to blog post cards, so that I can create more engaging and visually compelling content presentations.

#### Acceptance Criteria

1. WHEN I access the blog composer THEN I SHALL see an "圖片疊加文字" (Image Overlay Text) section in the sidebar
2. WHEN I enable overlay text THEN I SHALL be able to input title (max 50 chars), subtitle (max 100 chars), and CTA text (max 20 chars)
3. WHEN I select overlay placement THEN I SHALL choose from bottom-left, bottom-right, top-left, or center positions
4. WHEN I save the post THEN the overlay settings SHALL be stored in the database

### Requirement 2: Overlay Gradient Control

**User Story:** As a content creator, I want to control gradient backgrounds for overlay text, so that I can ensure proper text contrast and visual appeal.

#### Acceptance Criteria

1. WHEN I enable overlay text THEN I SHALL have the option to enable/disable gradient background (default: enabled)
2. WHEN gradient is enabled THEN I SHALL select from predefined gradient directions (t, tr, r, br, b, bl, l, tl)
3. WHEN I save the post THEN the gradient settings SHALL be stored alongside overlay text settings

### Requirement 3: Frontend Overlay Rendering

**User Story:** As a website visitor, I want to see overlay text on blog post cards when configured, so that I can be drawn to compelling content presentations.

#### Acceptance Criteria

1. WHEN a blog post has overlay enabled THEN the BlogPostCard SHALL render overlay text on the image
2. WHEN overlay is positioned THEN the text SHALL appear at the specified location (bottom-left, bottom-right, top-left, center)
3. WHEN gradient is enabled THEN a dark gradient SHALL appear behind the text for contrast
4. WHEN I view on mobile THEN the overlay SHALL maintain proper spacing and readability

### Requirement 4: Responsive Design Maintenance

**User Story:** As a website visitor, I want overlay text to display properly on all devices, so that I have a consistent experience across screen sizes.

#### Acceptance Criteria

1. WHEN I view blog cards on desktop THEN overlay SHALL use desktop padding (16-20px)
2. WHEN I view blog cards on mobile THEN overlay SHALL use mobile padding (12-16px)
3. WHEN text exceeds limits THEN it SHALL be truncated with ellipsis (title: 2 lines, subtitle: 2 lines)
4. WHEN image aspect ratio changes THEN overlay positioning SHALL remain consistent

### Requirement 5: Database Schema Extension

**User Story:** As a developer, I want overlay data to be properly stored in the database, so that overlay settings persist and can be retrieved for editing.

#### Acceptance Criteria

1. WHEN the posts table is extended THEN it SHALL include overlay_enabled, overlay_title, overlay_subtitle, overlay_placement, overlay_cta_text, overlay_gradient_enabled, overlay_gradient_direction columns
2. WHEN posts are created/updated THEN overlay fields SHALL be validated for length and format
3. WHEN posts are retrieved THEN overlay data SHALL be included in API responses
4. WHEN existing posts are migrated THEN they SHALL default to overlay_enabled = FALSE

## Non-Functional Requirements

### Code Architecture and Modularity
- **Single Responsibility Principle**: Overlay logic shall be separated from core card functionality
- **Modular Design**: Overlay components shall be reusable across different card types
- **Dependency Management**: Overlay features shall not impact existing card performance
- **Clear Interfaces**: Overlay props shall be clearly typed and documented

### Performance
- Overlay rendering shall not impact page load times (< 2 seconds target)
- CSS-based overlays shall use efficient Tailwind classes without runtime JavaScript
- Image aspect ratios shall be maintained at 16:9 without distortion
- Gradient calculations shall be handled at build time, not runtime

### Security
- Overlay text input shall be sanitized to prevent XSS attacks
- Database fields shall have appropriate length limits to prevent buffer overflows
- API endpoints shall validate overlay data before storage

### Reliability
- Overlay settings shall survive post updates without data loss
- Invalid overlay configurations shall fallback to safe defaults
- Database migrations shall be backward compatible

### Usability
- Overlay text shall maintain WCAG contrast ratios (> 4.5:1 for normal text)
- Focus states shall be clearly visible for keyboard navigation
- Overlay text shall be readable on all background images
- Mobile overlay spacing shall be optimized for touch interaction

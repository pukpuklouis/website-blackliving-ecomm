# Cmd+K Search Modal Feature - Product Requirements Document

## 🎯 Feature Overview

A site-wide search modal that provides instant access to products, blog posts, and static pages through a Cmd+K keyboard shortcut, enhancing user experience and content discoverability for the Black Living e-commerce website.

## 📋 Table of Contents

1. [Problem Statement](#problem-statement)
2. [Success Metrics](#success-metrics)
3. [User Stories](#user-stories)
4. [Technical Architecture](#technical-architecture)
5. [API Design](#api-design)
6. [Component Specifications](#component-specifications)
7. [Implementation Plan](#implementation-plan)
8. [Performance Requirements](#performance-requirements)
9. [Accessibility & UX](#accessibility--ux)
10. [Testing Strategy](#testing-strategy)

## 🎯 Problem Statement

Currently, users must navigate through category pages or use separate search interfaces to find content. There's no unified, quick-access search mechanism that allows users to instantly find products, blog posts, or information across the entire site.

### Current Pain Points
- No global search functionality
- Separate search interfaces for products vs content
- No keyboard shortcuts for power users
- Limited content discoverability
- Multi-step navigation required to find specific items

## 📊 Success Metrics

### Primary KPIs
- **Search Engagement**: 30% of active users utilize Cmd+K search within first month
- **Search Success Rate**: 80% of searches result in user clicking a result
- **Time to Content**: Reduce average time to find content by 40%
- **Mobile Usability**: 90% search success rate on mobile devices

### Secondary KPIs
- **Conversion Impact**: 15% increase in product page visits from search
- **Content Discovery**: 25% increase in blog post engagement
- **User Retention**: Improved session duration for search users

## 👥 User Stories

### As a Customer
- **US-001**: I want to quickly search for specific Simmons mattress models without browsing categories
- **US-002**: I want to find relevant blog posts about sleep health and mattress care
- **US-003**: I want to use familiar keyboard shortcuts (Cmd+K) like in other modern applications
- **US-004**: I want search results grouped by type (products, articles, pages) for easy scanning
- **US-005**: I want recent searches to be saved for quick re-access

### As a Mobile User
- **US-006**: I want a prominent search button accessible from the header
- **US-007**: I want touch-friendly search interface with autocomplete
- **US-008**: I want search results optimized for mobile viewing

### As a Power User
- **US-009**: I want advanced search filters (category, price range, availability)
- **US-010**: I want keyboard navigation through search results
- **US-011**: I want search result previews before clicking

## 🏗️ Technical Architecture

### System Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Frontend      │    │   API Gateway   │    │   Database      │
│                 │    │                 │    │                 │
│ ┌─────────────┐ │    │ ┌─────────────┐ │    │ ┌─────────────┐ │
│ │SearchCommand│ │◄──►│ │/api/search  │ │◄──►│ │ Products    │ │
│ │ Component   │ │    │ │             │ │    │ │ Posts       │ │
│ └─────────────┘ │    │ └─────────────┘ │    │ │ Categories  │ │
│                 │    │                 │    │ └─────────────┘ │
│ ┌─────────────┐ │    │ ┌─────────────┐ │    │                 │
│ │BaseLayout   │ │    │ │Cache Layer  │ │    │                 │
│ │Integration  │ │    │ │(KV Storage) │ │    │                 │
│ └─────────────┘ │    │ └─────────────┘ │    │                 │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

### Component Architecture

```
SearchCommand
├── SearchDialog (shadcn/ui Dialog)
│   ├── SearchInput (Command Input)
│   ├── SearchResults (Command List)
│   │   ├── ProductResults
│   │   ├── PostResults
│   │   └── PageResults
│   ├── SearchFilters
│   └── RecentSearches
└── SearchTrigger (Header Button)
```

### Existing Infrastructure Analysis

**✅ Available:**
- Hono API framework with Cloudflare Workers
- D1 database with products and posts tables
- KV storage for caching
- shadcn/ui Dialog component
- Drizzle ORM with existing search queries
- Product search endpoint: `/api/products/search`
- Post search functionality in `/api/posts`

**❌ Missing:**
- Command component (needs installation)
- Unified search API endpoint
- Global search state management
- Static page indexing
- Search analytics tracking

## 🔌 API Design

### New Unified Search Endpoint

**Endpoint:** `GET /api/search`

**Query Parameters:**
```typescript
interface SearchQuery {
  q: string;              // Search query (required)
  types?: string[];       // ['products', 'posts', 'pages'] (optional)
  category?: string;      // Filter by category (optional)
  limit?: number;         // Results per type (default: 5)
  includeContent?: boolean; // Include excerpt/content (default: false)
}
```

**Response Format:**
```typescript
interface SearchResponse {
  success: boolean;
  data: {
    query: string;
    results: {
      products: ProductResult[];
      posts: PostResult[];
      pages: PageResult[];
    };
    total: number;
    took: number; // Search time in ms
  };
  cached?: boolean;
}
```

### Result Type Definitions

```typescript
interface ProductResult {
  id: string;
  name: string;
  slug: string;
  description: string;
  category: string;
  featuredImage?: string;
  inStock: boolean;
  type: 'product';
}

interface PostResult {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  category: string;
  featuredImage?: string;
  publishedAt: string;
  type: 'post';
}

interface PageResult {
  title: string;
  slug: string;
  description: string;
  type: 'page';
}
```

### Performance Optimization

**Caching Strategy:**
- Cache search results in KV storage for 10 minutes
- Cache key pattern: `search:${hash(query + filters)}`
- Implement result prefetching for popular searches

**Search Optimization:**
- Full-text search with SQLite FTS5 (future enhancement)
- Current: LIKE queries with indexes on searchable fields
- Debounced search requests (300ms delay)
- Maximum 15 results per type to prevent slow queries

## 🧩 Component Specifications

### 1. SearchCommand Component

**Location:** `packages/ui/components/ui/search-command.tsx`

**Dependencies:**
```bash
pnpm add cmdk@latest
```

**Props Interface:**
```typescript
interface SearchCommandProps {
  defaultOpen?: boolean;
  onResultClick?: (result: SearchResult) => void;
  placeholder?: string;
  shortcut?: string; // Default: '⌘K'
}
```

**Key Features:**
- Keyboard shortcut handling (Cmd+K / Ctrl+K)
- Debounced search with loading states
- Result grouping by type
- Keyboard navigation (↑↓ arrows, Enter, Esc)
- Recent searches persistence (localStorage)
- Click outside to close
- Responsive design (mobile optimization)

### 2. Search Trigger Button

**Location:** `apps/web/src/components/Header.astro`

**Implementation:**
- Add search icon button to header navigation
- Mobile: Prominent search button
- Desktop: Small icon with Cmd+K hint
- Accessible with proper ARIA labels

### 3. Search Result Components

**ProductSearchResult:**
- Product image thumbnail
- Name and brief description
- Category badge
- Stock status indicator
- Price display (if available)

**PostSearchResult:**
- Featured image thumbnail
- Title and excerpt
- Category badge
- Published date
- Reading time estimate

**PageSearchResult:**
- Icon representing page type
- Page title and description
- Breadcrumb navigation hint

## 📋 Implementation Plan

### Phase 1: Foundation (Week 1)
**SOLID Principles Application:**
- **S**: Single responsibility for each search component
- **O**: Extensible search architecture for future content types
- **L**: Proper TypeScript interfaces for search result substitution
- **I**: Segregated interfaces for different search result types
- **D**: Abstract search service independent of UI components

**Tasks:**
1. **Install Command Component**
   - Add `cmdk` dependency to ui package
   - Create base Command component wrapper

2. **Create Unified Search API**
   - Implement `/api/search` endpoint in `apps/api/src/routes/search.ts`
   - Add search schemas and validation
   - Implement caching layer

3. **Static Page Indexing**
   - Create content indexing for static pages
   - Generate searchable page metadata

**Deliverables:**
- ✅ Working API endpoint with basic search
- ✅ Command component installed and configured
- ✅ Static page index generated

### Phase 2: Core Component (Week 2)
**KISS & DRY Principles:**
- Simple, reusable search result components
- Eliminate duplicate search logic between API endpoints
- Minimize complex state management

**Tasks:**
1. **Build SearchCommand Component**
   - Create search input with debouncing
   - Implement result grouping and display
   - Add keyboard shortcut handling

2. **Integrate into BaseLayout**
   - Add SearchCommand to global layout
   - Implement client-side hydration
   - Test keyboard shortcuts

3. **Header Integration**
   - Add search trigger button to Header.astro
   - Implement mobile-responsive design
   - Test accessibility features

**Deliverables:**
- ✅ Functional search modal with keyboard shortcuts
- ✅ Mobile and desktop responsive design
- ✅ Basic search results display

### Phase 3: Enhancement (Week 3)
**YAGNI Principle:**
- Focus on proven user needs (recent searches, better results)
- Avoid premature optimization of unused features

**Tasks:**
1. **Advanced Features**
   - Recent searches persistence
   - Search result previews
   - Enhanced mobile experience

2. **Performance Optimization**
   - Implement search debouncing
   - Add result caching
   - Optimize API response times

3. **Analytics Integration**
   - Track search queries and success rates
   - Implement conversion tracking
   - A/B test search result layouts

**Deliverables:**
- ✅ Enhanced user experience features
- ✅ Performance optimizations
- ✅ Analytics tracking

### Phase 4: Polish & Testing (Week 4)
**Testing & Quality Assurance:**
- Comprehensive test suite for all search functionality
- Accessibility compliance verification
- Performance benchmark validation

**Tasks:**
1. **Testing & QA**
   - Unit tests for search components
   - Integration tests for API endpoints
   - E2E tests for complete search flow

2. **Documentation**
   - API documentation updates
   - Component usage examples
   - Performance guidelines

3. **Launch Preparation**
   - Feature flag implementation
   - Gradual rollout strategy
   - Monitoring and alerting setup

**Deliverables:**
- ✅ Comprehensive test coverage
- ✅ Production-ready documentation
- ✅ Launch strategy implementation

## ⚡ Performance Requirements

### Response Time Targets
- **Search API Response**: < 200ms (95th percentile)
- **UI Interaction**: < 100ms from keystroke to UI update
- **Initial Load**: < 50ms for modal open animation

### Scalability Considerations
- **Database**: Indexed searches on name, title, description fields
- **Caching**: 10-minute TTL for search results, 1-hour for static content
- **Rate Limiting**: 100 requests per minute per user
- **Optimization**: Lazy loading for result images, virtualized scrolling for large result sets

### Bundle Size Impact
- **cmdk library**: ~15KB gzipped
- **Search component**: ~5KB additional
- **Total impact**: < 20KB to main bundle

## ♿ Accessibility & UX

### Accessibility Requirements
- **WCAG 2.1 AA Compliance**: All search functionality accessible
- **Keyboard Navigation**: Full keyboard control without mouse
- **Screen Reader Support**: Proper ARIA labels and announcements
- **Focus Management**: Logical tab order and focus trapping
- **High Contrast**: Readable in all contrast modes

### UX Considerations
- **Progressive Enhancement**: Works without JavaScript (fallback to regular search)
- **Mobile Optimization**: Touch-friendly interface with proper target sizes
- **Error Handling**: Clear error states and retry mechanisms
- **Loading States**: Skeleton screens and progress indicators
- **Empty States**: Helpful guidance when no results found

### Internationalization
- **Text Content**: All UI text externalized for translation
- **RTL Support**: Layout adjustments for right-to-left languages
- **Locale-aware Search**: Respect user language preferences

## 🧪 Testing Strategy

### Unit Testing
```typescript
// Component Tests
describe('SearchCommand', () => {
  it('opens modal on Cmd+K shortcut');
  it('debounces search input correctly');
  it('displays results grouped by type');
  it('handles keyboard navigation');
  it('persists recent searches');
});

// API Tests
describe('/api/search', () => {
  it('returns unified search results');
  it('respects query parameters and filters');
  it('implements proper caching headers');
  it('handles rate limiting');
});
```

### Integration Testing
- **Search Flow**: Complete user journey from trigger to result click
- **Cross-browser**: Chrome, Firefox, Safari, Edge compatibility
- **Device Testing**: Mobile iOS/Android, tablet, desktop
- **Performance**: Load testing with realistic search patterns

### E2E Testing (Playwright)
```typescript
test('user can search for products using Cmd+K', async ({ page }) => {
  await page.goto('/');
  await page.keyboard.press('Meta+KeyK');
  await expect(page.locator('[data-testid="search-modal"]')).toBeVisible();
  await page.fill('[data-testid="search-input"]', 'simmons mattress');
  await expect(page.locator('[data-testid="product-results"]')).toContainText('Simmons');
});
```

### Performance Testing
- **Lighthouse Scores**: Maintain 90+ performance score
- **Search Response Times**: Monitor API latency
- **Memory Usage**: Test for memory leaks in long sessions
- **Bundle Analysis**: Track JavaScript bundle size impact

## 🚀 Launch Strategy

### Feature Flags
- **Progressive Rollout**: 10% → 50% → 100% user base
- **A/B Testing**: Compare against existing navigation patterns
- **Fallback Strategy**: Graceful degradation to standard search

### Monitoring & Analytics
- **Error Tracking**: Monitor search failures and timeouts
- **Usage Analytics**: Track search patterns and success rates
- **Performance Monitoring**: Real-time API response times
- **User Feedback**: In-app feedback collection for search experience

### Success Criteria for Launch
- **Technical**: < 1% error rate, < 200ms API response time
- **User Experience**: > 70% search success rate in first week
- **Performance**: No degradation in page load times
- **Accessibility**: WCAG 2.1 AA compliance verified

---

## 📚 Additional Considerations

### Future Enhancements (Post-MVP)
- **AI-Powered Search**: Semantic search using embedding models
- **Search Analytics Dashboard**: Admin interface for search insights
- **Personalized Results**: User behavior-based result ranking
- **Voice Search**: Integration with Web Speech API
- **Advanced Filters**: Price ranges, ratings, availability

### Technical Debt & Maintenance
- **Regular Updates**: Keep cmdk and dependencies current
- **Performance Audits**: Quarterly performance reviews
- **Accessibility Audits**: Semi-annual WCAG compliance checks
- **User Feedback Integration**: Monthly UX improvement cycles

---

**Document Version:** 1.0
**Last Updated:** 2025-09-22
**Owner:** Development Team
**Stakeholders:** Product, Design, Engineering
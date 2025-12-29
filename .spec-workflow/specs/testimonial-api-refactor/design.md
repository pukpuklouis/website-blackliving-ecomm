# Design: Testimonial API Refactor

## Overview

### Design Approach
Transform the static testimonial section into a dynamic, API-driven component that fetches testimonials from blog posts. The design maintains the existing UI/UX while introducing proper error handling, caching, and performance optimizations.

### Architecture Principles
- **Progressive Enhancement**: Page loads without testimonials if API fails
- **Performance First**: Asynchronous loading with aggressive caching
- **Maintainability**: Leverage existing patterns and utilities
- **Resilience**: Multiple fallback strategies for reliability

## System Architecture

### Component Architecture

```
TestimonialSection (Astro)
├── TestimonialCard (Astro) - Existing component, unchanged
├── API Client (TypeScript) - New utility for testimonial fetching
├── Cache Manager - Leverage existing KV cache
└── Error Boundary - Graceful error handling
```

### Data Flow

```
Homepage Load → TestimonialSection Mount
    ↓
API Call: GET /api/posts/public?category=blogger-testimonial&featured=true&limit=4
    ↓
Cache Check (KV) → Cache Hit: Return cached data
    ↓
Cache Miss: API Call → Transform Data → Cache Response → Return data
    ↓
Error Handling → Fallback to static testimonials → Log error
    ↓
Render testimonial cards with transformed data
```

## API Design

### Endpoint Usage
- **URL**: `/api/posts/public`
- **Method**: GET
- **Query Parameters**:
  - `category=blogger-testimonial`
  - `featured=true`
  - `limit=4`
- **Response Format**: Existing posts API response

### Data Transformation

```typescript
interface TestimonialData {
  rating: number;        // Always 5 for featured testimonials
  source: string;        // Post title (blogger name)
  text: string;          // Post excerpt/description
  image?: string;        // Post featuredImage (optimized)
}

function transformPostToTestimonial(post: Post): TestimonialData {
  return {
    rating: 5,
    source: post.title,
    text: post.excerpt || post.description,
    image: post.featuredImage
  };
}
```

## Component Design

### TestimonialSection.astro (Updated)

```astro
---
// Remove static collection import
// import { getCollection } from "astro:content";

// Add API client import
import { fetchTestimonials } from "../utils/testimonialApi";

// Fetch testimonials with error handling
let testimonials = [];
try {
  testimonials = await fetchTestimonials();
} catch (error) {
  console.error('Failed to fetch testimonials:', error);
  // Fallback to static testimonials will be handled in component
}
---

<section class="py-16 bg-gray-50">
  <div class="container mx-auto px-4">
    <h2 class="text-3xl font-bold text-center mb-12">部落格推薦</h2>

    <div class="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-8">
      {testimonials.map((testimonial, index) => (
        <TestimonialCard testimonial={testimonial} key={index} />
      ))}
    </div>

    <div class="text-center mt-8">
      <a href="/testimonials" class="text-black font-semibold hover:underline">
        查看更多好評 →
      </a>
    </div>
  </div>
</section>
```

### API Client (New)

```typescript
// utils/testimonialApi.ts
interface TestimonialApiResponse {
  success: boolean;
  data: Post[];
  pagination: {
    total: number;
    page: number;
    limit: number;
  };
}

export async function fetchTestimonials(): Promise<TestimonialData[]> {
  const cacheKey = 'testimonials:featured';
  const cache = await getCache();

  // Check cache first
  const cached = await cache.get(cacheKey);
  if (cached) {
    return JSON.parse(cached);
  }

  // Fetch from API
  const response = await fetch('/api/posts/public?category=blogger-testimonial&featured=true&limit=4');
  const data: TestimonialApiResponse = await response.json();

  if (!data.success) {
    throw new Error('Failed to fetch testimonials');
  }

  // Transform data
  const testimonials = data.data.map(transformPostToTestimonial);

  // Cache for 5 minutes
  await cache.set(cacheKey, JSON.stringify(testimonials), { ttl: 300 });

  return testimonials;
}
```

## Error Handling & Resilience

### Fallback Strategy

1. **API Failure**: Show static testimonials from content collection
2. **Partial Data**: Filter out invalid testimonials, show remaining
3. **Image Failure**: Show testimonials without images
4. **Complete Failure**: Show generic "Loading testimonials..." message

### Error Logging

```typescript
// Log errors for monitoring
if (error) {
  console.error('Testimonial fetch failed:', {
    error: error.message,
    timestamp: new Date().toISOString(),
    userAgent: navigator.userAgent,
    url: window.location.href
  });
}
```

## Performance Optimization

### Caching Strategy

- **Browser Cache**: 5 minutes for testimonial data
- **Server Cache**: Leverage existing KV cache in API
- **Image Cache**: Use existing image optimization pipeline

### Loading Strategy

- **Asynchronous**: Non-blocking page load
- **Lazy Images**: Progressive image loading
- **Skeleton Loading**: Placeholder while loading

## Security Considerations

### Input Validation
- Validate API response structure
- Sanitize testimonial text content
- Validate image URLs before rendering

### Rate Limiting
- API calls are client-side, leverage existing API rate limiting
- Cache reduces API call frequency

## Testing Strategy

### Unit Tests
- Data transformation functions
- Error handling scenarios
- Cache operations

### Integration Tests
- API client functionality
- Component rendering with mock data
- Error boundary behavior

### E2E Tests
- Homepage loads with testimonials
- Fallback behavior when API fails
- Image loading and optimization

## Deployment Strategy

### Feature Flag Implementation

```typescript
// Allow gradual rollout
const ENABLE_DYNAMIC_TESTIMONIALS = import.meta.env.VITE_ENABLE_DYNAMIC_TESTIMONIALS;

// Conditional loading
if (ENABLE_DYNAMIC_TESTIMONIALS) {
  testimonials = await fetchTestimonials();
} else {
  testimonials = await getCollection('testimonials');
}
```

### Rollback Plan
- Feature flag allows instant rollback
- Static testimonials always available as fallback
- Monitor error rates and performance metrics

## Monitoring & Analytics

### Key Metrics
- API response time
- Cache hit rate
- Error rate
- Testimonial load success rate
- User engagement with testimonial section

### Logging
- API call success/failure
- Cache performance
- Error details with context
- Performance timings

## Migration Plan

### Phase 1: Development
- Implement API client
- Update TestimonialSection component
- Add error handling and fallbacks
- Comprehensive testing

### Phase 2: Testing
- Unit and integration tests
- Performance testing
- Error scenario testing
- Cross-browser testing

### Phase 3: Deployment
- Feature flag rollout (10% traffic)
- Monitor metrics and errors
- Gradual traffic increase
- Full rollout after 24 hours stable

### Phase 4: Cleanup
- Remove feature flag
- Update documentation
- Remove old static testimonial files (after confirmation)

## Change Log

| Date | Version | Author | Changes |
|------|---------|--------|---------|
| 2025-12-16 | 1.0 | Architect | Initial design document |
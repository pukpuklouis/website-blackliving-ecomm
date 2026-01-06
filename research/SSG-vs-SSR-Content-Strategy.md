# SSG vs SSR Content Strategy

## Current Implementation Status

### ✅ Completed Optimizations
- **Optimized API calls**: Reduced from 3 to 2 calls per post (33% reduction)
- **Static generation**: Added `prerender = true` to both post routes
- **Clean Astro patterns**: Proper getStaticPaths with props passing
- **Markdown parsing**: Runtime parsing with `marked` library preserved

### 🎯 Current Behavior
- **Build time**: All post data fetched and baked into static HTML
- **Runtime**: Zero API calls, instant page loads
- **Content freshness**: Frozen at build time until next deployment

## Content Update Strategy Options

### Option 1: Pure SSG (Current)
**Files affected:**
- `apps/web/src/pages/posts/[postSlug].astro`
- `apps/web/src/pages/customer-reviews/[postSlug].astro`

**Characteristics:**
```astro
export const prerender = true;
export async function getStaticPaths() {
  // All data fetched at build time
  return postsWithData;
}
```

**Pros:**
- ⚡ Fastest performance (static HTML from CDN)
- 💰 Lowest server costs
- 🔒 Most reliable (no runtime failures)

**Cons:**
- 📅 Stale content until rebuild
- 🔄 Manual rebuilds needed for updates

---

### Option 2: Server-Side Rendering (SSR)
**Implementation:**
```astro
// Remove this line:
// export const prerender = true;

// Keep runtime data fetching:
const postResponse = await fetch(`${apiUrl}/api/posts/${postSlug}`);
```

**Pros:**
- 🔄 Always fresh content
- ⚡ Instant content updates
- 📱 Real-time data

**Cons:**
- 🐌 Slower page loads (API calls on every request)
- 💸 Higher server costs
- 🚨 More failure points

---

### Option 3: Hybrid Approach (Recommended)
**Keep static generation + Add automated rebuilds**

**Implementation Steps:**

#### 3.1 Webhook Integration
```javascript
// apps/api/src/routes/webhooks.ts
export async function POST(request) {
  // When content changes, trigger rebuild
  await triggerVercelDeploy(); // or Netlify/Cloudflare
}
```

#### 3.2 CI/CD Auto-rebuild
```yaml
# .github/workflows/content-update.yml
name: Auto Rebuild on Content Change
on:
  repository_dispatch:
    types: [content-updated]
jobs:
  build-deploy:
    runs-on: ubuntu-latest
    steps:
      - name: Rebuild Site
        run: pnpm build && pnpm deploy
```

#### 3.3 CMS Integration
```javascript
// When admin creates/updates post:
async function updatePost(postData) {
  await saveToDatabase(postData);
  // Trigger rebuild
  await fetch('/api/webhook/rebuild', { method: 'POST' });
}
```

**Pros:**
- ⚡ Fast static performance
- 🔄 Automated content updates
- 🎯 Best of both worlds

**Cons:**
- 🔧 More complex setup
- ⏱️ Small delay for updates (rebuild time)

---

### Option 4: Incremental Static Regeneration (ISR)
**Future Consideration (Astro Experimental):**
```astro
export const prerender = true;
export const revalidate = 3600; // Revalidate every hour
```

**Status:** Experimental in Astro, production-ready in Next.js

---

## Implementation Recommendations

### For Black Living Blog:

**Phase 1 (Current): Pure SSG**
- Keep current implementation
- Fast, reliable, cost-effective
- Manual rebuilds acceptable for low-frequency updates

**Phase 2 (Future): Smart Hybrid**
1. Add webhook endpoint in API
2. CMS integration to trigger rebuilds
3. Automated deployment on content changes
4. Best performance + automated updates

**Phase 3 (Advanced): ISR**
- When Astro ISR becomes stable
- Automatic cache invalidation
- Zero manual intervention

## Decision Framework

**Choose SSG if:**
- Content updates < 1 per day
- Performance is critical
- Budget is constrained

**Choose SSR if:**
- Content updates frequently (multiple per hour)
- Real-time data required
- User-generated content

**Choose Hybrid if:**
- Content updates moderately (few per day)
- Want best performance + automation
- Can invest in CI/CD setup

## Next Steps

1. **Monitor usage patterns**: How often does content actually update?
2. **Measure performance impact**: Compare SSG vs SSR load times
3. **Implement webhook system**: For automated rebuilds
4. **Set up monitoring**: Track rebuild success/failures

## Files to Modify for Changes

**Switch to SSR:**
- Remove `export const prerender = true;` from both `[postSlug].astro` files
- Add runtime data fetching back to component body

**Implement Webhooks:**
- Create `apps/api/src/routes/webhook/rebuild.ts`
- Add rebuild trigger to admin CMS
- Set up deployment automation

**ISR (Future):**
- Add `export const revalidate = 3600;` to static routes
- Configure cache invalidation rules
import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';
import { and, desc, eq, like, or } from 'drizzle-orm';
import { posts, products, postCategories } from '@blackliving/db/schema';
import type { UnifiedSearchResponse, SearchResultSections } from '@blackliving/types/search';

import { SearchCache } from '../lib/search-cache';
import type { CacheManager } from '../lib/cache';

const typeEnum = z.enum(['products', 'posts', 'pages']);
const categorySlugSchema = z.string().regex(/^[a-z0-9-]+$/);

const searchQuerySchema = z.object({
  q: z.string().trim().min(1, 'Search query is required').max(120, 'Search query is too long'),
  types: z.preprocess((value) => {
    if (typeof value === 'string') {
      return value
        .split(',')
        .map((entry) => entry.trim())
        .filter(Boolean);
    }
    if (Array.isArray(value)) {
      return value.map(String);
    }
    return undefined;
  }, z.array(typeEnum).optional()),
  category: categorySlugSchema.optional(),
  limit: z.coerce.number().min(1).max(20).default(5),
  includeContent: z.coerce.boolean().optional().default(false),
});

const STATIC_PAGES = [
  {
    title: 'About Black Living',
    slug: 'about',
    description: '探索 Black Living 的品牌故事與 Simmons Black Label 床墊理念。',
    href: '/about',
  },
  {
    title: 'Simmons Black Label 系列',
    slug: 'simmons-black',
    description: '了解 Simmons Black Label 高端床墊系列的核心特色與技術。',
    href: '/simmons-black',
  },
  {
    title: '美國進口寢具與配件',
    slug: 'us-imports',
    description: '精選美國進口寢具、床架與配件，打造頂級睡眠體驗。',
    href: '/us-imports',
  },
  {
    title: '預約專人試躺',
    slug: 'appointment',
    description: '預約專業顧問，體驗 Simmons Black Label 床墊與門市服務。',
    href: '/appointment',
  },
];

const normalizeCategorySlug = (input?: string | null): string => {
  if (!input) return 'blog-post';
  const value = input.trim().toLowerCase();
  if (['customer-reviews', '顧客好評', '客戶評價'].includes(value)) {
    return 'customer-reviews';
  }
  if (['blog-post', '好文分享', '部落格文章', 'blog'].includes(value)) {
    return 'blog-post';
  }
  if (value.startsWith('cat_')) {
    // Fallback mapping for known category ids
    if (value === 'cat_002') return 'customer-reviews';
    return 'blog-post';
  }
  return value.replace(/\s+/g, '-');
};

type Env = {
  Bindings: {
    DB: D1Database;
    CACHE: KVNamespace;
  };
  Variables: {
    db: any;
    cache: CacheManager;
  };
};

const searchRouter = new Hono<Env>();

searchRouter.get('/', zValidator('query', searchQuerySchema), async (c) => {
  const db = c.get('db');
  const cacheManager = c.get('cache');
  const query = c.req.valid('query');

  if (!db) {
    return c.json({ success: false, error: 'Database not initialised' }, 500);
  }
  if (!cacheManager) {
    return c.json({ success: false, error: 'Cache not initialised' }, 500);
  }

  const startedAt = Date.now();
  const types = new Set(query.types ?? ['products', 'posts', 'pages']);
  const cacheFilters = {
    query: query.q,
    types: Array.from(types).sort(),
    category: query.category,
    limit: query.limit,
    includeContent: query.includeContent,
  };

  const searchCache = new SearchCache(cacheManager);
  const cached = await searchCache.get<UnifiedSearchResponse>(cacheFilters);
  if (cached) {
    return c.json({ success: true, data: { ...cached, cached: true }, cached: true });
  }

  const results: SearchResultSections = {
    products: [],
    posts: [],
    pages: [],
  };

  // Enhanced fuzzy search with improved query processing
  const { searchTerms, fullSearchTerm } = processSearchQuery(query.q);

  if (types.has('products')) {
    // Build fuzzy search conditions for products
    const searchConditions =
      searchTerms.length > 1
        ? and(
            ...searchTerms.map((term) =>
              or(
                like(products.name, `%${term}%`),
                like(products.description, `%${term}%`),
                like(products.slug, `%${term}%`)
              )
            )
          )
        : or(
            like(products.name, fullSearchTerm),
            like(products.description, fullSearchTerm),
            like(products.slug, fullSearchTerm)
          );

    const productConditions = [searchConditions];
    if (query.category) {
      productConditions.push(eq(products.category, query.category));
    }
    productConditions.push(eq(products.inStock, true));

    const productRows = await db
      .select({
        id: products.id,
        name: products.name,
        slug: products.slug,
        description: products.description,
        category: products.category,
        images: products.images,
        inStock: products.inStock,
      })
      .from(products)
      .where(and(...productConditions))
      .orderBy(desc(products.featured), desc(products.createdAt))
      .limit(query.limit);

    results.products = productRows.map((product) => ({
      id: product.id,
      title: product.name,
      description: truncate(product.description, 160),
      category: product.category,
      slug: product.slug,
      href: `/${product.category}/${product.slug}`,
      type: 'product' as const,
      thumbnail: extractFirstImage(product.images),
      metadata: {
        inStock: product.inStock,
      },
    }));
  }

  if (types.has('posts')) {
    // Build fuzzy search conditions for posts
    const postSearchConditions =
      searchTerms.length > 1
        ? and(
            ...searchTerms.map((term) => {
              const termConditions = [
                like(posts.title, `%${term}%`),
                like(posts.description, `%${term}%`),
                like(posts.slug, `%${term}%`),
              ];
              if (query.includeContent) {
                termConditions.push(like(posts.content, `%${term}%`));
              }
              return or(...termConditions);
            })
          )
        : or(
            like(posts.title, fullSearchTerm),
            like(posts.description, fullSearchTerm),
            like(posts.slug, fullSearchTerm),
            ...(query.includeContent ? [like(posts.content, fullSearchTerm)] : [])
          );

    const postConditions = [postSearchConditions, eq(posts.status, 'published')];

    const postRows = await db
      .select({
        id: posts.id,
        title: posts.title,
        slug: posts.slug,
        description: posts.description,
        category: posts.category,
        categorySlug: postCategories.slug,
        featuredImage: posts.featuredImage,
        publishedAt: posts.publishedAt,
        readingTime: posts.readingTime,
      })
      .from(posts)
      .leftJoin(postCategories, eq(posts.categoryId, postCategories.id))
      .where(and(...postConditions))
      .orderBy(desc(posts.featured), desc(posts.publishedAt), desc(posts.createdAt))
      .limit(query.limit);

    results.posts = postRows.map((post) => {
      const categorySlug = normalizeCategorySlug(post.categorySlug ?? post.category);
      const categoryLabel =
        post.category ||
        (categorySlug === 'customer-reviews'
          ? '顧客好評'
          : categorySlug === 'blog-post'
            ? '好文分享'
            : categorySlug);

      return {
        id: post.id,
        title: post.title,
        description: truncate(post.description, 180),
        category: categoryLabel,
        slug: post.slug,
        href: `/${categorySlug}/${post.slug}`,
        type: 'post' as const,
        thumbnail: post.featuredImage ?? null,
        metadata: {
          publishedAt:
            post.publishedAt && !isNaN(new Date(post.publishedAt).getTime())
              ? new Date(post.publishedAt).toISOString()
              : null,
          readingTime: post.readingTime ?? null,
        },
      };
    });
  }

  if (types.has('pages')) {
    // Enhanced fuzzy search for static pages
    results.pages = STATIC_PAGES.filter((page) => {
      const pageTitle = page.title.toLowerCase();
      const pageDescription = page.description.toLowerCase();
      const pageSlug = page.slug.toLowerCase();

      // For multiple terms, all terms must match somewhere
      if (searchTerms.length > 1) {
        return searchTerms.every(
          (term) =>
            pageTitle.includes(term) || pageDescription.includes(term) || pageSlug.includes(term)
        );
      }

      // For single term, match anywhere
      const singleTerm = searchTerms[0] || '';
      return (
        pageTitle.includes(singleTerm) ||
        pageDescription.includes(singleTerm) ||
        pageSlug.includes(singleTerm)
      );
    })
      .slice(0, query.limit)
      .map((page) => ({
        id: page.slug,
        title: page.title,
        description: page.description,
        category: null,
        slug: page.slug,
        href: page.href,
        type: 'page' as const,
        thumbnail: null,
      }));
  }

  const total = results.products.length + results.posts.length + results.pages.length;

  const response: UnifiedSearchResponse = {
    query: query.q,
    results,
    total,
    took: Date.now() - startedAt,
  };

  await searchCache.set(cacheFilters, response);

  return c.json({ success: true, data: response, cached: false });
});

function truncate(value: string | null | undefined, length: number): string | undefined {
  if (!value) return undefined;
  if (value.length <= length) return value;
  return `${value.slice(0, length - 1)}…`;
}

function processSearchQuery(query: string): { searchTerms: string[]; fullSearchTerm: string } {
  // Clean and normalize the query
  const cleanQuery = query
    .toLowerCase()
    .trim()
    // Remove special characters but keep spaces and basic punctuation
    .replace(/[^\w\s\u4e00-\u9fff]/g, ' ')
    // Normalize multiple spaces
    .replace(/\s+/g, ' ')
    .trim();

  const searchTerms = cleanQuery.split(/\s+/).filter((term) => term.length > 0);
  const fullSearchTerm = `%${cleanQuery}%`;

  return { searchTerms, fullSearchTerm };
}

function extractFirstImage(images: unknown): string | null {
  if (!images) return null;
  if (Array.isArray(images) && images.length > 0) {
    return typeof images[0] === 'string' ? images[0] : null;
  }
  if (typeof images === 'string') {
    try {
      const parsed = JSON.parse(images);
      if (Array.isArray(parsed) && parsed.length > 0 && typeof parsed[0] === 'string') {
        return parsed[0];
      }
    } catch (error) {
      console.warn('Failed to parse product images JSON for search result');
    }
  }
  return null;
}

export default searchRouter;

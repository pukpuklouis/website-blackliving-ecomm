import { Hono } from 'hono';
import type { D1Database, R2Bucket, KVNamespace } from '@cloudflare/workers-types';
import type { createDB } from '@blackliving/db';
import type { createCacheManager } from '../lib/cache';
import type { createStorageManager } from '../lib/storage';
import type { createAuth } from '@blackliving/auth';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';
import { eq, desc, like, and, or, count, sql } from 'drizzle-orm';
import { posts, postCategories } from '@blackliving/db/schema';
import { requireAuth, requireAdmin, createAuthMiddleware } from '@blackliving/auth';
import { createId } from '@paralleldrive/cuid2';

interface Env {
  DB: D1Database;
  R2: R2Bucket;
  CACHE: KVNamespace;
  NODE_ENV: string;
  JWT_SECRET: string;
  BETTER_AUTH_SECRET: string;
  GOOGLE_CLIENT_ID: string;
  GOOGLE_CLIENT_SECRET: string;
  GOOGLE_ADMIN_CLIENT_ID: string;
  GOOGLE_ADMIN_CLIENT_SECRET: string;
  GOOGLE_CUSTOMER_CLIENT_ID: string;
  GOOGLE_CUSTOMER_CLIENT_SECRET: string;
}

const postsRouter = new Hono<{
  Bindings: Env;
  Variables: {
    db: ReturnType<typeof createDB>;
    cache: ReturnType<typeof createCacheManager>;
    storage: ReturnType<typeof createStorageManager>;
    auth: ReturnType<typeof createAuth>;
    user: any;
    session: any;
  };
}>();

// Apply auth middleware to all posts routes
postsRouter.use('*', async (c, next) => {
  // Use the same session logic as Better Auth's built-in session validation
  try {
    const auth = c.get('auth');
    const cookieHeader = c.req.header('Cookie');

    if (!cookieHeader) {
      c.set('user', null);
      c.set('session', null);
      await next();
      return;
    }

    // Extract session token from cookie (same logic as main app)
    const sessionTokenMatch = cookieHeader.match(/better-auth\.session_token=([^;]+)/);
    if (!sessionTokenMatch) {
      c.set('user', null);
      c.set('session', null);
      await next();
      return;
    }

    const sessionToken = sessionTokenMatch[1];

    const db = c.get('db');
    const { users, sessions } = await import('@blackliving/db/schema');
    const { eq } = await import('drizzle-orm');

    // Query session directly (same as main app)
    const sessionResult = await db
      .select({
        id: sessions.id,
        token: sessions.token,
        userId: sessions.userId,
        expiresAt: sessions.expiresAt,
        user: {
          id: users.id,
          email: users.email,
          name: users.name,
          role: users.role,
          image: users.image,
        },
      })
      .from(sessions)
      .innerJoin(users, eq(sessions.userId, users.id))
      .where(eq(sessions.token, sessionToken))
      .limit(1);

    if (sessionResult.length === 0) {
      c.set('user', null);
      c.set('session', null);
      await next();
      return;
    }

    const session = sessionResult[0];

    // Check if session is expired
    if (session.expiresAt < new Date()) {
      c.set('user', null);
      c.set('session', null);
      await next();
      return;
    }

    c.set('user', session.user);
    c.set('session', {
      id: session.id,
      expiresAt: session.expiresAt,
    });
  } catch (error) {
    console.error('Posts router session check error:', error);
    c.set('user', null);
    c.set('session', null);
  }

  await next();
});

// Validation schemas
const createPostSchema = z.object({
  title: z.string().min(1, '文章標題為必填'),
  slug: z
    .string()
    .min(1, 'URL slug 為必填')
    .regex(/^[a-z0-9-]+$/, 'URL slug 格式不正確'),
  description: z.string().min(10, '文章描述至少需要10個字元'),
  excerpt: z.string().optional(),
  content: z.string().min(50, '文章內容至少需要50個字元'),
  categoryId: z.string().optional(),
  category: z.string().optional(), // Remove hardcoded enum, validate dynamically
  tags: z.array(z.string()).default([]),
  status: z.enum(['draft', 'published', 'scheduled', 'archived']).default('draft'),
  featured: z.boolean().default(false),
  allowComments: z.boolean().default(true),
  featuredImage: z.string().optional(),
  // SEO Fields
  seoTitle: z.string().optional(),
  seoDescription: z.string().optional(),
  seoKeywords: z.array(z.string()).default([]),
  canonicalUrl: z.string().optional(),
  // Social Media
  ogTitle: z.string().optional(),
  ogDescription: z.string().optional(),
  ogImage: z.string().optional(),
  // Publishing
  scheduledAt: z.string().optional(),
  readingTime: z.number().min(1).max(60).default(5),
});

const updatePostSchema = createPostSchema.partial();

const querySchema = z.object({
  page: z.string().optional().default('1'),
  limit: z.string().optional().default('20'),
  search: z.string().optional(),
  status: z.enum(['draft', 'published', 'scheduled', 'archived', 'all']).optional().default('all'),
  category: z.string().optional().default('all'), // Allow any string, validate dynamically
  featured: z.enum(['true', 'false', 'all']).optional().default('all'),
  author: z.string().optional(),
  sortBy: z
    .enum(['createdAt', 'publishedAt', 'title', 'viewCount'])
    .optional()
    .default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).optional().default('desc'),
});

// Helper functions
const generateSlug = (title: string): string => {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9\u4e00-\u9fff\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/^-+|-+$/g, '');
};

const calculateReadingTime = (content: string): number => {
  const wordsPerMinute = 200;
  const wordCount = content.length / 5; // Rough estimate for Chinese characters
  return Math.max(1, Math.ceil(wordCount / wordsPerMinute));
};

// POST CATEGORIES ENDPOINTS

// GET /api/posts/categories - List all post categories
postsRouter.get('/categories', async c => {
  try {
    const db = c.get('db');

    const categories = await db
      .select()
      .from(postCategories)
      .where(eq(postCategories.isActive, true))
      .orderBy(postCategories.sortOrder, postCategories.name);

    return c.json({
      success: true,
      data: categories,
    });
  } catch (error) {
    console.error('Error fetching post categories:', error);
    return c.json(
      {
        success: false,
        error: 'Failed to fetch post categories',
      },
      500
    );
  }
});

// GET /api/posts/categories/:slug - Get category by slug with posts count
postsRouter.get('/categories/:slug', async c => {
  try {
    const db = c.get('db');
    const slug = c.req.param('slug');

    // Get category
    const category = await db
      .select()
      .from(postCategories)
      .where(and(eq(postCategories.slug, slug), eq(postCategories.isActive, true)))
      .limit(1);

    if (category.length === 0) {
      return c.json(
        {
          success: false,
          error: 'Category not found',
        },
        404
      );
    }

    // Get posts count for this category
    const postsCount = await db
      .select({ count: count() })
      .from(posts)
      .where(and(eq(posts.categoryId, category[0].id), eq(posts.status, 'published')));

    return c.json({
      success: true,
      data: {
        ...category[0],
        postsCount: postsCount[0]?.count || 0,
      },
    });
  } catch (error) {
    console.error('Error fetching post category:', error);
    return c.json(
      {
        success: false,
        error: 'Failed to fetch post category',
      },
      500
    );
  }
});

// POSTS ENDPOINTS

// GET /api/posts/by-category/:slug - Get posts by category slug (public)
postsRouter.get(
  '/by-category/:slug',
  zValidator('query', querySchema.omit({ status: true, category: true })),
  async c => {
    try {
      const db = c.get('db');
      const categorySlug = c.req.param('slug');
      const { page, limit, search, featured, sortBy, sortOrder } = c.req.valid('query');

      const pageNum = parseInt(page);
      const limitNum = parseInt(limit);
      const offset = (pageNum - 1) * limitNum;

      // Get category first
      const category = await db
        .select()
        .from(postCategories)
        .where(and(eq(postCategories.slug, categorySlug), eq(postCategories.isActive, true)))
        .limit(1);

      if (category.length === 0) {
        return c.json(
          {
            success: false,
            error: 'Category not found',
          },
          404
        );
      }

      // Build where conditions (only published posts from this category)
      const conditions = [eq(posts.status, 'published'), eq(posts.categoryId, category[0].id)];

      if (search) {
        conditions.push(
          or(like(posts.title, `%${search}%`), like(posts.description, `%${search}%`))
        );
      }

      if (featured !== 'all') {
        conditions.push(eq(posts.featured, featured === 'true'));
      }

      const whereClause = and(...conditions);

      // Build sort order
      let orderBy;
      const direction = sortOrder === 'desc' ? desc : undefined;

      switch (sortBy) {
        case 'publishedAt':
          orderBy = direction ? desc(posts.publishedAt) : posts.publishedAt;
          break;
        case 'title':
          orderBy = direction ? desc(posts.title) : posts.title;
          break;
        case 'viewCount':
          orderBy = direction ? desc(posts.viewCount) : posts.viewCount;
          break;
        default:
          orderBy = direction ? desc(posts.publishedAt) : posts.publishedAt;
      }

      // Get total count
      const totalQuery = await db.select({ count: count() }).from(posts).where(whereClause);

      const total = totalQuery[0]?.count || 0;

      // Get posts (excluding content for list view)
      const postsQuery = db
        .select({
          id: posts.id,
          title: posts.title,
          slug: posts.slug,
          description: posts.description,
          excerpt: posts.excerpt,
          authorName: posts.authorName,
          status: posts.status,
          featured: posts.featured,
          category: posts.category,
          categoryId: posts.categoryId,
          tags: posts.tags,
          featuredImage: posts.featuredImage,
          publishedAt: posts.publishedAt,
          viewCount: posts.viewCount,
          readingTime: posts.readingTime,
          createdAt: posts.createdAt,
        })
        .from(posts)
        .where(whereClause)
        .orderBy(orderBy)
        .limit(limitNum)
        .offset(offset);

      const postsData = await postsQuery.all();

      return c.json({
        success: true,
        data: postsData,
        category: category[0],
        pagination: {
          page: pageNum,
          limit: limitNum,
          total,
          totalPages: Math.ceil(total / limitNum),
        },
      });
    } catch (error) {
      console.error('Error fetching posts by category:', error);
      return c.json(
        {
          success: false,
          error: 'Failed to fetch posts by category',
        },
        500
      );
    }
  }
);

// GET /api/posts - List posts with filtering and pagination
postsRouter.get('/', requireAdmin(), zValidator('query', querySchema), async c => {
  try {
    const db = c.get('db');
    const { page, limit, search, status, category, featured, author, sortBy, sortOrder } =
      c.req.valid('query');

    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const offset = (pageNum - 1) * limitNum;

    // Build where conditions
    const conditions = [];

    if (search) {
      conditions.push(
        or(
          like(posts.title, `%${search}%`),
          like(posts.description, `%${search}%`),
          like(posts.content, `%${search}%`)
        )
      );
    }

    if (status !== 'all') {
      conditions.push(eq(posts.status, status));
    }

    if (category !== 'all') {
      // Filter by category slug using categoryId relationship
      conditions.push(
        sql`${posts.categoryId} IN (SELECT id FROM ${postCategories} WHERE slug = ${category} AND is_active = 1)`
      );
    }

    if (featured !== 'all') {
      conditions.push(eq(posts.featured, featured === 'true'));
    }

    if (author) {
      conditions.push(eq(posts.authorId, author));
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    // Build sort order
    let orderBy;
    const direction = sortOrder === 'desc' ? desc : undefined;

    switch (sortBy) {
      case 'publishedAt':
        orderBy = direction ? desc(posts.publishedAt) : posts.publishedAt;
        break;
      case 'title':
        orderBy = direction ? desc(posts.title) : posts.title;
        break;
      case 'viewCount':
        orderBy = direction ? desc(posts.viewCount) : posts.viewCount;
        break;
      default:
        orderBy = direction ? desc(posts.createdAt) : posts.createdAt;
    }

    // Get total count
    const totalQuery = await db.select({ count: count() }).from(posts).where(whereClause);

    const total = totalQuery[0]?.count || 0;

    // Get posts
    const postsQuery = db
      .select()
      .from(posts)
      .where(whereClause)
      .orderBy(orderBy)
      .limit(limitNum)
      .offset(offset);

    const postsData = await postsQuery.all();

    return c.json({
      success: true,
      data: postsData,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        totalPages: Math.ceil(total / limitNum),
      },
    });
  } catch (error) {
    console.error('Error fetching posts:', error);
    return c.json(
      {
        success: false,
        error: 'Failed to fetch posts',
      },
      500
    );
  }
});

// GET /api/posts/static-paths - Generate static paths for build time (public, published only)
postsRouter.get('/static-paths', async c => {
  try {
    const db = c.get('db');
    const cache = c.get('cache');
    const cacheKey = 'blog:static-paths';

    // Try to get from cache first
    const cachedPaths = await cache.get(cacheKey);
    if (cachedPaths) {
      return c.json({
        success: true,
        data: JSON.parse(cachedPaths),
        cached: true,
      });
    }

    // Get all published posts for static path generation
    const publishedPosts = await db
      .select({
        id: posts.id,
        slug: posts.slug,
        title: posts.title,
        category: posts.category,
        categoryId: posts.categoryId,
        publishedAt: posts.publishedAt,
      })
      .from(posts)
      .where(eq(posts.status, 'published'))
      .orderBy(desc(posts.publishedAt));

    // Cache for 30 minutes
    await cache.set(cacheKey, JSON.stringify(publishedPosts), { ttl: 1800 });

    return c.json({
      success: true,
      data: publishedPosts,
      cached: false,
    });
  } catch (error) {
    console.error('Error fetching static paths:', error);
    return c.json(
      {
        success: false,
        error: 'Failed to fetch static paths',
      },
      500
    );
  }
});

// GET /api/posts/public - Public posts for website (published only)
postsRouter.get('/public', zValidator('query', querySchema.omit({ status: true })), async c => {
  try {
    const db = c.get('db');
    const { page, limit, search, category, featured, sortBy, sortOrder } = c.req.valid('query');

    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const offset = (pageNum - 1) * limitNum;

    // Build where conditions (only published posts)
    const conditions = [eq(posts.status, 'published')];

    if (search) {
      conditions.push(or(like(posts.title, `%${search}%`), like(posts.description, `%${search}%`)));
    }

    if (category !== 'all') {
      // Filter by category slug using categoryId relationship
      conditions.push(
        sql`${posts.categoryId} IN (SELECT id FROM ${postCategories} WHERE slug = ${category} AND is_active = 1)`
      );
    }

    if (featured !== 'all') {
      conditions.push(eq(posts.featured, featured === 'true'));
    }

    const whereClause = and(...conditions);

    // Build sort order
    let orderBy;
    const direction = sortOrder === 'desc' ? desc : undefined;

    switch (sortBy) {
      case 'publishedAt':
        orderBy = direction ? desc(posts.publishedAt) : posts.publishedAt;
        break;
      case 'title':
        orderBy = direction ? desc(posts.title) : posts.title;
        break;
      case 'viewCount':
        orderBy = direction ? desc(posts.viewCount) : posts.viewCount;
        break;
      default:
        orderBy = direction ? desc(posts.publishedAt) : posts.publishedAt;
    }

    // Get total count
    const totalQuery = await db.select({ count: count() }).from(posts).where(whereClause);

    const total = totalQuery[0]?.count || 0;

    // Get posts (excluding content for list view)
    const postsQuery = db
      .select({
        id: posts.id,
        title: posts.title,
        slug: posts.slug,
        description: posts.description,
        excerpt: posts.excerpt,
        authorName: posts.authorName,
        status: posts.status,
        featured: posts.featured,
        category: posts.category,
        tags: posts.tags,
        featuredImage: posts.featuredImage,
        publishedAt: posts.publishedAt,
        viewCount: posts.viewCount,
        readingTime: posts.readingTime,
        createdAt: posts.createdAt,
      })
      .from(posts)
      .where(whereClause)
      .orderBy(orderBy)
      .limit(limitNum)
      .offset(offset);

    const postsData = await postsQuery.all();

    return c.json({
      success: true,
      data: postsData,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        totalPages: Math.ceil(total / limitNum),
      },
    });
  } catch (error) {
    console.error('Error fetching public posts:', error);
    return c.json(
      {
        success: false,
        error: 'Failed to fetch posts',
      },
      500
    );
  }
});

// GET /api/posts/:id - Get single post with optional includes
postsRouter.get('/:id', async c => {
  try {
    const db = c.get('db');
    const postId = c.req.param('id');
    const includeParam = c.req.query('include'); // e.g., "category" or "category,other"
    const includes = includeParam ? includeParam.split(',').map(s => s.trim()) : [];

    // Check if this is a slug or ID
    let whereCondition;
    if (postId.startsWith('post_') || postId.length === 25) {
      // It's an ID
      whereCondition = eq(posts.id, postId);
    } else {
      // It's a slug
      whereCondition = eq(posts.slug, postId);
    }

    const post = await db.select().from(posts).where(whereCondition).limit(1);

    if (post.length === 0) {
      return c.json(
        {
          success: false,
          error: 'Post not found',
        },
        404
      );
    }

    // Increment view count if this is a public request (not admin)
    const user = c.get('user');
    if (!user || user.role !== 'admin') {
      await db
        .update(posts)
        .set({
          viewCount: sql`${posts.viewCount} + 1`,
          updatedAt: new Date(),
        })
        .where(whereCondition);

      // Update the returned post data
      post[0].viewCount += 1;
    }

    // Prepare response data
    const postData = post[0];
    const responseData: any = { ...postData };

    // Include category data if requested
    if (includes.includes('category') && postData.categoryId) {
      try {
        const category = await db
          .select()
          .from(postCategories)
          .where(eq(postCategories.id, postData.categoryId))
          .limit(1);

        if (category.length > 0) {
          responseData.category = category[0];
        }
      } catch (categoryError) {
        console.warn('Error fetching category for post:', categoryError);
        // Continue without category data rather than failing the entire request
      }
    }

    return c.json({
      success: true,
      data: responseData,
    });
  } catch (error) {
    console.error('Error fetching post:', error);
    return c.json(
      {
        success: false,
        error: 'Failed to fetch post',
      },
      500
    );
  }
});

// POST /api/posts - Create new post
postsRouter.post('/', requireAdmin(), zValidator('json', createPostSchema), async c => {
  try {
    const db = c.get('db');
    const user = c.get('user');
    const postData = c.req.valid('json');

    // Check if slug already exists
    const existingPost = await db
      .select({ id: posts.id })
      .from(posts)
      .where(eq(posts.slug, postData.slug))
      .limit(1);

    if (existingPost.length > 0) {
      return c.json(
        {
          success: false,
          error: 'URL slug already exists',
        },
        409
      );
    }

    // Calculate reading time if not provided
    const readingTime = postData.readingTime || calculateReadingTime(postData.content);

    const newPost = {
      id: createId(),
      ...postData,
      authorId: user.id,
      authorName: user.name || user.email,
      readingTime,
      publishedAt: postData.status === 'published' ? new Date() : null,
      viewCount: 0,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    await db.insert(posts).values(newPost);

    return c.json(
      {
        success: true,
        data: newPost,
      },
      201
    );
  } catch (error) {
    console.error('Error creating post:', error);
    return c.json(
      {
        success: false,
        error: 'Failed to create post',
      },
      500
    );
  }
});

// PUT /api/posts/:id - Update post
postsRouter.put('/:id', requireAdmin(), zValidator('json', updatePostSchema), async c => {
  try {
    const db = c.get('db');
    const postId = c.req.param('id');
    const updates = c.req.valid('json');

    // Check if post exists
    const existingPost = await db.select().from(posts).where(eq(posts.id, postId)).limit(1);

    if (existingPost.length === 0) {
      return c.json(
        {
          success: false,
          error: 'Post not found',
        },
        404
      );
    }

    // Check if slug is being updated and doesn't conflict
    if (updates.slug && updates.slug !== existingPost[0].slug) {
      const slugConflict = await db
        .select({ id: posts.id })
        .from(posts)
        .where(and(eq(posts.slug, updates.slug), sql`${posts.id} != ${postId}`))
        .limit(1);

      if (slugConflict.length > 0) {
        return c.json(
          {
            success: false,
            error: 'URL slug already exists',
          },
          409
        );
      }
    }

    // Calculate reading time if content is updated
    if (updates.content && !updates.readingTime) {
      updates.readingTime = calculateReadingTime(updates.content);
    }

    // Set published date if status is changing to published
    if (updates.status === 'published' && existingPost[0].status !== 'published') {
      updates.publishedAt = new Date();
    }

    const updatedPost = {
      ...updates,
      updatedAt: new Date(),
    };

    await db.update(posts).set(updatedPost).where(eq(posts.id, postId));

    // Fetch and return updated post
    const result = await db.select().from(posts).where(eq(posts.id, postId)).limit(1);

    return c.json({
      success: true,
      data: result[0],
    });
  } catch (error) {
    console.error('Error updating post:', error);
    return c.json(
      {
        success: false,
        error: 'Failed to update post',
      },
      500
    );
  }
});

// DELETE /api/posts/:id - Delete post
postsRouter.delete('/:id', requireAdmin(), async c => {
  try {
    const db = c.get('db');
    const postId = c.req.param('id');

    // Check if post exists
    const existingPost = await db
      .select({ id: posts.id })
      .from(posts)
      .where(eq(posts.id, postId))
      .limit(1);

    if (existingPost.length === 0) {
      return c.json(
        {
          success: false,
          error: 'Post not found',
        },
        404
      );
    }

    await db.delete(posts).where(eq(posts.id, postId));

    return c.json({
      success: true,
      message: 'Post deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting post:', error);
    return c.json(
      {
        success: false,
        error: 'Failed to delete post',
      },
      500
    );
  }
});

// GET /api/posts/analytics/stats - Get blog analytics
postsRouter.get('/analytics/stats', requireAdmin(), async c => {
  try {
    const db = c.get('db');

    // Get basic stats
    const totalPosts = await db.select({ count: count() }).from(posts);
    const publishedPosts = await db
      .select({ count: count() })
      .from(posts)
      .where(eq(posts.status, 'published'));
    const draftPosts = await db
      .select({ count: count() })
      .from(posts)
      .where(eq(posts.status, 'draft'));
    const featuredPosts = await db
      .select({ count: count() })
      .from(posts)
      .where(eq(posts.featured, true));

    // Get total views
    const totalViews = await db.select({ sum: sql<number>`sum(${posts.viewCount})` }).from(posts);

    // Get category distribution
    const categoryStats = await db
      .select({
        category: posts.category,
        count: count(),
        totalViews: sql<number>`sum(${posts.viewCount})`,
      })
      .from(posts)
      .groupBy(posts.category);

    // Get top posts by views
    const topPosts = await db
      .select({
        id: posts.id,
        title: posts.title,
        slug: posts.slug,
        viewCount: posts.viewCount,
        publishedAt: posts.publishedAt,
      })
      .from(posts)
      .where(eq(posts.status, 'published'))
      .orderBy(desc(posts.viewCount))
      .limit(10);

    // Get recent posts
    const recentPosts = await db
      .select({
        id: posts.id,
        title: posts.title,
        slug: posts.slug,
        status: posts.status,
        createdAt: posts.createdAt,
        publishedAt: posts.publishedAt,
      })
      .from(posts)
      .orderBy(desc(posts.createdAt))
      .limit(10);

    return c.json({
      success: true,
      data: {
        summary: {
          totalPosts: totalPosts[0]?.count || 0,
          publishedPosts: publishedPosts[0]?.count || 0,
          draftPosts: draftPosts[0]?.count || 0,
          featuredPosts: featuredPosts[0]?.count || 0,
          totalViews: totalViews[0]?.sum || 0,
        },
        categories: categoryStats,
        topPosts,
        recentPosts,
      },
    });
  } catch (error) {
    console.error('Error fetching blog analytics:', error);
    return c.json(
      {
        success: false,
        error: 'Failed to fetch blog analytics',
      },
      500
    );
  }
});

// GET /api/posts/:id/related - Get related posts based on category and tags
postsRouter.get('/:id/related', async c => {
  try {
    const db = c.get('db');
    const cache = c.get('cache');
    const postId = c.req.param('id');
    const limit = parseInt(c.req.query('limit') || '3');

    const cacheKey = `blog:related:${postId}:${limit}`;

    // Try to get from cache first
    const cachedRelated = await cache.get(cacheKey);
    if (cachedRelated) {
      return c.json({
        success: true,
        data: JSON.parse(cachedRelated),
        cached: true,
      });
    }

    // Check if this is a slug or ID
    let whereCondition;
    if (postId.startsWith('post_') || postId.length === 25) {
      whereCondition = eq(posts.id, postId);
    } else {
      whereCondition = eq(posts.slug, postId);
    }

    // Get the current post to find related posts
    const currentPost = await db
      .select({
        id: posts.id,
        category: posts.category,
        categoryId: posts.categoryId,
        tags: posts.tags,
      })
      .from(posts)
      .where(whereCondition)
      .limit(1);

    if (currentPost.length === 0) {
      return c.json(
        {
          success: false,
          error: 'Post not found',
        },
        404
      );
    }

    const current = currentPost[0];

    // Build conditions for related posts
    const conditions = [
      eq(posts.status, 'published'), // Only published posts
      sql`${posts.id} != ${current.id}`, // Exclude current post
    ];

    // Prefer posts from same category
    if (current.categoryId) {
      conditions.push(eq(posts.categoryId, current.categoryId));
    } else if (current.category) {
      conditions.push(eq(posts.category, current.category));
    }

    const whereClause = and(...conditions);

    // Get related posts (exclude content for performance)
    const relatedPosts = await db
      .select({
        id: posts.id,
        title: posts.title,
        slug: posts.slug,
        description: posts.description,
        excerpt: posts.excerpt,
        category: posts.category,
        tags: posts.tags,
        featuredImage: posts.featuredImage,
        publishedAt: posts.publishedAt,
        readingTime: posts.readingTime,
        viewCount: posts.viewCount,
      })
      .from(posts)
      .where(whereClause)
      .orderBy(desc(posts.publishedAt))
      .limit(limit);

    // If we don't have enough related posts from same category, get from all categories
    if (relatedPosts.length < limit) {
      const additionalConditions = [
        eq(posts.status, 'published'),
        sql`${posts.id} != ${current.id}`,
      ];

      // Exclude already selected posts
      if (relatedPosts.length > 0) {
        const excludeIds = relatedPosts.map(p => p.id);
        additionalConditions.push(
          sql`${posts.id} NOT IN (${excludeIds.map(id => `'${id}'`).join(', ')})`
        );
      }

      const additionalPosts = await db
        .select({
          id: posts.id,
          title: posts.title,
          slug: posts.slug,
          description: posts.description,
          excerpt: posts.excerpt,
          category: posts.category,
          tags: posts.tags,
          featuredImage: posts.featuredImage,
          publishedAt: posts.publishedAt,
          readingTime: posts.readingTime,
          viewCount: posts.viewCount,
        })
        .from(posts)
        .where(and(...additionalConditions))
        .orderBy(desc(posts.publishedAt))
        .limit(limit - relatedPosts.length);

      relatedPosts.push(...additionalPosts);
    }

    // Cache for 1 hour
    await cache.set(cacheKey, JSON.stringify(relatedPosts), { ttl: 3600 });

    return c.json({
      success: true,
      data: relatedPosts,
      cached: false,
    });
  } catch (error) {
    console.error('Error fetching related posts:', error);
    return c.json(
      {
        success: false,
        error: 'Failed to fetch related posts',
      },
      500
    );
  }
});

// POST /api/posts/:id/duplicate - Duplicate post
postsRouter.post('/:id/duplicate', requireAdmin(), async c => {
  try {
    const db = c.get('db');
    const user = c.get('user');
    const postId = c.req.param('id');

    // Get original post
    const originalPost = await db.select().from(posts).where(eq(posts.id, postId)).limit(1);

    if (originalPost.length === 0) {
      return c.json(
        {
          success: false,
          error: 'Post not found',
        },
        404
      );
    }

    const original = originalPost[0];

    // Create duplicate with modified title and slug
    const duplicateTitle = `${original.title} - 副本`;
    const duplicateSlug = `${original.slug}-copy-${Date.now()}`;

    const duplicatePost = {
      id: createId(),
      title: duplicateTitle,
      slug: duplicateSlug,
      description: original.description,
      excerpt: original.excerpt,
      content: original.content,
      authorId: user.id,
      authorName: user.name || user.email,
      status: 'draft' as const,
      featured: false,
      category: original.category,
      tags: original.tags,
      featuredImage: original.featuredImage,
      seoTitle: original.seoTitle,
      seoDescription: original.seoDescription,
      seoKeywords: original.seoKeywords,
      canonicalUrl: original.canonicalUrl,
      ogTitle: original.ogTitle,
      ogDescription: original.ogDescription,
      ogImage: original.ogImage,
      readingTime: original.readingTime,
      allowComments: original.allowComments,
      viewCount: 0,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    await db.insert(posts).values(duplicatePost);

    return c.json(
      {
        success: true,
        data: duplicatePost,
      },
      201
    );
  } catch (error) {
    console.error('Error duplicating post:', error);
    return c.json(
      {
        success: false,
        error: 'Failed to duplicate post',
      },
      500
    );
  }
});

export { postsRouter };

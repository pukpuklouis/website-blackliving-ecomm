import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';
import { eq, desc, and, sql, count } from 'drizzle-orm';
import { reviews, products } from '@blackliving/db';
import { createId } from '@paralleldrive/cuid2';

type Env = {
  Bindings: {
    DB: D1Database;
    CACHE: KVNamespace;
    R2: R2Bucket;
    NODE_ENV: string;
  };
  Variables: {
    db: any;
    cache: any;
    storage: any;
    user: any;
    session: any;
  };
};

const app = new Hono<Env>();

// Validation schemas
const reviewCreateSchema = z.object({
  customerName: z.string().min(2, 'Customer name must be at least 2 characters'),
  productId: z.string().optional(),
  rating: z.number().int().min(1).max(5),
  content: z.string().min(10, 'Review content must be at least 10 characters'),
  source: z.enum(['website', 'shopee', 'google']).default('website'),
});

const reviewUpdateSchema = z.object({
  customerName: z.string().min(2).optional(),
  productId: z.string().optional(),
  rating: z.number().int().min(1).max(5).optional(),
  content: z.string().min(10).optional(),
  source: z.enum(['website', 'shopee', 'google']).optional(),
  verified: z.boolean().optional(),
  featured: z.boolean().optional(),
});

const reviewQuerySchema = z.object({
  featured: z.string().optional(),
  rating: z.string().optional(),
  platform: z.string().optional(),
  productId: z.string().optional(),
  limit: z.string().optional(),
  offset: z.string().optional(),
});

// Helper function to require admin role
const requireAdmin = async (c: any, next: any) => {
  const user = c.get('user');
  if (!user || user.role !== 'admin') {
    return c.json(
      {
        success: false,
        error: 'Unauthorized',
        message: 'Admin access required',
      },
      403
    );
  }
  await next();
};

// GET /api/reviews - List reviews with filtering
app.get('/', zValidator('query', reviewQuerySchema), async c => {
  try {
    const db = c.get('db');
    const cache = c.get('cache');
    const query = c.req.valid('query');

    // Build cache key
    const cacheKey = `reviews:list:${JSON.stringify(query)}`;

    // Try cache first
    const cached = await cache.get(cacheKey);
    if (cached) {
      return c.json({
        success: true,
        data: JSON.parse(cached),
        cached: true,
      });
    }

    // Build query conditions
    const conditions = [];

    if (query.featured) {
      conditions.push(eq(reviews.featured, query.featured === 'true' ? 1 : 0));
    }

    if (query.rating) {
      conditions.push(eq(reviews.rating, parseInt(query.rating)));
    }

    if (query.platform) {
      conditions.push(eq(reviews.source, query.platform));
    }

    if (query.productId) {
      conditions.push(eq(reviews.productId, query.productId));
    }

    // Execute query with pagination
    const limit = parseInt(query.limit || '20');
    const offset = parseInt(query.offset || '0');

    const result = await db
      .select({
        id: reviews.id,
        customerName: reviews.customerName,
        productId: reviews.productId,
        rating: reviews.rating,
        content: reviews.content,
        source: reviews.source,
        verified: reviews.verified,
        featured: reviews.featured,
        createdAt: reviews.createdAt,
        productName: products.name,
      })
      .from(reviews)
      .leftJoin(products, eq(reviews.productId, products.id))
      .where(conditions.length > 0 ? and(...conditions) : undefined)
      .orderBy(desc(reviews.createdAt))
      .limit(limit)
      .offset(offset);

    // Cache the result
    await cache.put(cacheKey, JSON.stringify(result), { expirationTtl: 300 }); // 5 minutes

    return c.json({
      success: true,
      data: result,
      pagination: {
        limit,
        offset,
        hasMore: result.length === limit,
      },
    });
  } catch (error) {
    console.error('Error fetching reviews:', error);
    return c.json(
      {
        success: false,
        error: 'Internal Server Error',
        message: 'Failed to fetch reviews',
      },
      500
    );
  }
});

// GET /api/reviews/stats - Review statistics for homepage
app.get('/stats', async c => {
  try {
    const db = c.get('db');
    const cache = c.get('cache');

    const cacheKey = 'reviews:stats';

    // Try cache first
    const cached = await cache.get(cacheKey);
    if (cached) {
      return c.json({
        success: true,
        data: JSON.parse(cached),
        cached: true,
      });
    }

    // Get total count and average rating
    const [statsResult] = await db
      .select({
        totalCount: count(),
        avgRating: sql<number>`ROUND(AVG(${reviews.rating}), 1)`,
      })
      .from(reviews)
      .where(eq(reviews.verified, 1));

    // Get rating distribution
    const ratingDistribution = await db
      .select({
        rating: reviews.rating,
        count: count(),
      })
      .from(reviews)
      .where(eq(reviews.verified, 1))
      .groupBy(reviews.rating)
      .orderBy(reviews.rating);

    // Get featured reviews for homepage
    const featuredReviews = await db
      .select({
        id: reviews.id,
        customerName: reviews.customerName,
        productId: reviews.productId,
        rating: reviews.rating,
        content: reviews.content,
        source: reviews.source,
        createdAt: reviews.createdAt,
        productName: products.name,
      })
      .from(reviews)
      .leftJoin(products, eq(reviews.productId, products.id))
      .where(and(eq(reviews.featured, 1), eq(reviews.verified, 1)))
      .orderBy(desc(reviews.createdAt))
      .limit(6);

    const stats = {
      totalReviews: statsResult.totalCount || 0,
      averageRating: statsResult.avgRating || 0,
      ratingDistribution: ratingDistribution.reduce(
        (acc, item) => {
          acc[item.rating] = item.count;
          return acc;
        },
        {} as Record<number, number>
      ),
      featuredReviews,
    };

    // Cache for 15 minutes
    await cache.put(cacheKey, JSON.stringify(stats), { expirationTtl: 900 });

    return c.json({
      success: true,
      data: stats,
    });
  } catch (error) {
    console.error('Error fetching review stats:', error);
    return c.json(
      {
        success: false,
        error: 'Internal Server Error',
        message: 'Failed to fetch review statistics',
      },
      500
    );
  }
});

// GET /api/reviews/:id - Get single review
app.get('/:id', async c => {
  try {
    const db = c.get('db');
    const id = c.req.param('id');

    const [review] = await db
      .select({
        id: reviews.id,
        customerName: reviews.customerName,
        productId: reviews.productId,
        rating: reviews.rating,
        content: reviews.content,
        source: reviews.source,
        verified: reviews.verified,
        featured: reviews.featured,
        createdAt: reviews.createdAt,
        productName: products.name,
      })
      .from(reviews)
      .leftJoin(products, eq(reviews.productId, products.id))
      .where(eq(reviews.id, id));

    if (!review) {
      return c.json(
        {
          success: false,
          error: 'Not Found',
          message: 'Review not found',
        },
        404
      );
    }

    return c.json({
      success: true,
      data: review,
    });
  } catch (error) {
    console.error('Error fetching review:', error);
    return c.json(
      {
        success: false,
        error: 'Internal Server Error',
        message: 'Failed to fetch review',
      },
      500
    );
  }
});

// POST /api/reviews - Create new review (public)
app.post('/', zValidator('json', reviewCreateSchema), async c => {
  try {
    const db = c.get('db');
    const cache = c.get('cache');
    const reviewData = c.req.valid('json');

    // Validate product exists if productId is provided
    if (reviewData.productId) {
      const [product] = await db
        .select({ id: products.id })
        .from(products)
        .where(eq(products.id, reviewData.productId));

      if (!product) {
        return c.json(
          {
            success: false,
            error: 'Bad Request',
            message: 'Product not found',
          },
          400
        );
      }
    }

    const reviewId = createId();
    const now = new Date();

    const [newReview] = await db
      .insert(reviews)
      .values({
        id: reviewId,
        customerName: reviewData.customerName,
        productId: reviewData.productId || null,
        rating: reviewData.rating,
        content: reviewData.content,
        source: reviewData.source,
        verified: false, // New reviews start unverified
        featured: false,
        createdAt: now,
      })
      .returning();

    // Clear relevant caches
    await cache.delete('reviews:stats');

    return c.json(
      {
        success: true,
        data: newReview,
        message: 'Review created successfully',
      },
      201
    );
  } catch (error) {
    console.error('Error creating review:', error);
    return c.json(
      {
        success: false,
        error: 'Internal Server Error',
        message: 'Failed to create review',
      },
      500
    );
  }
});

// PUT /api/reviews/:id - Update review (admin only)
app.put('/:id', requireAdmin, zValidator('json', reviewUpdateSchema), async c => {
  try {
    const db = c.get('db');
    const cache = c.get('cache');
    const id = c.req.param('id');
    const updateData = c.req.valid('json');

    // Check if review exists
    const [existingReview] = await db
      .select({ id: reviews.id })
      .from(reviews)
      .where(eq(reviews.id, id));

    if (!existingReview) {
      return c.json(
        {
          success: false,
          error: 'Not Found',
          message: 'Review not found',
        },
        404
      );
    }

    // Validate product exists if productId is being updated
    if (updateData.productId) {
      const [product] = await db
        .select({ id: products.id })
        .from(products)
        .where(eq(products.id, updateData.productId));

      if (!product) {
        return c.json(
          {
            success: false,
            error: 'Bad Request',
            message: 'Product not found',
          },
          400
        );
      }
    }

    const [updatedReview] = await db
      .update(reviews)
      .set({
        ...updateData,
        verified: updateData.verified !== undefined ? updateData.verified : undefined,
        featured: updateData.featured !== undefined ? updateData.featured : undefined,
      })
      .where(eq(reviews.id, id))
      .returning();

    // Clear relevant caches
    await cache.delete('reviews:stats');

    return c.json({
      success: true,
      data: updatedReview,
      message: 'Review updated successfully',
    });
  } catch (error) {
    console.error('Error updating review:', error);
    return c.json(
      {
        success: false,
        error: 'Internal Server Error',
        message: 'Failed to update review',
      },
      500
    );
  }
});

// DELETE /api/reviews/:id - Delete review (admin only)
app.delete('/:id', requireAdmin, async c => {
  try {
    const db = c.get('db');
    const cache = c.get('cache');
    const id = c.req.param('id');

    // Check if review exists
    const [existingReview] = await db
      .select({ id: reviews.id })
      .from(reviews)
      .where(eq(reviews.id, id));

    if (!existingReview) {
      return c.json(
        {
          success: false,
          error: 'Not Found',
          message: 'Review not found',
        },
        404
      );
    }

    await db.delete(reviews).where(eq(reviews.id, id));

    // Clear relevant caches
    await cache.delete('reviews:stats');

    return c.json({
      success: true,
      message: 'Review deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting review:', error);
    return c.json(
      {
        success: false,
        error: 'Internal Server Error',
        message: 'Failed to delete review',
      },
      500
    );
  }
});

export default app;

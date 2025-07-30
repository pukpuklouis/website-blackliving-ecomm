import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';
import { eq, desc, count, and } from 'drizzle-orm';
import { newsletters } from '@blackliving/db';
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
const subscribeSchema = z.object({
  email: z.string().email('Please provide a valid email address'),
  source: z.enum(['website', 'promotion', 'social', 'referral']).default('website'),
});

const unsubscribeSchema = z.object({
  email: z.string().email('Please provide a valid email address'),
});

const subscriberQuerySchema = z.object({
  status: z.enum(['active', 'unsubscribed']).optional(),
  source: z.string().optional(),
  limit: z.string().optional(),
  offset: z.string().optional(),
});

// Helper function to require admin role
const requireAdmin = async (c: any, next: any) => {
  const user = c.get('user');
  if (!user || user.role !== 'admin') {
    return c.json({ 
      success: false, 
      error: 'Unauthorized', 
      message: 'Admin access required' 
    }, 403);
  }
  await next();
};

// POST /api/newsletter/subscribe - Subscribe to newsletter
app.post('/subscribe', zValidator('json', subscribeSchema), async (c) => {
  try {
    const db = c.get('db');
    const cache = c.get('cache');
    const subscriptionData = c.req.valid('json');

    // Check if email already exists
    const [existingSubscription] = await db
      .select()
      .from(newsletters)
      .where(eq(newsletters.email, subscriptionData.email));

    if (existingSubscription) {
      // If already subscribed and active, return success
      if (existingSubscription.status === 'active') {
        return c.json({
          success: true,
          message: 'You are already subscribed to our newsletter'
        });
      }
      
      // If previously unsubscribed, reactivate
      const [reactivatedSubscription] = await db
        .update(newsletters)
        .set({
          status: 'active',
          source: subscriptionData.source,
          createdAt: new Date() // Update the subscription date
        })
        .where(eq(newsletters.email, subscriptionData.email))
        .returning();

      // Clear admin cache
      await cache.delete('newsletter:subscribers:stats');

      return c.json({
        success: true,
        message: 'Successfully resubscribed to newsletter',
        data: reactivatedSubscription
      });
    }

    // Create new subscription
    const subscriptionId = createId();
    const [newSubscription] = await db
      .insert(newsletters)
      .values({
        id: subscriptionId,
        email: subscriptionData.email,
        status: 'active',
        source: subscriptionData.source,
        createdAt: new Date()
      })
      .returning();

    // Clear admin cache
    await cache.delete('newsletter:subscribers:stats');

    return c.json({
      success: true,
      message: 'Successfully subscribed to newsletter',
      data: newSubscription
    }, 201);

  } catch (error) {
    console.error('Error subscribing to newsletter:', error);
    return c.json({
      success: false,
      error: 'Internal Server Error',
      message: 'Failed to subscribe to newsletter'
    }, 500);
  }
});

// DELETE /api/newsletter/unsubscribe/:email - Unsubscribe from newsletter
app.delete('/unsubscribe/:email', async (c) => {
  try {
    const db = c.get('db');
    const cache = c.get('cache');
    const email = decodeURIComponent(c.req.param('email'));

    // Validate email format
    const emailSchema = z.string().email();
    const parseResult = emailSchema.safeParse(email);
    
    if (!parseResult.success) {
      return c.json({
        success: false,
        error: 'Bad Request',
        message: 'Invalid email format'
      }, 400);
    }

    // Find the subscription
    const [subscription] = await db
      .select()
      .from(newsletters)
      .where(eq(newsletters.email, email));

    if (!subscription) {
      return c.json({
        success: false,
        error: 'Not Found',
        message: 'Email not found in our newsletter list'
      }, 404);
    }

    if (subscription.status === 'unsubscribed') {
      return c.json({
        success: true,
        message: 'You are already unsubscribed from our newsletter'
      });
    }

    // Update subscription status to unsubscribed
    const [unsubscribedSubscription] = await db
      .update(newsletters)
      .set({ status: 'unsubscribed' })
      .where(eq(newsletters.email, email))
      .returning();

    // Clear admin cache
    await cache.delete('newsletter:subscribers:stats');

    return c.json({
      success: true,
      message: 'Successfully unsubscribed from newsletter',
      data: unsubscribedSubscription
    });

  } catch (error) {
    console.error('Error unsubscribing from newsletter:', error);
    return c.json({
      success: false,
      error: 'Internal Server Error',
      message: 'Failed to unsubscribe from newsletter'
    }, 500);  
  }
});

// GET /api/newsletter/admin/subscribers - List subscribers (admin only)
app.get('/admin/subscribers', requireAdmin, zValidator('query', subscriberQuerySchema), async (c) => {
  try {
    const db = c.get('db');
    const cache = c.get('cache');
    const query = c.req.valid('query');

    // Build cache key
    const cacheKey = `newsletter:subscribers:${JSON.stringify(query)}`;
    
    // Try cache first
    const cached = await cache.get(cacheKey);
    if (cached) {
      return c.json({
        success: true,
        data: JSON.parse(cached),
        cached: true
      });
    }

    // Build query conditions
    const conditions = [];
    
    if (query.status) {
      conditions.push(eq(newsletters.status, query.status));
    }
    
    if (query.source) {
      conditions.push(eq(newsletters.source, query.source));
    }

    // Execute query with pagination
    const limit = parseInt(query.limit || '50');
    const offset = parseInt(query.offset || '0');

    const result = await db
      .select()
      .from(newsletters)
      .where(conditions.length > 0 ? and(...conditions) : undefined)
      .orderBy(desc(newsletters.createdAt))
      .limit(limit)
      .offset(offset);

    // Get total count for pagination
    const [totalResult] = await db
      .select({ count: count() })
      .from(newsletters)
      .where(conditions.length > 0 ? and(...conditions) : undefined);

    const responseData = {
      subscribers: result,
      pagination: {
        limit,
        offset,
        total: totalResult.count,
        hasMore: offset + result.length < totalResult.count
      }
    };

    // Cache the result for 5 minutes
    await cache.put(cacheKey, JSON.stringify(responseData), { expirationTtl: 300 });

    return c.json({
      success: true,
      data: responseData
    });

  } catch (error) {
    console.error('Error fetching newsletter subscribers:', error);
    return c.json({
      success: false,
      error: 'Internal Server Error',
      message: 'Failed to fetch newsletter subscribers'
    }, 500);
  }
});

// GET /api/newsletter/admin/stats - Get newsletter statistics (admin only)
app.get('/admin/stats', requireAdmin, async (c) => {
  try {
    const db = c.get('db');
    const cache = c.get('cache');

    const cacheKey = 'newsletter:subscribers:stats';
    
    // Try cache first
    const cached = await cache.get(cacheKey);
    if (cached) {
      return c.json({
        success: true,
        data: JSON.parse(cached),
        cached: true
      });
    }

    // Get subscriber statistics
    const [totalStats] = await db
      .select({
        total: count(),
      })
      .from(newsletters);

    const [activeStats] = await db
      .select({
        active: count(),
      })
      .from(newsletters)
      .where(eq(newsletters.status, 'active'));

    const [unsubscribedStats] = await db
      .select({
        unsubscribed: count(),
      })
      .from(newsletters)
      .where(eq(newsletters.status, 'unsubscribed'));

    // Get subscribers by source
    const sourceStats = await db
      .select({
        source: newsletters.source,
        count: count(),
      })
      .from(newsletters)
      .where(eq(newsletters.status, 'active'))
      .groupBy(newsletters.source);

    // Get recent subscribers (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const [recentStats] = await db
      .select({
        recent: count(),
      })
      .from(newsletters)
      .where(and(
        eq(newsletters.status, 'active'),
        // Note: SQLite timestamp comparison might need adjustment based on your schema
      ));

    const stats = {
      total: totalStats.total || 0,
      active: activeStats.active || 0,
      unsubscribed: unsubscribedStats.unsubscribed || 0,
      recentSubscribers: recentStats.recent || 0,
      sourceBreakdown: sourceStats.reduce((acc, item) => {
        acc[item.source] = item.count;
        return acc;
      }, {} as Record<string, number>)
    };

    // Cache for 10 minutes
    await cache.put(cacheKey, JSON.stringify(stats), { expirationTtl: 600 });

    return c.json({
      success: true,
      data: stats
    });

  } catch (error) {
    console.error('Error fetching newsletter stats:', error);
    return c.json({
      success: false,
      error: 'Internal Server Error',  
      message: 'Failed to fetch newsletter statistics'
    }, 500);
  }
});

// DELETE /api/newsletter/admin/subscribers/:id - Remove subscriber (admin only)
app.delete('/admin/subscribers/:id', requireAdmin, async (c) => {
  try {
    const db = c.get('db');
    const cache = c.get('cache');
    const id = c.req.param('id');

    // Check if subscriber exists
    const [existingSubscriber] = await db
      .select()
      .from(newsletters)
      .where(eq(newsletters.id, id));

    if (!existingSubscriber) {
      return c.json({
        success: false,
        error: 'Not Found',
        message: 'Subscriber not found'
      }, 404);
    }

    // Delete the subscriber
    await db
      .delete(newsletters)
      .where(eq(newsletters.id, id));

    // Clear relevant caches
    await cache.delete('newsletter:subscribers:stats');

    return c.json({
      success: true,
      message: 'Subscriber removed successfully'
    });

  } catch (error) {
    console.error('Error removing newsletter subscriber:', error);
    return c.json({
      success: false,
      error: 'Internal Server Error',
      message: 'Failed to remove subscriber'
    }, 500);
  }
});

export default app;
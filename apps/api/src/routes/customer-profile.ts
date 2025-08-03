import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';
import type { D1Database } from '@cloudflare/workers-types';
import { CustomerProfileService } from '@blackliving/db/customer-profile-service';
import { requireAuth, requireCustomer, requireRole } from '../middleware/auth';
import { cacheMiddleware, setCacheHeaders } from '../middleware/cache';

// Validation schemas
const updateProfileSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  phone: z.string().regex(/^09\d{8}$/).optional(), // Taiwan mobile format
  birthday: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  gender: z.enum(['male', 'female', 'other']).optional(),
  contactPreference: z.enum(['email', 'phone', 'sms']).optional(),
  notes: z.string().max(500).optional(),
  preferences: z.object({}).passthrough().optional(),
});

const createProfileSchema = z.object({
  name: z.string().min(1).max(100),
  email: z.string().email(),
  phone: z.string().regex(/^09\d{8}$/).optional(),
  birthday: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  gender: z.enum(['male', 'female', 'other']).optional(),
  source: z.string().max(50).optional(),
  preferences: z.object({}).passthrough().optional(),
});

const batchUpdateSchema = z.object({
  updates: z.array(z.object({
    userId: z.string(),
    data: updateProfileSchema,
  })).max(100), // Limit batch size
});

const app = new Hono<{
  Bindings: {
    DB: D1Database;
    CACHE: KVNamespace;
  };
  Variables: {
    user: {
      id: string;
      email: string;
      role: string;
    };
  };
}>();

// Helper function to create service instance
function createProfileService(c: any) {
  return CustomerProfileService.create(c.env.DB);
}

// ======================
// READ ENDPOINTS
// ======================

/**
 * GET / - Get basic profile (most common)
 * Optimized with caching for high-frequency access
 */
app.get('/', 
  requireRole(['customer', 'admin']),
  cacheMiddleware({ ttl: 300 }), // 5 minute cache
  async (c) => {
    try {
      const userId = c.get('user').id;
      
      const service = createProfileService(c);
      const profile = await service.getBasicProfile(userId);
      
      if (!profile) {
        return c.json({ error: 'Profile not found' }, 404);
      }

      // Set cache headers for client-side caching
      setCacheHeaders(c, { maxAge: 300, etag: `profile-${userId}-${Date.now()}` });
      
      return c.json({
        success: true,
        data: profile,
      });
    } catch (error) {
      console.error('Error fetching profile:', error);
      return c.json({ error: 'Internal server error' }, 500);
    }
  }
);

/**
 * GET /full - Get complete profile with analytics
 * For account dashboard and detailed views
 */
app.get('/full',
  requireRole(['customer', 'admin']),
  cacheMiddleware({ ttl: 180 }), // 3 minute cache (less frequent)
  async (c) => {
    try {
      const userId = c.get('user').id;
      
      const service = createProfileService(c);
      const profile = await service.getFullProfile(userId);
      
      if (!profile) {
        return c.json({ error: 'Profile not found' }, 404);
      }

      setCacheHeaders(c, { maxAge: 180, etag: `full-profile-${userId}-${Date.now()}` });
      
      return c.json({
        success: true,
        data: profile,
      });
    } catch (error) {
      console.error('Error fetching full profile:', error);
      return c.json({ error: 'Internal server error' }, 500);
    }
  }
);

/**
 * GET /analytics - Get profile analytics
 * For dashboard widgets and reporting
 */
app.get('/analytics',
  requireRole(['customer', 'admin']),
  cacheMiddleware({ ttl: 600 }), // 10 minute cache (analytics change less frequently)
  async (c) => {
    try {
      const userId = c.get('user').id;
      
      const service = createProfileService(c);
      const analytics = await service.getProfileAnalytics(userId);
      
      if (!analytics) {
        return c.json({ error: 'Analytics not found' }, 404);
      }

      setCacheHeaders(c, { maxAge: 600, etag: `analytics-${userId}-${Date.now()}` });
      
      return c.json({
        success: true,
        data: analytics,
      });
    } catch (error) {
      console.error('Error fetching analytics:', error);
      return c.json({ error: 'Internal server error' }, 500);
    }
  }
);

// ======================
// CREATE ENDPOINTS
// ======================

/**
 * POST / - Create new customer profile
 * For user registration and onboarding
 */
app.post('/',
  requireRole(['customer', 'admin']),
  zValidator('json', createProfileSchema),
  async (c) => {
    try {
      const userData = c.req.valid('json');
      
      const service = createProfileService(c);
      const result = await service.createCustomerProfile(userData);
      
      // Clear user's cache after profile creation
      const cacheKey = `profile:${result.userId}`;
      await c.env.CACHE.delete(cacheKey);
      
      return c.json({
        success: true,
        data: {
          userId: result.userId,
          customerNumber: result.customerNumber,
          profile: result.profile,
        },
      }, 201);
    } catch (error) {
      console.error('Error creating profile:', error);
      return c.json({ error: 'Internal server error' }, 500);
    }
  }
);

// ======================
// UPDATE ENDPOINTS
// ======================

/**
 * PATCH / - Update basic profile information
 * Most common update operation - optimized for speed
 */
app.patch('/',
  requireRole(['customer', 'admin']),
  zValidator('json', updateProfileSchema),
  async (c) => {
    try {
      const userId = c.get('user').id;
      const updateData = c.req.valid('json');
      
      const service = createProfileService(c);
      const result = await service.updateBasicInfo(userId, updateData);
      
      // Clear user's cache after update
      const cacheKeys = [
        `profile:${userId}`,
        `full-profile:${userId}`,
        `analytics:${userId}`,
      ];
      
      await Promise.all(cacheKeys.map(key => c.env.CACHE.delete(key)));
      
      return c.json({
        success: true,
        data: result,
        message: 'Profile updated successfully',
      });
    } catch (error) {
      console.error('Error updating profile:', error);
      return c.json({ error: 'Internal server error' }, 500);
    }
  }
);

/**
 * PATCH /profile/preferences - Update user preferences
 * Optimized for JSON field updates
 */
app.patch('/preferences',
  requireRole(['customer', 'admin']),
  zValidator('json', z.object({
    preferences: z.object({}).passthrough(),
  })),
  async (c) => {
    try {
      const userId = c.get('user').id;
      const { preferences } = c.req.valid('json');
      
      const service = createProfileService(c);
      await service.updatePreferences(userId, preferences);
      
      // Clear relevant cache
      await c.env.CACHE.delete(`profile:${userId}`);
      
      return c.json({
        success: true,
        message: 'Preferences updated successfully',
      });
    } catch (error) {
      console.error('Error updating preferences:', error);
      return c.json({ error: 'Internal server error' }, 500);
    }
  }
);

/**
 * POST /profile/analytics - Update analytics (internal use)
 * Called by order completion webhooks
 */
app.post('/analytics',
  requireRole(['admin']), // Only admin can update analytics
  zValidator('json', z.object({
    userId: z.string(),
    amount: z.number().positive(),
    isFirstPurchase: z.boolean().optional(),
  })),
  async (c) => {
    try {
      const user = c.get('user');
      
      // Only admins or system can update analytics
      if (user.role !== 'admin') {
        return c.json({ error: 'Unauthorized' }, 403);
      }
      
      const { userId, amount, isFirstPurchase } = c.req.valid('json');
      
      await CustomerProfileService.updateAnalytics(userId, {
        amount,
        isFirstPurchase,
      });
      
      // Update customer segment based on new analytics
      await CustomerProfileService.updateSegment(userId);
      
      // Clear analytics cache
      const cacheKeys = [
        `analytics:${userId}`,
        `full-profile:${userId}`,
      ];
      
      await Promise.all(cacheKeys.map(key => c.env.CACHE.delete(key)));
      
      return c.json({
        success: true,
        message: 'Analytics updated successfully',
      });
    } catch (error) {
      console.error('Error updating analytics:', error);
      return c.json({ error: 'Internal server error' }, 500);
    }
  }
);

// ======================
// DELETE ENDPOINTS
// ======================

/**
 * DELETE /profile - Soft delete profile (anonymize)
 * Default deletion method for GDPR compliance
 */
app.delete('/',
  requireRole(['customer', 'admin']),
  async (c) => {
    try {
      const userId = c.get('user').id;
      
      const result = await CustomerProfileService.softDeleteProfile(userId);
      
      // Clear all user cache
      const cacheKeys = [
        `profile:${userId}`,
        `full-profile:${userId}`,
        `analytics:${userId}`,
      ];
      
      await Promise.all(cacheKeys.map(key => c.env.CACHE.delete(key)));
      
      return c.json({
        success: true,
        data: result,
        message: 'Profile anonymized successfully',
      });
    } catch (error) {
      console.error('Error deleting profile:', error);
      return c.json({ error: 'Internal server error' }, 500);
    }
  }
);

/**
 * DELETE /profile/hard - Hard delete profile (GDPR)
 * Complete data removal - requires admin permission
 */
app.delete('/hard',
  requireRole(['customer', 'admin']),
  zValidator('json', z.object({
    confirmEmail: z.string().email(),
    reason: z.string().min(1).max(200),
  })),
  async (c) => {
    try {
      const user = c.get('user');
      const { confirmEmail, reason } = c.req.valid('json');
      
      // Verify email matches
      if (confirmEmail !== user.email) {
        return c.json({ error: 'Email confirmation does not match' }, 400);
      }
      
      // Log deletion request for audit
      console.log(`Hard delete requested for user ${user.id}. Reason: ${reason}`);
      
      const result = await CustomerProfileService.hardDeleteProfile(user.id);
      
      // Clear all cache
      const cacheKeys = [
        `profile:${user.id}`,
        `full-profile:${user.id}`,
        `analytics:${user.id}`,
      ];
      
      await Promise.all(cacheKeys.map(key => c.env.CACHE.delete(key)));
      
      return c.json({
        success: true,
        data: result,
        message: 'Profile permanently deleted',
      });
    } catch (error) {
      console.error('Error hard deleting profile:', error);
      return c.json({ error: 'Internal server error' }, 500);
    }
  }
);

// ======================
// ADMIN ENDPOINTS
// ======================

/**
 * POST /profile/batch - Batch update profiles (admin only)
 * For bulk operations and data migrations
 */
app.post('/batch',
  requireRole(['admin']), // Only admin for batch operations
  zValidator('json', batchUpdateSchema),
  async (c) => {
    try {
      const user = c.get('user');
      
      if (user.role !== 'admin') {
        return c.json({ error: 'Admin access required' }, 403);
      }
      
      const { updates } = c.req.valid('json');
      
      const result = await CustomerProfileService.batchUpdateProfiles(updates);
      
      // Clear cache for all affected users
      const cacheKeys: string[] = [];
      updates.forEach(update => {
        cacheKeys.push(
          `profile:${update.userId}`,
          `full-profile:${update.userId}`,
          `analytics:${update.userId}`
        );
      });
      
      await Promise.all(cacheKeys.map(key => c.env.CACHE.delete(key)));
      
      return c.json({
        success: true,
        data: result,
        message: `Batch updated ${updates.length} profiles`,
      });
    } catch (error) {
      console.error('Error batch updating profiles:', error);
      return c.json({ error: 'Internal server error' }, 500);
    }
  }
);

/**
 * GET /profile/:userId/admin - Admin view of any profile
 * For customer service and support
 */
app.get('/:userId/admin',
  requireRole(['admin']), // Only admin can view other users' profiles
  async (c) => {
    try {
      const user = c.get('user');
      
      if (user.role !== 'admin') {
        return c.json({ error: 'Admin access required' }, 403);
      }
      
      const userId = c.req.param('userId');
      
      const service = createProfileService(c);
      const profile = await service.getFullProfile(userId);
      
      if (!profile) {
        return c.json({ error: 'Profile not found' }, 404);
      }
      
      return c.json({
        success: true,
        data: profile,
      });
    } catch (error) {
      console.error('Error fetching admin profile:', error);
      return c.json({ error: 'Internal server error' }, 500);
    }
  }
);

// ======================
// HEALTH & DIAGNOSTICS
// ======================

/**
 * GET /profile/health - Health check for profile service
 */
app.get('/health', async (c) => {
  try {
    // Simple health check - verify database connection
    const startTime = Date.now();
    
    // This will fail if database is unavailable
    const service = createProfileService(c);
    await service.generateCustomerNumber();
    
    const responseTime = Date.now() - startTime;
    
    return c.json({
      status: 'healthy',
      service: 'customer-profile',
      responseTime: `${responseTime}ms`,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Health check failed:', error);
    return c.json({
      status: 'unhealthy',
      service: 'customer-profile',
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString(),
    }, 503);
  }
});

export { app as customerProfileRoutes };
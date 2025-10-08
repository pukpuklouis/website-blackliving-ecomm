import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';
import type { D1Database } from '@cloudflare/workers-types';
import { CustomerProfileService } from '@blackliving/db/customer-profile-service';
import { requireAuth, requireCustomer, requireRole } from '../middleware/auth';
import { cacheMiddleware, setCacheHeaders } from '../middleware/cache';
import { customerAddresses } from '@blackliving/db/schema';
import { eq, and, desc } from 'drizzle-orm';
import type {
  ApiResponse,
  BasicProfile,
  ExtendedProfile,
  ProfileAnalytics,
  CustomerAddress,
  ProfileUpdateRequest,
  AddressCreateRequest,
} from '@blackliving/types/profile';
import { createId } from '@paralleldrive/cuid2';

// Validation schemas
const updateProfileSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  phone: z
    .string()
    .regex(/^09\d{8}$/)
    .optional(), // Taiwan mobile format
  birthday: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .optional(),
  gender: z.enum(['male', 'female', 'other']).optional(),
  contactPreference: z.enum(['email', 'phone', 'sms']).optional(),
  notes: z.string().max(500).optional(),
  preferences: z.object({}).passthrough().optional(),
});

const createProfileSchema = z.object({
  name: z.string().min(1).max(100),
  email: z.string().email(),
  phone: z
    .string()
    .regex(/^09\d{8}$/)
    .optional(),
  birthday: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .optional(),
  gender: z.enum(['male', 'female', 'other']).optional(),
  source: z.string().max(50).optional(),
  preferences: z.object({}).passthrough().optional(),
});

const batchUpdateSchema = z.object({
  updates: z
    .array(
      z.object({
        userId: z.string(),
        data: updateProfileSchema,
      })
    )
    .max(100), // Limit batch size
});

// Address validation schemas
const createAddressSchema = z.object({
  type: z.enum(['shipping', 'billing', 'both']).default('shipping'),
  label: z.string().optional(),
  recipientName: z.string().min(1).max(100),
  recipientPhone: z.string().regex(/^09\d{8}$/), // Taiwan mobile format
  city: z.string().min(1),
  district: z.string().min(1),
  postalCode: z.string().regex(/^\d{3,5}$/), // Taiwan postal code
  street: z.string().min(1),
  building: z.string().optional(),
  floor: z.string().optional(),
  room: z.string().optional(),
  deliveryInstructions: z.string().max(500).optional(),
  accessCode: z.string().optional(),
  isDefault: z.boolean().default(false),
});

const updateAddressSchema = createAddressSchema.partial();

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

// Helper function to create consistent ETags based on data hash instead of timestamp
function generateETag(data: any, userId: string): string {
  const hash = JSON.stringify(data)
    .split('')
    .reduce((a, b) => {
      a = (a << 5) - a + b.charCodeAt(0);
      return a & a;
    }, 0);
  return `"${userId}-${Math.abs(hash)}"`;
}

// Helper function for production logging
function logRequest(c: any, action: string, details?: any) {
  const requestId = c.req.header('x-request-id') || createId();
  const userId = c.get('user')?.id;
  const timestamp = new Date().toISOString();

  console.log(
    JSON.stringify({
      timestamp,
      requestId,
      userId,
      action,
      details,
      userAgent: c.req.header('user-agent'),
      ip: c.req.header('cf-connecting-ip') || c.req.header('x-forwarded-for'),
    })
  );

  return requestId;
}

// Helper function for error response
function createErrorResponse(message: string, code = 'INTERNAL_ERROR', status = 500): ApiResponse {
  return {
    success: false,
    error: message,
    timestamp: new Date().toISOString(),
  };
}

// Helper function to create database instance
function createDB(c: any) {
  const { createDB } = require('@blackliving/db');
  return createDB(c.env.DB);
}

// ======================
// READ ENDPOINTS
// ======================

/**
 * GET / - Get basic profile (most common)
 * Optimized with caching for high-frequency access
 */
app.get(
  '/',
  requireRole(['customer', 'admin']),
  cacheMiddleware({ ttl: 300 }), // 5 minute cache
  async (c) => {
    const requestId = logRequest(c, 'GET_BASIC_PROFILE');
    try {
      const userId = c.get('user').id;

      const service = createProfileService(c);
      const profile = await service.getBasicProfile(userId);

      if (!profile) {
        logRequest(c, 'PROFILE_NOT_FOUND', { userId, requestId });
        return c.json(createErrorResponse('Profile not found', 'PROFILE_NOT_FOUND'), 404);
      }

      // Generate consistent ETag based on profile data
      const etag = generateETag(profile, userId);
      setCacheHeaders(c, { maxAge: 300, etag });

      logRequest(c, 'PROFILE_FETCHED_SUCCESS', { userId, requestId, cacheHit: false });

      return c.json({
        success: true,
        data: profile,
        timestamp: new Date().toISOString(),
        requestId,
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      logRequest(c, 'PROFILE_FETCH_ERROR', { error: errorMessage, requestId });
      return c.json(createErrorResponse('Failed to fetch profile'), 500);
    }
  }
);

/**
 * GET /full - Get complete profile with analytics
 * For account dashboard and detailed views
 */
app.get(
  '/full',
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
app.get(
  '/analytics',
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
app.post(
  '/',
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

      return c.json(
        {
          success: true,
          data: {
            userId: result.userId,
            customerNumber: result.customerNumber,
            profile: result.profile,
          },
        },
        201
      );
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
app.patch(
  '/',
  requireRole(['customer', 'admin']),
  zValidator('json', updateProfileSchema),
  async (c) => {
    const requestId = logRequest(c, 'UPDATE_PROFILE_START');
    try {
      const userId = c.get('user').id;
      const updateData = c.req.valid('json');

      logRequest(c, 'UPDATE_PROFILE_DATA', {
        userId,
        updateData: Object.keys(updateData),
        requestId,
      });

      const service = createProfileService(c);

      // Get current profile for comparison
      const beforeProfile = await service.getBasicProfile(userId);

      const result = await service.updateBasicInfo(userId, updateData);

      // Clear user's cache after update
      const cacheKeys = [`profile:${userId}`, `full-profile:${userId}`, `analytics:${userId}`];
      const cacheDelResults = await Promise.allSettled(
        cacheKeys.map((key) => c.env.CACHE.delete(key))
      );

      // Log cache deletion results
      cacheDelResults.forEach((result, index) => {
        if (result.status === 'rejected') {
          logRequest(c, 'CACHE_DELETE_ERROR', {
            key: cacheKeys[index],
            error: result.reason,
            requestId,
          });
        }
      });

      // Get updated profile to verify changes
      const afterProfile = await service.getBasicProfile(userId);

      logRequest(c, 'UPDATE_PROFILE_SUCCESS', {
        userId,
        requestId,
        changedFields: Object.keys(updateData),
        beforeData: beforeProfile ? { name: beforeProfile.name, phone: beforeProfile.phone } : null,
        afterData: afterProfile ? { name: afterProfile.name, phone: afterProfile.phone } : null,
      });

      return c.json({
        success: true,
        data: result,
        message: 'Profile updated successfully',
        timestamp: new Date().toISOString(),
        requestId,
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      logRequest(c, 'UPDATE_PROFILE_ERROR', { error: errorMessage, requestId });
      return c.json(createErrorResponse('Failed to update profile'), 500);
    }
  }
);

/**
 * PATCH /profile/preferences - Update user preferences
 * Optimized for JSON field updates
 */
app.patch(
  '/preferences',
  requireRole(['customer', 'admin']),
  zValidator(
    'json',
    z.object({
      preferences: z.object({}).passthrough(),
    })
  ),
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
app.post(
  '/analytics',
  requireRole(['admin']), // Only admin can update analytics
  zValidator(
    'json',
    z.object({
      userId: z.string(),
      amount: z.number().positive(),
      isFirstPurchase: z.boolean().optional(),
    })
  ),
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
      const cacheKeys = [`analytics:${userId}`, `full-profile:${userId}`];

      await Promise.all(cacheKeys.map((key) => c.env.CACHE.delete(key)));

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
app.delete('/', requireRole(['customer', 'admin']), async (c) => {
  try {
    const userId = c.get('user').id;

    const result = await CustomerProfileService.softDeleteProfile(userId);

    // Clear all user cache
    const cacheKeys = [`profile:${userId}`, `full-profile:${userId}`, `analytics:${userId}`];

    await Promise.all(cacheKeys.map((key) => c.env.CACHE.delete(key)));

    return c.json({
      success: true,
      data: result,
      message: 'Profile anonymized successfully',
    });
  } catch (error) {
    console.error('Error deleting profile:', error);
    return c.json({ error: 'Internal server error' }, 500);
  }
});

/**
 * DELETE /profile/hard - Hard delete profile (GDPR)
 * Complete data removal - requires admin permission
 */
app.delete(
  '/hard',
  requireRole(['customer', 'admin']),
  zValidator(
    'json',
    z.object({
      confirmEmail: z.string().email(),
      reason: z.string().min(1).max(200),
    })
  ),
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
      const cacheKeys = [`profile:${user.id}`, `full-profile:${user.id}`, `analytics:${user.id}`];

      await Promise.all(cacheKeys.map((key) => c.env.CACHE.delete(key)));

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
app.post(
  '/batch',
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
      updates.forEach((update) => {
        cacheKeys.push(
          `profile:${update.userId}`,
          `full-profile:${update.userId}`,
          `analytics:${update.userId}`
        );
      });

      await Promise.all(cacheKeys.map((key) => c.env.CACHE.delete(key)));

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
app.get(
  '/:userId/admin',
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
    return c.json(
      {
        status: 'unhealthy',
        service: 'customer-profile',
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString(),
      },
      503
    );
  }
});

// ======================
// ADDRESS ENDPOINTS
// ======================

/**
 * GET /addresses - Get user's addresses
 */
app.get(
  '/addresses',
  requireRole(['customer', 'admin']),
  cacheMiddleware({ ttl: 180 }), // 3 minute cache
  async (c) => {
    try {
      const userId = c.get('user').id;
      const db = createDB(c);

      const addresses = await db
        .select()
        .from(customerAddresses)
        .where(and(eq(customerAddresses.userId, userId), eq(customerAddresses.isActive, true)))
        .orderBy(desc(customerAddresses.isDefault), desc(customerAddresses.lastUsedAt));

      setCacheHeaders(c, { maxAge: 180, etag: `addresses-${userId}-${Date.now()}` });

      return c.json({
        success: true,
        data: addresses,
      });
    } catch (error) {
      console.error('Error fetching addresses:', error);
      return c.json({ error: 'Internal server error' }, 500);
    }
  }
);

/**
 * POST /addresses - Create new address
 */
app.post(
  '/addresses',
  requireRole(['customer', 'admin']),
  zValidator('json', createAddressSchema),
  async (c) => {
    try {
      const userId = c.get('user').id;
      const addressData = c.req.valid('json');
      const db = createDB(c);

      const now = new Date();

      // If setting as default, remove default from other addresses
      if (addressData.isDefault) {
        await db
          .update(customerAddresses)
          .set({ isDefault: false, updatedAt: now })
          .where(and(eq(customerAddresses.userId, userId), eq(customerAddresses.isDefault, true)));
      }

      // Create new address
      const [newAddress] = await db
        .insert(customerAddresses)
        .values({
          userId,
          type: addressData.type,
          label: addressData.label,
          recipientName: addressData.recipientName,
          recipientPhone: addressData.recipientPhone,
          city: addressData.city,
          district: addressData.district,
          postalCode: addressData.postalCode,
          street: addressData.street,
          building: addressData.building,
          floor: addressData.floor,
          room: addressData.room,
          deliveryInstructions: addressData.deliveryInstructions,
          accessCode: addressData.accessCode,
          isDefault: addressData.isDefault,
          isActive: true,
          usageCount: 0,
          createdAt: now,
          updatedAt: now,
        })
        .returning();

      // Clear user's cache
      const cacheKey = `addresses:${userId}`;
      await c.env.CACHE.delete(cacheKey);

      return c.json(
        {
          success: true,
          data: newAddress,
          message: 'Address created successfully',
        },
        201
      );
    } catch (error) {
      console.error('Error creating address:', error);
      return c.json({ error: 'Internal server error' }, 500);
    }
  }
);

/**
 * PATCH /addresses/:id - Update address
 */
app.patch(
  '/addresses/:id',
  requireRole(['customer', 'admin']),
  zValidator('json', updateAddressSchema),
  async (c) => {
    try {
      const userId = c.get('user').id;
      const addressId = c.req.param('id');
      const updateData = c.req.valid('json');
      const db = createDB(c);

      const now = new Date();

      // Verify address belongs to user
      const existingAddress = await db
        .select()
        .from(customerAddresses)
        .where(
          and(
            eq(customerAddresses.id, addressId),
            eq(customerAddresses.userId, userId),
            eq(customerAddresses.isActive, true)
          )
        )
        .limit(1);

      if (existingAddress.length === 0) {
        return c.json({ error: 'Address not found' }, 404);
      }

      // If setting as default, remove default from other addresses
      if (updateData.isDefault) {
        await db
          .update(customerAddresses)
          .set({ isDefault: false, updatedAt: now })
          .where(and(eq(customerAddresses.userId, userId), eq(customerAddresses.isDefault, true)));
      }

      // Update address
      const [updatedAddress] = await db
        .update(customerAddresses)
        .set({
          ...updateData,
          updatedAt: now,
        })
        .where(eq(customerAddresses.id, addressId))
        .returning();

      // Clear user's cache
      const cacheKey = `addresses:${userId}`;
      await c.env.CACHE.delete(cacheKey);

      return c.json({
        success: true,
        data: updatedAddress,
        message: 'Address updated successfully',
      });
    } catch (error) {
      console.error('Error updating address:', error);
      return c.json({ error: 'Internal server error' }, 500);
    }
  }
);

/**
 * DELETE /addresses/:id - Delete address
 */
app.delete('/addresses/:id', requireRole(['customer', 'admin']), async (c) => {
  try {
    const userId = c.get('user').id;
    const addressId = c.req.param('id');
    const db = createDB(c);

    // Verify address belongs to user
    const existingAddress = await db
      .select()
      .from(customerAddresses)
      .where(
        and(
          eq(customerAddresses.id, addressId),
          eq(customerAddresses.userId, userId),
          eq(customerAddresses.isActive, true)
        )
      )
      .limit(1);

    if (existingAddress.length === 0) {
      return c.json({ error: 'Address not found' }, 404);
    }

    // Soft delete - set as inactive
    await db
      .update(customerAddresses)
      .set({
        isActive: false,
        isDefault: false,
        updatedAt: new Date(),
      })
      .where(eq(customerAddresses.id, addressId));

    // Clear user's cache
    const cacheKey = `addresses:${userId}`;
    await c.env.CACHE.delete(cacheKey);

    return c.json({
      success: true,
      message: 'Address deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting address:', error);
    return c.json({ error: 'Internal server error' }, 500);
  }
});

/**
 * PATCH /addresses/:id/default - Set address as default
 */
app.patch('/addresses/:id/default', requireRole(['customer', 'admin']), async (c) => {
  try {
    const userId = c.get('user').id;
    const addressId = c.req.param('id');
    const db = createDB(c);

    const now = new Date();

    // Verify address belongs to user
    const existingAddress = await db
      .select()
      .from(customerAddresses)
      .where(
        and(
          eq(customerAddresses.id, addressId),
          eq(customerAddresses.userId, userId),
          eq(customerAddresses.isActive, true)
        )
      )
      .limit(1);

    if (existingAddress.length === 0) {
      return c.json({ error: 'Address not found' }, 404);
    }

    // Remove default from all user's addresses
    await db
      .update(customerAddresses)
      .set({ isDefault: false, updatedAt: now })
      .where(and(eq(customerAddresses.userId, userId), eq(customerAddresses.isDefault, true)));

    // Set this address as default
    const [updatedAddress] = await db
      .update(customerAddresses)
      .set({
        isDefault: true,
        lastUsedAt: now,
        updatedAt: now,
      })
      .where(eq(customerAddresses.id, addressId))
      .returning();

    // Clear user's cache
    const cacheKey = `addresses:${userId}`;
    await c.env.CACHE.delete(cacheKey);

    return c.json({
      success: true,
      data: updatedAddress,
      message: 'Default address updated successfully',
    });
  } catch (error) {
    console.error('Error setting default address:', error);
    return c.json({ error: 'Internal server error' }, 500);
  }
});

export { app as customerProfileRoutes };

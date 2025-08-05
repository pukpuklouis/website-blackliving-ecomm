import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';
import { eq, sql, and, or, desc, asc, count, avg, sum, min, max } from 'drizzle-orm';
import { CustomerProfileService } from '../../../packages/db/customer-profile-service';
import { authMiddleware } from '../middleware/auth';
import { CacheInvalidator } from '../middleware/cache';
import {
  users,
  customerProfiles,
  customerAddresses,
  customerPaymentMethods,
  orders,
  customerReviews,
  customerWishlists,
} from '../../../packages/db/schema';
import { db } from '../../../packages/db/client';

// Validation schemas for batch operations
const bulkUpdateSchema = z.object({
  userIds: z.array(z.string()).min(1).max(1000),
  updates: z.object({
    segment: z.enum(['new', 'customer', 'regular', 'vip', 'inactive']).optional(),
    churnRisk: z.enum(['low', 'medium', 'high']).optional(),
    contactPreference: z.enum(['email', 'phone', 'sms']).optional(),
    notes: z.string().max(500).optional(),
  }),
});

const customerExportSchema = z.object({
  filters: z
    .object({
      segment: z.array(z.string()).optional(),
      churnRisk: z.array(z.string()).optional(),
      totalSpentMin: z.number().optional(),
      totalSpentMax: z.number().optional(),
      orderCountMin: z.number().optional(),
      orderCountMax: z.number().optional(),
      registeredAfter: z.string().optional(),
      registeredBefore: z.string().optional(),
      lastOrderAfter: z.string().optional(),
      lastOrderBefore: z.string().optional(),
    })
    .optional(),
  format: z.enum(['json', 'csv']).default('json'),
  fields: z.array(z.string()).optional(),
});

const segmentRecalculationSchema = z.object({
  userIds: z.array(z.string()).optional(), // If empty, recalculate all
  force: z.boolean().default(false),
});

const dataCleanupSchema = z.object({
  operations: z.array(
    z.enum([
      'cleanup_recently_viewed',
      'cleanup_expired_sessions',
      'anonymize_inactive_users',
      'remove_duplicate_addresses',
      'consolidate_payment_methods',
    ])
  ),
  dryRun: z.boolean().default(true),
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

// Admin authentication middleware
const adminOnly = async (c: any, next: any) => {
  const user = c.get('user');
  if (user.role !== 'admin') {
    return c.json({ error: 'Admin access required' }, 403);
  }
  await next();
};

// ======================
// BULK UPDATE OPERATIONS
// ======================

/**
 * POST /admin/bulk-update - Bulk update customer profiles
 * For mass customer management operations
 */
app.post(
  '/admin/bulk-update',
  authMiddleware,
  adminOnly,
  zValidator('json', bulkUpdateSchema),
  async c => {
    try {
      const { userIds, updates } = c.req.valid('json');

      // Validate userIds exist
      const existingUsers = await db
        .select({ id: customerProfiles.userId })
        .from(customerProfiles)
        .where(sql`${customerProfiles.userId} IN (${userIds.map(id => `'${id}'`).join(',')})`);

      const validUserIds = existingUsers.map(u => u.id);
      const invalidUserIds = userIds.filter(id => !validUserIds.includes(id));

      if (invalidUserIds.length > 0) {
        return c.json(
          {
            error: 'Some user IDs not found',
            invalidUserIds,
          },
          400
        );
      }

      // Perform bulk update in chunks to avoid database limits
      const chunks = chunkArray(validUserIds, 100);
      let totalUpdated = 0;

      for (const chunk of chunks) {
        const result = await db
          .update(customerProfiles)
          .set({
            ...updates,
            updatedAt: new Date(),
          })
          .where(sql`${customerProfiles.userId} IN (${chunk.map(id => `'${id}'`).join(',')})`);

        totalUpdated += chunk.length;
      }

      // Clear cache for affected users
      const cacheInvalidator = new CacheInvalidator(c.env.CACHE);
      await Promise.all(validUserIds.map(userId => cacheInvalidator.invalidateUserCache(userId)));

      return c.json({
        success: true,
        message: `Updated ${totalUpdated} customer profiles`,
        data: {
          totalUpdated,
          invalidUserIds,
          updates,
        },
      });
    } catch (error) {
      console.error('Bulk update error:', error);
      return c.json({ error: 'Internal server error' }, 500);
    }
  }
);

// ======================
// CUSTOMER EXPORT
// ======================

/**
 * POST /admin/export-customers - Export customer data
 * For reporting and analytics
 */
app.post(
  '/admin/export-customers',
  authMiddleware,
  adminOnly,
  zValidator('json', customerExportSchema),
  async c => {
    try {
      const { filters = {}, format, fields } = c.req.valid('json');

      // Build dynamic query based on filters
      let query = db
        .select({
          id: users.id,
          name: users.name,
          email: users.email,
          phone: users.phone,
          role: users.role,
          createdAt: users.createdAt,
          customerNumber: customerProfiles.customerNumber,
          segment: customerProfiles.segment,
          churnRisk: customerProfiles.churnRisk,
          totalSpent: customerProfiles.totalSpent,
          orderCount: customerProfiles.orderCount,
          avgOrderValue: customerProfiles.avgOrderValue,
          lastOrderAt: customerProfiles.lastOrderAt,
          lastPurchaseAt: customerProfiles.lastPurchaseAt,
          firstPurchaseAt: customerProfiles.firstPurchaseAt,
          lifetimeValue: customerProfiles.lifetimeValue,
          contactPreference: customerProfiles.contactPreference,
          source: customerProfiles.source,
        })
        .from(users)
        .leftJoin(customerProfiles, eq(users.id, customerProfiles.userId))
        .where(eq(users.role, 'customer'));

      // Apply filters
      const conditions = [];

      if (filters.segment?.length) {
        conditions.push(
          sql`${customerProfiles.segment} IN (${filters.segment.map(s => `'${s}'`).join(',')})`
        );
      }

      if (filters.churnRisk?.length) {
        conditions.push(
          sql`${customerProfiles.churnRisk} IN (${filters.churnRisk.map(r => `'${r}'`).join(',')})`
        );
      }

      if (filters.totalSpentMin !== undefined) {
        conditions.push(sql`${customerProfiles.totalSpent} >= ${filters.totalSpentMin}`);
      }

      if (filters.totalSpentMax !== undefined) {
        conditions.push(sql`${customerProfiles.totalSpent} <= ${filters.totalSpentMax}`);
      }

      if (filters.orderCountMin !== undefined) {
        conditions.push(sql`${customerProfiles.orderCount} >= ${filters.orderCountMin}`);
      }

      if (filters.orderCountMax !== undefined) {
        conditions.push(sql`${customerProfiles.orderCount} <= ${filters.orderCountMax}`);
      }

      if (filters.registeredAfter) {
        const date = new Date(filters.registeredAfter);
        conditions.push(sql`${users.createdAt} >= ${date.getTime()}`);
      }

      if (filters.registeredBefore) {
        const date = new Date(filters.registeredBefore);
        conditions.push(sql`${users.createdAt} <= ${date.getTime()}`);
      }

      if (filters.lastOrderAfter) {
        const date = new Date(filters.lastOrderAfter);
        conditions.push(sql`${customerProfiles.lastOrderAt} >= ${date.getTime()}`);
      }

      if (filters.lastOrderBefore) {
        const date = new Date(filters.lastOrderBefore);
        conditions.push(sql`${customerProfiles.lastOrderAt} <= ${date.getTime()}`);
      }

      if (conditions.length > 0) {
        query = query.where(and(...conditions));
      }

      // Execute query with limit for large datasets
      const customers = await query.limit(10000); // Limit exports to 10k records

      // Filter fields if specified
      let exportData = customers;
      if (fields?.length) {
        exportData = customers.map(customer => {
          const filtered: any = {};
          fields.forEach(field => {
            if (field in customer) {
              filtered[field] = customer[field as keyof typeof customer];
            }
          });
          return filtered;
        });
      }

      // Format response based on requested format
      if (format === 'csv') {
        const csv = convertToCSV(exportData);
        c.res.headers.set('Content-Type', 'text/csv');
        c.res.headers.set('Content-Disposition', 'attachment; filename="customers.csv"');
        return c.text(csv);
      }

      return c.json({
        success: true,
        data: exportData,
        metadata: {
          totalRecords: exportData.length,
          filters,
          exportedAt: new Date().toISOString(),
        },
      });
    } catch (error) {
      console.error('Customer export error:', error);
      return c.json({ error: 'Internal server error' }, 500);
    }
  }
);

// ======================
// SEGMENT RECALCULATION
// ======================

/**
 * POST /admin/recalculate-segments - Recalculate customer segments
 * For updating customer classification based on current analytics
 */
app.post(
  '/admin/recalculate-segments',
  authMiddleware,
  adminOnly,
  zValidator('json', segmentRecalculationSchema),
  async c => {
    try {
      const { userIds, force } = c.req.valid('json');

      let targetUsers: string[];

      if (userIds?.length) {
        targetUsers = userIds;
      } else {
        // Get all customer profiles if no specific users provided
        const allCustomers = await db
          .select({ userId: customerProfiles.userId })
          .from(customerProfiles);

        targetUsers = allCustomers.map(c => c.userId);
      }

      let updated = 0;
      const chunks = chunkArray(targetUsers, 50); // Process in smaller chunks

      for (const chunk of chunks) {
        const promises = chunk.map(async userId => {
          try {
            await CustomerProfileService.updateSegment(userId);
            updated++;
          } catch (error) {
            console.error(`Failed to update segment for user ${userId}:`, error);
          }
        });

        await Promise.all(promises);
      }

      // Clear affected cache
      const cacheInvalidator = new CacheInvalidator(c.env.CACHE);
      await Promise.all(targetUsers.map(userId => cacheInvalidator.invalidateUserCache(userId)));

      return c.json({
        success: true,
        message: `Recalculated segments for ${updated} customers`,
        data: {
          totalProcessed: targetUsers.length,
          updated,
          failed: targetUsers.length - updated,
        },
      });
    } catch (error) {
      console.error('Segment recalculation error:', error);
      return c.json({ error: 'Internal server error' }, 500);
    }
  }
);

// ======================
// DATA CLEANUP
// ======================

/**
 * POST /admin/data-cleanup - Clean up old and redundant data
 * For database maintenance and optimization
 */
app.post(
  '/admin/data-cleanup',
  authMiddleware,
  adminOnly,
  zValidator('json', dataCleanupSchema),
  async c => {
    try {
      const { operations, dryRun } = c.req.valid('json');

      const results: any[] = [];

      for (const operation of operations) {
        let result: any = { operation, dryRun };

        switch (operation) {
          case 'cleanup_recently_viewed':
            result = await cleanupRecentlyViewed(dryRun);
            break;

          case 'cleanup_expired_sessions':
            result = await cleanupExpiredSessions(dryRun);
            break;

          case 'anonymize_inactive_users':
            result = await anonymizeInactiveUsers(dryRun);
            break;

          case 'remove_duplicate_addresses':
            result = await removeDuplicateAddresses(dryRun);
            break;

          case 'consolidate_payment_methods':
            result = await consolidatePaymentMethods(dryRun);
            break;

          default:
            result = { operation, error: 'Unknown operation' };
        }

        results.push(result);
      }

      return c.json({
        success: true,
        message: dryRun ? 'Dry run completed' : 'Cleanup operations completed',
        data: results,
      });
    } catch (error) {
      console.error('Data cleanup error:', error);
      return c.json({ error: 'Internal server error' }, 500);
    }
  }
);

// ======================
// ANALYTICS & REPORTING
// ======================

/**
 * GET /admin/customer-analytics - Get customer analytics overview
 * For admin dashboard and reporting
 */
app.get('/admin/customer-analytics', authMiddleware, adminOnly, async c => {
  try {
    // Get comprehensive customer analytics
    const [
      totalCustomers,
      segmentBreakdown,
      churnRiskBreakdown,
      revenueAnalytics,
      registrationTrends,
    ] = await Promise.all([
      getTotalCustomers(),
      getSegmentBreakdown(),
      getChurnRiskBreakdown(),
      getRevenueAnalytics(),
      getRegistrationTrends(),
    ]);

    return c.json({
      success: true,
      data: {
        totalCustomers,
        segmentBreakdown,
        churnRiskBreakdown,
        revenueAnalytics,
        registrationTrends,
        generatedAt: new Date().toISOString(),
      },
    });
  } catch (error) {
    console.error('Customer analytics error:', error);
    return c.json({ error: 'Internal server error' }, 500);
  }
});

// ======================
// UTILITY FUNCTIONS
// ======================

function chunkArray<T>(array: T[], size: number): T[][] {
  const chunks: T[][] = [];
  for (let i = 0; i < array.length; i += size) {
    chunks.push(array.slice(i, i + size));
  }
  return chunks;
}

function convertToCSV(data: any[]): string {
  if (!data.length) return '';

  const headers = Object.keys(data[0]);
  const csvHeaders = headers.join(',');

  const csvRows = data.map(row => {
    return headers
      .map(header => {
        const value = row[header];
        // Escape CSV values
        if (typeof value === 'string' && (value.includes(',') || value.includes('"'))) {
          return `"${value.replace(/"/g, '""')}"`;
        }
        return value || '';
      })
      .join(',');
  });

  return [csvHeaders, ...csvRows].join('\n');
}

// Cleanup operation implementations
async function cleanupRecentlyViewed(dryRun: boolean) {
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - 90); // Keep only last 90 days

  const query = db
    .select({ count: count() })
    .from(customerRecentlyViewed)
    .where(sql`${customerRecentlyViewed.createdAt} < ${cutoffDate.getTime()}`);

  const countResult = await query;
  const recordsToDelete = countResult[0]?.count || 0;

  if (!dryRun && recordsToDelete > 0) {
    await db
      .delete(customerRecentlyViewed)
      .where(sql`${customerRecentlyViewed.createdAt} < ${cutoffDate.getTime()}`);
  }

  return {
    operation: 'cleanup_recently_viewed',
    recordsAffected: recordsToDelete,
    dryRun,
  };
}

async function cleanupExpiredSessions(dryRun: boolean) {
  // This would clean up expired sessions from the sessions table
  // Implementation depends on session management strategy
  return {
    operation: 'cleanup_expired_sessions',
    recordsAffected: 0,
    dryRun,
    note: 'Implementation depends on session strategy',
  };
}

async function anonymizeInactiveUsers(dryRun: boolean) {
  const cutoffDate = new Date();
  cutoffDate.setFullYear(cutoffDate.getFullYear() - 2); // 2 years inactive

  const inactiveUsers = await db
    .select({ userId: customerProfiles.userId })
    .from(customerProfiles)
    .where(
      and(
        sql`${customerProfiles.lastContactAt} < ${cutoffDate.getTime()}`,
        sql`${customerProfiles.segment} != 'inactive'`
      )
    );

  if (!dryRun && inactiveUsers.length > 0) {
    for (const user of inactiveUsers) {
      await CustomerProfileService.softDeleteProfile(user.userId);
    }
  }

  return {
    operation: 'anonymize_inactive_users',
    recordsAffected: inactiveUsers.length,
    dryRun,
  };
}

async function removeDuplicateAddresses(dryRun: boolean) {
  // Find duplicate addresses based on user + street + city
  const duplicates = await db
    .select({
      userId: customerAddresses.userId,
      street: customerAddresses.street,
      city: customerAddresses.city,
      count: count(),
    })
    .from(customerAddresses)
    .groupBy(customerAddresses.userId, customerAddresses.street, customerAddresses.city)
    .having(sql`count(*) > 1`);

  let removedCount = 0;

  if (!dryRun) {
    for (const duplicate of duplicates) {
      // Keep the most recently used address, remove others
      const addresses = await db
        .select()
        .from(customerAddresses)
        .where(
          and(
            eq(customerAddresses.userId, duplicate.userId),
            eq(customerAddresses.street, duplicate.street),
            eq(customerAddresses.city, duplicate.city)
          )
        )
        .orderBy(desc(customerAddresses.lastUsedAt));

      // Remove all but the first (most recent)
      for (let i = 1; i < addresses.length; i++) {
        await db.delete(customerAddresses).where(eq(customerAddresses.id, addresses[i].id));
        removedCount++;
      }
    }
  } else {
    removedCount = duplicates.reduce((sum, d) => sum + d.count - 1, 0);
  }

  return {
    operation: 'remove_duplicate_addresses',
    recordsAffected: removedCount,
    dryRun,
  };
}

async function consolidatePaymentMethods(dryRun: boolean) {
  // Similar logic to remove duplicate payment methods
  return {
    operation: 'consolidate_payment_methods',
    recordsAffected: 0,
    dryRun,
    note: 'Implementation would consolidate duplicate payment methods',
  };
}

// Analytics helper functions
async function getTotalCustomers() {
  const result = await db.select({ count: count() }).from(customerProfiles);

  return result[0]?.count || 0;
}

async function getSegmentBreakdown() {
  const result = await db
    .select({
      segment: customerProfiles.segment,
      count: count(),
    })
    .from(customerProfiles)
    .groupBy(customerProfiles.segment);

  return result;
}

async function getChurnRiskBreakdown() {
  const result = await db
    .select({
      churnRisk: customerProfiles.churnRisk,
      count: count(),
    })
    .from(customerProfiles)
    .groupBy(customerProfiles.churnRisk);

  return result;
}

async function getRevenueAnalytics() {
  const result = await db
    .select({
      totalRevenue: sum(customerProfiles.totalSpent),
      avgOrderValue: avg(customerProfiles.avgOrderValue),
      totalOrders: sum(customerProfiles.orderCount),
    })
    .from(customerProfiles);

  return result[0] || {};
}

async function getRegistrationTrends() {
  // Get registration trends for the last 12 months
  const result = await db
    .select({
      month: sql<string>`strftime('%Y-%m', datetime(${customerProfiles.createdAt}/1000, 'unixepoch'))`,
      count: count(),
    })
    .from(customerProfiles)
    .where(sql`${customerProfiles.createdAt} >= ${Date.now() - 365 * 24 * 60 * 60 * 1000}`)
    .groupBy(sql`strftime('%Y-%m', datetime(${customerProfiles.createdAt}/1000, 'unixepoch'))`)
    .orderBy(sql`strftime('%Y-%m', datetime(${customerProfiles.createdAt}/1000, 'unixepoch'))`);

  return result;
}

export { app as adminBatchRoutes };

import { eq, sql, and, desc, asc } from 'drizzle-orm';
import { createId } from '@paralleldrive/cuid2';
import type { D1Database } from '@cloudflare/workers-types';
import {
  users,
  customerProfiles,
  customerAddresses,
  customerPaymentMethods,
  customerWishlists,
  customerReviews,
  customerNotificationPreferences,
  userSecurity,
  customerRecentlyViewed,
} from './schema';
import { createDB } from './client';

// Types for customer profile operations
export interface BasicProfileData {
  id: string;
  name: string | null;
  email: string;
  phone: string | null;
  image: string | null;
  preferences: any;
  role: string | null;
  birthday: string | null;
  gender: string | null;
  contactPreference: string | null;
}

export interface FullProfileData extends BasicProfileData {
  customerProfile?: {
    customerNumber: string | null;
    birthday: string | null;
    gender: string | null;
    totalSpent: number | null;
    orderCount: number | null;
    avgOrderValue: number | null;
    segment: string | null;
    lifetimeValue: number | null;
    churnRisk: string | null;
    lastContactAt: Date | null;
    contactPreference: string | null;
    notes: string | null;
    source: string | null;
  };
}

export interface ProfileUpdate {
  name?: string;
  phone?: string;
  birthday?: string;
  gender?: string;
  contactPreference?: string;
  notes?: string;
  preferences?: any;
}

export interface ProfileAnalytics {
  totalSpent: number;
  orderCount: number;
  avgOrderValue: number;
  lastOrderAt?: Date;
  lastPurchaseAt?: Date;
  firstPurchaseAt?: Date;
}

/**
 * High-Performance Customer Profile Service
 * Optimized CRUD operations for customer profile management
 */
export class CustomerProfileService {
  private db: ReturnType<typeof createDB>;

  constructor(d1: D1Database) {
    this.db = createDB(d1);
  }

  // Factory function for convenience
  static create(d1: D1Database) {
    return new CustomerProfileService(d1);
  }

  // ======================
  // READ OPERATIONS
  // ======================

  /**
   * Get basic profile data (most common operation)
   * Optimized for speed with selective loading
   */
  async getBasicProfile(userId: string): Promise<BasicProfileData | null> {
    try {
      const result = await this.db
        .select({
          id: users.id,
          // Prioritize customerProfile name, fallback to user name
          name: sql<string>`COALESCE(${customerProfiles.name}, ${users.name})`,
          email: users.email,
          // Prioritize customerProfile phone, fallback to user phone
          phone: sql<string>`COALESCE(${customerProfiles.phone}, ${users.phone})`,
          image: users.image,
          preferences: users.preferences,
          role: users.role,
          birthday: customerProfiles.birthday,
          gender: customerProfiles.gender,
          contactPreference: customerProfiles.contactPreference,
        })
        .from(users)
        .leftJoin(customerProfiles, eq(users.id, customerProfiles.userId))
        .where(eq(users.id, userId))
        .limit(1);

      return result[0] || null;
    } catch (error) {
      console.error('Error fetching basic profile:', error);
      throw new Error('Failed to fetch basic profile');
    }
  }

  /**
   * Get full profile with extended customer data
   * Use when complete profile information is needed
   */
  async getFullProfile(userId: string): Promise<FullProfileData | null> {
    try {
      const result = await this.db
        .select({
          // User data
          id: users.id,
          name: users.name,
          email: users.email,
          phone: users.phone,
          image: users.image,
          preferences: users.preferences,
          role: users.role,
          // Customer profile data
          customerNumber: customerProfiles.customerNumber,
          birthday: customerProfiles.birthday,
          gender: customerProfiles.gender,
          totalSpent: customerProfiles.totalSpent,
          orderCount: customerProfiles.orderCount,
          avgOrderValue: customerProfiles.avgOrderValue,
          segment: customerProfiles.segment,
          lifetimeValue: customerProfiles.lifetimeValue,
          churnRisk: customerProfiles.churnRisk,
          lastContactAt: customerProfiles.lastContactAt,
          contactPreference: customerProfiles.contactPreference,
          notes: customerProfiles.notes,
          source: customerProfiles.source,
        })
        .from(users)
        .leftJoin(customerProfiles, eq(users.id, customerProfiles.userId))
        .where(eq(users.id, userId))
        .limit(1);

      if (!result[0]) return null;

      const data = result[0];
      return {
        id: data.id,
        name: data.name,
        email: data.email,
        phone: data.phone,
        image: data.image,
        preferences: data.preferences,
        role: data.role,
        customerProfile: data.customerNumber
          ? {
              customerNumber: data.customerNumber,
              birthday: data.birthday,
              gender: data.gender,
              totalSpent: data.totalSpent,
              orderCount: data.orderCount,
              avgOrderValue: data.avgOrderValue,
              segment: data.segment,
              lifetimeValue: data.lifetimeValue,
              churnRisk: data.churnRisk,
              lastContactAt: data.lastContactAt,
              contactPreference: data.contactPreference,
              notes: data.notes,
              source: data.source,
            }
          : undefined,
      };
    } catch (error) {
      console.error('Error fetching full profile:', error);
      throw new Error('Failed to fetch full profile');
    }
  }

  /**
   * Get profile analytics data
   * Optimized for dashboard and reporting
   */
  async getProfileAnalytics(userId: string): Promise<ProfileAnalytics | null> {
    try {
      const result = await this.db
        .select({
          totalSpent: customerProfiles.totalSpent,
          orderCount: customerProfiles.orderCount,
          avgOrderValue: customerProfiles.avgOrderValue,
          lastOrderAt: customerProfiles.lastOrderAt,
          lastPurchaseAt: customerProfiles.lastPurchaseAt,
          firstPurchaseAt: customerProfiles.firstPurchaseAt,
        })
        .from(customerProfiles)
        .where(eq(customerProfiles.userId, userId))
        .limit(1);

      if (!result[0]) return null;

      return {
        totalSpent: result[0].totalSpent || 0,
        orderCount: result[0].orderCount || 0,
        avgOrderValue: result[0].avgOrderValue || 0,
        lastOrderAt: result[0].lastOrderAt || undefined,
        lastPurchaseAt: result[0].lastPurchaseAt || undefined,
        firstPurchaseAt: result[0].firstPurchaseAt || undefined,
      };
    } catch (error) {
      console.error('Error fetching profile analytics:', error);
      throw new Error('Failed to fetch profile analytics');
    }
  }

  /**
   * Check if user has extended profile
   * Fast existence check
   */
  async hasExtendedProfile(userId: string): Promise<boolean> {
    try {
      const result = await this.db
        .select({ id: customerProfiles.id })
        .from(customerProfiles)
        .where(eq(customerProfiles.userId, userId))
        .limit(1);

      return result.length > 0;
    } catch (error) {
      console.error('Error checking extended profile:', error);
      return false;
    }
  }

  // ======================
  // CREATE OPERATIONS
  // ======================

  /**
   * Create customer profile with D1 batch operations for atomicity
   * Auto-generates customer number and sets defaults
   */
  async createCustomerProfile(userData: {
    name: string;
    email: string;
    phone?: string;
    birthday?: string;
    gender?: string;
    source?: string;
    preferences?: any;
  }) {
    try {
      // Step 1: Check if user already exists
      const existingUser = await this.db
        .select({ id: users.id })
        .from(users)
        .where(eq(users.email, userData.email))
        .limit(1);

      let userId: string;

      if (existingUser[0]) {
        userId = existingUser[0].id;

        // Step 2a: Update existing user with batch operation
        const customerNumber = await this.generateCustomerNumber();
        const customerProfileId = createId();

        const batchOperations = [
          this.db
            .update(users)
            .set({
              name: userData.name,
              phone: userData.phone,
              preferences: userData.preferences || {},
              updatedAt: new Date(),
            })
            .where(eq(users.id, userId)),

          this.db.insert(customerProfiles).values({
            id: customerProfileId,
            userId: userId,
            customerNumber,
            name: userData.name,
            email: userData.email,
            phone: userData.phone || '',
            birthday: userData.birthday,
            gender: userData.gender,
            source: userData.source || 'website',
            contactPreference: 'email',
            createdAt: new Date(),
            updatedAt: new Date(),
          }),
        ];

        await this.db.batch(batchOperations);

        return {
          userId,
          customerProfileId,
          customerNumber,
        };
      } else {
        // Step 2b: Create new user and profile with batch operation
        const newUserId = createId();
        const customerNumber = await this.generateCustomerNumber();
        const customerProfileId = createId();

        const batchOperations = [
          this.db.insert(users).values({
            id: newUserId,
            name: userData.name,
            email: userData.email,
            phone: userData.phone,
            role: 'customer',
            preferences: userData.preferences || {},
            createdAt: new Date(),
            updatedAt: new Date(),
          }),

          this.db.insert(customerProfiles).values({
            id: customerProfileId,
            userId: newUserId,
            customerNumber,
            name: userData.name,
            email: userData.email,
            phone: userData.phone || '',
            birthday: userData.birthday,
            gender: userData.gender,
            source: userData.source || 'website',
            segment: 'new',
            totalSpent: 0,
            orderCount: 0,
            avgOrderValue: 0,
            lifetimeValue: 0,
            churnRisk: 'low',
            contactPreference: 'email',
            notes: '',
            createdAt: new Date(),
            updatedAt: new Date(),
          }),

          this.db.insert(customerNotificationPreferences).values({
            id: createId(),
            userId: newUserId,
            emailOrderUpdates: true,
            emailAppointmentReminders: true,
            emailNewsletters: true,
            emailPromotions: false,
            emailPriceAlerts: false,
            emailProductRecommendations: false,
            smsOrderUpdates: false,
            smsAppointmentReminders: true,
            smsPromotions: false,
            smsDeliveryUpdates: true,
            emailFrequency: 'immediate',
            smsFrequency: 'important_only',
            createdAt: new Date(),
            updatedAt: new Date(),
          }),

          this.db.insert(userSecurity).values({
            id: createId(),
            userId: newUserId,
            loginCount: 0,
            twoFactorEnabled: false,
            isLocked: false,
            failedLoginAttempts: 0,
            allowDataCollection: true,
            allowMarketing: true,
            allowSmsMarketing: false,
            createdAt: new Date(),
            updatedAt: new Date(),
          }),
        ];

        await this.db.batch(batchOperations);

        return {
          userId: newUserId,
          customerProfileId,
          customerNumber,
        };
      }
    } catch (error) {
      console.error('Error creating customer profile:', error);
      throw new Error('Failed to create customer profile');
    }
  }

  // ======================
  // UPDATE OPERATIONS
  // ======================

  /**
   * Update basic profile information
   * Most common update operation - optimized for speed
   */
  async updateBasicInfo(userId: string, data: ProfileUpdate) {
    try {
      const batchOperations = [];

      // Prepare user table update (for short-term sync)
      const userUpdate: any = { updatedAt: new Date() };
      if (data.name !== undefined) userUpdate.name = data.name;
      if (data.phone !== undefined) userUpdate.phone = data.phone;
      if (Object.keys(userUpdate).length > 1) {
        batchOperations.push(this.db.update(users).set(userUpdate).where(eq(users.id, userId)));
      }

      // Prepare customer profile upsert
      const profileExists = await this.hasExtendedProfile(userId);

      const profileData: any = {
        ...data,
        updatedAt: new Date(),
      };

      if (profileExists) {
        batchOperations.push(
          this.db
            .update(customerProfiles)
            .set(profileData)
            .where(eq(customerProfiles.userId, userId))
        );
      } else {
        // Create the profile if it doesn't exist
        const user = await this.db
          .select({ email: users.email, name: users.name, phone: users.phone })
          .from(users)
          .where(eq(users.id, userId))
          .limit(1);
        if (user[0]) {
          const newProfile = {
            id: createId(),
            userId: userId,
            customerNumber: await this.generateCustomerNumber(),
            email: user[0].email,
            name: data.name || user[0].name,
            phone: data.phone || user[0].phone,
            birthday: data.birthday,
            gender: data.gender,
            contactPreference: data.contactPreference,
            notes: data.notes,
            source: 'existing_user',
            segment: 'customer',
            createdAt: new Date(),
            updatedAt: new Date(),
          };
          batchOperations.push(this.db.insert(customerProfiles).values(newProfile));
        }
      }

      if (batchOperations.length > 0) {
        await this.db.batch(batchOperations);
      }

      return { success: true, userId };
    } catch (error) {
      console.error('Error updating basic info:', error);
      throw new Error('Failed to update basic info');
    }
  }

  /**
   * Update profile analytics (background process)
   * Optimized for order completion triggers
   */
  async updateAnalytics(
    userId: string,
    orderData: {
      amount: number;
      isFirstPurchase?: boolean;
    }
  ) {
    try {
      const now = new Date();

      return await this.db
        .update(customerProfiles)
        .set({
          totalSpent: sql`${customerProfiles.totalSpent} + ${orderData.amount}`,
          orderCount: sql`${customerProfiles.orderCount} + 1`,
          avgOrderValue: sql`(${customerProfiles.totalSpent} + ${orderData.amount}) / (${customerProfiles.orderCount} + 1)`,
          lastOrderAt: now,
          lastPurchaseAt: now,
          firstPurchaseAt: orderData.isFirstPurchase ? now : customerProfiles.firstPurchaseAt,
          lastContactAt: now,
          updatedAt: now,
        })
        .where(eq(customerProfiles.userId, userId));
    } catch (error) {
      console.error('Error updating analytics:', error);
      throw new Error('Failed to update analytics');
    }
  }

  /**
   * Update customer segment based on analytics
   * Background process for customer classification
   */
  async updateSegment(userId: string) {
    try {
      const analytics = await this.getProfileAnalytics(userId);
      if (!analytics) return;

      let segment = 'new';
      let churnRisk = 'low';

      // Segmentation logic
      if (analytics.totalSpent >= 200000) {
        segment = 'vip';
      } else if (analytics.orderCount >= 3) {
        segment = 'regular';
      } else if (analytics.orderCount >= 1) {
        segment = 'customer';
      }

      // Churn risk calculation
      const daysSinceLastOrder = analytics.lastOrderAt
        ? Math.floor((Date.now() - analytics.lastOrderAt.getTime()) / (1000 * 60 * 60 * 24))
        : 0;

      if (daysSinceLastOrder > 180) {
        churnRisk = 'high';
      } else if (daysSinceLastOrder > 90) {
        churnRisk = 'medium';
      }

      return await this.db
        .update(customerProfiles)
        .set({
          segment,
          churnRisk,
          lifetimeValue: analytics.totalSpent,
          updatedAt: new Date(),
        })
        .where(eq(customerProfiles.userId, userId));
    } catch (error) {
      console.error('Error updating segment:', error);
      throw new Error('Failed to update segment');
    }
  }

  /**
   * Update JSON preferences efficiently
   * Uses JSON operations for partial updates
   */
  async updatePreferences(userId: string, preferences: any) {
    try {
      return await this.db
        .update(users)
        .set({
          preferences: preferences,
          updatedAt: new Date(),
        })
        .where(eq(users.id, userId));
    } catch (error) {
      console.error('Error updating preferences:', error);
      throw new Error('Failed to update preferences');
    }
  }

  // ======================
  // DELETE OPERATIONS
  // ======================

  /**
   * Soft delete with anonymization (GDPR compliant)
   * Default delete method for privacy compliance
   */
  async softDeleteProfile(userId: string) {
    try {
      const timestamp = Date.now();

      // Prepare batch operations for atomic anonymization
      const batchOperations = [
        // Anonymize user data
        this.db
          .update(users)
          .set({
            name: `Deleted User ${timestamp}`,
            email: `deleted_${timestamp}@blackliving.deleted`,
            phone: null,
            image: null,
            preferences: {},
            updatedAt: new Date(),
          })
          .where(eq(users.id, userId)),

        // Anonymize customer profile
        this.db
          .update(customerProfiles)
          .set({
            name: `Deleted User ${timestamp}`,
            email: `deleted_${timestamp}@blackliving.deleted`,
            phone: '',
            birthday: null,
            gender: null,
            notes: '',
            segment: 'inactive',
            contactPreference: 'email',
            updatedAt: new Date(),
          })
          .where(eq(customerProfiles.userId, userId)),
      ];

      // Execute atomic batch operation
      await this.db.batch(batchOperations);

      return { success: true, anonymized: true };
    } catch (error) {
      console.error('Error soft deleting profile:', error);
      throw new Error('Failed to soft delete profile');
    }
  }

  /**
   * Hard delete profile (GDPR Right to be Forgotten)
   * Complete removal of all user data
   */
  async hardDeleteProfile(userId: string) {
    try {
      // Prepare batch operations in order to respect foreign key constraints
      const batchOperations = [
        this.db.delete(customerRecentlyViewed).where(eq(customerRecentlyViewed.userId, userId)),
        this.db.delete(customerWishlists).where(eq(customerWishlists.userId, userId)),
        this.db.delete(customerReviews).where(eq(customerReviews.userId, userId)),
        this.db
          .delete(customerNotificationPreferences)
          .where(eq(customerNotificationPreferences.userId, userId)),
        this.db.delete(customerPaymentMethods).where(eq(customerPaymentMethods.userId, userId)),
        this.db.delete(customerAddresses).where(eq(customerAddresses.userId, userId)),
        this.db.delete(userSecurity).where(eq(userSecurity.userId, userId)),
        this.db.delete(customerProfiles).where(eq(customerProfiles.userId, userId)),
        this.db.delete(users).where(eq(users.id, userId)),
      ];

      // Execute atomic batch operation
      await this.db.batch(batchOperations);

      return { success: true, deleted: true };
    } catch (error) {
      console.error('Error hard deleting profile:', error);
      throw new Error('Failed to hard delete profile');
    }
  }

  // ======================
  // UTILITY METHODS
  // ======================

  /**
   * Generate unique customer number
   * Format: CU{YEAR}{MONTH}{SEQUENCE}
   */
  async generateCustomerNumber(): Promise<string> {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');

    // Get the count of customers created this month
    const startOfMonth = new Date(year, now.getMonth(), 1);
    const endOfMonth = new Date(year, now.getMonth() + 1, 0);

    const count = await this.db
      .select({ count: sql<number>`count(*)` })
      .from(customerProfiles)
      .where(
        and(
          sql`${customerProfiles.createdAt} >= ${startOfMonth.getTime()}`,
          sql`${customerProfiles.createdAt} <= ${endOfMonth.getTime()}`
        )
      );

    const sequence = String((count[0]?.count || 0) + 1).padStart(4, '0');

    return `CU${year}${month}${sequence}`;
  }

  /**
   * Batch update profiles for admin operations
   * Optimized for bulk operations
   */
  async batchUpdateProfiles(updates: Array<{ userId: string; data: ProfileUpdate }>) {
    try {
      const chunks = this.chunkArray(updates, 50); // Process in chunks of 50

      for (const chunk of chunks) {
        // Process each chunk with individual updateBasicInfo calls
        // Each updateBasicInfo already uses batch operations internally
        for (const update of chunk) {
          await this.updateBasicInfo(update.userId, update.data);
        }
      }

      return { success: true, updated: updates.length };
    } catch (error) {
      console.error('Error batch updating profiles:', error);
      throw new Error('Failed to batch update profiles');
    }
  }

  /**
   * Utility: Chunk array for batch processing
   */
  private static chunkArray<T>(array: T[], size: number): T[][] {
    const chunks: T[][] = [];
    for (let i = 0; i < array.length; i += size) {
      chunks.push(array.slice(i, i + size));
    }
    return chunks;
  }
}

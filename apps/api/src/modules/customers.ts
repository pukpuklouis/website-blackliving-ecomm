import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';
import { requireAdmin, requireAuth } from '@blackliving/auth';
import { 
  customerProfiles, 
  customerTags, 
  customerTagAssignments, 
  customerInteractions 
} from '@blackliving/db/schema';
import { eq, desc, and, sql, like, or } from 'drizzle-orm';
import type { Env } from '../index';
import { customerProfileRoutes } from '../routes/customer-profile';

const customers = new Hono<{ 
  Bindings: Env;
  Variables: {
    db: any;
    cache: any;
    storage: any;
    auth: any;
    user: any;
    session: any;
  };
}>();

// Validation schemas
const createCustomerProfileSchema = z.object({
  name: z.string().min(1),
  email: z.string().email(),
  phone: z.string().min(1),
  birthday: z.string().optional(), // YYYY-MM-DD
  gender: z.enum(['male', 'female', 'other']).optional(),
  address: z.object({
    city: z.string(),
    district: z.string(),
    street: z.string(),
    postalCode: z.string(),
  }).optional(),
  notes: z.string().default(''),
  source: z.string().default('website'),
});

const updateCustomerSchema = z.object({
  name: z.string().min(1).optional(),
  email: z.string().email().optional(),
  phone: z.string().min(1).optional(),
  birthday: z.string().optional(),
  gender: z.enum(['male', 'female', 'other']).optional(),
  address: z.object({
    city: z.string(),
    district: z.string(),
    street: z.string(),
    postalCode: z.string(),
  }).optional(),
  notes: z.string().optional(),
  contactPreference: z.enum(['email', 'phone', 'sms']).optional(),
});

const createCustomerTagSchema = z.object({
  name: z.string().min(1),
  color: z.string().regex(/^#[0-9A-F]{6}$/i).default('#6B7280'),
  description: z.string().optional(),
  category: z.enum(['behavioral', 'demographic', 'custom']).default('custom'),
});

const assignTagSchema = z.object({
  customerProfileId: z.string(),
  customerTagId: z.string(),
});

// Debug endpoint to test authentication and database
customers.get('/debug', async (c) => {
  const user = c.get('user');
  const db = c.get('db');
  
  // Test direct database query
  let customerCount = 0;
  let testCustomer = null;
  let error = null;
  
  try {
    // Use Drizzle ORM to query
    const customers = await db.select().from(customerProfiles).limit(5);
    customerCount = customers.length;
    testCustomer = customers[0] || null;
  } catch (e) {
    error = e.message;
  }
  
  return c.json({
    user: user,
    isAdmin: user?.role === 'admin',
    dbAvailable: !!db,
    customerCount,
    testCustomer,
    error,
    timestamp: new Date().toISOString()
  });
});

// GET /api/customers - List customers with analytics (Admin only)
customers.get('/', requireAdmin(), async (c) => {
  try {
    const { segment, tag, churnRisk, limit = '50', offset = '0', search } = c.req.query();
    const db = c.get('db');
    
    // Build conditions array
    const conditions = [];
    
    if (segment) {
      conditions.push(eq(customerProfiles.segment, segment));
    }

    if (churnRisk) {
      conditions.push(eq(customerProfiles.churnRisk, churnRisk));
    }

    if (search) {
      const searchTerm = `%${search}%`;
      conditions.push(
        or(
          like(customerProfiles.name, searchTerm),
          like(customerProfiles.email, searchTerm),
          like(customerProfiles.phone, searchTerm),
          like(customerProfiles.customerNumber, searchTerm)
        )
      );
    }

    // For complex GROUP_CONCAT queries, we'll use raw SQL with Drizzle
    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;
    
    const result = await db
      .select({
        // Customer profile fields
        id: customerProfiles.id,
        userId: customerProfiles.userId,
        customerNumber: customerProfiles.customerNumber,
        name: customerProfiles.name,
        email: customerProfiles.email,
        phone: customerProfiles.phone,
        birthday: customerProfiles.birthday,
        gender: customerProfiles.gender,
        address: customerProfiles.address,
        notes: customerProfiles.notes,
        source: customerProfiles.source,
        segment: customerProfiles.segment,
        orderCount: customerProfiles.orderCount,
        totalSpent: customerProfiles.totalSpent,
        lastOrderAt: customerProfiles.lastOrderAt,
        lastContactAt: customerProfiles.lastContactAt,
        churnRisk: customerProfiles.churnRisk,
        lifetimeValue: customerProfiles.lifetimeValue,
        createdAt: customerProfiles.createdAt,
        updatedAt: customerProfiles.updatedAt,
        // Aggregated tag fields
        tagNames: sql<string>`GROUP_CONCAT(${customerTags.name})`,
        tagColors: sql<string>`GROUP_CONCAT(${customerTags.color})`,
        tagIds: sql<string>`GROUP_CONCAT(${customerTags.id})`,
      })
      .from(customerProfiles)
      .leftJoin(customerTagAssignments, eq(customerProfiles.id, customerTagAssignments.customerProfileId))
      .leftJoin(customerTags, eq(customerTagAssignments.customerTagId, customerTags.id))
      .where(whereClause)
      .groupBy(customerProfiles.id)
      .orderBy(desc(customerProfiles.createdAt))
      .limit(parseInt(limit))
      .offset(parseInt(offset));
    
    // Process customer data with tags
    const customers = result.map((customer: any) => ({
      ...customer,
      tags: customer.tagNames ? customer.tagNames.split(',').map((name: string, index: number) => ({
        id: customer.tagIds ? customer.tagIds.split(',')[index] : null,
        name: name.trim(),
        color: customer.tagColors ? customer.tagColors.split(',')[index] : '#6B7280',
        category: 'unknown'
      })) : [],
    }));

    return c.json({
      success: true,
      data: { customers },
      total: customers.length
    });

  } catch (error) {
    console.error('Error fetching customers:', error);
    console.error('Error details:', error.message, error.stack);
    return c.json({ 
      error: 'Failed to fetch customers',
      details: error.message 
    }, 500);
  }
});

// Mount customer profile routes (for authenticated customers) - MUST be before /:id route
customers.route('/profile', customerProfileRoutes);

// GET /api/customers/:id - Get single customer with detailed analytics
customers.get('/:id', requireAdmin(), async (c) => {
  try {
    const id = c.req.param('id');
    const db = c.get('db');
    
    // Get customer profile with tags
    const customerResult = await db.prepare(`
      SELECT cp.*, 
             GROUP_CONCAT(ct.name) as tag_names,
             GROUP_CONCAT(ct.color) as tag_colors,
             GROUP_CONCAT(ct.id) as tag_ids
      FROM customer_profiles cp
      LEFT JOIN customer_tag_assignments cta ON cp.id = cta.customer_profile_id
      LEFT JOIN customer_tags ct ON cta.customer_tag_id = ct.id
      WHERE cp.id = ?
      GROUP BY cp.id
    `).bind(id).first();

    if (!customerResult) {
      return c.json({ error: 'Customer not found' }, 404);
    }

    // Process customer data
    const customer = {
      ...customerResult,
      address: customerResult.address ? JSON.parse(customerResult.address) : null,
      shippingAddresses: JSON.parse(customerResult.shipping_addresses || '[]'),
      favoriteCategories: JSON.parse(customerResult.favorite_categories || '[]'),
      purchaseHistory: JSON.parse(customerResult.purchase_history || '[]'),
      tags: customerResult.tag_names ? customerResult.tag_names.split(',').map((name: string, index: number) => ({
        id: customerResult.tag_ids.split(',')[index],
        name: name.trim(),
        color: customerResult.tag_colors.split(',')[index],
        category: 'unknown'
      })) : [],
      createdAt: new Date(customerResult.created_at),
      updatedAt: new Date(customerResult.updated_at),
      lastPurchaseAt: customerResult.last_purchase_at ? new Date(customerResult.last_purchase_at) : null,
      firstPurchaseAt: customerResult.first_purchase_at ? new Date(customerResult.first_purchase_at) : null,
      lastContactAt: customerResult.last_contact_at ? new Date(customerResult.last_contact_at) : null,
    };

    return c.json({
      success: true,
      data: customer
    });

  } catch (error) {
    console.error('Error fetching customer:', error);
    return c.json({ error: 'Failed to fetch customer' }, 500);
  }
});

// POST /api/customers - Create new customer profile (Admin only)
customers.post('/',
  requireAdmin(),
  zValidator('json', createCustomerProfileSchema),
  async (c) => {
    try {
      const data = c.req.valid('json');
      const db = c.get('db');
      
      // Generate customer number: CU + YYYYMMDD + sequence
      const today = new Date();
      const dateStr = today.getFullYear().toString() + 
                     (today.getMonth() + 1).toString().padStart(2, '0') + 
                     today.getDate().toString().padStart(2, '0');
      const customerNumber = `CU${dateStr}${Math.random().toString(36).substr(2, 4).toUpperCase()}`;
      
      const now = Date.now();

      await db.prepare(`
        INSERT INTO customer_profiles (
          id, customer_number, name, email, phone, birthday, gender,
          address, notes, source, segment, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).bind(
        crypto.randomUUID(),
        customerNumber,
        data.name,
        data.email,
        data.phone,
        data.birthday || null,
        data.gender || null,
        data.address ? JSON.stringify(data.address) : null,
        data.notes,
        data.source,
        'new', // Default segment for new customers
        now,
        now
      ).run();

      return c.json({
        success: true,
        data: { 
          customerNumber,
          message: '客戶資料建立成功' 
        }
      }, 201);

    } catch (error) {
      console.error('Error creating customer:', error);
      return c.json({ error: 'Failed to create customer' }, 500);
    }
  }
);

// PUT /api/customers/:id - Update customer profile (Admin only)
customers.put('/:id',
  requireAdmin(),
  zValidator('json', updateCustomerSchema),
  async (c) => {
    try {
      const id = c.req.param('id');
      const data = c.req.valid('json');
      const db = c.get('db');

      const now = Date.now();
      let updateQuery = 'UPDATE customer_profiles SET updated_at = ?';
      let params = [now];

      // Build dynamic update query
      Object.keys(data).forEach(key => {
        if (data[key as keyof typeof data] !== undefined) {
          updateQuery += `, ${key} = ?`;
          if (key === 'address') {
            params.push(JSON.stringify(data[key as keyof typeof data]));
          } else {
            params.push(data[key as keyof typeof data]);
          }
        }
      });

      updateQuery += ' WHERE id = ?';
      params.push(id);

      const result = await db.prepare(updateQuery).bind(...params).run();

      if (result.changes === 0) {
        return c.json({ error: 'Customer not found' }, 404);
      }

      return c.json({
        success: true,
        message: 'Customer updated successfully'
      });

    } catch (error) {
      console.error('Error updating customer:', error);
      return c.json({ error: 'Failed to update customer' }, 500);
    }
  }
);

// GET /api/customers/:id/interactions - Get customer interaction history
customers.get('/:id/interactions', requireAdmin(), async (c) => {
  try {
    const id = c.req.param('id');
    const db = c.get('db');
    
    const result = await db.prepare(`
      SELECT * FROM customer_interactions 
      WHERE customer_profile_id = ?
      ORDER BY created_at DESC
    `).bind(id).all();

    const interactions = result.results.map((interaction: any) => ({
      ...interaction,
      metadata: JSON.parse(interaction.metadata || '{}'),
      createdAt: new Date(interaction.created_at),
    }));

    return c.json({
      success: true,
      data: { interactions }
    });

  } catch (error) {
    console.error('Error fetching customer interactions:', error);
    return c.json({ error: 'Failed to fetch interactions' }, 500);
  }
});

// POST /api/customers/:id/interactions - Add customer interaction
customers.post('/:id/interactions',
  requireAdmin(),
  zValidator('json', z.object({
    type: z.string(),
    title: z.string(),
    description: z.string().optional(),
    relatedId: z.string().optional(),
    relatedType: z.string().optional(),
    metadata: z.record(z.any()).default({}),
  })),
  async (c) => {
    try {
      const id = c.req.param('id');
      const data = c.req.valid('json');
      const db = c.get('db');
      const user = c.get('user');

      const now = Date.now();

      await db.prepare(`
        INSERT INTO customer_interactions (
          id, customer_profile_id, type, title, description, 
          related_id, related_type, performed_by, metadata, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).bind(
        crypto.randomUUID(),
        id,
        data.type,
        data.title,
        data.description || '',
        data.relatedId || null,
        data.relatedType || null,
        user?.name || 'system',
        JSON.stringify(data.metadata),
        now
      ).run();

      // Update customer's last contact time
      await db.prepare(`
        UPDATE customer_profiles 
        SET last_contact_at = ?, updated_at = ?
        WHERE id = ?
      `).bind(now, now, id).run();

      return c.json({
        success: true,
        message: 'Interaction recorded successfully'
      }, 201);

    } catch (error) {
      console.error('Error creating interaction:', error);
      return c.json({ error: 'Failed to record interaction' }, 500);
    }
  }
);

// GET /api/customers/tags - List all customer tags
customers.get('/tags', requireAdmin(), async (c) => {
  try {
    const db = c.get('db');
    
    const result = await db.prepare(`
      SELECT * FROM customer_tags 
      ORDER BY category, name
    `).all();

    const tags = result.results.map((tag: any) => ({
      ...tag,
      createdAt: new Date(tag.created_at),
    }));

    return c.json({
      success: true,
      data: { tags }
    });

  } catch (error) {
    console.error('Error fetching customer tags:', error);
    return c.json({ error: 'Failed to fetch tags' }, 500);
  }
});

// POST /api/customers/tags - Create new customer tag
customers.post('/tags',
  requireAdmin(),
  zValidator('json', createCustomerTagSchema),
  async (c) => {
    try {
      const data = c.req.valid('json');
      const db = c.get('db');

      const now = Date.now();

      await db.prepare(`
        INSERT INTO customer_tags (
          id, name, color, description, category, created_at
        ) VALUES (?, ?, ?, ?, ?, ?)
      `).bind(
        crypto.randomUUID(),
        data.name,
        data.color,
        data.description || '',
        data.category,
        now
      ).run();

      return c.json({
        success: true,
        message: 'Customer tag created successfully'
      }, 201);

    } catch (error) {
      console.error('Error creating customer tag:', error);
      return c.json({ error: 'Failed to create tag' }, 500);
    }
  }
);

// POST /api/customers/tags/assign - Assign tag to customer
customers.post('/tags/assign',
  requireAdmin(),
  zValidator('json', assignTagSchema),
  async (c) => {
    try {
      const { customerProfileId, customerTagId } = c.req.valid('json');
      const db = c.get('db');
      const user = c.get('user');

      const now = Date.now();

      await db.prepare(`
        INSERT OR IGNORE INTO customer_tag_assignments (
          id, customer_profile_id, customer_tag_id, assigned_by, assigned_at
        ) VALUES (?, ?, ?, ?, ?)
      `).bind(
        crypto.randomUUID(),
        customerProfileId,
        customerTagId,
        user?.name || 'admin',
        now
      ).run();

      return c.json({
        success: true,
        message: 'Tag assigned successfully'
      });

    } catch (error) {
      console.error('Error assigning tag:', error);
      return c.json({ error: 'Failed to assign tag' }, 500);
    }
  }
);

// DELETE /api/customers/tags/assign/:customerProfileId/:customerTagId - Remove tag from customer
customers.delete('/tags/assign/:customerProfileId/:customerTagId',
  requireAdmin(),
  async (c) => {
    try {
      const customerProfileId = c.req.param('customerProfileId');
      const customerTagId = c.req.param('customerTagId');
      const db = c.get('db');

      const result = await db.prepare(`
        DELETE FROM customer_tag_assignments 
        WHERE customer_profile_id = ? AND customer_tag_id = ?
      `).bind(customerProfileId, customerTagId).run();

      if (result.changes === 0) {
        return c.json({ error: 'Tag assignment not found' }, 404);
      }

      return c.json({
        success: true,
        message: 'Tag removed successfully'
      });

    } catch (error) {
      console.error('Error removing tag:', error);
      return c.json({ error: 'Failed to remove tag' }, 500);
    }
  }
);

// GET /api/customers/analytics - Customer analytics dashboard
customers.get('/analytics', requireAdmin(), async (c) => {
  try {
    const db = c.get('db');
    
    // Get customer segmentation stats
    const segmentStats = await db.prepare(`
      SELECT segment, COUNT(*) as count, AVG(total_spent) as avg_spent
      FROM customer_profiles 
      GROUP BY segment
    `).all();

    // Get churn risk distribution
    const churnStats = await db.prepare(`
      SELECT churn_risk, COUNT(*) as count
      FROM customer_profiles 
      GROUP BY churn_risk
    `).all();

    // Get top customers by spending
    const topCustomers = await db.prepare(`
      SELECT name, total_spent, order_count
      FROM customer_profiles 
      ORDER BY total_spent DESC 
      LIMIT 10
    `).all();

    // Get customer acquisition over time (last 12 months)
    const acquisitionStats = await db.prepare(`
      SELECT 
        strftime('%Y-%m', datetime(created_at/1000, 'unixepoch')) as month,
        COUNT(*) as new_customers
      FROM customer_profiles 
      WHERE created_at >= ?
      GROUP BY month
      ORDER BY month
    `).bind(Date.now() - (365 * 24 * 60 * 60 * 1000)).all();

    return c.json({
      success: true,
      data: {
        segmentStats: segmentStats.results,
        churnStats: churnStats.results,
        topCustomers: topCustomers.results,
        acquisitionStats: acquisitionStats.results,
      }
    });

  } catch (error) {
    console.error('Error fetching customer analytics:', error);
    return c.json({ error: 'Failed to fetch analytics' }, 500);
  }
});

export default customers;
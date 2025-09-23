import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';
import { requireAdmin, requireAuth } from '@blackliving/auth';
import { orders as ordersTable } from '@blackliving/db/schema';
import { eq, desc, and, sql } from 'drizzle-orm';
import type { Env } from '../index';

const orders = new Hono<{
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
const createOrderSchema = z.object({
  customerInfo: z.object({
    name: z.string().min(1),
    email: z.string().email(),
    phone: z.string().min(1),
  }),
  items: z.array(
    z.object({
      productId: z.string(),
      variantId: z.string().optional(),
      name: z.string(),
      quantity: z.number().positive(),
      price: z.number().positive(),
      size: z.string().optional(),
    })
  ),
  subtotalAmount: z.number().positive(),
  shippingFee: z.number().min(0).default(0),
  totalAmount: z.number().positive(),
  paymentMethod: z
    .enum(['bank_transfer', 'credit_card', 'cash_on_delivery'])
    .default('bank_transfer'),
  notes: z.string().default(''),
  shippingAddress: z
    .object({
      name: z.string().min(1),
      phone: z.string().min(1),
      address: z.string().min(1),
      city: z.string().min(1),
      district: z.string().min(1),
      postalCode: z.string().min(1),
    })
    .optional(),
});

const updateOrderStatusSchema = z.object({
  status: z.enum(['pending_payment', 'paid', 'processing', 'shipped', 'delivered', 'cancelled']),
  adminNotes: z.string().optional(),
  trackingNumber: z.string().optional(),
  shippingCompany: z.string().optional(),
});

const confirmPaymentSchema = z.object({
  paymentStatus: z.enum(['paid']),
  status: z.enum(['paid']),
  paymentVerifiedAt: z.string().datetime(),
  paymentVerifiedBy: z.string(),
  adminNotes: z.string().optional(),
});

// GET /api/orders - List orders (Admin only)
orders.get('/', requireAdmin(), async c => {
  try {

    const { status, limit = '50', offset = '0' } = c.req.query();
    const db = c.get('db');

    // Build Drizzle query
    let query = db.select().from(ordersTable);

    if (status) {
      query = query.where(eq(ordersTable.status, status));
    }

    const result = await query
      .orderBy(desc(ordersTable.createdAt))
      .limit(parseInt(limit))
      .offset(parseInt(offset));

    return c.json({
      success: true,
      data: { orders: result },
      total: result.length,
    });
  } catch (error) {
    console.error('Error fetching orders:', error);
    return c.json({ error: 'Failed to fetch orders' }, 500);
  }
});

// GET /api/orders/:id - Get single order
orders.get('/:id', requireAdmin(), async c => {
  try {

    const id = c.req.param('id');
    const db = c.get('db');

    const result = await db.select().from(ordersTable).where(eq(ordersTable.id, id)).limit(1);

    if (result.length === 0) {
      return c.json({ error: 'Order not found' }, 404);
    }

    return c.json({
      success: true,
      data: result[0],
    });
  } catch (error) {
    console.error('Error fetching order:', error);
    return c.json({ error: 'Failed to fetch order' }, 500);
  }
});

// POST /api/orders - Create new order
orders.post('/', zValidator('json', createOrderSchema), async c => {
  try {
    const data = c.req.valid('json');
    const db = c.get('db');

    // Generate order number: BL + YYYYMMDD + sequence
    const today = new Date();
    const dateStr =
      today.getFullYear().toString() +
      (today.getMonth() + 1).toString().padStart(2, '0') +
      today.getDate().toString().padStart(2, '0');
    const orderNumber = `BL${dateStr}${Math.random().toString(36).substr(2, 4).toUpperCase()}`;

    await db.insert(ordersTable).values({
      orderNumber,
      customerInfo: data.customerInfo,
      items: data.items,
      subtotalAmount: data.subtotalAmount,
      shippingFee: data.shippingFee,
      totalAmount: data.totalAmount,
      paymentMethod: data.paymentMethod,
      status: 'pending_payment',
      paymentStatus: 'unpaid',
      notes: data.notes,
      shippingAddress: data.shippingAddress,
    });

    // Send notification email (implement later)
    // await sendOrderConfirmationEmail(orderNumber, data);

    return c.json(
      {
        success: true,
        data: {
          orderNumber,
          status: 'pending_payment',
          message: '訂單已建立成功，請依照指示完成付款',
        },
      },
      201
    );
  } catch (error) {
    console.error('Error creating order:', error);
    return c.json({ error: 'Failed to create order' }, 500);
  }
});

// PATCH /api/orders/:id/status - Update order status (Admin only)
orders.patch('/:id/status', requireAdmin(), zValidator('json', updateOrderStatusSchema), async c => {
  try {

    const id = c.req.param('id');
    const { status, adminNotes, trackingNumber, shippingCompany } = c.req.valid('json');
    const db = c.get('db');

    // Build update object dynamically
    const updateData: any = {
      status,
      updatedAt: new Date(),
    };

    if (adminNotes !== undefined) {
      updateData.adminNotes = adminNotes;
    }

    if (trackingNumber !== undefined) {
      updateData.trackingNumber = trackingNumber;
    }

    if (shippingCompany !== undefined) {
      updateData.shippingCompany = shippingCompany;
    }

    // Set shipped_at when status becomes shipped
    if (status === 'shipped') {
      updateData.shippedAt = new Date();
    }

    // Set delivered_at when status becomes delivered
    if (status === 'delivered') {
      updateData.deliveredAt = new Date();
    }

    const result = await db.update(ordersTable).set(updateData).where(eq(ordersTable.id, id));

    // Drizzle doesn't return changes count, so we could optionally check if order exists first
    // For now, we'll assume the update succeeded if no error was thrown

    // Send status update notification (implement later)
    // await sendOrderStatusUpdateEmail(id, status);

    return c.json({
      success: true,
      message: 'Order status updated successfully',
    });
  } catch (error) {
    console.error('Error updating order status:', error);
    return c.json({ error: 'Failed to update order status' }, 500);
  }
});

// PATCH /api/orders/:id/confirm-payment - Confirm payment (Admin only)
orders.patch('/:id/confirm-payment', requireAdmin(), zValidator('json', confirmPaymentSchema), async c => {
  try {

    const id = c.req.param('id');
    const { paymentStatus, status, paymentVerifiedAt, paymentVerifiedBy, adminNotes } =
      c.req.valid('json');
    const db = c.get('db');

    // Build update object
    const updateData: any = {
      paymentStatus,
      status,
      paymentVerifiedAt: new Date(paymentVerifiedAt),
      paymentVerifiedBy,
      updatedAt: new Date(),
    };

    if (adminNotes !== undefined) {
      updateData.adminNotes = adminNotes;
    }

    await db.update(ordersTable).set(updateData).where(eq(ordersTable.id, id));

    // Send payment confirmation notification (implement later)
    // await sendPaymentConfirmationEmail(id);

    return c.json({
      success: true,
      message: 'Payment confirmed successfully',
    });
  } catch (error) {
    console.error('Error confirming payment:', error);
    return c.json({ error: 'Failed to confirm payment' }, 500);
  }
});

// GET /api/orders/customer/:email - Get customer orders
orders.get('/customer/:email', requireAuth(), async c => {
  try {
    const email = c.req.param('email');
    const user = c.get('user');
    const db = c.get('db');

    // Ensure user can only access their own orders (unless admin)
    if (user.role !== 'admin' && user.email !== email) {
      return c.json({ error: 'Unauthorized access to customer orders' }, 403);
    }

    const result = await db
      .select()
      .from(ordersTable)
      .where(sql`json_extract(${ordersTable.customerInfo}, '$.email') = ${email}`)
      .orderBy(desc(ordersTable.createdAt));

    return c.json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error('Error fetching customer orders:', error);
    return c.json({ error: 'Failed to fetch orders' }, 500);
  }
});

export default orders;

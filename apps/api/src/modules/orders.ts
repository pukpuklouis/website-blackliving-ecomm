import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';
import { requireAdmin, requireAuth } from '@blackliving/auth';
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
  items: z.array(z.object({
    productId: z.string(),
    variantId: z.string().optional(),
    name: z.string(),
    quantity: z.number().positive(),
    price: z.number().positive(),
    size: z.string().optional(),
  })),
  subtotalAmount: z.number().positive(),
  shippingFee: z.number().min(0).default(0),
  totalAmount: z.number().positive(),
  paymentMethod: z.enum(['bank_transfer', 'credit_card', 'cash_on_delivery']).default('bank_transfer'),
  notes: z.string().default(''),
  shippingAddress: z.object({
    name: z.string().min(1),
    phone: z.string().min(1),
    address: z.string().min(1),
    city: z.string().min(1),
    district: z.string().min(1),
    postalCode: z.string().min(1),
  }).optional(),
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
orders.get('/', requireAdmin(), async (c) => {
  try {
    const { status, limit = '50', offset = '0' } = c.req.query();
    const db = c.get('db');
    
    let query = 'SELECT * FROM orders WHERE 1=1';
    const params: any[] = [];

    if (status) {
      query += ' AND status = ?';
      params.push(status);
    }

    query += ' ORDER BY created_at DESC LIMIT ? OFFSET ?';
    params.push(parseInt(limit), parseInt(offset));

    const result = await db.prepare(query).bind(...params).all();
    
    // Parse JSON fields for each order
    const orders = result.results.map((order: any) => ({
      ...order,
      customerInfo: JSON.parse(order.customer_info || '{}'),
      items: JSON.parse(order.items || '[]'),
      shippingAddress: order.shipping_address ? JSON.parse(order.shipping_address) : null,
      createdAt: new Date(order.created_at),
      updatedAt: new Date(order.updated_at),
      paymentVerifiedAt: order.payment_verified_at ? new Date(order.payment_verified_at) : null,
      shippedAt: order.shipped_at ? new Date(order.shipped_at) : null,
      deliveredAt: order.delivered_at ? new Date(order.delivered_at) : null,
    }));
    
    return c.json({
      success: true,
      data: { orders },
      total: orders.length
    });

  } catch (error) {
    console.error('Error fetching orders:', error);
    return c.json({ error: 'Failed to fetch orders' }, 500);
  }
});

// GET /api/orders/:id - Get single order
orders.get('/:id', requireAdmin(), async (c) => {
  try {
    const id = c.req.param('id');
    const db = c.get('db');
    
    const result = await db.prepare(
      'SELECT * FROM orders WHERE id = ?'
    ).bind(id).first();

    if (!result) {
      return c.json({ error: 'Order not found' }, 404);
    }

    return c.json({
      success: true,
      data: result
    });

  } catch (error) {
    console.error('Error fetching order:', error);
    return c.json({ error: 'Failed to fetch order' }, 500);
  }
});

// POST /api/orders - Create new order
orders.post('/',
  zValidator('json', createOrderSchema),
  async (c) => {
    try {
      const data = c.req.valid('json');
      const db = c.get('db');
      
      // Generate order number: BL + YYYYMMDD + sequence
      const today = new Date();
      const dateStr = today.getFullYear().toString() + 
                     (today.getMonth() + 1).toString().padStart(2, '0') + 
                     today.getDate().toString().padStart(2, '0');
      const orderNumber = `BL${dateStr}${Math.random().toString(36).substr(2, 4).toUpperCase()}`;
      
      const now = Date.now();

      await db.prepare(`
        INSERT INTO orders (
          id, order_number, customer_info, items, subtotal_amount, shipping_fee,
          total_amount, payment_method, status, payment_status, notes,
          shipping_address, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).bind(
        crypto.randomUUID(),
        orderNumber,
        JSON.stringify(data.customerInfo),
        JSON.stringify(data.items),
        data.subtotalAmount,
        data.shippingFee,
        data.totalAmount,
        data.paymentMethod,
        'pending_payment',
        'unpaid',
        data.notes,
        data.shippingAddress ? JSON.stringify(data.shippingAddress) : null,
        now,
        now
      ).run();

      // Send notification email (implement later)
      // await sendOrderConfirmationEmail(orderNumber, data);

      return c.json({
        success: true,
        data: { 
          orderNumber, 
          status: 'pending_payment',
          message: '訂單已建立成功，請依照指示完成付款' 
        }
      }, 201);

    } catch (error) {
      console.error('Error creating order:', error);
      return c.json({ error: 'Failed to create order' }, 500);
    }
  }
);

// PATCH /api/orders/:id/status - Update order status (Admin only)
orders.patch('/:id/status',
  requireAdmin(),
  zValidator('json', updateOrderStatusSchema),
  async (c) => {
    try {
      const id = c.req.param('id');
      const { status, adminNotes, trackingNumber, shippingCompany } = c.req.valid('json');
      const db = c.get('db');

      const now = Date.now();
      let updateQuery = 'UPDATE orders SET status = ?, updated_at = ?';
      let params = [status, now];

      if (adminNotes !== undefined) {
        updateQuery += ', admin_notes = ?';
        params.push(adminNotes);
      }

      if (trackingNumber !== undefined) {
        updateQuery += ', tracking_number = ?';
        params.push(trackingNumber);
      }

      if (shippingCompany !== undefined) {
        updateQuery += ', shipping_company = ?';
        params.push(shippingCompany);
      }

      // Set shipped_at when status becomes shipped
      if (status === 'shipped') {
        updateQuery += ', shipped_at = ?';
        params.push(now);
      }

      // Set delivered_at when status becomes delivered
      if (status === 'delivered') {
        updateQuery += ', delivered_at = ?';
        params.push(now);
      }

      updateQuery += ' WHERE id = ?';
      params.push(id);

      const result = await db.prepare(updateQuery).bind(...params).run();

      if (result.changes === 0) {
        return c.json({ error: 'Order not found' }, 404);
      }

      // Send status update notification (implement later)
      // await sendOrderStatusUpdateEmail(id, status);

      return c.json({
        success: true,
        message: 'Order status updated successfully'
      });

    } catch (error) {
      console.error('Error updating order status:', error);
      return c.json({ error: 'Failed to update order status' }, 500);
    }
  }
);

// PATCH /api/orders/:id/confirm-payment - Confirm payment (Admin only)
orders.patch('/:id/confirm-payment',
  requireAdmin(),
  zValidator('json', confirmPaymentSchema),
  async (c) => {
    try {
      const id = c.req.param('id');
      const { paymentStatus, status, paymentVerifiedAt, paymentVerifiedBy, adminNotes } = c.req.valid('json');
      const db = c.get('db');

      const now = Date.now();
      const verifiedAt = new Date(paymentVerifiedAt).getTime();

      let updateQuery = `
        UPDATE orders 
        SET payment_status = ?, status = ?, payment_verified_at = ?, 
            payment_verified_by = ?, updated_at = ?
      `;
      let params = [paymentStatus, status, verifiedAt, paymentVerifiedBy, now];

      if (adminNotes !== undefined) {
        updateQuery += ', admin_notes = ?';
        params.push(adminNotes);
      }

      updateQuery += ' WHERE id = ?';
      params.push(id);

      const result = await db.prepare(updateQuery).bind(...params).run();

      if (result.changes === 0) {
        return c.json({ error: 'Order not found' }, 404);
      }

      // Send payment confirmation notification (implement later)
      // await sendPaymentConfirmationEmail(id);

      return c.json({
        success: true,
        message: 'Payment confirmed successfully'
      });

    } catch (error) {
      console.error('Error confirming payment:', error);
      return c.json({ error: 'Failed to confirm payment' }, 500);
    }
  }
);

// GET /api/orders/customer/:email - Get customer orders
orders.get('/customer/:email', requireAuth(), async (c) => {
  try {
    const email = c.req.param('email');
    const user = c.get('user');
    const db = c.get('db');
    
    // Ensure user can only access their own orders (unless admin)
    if (user.role !== 'admin' && user.email !== email) {
      return c.json({ error: 'Unauthorized access to customer orders' }, 403);
    }
    
    const result = await db.prepare(`
      SELECT * FROM orders 
      WHERE JSON_EXTRACT(customer_info, '$.email') = ?
      ORDER BY created_at DESC
    `).bind(email).all();

    return c.json({
      success: true,
      data: result.results
    });

  } catch (error) {
    console.error('Error fetching customer orders:', error);
    return c.json({ error: 'Failed to fetch orders' }, 500);
  }
});

export default orders;
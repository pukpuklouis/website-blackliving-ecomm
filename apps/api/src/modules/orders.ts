import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';
import type { Env } from '../index';

const orders = new Hono<{ Bindings: Env }>();

// Validation schemas
const createOrderSchema = z.object({
  customerInfo: z.object({
    name: z.string().min(1),
    email: z.string().email(),
    phone: z.string().min(1),
    address: z.string().min(1),
  }),
  items: z.array(z.object({
    productId: z.string(),
    productName: z.string(),
    variant: z.string(),
    quantity: z.number().positive(),
    price: z.number().positive(),
  })),
  totalAmount: z.number().positive(),
  paymentMethod: z.enum(['bank_transfer']).default('bank_transfer'),
  notes: z.string().optional(),
});

const updateOrderStatusSchema = z.object({
  status: z.enum(['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled']),
  notes: z.string().optional(),
});

// GET /api/orders - List orders (Admin only)
orders.get('/', async (c) => {
  try {
    // TODO: Add authentication middleware to check admin role
    const { status, limit = '50', offset = '0' } = c.req.query();
    
    let query = 'SELECT * FROM orders WHERE 1=1';
    const params: any[] = [];

    if (status) {
      query += ' AND status = ?';
      params.push(status);
    }

    query += ' ORDER BY created_at DESC LIMIT ? OFFSET ?';
    params.push(parseInt(limit), parseInt(offset));

    const result = await c.env.DB.prepare(query).bind(...params).all();
    
    return c.json({
      success: true,
      data: result.results,
      total: result.results.length
    });

  } catch (error) {
    console.error('Error fetching orders:', error);
    return c.json({ error: 'Failed to fetch orders' }, 500);
  }
});

// GET /api/orders/:id - Get single order
orders.get('/:id', async (c) => {
  try {
    const id = c.req.param('id');
    
    const result = await c.env.DB.prepare(
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
      
      const id = `BL${Date.now()}${Math.random().toString(36).substr(2, 4).toUpperCase()}`;
      const now = new Date().toISOString();

      await c.env.DB.prepare(`
        INSERT INTO orders (
          id, customer_info, items, total_amount, payment_method,
          status, notes, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).bind(
        id,
        JSON.stringify(data.customerInfo),
        JSON.stringify(data.items),
        data.totalAmount,
        data.paymentMethod,
        'pending',
        data.notes || '',
        now,
        now
      ).run();

      // Send notification email (implement later)
      // await sendOrderConfirmationEmail(id, data);

      return c.json({
        success: true,
        data: { 
          id, 
          status: 'pending',
          message: '訂單已建立成功，我們將盡快與您聯繫確認付款資訊' 
        }
      }, 201);

    } catch (error) {
      console.error('Error creating order:', error);
      return c.json({ error: 'Failed to create order' }, 500);
    }
  }
);

// PUT /api/orders/:id/status - Update order status (Admin only)
orders.put('/:id/status',
  zValidator('json', updateOrderStatusSchema),
  async (c) => {
    try {
      // TODO: Add authentication middleware to check admin role
      const id = c.req.param('id');
      const { status, notes } = c.req.valid('json');

      const now = new Date().toISOString();
      const updateNotes = notes ? notes : '';

      const result = await c.env.DB.prepare(`
        UPDATE orders 
        SET status = ?, notes = ?, updated_at = ?
        WHERE id = ?
      `).bind(status, updateNotes, now, id).run();

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

// GET /api/orders/customer/:email - Get customer orders
orders.get('/customer/:email', async (c) => {
  try {
    // TODO: Add authentication middleware to ensure user can only access their own orders
    const email = c.req.param('email');
    
    const result = await c.env.DB.prepare(`
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
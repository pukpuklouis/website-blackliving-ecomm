import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';
import type { Env } from '../index';

const appointments = new Hono<{ Bindings: Env }>();

// Validation schemas
const createAppointmentSchema = z.object({
  customerInfo: z.object({
    name: z.string().min(1),
    phone: z.string().min(1),
    email: z.string().email().optional(),
  }),
  storeLocation: z.enum(['中和', '中壢']),
  preferredDate: z.string(), // ISO date string
  preferredTime: z.enum(['上午', '下午', '晚上']),
  productInterest: z.array(z.string()).optional(),
  notes: z.string().optional(),
});

const updateAppointmentSchema = z.object({
  status: z.enum(['pending', 'confirmed', 'completed', 'cancelled']),
  confirmedDateTime: z.string().optional(), // ISO datetime string
  notes: z.string().optional(),
});

// GET /api/appointments - List appointments (Admin only)
appointments.get('/', async (c) => {
  try {
    // TODO: Add authentication middleware to check admin role
    const { status, store, date, limit = '50', offset = '0' } = c.req.query();
    
    let query = 'SELECT * FROM appointments WHERE 1=1';
    const params: any[] = [];

    if (status) {
      query += ' AND status = ?';
      params.push(status);
    }

    if (store) {
      query += ' AND store_location = ?';
      params.push(store);
    }

    if (date) {
      query += ' AND DATE(preferred_date) = ?';
      params.push(date);
    }

    query += ' ORDER BY preferred_date ASC, created_at DESC LIMIT ? OFFSET ?';
    params.push(parseInt(limit), parseInt(offset));

    const result = await c.env.DB.prepare(query).bind(...params).all();
    
    return c.json({
      success: true,
      data: result.results,
      total: result.results.length
    });

  } catch (error) {
    console.error('Error fetching appointments:', error);
    return c.json({ error: 'Failed to fetch appointments' }, 500);
  }
});

// GET /api/appointments/:id - Get single appointment
appointments.get('/:id', async (c) => {
  try {
    const id = c.req.param('id');
    
    const result = await c.env.DB.prepare(
      'SELECT * FROM appointments WHERE id = ?'
    ).bind(id).first();

    if (!result) {
      return c.json({ error: 'Appointment not found' }, 404);
    }

    return c.json({
      success: true,
      data: result
    });

  } catch (error) {
    console.error('Error fetching appointment:', error);
    return c.json({ error: 'Failed to fetch appointment' }, 500);
  }
});

// POST /api/appointments - Create new appointment
appointments.post('/',
  zValidator('json', createAppointmentSchema),
  async (c) => {
    try {
      const data = c.req.valid('json');
      
      const id = `APT${Date.now()}${Math.random().toString(36).substr(2, 4).toUpperCase()}`;
      const now = new Date().toISOString();

      await c.env.DB.prepare(`
        INSERT INTO appointments (
          id, customer_info, store_location, preferred_date, preferred_time,
          product_interest, status, notes, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).bind(
        id,
        JSON.stringify(data.customerInfo),
        data.storeLocation,
        data.preferredDate,
        data.preferredTime,
        JSON.stringify(data.productInterest || []),
        'pending',
        data.notes || '',
        now,
        now
      ).run();

      // Send confirmation SMS/Email (implement later)
      // await sendAppointmentConfirmation(id, data);

      return c.json({
        success: true,
        data: {
          id,
          status: 'pending',
          message: '預約已送出，我們將在24小時內與您聯繫確認時間',
          storeInfo: getStoreInfo(data.storeLocation)
        }
      }, 201);

    } catch (error) {
      console.error('Error creating appointment:', error);
      return c.json({ error: 'Failed to create appointment' }, 500);
    }
  }
);

// PUT /api/appointments/:id - Update appointment (Admin only)
appointments.put('/:id',
  zValidator('json', updateAppointmentSchema),
  async (c) => {
    try {
      // TODO: Add authentication middleware to check admin role
      const id = c.req.param('id');
      const { status, confirmedDateTime, notes } = c.req.valid('json');

      const now = new Date().toISOString();

      const result = await c.env.DB.prepare(`
        UPDATE appointments 
        SET status = ?, confirmed_datetime = ?, notes = ?, updated_at = ?
        WHERE id = ?
      `).bind(status, confirmedDateTime || null, notes || '', now, id).run();

      if (result.changes === 0) {
        return c.json({ error: 'Appointment not found' }, 404);
      }

      // Send status update notification (implement later)
      // await sendAppointmentStatusUpdate(id, status, confirmedDateTime);

      return c.json({
        success: true,
        message: 'Appointment updated successfully'
      });

    } catch (error) {
      console.error('Error updating appointment:', error);
      return c.json({ error: 'Failed to update appointment' }, 500);
    }
  }
);

// GET /api/appointments/customer/:phone - Get customer appointments
appointments.get('/customer/:phone', async (c) => {
  try {
    // TODO: Add authentication middleware to ensure user can only access their own appointments
    const phone = c.req.param('phone');
    
    const result = await c.env.DB.prepare(`
      SELECT * FROM appointments 
      WHERE JSON_EXTRACT(customer_info, '$.phone') = ?
      ORDER BY preferred_date DESC
    `).bind(phone).all();

    return c.json({
      success: true,
      data: result.results
    });

  } catch (error) {
    console.error('Error fetching customer appointments:', error);
    return c.json({ error: 'Failed to fetch appointments' }, 500);
  }
});

// GET /api/appointments/availability/:store/:date - Check availability
appointments.get('/availability/:store/:date', async (c) => {
  try {
    const store = c.req.param('store');
    const date = c.req.param('date');

    // Get existing appointments for the date
    const result = await c.env.DB.prepare(`
      SELECT preferred_time, COUNT(*) as count
      FROM appointments 
      WHERE store_location = ? AND DATE(preferred_date) = ? AND status != 'cancelled'
      GROUP BY preferred_time
    `).bind(store, date).all();

    const availability = {
      '上午': 5, // Max appointments per time slot
      '下午': 5,
      '晚上': 3
    };

    // Reduce availability based on existing appointments
    result.results.forEach((row: any) => {
      availability[row.preferred_time as keyof typeof availability] -= row.count;
    });

    return c.json({
      success: true,
      data: {
        date,
        store,
        availability
      }
    });

  } catch (error) {
    console.error('Error checking availability:', error);
    return c.json({ error: 'Failed to check availability' }, 500);
  }
});

// Helper function to get store information
function getStoreInfo(location: string) {
  const stores = {
    '中和': {
      name: 'Black Living 中和門市',
      address: '新北市中和區中正路123號',
      phone: '02-1234-5678',
      hours: '週一至週日 10:00-21:00'
    },
    '中壢': {
      name: 'Black Living 中壢門市', 
      address: '桃園市中壢區中山路456號',
      phone: '03-1234-5678',
      hours: '週一至週日 10:00-21:00'
    }
  };
  
  return stores[location as keyof typeof stores];
}

export default appointments;
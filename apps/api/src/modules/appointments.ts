import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';
import { requireAdmin, requireAuth } from '@blackliving/auth';
import type { Env } from '../index';

const appointments = new Hono<{
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
const createAppointmentSchema = z.object({
  storeId: z.string().min(1),
  productId: z.string().min(1),
  customerInfo: z.object({
    name: z.string().min(2, '姓名至少需要2個字符'),
    phone: z.string().min(10, '請輸入有效的電話號碼'),
    email: z.string().email('請輸入有效的Email地址'),
  }),
  preferredDate: z.string(), // YYYY-MM-DD
  preferredTime: z.string().min(1),
  message: z.string().default(''),
  createAccount: z.boolean().default(false),
  hasExistingAccount: z.boolean().default(false),
});

const updateAppointmentStatusSchema = z.object({
  status: z.enum(['pending', 'confirmed', 'completed', 'cancelled', 'no_show']),
  adminNotes: z.string().optional(),
  staffAssigned: z.string().optional(),
});

const confirmAppointmentSchema = z.object({
  status: z.enum(['confirmed']),
  confirmedDateTime: z.string().datetime(),
  adminNotes: z.string().optional(),
  staffAssigned: z.string().optional(),
});

// GET /api/appointments - List appointments (Admin only)
appointments.get('/', requireAdmin(), async (c) => {
  try {
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

    const result = await c.env.DB.prepare(query)
      .bind(...params)
      .all();

    // Parse JSON fields for each appointment
    const appointments = result.results.map((appointment: any) => ({
      ...appointment,
      customerInfo: JSON.parse(appointment.customer_info || '{}'),
      productInterest: JSON.parse(appointment.product_interest || '[]'),
      createdAt: new Date(appointment.created_at),
      updatedAt: new Date(appointment.updated_at),
      confirmedDateTime: appointment.confirmed_datetime
        ? new Date(appointment.confirmed_datetime)
        : null,
      actualVisitTime: appointment.actual_visit_time
        ? new Date(appointment.actual_visit_time)
        : null,
      completedAt: appointment.completed_at ? new Date(appointment.completed_at) : null,
    }));

    return c.json({
      success: true,
      data: { appointments },
      total: appointments.length,
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

    const result = await c.env.DB.prepare('SELECT * FROM appointments WHERE id = ?')
      .bind(id)
      .first();

    if (!result) {
      return c.json({ error: 'Appointment not found' }, 404);
    }

    return c.json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error('Error fetching appointment:', error);
    return c.json({ error: 'Failed to fetch appointment' }, 500);
  }
});

// POST /api/appointments - Create new appointment
appointments.post('/', zValidator('json', createAppointmentSchema), async (c) => {
  try {
    const data = c.req.valid('json');

    // Generate appointment number: AP + YYYYMMDD + sequence
    const today = new Date();
    const dateStr =
      today.getFullYear().toString() +
      (today.getMonth() + 1).toString().padStart(2, '0') +
      today.getDate().toString().padStart(2, '0');
    const appointmentNumber = `AP${dateStr}${Math.random().toString(36).substr(2, 4).toUpperCase()}`;

    const now = Date.now();

    const appointmentId = crypto.randomUUID();

    await c.env.DB.prepare(
      `
        INSERT INTO appointments (
          id, appointment_number, customer_info, store_location, preferred_date, 
          preferred_time, product_interest, visit_purpose, status, notes, 
          created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `
    )
      .bind(
        appointmentId,
        appointmentNumber,
        JSON.stringify(data.customerInfo),
        data.storeId,
        data.preferredDate,
        data.preferredTime,
        JSON.stringify([data.productId]),
        'trial',
        'pending',
        data.message,
        now,
        now
      )
      .run();

    // Send confirmation SMS/Email (implement later)
    // await sendAppointmentConfirmation(appointmentNumber, data);

    return c.json(
      {
        success: true,
        data: {
          appointmentId,
          appointmentNumber,
          status: 'pending',
          message: '預約已送出，我們將在24小時內與您聯繫確認時間',
          storeInfo: getStoreInfo(data.storeId),
        },
      },
      201
    );
  } catch (error) {
    console.error('Error creating appointment:', error);
    return c.json({ error: 'Failed to create appointment' }, 500);
  }
});

// PATCH /api/appointments/:id/status - Update appointment status (Admin only)
appointments.patch(
  '/:id/status',
  requireAdmin(),
  zValidator('json', updateAppointmentStatusSchema),
  async (c) => {
    try {
      const id = c.req.param('id');
      const { status, adminNotes, staffAssigned } = c.req.valid('json');

      const now = Date.now();
      let updateQuery = 'UPDATE appointments SET status = ?, updated_at = ?';
      let params = [status, now];

      if (adminNotes !== undefined) {
        updateQuery += ', admin_notes = ?';
        params.push(adminNotes);
      }

      if (staffAssigned !== undefined) {
        updateQuery += ', staff_assigned = ?';
        params.push(staffAssigned);
      }

      // Set completed_at when status becomes completed
      if (status === 'completed') {
        updateQuery += ', completed_at = ?';
        params.push(now);
      }

      updateQuery += ' WHERE id = ?';
      params.push(id);

      const result = await c.env.DB.prepare(updateQuery)
        .bind(...params)
        .run();

      if (result.changes === 0) {
        return c.json({ error: 'Appointment not found' }, 404);
      }

      // Send status update notification (implement later)
      // await sendAppointmentStatusUpdate(id, status);

      return c.json({
        success: true,
        message: 'Appointment status updated successfully',
      });
    } catch (error) {
      console.error('Error updating appointment status:', error);
      return c.json({ error: 'Failed to update appointment status' }, 500);
    }
  }
);

// PATCH /api/appointments/:id/confirm - Confirm appointment (Admin only)
appointments.patch(
  '/:id/confirm',
  requireAdmin(),
  zValidator('json', confirmAppointmentSchema),
  async (c) => {
    try {
      const id = c.req.param('id');
      const { status, confirmedDateTime, adminNotes, staffAssigned } = c.req.valid('json');

      const now = Date.now();
      const confirmedTime = new Date(confirmedDateTime).getTime();

      let updateQuery = `
        UPDATE appointments 
        SET status = ?, confirmed_datetime = ?, updated_at = ?
      `;
      let params = [status, confirmedTime, now];

      if (adminNotes !== undefined) {
        updateQuery += ', admin_notes = ?';
        params.push(adminNotes);
      }

      if (staffAssigned !== undefined) {
        updateQuery += ', staff_assigned = ?';
        params.push(staffAssigned);
      }

      updateQuery += ' WHERE id = ?';
      params.push(id);

      const result = await c.env.DB.prepare(updateQuery)
        .bind(...params)
        .run();

      if (result.changes === 0) {
        return c.json({ error: 'Appointment not found' }, 404);
      }

      // Send confirmation notification (implement later)
      // await sendAppointmentConfirmation(id);

      return c.json({
        success: true,
        message: 'Appointment confirmed successfully',
      });
    } catch (error) {
      console.error('Error confirming appointment:', error);
      return c.json({ error: 'Failed to confirm appointment' }, 500);
    }
  }
);

// GET /api/appointments/customer/:phone - Get customer appointments
appointments.get('/customer/:phone', async (c) => {
  try {
    // TODO: Add authentication middleware to ensure user can only access their own appointments
    const phone = c.req.param('phone');

    const result = await c.env.DB.prepare(
      `
      SELECT * FROM appointments 
      WHERE JSON_EXTRACT(customer_info, '$.phone') = ?
      ORDER BY preferred_date DESC
    `
    )
      .bind(phone)
      .all();

    return c.json({
      success: true,
      data: result.results,
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
    const result = await c.env.DB.prepare(
      `
      SELECT preferred_time, COUNT(*) as count
      FROM appointments 
      WHERE store_location = ? AND DATE(preferred_date) = ? AND status != 'cancelled'
      GROUP BY preferred_time
    `
    )
      .bind(store, date)
      .all();

    const availability = {
      上午: 5, // Max appointments per time slot
      下午: 5,
      晚上: 3,
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
        availability,
      },
    });
  } catch (error) {
    console.error('Error checking availability:', error);
    return c.json({ error: 'Failed to check availability' }, 500);
  }
});

// Helper function to get store information
function getStoreInfo(location: string) {
  const stores = {
    zhonghe: {
      name: 'Black Living 中和門市',
      address: '新北市中和區中正路123號',
      phone: '02-1234-5678',
      hours: '週一至週日 10:00-21:00',
    },
    zhongli: {
      name: 'Black Living 中壢門市',
      address: '桃園市中壢區中山路456號',
      phone: '03-1234-5678',
      hours: '週一至週日 10:00-21:00',
    },
  };

  return stores[location as keyof typeof stores];
}

export default appointments;

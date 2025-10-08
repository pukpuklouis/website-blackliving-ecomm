import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';
import { createId } from '@paralleldrive/cuid2';
import { and, eq } from 'drizzle-orm';
import { appointments, reservations, users } from '@blackliving/db/schema';
import type { Env } from '../index';
import { verifyAccessToken } from './auth';

const reservationsRouter = new Hono<{
  Bindings: Env;
  Variables: {
    db: any;
    cache: any;
  };
}>();

const reservationSchema = z.object({
  storeId: z.string().min(1, '請選擇門市'),
  productId: z.string().min(1, '請選擇產品'),
  preferredDate: z.string().min(1, '請選擇日期'),
  preferredTime: z.string().min(1, '請選擇時段'),
  message: z.string().max(500).optional().default(''),
  customerInfo: z.object({
    name: z.string().min(2, '請輸入姓名'),
    phone: z.string().min(8, '請輸入聯絡電話'),
    email: z.string().email('請輸入有效的Email'),
  }),
});

function parseAccessToken(c: any) {
  const authHeader = c.req.header('Authorization');
  if (authHeader?.startsWith('Bearer ')) {
    return authHeader.slice('Bearer '.length).trim();
  }

  const cookieToken = c.req.cookie('bl_access_token');
  if (cookieToken) {
    return cookieToken;
  }

  return null;
}

reservationsRouter.post('/create', zValidator('json', reservationSchema), async (c) => {
  try {
    const token = parseAccessToken(c);
    if (!token) {
      return c.json({ success: false, error: '未登入或登入已失效' }, 401);
    }

    let session;
    try {
      session = await verifyAccessToken(token, c.env);
    } catch (error) {
      console.error('Access token verification failed:', error);
      return c.json({ success: false, error: '登入資訊無效，請重新登入' }, 401);
    }

    const db = c.get('db');
    const data = c.req.valid('json');

    const [user] = await db.select().from(users).where(eq(users.id, session.userId)).limit(1);

    if (!user) {
      return c.json({ success: false, error: '找不到使用者帳號' }, 404);
    }

    const now = new Date();
    const appointmentId = createId();
    const reservationId = createId();

    const appointmentNumber = (() => {
      const today = new Date();
      const dateStr =
        today.getFullYear().toString() +
        (today.getMonth() + 1).toString().padStart(2, '0') +
        today.getDate().toString().padStart(2, '0');
      return `AP${dateStr}${Math.random().toString(36).substring(2, 6).toUpperCase()}`;
    })();

    const reservationPayload = {
      id: reservationId,
      userId: user.id,
      reservationData: JSON.stringify({
        storeId: data.storeId,
        productId: data.productId,
        preferredDate: data.preferredDate,
        preferredTime: data.preferredTime,
        message: data.message,
        customerInfo: data.customerInfo,
      }),
      status: 'pending',
      verificationPending: user.emailVerified ? 0 : 1,
      appointmentId,
      createdAt: now,
      updatedAt: now,
    };

    const appointmentPayload = {
      id: appointmentId,
      appointmentNumber,
      userId: user.id,
      customerInfo: JSON.stringify(data.customerInfo),
      storeLocation: data.storeId,
      preferredDate: data.preferredDate,
      preferredTime: data.preferredTime,
      productInterest: JSON.stringify([data.productId]),
      visitPurpose: 'trial',
      status: 'pending',
      notes: data.message || '',
      createdAt: now,
      updatedAt: now,
    };

    let verificationPending = !user.emailVerified;

    await db.transaction(async (tx: any) => {
      await tx.insert(reservations).values(reservationPayload);
      await tx.insert(appointments).values(appointmentPayload);
    });

    // Re-fetch appointment to ensure data integrity
    const [createdReservation] = await db
      .select()
      .from(reservations)
      .where(and(eq(reservations.id, reservationId), eq(reservations.userId, user.id)))
      .limit(1);

    return c.json(
      {
        success: true,
        data: {
          reservationId,
          appointmentId,
          appointmentNumber,
          verificationPending,
          status: 'pending',
          createdAt: now.toISOString(),
          reservation: createdReservation,
        },
      },
      201
    );
  } catch (error) {
    console.error('Error creating reservation:', error);
    return c.json({ success: false, error: '建立預約時發生錯誤，請稍後再試' }, 500);
  }
});

export default reservationsRouter;

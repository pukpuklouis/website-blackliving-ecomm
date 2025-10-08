import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';
import { requireAuth } from '@blackliving/auth';
import type { Env } from '../index';

const user = new Hono<{
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
const updateProfileSchema = z.object({
  name: z.string().optional(),
  phone: z.string().optional(),
});

const checkEmailSchema = z.object({
  email: z.string().email('請輸入有效的Email地址'),
});

const createAccountSchema = z.object({
  email: z.string().email('請輸入有效的Email地址'),
  name: z.string().min(2, '姓名至少需要2個字符'),
  phone: z.string().min(10, '請輸入有效的電話號碼'),
  appointmentId: z.string().optional(),
});

// PUT /api/user/profile - Update user profile
user.put('/profile', requireAuth(), zValidator('json', updateProfileSchema), async (c) => {
  try {
    const { name, phone } = c.req.valid('json');
    const currentUser = c.get('user');

    if (!currentUser) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const db = c.get('db');
    const auth = c.get('auth');

    // Update user in database via Better Auth
    const updateData: any = {};
    if (name !== undefined) updateData.name = name;
    if (phone !== undefined) updateData.phone = phone;

    // Use Better Auth's user update method
    await auth.api.updateUser({
      userId: currentUser.id,
      update: updateData,
    });

    return c.json({
      success: true,
      message: 'Profile updated successfully',
    });
  } catch (error) {
    console.error('Error updating profile:', error);
    return c.json({ error: 'Failed to update profile' }, 500);
  }
});

// GET /api/user/profile - Get user profile
user.get('/profile', requireAuth(), async (c) => {
  try {
    const currentUser = c.get('user');

    if (!currentUser) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    return c.json({
      success: true,
      data: {
        id: currentUser.id,
        email: currentUser.email,
        name: currentUser.name,
        phone: currentUser.phone,
        role: currentUser.role,
      },
    });
  } catch (error) {
    console.error('Error fetching profile:', error);
    return c.json({ error: 'Failed to fetch profile' }, 500);
  }
});

// POST /api/user/check-email - Check if email exists
user.post('/check-email', zValidator('json', checkEmailSchema), async (c) => {
  try {
    const { email } = c.req.valid('json');
    const auth = c.get('auth');

    // Use Better Auth to check if user exists
    const existingUser = await auth.api.getUserByEmail({
      email: email,
    });

    return c.json({
      success: true,
      data: {
        exists: !!existingUser,
        email: email,
      },
    });
  } catch (error) {
    // If user doesn't exist, Better Auth might throw an error
    // In that case, we consider the email as not existing
    console.log('Email check result:', error);

    return c.json({
      success: true,
      data: {
        exists: false,
        email: c.req.valid('json').email,
      },
    });
  }
});

// POST /api/user/create-account - Legacy endpoint retained for compatibility
user.post('/create-account', zValidator('json', createAccountSchema), async (c) => {
  const { email } = c.req.valid('json');

  return c.json(
    {
      success: false,
      error: '此端點已淘汰，請使用新的 Magic Link 登入流程',
      message: `我們已更新預約流程，請使用 /api/auth/initiate 取得登入連結：${email}`,
    },
    410
  );
});

export default user;

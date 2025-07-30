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

// PUT /api/user/profile - Update user profile
user.put('/profile',
  requireAuth(),
  zValidator('json', updateProfileSchema),
  async (c) => {
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
        update: updateData
      });

      return c.json({
        success: true,
        message: 'Profile updated successfully'
      });

    } catch (error) {
      console.error('Error updating profile:', error);
      return c.json({ error: 'Failed to update profile' }, 500);
    }
  }
);

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
        role: currentUser.role
      }
    });

  } catch (error) {
    console.error('Error fetching profile:', error);
    return c.json({ error: 'Failed to fetch profile' }, 500);
  }
});

export default user;
import { describe, it, expect } from 'vitest';
import { Hono } from 'hono';
import { HTTPException } from 'hono/http-exception';
import { requireAdmin } from './auth';
import { createMockAuthMiddleware } from '../lib/test-auth-mock';

type TestEnv = {
  Variables: {
    session: {
      user: {
        id: string;
        role: string;
      };
    } | null;
  };
};

describe('requireAdmin Middleware Integration Test', () => {
  const setupAppWithMockedAuth = (userType: 'admin' | 'customer' | 'none') => {
    const app = new Hono<TestEnv>();

    app.onError((err, c) => {
      if (err instanceof HTTPException) {
        return c.json({ error: err.message }, err.status);
      }
      return c.json({ error: 'Internal Server Error' }, 500);
    });

    const mockAuthMiddleware = createMockAuthMiddleware(userType);
    app.use('*', mockAuthMiddleware);
    app.use('/admin/*', requireAdmin());

    app.get('/admin/test', (c) => {
      return c.json({ success: true, message: 'Welcome, admin!' });
    });

    return app;
  };

  it('should allow access for users with the "admin" role', async () => {
    const app = setupAppWithMockedAuth('admin');
    const res = await app.request('/admin/test');
    expect(res.status).toBe(200);
    const body = await res.json<{ success: boolean }>();
    expect(body.success).toBe(true);
  });

  it('should deny access and return 403 for users with "customer" role', async () => {
    const app = setupAppWithMockedAuth('customer');
    const res = await app.request('/admin/test');
    expect(res.status).toBe(403);
    const body = await res.json<{ error: string }>();
    expect(body.error).toBe('Admin access required');
  });

  it('should deny access and return 403 for guests (no session)', async () => {
    const app = setupAppWithMockedAuth('none');
    const res = await app.request('/admin/test');
    expect(res.status).toBe(401);
    const body = await res.json<{ error: string }>();
    expect(body.error).toBe('Authentication required');
  });
});
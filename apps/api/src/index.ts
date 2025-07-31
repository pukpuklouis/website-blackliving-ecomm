import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { logger } from 'hono/logger';
import { zValidator } from '@hono/zod-validator';
import { createDB } from '@blackliving/db';
import { createAuth, createAuthMiddleware } from '@blackliving/auth';
import { users, sessions } from '@blackliving/db/schema';
import { eq } from 'drizzle-orm';
import { createCacheManager } from './lib/cache';
import { createStorageManager } from './lib/storage';
import type { D1Database, R2Bucket, KVNamespace } from '@cloudflare/workers-types';

// Import API modules
import products from './modules/products';
import orders from './modules/orders';
import appointments from './modules/appointments';
import admin from './modules/admin';
import reviews from './modules/reviews';
import newsletter from './modules/newsletter';
import contact from './modules/contact';
import user from './modules/user';

export interface Env {
  DB: D1Database;
  R2: R2Bucket;
  CACHE: KVNamespace;
  NODE_ENV: string;
  JWT_SECRET: string;
  BETTER_AUTH_SECRET: string;
  GOOGLE_CLIENT_ID: string;
  GOOGLE_CLIENT_SECRET: string;
  GOOGLE_ADMIN_CLIENT_ID: string;
  GOOGLE_ADMIN_CLIENT_SECRET: string;
  GOOGLE_CUSTOMER_CLIENT_ID: string;
  GOOGLE_CUSTOMER_CLIENT_SECRET: string;
}

const app = new Hono<{ 
  Bindings: Env;
  Variables: {
    db: ReturnType<typeof createDB>;
    cache: ReturnType<typeof createCacheManager>;
    storage: ReturnType<typeof createStorageManager>;
    auth: ReturnType<typeof createAuth>;
    user: any;
    session: any;
  };
}>();

// Middleware setup
app.use('*', logger());
app.use('*', cors({
  origin: ['http://localhost:4321', 'http://localhost:5173', 'https://blackliving.com', 'https://admin.blackliving.com'],
  allowHeaders: ['Content-Type', 'Authorization', 'Cookie'],
  allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  credentials: true,
}));

// Initialize services middleware
app.use('*', async (c, next) => {
  const db = createDB(c.env.DB);
  const cache = createCacheManager(c.env.CACHE);
  const storage = createStorageManager(c.env.R2);
  const auth = createAuth(db, {
    GOOGLE_CLIENT_ID: c.env.GOOGLE_CLIENT_ID,
    GOOGLE_CLIENT_SECRET: c.env.GOOGLE_CLIENT_SECRET,
    NODE_ENV: c.env.NODE_ENV,
    BETTER_AUTH_SECRET: c.env.BETTER_AUTH_SECRET,
  });

  c.set('db', db);
  c.set('cache', cache);
  c.set('storage', storage);
  c.set('auth', auth);

  await next();
});

// Auth middleware for session handling
app.use('*', async (c, next) => {
  const auth = c.get('auth');
  const authMiddleware = createAuthMiddleware(auth);
  return authMiddleware(c, next);
});

// Health check
app.get('/', (c) => {
  return c.json({ 
    message: 'Black Living API is running',
    timestamp: new Date().toISOString(),
    version: '1.0.0'
  });
});

// ======= 純正 Option B: 兩組獨立的 OAuth Client =======

// Admin OAuth 登入端點 - 使用 Admin Client ID
app.post('/api/auth/admin/sign-in/social/google', async (c) => {
  try {
    const adminClientId = c.env.GOOGLE_ADMIN_CLIENT_ID;
    const adminClientSecret = c.env.GOOGLE_ADMIN_CLIENT_SECRET;
    
    if (!adminClientId || !adminClientSecret) {
      return c.json({ error: 'Admin OAuth credentials not configured' }, 500);
    }

    const baseURL = c.env.NODE_ENV === "production" ? "https://api.blackliving.com" : "http://localhost:8787";
    const adminRedirectUri = `${baseURL}/api/auth/callback/google/admin`;
    
    // 構建 Google OAuth URL (Admin Client)
    const googleOAuthURL = new URL('https://accounts.google.com/o/oauth2/v2/auth');
    googleOAuthURL.searchParams.set('client_id', adminClientId);
    googleOAuthURL.searchParams.set('redirect_uri', adminRedirectUri);
    googleOAuthURL.searchParams.set('response_type', 'code');
    googleOAuthURL.searchParams.set('scope', 'openid email profile');
    googleOAuthURL.searchParams.set('state', 'admin'); // Admin 專用 state
    
    return c.json({
      url: googleOAuthURL.toString(),
      redirectUri: adminRedirectUri,
      clientType: 'admin'
    });
  } catch (error) {
    console.error('Admin OAuth error:', error);
    return c.json({ error: 'Admin OAuth failed', message: error instanceof Error ? error.message : 'Unknown error' }, 500);
  }
});

// Customer OAuth 登入端點 - 使用 Customer Client ID  
app.post('/api/auth/customer/sign-in/social/google', async (c) => {
  try {
    const customerClientId = c.env.GOOGLE_CUSTOMER_CLIENT_ID;
    const customerClientSecret = c.env.GOOGLE_CUSTOMER_CLIENT_SECRET;
    
    if (!customerClientId || !customerClientSecret) {
      return c.json({ error: 'Customer OAuth credentials not configured' }, 500);
    }

    const baseURL = c.env.NODE_ENV === "production" ? "https://api.blackliving.com" : "http://localhost:8787";
    const customerRedirectUri = `${baseURL}/api/auth/callback/google/customer`;
    
    // 構建 Google OAuth URL (Customer Client)
    const googleOAuthURL = new URL('https://accounts.google.com/o/oauth2/v2/auth');
    googleOAuthURL.searchParams.set('client_id', customerClientId);
    googleOAuthURL.searchParams.set('redirect_uri', customerRedirectUri);
    googleOAuthURL.searchParams.set('response_type', 'code');
    googleOAuthURL.searchParams.set('scope', 'openid email profile');
    googleOAuthURL.searchParams.set('state', 'customer'); // Customer 專用 state
    
    return c.json({
      url: googleOAuthURL.toString(),
      redirectUri: customerRedirectUri,
      clientType: 'customer'
    });
  } catch (error) {
    console.error('Customer OAuth error:', error);
    return c.json({ error: 'Customer OAuth failed', message: error instanceof Error ? error.message : 'Unknown error' }, 500);
  }
});

// Admin OAuth 回呼端點 - 永遠重導向到 Admin Dashboard
app.get('/api/auth/callback/google/admin', async (c) => {
  try {
    const url = new URL(c.req.url);
    const code = url.searchParams.get('code');
    const state = url.searchParams.get('state');
    
    if (!code) {
      return c.json({ error: 'Missing authorization code' }, 400);
    }
    
    if (state !== 'admin') {
      return c.json({ error: 'Invalid state parameter' }, 400);
    }

    // 使用 Admin OAuth credentials 交換 token
    const adminClientId = c.env.GOOGLE_ADMIN_CLIENT_ID;
    const adminClientSecret = c.env.GOOGLE_ADMIN_CLIENT_SECRET;
    const redirectUri = `${c.env.NODE_ENV === "production" ? "https://api.blackliving.com" : "http://localhost:8787"}/api/auth/callback/google/admin`;
    
    // 與 Google 交換 access token
    const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        client_id: adminClientId,
        client_secret: adminClientSecret,
        code: code,
        grant_type: 'authorization_code',
        redirect_uri: redirectUri,
      }),
    });

    if (!tokenResponse.ok) {
      console.error('Token exchange failed:', await tokenResponse.text());
      return c.json({ error: 'Token exchange failed' }, 500);
    }

    const tokenData = await tokenResponse.json() as { access_token: string };
    
    // 獲取用戶資訊
    const userResponse = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
      headers: {
        'Authorization': `Bearer ${tokenData.access_token}`,
      },
    });

    if (!userResponse.ok) {
      console.error('Failed to get user info:', await userResponse.text());
      return c.json({ error: 'Failed to get user info' }, 500);
    }

    const userData = await userResponse.json();
    
    // 使用 Better Auth 創建或更新用戶 (強制設為 admin 角色)
    const auth = c.get('auth');
    const db = c.get('db');
    
    // 使用 Better Auth API 創建或獲取用戶
    try {
      const existingUser = await db.select().from(users).where(eq(users.email, userData.email)).limit(1).then(r => r[0]);

      let user;
      if (!existingUser) {
        // 創建新的 admin 用戶
        const [newUser] = await db.insert(users).values({
          email: userData.email,
          name: userData.name,
          image: userData.picture,
          emailVerified: true,
          role: 'admin', // 強制設為 admin 角色
        }).returning();
        user = newUser;
      } else {
        // 更新現有用戶角色為 admin（Option B 強制設為 admin）
        const [updatedUser] = await db.update(users)
          .set({ 
            role: 'admin',
            name: userData.name,
            image: userData.picture,
            updatedAt: new Date(),
          })
          .where(eq(users.id, existingUser.id))
          .returning();
        user = updatedUser;
      }

      // 創建 session
      const sessionToken = crypto.randomUUID();
      const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

      await db.insert(sessions).values({
        id: crypto.randomUUID(),
        token: sessionToken,
        userId: user.id,
        expiresAt,
        userAgent: c.req.header('User-Agent') || '',
        ipAddress: c.req.header('CF-Connecting-IP') || c.req.header('X-Forwarded-For') || '',
      });

      // 設置 session cookie
      c.header('Set-Cookie', `better-auth.session_token=${sessionToken}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=604800`);
      
      console.log('Admin user created/updated:', user);
    } catch (dbError) {
      console.error('Database error:', dbError);
      // 繼續執行重導向，但記錄錯誤
    }
    
    // 永遠重導向到 Admin Dashboard
    const adminDashboardURL = `${c.env.NODE_ENV === "production" ? "https://admin.blackliving.com" : "http://localhost:5173"}/dashboard`;
    return c.redirect(adminDashboardURL);
    
  } catch (error) {
    console.error('Admin OAuth callback error:', error);
    return c.json({ error: 'Admin OAuth callback failed' }, 500);
  }
});

// Customer OAuth 回呼端點 - 永遠重導向到 Customer Account  
app.get('/api/auth/callback/google/customer', async (c) => {
  try {
    const url = new URL(c.req.url);
    const code = url.searchParams.get('code');
    const state = url.searchParams.get('state');
    
    if (!code) {
      return c.json({ error: 'Missing authorization code' }, 400);
    }
    
    if (state !== 'customer') {
      return c.json({ error: 'Invalid state parameter' }, 400);
    }

    // 使用 Customer OAuth credentials 交換 token
    const customerClientId = c.env.GOOGLE_CUSTOMER_CLIENT_ID;
    const customerClientSecret = c.env.GOOGLE_CUSTOMER_CLIENT_SECRET;
    const redirectUri = `${c.env.NODE_ENV === "production" ? "https://api.blackliving.com" : "http://localhost:8787"}/api/auth/callback/google/customer`;
    
    // 與 Google 交換 access token
    const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        client_id: customerClientId,
        client_secret: customerClientSecret,
        code: code,
        grant_type: 'authorization_code',
        redirect_uri: redirectUri,
      }),
    });

    if (!tokenResponse.ok) {
      console.error('Token exchange failed:', await tokenResponse.text());
      return c.json({ error: 'Token exchange failed' }, 500);
    }

    const tokenData = await tokenResponse.json() as { access_token: string };
    
    // 獲取用戶資訊
    const userResponse = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
      headers: {
        'Authorization': `Bearer ${tokenData.access_token}`,
      },
    });

    if (!userResponse.ok) {
      console.error('Failed to get user info:', await userResponse.text());
      return c.json({ error: 'Failed to get user info' }, 500);
    }

    const userData = await userResponse.json();
    
    // 使用 Better Auth 創建或更新用戶 (設為 customer 角色)
    const auth = c.get('auth');
    const db = c.get('db');
    
    // 使用 Better Auth API 創建或獲取用戶
    try {
      const existingUser = await db.select().from(users).where(eq(users.email, userData.email)).limit(1).then(r => r[0]);

      let user;
      if (!existingUser) {
        // 創建新的 customer 用戶
        const [newUser] = await db.insert(users).values({
          email: userData.email,
          name: userData.name,
          image: userData.picture,
          emailVerified: true,
          role: 'customer', // 設為 customer 角色
        }).returning();
        user = newUser;
      } else {
        // 更新現有用戶 (保持原有角色，除非需要強制設為 customer)
        const [updatedUser] = await db.update(users)
          .set({ 
            name: userData.name,
            image: userData.picture,
            updatedAt: new Date(),
          })
          .where(eq(users.id, existingUser.id))
          .returning();
        user = updatedUser;
      }

      // 創建 session
      const sessionToken = crypto.randomUUID();
      const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

      await db.insert(sessions).values({
        id: crypto.randomUUID(),
        token: sessionToken,
        userId: user.id,
        expiresAt,
        userAgent: c.req.header('User-Agent') || '',
        ipAddress: c.req.header('CF-Connecting-IP') || c.req.header('X-Forwarded-For') || '',
      });

      // 設置 session cookie
      c.header('Set-Cookie', `better-auth.session_token=${sessionToken}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=604800`);
      
      console.log('Customer user created/updated:', user);
    } catch (dbError) {
      console.error('Database error:', dbError);
      // 繼續執行重導向，但記錄錯誤
    }
    
    // 永遠重導向到 Customer Account
    const customerAccountURL = `${c.env.NODE_ENV === "production" ? "https://blackliving.com" : "http://localhost:4321"}/account/profile`;
    return c.redirect(customerAccountURL);
    
  } catch (error) {
    console.error('Customer OAuth callback error:', error);
    return c.json({ error: 'Customer OAuth callback failed' }, 500);
  }
});

// API Routes
app.route('/api/products', products);
app.route('/api/orders', orders);
app.route('/api/appointments', appointments);
app.route('/api/admin', admin);
app.route('/api/reviews', reviews);
app.route('/api/newsletter', newsletter);
app.route('/api/contact', contact);
app.route('/api/user', user);

// Better Auth integration (handles all other /api/auth/* routes - must be last)
app.use('/api/auth/*', async (c, next) => {
  try {
    const auth = c.get('auth');
    const response = await auth.handler(c.req.raw);
    
    // Copy response headers
    response.headers.forEach((value, key) => {
      c.header(key, value);
    });
    
    // Return response with proper status
    return new Response(response.body, {
      status: response.status,
      statusText: response.statusText,
      headers: response.headers,
    });
  } catch (error) {
    console.error('Better Auth handler error:', error);
    return c.json({ error: 'Authentication service error', message: error instanceof Error ? error.message : 'Unknown error' }, 500);
  }
});

// 404 handler
app.notFound((c) => {
  return c.json({ error: 'Not Found', message: 'The requested endpoint does not exist' }, 404);
});

// Error handler
app.onError((err, c) => {
  console.error('API Error:', err);
  return c.json({ 
    error: 'Internal Server Error', 
    message: c.env.NODE_ENV === 'development' ? err.message : 'Something went wrong'
  }, 500);
});

export default app;
export { app };
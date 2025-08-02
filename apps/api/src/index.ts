import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { logger } from 'hono/logger';
import { zValidator } from '@hono/zod-validator';
import { createDB } from '@blackliving/db';
import { createAuth, createBetterAuthMiddleware } from '@blackliving/auth';
import { users, sessions } from '@blackliving/db/schema';
import { eq } from 'drizzle-orm';
import { createCacheManager } from './lib/cache';
import { createStorageManager } from './lib/storage';
import type { D1Database, R2Bucket, KVNamespace } from '@cloudflare/workers-types';

// Import API modules
import products from './modules/products';
import orders from './modules/orders';
import appointments from './modules/appointments';
import customers from './modules/customers';
import admin from './modules/admin';
import reviews from './modules/reviews';
import newsletter from './modules/newsletter';
import contact from './modules/contact';
import user from './modules/user';
import { postsRouter } from './modules/posts';

export interface Env {
  DB: D1Database;
  R2: R2Bucket;
  CACHE: KVNamespace;
  NODE_ENV: string;
  BETTER_AUTH_SECRET: string;
  GOOGLE_CLIENT_ID: string;
  GOOGLE_CLIENT_SECRET: string;
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
  origin: (origin) => {
    // Allow all origins in development by reflecting the request origin
    if (process.env.NODE_ENV === 'development') {
      return origin;
    }
    
    // Production whitelist
    const allowedOrigins = [
      'http://localhost:4321',
      'http://localhost:5173',
      'http://localhost:8787',
      'https://blackliving.com',
      'https://admin.blackliving.com',
      'https://api.blackliving.com',
    ];
    
    // Allow if origin is in the whitelist or if it's a same-origin/server request (no origin)
    if (!origin || allowedOrigins.includes(origin)) {
      return origin;
    }
    
    // Block all other origins
    return undefined;
  },
  allowHeaders: ['Content-Type', 'Authorization', 'Cookie', 'X-Requested-With'],
  allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  credentials: true,
  maxAge: 86400, // 24 hours
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

// Better Auth middleware for session handling
app.use('*', async (c, next) => {
  const auth = c.get('auth');
  const authMiddleware = createBetterAuthMiddleware(auth);
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

app.get("/api/auth/test", (c) => c.json({ message: "Test route works" }));

// Note: Better Auth handles OAuth endpoints automatically via the /api/auth/* handler below
// Custom role assignment logic will be handled via middleware or callback hooks

// Role assignment endpoint - for upgrading users to admin after OAuth
app.post('/api/auth/assign-admin-role', async (c) => {
  try {
    const user = c.get('user');
    if (!user) {
      return c.json({ error: 'Authentication required' }, 401);
    }
    
    const db = c.get('db');
    
    // Update user role to admin
    const [updatedUser] = await db.update(users)
      .set({ 
        role: 'admin',
        updatedAt: new Date(),
      })
      .where(eq(users.id, user.id))
      .returning();
    
    return c.json({
      success: true,
      user: {
        id: updatedUser.id,
        email: updatedUser.email,
        role: updatedUser.role,
      }
    });
  } catch (error) {
    console.error('Role assignment error:', error);
    return c.json({ error: 'Failed to assign admin role' }, 500);
  }
});

// Debug and Development Endpoints

// Session check endpoint - uses Better Auth session validation
app.get('/api/auth/session', async (c) => {
  const user = c.get('user');
  const session = c.get('session');
  
  return c.json({
    user,
    session,
    authenticated: !!user,
  });
});

// Debug endpoint to check environment variables
app.get('/api/auth/debug/env', async (c) => {
  if (c.env.NODE_ENV !== 'development') {
    return c.json({ error: 'Only available in development' }, 403);
  }
  
  return c.json({
    NODE_ENV: c.env.NODE_ENV,
    hasGoogleClientId: !!c.env.GOOGLE_CLIENT_ID,
    googleClientIdLength: c.env.GOOGLE_CLIENT_ID?.length || 0,
    hasGoogleClientSecret: !!c.env.GOOGLE_CLIENT_SECRET,
    googleClientSecretLength: c.env.GOOGLE_CLIENT_SECRET?.length || 0,
    hasBetterAuthSecret: !!c.env.BETTER_AUTH_SECRET,
    betterAuthSecretLength: c.env.BETTER_AUTH_SECRET?.length || 0,
  });
});

// Debug endpoint to test Better Auth configuration
app.get('/api/auth/debug/config', async (c) => {
  if (c.env.NODE_ENV !== 'development') {
    return c.json({ error: 'Only available in development' }, 403);
  }
  
  try {
    const auth = c.get('auth');
    
    if (!auth) {
      return c.json({ error: 'Auth instance not found' }, 500);
    }
    
    // Get auth configuration (safely extract what we can)
    const baseURL = typeof auth.options?.baseURL === 'string' ? auth.options.baseURL : 'unknown';
    const hasGoogleProvider = auth.options?.socialProviders?.google ? true : false;
    const googleClientId = auth.options?.socialProviders?.google?.clientId;
    
    return c.json({
      success: true,
      baseURL,
      hasGoogleProvider,
      googleClientIdPresent: !!googleClientId,
      googleClientIdLength: googleClientId?.length || 0,
    });
    
  } catch (error) {
    return c.json({
      error: 'Better Auth config check failed',
      message: error instanceof Error ? error.message : 'Unknown error',
    }, 500);
  }
});

// Debug endpoint for development - force admin login
app.post('/api/auth/debug/force-admin-login', async (c) => {
  if (c.env.NODE_ENV !== 'development') {
    return c.json({ error: 'Only available in development' }, 403);
  }
  
  try {
    const { email = 'pukpuk.tw@gmail.com' } = await c.req.json().catch(() => ({}));
    const db = c.get('db');
    const auth = c.get('auth');
    
    // Ensure user exists and is admin
    let user = await db.select().from(users).where(eq(users.email, email)).limit(1).then(r => r[0]);
    
    if (!user) {
      const [newUser] = await db.insert(users).values({
        email,
        name: 'Admin User',
        role: 'admin',
        emailVerified: true,
      }).returning();
      user = newUser;
    } else {
      // Update to admin
      const [updatedUser] = await db.update(users)
        .set({ role: 'admin' })
        .where(eq(users.id, user.id))
        .returning();
      user = updatedUser;
    }
    
    // Use Better Auth to create session
    const signInRequest = new Request(`${c.req.url.replace('/debug/force-admin-login', '/sign-in/email')}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: user.email, password: 'dev-login' }),
    });
    
    const authResponse = await auth.handler(signInRequest);
    
    // Copy session cookies
    const setCookieHeaders = authResponse.headers.getSetCookie?.() || [];
    for (const cookieHeader of setCookieHeaders) {
      c.header('Set-Cookie', cookieHeader);
    }
    
    return c.json({
      success: true,
      user: { id: user.id, email: user.email, role: user.role },
    });
    
  } catch (error) {
    console.error('Force admin login error:', error);
    return c.json({ error: 'Failed to force admin login' }, 500);
  }
});


// Better Auth integration - handles all remaining /api/auth/* routes
// MUST be placed AFTER custom auth routes to avoid intercepting them
app.all("/api/auth/*", async (c) => {
  try {
    const auth = c.get("auth");
    
    // Better Auth expects a standard Request object
    return auth.handler(c.req.raw);
    
  } catch (error) {
    console.error("Better Auth handler error:", error);
    return c.json({ 
      error: "Authentication service error", 
      message: error instanceof Error ? error.message : "Unknown error" 
    }, 500);
  }
});
// API Routes
app.route('/api/products', products);
app.route('/api/orders', orders);
app.route('/api/appointments', appointments);
app.route('/api/customers', customers);
app.route('/api/admin', admin);
app.route('/api/reviews', reviews);
app.route('/api/newsletter', newsletter);
app.route('/api/contact', contact);
app.route('/api/user', user);
app.route('/api/posts', postsRouter);


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

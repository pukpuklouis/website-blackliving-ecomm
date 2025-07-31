import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { logger } from 'hono/logger';
import { zValidator } from '@hono/zod-validator';
import { createDB } from '@blackliving/db';
import { createAuth, createAuthMiddleware } from '@blackliving/auth';
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

// Better Auth integration (temporarily disabled)
// app.use('/auth/*', async (c, next) => {
//   // Better Auth middleware will be integrated here
//   const auth = createAuth({
//     NODE_ENV: c.env.NODE_ENV,
//     GOOGLE_CLIENT_ID: c.env.GOOGLE_CLIENT_ID,
//     GOOGLE_CLIENT_SECRET: c.env.GOOGLE_CLIENT_SECRET,
//   });
//   return auth.handler(c.req.raw);
// });

// Better Auth routes (handle authentication endpoints)
app.all('/api/auth/*', async (c) => {
  try {
    const auth = c.get('auth');
    // Create a new Request object from the incoming request
    const request = new Request(c.req.url, {
      method: c.req.method,
      headers: c.req.header(),
      body: c.req.raw.body,
    });
    
    console.log('Calling auth.handler with URL:', request.url);
    const response = await auth.handler(request);
    console.log('Auth handler response status:', response.status);
    
    return response;
  } catch (error) {
    console.error('Auth handler error:', error);
    return c.json({ error: 'Auth handler failed', message: error.message }, 500);
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
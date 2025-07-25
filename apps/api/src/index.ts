import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { logger } from 'hono/logger';
import { zValidator } from '@hono/zod-validator';
import { auth } from '@blackliving/auth';

// Import API modules
import products from './modules/products';
import orders from './modules/orders';
import appointments from './modules/appointments';

export interface Env {
  DB: D1Database;
  R2: R2Bucket;
  CACHE: KVNamespace;
  JWT_SECRET: string;
  BETTER_AUTH_SECRET: string;
  GOOGLE_CLIENT_ID: string;
  GOOGLE_CLIENT_SECRET: string;
}

const app = new Hono<{ Bindings: Env }>();

// Middleware
app.use('*', logger());
app.use('*', cors({
  origin: ['http://localhost:4321', 'http://localhost:5173', 'https://blackliving.com', 'https://admin.blackliving.com'],
  allowHeaders: ['Content-Type', 'Authorization'],
  allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  credentials: true,
}));

// Health check
app.get('/', (c) => {
  return c.json({ 
    message: 'Black Living API is running',
    timestamp: new Date().toISOString(),
    version: '1.0.0'
  });
});

// Better Auth integration
app.use('/auth/*', async (c, next) => {
  // Better Auth middleware will be integrated here
  return auth.handler(c.req.raw);
});

// API Routes
app.route('/api/products', products);
app.route('/api/orders', orders);
app.route('/api/appointments', appointments);

// 404 handler
app.notFound((c) => {
  return c.json({ error: 'Not Found', message: 'The requested endpoint does not exist' }, 404);
});

// Error handler
app.onError((err, c) => {
  console.error('API Error:', err);
  return c.json({ 
    error: 'Internal Server Error', 
    message: process.env.NODE_ENV === 'development' ? err.message : 'Something went wrong'
  }, 500);
});

export default app;
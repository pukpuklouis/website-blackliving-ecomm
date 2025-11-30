import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { logger } from 'hono/logger';
import { createDB } from '@blackliving/db';
import { createAuth } from '@blackliving/auth';
import { users } from '@blackliving/db/schema';
import { eq } from 'drizzle-orm';
import { createCacheManager } from './lib/cache';
import { createStorageManager } from './lib/storage';
import type { D1Database, R2Bucket, KVNamespace } from '@cloudflare/workers-types';

import { createEnhancedAuthMiddleware } from './middleware/auth';
import { SearchModule } from './modules/search';

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
import pages from './modules/pages';
import settings from './modules/settings';
import authRouter from './modules/auth';
import reservationsRouter from './modules/reservations';
import media from './routes/media';
import searchRouter from './routes/search';
import searchConfig from './routes/search-config';
import searchReindex from './routes/search-reindex';
import searchKeys from './routes/search-keys';
import analytics from './routes/analytics';

export interface Env {
  DB: D1Database;
  R2: R2Bucket;
  CACHE: KVNamespace;
  NODE_ENV: string;
  BETTER_AUTH_SECRET: string;
  GOOGLE_CLIENT_ID: string;
  GOOGLE_CLIENT_SECRET: string;
  ALLOWED_ORIGINS: string;
  API_BASE_URL: string;
  WEB_BASE_URL: string;
  ADMIN_BASE_URL: string;
  R2_PUBLIC_URL: string;
  TURNSTILE_SECRET_KEY: string;
  RESEND_API_KEY: string;
  RESEND_FROM_EMAIL: string;
  JWT_SECRET: string;
}

const app = new Hono<{
  Bindings: Env;
  Variables: {
    db: ReturnType<typeof createDB>;
    cache: ReturnType<typeof createCacheManager>;
    storage: ReturnType<typeof createStorageManager>;
    auth: ReturnType<typeof createAuth>;
    search: SearchModule;
    user: any;
    session: any;
  };
}>();

// Security Layer 1: Basic logging only (temporarily disable security)
app.use('*', logger());

// Security Layer 3: Enhanced CORS with production security
app.use(
  '*',
  cors({
    origin: (origin, c) => {
      // Get allowed origins from environment variable
      const allowedOrigins = c.env.ALLOWED_ORIGINS
        ? c.env.ALLOWED_ORIGINS.split(',').map((o) => o.trim())
        : [];

      // Add common allowed origins as fallback
      const fallbackOrigins = [
        // Development origins
        'http://localhost:4321', // Web app
        'http://localhost:5173', // Admin app
        'http://localhost:8787', // API server
        // Production origins
        'https://blackliving.com',
        'https://www.blackliving.com',
        'https://admin.blackliving.com',
        'https://api.blackliving.com',
      ];

      const allAllowedOrigins = [...allowedOrigins, ...fallbackOrigins];

      if (!origin || allAllowedOrigins.includes(origin)) {
        return origin;
      }

      // Log suspicious origin attempts
      console.warn(
        `Blocked CORS request from unauthorized origin: ${origin}. Allowed: ${allAllowedOrigins.join(', ')}`
      );
      return undefined;
    },
    allowHeaders: [
      'Content-Type',
      'Authorization',
      'Cookie',
      'X-Requested-With',
      'X-CSRF-Token',
      'X-API-Key',
    ],
    allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
    credentials: true,
    maxAge: 86400, // 24 hours
  })
);

// Security Layer 4: Disabled temporarily

// Initialize services middleware
app.use('*', async (c, next) => {
  const db = createDB(c.env.DB);
  const cache = createCacheManager(c.env.CACHE);
  const storage = createStorageManager(c.env.R2, c.env.R2_PUBLIC_URL);
  const auth = createAuth(db, {
    GOOGLE_CLIENT_ID: c.env.GOOGLE_CLIENT_ID,
    GOOGLE_CLIENT_SECRET: c.env.GOOGLE_CLIENT_SECRET,
    NODE_ENV: c.env.NODE_ENV,
    BETTER_AUTH_SECRET: c.env.BETTER_AUTH_SECRET,
    API_BASE_URL: c.env.API_BASE_URL,
    WEB_BASE_URL: c.env.WEB_BASE_URL,
    ADMIN_BASE_URL: c.env.ADMIN_BASE_URL,
  });

  c.set('db', db);
  c.set('cache', cache);
  c.set('storage', storage);
  c.set('auth', auth);
  c.set('search', new SearchModule(c));

  await next();
});

// Security Layer 5: Enhanced Better Auth session handling
app.use('*', async (c, next) => {
  const auth = c.get('auth');
  const enhancedAuthMiddleware = createEnhancedAuthMiddleware(auth);
  return enhancedAuthMiddleware(c, next);
});

// Health check
app.get('/', (c) => {
  return c.json({
    message: 'Black Living API is running',
    timestamp: new Date().toISOString(),
    version: '1.0.0',
  });
});

app.route('/media', media);

app.route('/api/auth', authRouter);
app.route('/api/reservations', reservationsRouter);

app.get('/api/auth/test', (c) => c.json({ message: 'Test route works' }));

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
    const [updatedUser] = await db
      .update(users)
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
      },
    });
  } catch (error) {
    console.error('Role assignment error:', error);
    return c.json({ error: 'Failed to assign admin role' }, 500);
  }
});

// Debug and Development Endpoints

// Session endpoint removed - Better Auth handler provides this automatically

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
    return c.json(
      {
        error: 'Better Auth config check failed',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      500
    );
  }
});

// Debug endpoint to test database connection
app.get('/api/auth/debug/db', async (c) => {
  if (c.env.NODE_ENV !== 'development') {
    return c.json({ error: 'Only available in development' }, 403);
  }

  try {
    const db = c.get('db');

    if (!db) {
      return c.json({ error: 'Database instance not found' }, 500);
    }

    // Test raw database connection
    const rawQuery = "SELECT name FROM sqlite_master WHERE type='table' LIMIT 5";
    const rawResult = await c.env.DB.prepare(rawQuery).all();

    // Test Drizzle ORM query
    let drizzleResult;
    try {
      const { products } = await import('@blackliving/db');
      drizzleResult = await db.select().from(products).limit(1);
    } catch (drizzleError) {
      drizzleResult = { error: drizzleError.message };
    }

    return c.json({
      success: true,
      hasDB: !!c.env.DB,
      hasDbInstance: !!db,
      rawQuery: {
        query: rawQuery,
        results: rawResult,
      },
      drizzleQuery: {
        results: drizzleResult,
      },
    });
  } catch (error) {
    return c.json(
      {
        error: 'Database test failed',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      500
    );
  }
});

app.get('/api/auth/debug/sessions', async (c) => {
  if (c.env.NODE_ENV !== 'development') {
    return c.json({ error: 'Only available in development' }, 403);
  }

  try {
    const db = c.get('db');
    const { sessions } = await import('@blackliving/db/schema');
    const allSessions = await db.select().from(sessions);
    return c.json({ success: true, sessions: allSessions });
  } catch (error) {
    return c.json(
      {
        error: 'Failed to fetch sessions',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      500
    );
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
    let user = await db
      .select()
      .from(users)
      .where(eq(users.email, email))
      .limit(1)
      .then((r) => r[0]);

    if (!user) {
      const [newUser] = await db
        .insert(users)
        .values({
          email,
          name: 'Admin User',
          role: 'admin',
          emailVerified: true,
        })
        .returning();
      user = newUser;
    } else {
      // Update to admin
      const [updatedUser] = await db
        .update(users)
        .set({ role: 'admin' })
        .where(eq(users.id, user.id))
        .returning();
      user = updatedUser;
    }

    // Use Better Auth to create session
    const signInRequest = new Request(
      `${c.req.url.replace('/debug/force-admin-login', '/sign-in/email')}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: user.email, password: 'dev-login' }),
      }
    );

    const authResponse = await auth.handler(signInRequest);

    // Copy session cookies
    // The `getSetCookie` method is not available in all environments (e.g. older CF Workers).
    // A more compatible way is to iterate over the headers.
    authResponse.headers.forEach((value, key) => {
      if (key.toLowerCase() === 'set-cookie') {
        c.header('Set-Cookie', value);
      }
    });

    return c.json({
      success: true,
      user: { id: user.id, email: user.email, role: user.role },
    });
  } catch (error) {
    console.error('Force admin login error:', error);
    return c.json({ error: 'Failed to force admin login' }, 500);
  }
});

// Enhanced OAuth debugging endpoint
app.get('/api/auth/debug/oauth-flow', async (c) => {
  if (c.env.NODE_ENV !== 'development') {
    return c.json({ error: 'Only available in development' }, 403);
  }

  try {
    const auth = c.get('auth');
    const db = c.get('db');
    const { sessions, users, accounts } = await import('@blackliving/db/schema');

    // Get current session info
    const currentSession = await auth.api.getSession({
      headers: c.req.raw.headers,
    });

    // Get recent database entries
    const recentSessions = await db.select().from(sessions).orderBy(sessions.createdAt).limit(10);
    const recentUsers = await db.select().from(users).orderBy(users.createdAt).limit(10);
    const recentAccounts = await db.select().from(accounts).orderBy(accounts.createdAt).limit(10);

    return c.json({
      success: true,
      timestamp: new Date().toISOString(),
      currentSession: {
        hasSession: !!currentSession?.session,
        hasUser: !!currentSession?.user,
        sessionId: currentSession?.session?.id,
        userId: currentSession?.user?.id,
        userEmail: currentSession?.user?.email,
      },
      authConfig: {
        baseURL: auth.options?.baseURL,
        hasGoogleProvider: !!auth.options?.socialProviders?.google,
        googleClientId: auth.options?.socialProviders?.google?.clientId?.substring(0, 10) + '...',
        trustedOrigins: auth.options?.trustedOrigins,
      },
      database: {
        sessionsCount: recentSessions.length,
        usersCount: recentUsers.length,
        accountsCount: recentAccounts.length,
        recentSessions: recentSessions.map((s) => ({
          id: s.id,
          userId: s.userId,
          ipAddress: s.ipAddress,
          userAgent: s.userAgent,
          createdAt: s.createdAt,
        })),
        recentUsers: recentUsers.map((u) => ({
          id: u.id,
          email: u.email,
          name: u.name,
          role: u.role,
          createdAt: u.createdAt,
        })),
        recentAccounts: recentAccounts.map((a) => ({
          id: a.id,
          userId: a.userId,
          provider: a.provider,
          providerAccountId: a.providerAccountId,
          createdAt: a.createdAt,
        })),
      },
    });
  } catch (error) {
    console.error('OAuth debug error:', error);
    return c.json(
      {
        error: 'OAuth debug failed',
        message: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined,
      },
      500
    );
  }
});

// Security Layer 6: Disabled temporarily

// Better Auth integration - handles all remaining /api/auth/* routes
// MUST be placed AFTER custom auth routes to avoid intercepting them
app.all('/api/auth/*', async (c) => {
  try {
    const auth = c.get('auth');

    console.log('🔄 Better Auth Handler Called:', {
      method: c.req.method,
      path: c.req.path,
      url: c.req.url,
      headers: {
        cookie: c.req.header('cookie'),
        origin: c.req.header('origin'),
        referer: c.req.header('referer'),
        userAgent: c.req.header('user-agent')?.substring(0, 50) + '...',
      },
      timestamp: new Date().toISOString(),
    });

    // Better Auth expects a standard Request object
    const response = await auth.handler(c.req.raw);

    // Log response details for debugging
    console.log('📤 Better Auth Response:', {
      status: response.status,
      statusText: response.statusText,
      headers: Object.fromEntries(response.headers.entries()),
      hasCookies: response.headers.has('set-cookie'),
      cookies: response.headers.get('set-cookie'),
    });

    return response;
  } catch (error) {
    console.error('Better Auth handler error:', error);
    return c.json(
      {
        error: 'Authentication service error',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      500
    );
  }
});
// Security Layer 7: Disabled temporarily

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
app.route('/api/pages', pages);
app.route('/api/settings', settings);
app.route('/api/search', searchRouter);
app.route('/api/search', searchConfig);
app.route('/api/search', searchReindex);
app.route('/api/search/keys', searchKeys);
app.route('/api/analytics', analytics);

// 404 handler
app.notFound((c) => {
  return c.json({ error: 'Not Found', message: 'The requested endpoint does not exist' }, 404);
});

// Error handler
app.onError((err, c) => {
  console.error('API Error:', err);
  return c.json(
    {
      error: 'Internal Server Error',
      message: c.env.NODE_ENV === 'development' ? err.message : 'Something went wrong',
    },
    500
  );
});

export default app;

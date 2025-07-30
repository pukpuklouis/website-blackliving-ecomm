import { vi, beforeEach } from 'vitest';

// Mock the environment variables
process.env.NODE_ENV = 'test';
process.env.BETTER_AUTH_SECRET = 'test-secret-key';
process.env.GOOGLE_CLIENT_ID = 'test-client-id';
process.env.GOOGLE_CLIENT_SECRET = 'test-client-secret';
process.env.JWT_SECRET = 'test-jwt-secret';

// Mock Better Auth module
vi.mock('@blackliving/auth', () => {
  // Simple inline mocks to avoid circular dependencies
  const mockAuth = {
    api: {
      getSession: vi.fn().mockResolvedValue(null),
      signIn: vi.fn().mockResolvedValue({ success: true }),
      signUp: vi.fn().mockResolvedValue({ success: true }),
      signOut: vi.fn().mockResolvedValue({ success: true }),
    },
    handler: vi.fn().mockImplementation(() => 
      new Response(JSON.stringify({ user: null, session: null }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      })
    ),
  };

  const mockAuthMiddleware = vi.fn().mockImplementation(async (c: any, next: any) => {
    c.set('user', null);
    c.set('session', null);
    await next();
  });

  const mockRequireAuth = vi.fn().mockImplementation(() => {
    return vi.fn().mockImplementation(async (c: any, next: any) => {
      const user = c.get('user');
      if (!user) {
        return c.json({ error: 'Authentication required' }, 401);
      }
      await next();
    });
  });

  const mockRequireAdmin = vi.fn().mockImplementation(() => {
    return vi.fn().mockImplementation(async (c: any, next: any) => {
      const user = c.get('user');
      if (!user || user.role !== 'admin') {
        return c.json({ error: 'Admin access required' }, 403);
      }
      await next();
    });
  });
  
  return {
    createAuth: vi.fn().mockImplementation(() => mockAuth),
    createAuthMiddleware: vi.fn().mockImplementation(() => mockAuthMiddleware),
    requireAuth: mockRequireAuth,
    requireAdmin: mockRequireAdmin,
  };
});

// Create a comprehensive mock env object
const mockDb = {
  prepare: vi.fn(() => ({
    bind: vi.fn().mockReturnThis(),
    run: vi.fn().mockResolvedValue({ success: true, changes: 1 }),
    all: vi.fn().mockResolvedValue({ results: [], success: true }),
    first: vi.fn().mockResolvedValue(null),
  })),
};

const mockCache = {
  get: vi.fn().mockResolvedValue(null),
  put: vi.fn().mockResolvedValue(void 0),
  delete: vi.fn().mockResolvedValue(void 0),
};

const mockStorage = {
  put: vi.fn().mockResolvedValue(void 0),
  get: vi.fn().mockResolvedValue(null),
  delete: vi.fn().mockResolvedValue(void 0),
};

export const mockEnv = {
  DB: mockDb,
  R2: mockStorage,
  CACHE: mockCache,
  NODE_ENV: 'test',
  BETTER_AUTH_SECRET: 'test-secret',
  GOOGLE_CLIENT_ID: 'test-client-id',
  GOOGLE_CLIENT_SECRET: 'test-client-secret',
  JWT_SECRET: 'test-jwt-secret',
  services: {
    db: mockDb,
    cache: mockCache,
    storage: mockStorage,
  },
};

// Global setup for consistent mocking
beforeEach(() => {
  vi.clearAllMocks();
});
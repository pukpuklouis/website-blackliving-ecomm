import { vi } from 'vitest';

// Mock user objects
export const mockAdminUser = {
  id: 'admin-test-id',
  email: 'admin@blackliving.com',
  role: 'admin',
  name: 'Test Admin',
  phone: '0987-123-456',
  preferences: {},
  createdAt: new Date(),
  updatedAt: new Date(),
};

export const mockCustomerUser = {
  id: 'customer-test-id',
  email: 'customer@example.com',
  role: 'customer',
  name: 'Test Customer',
  phone: '0987-654-321',
  preferences: {},
  createdAt: new Date(),
  updatedAt: new Date(),
};

// Mock session objects
export const mockAdminSession = {
  id: 'admin-session-id',
  userId: mockAdminUser.id,
  user: mockAdminUser,
  expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
  ipAddress: '127.0.0.1',
  userAgent: 'test-agent',
};

export const mockCustomerSession = {
  id: 'customer-session-id',
  userId: mockCustomerUser.id,
  user: mockCustomerUser,
  expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
  ipAddress: '127.0.0.1',
  userAgent: 'test-agent',
};

// Create mock auth instance
export function createMockAuth(userType: 'admin' | 'customer' | 'none' = 'none') {
  const mockUser =
    userType === 'admin' ? mockAdminUser : userType === 'customer' ? mockCustomerUser : null;
  const mockSession =
    userType === 'admin' ? mockAdminSession : userType === 'customer' ? mockCustomerSession : null;

  return {
    api: {
      getSession: vi.fn().mockResolvedValue(mockSession),
      signIn: vi.fn().mockResolvedValue({ success: true, user: mockUser }),
      signUp: vi.fn().mockResolvedValue({ success: true, user: mockUser }),
      signOut: vi.fn().mockResolvedValue({ success: true }),
    },
    handler: vi.fn().mockImplementation(async () => {
      return new Response(
        JSON.stringify({
          user: mockUser,
          session: mockSession,
        }),
        {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }),
  };
}

// Helper to create auth middleware mock
export function createMockAuthMiddleware(userType: 'admin' | 'customer' | 'none' = 'none') {
  const mockUser =
    userType === 'admin' ? mockAdminUser : userType === 'customer' ? mockCustomerUser : null;
  const mockSession =
    userType === 'admin' ? mockAdminSession : userType === 'customer' ? mockCustomerSession : null;

  return vi.fn().mockImplementation(async (c: any, next: any) => {
    c.set('user', mockUser);
    c.set('session', mockSession);
    await next();
  });
}

// Helper to mock require auth middleware
export function createMockRequireAuth() {
  return vi.fn().mockImplementation(() => {
    return vi.fn().mockImplementation(async (c: any, next: any) => {
      const user = c.get('user');
      if (!user) {
        return c.json({ error: 'Authentication required' }, 401);
      }
      await next();
    });
  });
}

// Helper to mock require admin middleware
export function createMockRequireAdmin() {
  return vi.fn().mockImplementation(() => {
    return vi.fn().mockImplementation(async (c: any, next: any) => {
      const user = c.get('user');
      if (!user || user.role !== 'admin') {
        return c.json({ error: 'Admin access required' }, 403);
      }
      await next();
    });
  });
}

// Mock environment with services
export function createMockEnvWithAuth(userType: 'admin' | 'customer' | 'none' = 'none') {
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

  const mockAuth = createMockAuth(userType);

  return {
    DB: mockDb,
    R2: mockStorage,
    CACHE: mockCache,
    NODE_ENV: 'test',
    BETTER_AUTH_SECRET: 'test-secret',
    GOOGLE_CLIENT_ID: 'test-client-id',
    GOOGLE_CLIENT_SECRET: 'test-client-secret',
    JWT_SECRET: 'test-jwt-secret',
    // Mock services available in context
    services: {
      db: mockDb,
      cache: mockCache,
      storage: mockStorage,
      auth: mockAuth,
    },
  };
}

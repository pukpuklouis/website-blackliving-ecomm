import { describe, it, expect, beforeEach } from 'vitest';
import { useSimpleTestEnvironment, AuthMocks, ResponseAsserts } from './simple-test-utils';

describe('Infrastructure Tests', () => {
  const { getEnv, resetAll } = useSimpleTestEnvironment();

  beforeEach(async () => {
    await resetAll();
  });

  describe('Database Setup', () => {
    it('should initialize database successfully', async () => {
      const testEnv = getEnv();
      expect(testEnv.db).toBeTruthy();

      // Test database connection by creating a simple record
      const result = await testEnv
        .db!.prepare('INSERT INTO users (id, name, email) VALUES (?, ?, ?)')
        .bind('test-1', 'Test User', 'test@example.com')
        .run();
      expect(result.success).toBe(true);
    });

    it('should handle database queries', async () => {
      const testEnv = getEnv();

      // Insert test data
      await testEnv
        .db!.prepare('INSERT INTO users (id, name, email) VALUES (?, ?, ?)')
        .bind('test-2', 'Test User 2', 'test2@example.com')
        .run();

      // Query the data
      const user = await testEnv
        .db!.prepare('SELECT * FROM users WHERE id = ?')
        .bind('test-2')
        .first();
      expect(user).toBeTruthy();
      expect(user.name).toBe('Test User 2');
    });
  });

  describe('Cache Setup', () => {
    it('should initialize KV cache successfully', async () => {
      const testEnv = getEnv();
      expect(testEnv.kv).toBeTruthy();

      // Test cache operations
      await testEnv.kv!.put('test-key', 'test-value');
      const value = await testEnv.kv!.get('test-key');
      expect(value).toBe('test-value');
    });
  });

  describe('Storage Setup', () => {
    it('should initialize R2 storage successfully', async () => {
      const testEnv = getEnv();
      expect(testEnv.r2).toBeTruthy();

      // Test storage operations
      await testEnv.r2!.put('test-file.txt', 'test content');
      const object = await testEnv.r2!.get('test-file.txt');
      expect(object).toBeTruthy();
      expect(await object!.text()).toBe('test content');
    });
  });

  describe('HTTP Fetch', () => {
    it('should handle HTTP requests', async () => {
      const testEnv = getEnv();

      const response = await testEnv.fetch('http://localhost:8787/test');
      expect(response).toBeTruthy();
      expect(response.status).toBe(200);
    });
  });

  describe('Auth Mocks', () => {
    it('should provide auth headers', () => {
      const adminHeaders = AuthMocks.getAdminHeaders();
      expect(adminHeaders).toHaveProperty('Cookie');
      expect(adminHeaders).toHaveProperty('Content-Type');
      expect(adminHeaders['Content-Type']).toBe('application/json');
    });
  });

  describe('Response Assertions', () => {
    it('should validate success responses', async () => {
      const mockResponse = new Response(JSON.stringify({ success: true, data: { test: true } }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });

      const result = await ResponseAsserts.expectSuccess(mockResponse, 200);
      expect(result.success).toBe(true);
      expect(result.data.test).toBe(true);
    });

    it('should validate error responses', async () => {
      const mockResponse = new Response(JSON.stringify({ success: false, error: 'Test error' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });

      const result = await ResponseAsserts.expectError(mockResponse, 400);
      expect(result.success).toBe(false);
      expect(result.error).toBe('Test error');
    });
  });
});

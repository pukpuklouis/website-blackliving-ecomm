import { Miniflare } from 'miniflare';
import { afterAll, beforeAll } from 'vitest';
import type { D1Database, KVNamespace, R2Bucket } from '@cloudflare/workers-types';

/**
 * Simplified test environment for quick testing
 */
export class SimpleTestEnvironment {
  private mf: Miniflare | null = null;
  public db: D1Database | null = null;
  public kv: KVNamespace | null = null;
  public r2: R2Bucket | null = null;

  async setup(): Promise<void> {
    this.mf = new Miniflare({
      modules: true,
      script: `export default { async fetch() { return new Response('OK'); } };`,
      d1Databases: ['DB'],
      kvNamespaces: ['CACHE'],
      r2Buckets: ['R2'],
      bindings: {
        NODE_ENV: 'test',
        BETTER_AUTH_SECRET: 'test-secret-very-long-key-for-testing-purposes-only',
        GOOGLE_CLIENT_ID: 'test-google-client-id',
        GOOGLE_CLIENT_SECRET: 'test-google-client-secret'
      },
      compatibilityDate: '2024-09-23'
    });

    this.db = await this.mf.getD1Database('DB');
    this.kv = await this.mf.getKVNamespace('CACHE');
    this.r2 = await this.mf.getR2Bucket('R2');

    await this.initializeDatabase();
  }

  async cleanup(): Promise<void> {
    if (this.mf) {
      await this.mf.dispose();
      this.mf = null;
      this.db = null;
      this.kv = null;
      this.r2 = null;
    }
  }

  async resetDatabase(): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');
    
    // Simple drop and recreate
    await this.db.exec('DROP TABLE IF EXISTS products');
    await this.db.exec('DROP TABLE IF EXISTS users');
    await this.initializeDatabase();
  }

  async clearCache(): Promise<void> {
    if (!this.kv) return;
    const keys = await this.kv.list();
    await Promise.all(keys.keys.map(key => this.kv!.delete(key.name)));
  }

  async clearStorage(): Promise<void> {
    if (!this.r2) return;
    const objects = await this.r2.list();
    await Promise.all(objects.objects.map(obj => this.r2!.delete(obj.key)));
  }

  async fetch(url: string, init?: RequestInit): Promise<Response> {
    if (!this.mf) throw new Error('Miniflare not initialized');
    return await this.mf.dispatchFetch(url, init);
  }

  private async initializeDatabase(): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    // Create minimal tables for testing
    await this.db.exec('CREATE TABLE IF NOT EXISTS users (id TEXT PRIMARY KEY, name TEXT, email TEXT UNIQUE, role TEXT DEFAULT "customer")');
    await this.db.exec('CREATE TABLE IF NOT EXISTS products (id TEXT PRIMARY KEY, name TEXT, slug TEXT UNIQUE, description TEXT, category TEXT, images TEXT DEFAULT "[]", variants TEXT DEFAULT "[]", features TEXT DEFAULT "[]", specifications TEXT DEFAULT "{}", in_stock INTEGER DEFAULT 1, featured INTEGER DEFAULT 0, sort_order INTEGER DEFAULT 0, created_at INTEGER, updated_at INTEGER)');
  }
}

export function useSimpleTestEnvironment() {
  let testEnv: SimpleTestEnvironment;

  beforeAll(async () => {
    testEnv = new SimpleTestEnvironment();
    await testEnv.setup();
  }, 30000);

  afterAll(async () => {
    if (testEnv) {
      await testEnv.cleanup();
    }
  });

  return {
    getEnv: () => testEnv,
    resetAll: async () => {
      await testEnv.resetDatabase();
      await testEnv.clearCache();
      await testEnv.clearStorage();
    }
  };
}

export const AuthMocks = {
  adminSession: 'test-admin-session-token',
  customerSession: 'test-customer-session-token',
  
  getAdminHeaders: () => ({
    'Cookie': 'session=test-admin-session-token',
    'Content-Type': 'application/json'
  }),

  getCustomerHeaders: () => ({
    'Cookie': 'session=test-customer-session-token',
    'Content-Type': 'application/json'
  })
};

export const ResponseAsserts = {
  async expectSuccess(response: Response, expectedStatus = 200): Promise<any> {
    const data = await response.json();
    if (response.status !== expectedStatus) {
      throw new Error(`Expected status ${expectedStatus}, got ${response.status}: ${JSON.stringify(data)}`);
    }
    if (!data.success) {
      throw new Error(`Expected success=true, got: ${JSON.stringify(data)}`);
    }
    return data;
  },

  async expectError(response: Response, expectedStatus: number): Promise<any> {
    const data = await response.json();
    if (response.status !== expectedStatus) {
      throw new Error(`Expected status ${expectedStatus}, got ${response.status}: ${JSON.stringify(data)}`);
    }
    if (data.success) {
      throw new Error(`Expected success=false, got: ${JSON.stringify(data)}`);
    }
    return data;
  }
};

export function generateTestId(prefix = 'test'): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`;
}
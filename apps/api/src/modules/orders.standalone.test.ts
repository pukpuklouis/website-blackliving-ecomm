import { env } from 'cloudflare:test';
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { Hono } from 'hono';
import orders from './orders';

// Define minimal Env type for testing
interface TestEnv {
  DB: D1Database;
  R2?: R2Bucket;
  CACHE?: KVNamespace;
  NODE_ENV?: string;
  JWT_SECRET?: string;
  BETTER_AUTH_SECRET?: string;
  GOOGLE_CLIENT_ID?: string;
  GOOGLE_CLIENT_SECRET?: string;
}

// Create a minimal app instance for testing (no Better Auth middleware)
const app = new Hono<{ Bindings: TestEnv }>();
app.route('/api/orders', orders);

describe('Orders API Standalone Integration Tests', () => {
  // Test data
  const validOrderData = {
    customerInfo: {
      name: '測試客戶',
      email: 'test.customer@example.com',
      phone: '0987-123-456',
      address: '台北市信義區信義路五段7號',
    },
    items: [
      {
        productId: 'test-product-1',
        productName: 'Test Simmons Mattress',
        variant: 'Queen - Medium',
        quantity: 1,
        price: 89900,
      },
    ],
    totalAmount: 89900,
    paymentMethod: 'bank_transfer' as const,
    notes: '希望週末配送',
  };

  let createdOrderIds: string[] = [];

  beforeEach(async () => {
    // Ensure we have the orders table (create if not exists)
    try {
      await env.DB.prepare(
        `
        CREATE TABLE IF NOT EXISTS orders (
          id TEXT PRIMARY KEY,
          user_id TEXT,
          customer_info TEXT NOT NULL,
          items TEXT NOT NULL,
          total_amount INTEGER NOT NULL,
          payment_method TEXT DEFAULT 'bank_transfer',
          status TEXT DEFAULT 'pending',
          notes TEXT,
          shipping_address TEXT,
          tracking_number TEXT,
          created_at TEXT NOT NULL,
          updated_at TEXT NOT NULL
        )
      `
      ).run();
    } catch (error) {
      // Table might already exist, continue
    }

    // Clean up orders table before each test
    await env.DB.prepare('DELETE FROM orders').run();
    createdOrderIds = [];
  });

  afterEach(async () => {
    // Clean up any orders created during tests
    if (createdOrderIds.length > 0) {
      const placeholders = createdOrderIds.map(() => '?').join(',');
      await env.DB.prepare(`DELETE FROM orders WHERE id IN (${placeholders})`)
        .bind(...createdOrderIds)
        .run();
    }
  });

  describe('Database and Basic Operations', () => {
    it('should have access to D1 database', async () => {
      expect(env.DB).toBeDefined();

      // Test basic database operation
      const result = await env.DB.prepare('SELECT 1 as test').first();
      expect(result).toEqual({ test: 1 });
    });

    it('should have working orders table', async () => {
      const result = await env.DB.prepare('SELECT COUNT(*) as count FROM orders').first();
      expect(result).toHaveProperty('count');
      expect(typeof result.count).toBe('number');
    });
  });

  describe('GET /api/orders - List Orders', () => {
    it('should return empty list when no orders exist', async () => {
      const response = await app.request('/api/orders', {}, env);

      expect(response.status).toBe(200);
      const body = await response.json();
      expect(body.success).toBe(true);
      expect(Array.isArray(body.data)).toBe(true);
      expect(body.data).toHaveLength(0);
      expect(body.total).toBe(0);
    });
  });

  describe('POST /api/orders - Create Order', () => {
    it('should create new order with valid data', async () => {
      const response = await app.request(
        '/api/orders',
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(validOrderData),
        },
        env
      );

      expect(response.status).toBe(201);
      const body = await response.json();
      expect(body.success).toBe(true);
      expect(body.data.id).toMatch(/^BL\d+[A-Z0-9]{4}$/);
      expect(body.data.status).toBe('pending');
      expect(body.data.message).toBe('訂單已建立成功，我們將盡快與您聯繫確認付款資訊');

      createdOrderIds.push(body.data.id);
    });

    it('should validate email format', async () => {
      const invalidData = {
        ...validOrderData,
        customerInfo: {
          ...validOrderData.customerInfo,
          email: 'not-an-email',
        },
      };

      const response = await app.request(
        '/api/orders',
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(invalidData),
        },
        env
      );

      expect(response.status).toBe(400);
    });

    it('should validate positive total amount', async () => {
      const invalidData = {
        ...validOrderData,
        totalAmount: -1000,
      };

      const response = await app.request(
        '/api/orders',
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(invalidData),
        },
        env
      );

      expect(response.status).toBe(400);
    });
  });

  describe('GET /api/orders/:id - Get Single Order', () => {
    it('should return specific order by ID', async () => {
      // Create a test order first
      const createResponse = await app.request(
        '/api/orders',
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(validOrderData),
        },
        env
      );

      const createData = await createResponse.json();
      const orderId = createData.data.id;
      createdOrderIds.push(orderId);

      // Retrieve the order
      const response = await app.request(`/api/orders/${orderId}`, {}, env);

      expect(response.status).toBe(200);
      const body = await response.json();
      expect(body.success).toBe(true);
      expect(body.data.id).toBe(orderId);
      expect(body.data.status).toBe('pending');

      // Verify customer info is stored as JSON string
      const customerInfo = JSON.parse(body.data.customer_info);
      expect(customerInfo.name).toBe(validOrderData.customerInfo.name);
      expect(customerInfo.email).toBe(validOrderData.customerInfo.email);
    });

    it('should return 404 for non-existent order', async () => {
      const response = await app.request('/api/orders/non-existent-id', {}, env);

      expect(response.status).toBe(404);
      const body = await response.json();
      expect(body.error).toBe('Order not found');
    });
  });

  describe('PUT /api/orders/:id/status - Update Order Status', () => {
    let testOrderId: string;

    beforeEach(async () => {
      // Create a test order for status updates
      const response = await app.request(
        '/api/orders',
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(validOrderData),
        },
        env
      );

      const data = await response.json();
      testOrderId = data.data.id;
      createdOrderIds.push(testOrderId);
    });

    it('should update order status successfully', async () => {
      const response = await app.request(
        `/api/orders/${testOrderId}/status`,
        {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            status: 'confirmed',
            notes: '已確認付款',
          }),
        },
        env
      );

      expect(response.status).toBe(200);
      const body = await response.json();
      expect(body.success).toBe(true);
      expect(body.message).toBe('Order status updated successfully');

      // Verify status was updated in database
      const checkResponse = await app.request(`/api/orders/${testOrderId}`, {}, env);
      const checkBody = await checkResponse.json();
      expect(checkBody.data.status).toBe('confirmed');
      expect(checkBody.data.notes).toBe('已確認付款');
    });

    it('should accept all valid status values', async () => {
      const validStatuses = [
        'pending',
        'confirmed',
        'processing',
        'shipped',
        'delivered',
        'cancelled',
      ];

      for (const status of validStatuses) {
        const response = await app.request(
          `/api/orders/${testOrderId}/status`,
          {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ status }),
          },
          env
        );

        expect(response.status).toBe(200);

        // Verify status was updated
        const checkResponse = await app.request(`/api/orders/${testOrderId}`, {}, env);
        const checkBody = await checkResponse.json();
        expect(checkBody.data.status).toBe(status);
      }
    });

    it('should validate status enum values', async () => {
      const response = await app.request(
        `/api/orders/${testOrderId}/status`,
        {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ status: 'invalid-status' }),
        },
        env
      );

      expect(response.status).toBe(400);
    });

    it('should return 404 for non-existent order', async () => {
      const response = await app.request(
        '/api/orders/non-existent/status',
        {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ status: 'confirmed' }),
        },
        env
      );

      expect(response.status).toBe(404);
      const body = await response.json();
      expect(body.error).toBe('Order not found');
    });
  });

  describe('GET /api/orders/customer/:email - Customer Orders', () => {
    it('should return orders for specific customer email', async () => {
      const customerEmail = 'customer.test@example.com';

      // Create order for this customer
      const orderData = {
        ...validOrderData,
        customerInfo: {
          ...validOrderData.customerInfo,
          email: customerEmail,
        },
      };

      const response1 = await app.request(
        '/api/orders',
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(orderData),
        },
        env
      );
      const data1 = await response1.json();
      createdOrderIds.push(data1.data.id);

      // Fetch orders for specific customer
      const response = await app.request(
        `/api/orders/customer/${encodeURIComponent(customerEmail)}`,
        {},
        env
      );

      expect(response.status).toBe(200);
      const body = await response.json();
      expect(body.success).toBe(true);
      expect(Array.isArray(body.data)).toBe(true);
      expect(body.data).toHaveLength(1);

      // Verify order belongs to the correct customer
      const customerInfo = JSON.parse(body.data[0].customer_info);
      expect(customerInfo.email).toBe(customerEmail);
    });

    it('should return empty array for email with no orders', async () => {
      const response = await app.request('/api/orders/customer/no-orders@example.com', {}, env);

      expect(response.status).toBe(200);
      const body = await response.json();
      expect(body.success).toBe(true);
      expect(Array.isArray(body.data)).toBe(true);
      expect(body.data).toHaveLength(0);
    });
  });

  describe('Business Logic', () => {
    it('should generate unique order IDs', async () => {
      // Create multiple orders sequentially
      const orderIds: string[] = [];

      for (let i = 0; i < 3; i++) {
        const response = await app.request(
          '/api/orders',
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              ...validOrderData,
              customerInfo: {
                ...validOrderData.customerInfo,
                email: `test${i}@example.com`,
              },
            }),
          },
          env
        );

        expect(response.status).toBe(201);
        const data = await response.json();
        orderIds.push(data.data.id);
        createdOrderIds.push(data.data.id);
      }

      // Verify all IDs are unique
      expect(new Set(orderIds).size).toBe(3);

      // All IDs should match expected format
      orderIds.forEach(id => {
        expect(id).toMatch(/^BL\d+[A-Z0-9]{4}$/);
      });
    });

    it('should preserve data integrity with complex characters', async () => {
      const complexOrderData = {
        customerInfo: {
          name: '測試客戶 with "quotes" & special chars',
          email: 'complex.test@example.com',
          phone: '(02)1234-5678',
          address: '台北市信義區信義路五段7號 10樓',
        },
        items: [
          {
            productId: 'complex-product',
            productName: 'Product with "特殊字符" & symbols',
            variant: 'Size: Queen (5尺), Firmness: 中軟式',
            quantity: 1,
            price: 89900,
          },
        ],
        totalAmount: 89900,
        paymentMethod: 'bank_transfer' as const,
        notes: 'Instructions: 請於 2024/12/31 前配送',
      };

      const response = await app.request(
        '/api/orders',
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(complexOrderData),
        },
        env
      );

      expect(response.status).toBe(201);
      const createData = await response.json();
      createdOrderIds.push(createData.data.id);

      // Retrieve and verify data integrity
      const getResponse = await app.request(`/api/orders/${createData.data.id}`, {}, env);
      const getData = await getResponse.json();

      const customerInfo = JSON.parse(getData.data.customer_info);
      expect(customerInfo.name).toBe(complexOrderData.customerInfo.name);
      expect(customerInfo.address).toBe(complexOrderData.customerInfo.address);

      const items = JSON.parse(getData.data.items);
      expect(items[0].productName).toBe(complexOrderData.items[0].productName);
      expect(items[0].variant).toBe(complexOrderData.items[0].variant);

      expect(getData.data.notes).toBe(complexOrderData.notes);
    });
  });
});

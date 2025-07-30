import { describe, it, expect, beforeEach, vi } from 'vitest';
import { Hono } from 'hono';
import orders from './orders';
import type { Env } from '../index';
import { mockEnv } from '../lib/vitest-setup';

// Mock users for testing
const mockAdminUser = {
  id: 'admin-test-id',
  email: 'admin@blackliving.com',
  role: 'admin',
  name: 'Test Admin',
};

const mockCustomerUser = {
  id: 'customer-test-id',
  email: 'customer@example.com',
  role: 'customer',
  name: 'Test Customer',
};

const mockDb = mockEnv.services.db;
const mockPreparedStatement = mockDb.prepare();

// Test data
const validOrderData = {
  customerInfo: {
    name: '測試客戶',
    email: 'test.customer@example.com',
    phone: '0987-123-456',
    address: '台北市信義區信義路五段7號'
  },
  items: [
    {
      productId: 'test-product-1',
      productName: 'Test Simmons Mattress',
      variant: 'Queen - Medium',
      quantity: 1,
      price: 89900
    }
  ],
  totalAmount: 89900,
  paymentMethod: 'bank_transfer' as const,
  notes: '希望週末配送'
};

const mockOrderData = {
  id: 'BL1234567890ABCD',
  user_id: null,
  customer_info: JSON.stringify(validOrderData.customerInfo),
  items: JSON.stringify(validOrderData.items),
  total_amount: 89900,
  payment_method: 'bank_transfer',
  status: 'pending',
  notes: '希望週末配送',
  shipping_address: null,
  tracking_number: null,
  created_at: Date.now(),
  updated_at: Date.now()
};

// Create test app with auth context
function createTestApp(userType: 'admin' | 'customer' | 'none' = 'none') {
  const app = new Hono<{ 
    Bindings: Env;
    Variables: {
      db: any;
      cache: any;
      storage: any;
      auth: any;
      user: any;
      session: any;
    };
  }>();
  
  // Mock services middleware
  app.use('*', async (c, next) => {
    c.set('db', mockEnv.services.db);
    c.set('cache', mockEnv.services.cache);
    c.set('storage', mockEnv.services.storage);
    c.set('auth', { api: { getSession: vi.fn() } });
    c.set('user', userType === 'admin' ? mockAdminUser : userType === 'customer' ? mockCustomerUser : null);
    c.set('session', userType !== 'none' ? { user: c.get('user') } : null);
    await next();
  });
  
  app.route('/api/orders', orders);
  return app;
}

describe('Orders API Module', () => {
  beforeEach(() => {
    vi.resetAllMocks();
    mockDb.prepare.mockReturnValue(mockPreparedStatement);
  });

  describe('GET /api/orders (List Orders)', () => {
    it('should return all orders with default pagination', async () => {
      const app = createTestApp('admin'); // Use admin user for protected endpoints
      
      mockPreparedStatement.all.mockResolvedValue({
        results: [mockOrderData],
        success: true
      });

      const req = new Request('http://localhost/api/orders');
      const res = await app.request(req);
      const data = await res.json();

      expect(res.status).toBe(200);
      expect(data.success).toBe(true);
      expect(Array.isArray(data.data)).toBe(true);
      expect(data.data).toHaveLength(1);
      expect(data.total).toBe(1);
    });

    it('should filter orders by status', async () => {
      const app = createTestApp('admin');
      
      mockPreparedStatement.all.mockResolvedValue({
        results: [mockOrderData],
        success: true
      });

      const req = new Request('http://localhost/api/orders?status=pending');
      const res = await app.request(req);
      const data = await res.json();

      expect(res.status).toBe(200);
      expect(mockDb.prepare).toHaveBeenCalledWith(
        expect.stringContaining('WHERE 1=1 AND status = ?')
      );
      expect(mockPreparedStatement.bind).toHaveBeenCalledWith('pending', 50, 0);
    });

    it('should support pagination', async () => {
      const app = createTestApp('admin');
      
      mockPreparedStatement.all.mockResolvedValue({
        results: [],
        success: true
      });

      const req = new Request('http://localhost/api/orders?limit=10&offset=20');
      const res = await app.request(req);

      expect(mockPreparedStatement.bind).toHaveBeenCalledWith(10, 20);
    });

    it('should handle database errors', async () => {
      const app = createTestApp('admin');
      
      mockPreparedStatement.all.mockRejectedValue(new Error('Database error'));

      const req = new Request('http://localhost/api/orders');
      const res = await app.request(req);
      const data = await res.json();

      expect(res.status).toBe(500);
      expect(data.error).toBe('Failed to fetch orders');
    });
  });

  describe('GET /api/orders/:id (Get Single Order)', () => {
    it('should return specific order by ID', async () => {
      const app = createTestApp('admin');
      
      mockPreparedStatement.first.mockResolvedValue(mockOrderData);

      const req = new Request('http://localhost/api/orders/BL1234567890ABCD');
      const res = await app.request(req);
      const data = await res.json();

      expect(res.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data.id).toBe('BL1234567890ABCD');
      expect(mockDb.prepare).toHaveBeenCalledWith('SELECT * FROM orders WHERE id = ?');
      expect(mockPreparedStatement.bind).toHaveBeenCalledWith('BL1234567890ABCD');
    });

    it('should return 404 for non-existent order', async () => {
      const app = createTestApp('admin');
      
      mockPreparedStatement.first.mockResolvedValue(null);

      const req = new Request('http://localhost/api/orders/non-existent');
      const res = await app.request(req);
      const data = await res.json();

      expect(res.status).toBe(404);
      expect(data.error).toBe('Order not found');
    });

    it('should handle database errors', async () => {
      const app = createTestApp('admin');
      
      mockPreparedStatement.first.mockRejectedValue(new Error('Database error'));

      const req = new Request('http://localhost/api/orders/test-id');
      const res = await app.request(req);
      const data = await res.json();

      expect(res.status).toBe(500);
      expect(data.error).toBe('Failed to fetch order');
    });
  });

  describe('POST /api/orders (Create Order)', () => {
    it('should create new order with valid data', async () => {
      const app = createTestApp('none'); // Order creation doesn't require auth
      
      mockPreparedStatement.run.mockResolvedValue({
        success: true,
        changes: 1
      });

      const req = new Request('http://localhost/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(validOrderData)
      });

      const res = await app.request(req);
      const data = await res.json();

      expect(res.status).toBe(201);
      expect(data.success).toBe(true);
      expect(data.data.id).toMatch(/^BL\d+[A-Z0-9]{4}$/);
      expect(data.data.status).toBe('pending');
      expect(data.data.message).toBe('訂單已建立成功，我們將盡快與您聯繫確認付款資訊');
    });

    it('should validate required customer info fields', async () => {
      const app = createTestApp('admin');
      
      const invalidData = {
        ...validOrderData,
        customerInfo: {
          name: '',
          email: 'invalid-email',
          phone: '',
          address: ''
        }
      };

      const req = new Request('http://localhost/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(invalidData)
      });

      const res = await app.request(req);

      expect(res.status).toBe(400);
    });

    it('should validate email format', async () => {
      const app = createTestApp('admin');
      
      const invalidData = {
        ...validOrderData,
        customerInfo: {
          ...validOrderData.customerInfo,
          email: 'not-an-email'
        }
      };

      const req = new Request('http://localhost/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(invalidData)
      });

      const res = await app.request(req);

      expect(res.status).toBe(400);
    });

    it('should validate items array', async () => {
      const app = createTestApp('admin');
      
      const invalidData = {
        ...validOrderData,
        items: []
      };

      const req = new Request('http://localhost/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(invalidData)
      });

      const res = await app.request(req);

      expect(res.status).toBe(400);
    });

    it('should validate positive total amount', async () => {
      const app = createTestApp('admin');
      
      const invalidData = {
        ...validOrderData,
        totalAmount: -1000
      };

      const req = new Request('http://localhost/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(invalidData)
      });

      const res = await app.request(req);

      expect(res.status).toBe(400);
    });

    it('should handle database errors', async () => {
      const app = createTestApp('admin');
      
      mockPreparedStatement.run.mockRejectedValue(new Error('Database error'));

      const req = new Request('http://localhost/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(validOrderData)
      });

      const res = await app.request(req);
      const data = await res.json();

      expect(res.status).toBe(500);
      expect(data.error).toBe('Failed to create order');
    });
  });

  describe('PUT /api/orders/:id/status (Update Order Status)', () => {
    it('should update order status', async () => {
      const app = createTestApp('admin');
      
      mockPreparedStatement.run.mockResolvedValue({
        success: true,
        changes: 1
      });

      const updateData = {
        status: 'confirmed' as const,
        notes: '已確認付款'
      };

      const req = new Request('http://localhost/api/orders/BL1234567890ABCD/status', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updateData)
      });

      const res = await app.request(req);
      const data = await res.json();

      expect(res.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.message).toBe('Order status updated successfully');
      expect(mockPreparedStatement.bind).toHaveBeenCalledWith(
        'confirmed',
        '已確認付款',
        expect.any(String),
        'BL1234567890ABCD'
      );
    });

    it('should validate status enum values', async () => {
      const app = createTestApp('admin');
      
      const invalidData = {
        status: 'invalid-status'
      };

      const req = new Request('http://localhost/api/orders/test-id/status', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(invalidData)
      });

      const res = await app.request(req);

      expect(res.status).toBe(400);
    });

    it('should accept all valid status values', async () => {
      const app = createTestApp('admin');
      
      const validStatuses = ['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled'];
      
      mockPreparedStatement.run.mockResolvedValue({
        success: true,
        changes: 1
      });

      for (const status of validStatuses) {
        const req = new Request('http://localhost/api/orders/test-id/status', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ status })
        });

        const res = await app.request(req);
        expect(res.status).toBe(200);
      }
    });

    it('should return 404 for non-existent order', async () => {
      const app = createTestApp('admin');
      
      mockPreparedStatement.run.mockResolvedValue({
        success: true,
        changes: 0
      });

      const req = new Request('http://localhost/api/orders/non-existent/status', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'confirmed' })
      });

      const res = await app.request(req);
      const data = await res.json();

      expect(res.status).toBe(404);
      expect(data.error).toBe('Order not found');
    });

    it('should handle database errors', async () => {
      const app = createTestApp('admin');
      
      mockPreparedStatement.run.mockRejectedValue(new Error('Database error'));

      const req = new Request('http://localhost/api/orders/test-id/status', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'confirmed' })
      });

      const res = await app.request(req);
      const data = await res.json();

      expect(res.status).toBe(500);
      expect(data.error).toBe('Failed to update order status');
    });
  });

  describe('GET /api/orders/customer/:email (Get Customer Orders)', () => {
    it('should return orders for specific customer email (admin access)', async () => {
      const app = createTestApp('admin');
      
      mockPreparedStatement.all.mockResolvedValue({
        results: [mockOrderData],
        success: true
      });

      const req = new Request('http://localhost/api/orders/customer/test@example.com');
      const res = await app.request(req);
      const data = await res.json();

      expect(res.status).toBe(200);
      expect(data.success).toBe(true);
      expect(Array.isArray(data.data)).toBe(true);
      expect(mockDb.prepare).toHaveBeenCalledWith(
        "SELECT * FROM orders WHERE JSON_EXTRACT(customer_info, '$.email') = ? ORDER BY created_at DESC"
      );
      expect(mockPreparedStatement.bind).toHaveBeenCalledWith('test@example.com');
    });

    it('should return orders for customer accessing their own email', async () => {
      const app = createTestApp('customer');
      
      mockPreparedStatement.all.mockResolvedValue({
        results: [mockOrderData],
        success: true
      });

      // Customer can access their own email (mockCustomerUser.email is 'customer@example.com')
      const req = new Request('http://localhost/api/orders/customer/customer@example.com');
      const res = await app.request(req);
      const data = await res.json();

      expect(res.status).toBe(200);
      expect(data.success).toBe(true);
      expect(Array.isArray(data.data)).toBe(true);
    });

    it('should reject customer accessing different email', async () => {
      const app = createTestApp('customer');

      // Customer trying to access different email should be rejected
      const req = new Request('http://localhost/api/orders/customer/other@example.com');
      const res = await app.request(req);
      const data = await res.json();

      expect(res.status).toBe(403);
      expect(data.error).toBe('Unauthorized access to customer orders');
    });

    it('should return empty array for email with no orders', async () => {
      const app = createTestApp('admin');
      
      mockPreparedStatement.all.mockResolvedValue({
        results: [],
        success: true
      });

      const req = new Request('http://localhost/api/orders/customer/no-orders@example.com');
      const res = await app.request(req);
      const data = await res.json();

      expect(res.status).toBe(200);
      expect(data.success).toBe(true);
      expect(Array.isArray(data.data)).toBe(true);
      expect(data.data).toHaveLength(0);
    });

    it('should handle special characters in email', async () => {
      const app = createTestApp('admin');
      
      mockPreparedStatement.all.mockResolvedValue({
        results: [],
        success: true
      });

      const req = new Request('http://localhost/api/orders/customer/test%2Bspecial%40example.com');
      const res = await app.request(req);

      expect(res.status).toBe(200);
      expect(mockPreparedStatement.bind).toHaveBeenCalledWith('test+special@example.com');
    });

    it('should handle database errors', async () => {
      const app = createTestApp('admin');
      
      mockPreparedStatement.all.mockRejectedValue(new Error('Database error'));

      const req = new Request('http://localhost/api/orders/customer/test@example.com');
      const res = await app.request(req);
      const data = await res.json();

      expect(res.status).toBe(500);
      expect(data.error).toBe('Failed to fetch orders');
    });
  });

  describe('Order Business Logic', () => {
    it('should generate unique order IDs', async () => {
      const app = createTestApp('admin');
      
      mockPreparedStatement.run.mockResolvedValue({
        success: true,
        changes: 1
      });

      // Create multiple orders quickly
      const requests = Array(3).fill(null).map(() => 
        new Request('http://localhost/api/orders', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(validOrderData)
        })
      );

      const responses = await Promise.all(
        requests.map(req => app.request(req, mockEnv))
      );

      const orderIds = await Promise.all(
        responses.map(async res => {
          const data = await res.json();
          return data.data.id;
        })
      );

      // All IDs should be unique
      expect(new Set(orderIds).size).toBe(3);
      
      // All IDs should match the expected format
      orderIds.forEach(id => {
        expect(id).toMatch(/^BL\d+[A-Z0-9]{4}$/);
      });
    });

    it('should handle payment method defaulting', async () => {
      const app = createTestApp('admin');
      
      mockPreparedStatement.run.mockResolvedValue({
        success: true,
        changes: 1
      });

      const dataWithoutPaymentMethod = { ...validOrderData };
      delete (dataWithoutPaymentMethod as any).paymentMethod;

      const req = new Request('http://localhost/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(dataWithoutPaymentMethod)
      });

      const res = await app.request(req);
      
      expect(res.status).toBe(201);
      expect(mockPreparedStatement.bind).toHaveBeenCalledWith(
        expect.any(String), // id
        JSON.stringify(validOrderData.customerInfo),
        JSON.stringify(validOrderData.items),
        89900, // totalAmount
        'bank_transfer', // payment method should default
        'pending',
        '希望週末配送',
        expect.any(String), // created_at
        expect.any(String)  // updated_at
      );
    });

    it('should store JSON data correctly', async () => {
      const app = createTestApp('admin');
      
      mockPreparedStatement.run.mockResolvedValue({
        success: true,
        changes: 1
      });

      const complexOrderData = {
        ...validOrderData,
        items: [
          {
            productId: 'product-1',
            productName: 'Test Product with "Quotes" & Special chars',
            variant: 'Size: Queen (5尺), Firmness: 中式',
            quantity: 2,
            price: 45000
          },
          {
            productId: 'product-2',
            productName: 'Another Product',
            variant: 'Standard',
            quantity: 1,
            price: 3000
          }
        ],
        totalAmount: 93000
      };

      const req = new Request('http://localhost/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(complexOrderData)
      });

      const res = await app.request(req);
      
      expect(res.status).toBe(201);
      
      // Verify JSON data is properly stringified
      expect(mockPreparedStatement.bind).toHaveBeenCalledWith(
        expect.any(String),
        JSON.stringify(complexOrderData.customerInfo),
        JSON.stringify(complexOrderData.items),
        93000,
        'bank_transfer',
        'pending',
        '希望週末配送',
        expect.any(String),
        expect.any(String)
      );
    });
  });

  describe('Input Validation', () => {
    it('should validate item quantity is positive', async () => {
      const app = createTestApp('admin');
      
      const invalidData = {
        ...validOrderData,
        items: [{
          ...validOrderData.items[0],
          quantity: 0
        }]
      };

      const req = new Request('http://localhost/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(invalidData)
      });

      const res = await app.request(req);
      expect(res.status).toBe(400);
    });

    it('should validate item price is positive', async () => {
      const app = createTestApp('admin');
      
      const invalidData = {
        ...validOrderData,
        items: [{
          ...validOrderData.items[0],
          price: -100
        }]
      };

      const req = new Request('http://localhost/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(invalidData)
      });

      const res = await app.request(req);
      expect(res.status).toBe(400);
    });

    it('should handle malformed JSON', async () => {
      const app = createTestApp('admin');
      
      const req = new Request('http://localhost/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: 'invalid json{'
      });

      const res = await app.request(req);
      expect(res.status).toBe(400);
    });

    it('should validate required fields exist', async () => {
      const app = createTestApp('admin');
      
      const incompleteData = {
        customerInfo: {
          name: 'Test User'
          // missing email, phone, address
        },
        items: validOrderData.items,
        totalAmount: 89900
      };

      const req = new Request('http://localhost/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(incompleteData)
      });

      const res = await app.request(req);
      expect(res.status).toBe(400);
    });
  });
});
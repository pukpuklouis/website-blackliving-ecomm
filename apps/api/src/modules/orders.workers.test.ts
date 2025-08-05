import { env } from 'cloudflare:test';
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { Hono } from 'hono';
import orders from './orders';
import type { Env } from '../index';

// Create a simplified app instance for testing
const app = new Hono<{ Bindings: Env }>();
app.route('/api/orders', orders);

describe('Orders API Workers Integration Tests', () => {
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

  const validOrderData2 = {
    customerInfo: {
      name: '另一個客戶',
      email: 'another.customer@example.com',
      phone: '0912-345-678',
      address: '高雄市前鎮區中山二路123號',
    },
    items: [
      {
        productId: 'test-product-2',
        productName: 'Premium Mattress',
        variant: 'King - Firm',
        quantity: 1,
        price: 129900,
      },
      {
        productId: 'test-accessory-1',
        productName: 'Pillow Set',
        variant: 'Standard',
        quantity: 2,
        price: 2500,
      },
    ],
    totalAmount: 134900,
    paymentMethod: 'bank_transfer' as const,
    notes: '請勿週日配送',
  };

  let createdOrderIds: string[] = [];

  beforeEach(async () => {
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

  describe('GET /api/orders - List Orders (Admin)', () => {
    it('should return empty list when no orders exist', async () => {
      const response = await app.request('/api/orders', {}, env);

      expect(response.status).toBe(200);
      const body = await response.json();
      expect(body.success).toBe(true);
      expect(Array.isArray(body.data)).toBe(true);
      expect(body.data).toHaveLength(0);
      expect(body.total).toBe(0);
    });

    it('should return all orders when they exist', async () => {
      // Create test orders first
      const order1Response = await app.request(
        '/api/orders',
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(validOrderData),
        },
        env
      );
      const order1Data = await order1Response.json();
      createdOrderIds.push(order1Data.data.id);

      const order2Response = await app.request(
        '/api/orders',
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(validOrderData2),
        },
        env
      );
      const order2Data = await order2Response.json();
      createdOrderIds.push(order2Data.data.id);

      // Now fetch all orders
      const response = await app.request('/api/orders', {}, env);

      expect(response.status).toBe(200);
      const body = await response.json();
      expect(body.success).toBe(true);
      expect(Array.isArray(body.data)).toBe(true);
      expect(body.data).toHaveLength(2);
      expect(body.total).toBe(2);

      // Verify order data structure
      const order = body.data[0];
      expect(order).toHaveProperty('id');
      expect(order).toHaveProperty('customer_info');
      expect(order).toHaveProperty('items');
      expect(order).toHaveProperty('total_amount');
      expect(order).toHaveProperty('status');
      expect(order).toHaveProperty('created_at');
      expect(order).toHaveProperty('updated_at');
    });

    it('should filter orders by status', async () => {
      // Create orders with different statuses
      const order1Response = await app.request(
        '/api/orders',
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(validOrderData),
        },
        env
      );
      const order1Data = await order1Response.json();
      createdOrderIds.push(order1Data.data.id);

      const order2Response = await app.request(
        '/api/orders',
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(validOrderData2),
        },
        env
      );
      const order2Data = await order2Response.json();
      createdOrderIds.push(order2Data.data.id);

      // Update one order status
      await app.request(
        `/api/orders/${order1Data.data.id}/status`,
        {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ status: 'confirmed' }),
        },
        env
      );

      // Filter by status
      const response = await app.request('/api/orders?status=confirmed', {}, env);

      expect(response.status).toBe(200);
      const body = await response.json();
      expect(body.success).toBe(true);
      expect(body.data).toHaveLength(1);
      expect(body.data[0].status).toBe('confirmed');
    });

    it('should support pagination', async () => {
      // Create multiple orders
      const orderPromises = Array(5)
        .fill(0)
        .map((_, i) =>
          app.request(
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
          )
        );

      const orderResponses = await Promise.all(orderPromises);
      for (const response of orderResponses) {
        const data = await response.json();
        createdOrderIds.push(data.data.id);
      }

      // Test pagination
      const response = await app.request('/api/orders?limit=3&offset=0', {}, env);

      expect(response.status).toBe(200);
      const body = await response.json();
      expect(body.success).toBe(true);
      expect(body.data).toHaveLength(3);

      // Test second page
      const response2 = await app.request('/api/orders?limit=3&offset=3', {}, env);
      const body2 = await response2.json();
      expect(body2.data).toHaveLength(2);
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

      // Verify items are stored as JSON string
      const items = JSON.parse(body.data.items);
      expect(items).toHaveLength(1);
      expect(items[0].productName).toBe(validOrderData.items[0].productName);
    });

    it('should return 404 for non-existent order', async () => {
      const response = await app.request('/api/orders/non-existent-id', {}, env);

      expect(response.status).toBe(404);
      const body = await response.json();
      expect(body.error).toBe('Order not found');
    });
  });

  describe('POST /api/orders - Create New Order', () => {
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

      // Verify order was actually created in database
      const checkResponse = await app.request(`/api/orders/${body.data.id}`, {}, env);
      expect(checkResponse.status).toBe(200);
    });

    it('should create order with multiple items', async () => {
      const response = await app.request(
        '/api/orders',
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(validOrderData2),
        },
        env
      );

      expect(response.status).toBe(201);
      const body = await response.json();
      expect(body.success).toBe(true);

      createdOrderIds.push(body.data.id);

      // Verify items were stored correctly
      const checkResponse = await app.request(`/api/orders/${body.data.id}`, {}, env);
      const checkBody = await checkResponse.json();
      const items = JSON.parse(checkBody.data.items);
      expect(items).toHaveLength(2);
      expect(items[0].productName).toBe('Premium Mattress');
      expect(items[1].productName).toBe('Pillow Set');
      expect(checkBody.data.total_amount).toBe(134900);
    });

    it('should validate required customer info fields', async () => {
      const invalidData = {
        ...validOrderData,
        customerInfo: {
          name: '',
          email: 'invalid-email',
          phone: '',
          address: '',
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

  describe('PUT /api/orders/:id/status - Update Order Status (Admin)', () => {
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

  describe('GET /api/orders/customer/:email - Get Customer Orders', () => {
    it('should return orders for specific customer email', async () => {
      const customerEmail = 'customer.test@example.com';

      // Create orders for this customer
      const orderData1 = {
        ...validOrderData,
        customerInfo: {
          ...validOrderData.customerInfo,
          email: customerEmail,
        },
      };

      const orderData2 = {
        ...validOrderData2,
        customerInfo: {
          ...validOrderData2.customerInfo,
          email: customerEmail,
        },
      };

      const response1 = await app.request(
        '/api/orders',
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(orderData1),
        },
        env
      );
      const data1 = await response1.json();
      createdOrderIds.push(data1.data.id);

      const response2 = await app.request(
        '/api/orders',
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(orderData2),
        },
        env
      );
      const data2 = await response2.json();
      createdOrderIds.push(data2.data.id);

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
      expect(body.data).toHaveLength(2);

      // Verify all orders belong to the correct customer
      body.data.forEach((order: any) => {
        const customerInfo = JSON.parse(order.customer_info);
        expect(customerInfo.email).toBe(customerEmail);
      });
    });

    it('should return empty array for email with no orders', async () => {
      const response = await app.request('/api/orders/customer/no-orders@example.com', {}, env);

      expect(response.status).toBe(200);
      const body = await response.json();
      expect(body.success).toBe(true);
      expect(Array.isArray(body.data)).toBe(true);
      expect(body.data).toHaveLength(0);
    });

    it('should handle URL-encoded email addresses', async () => {
      const email = 'test+special@example.com';
      const encodedEmail = encodeURIComponent(email);

      // Create order with special characters in email
      const orderResponse = await app.request(
        '/api/orders',
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            ...validOrderData,
            customerInfo: {
              ...validOrderData.customerInfo,
              email: email,
            },
          }),
        },
        env
      );
      const orderData = await orderResponse.json();
      createdOrderIds.push(orderData.data.id);

      // Fetch orders using encoded email
      const response = await app.request(`/api/orders/customer/${encodedEmail}`, {}, env);

      expect(response.status).toBe(200);
      const body = await response.json();
      expect(body.success).toBe(true);
      expect(body.data).toHaveLength(1);

      const customerInfo = JSON.parse(body.data[0].customer_info);
      expect(customerInfo.email).toBe(email);
    });
  });

  describe('Order Business Logic', () => {
    it('should generate unique order IDs', async () => {
      // Create multiple orders concurrently
      const concurrentRequests = Array(3)
        .fill(0)
        .map((_, i) =>
          app.request(
            '/api/orders',
            {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                ...validOrderData,
                customerInfo: {
                  ...validOrderData.customerInfo,
                  email: `concurrent${i}@example.com`,
                },
              }),
            },
            env
          )
        );

      const responses = await Promise.all(concurrentRequests);
      const orderIds: string[] = [];

      // Verify all orders were created successfully
      for (const response of responses) {
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

    it('should preserve JSON data integrity with complex characters', async () => {
      const complexOrderData = {
        customerInfo: {
          name: '測試客戶 with "quotes" & special chars < > & \' "',
          email: 'complex.test@example.com',
          phone: '(02)1234-5678',
          address: '台北市信義區信義路五段7號 10樓 A室',
        },
        items: [
          {
            productId: 'complex-product',
            productName: 'Product with "特殊字符" & symbols < > \' "',
            variant: 'Size: Queen (5尺), Firmness: 中軟式',
            quantity: 1,
            price: 89900,
          },
        ],
        totalAmount: 89900,
        paymentMethod: 'bank_transfer' as const,
        notes: 'Special instructions: 請於 2024/12/31 前配送，聯絡人：王先生 (手機: 0987-654-321)',
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

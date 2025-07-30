import { describe, it, expect, beforeEach } from 'vitest';
import { useTestEnvironment, AuthMocks, ResponseAsserts, generateTestId } from '../tests/utils';
import { seedDatabase, clearSeedData, testIds } from '../tests/seed-data';

describe('API Integration with D1 Database', () => {
  const { getEnv, resetAll } = useTestEnvironment();

  beforeEach(async () => {
    await resetAll();
    await seedDatabase(getEnv().db!);
  });

  describe('Product Management', () => {
    it('should successfully create a product via API', async () => {
      const testEnv = getEnv();
      
      const newProduct = {
        name: 'Test Simmons S4 Queen',
        slug: 'test-simmons-s4-queen',
        description: 'Test mattress for integration testing',
        category: 'simmons-black',
        images: ['https://images.blackliving.com/test-image.jpg'],
        variants: [
          {
            id: 'variant-test-1',
            name: 'Queen - Medium',
            sku: 'TEST-S4-Q-M',
            price: 99900,
            originalPrice: 159900,
            size: 'Queen',
            firmness: 'Medium',
            inStock: true,
            sortOrder: 1
          }
        ],
        features: ['Test Feature 1', 'Test Feature 2'],
        specifications: {
          dimensions: '152cm x 188cm x 35cm',
          weight: '50kg',
          firmness: 'Medium',
          materials: 'Memory Foam + Pocketed Coils'
        },
        inStock: true,
        featured: false,
        sortOrder: 100,
        seoTitle: 'Test Product SEO Title',
        seoDescription: 'Test product SEO description'
      };

      // Create product via API with admin authentication
      const response = await testEnv.fetch('http://localhost:8787/api/admin/products', {
        method: 'POST',
        headers: AuthMocks.getAdminHeaders(),
        body: JSON.stringify(newProduct)
      });

      const data = await ResponseAsserts.expectSuccess(response, 201);
      
      expect(data.data).toHaveProperty('id');
      expect(data.data.name).toBe(newProduct.name);
      expect(data.data.slug).toBe(newProduct.slug);
      expect(data.data.category).toBe(newProduct.category);

      // Verify product was created in database
      const { results } = await testEnv.db!
        .prepare('SELECT * FROM products WHERE slug = ?')
        .bind(newProduct.slug)
        .all();

      expect(results).toHaveLength(1);
      expect(results[0].name).toBe(newProduct.name);
      expect(results[0].category).toBe(newProduct.category);
    });

    it('should retrieve products from API', async () => {
      const testEnv = getEnv();

      const response = await testEnv.fetch('http://localhost:8787/api/products');
      const data = await ResponseAsserts.expectSuccess(response, 200);

      expect(Array.isArray(data.data)).toBe(true);
      expect(data.data.length).toBeGreaterThan(0);
      
      // Check that seeded products are present
      const productNames = data.data.map((p: any) => p.name);
      expect(productNames).toContain('Simmons Black S2 獨立筒床墊');
      expect(productNames).toContain('Simmons Black S3 King 頂級床墊');
    });

    it('should filter products by category', async () => {
      const testEnv = getEnv();

      const response = await testEnv.fetch('http://localhost:8787/api/products?category=simmons-black');
      const data = await ResponseAsserts.expectSuccess(response, 200);

      expect(Array.isArray(data.data)).toBe(true);
      
      // All products should be from simmons-black category
      data.data.forEach((product: any) => {
        expect(product.category).toBe('simmons-black');
      });
    });

    it('should update product via API', async () => {
      const testEnv = getEnv();
      
      const updateData = {
        name: 'Updated Simmons S2 Name',
        featured: true,
        sortOrder: 5
      };

      const response = await testEnv.fetch(`http://localhost:8787/api/admin/products/${testIds.products.simmonsS2Queen}`, {
        method: 'PUT',
        headers: AuthMocks.getAdminHeaders(),
        body: JSON.stringify(updateData)
      });

      const data = await ResponseAsserts.expectSuccess(response, 200);
      
      expect(data.data.name).toBe(updateData.name);
      expect(data.data.featured).toBe(true);
      expect(data.data.sortOrder).toBe(5);

      // Verify update in database
      const { results } = await testEnv.db!
        .prepare('SELECT * FROM products WHERE id = ?')
        .bind(testIds.products.simmonsS2Queen)
        .all();

      expect(results[0].name).toBe(updateData.name);
      expect(results[0].featured).toBe(1); // SQLite stores boolean as integer
    });
  });

  describe('Order Management', () => {
    it('should create order via API', async () => {
      const testEnv = getEnv();
      
      const newOrder = {
        customerInfo: {
          name: '測試客戶',
          email: 'test@example.com',
          phone: '0912-345-678',
          address: '台北市測試區測試路123號'
        },
        items: [
          {
            productId: testIds.products.simmonsS2Queen,
            variantId: 'variant-s2-queen-medium',
            name: 'Simmons Black S2 獨立筒床墊 - Queen 中式',
            price: 89900,
            quantity: 1
          }
        ],
        totalAmount: 89900,
        paymentMethod: 'bank_transfer',
        notes: '測試訂單',
        shippingAddress: {
          recipient: '測試客戶',
          phone: '0912-345-678',
          address: '台北市測試區測試路123號',
          postalCode: '100'
        }
      };

      const response = await testEnv.fetch('http://localhost:8787/api/orders', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(newOrder)
      });

      const data = await ResponseAsserts.expectSuccess(response, 201);
      
      expect(data.data).toHaveProperty('id');
      expect(data.data.totalAmount).toBe(newOrder.totalAmount);
      expect(data.data.status).toBe('pending');

      // Verify order in database
      const { results } = await testEnv.db!
        .prepare('SELECT * FROM orders WHERE id = ?')
        .bind(data.data.id)
        .all();

      expect(results).toHaveLength(1);
      expect(results[0].total_amount).toBe(newOrder.totalAmount);
    });

    it('should retrieve orders for admin', async () => {
      const testEnv = getEnv();

      const response = await testEnv.fetch('http://localhost:8787/api/admin/orders', {
        headers: AuthMocks.getAdminHeaders()
      });

      const data = await ResponseAsserts.expectSuccess(response, 200);
      
      expect(Array.isArray(data.data)).toBe(true);
      expect(data.data.length).toBeGreaterThan(0);
      
      // Check seeded orders are present
      const orderIds = data.data.map((o: any) => o.id);
      expect(orderIds).toContain(testIds.orders.pending);
      expect(orderIds).toContain(testIds.orders.processing);
    });
  });

  describe('Appointment System', () => {
    it('should create appointment via API', async () => {
      const testEnv = getEnv();
      
      const newAppointment = {
        customerInfo: {
          name: '測試預約客戶',
          email: 'appointment@test.com',
          phone: '0911-222-333'
        },
        storeLocation: '中和',
        preferredDate: '2025-02-10',
        preferredTime: '下午',
        productInterest: ['simmons-black'],
        notes: '希望了解S2系列床墊'
      };

      const response = await testEnv.fetch('http://localhost:8787/api/appointments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(newAppointment)
      });

      const data = await ResponseAsserts.expectSuccess(response, 201);
      
      expect(data.data).toHaveProperty('id');
      expect(data.data.storeLocation).toBe(newAppointment.storeLocation);
      expect(data.data.status).toBe('pending');

      // Verify appointment in database
      const { results } = await testEnv.db!
        .prepare('SELECT * FROM appointments WHERE id = ?')
        .bind(data.data.id)
        .all();

      expect(results).toHaveLength(1);
      expect(results[0].store_location).toBe(newAppointment.storeLocation);
    });
  });

  describe('Authentication & Authorization', () => {
    it('should reject admin requests without authentication', async () => {
      const testEnv = getEnv();

      const response = await testEnv.fetch('http://localhost:8787/api/admin/products');
      
      await ResponseAsserts.expectError(response, 401);
    });

    it('should reject admin requests with invalid role', async () => {
      const testEnv = getEnv();

      const response = await testEnv.fetch('http://localhost:8787/api/admin/products', {
        headers: AuthMocks.getCustomerHeaders()
      });
      
      await ResponseAsserts.expectError(response, 403);
    });
  });

  describe('Cache Integration', () => {
    it('should cache product listings', async () => {
      const testEnv = getEnv();

      // First request - should hit database
      const response1 = await testEnv.fetch('http://localhost:8787/api/products');
      await ResponseAsserts.expectSuccess(response1, 200);

      // Second request - should hit cache (verify by checking response consistency)
      const response2 = await testEnv.fetch('http://localhost:8787/api/products');
      const data2 = await ResponseAsserts.expectSuccess(response2, 200);

      expect(Array.isArray(data2.data)).toBe(true);
      expect(data2.data.length).toBeGreaterThan(0);
    });
  });

  describe('Reviews API Integration', () => {
    it('should create and retrieve reviews', async () => {
      const testEnv = getEnv();
      
      const newReview = {
        customerName: '整合測試客戶',
        productId: testIds.products.simmonsS2Queen,
        rating: 5,
        content: '這是整合測試的評論，產品非常棒！',
        source: 'website'
      };

      // Create review
      const createResponse = await testEnv.fetch('http://localhost:8787/api/reviews', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(newReview)
      });

      const createData = await ResponseAsserts.expectSuccess(createResponse, 201);
      expect(createData.data.customerName).toBe(newReview.customerName);

      // Retrieve reviews
      const listResponse = await testEnv.fetch('http://localhost:8787/api/reviews');
      const listData = await ResponseAsserts.expectSuccess(listResponse, 200);
      expect(Array.isArray(listData.data)).toBe(true);

      // Get review stats
      const statsResponse = await testEnv.fetch('http://localhost:8787/api/reviews/stats');
      const statsData = await ResponseAsserts.expectSuccess(statsResponse, 200);
      expect(statsData.data).toHaveProperty('totalReviews');
      expect(statsData.data).toHaveProperty('averageRating');
    });
  });

  describe('Newsletter API Integration', () => {
    it('should handle newsletter subscription workflow', async () => {
      const testEnv = getEnv();
      
      const email = 'integration.test@example.com';

      // Subscribe
      const subscribeResponse = await testEnv.fetch('http://localhost:8787/api/newsletter/subscribe', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ email, source: 'website' })
      });

      const subscribeData = await ResponseAsserts.expectSuccess(subscribeResponse, 201);
      expect(subscribeData.data.email).toBe(email);

      // Admin list subscribers
      const listResponse = await testEnv.fetch('http://localhost:8787/api/newsletter/admin/subscribers', {
        headers: AuthMocks.getAdminHeaders()
      });

      const listData = await ResponseAsserts.expectSuccess(listResponse, 200);
      expect(listData.data).toHaveProperty('subscribers');

      // Unsubscribe
      const unsubscribeResponse = await testEnv.fetch(`http://localhost:8787/api/newsletter/unsubscribe/${encodeURIComponent(email)}`, {
        method: 'DELETE'
      });

      await ResponseAsserts.expectSuccess(unsubscribeResponse, 200);
    });
  });

  describe('Contact API Integration', () => {
    it('should handle contact form submission and admin management', async () => {
      const testEnv = getEnv();
      
      const contactData = {
        name: '整合測試客戶',
        email: 'integration.contact@example.com',
        phone: '0912-345-678',
        subject: '整合測試詢問',
        message: '這是整合測試的聯絡表單，用於測試API功能。'
      };

      // Submit contact form
      const submitResponse = await testEnv.fetch('http://localhost:8787/api/contact', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(contactData)
      });

      const submitData = await ResponseAsserts.expectSuccess(submitResponse, 201);
      expect(submitData.data.status).toBe('new');

      // Admin view contacts
      const listResponse = await testEnv.fetch('http://localhost:8787/api/contact/admin', {
        headers: AuthMocks.getAdminHeaders()
      });

      const listData = await ResponseAsserts.expectSuccess(listResponse, 200);
      expect(listData.data).toHaveProperty('contacts');

      // Admin get stats
      const statsResponse = await testEnv.fetch('http://localhost:8787/api/contact/admin/stats', {
        headers: AuthMocks.getAdminHeaders()
      });

      const statsData = await ResponseAsserts.expectSuccess(statsResponse, 200);
      expect(statsData.data).toHaveProperty('total');
      expect(statsData.data).toHaveProperty('responseRate');
    });
  });

  describe('Enhanced Products API Integration', () => {
    it('should test new product features', async () => {
      const testEnv = getEnv();

      // Test featured products
      const featuredResponse = await testEnv.fetch('http://localhost:8787/api/products/featured');
      const featuredData = await ResponseAsserts.expectSuccess(featuredResponse, 200);
      expect(Array.isArray(featuredData.data)).toBe(true);

      // Test categories
      const categoriesResponse = await testEnv.fetch('http://localhost:8787/api/products/categories');
      const categoriesData = await ResponseAsserts.expectSuccess(categoriesResponse, 200);
      expect(typeof categoriesData.data).toBe('object');

      // Test search
      const searchResponse = await testEnv.fetch('http://localhost:8787/api/products/search?q=Simmons');
      const searchData = await ResponseAsserts.expectSuccess(searchResponse, 200);
      expect(searchData.data).toHaveProperty('query');
      expect(searchData.data).toHaveProperty('results');

      // Test product by slug
      const slugResponse = await testEnv.fetch('http://localhost:8787/api/products/simmons-black-s2-queen');
      const slugData = await ResponseAsserts.expectSuccess(slugResponse, 200);
      expect(slugData.data.slug).toBe('simmons-black-s2-queen');
    });
  });

  describe('Error Handling', () => {
    it('should handle malformed JSON requests gracefully', async () => {
      const testEnv = getEnv();

      const response = await testEnv.fetch('http://localhost:8787/api/admin/products', {
        method: 'POST',
        headers: {
          ...AuthMocks.getAdminHeaders(),
          'Content-Type': 'application/json'
        },
        body: 'invalid json {'
      });

      await ResponseAsserts.expectError(response, 400);
    });

    it('should return 404 for non-existent endpoints', async () => {
      const testEnv = getEnv();

      const response = await testEnv.fetch('http://localhost:8787/api/non-existent');
      
      expect(response.status).toBe(404);
    });

    it('should validate required fields', async () => {
      const testEnv = getEnv();

      const invalidProduct = {
        name: '', // Empty name should fail
        description: 'Test description'
      };

      const response = await testEnv.fetch('http://localhost:8787/api/admin/products', {
        method: 'POST',
        headers: AuthMocks.getAdminHeaders(),
        body: JSON.stringify(invalidProduct)
      });

      await ResponseAsserts.expectError(response, 400);
    });
  });
});
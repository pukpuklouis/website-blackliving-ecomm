import { describe, it, expect, beforeEach, vi } from 'vitest';
import { Hono } from 'hono';
import products from './products';
import type { Env } from '../index';
import { mockEnv } from '../lib/vitest-setup';
import { AuthMocks, ResponseAsserts, useSimpleTestEnvironment, generateTestId } from '../lib/simple-test-utils';

const testIds = {
  products: {
    simmonsS2Queen: generateTestId('simmons-s2-queen'),
    usImportMattress: generateTestId('us-import-mattress'),
  },
};

describe('Enhanced Products API', () => {
  const app = new Hono<{ Bindings: Env }>();
  app.route('/api/products', products);

  const { resetAll } = useSimpleTestEnvironment();

  beforeEach(async () => {
    vi.resetAllMocks();
    await resetAll(); // Reset database and cache before each test
    mockEnv.DB.prepare.mockReturnValue({
      bind: vi.fn().mockReturnThis(),
      all: vi.fn(),
      first: vi.fn(),
      run: vi.fn(),
    });
    // Mock the Hono context's get method for 'db' and 'cache'
    vi.spyOn(Hono.prototype, 'get').mockImplementation((key: string) => {
      if (key === 'db') return mockEnv.DB;
      if (key === 'cache') return mockEnv.CACHE; // Assuming mockEnv.CACHE exists or is mocked
      return undefined;
    });
  });

  // Helper function to create a test product
  async function createTestProduct(productData: any = {}) {
    const defaultProductData = {
      name: 'Test Simmons Mattress',
      slug: `test-simmons-${Date.now()}`,
      description: 'A comfortable test mattress for unit testing',
      category: 'simmons-black',
      images: ['https://example.com/test-mattress.jpg'],
      variants: [
        {
          id: `variant-${Date.now()}-1`,
          name: 'Queen - Medium',
          sku: `SKU-${Date.now()}-Q-M`,
          price: 89900,
          size: 'Queen',
          firmness: 'Medium',
          inStock: true,
          sortOrder: 0,
        }
      ],
      features: ['Comfortable', 'Durable'],
      specifications: { 'Material': 'Memory Foam' },
      inStock: true,
      featured: false,
      sortOrder: 0,
    };

    const finalProductData = { ...defaultProductData, ...productData };

    const response = await app.request('http://localhost/api/products', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(finalProductData)
    }, mockEnv);

    const data = await response.json();
    expect(response.status).toBe(201);
    expect(data.success).toBe(true);
    return data.data;
  }

  describe('GET /api/products', () => {
    it('should return all products with pagination', async () => {
      mockEnv.DB.prepare().all.mockResolvedValue({
        results: [{ id: 'test-product-1', name: 'Test Product', slug: 'test-product', description: 'desc', category: 'category', images: '[]', variants: '[]', features: '[]', specifications: '{}', inStock: 1, featured: 0, sortOrder: 0, created_at: Date.now(), updated_at: Date.now() }],
        success: true,
      });

      const response = await app.request('http://localhost/api/products', {}, mockEnv);
      const data = await response.json();
      expect(response.status).toBe(200);
      expect(data.success).toBe(true);

      expect(data.data).toHaveProperty('products');
      expect(data.data).toHaveProperty('pagination');
      expect(Array.isArray(data.data.products)).toBe(true);
      expect(data.data.products.length).toBeGreaterThan(0);
      expect(data.data.pagination.limit).toBe(20);
      expect(data.data.pagination.offset).toBe(0);
    });

    it('should filter products by category', async () => {
      mockEnv.DB.prepare().all.mockResolvedValue({
        results: [{ id: 'test-product-1', name: 'Test Product', slug: 'test-product', description: 'desc', category: 'simmons-black', images: '[]', variants: '[]', features: '[]', specifications: '{}', inStock: 1, featured: 0, sortOrder: 0, created_at: Date.now(), updated_at: Date.now() }],
        success: true,
      });

      const response = await app.request('http://localhost/api/products?category=simmons-black', {}, mockEnv);
      const data = await response.json();
      expect(response.status).toBe(200);
      expect(data.success).toBe(true);

      expect(Array.isArray(data.data.products)).toBe(true);
      data.data.products.forEach((product: any) => {
        expect(product.category).toBe('simmons-black');
      });
    });

    it('should filter products by featured status', async () => {
      mockEnv.DB.prepare().all.mockResolvedValue({
        results: [{ id: 'test-product-1', name: 'Test Product', slug: 'test-product', description: 'desc', category: 'category', images: '[]', variants: '[]', features: '[]', specifications: '{}', inStock: 1, featured: 1, sortOrder: 0, created_at: Date.now(), updated_at: Date.now() }],
        success: true,
      });

      const response = await app.request('http://localhost/api/products?featured=true', {}, mockEnv);
      const data = await response.json();
      expect(response.status).toBe(200);
      expect(data.success).toBe(true);

      expect(Array.isArray(data.data.products)).toBe(true);
      data.data.products.forEach((product: any) => {
        expect(product.featured).toBe(1);
      });
    });

    it('should filter products by stock status', async () => {
      mockEnv.DB.prepare().all.mockResolvedValue({
        results: [{ id: 'test-product-1', name: 'Test Product', slug: 'test-product', description: 'desc', category: 'category', images: '[]', variants: '[]', features: '[]', specifications: '{}', inStock: 1, featured: 0, sortOrder: 0, created_at: Date.now(), updated_at: Date.now() }],
        success: true,
      });

      const response = await app.request('http://localhost/api/products?inStock=true', {}, mockEnv);
      const data = await response.json();
      expect(response.status).toBe(200);
      expect(data.success).toBe(true);

      expect(Array.isArray(data.data.products)).toBe(true);
      data.data.products.forEach((product: any) => {
        expect(product.inStock).toBe(1);
      });
    });

    it('should search products by name and description', async () => {
      mockEnv.DB.prepare().all.mockResolvedValue({
        results: [{ id: 'test-product-1', name: 'Simmons Mattress', slug: 'simmons-mattress', description: 'A comfortable Simmons mattress', category: 'simmons-black', images: '[]', variants: '[]', features: '[]', specifications: '{}', inStock: 1, featured: 0, sortOrder: 0, created_at: Date.now(), updated_at: Date.now() }],
        success: true,
      });

      const response = await app.request('http://localhost/api/products?search=Simmons', {}, mockEnv);
      const data = await response.json();
      expect(response.status).toBe(200);
      expect(data.success).toBe(true);

      expect(Array.isArray(data.data.products)).toBe(true);
      data.data.products.forEach((product: any) => {
        const matchesSearch = product.name.toLowerCase().includes('simmons') || 
                             product.description.toLowerCase().includes('simmons');
        expect(matchesSearch).toBe(true);
      });
    });

    it('should support sorting by name', async () => {
      mockEnv.DB.prepare().all.mockResolvedValue({
        results: [
          { id: 'test-product-1', name: 'A Product', slug: 'a-product', description: 'desc', category: 'category', images: '[]', variants: '[]', features: '[]', specifications: '{}', inStock: 1, featured: 0, sortOrder: 0, created_at: Date.now(), updated_at: Date.now() },
          { id: 'test-product-2', name: 'B Product', slug: 'b-product', description: 'desc', category: 'category', images: '[]', variants: '[]', features: '[]', specifications: '{}', inStock: 1, featured: 0, sortOrder: 0, created_at: Date.now(), updated_at: Date.now() },
        ],
        success: true,
      });

      const response = await app.request('http://localhost/api/products?sortBy=name&sortOrder=asc', {}, mockEnv);
      const data = await response.json();
      expect(response.status).toBe(200);
      expect(data.success).toBe(true);

      if (data.data.products.length > 1) {
        for (let i = 1; i < data.data.products.length; i++) {
          expect(data.data.products[i].name.localeCompare(data.data.products[i-1].name)).toBeGreaterThanOrEqual(0);
        }
      }
    });

    it('should support sorting by featured status', async () => {
      mockEnv.DB.prepare().all.mockResolvedValue({
        results: [
          { id: 'test-product-1', name: 'Featured Product', slug: 'featured-product', description: 'desc', category: 'category', images: '[]', variants: '[]', features: '[]', specifications: '{}', inStock: 1, featured: 1, sortOrder: 0, created_at: Date.now(), updated_at: Date.now() },
          { id: 'test-product-2', name: 'Non-Featured Product', slug: 'non-featured-product', description: 'desc', category: 'category', images: '[]', variants: '[]', features: '[]', specifications: '{}', inStock: 1, featured: 0, sortOrder: 0, created_at: Date.now(), updated_at: Date.now() },
        ],
        success: true,
      });

      const response = await app.request('http://localhost/api/products?sortBy=featured', {}, mockEnv);
      const data = await response.json();
      expect(response.status).toBe(200);
      expect(data.success).toBe(true);

      // Featured products should come first when sorting by featured
      let foundNonFeatured = false;
      for (const product of data.data.products) {
        if (foundNonFeatured && product.featured === 1) {
          // If we found a non-featured product, we shouldn't find featured ones after
          expect(false).toBe(true);
        }
        if (product.featured === 0) {
          foundNonFeatured = true;
        }
      }
    });

    it('should support pagination', async () => {
      mockEnv.DB.prepare().all.mockResolvedValue({
        results: [
          { id: 'test-product-1', name: 'Product 1', slug: 'product-1', description: 'desc', category: 'category', images: '[]', variants: '[]', features: '[]', specifications: '{}', inStock: 1, featured: 0, sortOrder: 0, created_at: Date.now(), updated_at: Date.now() },
          { id: 'test-product-2', name: 'Product 2', slug: 'product-2', description: 'desc', category: 'category', images: '[]', variants: '[]', features: '[]', specifications: '{}', inStock: 1, featured: 0, sortOrder: 0, created_at: Date.now(), updated_at: Date.now() },
        ],
        success: true,
      });

      const response = await app.request('http://localhost/api/products?limit=2&offset=0', {}, mockEnv);
      const data = await response.json();
      expect(response.status).toBe(200);
      expect(data.success).toBe(true);

      expect(data.data.products.length).toBeLessThanOrEqual(2);
      expect(data.data.pagination.limit).toBe(2);
      expect(data.data.pagination.offset).toBe(0);
    });

    it('should combine multiple filters', async () => {
      mockEnv.DB.prepare().all.mockResolvedValue({
        results: [{ id: 'test-product-1', name: 'Test Product', slug: 'test-product', description: 'desc', category: 'simmons-black', images: '[]', variants: '[]', features: '[]', specifications: '{}', inStock: 1, featured: 1, sortOrder: 0, created_at: Date.now(), updated_at: Date.now() }],
        success: true,
      });

      const response = await app.request('http://localhost/api/products?category=simmons-black&featured=true&inStock=true', {}, mockEnv);
      const data = await response.json();
      expect(response.status).toBe(200);
      expect(data.success).toBe(true);

      data.data.products.forEach((product: any) => {
        expect(product.category).toBe('simmons-black');
        expect(product.featured).toBe(1);
        expect(product.inStock).toBe(1);
      });
    });
  });


  describe('GET /api/products/:identifier', () => {
    it('should return product by ID', async () => {
      
      
      // Create a test product first
      const createdProduct = await createTestProduct(testEnv);
      
      const response = await app.request(`http://localhost:8787/api/products/${createdProduct.id}`);
      const data = await ResponseAsserts.expectSuccess(response, 200);

      expect(data.data.id).toBe(createdProduct.id);
      expect(data.data).toHaveProperty('name');
      expect(data.data).toHaveProperty('slug');
      expect(data.data).toHaveProperty('description');
    });

    it('should return product by slug', async () => {
      
      
      const response = await app.request('http://localhost:8787/api/products/simmons-black-s2-queen');
      const data = await ResponseAsserts.expectSuccess(response, 200);

      expect(data.data.slug).toBe('simmons-black-s2-queen');
      expect(data.data).toHaveProperty('name');
      expect(data.data).toHaveProperty('description');
    });

    it('should return 404 for non-existent product', async () => {
      
      
      const response = await app.request('http://localhost:8787/api/products/non-existent-product');
      await ResponseAsserts.expectError(response, 404);
    });
  });

  describe('POST /api/products (Admin only)', () => {
    it('should create product with admin authentication', async () => {
      
      
      const newProduct = {
        name: 'Test Simmons S4 King',
        slug: 'test-simmons-s4-king',
        description: 'Test King size mattress with advanced comfort features',
        category: 'simmons-black',
        images: ['https://images.blackliving.com/test-image.jpg'],
        variants: [{
          id: 'variant-test-king-1',
          name: 'King - Medium',
          sku: 'TEST-S4-K-M',
          price: 149900,
          originalPrice: 229900,
          size: 'King',
          firmness: 'Medium',
          inStock: true,
          sortOrder: 1
        }],
        features: ['Test Feature 1', 'Test Feature 2'],
        specifications: {
          dimensions: '182cm x 188cm x 35cm',
          weight: '65kg',
          firmness: 'Medium',
          materials: 'Memory Foam + Pocketed Coils'
        },
        inStock: true,
        featured: false,
        sortOrder: 50,
        seoTitle: 'Test Product SEO Title',
        seoDescription: 'Test product SEO description'
      };

      const response = await app.request('http://localhost:8787/api/products', {
        method: 'POST',
        headers: AuthMocks.getAdminHeaders(),
        body: JSON.stringify(newProduct)
      });

      const data = await ResponseAsserts.expectSuccess(response, 201);
      
      expect(data.data).toHaveProperty('id');
      expect(data.data.name).toBe(newProduct.name);
      expect(data.data.slug).toBe(newProduct.slug);
      expect(data.data.category).toBe(newProduct.category);
      expect(data.data.variants).toEqual(newProduct.variants);
    });

    it('should validate required fields', async () => {
      
      
      const invalidProduct = {
        name: '', // Empty name
        slug: 'invalid-slug',
        description: 'Test', // Too short
        category: 'invalid-category'
      };

      const response = await app.request('http://localhost:8787/api/products', {
        method: 'POST',
        headers: AuthMocks.getAdminHeaders(),
        body: JSON.stringify(invalidProduct)
      });

      await ResponseAsserts.expectError(response, 400);
    });

    it('should validate slug format', async () => {
      
      
      const productWithInvalidSlug = {
        name: 'Test Product',
        slug: 'Invalid Slug With Spaces',
        description: 'Valid description for the test product',
        category: 'simmons-black',
        variants: [{
          id: 'variant-1',
          name: 'Test Variant',
          sku: 'TEST-001',
          price: 10000,
          size: 'Queen',
          inStock: true,
          sortOrder: 1
        }]
      };

      const response = await app.request('http://localhost:8787/api/products', {
        method: 'POST',
        headers: AuthMocks.getAdminHeaders(),
        body: JSON.stringify(productWithInvalidSlug)
      });

      await ResponseAsserts.expectError(response, 400);
    });

    it('should prevent duplicate slugs', async () => {
      
      
      const duplicateProduct = {
        name: 'Duplicate Slug Test',
        slug: 'simmons-black-s2-queen', // This slug already exists
        description: 'Test product with duplicate slug',
        category: 'simmons-black',
        variants: [{
          id: 'variant-duplicate',
          name: 'Test Variant',
          sku: 'DUP-001',
          price: 10000,
          size: 'Queen',
          inStock: true,
          sortOrder: 1
        }]
      };

      const response = await app.request('http://localhost:8787/api/products', {
        method: 'POST',
        headers: AuthMocks.getAdminHeaders(),
        body: JSON.stringify(duplicateProduct)
      });

      await ResponseAsserts.expectError(response, 409);
    });

    it('should require at least one variant', async () => {
      
      
      const productWithoutVariants = {
        name: 'Test Product',
        slug: 'test-product-no-variants',
        description: 'Test product without any variants',
        category: 'simmons-black',
        variants: []
      };

      const response = await app.request('http://localhost:8787/api/products', {
        method: 'POST',
        headers: AuthMocks.getAdminHeaders(),
        body: JSON.stringify(productWithoutVariants)
      });

      await ResponseAsserts.expectError(response, 400);
    });

    it('should reject requests without admin authentication', async () => {
      
      
      const response = await app.request('http://localhost:8787/api/products', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ name: 'Test' })
      });

      await ResponseAsserts.expectError(response, 403);
    });
  });

  describe('PUT /api/products/:id (Admin only)', () => {
    it('should update product with admin authentication', async () => {
      
      
      const updateData = {
        name: 'Updated Simmons S2 Name',
        featured: true,
        sortOrder: 5
      };

      const response = await app.request(`http://localhost:8787/api/products/${testIds.products.simmonsS2Queen}`, {
        method: 'PUT',
        headers: AuthMocks.getAdminHeaders(),
        body: JSON.stringify(updateData)
      });

      const data = await ResponseAsserts.expectSuccess(response, 200);
      
      expect(data.data.name).toBe(updateData.name);
      expect(data.data.featured).toBe(true);
      expect(data.data.sortOrder).toBe(5);
    });

    it('should update product slug if unique', async () => {
      
      
      // Create a test product first
      const createdProduct = await createTestProduct();
      
      const updateData = {
        slug: 'updated-simmons-s2-queen-slug'
      };

      const response = await app.request(`http://localhost:8787/api/products/${createdProduct.id}`, {
        method: 'PUT',
        headers: AuthMocks.getAdminHeaders(),
        body: JSON.stringify(updateData)
      });

      const data = await ResponseAsserts.expectSuccess(response, 200);
      expect(data.data.slug).toBe(updateData.slug);
    });

    it('should prevent updating to duplicate slug', async () => {
      
      
      // Create two test products
      const firstProduct = await createTestProduct({ slug: 'first-product-slug' });
      const secondProduct = await createTestProduct({ slug: 'second-product-slug' });
      
      const updateData = {
        slug: secondProduct.slug // Try to update first product to have the same slug as second product
      };

      const response = await app.request(`http://localhost:8787/api/products/${firstProduct.id}`, {
        method: 'PUT',
        headers: AuthMocks.getAdminHeaders(),
        body: JSON.stringify(updateData)
      });

      await ResponseAsserts.expectError(response, 409);
    });

    it('should return 404 for non-existent product', async () => {
      
      
      const response = await app.request('http://localhost:8787/api/products/non-existent-id', {
        method: 'PUT',
        headers: AuthMocks.getAdminHeaders(),
        body: JSON.stringify({ name: 'Updated Name' })
      });

      await ResponseAsserts.expectError(response, 404);
    });

    it('should reject requests without admin authentication', async () => {
      
      
      // Create a test product first
      const createdProduct = await createTestProduct();
      
      const response = await app.request(`http://localhost:8787/api/products/${createdProduct.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ name: 'Updated Name' })
      });

      await ResponseAsserts.expectError(response, 403);
    });
  });

  describe('DELETE /api/products/:id (Admin only)', () => {
    it('should delete product with admin authentication', async () => {
      
      
      // First create a product to delete
      const newProduct = {
        name: 'Product to Delete',
        slug: 'product-to-delete',
        description: 'This product will be deleted in the test',
        category: 'accessories',
        variants: [{
          id: 'variant-delete',
          name: 'Delete Variant',
          sku: 'DEL-001',
          price: 5000,
          size: 'Standard',
          inStock: true,
          sortOrder: 1
        }]
      };

      const createResponse = await app.request('http://localhost:8787/api/products', {
        method: 'POST',
        headers: AuthMocks.getAdminHeaders(),
        body: JSON.stringify(newProduct)
      });

      const createData = await ResponseAsserts.expectSuccess(createResponse, 201);
      const productId = createData.data.id;

      // Now delete it
      const deleteResponse = await app.request(`http://localhost:8787/api/products/${productId}`, {
        method: 'DELETE',
        headers: AuthMocks.getAdminHeaders()
      });

      await ResponseAsserts.expectSuccess(deleteResponse, 200);

      // Verify it's deleted
      const getResponse = await app.request(`http://localhost:8787/api/products/${productId}`);
      await ResponseAsserts.expectError(getResponse, 404);
    });

    it('should return 404 for non-existent product', async () => {
      
      
      const response = await app.request('http://localhost:8787/api/products/non-existent-id', {
        method: 'DELETE',
        headers: AuthMocks.getAdminHeaders()
      });

      await ResponseAsserts.expectError(response, 404);
    });

    it('should reject requests without admin authentication', async () => {
      
      
      // Create a test product first
      const createdProduct = await createTestProduct();
      
      const response = await app.request(`http://localhost:8787/api/products/${createdProduct.id}`, {
        method: 'DELETE'
      });

      await ResponseAsserts.expectError(response, 403);
    });
  });

  describe('Caching', () => {
    it('should cache product listings', async () => {
      
      
      // First request
      const response1 = await app.request('http://localhost:8787/api/products');
      const data1 = await ResponseAsserts.expectSuccess(response1, 200);
      
      // Second request should be cached
      const response2 = await app.request('http://localhost:8787/api/products');
      const data2 = await ResponseAsserts.expectSuccess(response2, 200);
      
      expect(data2.cached).toBe(true);
    });

    it('should cache featured products', async () => {
      
      
      // First request
      const response1 = await app.request('http://localhost:8787/api/products/featured');
      const data1 = await ResponseAsserts.expectSuccess(response1, 200);
      
      // Second request should be cached
      const response2 = await app.request('http://localhost:8787/api/products/featured');
      const data2 = await ResponseAsserts.expectSuccess(response2, 200);
      
      expect(data2.cached).toBe(true);
    });

    it('should cache category data', async () => {
      
      
      // First request
      const response1 = await app.request('http://localhost:8787/api/products/categories');
      const data1 = await ResponseAsserts.expectSuccess(response1, 200);
      
      // Second request should be cached
      const response2 = await app.request('http://localhost:8787/api/products/categories');
      const data2 = await ResponseAsserts.expectSuccess(response2, 200);
      
      expect(data2.cached).toBe(true);
    });
  });
});
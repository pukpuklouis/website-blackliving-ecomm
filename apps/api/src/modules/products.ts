import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';
import { eq, desc, asc, and, or, like, count, sql } from 'drizzle-orm';
import { products } from '@blackliving/db';
import { createId } from '@paralleldrive/cuid2';

type Env = {
  Bindings: {
    DB: D1Database;
    CACHE: KVNamespace;
    R2: R2Bucket;
    NODE_ENV: string;
  };
  Variables: {
    db: any;
    cache: any;
    storage: any;
    user: any;
    session: any;
  };
};

const app = new Hono<Env>();

// Validation schemas
const createProductSchema = z.object({
  name: z.string().min(1, 'Product name is required'),
  slug: z.string().min(1, 'Product slug is required').regex(/^[a-z0-9-]+$/, 'Slug must contain only lowercase letters, numbers, and hyphens'),
  description: z.string().min(10, 'Description must be at least 10 characters'),
  category: z.enum(['simmons-black', 'accessories', 'us-imports']),
  images: z.array(z.string().url()).default([]),
  variants: z.array(z.object({
    id: z.string(),
    name: z.string(),
    sku: z.string(),
    price: z.number().positive(),
    originalPrice: z.number().positive().optional(),
    size: z.enum(['single', 'double', 'queen', 'king']),
    firmness: z.enum(['soft', 'medium', 'firm']),
    stock: z.number().int().min(0),
    inStock: z.boolean().default(true),
    sortOrder: z.number().default(0),
  })).min(1, 'At least one variant is required'),
  features: z.array(z.string()).default([]),
  specifications: z.record(z.string()).default({}),
  inStock: z.boolean().default(true),
  featured: z.boolean().default(false),
  sortOrder: z.number().default(0),
  seoTitle: z.string().optional(),
  seoDescription: z.string().optional(),
});

const updateProductSchema = createProductSchema.partial();

const productQuerySchema = z.object({
  category: z.enum(['simmons-black', 'accessories', 'us-imports']).optional(),
  featured: z.string().optional(),
  inStock: z.string().optional(),
  search: z.string().optional(),
  limit: z.string().optional(),
  offset: z.string().optional(),
  sortBy: z.enum(['name', 'price', 'created', 'featured']).default('created'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
});

// Helper function to require admin role
const requireAdmin = async (c: any, next: any) => {
  const user = c.get('user');
  if (!user || user.role !== 'admin') {
    return c.json({ 
      success: false, 
      error: 'Unauthorized', 
      message: 'Admin access required' 
    }, 403);
  }
  await next();
};

// GET /api/products - List all products with advanced filtering and search
app.get('/', zValidator('query', productQuerySchema), async (c) => {
  try {
    const db = c.get('db');
    const cache = c.get('cache');
    const query = c.req.valid('query');

    // Build cache key
    const cacheKey = `products:list:${JSON.stringify(query)}`;
    
    // Try cache first
    const cached = await cache.get(cacheKey);
    if (cached) {
      return c.json({
        success: true,
        data: JSON.parse(cached),
        cached: true
      });
    }

    // Build query conditions
    const conditions = [];
    
    if (query.category) {
      conditions.push(eq(products.category, query.category));
    }
    
    if (query.featured) {
      conditions.push(eq(products.featured, query.featured === 'true'));
    }
    
    if (query.inStock) {
      conditions.push(eq(products.inStock, query.inStock === 'true'));
    }

    // Handle search
    if (query.search) {
      const searchTerm = `%${query.search}%`;
      conditions.push(
        or(
          like(products.name, searchTerm),
          like(products.description, searchTerm)
        )
      );
    }

    // Handle sorting
    let orderBy;
    const sortDirection = query.sortOrder === 'asc' ? asc : desc;
    
    switch (query.sortBy) {
      case 'name':
        orderBy = sortDirection(products.name);
        break;
      case 'featured':
        orderBy = [desc(products.featured), desc(products.createdAt)];
        break;
      default:
        orderBy = sortDirection(products.createdAt);
    }

    // Execute query with pagination
    const limit = parseInt(query.limit || '20');
    const offset = parseInt(query.offset || '0');

    const result = await db
      .select()
      .from(products)
      .where(conditions.length > 0 ? and(...conditions) : undefined)
      .orderBy(...(Array.isArray(orderBy) ? orderBy : [orderBy]))
      .limit(limit)
      .offset(offset);

    // Get total count for pagination
    const [totalResult] = await db
      .select({ count: count() })
      .from(products)
      .where(conditions.length > 0 ? and(...conditions) : undefined);

    const responseData = {
      products: result,
      pagination: {
        limit,
        offset,
        total: totalResult.count,
        hasMore: offset + result.length < totalResult.count
      }
    };

    // Cache the result for 10 minutes
    await cache.set(cacheKey, JSON.stringify(responseData), { expirationTtl: 600 });

    return c.json({
      success: true,
      data: responseData
    });

  } catch (error) {
    console.error('Error fetching products:', error);
    return c.json({
      success: false,
      error: 'Internal Server Error',
      message: 'Failed to fetch products'
    }, 500);
  }
});

// GET /api/products/featured - Get featured products for homepage
app.get('/featured', async (c) => {
  try {
    const db = c.get('db');
    const cache = c.get('cache');
    
    const cacheKey = 'products:featured';
    
    // Try cache first
    const cached = await cache.get(cacheKey);
    if (cached) {
      return c.json({
        success: true,
        data: JSON.parse(cached),
        cached: true
      });
    }

    const featuredProducts = await db
      .select()
      .from(products)
      .where(and(eq(products.featured, true), eq(products.inStock, true)))
      .orderBy(asc(products.sortOrder), desc(products.createdAt))
      .limit(8);

    // Cache for 15 minutes
    await cache.set(cacheKey, JSON.stringify(featuredProducts), { expirationTtl: 900 });

    return c.json({
      success: true,
      data: featuredProducts
    });

  } catch (error) {
    console.error('Error fetching featured products:', error);
    return c.json({
      success: false,
      error: 'Internal Server Error',
      message: 'Failed to fetch featured products'
    }, 500);
  }
});

// GET /api/products/categories - Get products grouped by category
app.get('/categories', async (c) => {
  try {
    const db = c.get('db');
    const cache = c.get('cache');
    
    const cacheKey = 'products:categories';
    
    // Try cache first
    const cached = await cache.get(cacheKey);
    if (cached) {
      return c.json({
        success: true,
        data: JSON.parse(cached),
        cached: true
      });
    }

    // Get products count by category
    const categoryStats = await db
      .select({
        category: products.category,
        count: count(),
        inStockCount: sql<number>`SUM(CASE WHEN ${products.inStock} = TRUE THEN 1 ELSE 0 END)`,
      })
      .from(products)
      .groupBy(products.category);

    // Get sample products for each category
    const categories = {};
    for (const stat of categoryStats) {
      const sampleProducts = await db
        .select()
        .from(products)
        .where(and(eq(products.category, stat.category), eq(products.inStock, true)))
        .orderBy(desc(products.featured), desc(products.createdAt))
        .limit(4);

      categories[stat.category] = {
        ...stat,
        sampleProducts
      };
    }

    // Cache for 30 minutes
    await cache.set(cacheKey, JSON.stringify(categories), { expirationTtl: 1800 });

    return c.json({
      success: true,
      data: categories
    });

  } catch (error) {
    console.error('Error fetching product categories:', error);
    return c.json({
      success: false,
      error: 'Internal Server Error',
      message: 'Failed to fetch product categories'
    }, 500);
  }
});

// GET /api/products/search - Advanced product search
app.get('/search', zValidator('query', z.object({
  q: z.string().min(1, 'Search query is required'),
  category: z.enum(['simmons-black', 'accessories', 'us-imports']).optional(),
  limit: z.string().optional(),
  offset: z.string().optional(),
})), async (c) => {
  try {
    const db = c.get('db');
    const query = c.req.valid('query');

    const searchTerm = `%${query.q}%`;
    const conditions = [
      or(
        like(products.name, searchTerm),
        like(products.description, searchTerm)
      )
    ];

    if (query.category) {
      conditions.push(eq(products.category, query.category));
    }

    const limit = parseInt(query.limit || '10');
    const offset = parseInt(query.offset || '0');

    const results = await db
      .select()
      .from(products)
      .where(and(...conditions))
      .orderBy(desc(products.featured), desc(products.createdAt))
      .limit(limit)
      .offset(offset);

    return c.json({
      success: true,
      data: {
        query: query.q,
        results,
        total: results.length
      }
    });

  } catch (error) {
    console.error('Error searching products:', error);
    return c.json({
      success: false,
      error: 'Internal Server Error',
      message: 'Failed to search products'
    }, 500);
  }
});

// GET /api/products/:identifier - Get single product by ID or slug
app.get('/:identifier', async (c) => {
  try {
    const db = c.get('db');
    const identifier = c.req.param('identifier');

    // Try to find by ID first, then by slug
    let product = await db
      .select()
      .from(products)
      .where(eq(products.id, identifier))
      .limit(1);

    if (product.length === 0) {
      product = await db
        .select()
        .from(products)
        .where(eq(products.slug, identifier))
        .limit(1);
    }

    if (product.length === 0) {
      return c.json({
        success: false,
        error: 'Not Found',
        message: 'Product not found'
      }, 404);
    }

    return c.json({
      success: true,
      data: product[0]
    });

  } catch (error) {
    console.error('Error fetching product:', error);
    return c.json({
      success: false,
      error: 'Internal Server Error',
      message: 'Failed to fetch product'
    }, 500);
  }
});

// POST /api/products - Create new product (Admin only)
app.post('/', requireAdmin, zValidator('json', createProductSchema), async (c) => {
  try {
    const db = c.get('db');
    const cache = c.get('cache');
    const productData = c.req.valid('json');

    // Check if slug already exists
    const [existingProduct] = await db
      .select({ id: products.id })
      .from(products)
      .where(eq(products.slug, productData.slug));

    if (existingProduct) {
      return c.json({
        success: false,
        error: 'Conflict',
        message: 'A product with this slug already exists'
      }, 409);
    }

    const productId = createId();
    const now = new Date();

    const [newProduct] = await db
      .insert(products)
      .values({
        id: productId,
        name: productData.name,
        slug: productData.slug,
        description: productData.description,
        category: productData.category,
        images: productData.images,
        variants: productData.variants,
        features: productData.features,
        specifications: productData.specifications,
        inStock: productData.inStock,
        featured: productData.featured,
        sortOrder: productData.sortOrder,
        seoTitle: productData.seoTitle || null,
        seoDescription: productData.seoDescription || null,
        createdAt: now,
        updatedAt: now
      })
      .returning();

    // Clear relevant caches
    await cache.delete('products:featured');
    await cache.delete('products:categories');

    return c.json({
      success: true,
      data: newProduct,
      message: 'Product created successfully'
    }, 201);

  } catch (error) {
    console.error('Error creating product:', error);
    return c.json({
      success: false,
      error: 'Internal Server Error',
      message: 'Failed to create product'
    }, 500);
  }
});

// PUT /api/products/:id - Update product (Admin only)
app.put('/:id', requireAdmin, zValidator('json', updateProductSchema), async (c) => {
  try {
    const db = c.get('db');
    const cache = c.get('cache');
    const id = c.req.param('id');
    const updateData = c.req.valid('json');

    // Check if product exists
    const [existingProduct] = await db
      .select({ id: products.id, slug: products.slug })
      .from(products)
      .where(eq(products.id, id));

    if (!existingProduct) {
      return c.json({
        success: false,
        error: 'Not Found',
        message: 'Product not found'
      }, 404);
    }

    // Check if new slug conflicts with existing products (if slug is being updated)
    if (updateData.slug && updateData.slug !== existingProduct.slug) {
      const [conflictingProduct] = await db
        .select({ id: products.id })
        .from(products)
        .where(eq(products.slug, updateData.slug));

      if (conflictingProduct) {
        return c.json({
          success: false,
          error: 'Conflict',
          message: 'A product with this slug already exists'
        }, 409);
      }
    }

    const [updatedProduct] = await db
      .update(products)
      .set({
        ...updateData,
        updatedAt: new Date()
      })
      .where(eq(products.id, id))
      .returning();

    // Clear relevant caches
    await cache.delete('products:featured');
    await cache.delete('products:categories');

    return c.json({
      success: true,
      data: updatedProduct,
      message: 'Product updated successfully'
    });

  } catch (error) {
    console.error('Error updating product:', error);
    return c.json({
      success: false,
      error: 'Internal Server Error',
      message: 'Failed to update product'
    }, 500);
  }
});

// DELETE /api/products/:id - Delete product (Admin only)
app.delete('/:id', requireAdmin, async (c) => {
  try {
    const db = c.get('db');
    const cache = c.get('cache');
    const id = c.req.param('id');

    // Check if product exists
    const [existingProduct] = await db
      .select({ id: products.id })
      .from(products)
      .where(eq(products.id, id));

    if (!existingProduct) {
      return c.json({
        success: false,
        error: 'Not Found',
        message: 'Product not found'
      }, 404);
    }

    await db
      .delete(products)
      .where(eq(products.id, id));

    // Clear relevant caches
    await cache.delete('products:featured');
    await cache.delete('products:categories');

    return c.json({
      success: true,
      message: 'Product deleted successfully'
    });

  } catch (error) {
    console.error('Error deleting product:', error);
    return c.json({
      success: false,
      error: 'Internal Server Error',
      message: 'Failed to delete product'
    }, 500);
  }
});

export default app;
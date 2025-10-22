import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';
import { eq, desc, asc, and, or, like, count, sql } from 'drizzle-orm';
import { products, productCategories } from '@blackliving/db';
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
  slug: z
    .string()
    .min(1, 'Product slug is required')
    .regex(/^[a-z0-9-]+$/, 'Slug must contain only lowercase letters, numbers, and hyphens'),
  description: z.string().min(10, 'Description must be at least 10 characters'),
  category: z
    .string()
    .min(1, 'Category is required')
    .regex(/^[a-z0-9-]+$/, 'Category must be a lowercase slug'),
  images: z.array(z.string().url()).default([]),
  variants: z
    .array(
      z.object({
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
      })
    )
    .min(1, 'At least one variant is required'),
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
  category: z
    .string()
    .regex(/^[a-z0-9-]+$/, 'Category must be a lowercase slug')
    .optional(),
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
    return c.json(
      {
        success: false,
        error: 'Unauthorized',
        message: 'Admin access required',
      },
      403
    );
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
        cached: true,
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
      conditions.push(or(like(products.name, searchTerm), like(products.description, searchTerm)));
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
        hasMore: offset + result.length < totalResult.count,
      },
    };

    // Cache the result for 10 minutes
    await cache.set(cacheKey, JSON.stringify(responseData), { expirationTtl: 600 });

    return c.json({
      success: true,
      data: responseData,
    });
  } catch (error) {
    console.error('Error fetching products:', error);
    return c.json(
      {
        success: false,
        error: 'Internal Server Error',
        message: 'Failed to fetch products',
      },
      500
    );
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
        cached: true,
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
      data: featuredProducts,
    });
  } catch (error) {
    console.error('Error fetching featured products:', error);
    return c.json(
      {
        success: false,
        error: 'Internal Server Error',
        message: 'Failed to fetch featured products',
      },
      500
    );
  }
});

// GET /api/products/categories - Fetch product categories with stats
app.get('/categories', async (c) => {
  try {
    const db = c.get('db');
    const cache = c.get('cache');

    const cacheKey = 'products:categories';

    const cached = await cache.get(cacheKey);
    if (cached) {
      return c.json({
        success: true,
        data: JSON.parse(cached),
        cached: true,
      });
    }

    const categories = await db
      .select()
      .from(productCategories)
      .where(eq(productCategories.isActive, true))
      .orderBy(asc(productCategories.sortOrder), asc(productCategories.title));

    const stats = await db
      .select({
        category: products.category,
        productCount: count(),
        inStockCount: sql<number>`SUM(CASE WHEN ${products.inStock} = TRUE THEN 1 ELSE 0 END)`,
      })
      .from(products)
      .groupBy(products.category);

    const statsMap = new Map(stats.map((entry) => [entry.category, entry]));

    const enrichedCategories = await Promise.all(
      categories.map(async (category) => {
        const stat = statsMap.get(category.slug) ?? { productCount: 0, inStockCount: 0 };

        const sampleProducts = await db
          .select()
          .from(products)
          .where(and(eq(products.category, category.slug), eq(products.inStock, true)))
          .orderBy(desc(products.featured), desc(products.createdAt))
          .limit(4);

        return {
          category,
          stats: {
            productCount: Number(stat.productCount ?? 0),
            inStockCount: Number(stat.inStockCount ?? 0),
          },
          sampleProducts,
        };
      })
    );

    const payload = { categories: enrichedCategories };

    await cache.set(cacheKey, JSON.stringify(payload), { expirationTtl: 1800 });

    return c.json({
      success: true,
      data: payload,
    });
  } catch (error) {
    console.error('Error fetching product categories:', error);
    return c.json(
      {
        success: false,
        error: 'Internal Server Error',
        message: 'Failed to fetch product categories',
      },
      500
    );
  }
});

// GET /api/products/categories/:slug - Fetch single product category
app.get('/categories/:slug', async (c) => {
  try {
    const db = c.get('db');
    const cache = c.get('cache');
    const slug = c.req.param('slug');

    const cacheKey = `products:category:${slug}`;

    const cached = await cache.get(cacheKey);
    if (cached) {
      return c.json({
        success: true,
        data: JSON.parse(cached),
        cached: true,
      });
    }

    const [category] = await db
      .select()
      .from(productCategories)
      .where(eq(productCategories.slug, slug))
      .limit(1);

    if (!category || !category.isActive) {
      return c.json(
        {
          success: false,
          error: 'Not Found',
          message: 'Category not found',
        },
        404
      );
    }

    const [stat] = await db
      .select({
        productCount: count(),
        inStockCount: sql<number>`SUM(CASE WHEN ${products.inStock} = TRUE THEN 1 ELSE 0 END)`,
      })
      .from(products)
      .where(eq(products.category, slug));

    const sampleProducts = await db
      .select()
      .from(products)
      .where(and(eq(products.category, slug), eq(products.inStock, true)))
      .orderBy(desc(products.featured), desc(products.createdAt))
      .limit(4);

    const payload = {
      category,
      stats: {
        productCount: Number(stat?.productCount ?? 0),
        inStockCount: Number(stat?.inStockCount ?? 0),
      },
      sampleProducts,
    };

    await cache.set(cacheKey, JSON.stringify(payload), { expirationTtl: 1800 });

    return c.json({
      success: true,
      data: payload,
    });
  } catch (error) {
    console.error('Error fetching product category:', error);
    return c.json(
      {
        success: false,
        error: 'Internal Server Error',
        message: 'Failed to fetch product category',
      },
      500
    );
  }
});

// GET /api/products/search - Advanced product search
app.get(
  '/search',
  zValidator(
    'query',
    z.object({
      q: z.string().min(1, 'Search query is required'),
      category: z
        .string()
        .regex(/^[a-z0-9-]+$/)
        .optional(),
      limit: z.string().optional(),
      offset: z.string().optional(),
    })
  ),
  async (c) => {
    try {
      const db = c.get('db');
      const query = c.req.valid('query');

      const searchTerm = `%${query.q}%`;
      const conditions = [
        or(like(products.name, searchTerm), like(products.description, searchTerm)),
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
          total: results.length,
        },
      });
    } catch (error) {
      console.error('Error searching products:', error);
      return c.json(
        {
          success: false,
          error: 'Internal Server Error',
          message: 'Failed to search products',
        },
        500
      );
    }
  }
);

// GET /api/products/:identifier - Get single product by ID or slug
app.get('/:identifier', async (c) => {
  try {
    const db = c.get('db');
    const identifier = c.req.param('identifier');

    // Try to find by ID first, then by slug
    let product = await db.select().from(products).where(eq(products.id, identifier)).limit(1);

    if (product.length === 0) {
      product = await db.select().from(products).where(eq(products.slug, identifier)).limit(1);
    }

    if (product.length === 0) {
      return c.json(
        {
          success: false,
          error: 'Not Found',
          message: 'Product not found',
        },
        404
      );
    }

    return c.json({
      success: true,
      data: product[0],
    });
  } catch (error) {
    console.error('Error fetching product:', error);
    return c.json(
      {
        success: false,
        error: 'Internal Server Error',
        message: 'Failed to fetch product',
      },
      500
    );
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
      return c.json(
        {
          success: false,
          error: 'Conflict',
          message: 'A product with this slug already exists',
        },
        409
      );
    }

    // Ensure category exists
    const [resolvedCategory] = await db
      .select({ id: productCategories.id })
      .from(productCategories)
      .where(and(eq(productCategories.slug, productData.category), eq(productCategories.isActive, true)));

    if (!resolvedCategory) {
      return c.json(
        {
          success: false,
          error: 'Invalid Category',
          message: 'Specified category does not exist or is inactive',
        },
        400
      );
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
        updatedAt: now,
      })
      .returning();

    // Clear relevant caches so new product appears immediately everywhere
    await cache.delete('products:featured');
    await cache.delete('products:categories');
    await cache.deleteByPrefix('products:category:');
    await cache.deleteByPrefix('products:list:');
    await cache.deleteByPrefix('products:detail:');

    return c.json(
      {
        success: true,
        data: newProduct,
        message: 'Product created successfully',
      },
      201
    );
  } catch (error) {
    console.error('Error creating product:', error);
    return c.json(
      {
        success: false,
        error: 'Internal Server Error',
        message: 'Failed to create product',
      },
      500
    );
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
      return c.json(
        {
          success: false,
          error: 'Not Found',
          message: 'Product not found',
        },
        404
      );
    }

    // Check if new slug conflicts with existing products (if slug is being updated)
    if (updateData.slug && updateData.slug !== existingProduct.slug) {
      const [conflictingProduct] = await db
        .select({ id: products.id })
        .from(products)
        .where(eq(products.slug, updateData.slug));

      if (conflictingProduct) {
        return c.json(
          {
            success: false,
            error: 'Conflict',
            message: 'A product with this slug already exists',
          },
          409
        );
      }
    }

    if (updateData.category) {
      const [resolvedCategory] = await db
        .select({ id: productCategories.id })
        .from(productCategories)
        .where(and(eq(productCategories.slug, updateData.category), eq(productCategories.isActive, true)));

      if (!resolvedCategory) {
        return c.json(
          {
            success: false,
            error: 'Invalid Category',
            message: 'Specified category does not exist or is inactive',
          },
          400
        );
      }
    }

    const [updatedProduct] = await db
      .update(products)
      .set({
        ...updateData,
        updatedAt: new Date(),
      })
      .where(eq(products.id, id))
      .returning();

    // Clear relevant caches so updated data is reflected immediately
    await cache.delete('products:featured');
    await cache.delete('products:categories');
    await cache.deleteByPrefix('products:category:');
    await cache.deleteByPrefix('products:list:');
    await cache.deleteByPrefix('products:detail:');

    return c.json({
      success: true,
      data: updatedProduct,
      message: 'Product updated successfully',
    });
  } catch (error) {
    console.error('Error updating product:', error);
    return c.json(
      {
        success: false,
        error: 'Internal Server Error',
        message: 'Failed to update product',
      },
      500
    );
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
      return c.json(
        {
          success: false,
          error: 'Not Found',
          message: 'Product not found',
        },
        404
      );
    }

    await db.delete(products).where(eq(products.id, id));

    // Clear relevant caches so removed product disappears everywhere
    await cache.delete('products:featured');
    await cache.delete('products:categories');
    await cache.deleteByPrefix('products:category:');
    await cache.deleteByPrefix('products:list:');
    await cache.deleteByPrefix('products:detail:');

    return c.json({
      success: true,
      message: 'Product deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting product:', error);
    return c.json(
      {
        success: false,
        error: 'Internal Server Error',
        message: 'Failed to delete product',
      },
      500
    );
  }
});

export default app;

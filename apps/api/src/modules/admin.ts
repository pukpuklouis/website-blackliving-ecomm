import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';
import { eq, desc, asc, and, like, count, sql } from 'drizzle-orm';
import { requireAdmin, auditLog, requireFreshSession } from '../middleware/auth';
import { products, posts, orders, appointments, reviews, productCategories } from '@blackliving/db';
import type {
  CreateProductRequest,
  UpdateProductRequest,
  CreatePostRequest,
  UpdatePostRequest,
  UpdateOrderRequest,
  UpdateAppointmentRequest,
  DashboardStats,
  SalesAnalytics,
  ProductCategory,
} from '@blackliving/types';
import { CacheTTL } from '../lib/cache';
import { FileTypes, FileSizes, StorageManager } from '../lib/storage';
import { createId } from '@paralleldrive/cuid2';

const admin = new Hono();

const categorySlugSchema = z.string().regex(/^[a-z0-9-]+$/);

const productCategoryBodySchema = z.object({
  slug: categorySlugSchema,
  title: z.string().min(1),
  description: z.string().min(1),
  series: z.string().min(1),
  brand: z.string().min(1),
  features: z.array(z.string()).default([]),
  seoKeywords: z.string().optional().default(''),
  urlPath: z.string().optional().default(''),
  isActive: z.boolean().optional().default(true),
  sortOrder: z.number().int().min(0).optional().default(0),
});

const productCategoryUpdateSchema = z.object({
  slug: categorySlugSchema.optional(),
  title: z.string().min(1).optional(),
  description: z.string().min(1).optional(),
  series: z.string().min(1).optional(),
  brand: z.string().min(1).optional(),
  features: z.array(z.string()).optional(),
  seoKeywords: z.string().optional(),
  urlPath: z.string().optional(),
  isActive: z.boolean().optional(),
  sortOrder: z.number().int().optional(),
});

// Apply comprehensive admin authentication to all routes
admin.use('*', requireAdmin());
admin.use('*', auditLog('admin-access'));

// Dashboard Analytics
admin.get('/dashboard/stats', async (c) => {
  const db = c.get('db');
  const cache = c.get('cache');

  try {
    const stats = await cache.getOrSet(
      'admin:dashboard:stats',
      async (): Promise<DashboardStats> => {
        // Get total orders count
        const [totalOrdersResult] = await db.select({ count: count() }).from(orders);
        const totalOrders = totalOrdersResult.count;

        // Get total revenue
        const [totalRevenueResult] = await db
          .select({
            total: sql<number>`sum(${orders.totalAmount})`,
          })
          .from(orders)
          .where(eq(orders.status, 'delivered'));
        const totalRevenue = totalRevenueResult.total || 0;

        // Get pending appointments count
        const [pendingAppointmentsResult] = await db
          .select({ count: count() })
          .from(appointments)
          .where(eq(appointments.status, 'pending'));
        const pendingAppointments = pendingAppointmentsResult.count;

        // Get published posts count
        const [publishedPostsResult] = await db
          .select({ count: count() })
          .from(posts)
          .where(eq(posts.status, 'published'));
        const publishedPosts = publishedPostsResult.count;

        // Get recent orders
        const recentOrders = await db
          .select({
            id: orders.id,
            customerInfo: orders.customerInfo,
            totalAmount: orders.totalAmount,
            status: orders.status,
            createdAt: orders.createdAt,
          })
          .from(orders)
          .orderBy(desc(orders.createdAt))
          .limit(5);

        // Get recent appointments
        const recentAppointments = await db
          .select({
            id: appointments.id,
            customerInfo: appointments.customerInfo,
            storeLocation: appointments.storeLocation,
            preferredDate: appointments.preferredDate,
            status: appointments.status,
            createdAt: appointments.createdAt,
          })
          .from(appointments)
          .orderBy(desc(appointments.createdAt))
          .limit(5);

        return {
          totalOrders,
          totalRevenue,
          pendingAppointments,
          publishedPosts,
          recentOrders: recentOrders.map((order) => ({
            ...order,
            createdAt: order.createdAt?.toISOString() || '',
          })),
          recentAppointments: recentAppointments.map((appointment) => ({
            ...appointment,
            createdAt: appointment.createdAt?.toISOString() || '',
          })),
        };
      },
      CacheTTL.SHORT
    );

    return c.json({ success: true, data: stats });
  } catch (error) {
    console.error('Dashboard stats error:', error);
    return c.json({ success: false, error: 'Failed to fetch dashboard stats' }, 500);
  }
});

admin.get('/products/categories', async (c) => {
  const db = c.get('db');

  try {
    const categories = await db
      .select()
      .from(productCategories)
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

    const payload = categories.map((category) =>
      normalizeCategoryRecord(
        category,
        statsMap.get(category.slug) ?? { productCount: 0, inStockCount: 0 }
      )
    );

    return c.json({ success: true, data: payload });
  } catch (error) {
    console.error('Fetch product categories error:', error);
    return c.json({ success: false, error: 'Failed to fetch product categories' }, 500);
  }
});

admin.post(
  '/products/categories',
  requireFreshSession(15),
  auditLog('product-category-create'),
  zValidator('json', productCategoryBodySchema),
  async (c) => {
    const db = c.get('db');
    const cache = c.get('cache');
    const body = c.req.valid('json');

    try {
      const slug = body.slug.trim();

      const [existing] = await db
        .select({ id: productCategories.id })
        .from(productCategories)
        .where(eq(productCategories.slug, slug))
        .limit(1);

      if (existing) {
        return c.json(
          {
            success: false,
            error: 'Category already exists',
            message: '分類 slug 已存在，請使用其他名稱',
          },
          409
        );
      }

      const now = new Date();
      const features = parseCategoryFeaturesInput(body.features);

      const [inserted] = await db
        .insert(productCategories)
        .values({
          id: createId(),
          slug,
          title: body.title.trim(),
          description: body.description.trim(),
          series: body.series.trim(),
          brand: body.brand.trim(),
          features,
          seoKeywords: body.seoKeywords?.trim() ? body.seoKeywords.trim() : null,
          urlPath: normalizeCategoryUrlPath(body.urlPath, slug),
          isActive: body.isActive ?? true,
          sortOrder: body.sortOrder ?? 0,
          createdAt: now,
          updatedAt: now,
        })
        .returning();

      await cache.delete('products:categories');
      await cache.deleteByPrefix('products:category:');
      await cache.deleteByPrefix('products:list:');
      await cache.deleteByPrefix('admin:products');

      return c.json(
        {
          success: true,
          data: normalizeCategoryRecord(inserted, { productCount: 0, inStockCount: 0 }),
        },
        201
      );
    } catch (error) {
      console.error('Create product category error:', error);
      return c.json({ success: false, error: 'Failed to create product category' }, 500);
    }
  }
);

admin.put(
  '/products/categories/:slug',
  requireFreshSession(15),
  auditLog('product-category-update'),
  zValidator('json', productCategoryUpdateSchema),
  async (c) => {
    const db = c.get('db');
    const cache = c.get('cache');
    const slugParam = c.req.param('slug');
    const body = c.req.valid('json');

    if (!body || Object.keys(body).length === 0) {
      return c.json(
        {
          success: false,
          error: 'No fields provided',
          message: '請提供至少一個需要更新的欄位',
        },
        400
      );
    }

    try {
      const [existing] = await db
        .select()
        .from(productCategories)
        .where(eq(productCategories.slug, slugParam))
        .limit(1);

      if (!existing) {
        return c.json({ success: false, error: 'Category not found' }, 404);
      }

      const now = new Date();
      const nextSlug = body.slug ? body.slug.trim() : slugParam;

      if (nextSlug !== slugParam) {
        const [conflict] = await db
          .select({ id: productCategories.id })
          .from(productCategories)
          .where(eq(productCategories.slug, nextSlug))
          .limit(1);

        if (conflict) {
          return c.json(
            {
              success: false,
              error: 'Category already exists',
              message: '新的分類 slug 已存在，請使用其他名稱',
            },
            409
          );
        }
      }

      const updateValues: Partial<typeof productCategories.$inferInsert> = {
        updatedAt: now,
      };

      if (body.title !== undefined) {
        updateValues.title = body.title.trim();
      }
      if (body.description !== undefined) {
        updateValues.description = body.description.trim();
      }
      if (body.series !== undefined) {
        updateValues.series = body.series.trim();
      }
      if (body.brand !== undefined) {
        updateValues.brand = body.brand.trim();
      }
      if (body.features !== undefined) {
        updateValues.features = parseCategoryFeaturesInput(body.features);
      }
      if (body.seoKeywords !== undefined) {
        const trimmed = body.seoKeywords.trim();
        updateValues.seoKeywords = trimmed.length > 0 ? trimmed : null;
      }
      if (body.urlPath !== undefined) {
        updateValues.urlPath = normalizeCategoryUrlPath(body.urlPath, nextSlug);
      }
      if (body.isActive !== undefined) {
        updateValues.isActive = body.isActive;
      }
      if (body.sortOrder !== undefined) {
        updateValues.sortOrder = body.sortOrder ?? 0;
      }
      if (nextSlug !== slugParam) {
        updateValues.slug = nextSlug;
      }

      const [updatedCategory] = await db
        .update(productCategories)
        .set(updateValues)
        .where(eq(productCategories.slug, slugParam))
        .returning();

      if (!updatedCategory) {
        return c.json({ success: false, error: 'Failed to update category' }, 500);
      }

      if (nextSlug !== slugParam) {
        await db
          .update(products)
          .set({ category: nextSlug })
          .where(eq(products.category, slugParam));
      }

      const [stats] = await db
        .select({
          productCount: count(),
          inStockCount: sql<number>`SUM(CASE WHEN ${products.inStock} = TRUE THEN 1 ELSE 0 END)`,
        })
        .from(products)
        .where(eq(products.category, nextSlug));

      await cache.delete('products:categories');
      await cache.deleteByPrefix('products:category:');
      await cache.deleteByPrefix('products:list:');
      await cache.deleteByPrefix('admin:products');

      return c.json({
        success: true,
        data: normalizeCategoryRecord(updatedCategory, stats),
      });
    } catch (error) {
      console.error('Update product category error:', error);
      return c.json({ success: false, error: 'Failed to update product category' }, 500);
    }
  }
);

admin.delete(
  '/products/categories/:slug',
  requireFreshSession(15),
  auditLog('product-category-delete'),
  async (c) => {
    const db = c.get('db');
    const cache = c.get('cache');
    const slug = c.req.param('slug');

    try {
      const [category] = await db
        .select()
        .from(productCategories)
        .where(eq(productCategories.slug, slug))
        .limit(1);

      if (!category) {
        return c.json({ success: false, error: 'Category not found' }, 404);
      }

      const [usage] = await db
        .select({ count: count() })
        .from(products)
        .where(eq(products.category, slug));

      if ((usage?.count ?? 0) > 0) {
        return c.json(
          {
            success: false,
            error: 'Category in use',
            message: '無法刪除仍有產品使用的分類',
          },
          409
        );
      }

      await db.delete(productCategories).where(eq(productCategories.slug, slug));

      await cache.delete('products:categories');
      await cache.deleteByPrefix('products:category:');
      await cache.deleteByPrefix('products:list:');
      await cache.deleteByPrefix('admin:products');

      return c.json({ success: true, message: 'Category deleted successfully' });
    } catch (error) {
      console.error('Delete product category error:', error);
      return c.json({ success: false, error: 'Failed to delete product category' }, 500);
    }
  }
);

// Product Management APIs
admin.get(
  '/products',
  zValidator(
    'query',
    z.object({
      page: z.string().optional().default('1'),
      limit: z.string().optional().default('20'),
      category: z.string().optional(),
      search: z.string().optional(),
      featured: z.string().optional(),
    })
  ),
  async (c) => {
    const db = c.get('db');
    const cache = c.get('cache');
    const { page, limit, category, search, featured } = c.req.valid('query');

    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const offset = (pageNum - 1) * limitNum;

    try {
      const cacheKey = `admin:products:${page}:${limit}:${category || 'all'}:${search || 'none'}:${featured || 'all'}`;

      const result = await cache.getOrSet(
        cacheKey,
        async () => {
          let query = db.select().from(products);
          let countQuery = db.select({ count: count() }).from(products);

          // Apply filters
          const conditions = [];
          if (category) {
            conditions.push(eq(products.category, category));
          }
          if (search) {
            conditions.push(like(products.name, `%${search}%`));
          }
          if (featured === 'true') {
            conditions.push(eq(products.featured, true));
          }

          if (conditions.length > 0) {
            const whereClause = conditions.length === 1 ? conditions[0] : and(...conditions);
            query = query.where(whereClause);
            countQuery = countQuery.where(whereClause);
          }

          const [productList, totalResult] = await Promise.all([
            query.orderBy(desc(products.updatedAt)).limit(limitNum).offset(offset),
            countQuery,
          ]);

          const total = totalResult[0].count;
          const totalPages = Math.ceil(total / limitNum);

          return {
            products: productList,
            pagination: {
              page: pageNum,
              limit: limitNum,
              total,
              totalPages,
            },
          };
        },
        CacheTTL.SHORT
      );

      return c.json({ success: true, data: result.products, pagination: result.pagination });
    } catch (error) {
      console.error('Get products error:', error);
      return c.json({ success: false, error: 'Failed to fetch products' }, 500);
    }
  }
);

admin.post(
  '/products',
  zValidator(
    'json',
    z.object({
      name: z.string().min(1),
      slug: z.string().min(1),
      description: z.string().min(1),
      category: categorySlugSchema,
      images: z.array(z.string()).default([]),
      variants: z.array(z.any()).default([]),
      features: z.array(z.string()).default([]),
      specifications: z.record(z.any()).default({}),
      inStock: z.boolean().default(true),
      featured: z.boolean().default(false),
      sortOrder: z.number().default(0),
      seoTitle: z.string().optional(),
      seoDescription: z.string().optional(),
    })
  ),
  async (c) => {
    const db = c.get('db');
    const cache = c.get('cache');
    const productData = c.req.valid('json');

    try {
      const [newProduct] = await db.insert(products).values(productData).returning();

      // Invalidate cache
      await cache.deleteByPrefix('admin:products');
      await cache.deleteByPrefix('products');

      return c.json({ success: true, data: newProduct }, 201);
    } catch (error) {
      console.error('Create product error:', error);
      return c.json({ success: false, error: 'Failed to create product' }, 500);
    }
  }
);

admin.put(
  '/products/:id',
  zValidator(
    'json',
    z.object({
      name: z.string().optional(),
      slug: z.string().optional(),
      description: z.string().optional(),
      category: categorySlugSchema.optional(),
      images: z.array(z.string()).optional(),
      variants: z.array(z.any()).optional(),
      features: z.array(z.string()).optional(),
      specifications: z.record(z.any()).optional(),
      inStock: z.boolean().optional(),
      featured: z.boolean().optional(),
      sortOrder: z.number().optional(),
      seoTitle: z.string().optional(),
      seoDescription: z.string().optional(),
    })
  ),
  async (c) => {
    const db = c.get('db');
    const cache = c.get('cache');
    const productId = c.req.param('id');
    const updateData = c.req.valid('json');

    try {
      const [updatedProduct] = await db
        .update(products)
        .set({ ...updateData, updatedAt: new Date() })
        .where(eq(products.id, productId))
        .returning();

      if (!updatedProduct) {
        return c.json({ success: false, error: 'Product not found' }, 404);
      }

      // Invalidate cache
      await cache.deleteByPrefix('admin:products');
      await cache.deleteByPrefix('products');
      await cache.delete(`products:detail:${productId}`);

      return c.json({ success: true, data: updatedProduct });
    } catch (error) {
      console.error('Update product error:', error);
      return c.json({ success: false, error: 'Failed to update product' }, 500);
    }
  }
);

// Sensitive operations require fresh session
admin.delete('/products/:id', requireFreshSession(15), auditLog('product-delete'), async (c) => {
  const db = c.get('db');
  const cache = c.get('cache');
  const storage = c.get('storage');
  const productId = c.req.param('id');

  try {
    // Get product to delete associated images
    const [product] = await db.select().from(products).where(eq(products.id, productId));

    if (!product) {
      return c.json({ success: false, error: 'Product not found' }, 404);
    }

    // Delete product images from R2
    if (product.images && Array.isArray(product.images)) {
      const imageKeys = product.images.map((url: string) => storage.getKeyFromUrl(url));
      await storage.deleteFiles(imageKeys);
    }

    // Delete product from database
    await db.delete(products).where(eq(products.id, productId));

    // Invalidate cache
    await cache.deleteByPrefix('admin:products');
    await cache.deleteByPrefix('products');
    await cache.delete(`products:detail:${productId}`);

    return c.json({ success: true, message: 'Product deleted successfully' });
  } catch (error) {
    console.error('Delete product error:', error);
    return c.json({ success: false, error: 'Failed to delete product' }, 500);
  }
});

// File Upload API
admin.post('/upload', async (c) => {
  const storage = c.get('storage');

  try {
    const formData = await c.req.formData();
    const files = formData.getAll('files') as File[];
    const folder = (formData.get('folder') as string) || 'uploads';

    if (!files || files.length === 0) {
      return c.json({ success: false, error: 'No files provided' }, 400);
    }

    const uploadPromises = files.map(async (file) => {
      // Validate file
      const validation = StorageManager.validateFile(file, FileTypes.IMAGES, FileSizes.MEDIUM);
      if (!validation.valid) {
        throw new Error(validation.error);
      }

      // Generate unique key
      const key = StorageManager.generateFileKey(file.name, folder);

      // Upload file
      return storage.uploadFile(key, file, {
        contentType: file.type,
        metadata: {
          originalName: file.name,
          uploadedBy: c.get('user')?.id || 'unknown',
          uploadedAt: new Date().toISOString(),
        },
      });
    });

    const uploadResults = await Promise.all(uploadPromises);

    return c.json({
      success: true,
      data: uploadResults,
      message: `${uploadResults.length} file(s) uploaded successfully`,
    });
  } catch (error) {
    console.error('File upload error:', error);
    return c.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to upload files',
      },
      500
    );
  }
});

const mediaLibraryQuerySchema = z.object({
  prefix: z.string().optional(),
  cursor: z.string().optional(),
  limit: z.string().optional(),
  search: z.string().optional(),
  type: z.enum(['all', 'images', 'files']).optional().default('all'),
  sort: z.enum(['recent', 'name']).optional().default('recent'),
});

admin.get('/media/library', zValidator('query', mediaLibraryQuerySchema), async (c) => {
  try {
    const storage = c.get('storage');
    const { prefix, cursor, limit, search, type, sort } = c.req.valid('query');

    const parsedLimit = clampLimit(limit);
    const searchTerm = search?.trim().toLowerCase() ?? '';

    const listResult = await storage.listFiles({
      prefix,
      cursor: cursor || undefined,
      limit: parsedLimit,
    });

    const items = listResult.items
      .map((item) => {
        const normalizedKey = stripDeliveryPrefix(item.key);
        const name = normalizedKey.split('/').pop() ?? normalizedKey;
        const contentType = item.contentType ?? inferMimeFromKey(name);
        const isImage = determineIsImage(contentType, normalizedKey);

        return {
          key: normalizedKey,
          name,
          url: storage.getFileUrl(normalizedKey),
          size: item.size,
          contentType,
          lastModified: item.lastModified.toISOString(),
          metadata: item.metadata ?? undefined,
          isImage,
        };
      })
      .filter((asset) => {
        if (!searchTerm) return true;
        return (
          asset.name.toLowerCase().includes(searchTerm) ||
          asset.key.toLowerCase().includes(searchTerm)
        );
      })
      .filter((asset) => {
        if (type === 'images') return asset.isImage;
        if (type === 'files') return !asset.isImage;
        return true;
      });

    const sorted = items.sort((a, b) => {
      if (sort === 'name') {
        return a.name.localeCompare(b.name, 'zh-Hant');
      }
      return new Date(b.lastModified).getTime() - new Date(a.lastModified).getTime();
    });

    const nextCursor = listResult.truncated ? (listResult.cursor ?? null) : null;

    return c.json({
      success: true,
      data: {
        items: sorted,
        pageInfo: {
          nextCursor,
          hasMore: listResult.truncated,
        },
      },
    });
  } catch (error) {
    console.error('Media library fetch error:', error);
    return c.json(
      {
        success: false,
        error: 'Failed to load media library',
      },
      500
    );
  }
});

function clampLimit(value?: string): number {
  const parsed = Number.parseInt(value ?? '30', 10);
  if (Number.isNaN(parsed)) return 30;
  return Math.max(1, Math.min(parsed, 100));
}

function stripDeliveryPrefix(key: string): string {
  return key.startsWith('media/') ? key.slice('media/'.length) : key;
}

function determineIsImage(contentType?: string, key?: string): boolean {
  if (contentType && contentType.startsWith('image/')) {
    return true;
  }

  const extension = key?.split('.').pop()?.toLowerCase();
  if (!extension) return false;

  return ['jpg', 'jpeg', 'png', 'webp', 'gif', 'bmp', 'svg', 'avif', 'heic', 'heif'].includes(
    extension
  );
}

function inferMimeFromKey(key: string): string | undefined {
  const extension = key.split('.').pop()?.toLowerCase();
  if (!extension) return undefined;

  const imageMap: Record<string, string> = {
    jpg: 'image/jpeg',
    jpeg: 'image/jpeg',
    png: 'image/png',
    webp: 'image/webp',
    gif: 'image/gif',
    bmp: 'image/bmp',
    svg: 'image/svg+xml',
    avif: 'image/avif',
    heic: 'image/heic',
    heif: 'image/heif',
  };

  if (imageMap[extension]) {
    return imageMap[extension];
  }

  const documentMap: Record<string, string> = {
    pdf: 'application/pdf',
    txt: 'text/plain',
    doc: 'application/msword',
    docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    xls: 'application/vnd.ms-excel',
    xlsx: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    csv: 'text/csv',
    zip: 'application/zip',
  };

  return documentMap[extension];
}

// Blog Post Management
admin.get(
  '/posts',
  zValidator(
    'query',
    z.object({
      page: z.string().optional().default('1'),
      limit: z.string().optional().default('20'),
      status: z.string().optional(),
      search: z.string().optional(),
    })
  ),
  async (c) => {
    const db = c.get('db');
    const cache = c.get('cache');
    const { page, limit, status, search } = c.req.valid('query');

    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const offset = (pageNum - 1) * limitNum;

    try {
      const cacheKey = `admin:posts:${page}:${limit}:${status || 'all'}:${search || 'none'}`;

      const result = await cache.getOrSet(
        cacheKey,
        async () => {
          let query = db.select().from(posts);
          let countQuery = db.select({ count: count() }).from(posts);

          const conditions = [];
          if (status) {
            conditions.push(eq(posts.status, status as any));
          }
          if (search) {
            conditions.push(like(posts.title, `%${search}%`));
          }

          if (conditions.length > 0) {
            const whereClause = conditions.length === 1 ? conditions[0] : and(...conditions);
            query = query.where(whereClause);
            countQuery = countQuery.where(whereClause);
          }

          const [postList, totalResult] = await Promise.all([
            query.orderBy(desc(posts.updatedAt)).limit(limitNum).offset(offset),
            countQuery,
          ]);

          const total = totalResult[0].count;
          const totalPages = Math.ceil(total / limitNum);

          return {
            posts: postList,
            pagination: {
              page: pageNum,
              limit: limitNum,
              total,
              totalPages,
            },
          };
        },
        CacheTTL.SHORT
      );

      return c.json({ success: true, data: result.posts, pagination: result.pagination });
    } catch (error) {
      console.error('Get posts error:', error);
      return c.json({ success: false, error: 'Failed to fetch posts' }, 500);
    }
  }
);

admin.post(
  '/posts',
  zValidator(
    'json',
    z.object({
      title: z.string().min(1),
      slug: z.string().min(1),
      description: z.string().min(1),
      content: z.string().min(1),
      status: z.enum(['draft', 'published', 'archived']).default('draft'),
      featured: z.boolean().default(false),
      tags: z.array(z.string()).default([]),
      featuredImage: z.string().optional(),
      seoTitle: z.string().optional(),
      seoDescription: z.string().optional(),
      publishedAt: z.string().optional(),
    })
  ),
  async (c) => {
    const db = c.get('db');
    const cache = c.get('cache');
    const user = c.get('user');
    const postData = c.req.valid('json');

    try {
      const newPostData = {
        ...postData,
        authorId: user.id,
        publishedAt: postData.publishedAt ? new Date(postData.publishedAt) : undefined,
      };

      const [newPost] = await db.insert(posts).values(newPostData).returning();

      // Invalidate cache
      await cache.deleteByPrefix('admin:posts');
      await cache.deleteByPrefix('posts');

      return c.json({ success: true, data: newPost }, 201);
    } catch (error) {
      console.error('Create post error:', error);
      return c.json({ success: false, error: 'Failed to create post' }, 500);
    }
  }
);

admin.put(
  '/posts/:id',
  zValidator(
    'json',
    z.object({
      title: z.string().optional(),
      slug: z.string().optional(),
      description: z.string().optional(),
      content: z.string().optional(),
      status: z.enum(['draft', 'published', 'archived']).optional(),
      featured: z.boolean().optional(),
      tags: z.array(z.string()).optional(),
      featuredImage: z.string().optional(),
      seoTitle: z.string().optional(),
      seoDescription: z.string().optional(),
      publishedAt: z.string().optional(),
    })
  ),
  async (c) => {
    const db = c.get('db');
    const cache = c.get('cache');
    const postId = c.req.param('id');
    const updateData = c.req.valid('json');

    try {
      const updatedData = {
        ...updateData,
        updatedAt: new Date(),
        publishedAt: updateData.publishedAt ? new Date(updateData.publishedAt) : undefined,
      };

      const [updatedPost] = await db
        .update(posts)
        .set(updatedData)
        .where(eq(posts.id, postId))
        .returning();

      if (!updatedPost) {
        return c.json({ success: false, error: 'Post not found' }, 404);
      }

      // Invalidate cache
      await cache.deleteByPrefix('admin:posts');
      await cache.deleteByPrefix('posts');
      await cache.delete(`posts:detail:${postId}`);

      return c.json({ success: true, data: updatedPost });
    } catch (error) {
      console.error('Update post error:', error);
      return c.json({ success: false, error: 'Failed to update post' }, 500);
    }
  }
);

admin.delete('/posts/:id', requireFreshSession(15), auditLog('post-delete'), async (c) => {
  const db = c.get('db');
  const cache = c.get('cache');
  const postId = c.req.param('id');

  try {
    const deletedPost = await db.delete(posts).where(eq(posts.id, postId)).returning();

    if (deletedPost.length === 0) {
      return c.json({ success: false, error: 'Post not found' }, 404);
    }

    // Invalidate cache
    await cache.deleteByPrefix('admin:posts');
    await cache.deleteByPrefix('posts');
    await cache.delete(`posts:detail:${postId}`);

    return c.json({ success: true, message: 'Post deleted successfully' });
  } catch (error) {
    console.error('Delete post error:', error);
    return c.json({ success: false, error: 'Failed to delete post' }, 500);
  }
});

export function parseCategoryFeaturesInput(features: unknown): string[] {
  if (Array.isArray(features)) {
    return features
      .map((feature) => (typeof feature === 'string' ? feature.trim() : String(feature ?? '').trim()))
      .filter((feature) => feature.length > 0);
  }

  if (typeof features === 'string') {
    try {
      const parsed = JSON.parse(features);
      if (Array.isArray(parsed)) {
        return parsed
          .map((feature) => (typeof feature === 'string' ? feature.trim() : String(feature ?? '').trim()))
          .filter((feature) => feature.length > 0);
      }
    } catch {
      // fall through to manual splitting
    }

    return features
      .split(/\r?\n|,/)
      .map((feature) => feature.trim())
      .filter((feature) => feature.length > 0);
  }

  return [];
}

export function normalizeCategoryUrlPath(
  urlPath: string | undefined | null,
  slug: string
): string {
  if (!urlPath) {
    return `/${slug}`;
  }
  const trimmed = urlPath.trim();
  if (!trimmed) {
    return `/${slug}`;
  }
  return trimmed.startsWith('/') ? trimmed : `/${trimmed}`;
}

export function toCategoryIsoString(value: unknown): string {
  if (value instanceof Date) {
    return value.toISOString();
  }
  if (typeof value === 'number') {
    return new Date(value).toISOString();
  }
  if (typeof value === 'string') {
    const trimmed = value.trim();
    if (!trimmed) {
      return new Date(0).toISOString();
    }
    const numeric = Number(trimmed);
    if (!Number.isNaN(numeric)) {
      return new Date(numeric).toISOString();
    }
    const parsed = Date.parse(trimmed);
    if (!Number.isNaN(parsed)) {
      return new Date(parsed).toISOString();
    }
    return trimmed;
  }
  return new Date().toISOString();
}

export function normalizeCategoryRecord(
  category: typeof productCategories.$inferSelect,
  stats?: { productCount?: number; inStockCount?: number }
): ProductCategory {
  const features = parseCategoryFeaturesInput(category.features);
  const productCount = Number(stats?.productCount ?? 0);
  const inStockCount = Number(stats?.inStockCount ?? 0);

  return {
    id: category.id,
    slug: category.slug,
    title: category.title,
    description: category.description,
    series: category.series,
    brand: category.brand,
    features,
    seoKeywords: category.seoKeywords ?? undefined,
    urlPath: normalizeCategoryUrlPath(category.urlPath, category.slug),
    isActive: Boolean(category.isActive),
    sortOrder: Number(category.sortOrder ?? 0),
    createdAt: toCategoryIsoString(category.createdAt),
    updatedAt: toCategoryIsoString(category.updatedAt),
    stats: {
      productCount,
      inStockCount,
    },
  };
}

export default admin;

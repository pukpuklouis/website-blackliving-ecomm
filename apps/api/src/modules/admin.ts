import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';
import { eq, desc, asc, and, like, count, sql } from 'drizzle-orm';
import { requireAdmin, auditLog, requireFreshSession } from '../middleware/auth';
import { products, posts, orders, appointments, reviews } from '@blackliving/db';
import type { 
  CreateProductRequest, 
  UpdateProductRequest,
  CreatePostRequest,
  UpdatePostRequest,
  UpdateOrderRequest,
  UpdateAppointmentRequest,
  DashboardStats,
  SalesAnalytics
} from '@blackliving/types';
import { CacheTTL } from '../lib/cache';
import { FileTypes, FileSizes, StorageManager } from '../lib/storage';

const admin = new Hono();

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
        const [totalRevenueResult] = await db.select({ 
          total: sql<number>`sum(${orders.totalAmount})`
        }).from(orders).where(eq(orders.status, 'delivered'));
        const totalRevenue = totalRevenueResult.total || 0;

        // Get pending appointments count
        const [pendingAppointmentsResult] = await db.select({ count: count() })
          .from(appointments)
          .where(eq(appointments.status, 'pending'));
        const pendingAppointments = pendingAppointmentsResult.count;

        // Get published posts count
        const [publishedPostsResult] = await db.select({ count: count() })
          .from(posts)
          .where(eq(posts.status, 'published'));
        const publishedPosts = publishedPostsResult.count;

        // Get recent orders
        const recentOrders = await db.select({
          id: orders.id,
          customerInfo: orders.customerInfo,
          totalAmount: orders.totalAmount,
          status: orders.status,
          createdAt: orders.createdAt,
        }).from(orders)
          .orderBy(desc(orders.createdAt))
          .limit(5);

        // Get recent appointments
        const recentAppointments = await db.select({
          id: appointments.id,
          customerInfo: appointments.customerInfo,
          storeLocation: appointments.storeLocation,
          preferredDate: appointments.preferredDate,
          status: appointments.status,
          createdAt: appointments.createdAt,
        }).from(appointments)
          .orderBy(desc(appointments.createdAt))
          .limit(5);

        return {
          totalOrders,
          totalRevenue,
          pendingAppointments,
          publishedPosts,
          recentOrders: recentOrders.map(order => ({
            ...order,
            createdAt: order.createdAt?.toISOString() || '',
          })),
          recentAppointments: recentAppointments.map(appointment => ({
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

// Product Management APIs
admin.get('/products', zValidator('query', z.object({
  page: z.string().optional().default('1'),
  limit: z.string().optional().default('20'),
  category: z.string().optional(),
  search: z.string().optional(),
  featured: z.string().optional(),
})), async (c) => {
  const db = c.get('db');
  const cache = c.get('cache');
  const { page, limit, category, search, featured } = c.req.valid('query');

  const pageNum = parseInt(page);
  const limitNum = parseInt(limit);
  const offset = (pageNum - 1) * limitNum;

  try {
    const cacheKey = `admin:products:${page}:${limit}:${category || 'all'}:${search || 'none'}:${featured || 'all'}`;
    
    const result = await cache.getOrSet(cacheKey, async () => {
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
        query.orderBy(desc(products.updatedAt))
             .limit(limitNum)
             .offset(offset),
        countQuery
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
        }
      };
    }, CacheTTL.SHORT);

    return c.json({ success: true, data: result.products, pagination: result.pagination });
  } catch (error) {
    console.error('Get products error:', error);
    return c.json({ success: false, error: 'Failed to fetch products' }, 500);
  }
});

admin.post('/products', zValidator('json', z.object({
  name: z.string().min(1),
  slug: z.string().min(1),
  description: z.string().min(1),
  category: z.enum(['simmons-black', 'accessories', 'us-imports']),
  images: z.array(z.string()).default([]),
  variants: z.array(z.any()).default([]),
  features: z.array(z.string()).default([]),
  specifications: z.record(z.any()).default({}),
  inStock: z.boolean().default(true),
  featured: z.boolean().default(false),
  sortOrder: z.number().default(0),
  seoTitle: z.string().optional(),
  seoDescription: z.string().optional(),
})), async (c) => {
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
});

admin.put('/products/:id', zValidator('json', z.object({
  name: z.string().optional(),
  slug: z.string().optional(),
  description: z.string().optional(),
  category: z.enum(['simmons-black', 'accessories', 'us-imports']).optional(),
  images: z.array(z.string()).optional(),
  variants: z.array(z.any()).optional(),
  features: z.array(z.string()).optional(),
  specifications: z.record(z.any()).optional(),
  inStock: z.boolean().optional(),
  featured: z.boolean().optional(),
  sortOrder: z.number().optional(),
  seoTitle: z.string().optional(),
  seoDescription: z.string().optional(),
})), async (c) => {
  const db = c.get('db');
  const cache = c.get('cache');
  const productId = c.req.param('id');
  const updateData = c.req.valid('json');

  try {
    const [updatedProduct] = await db.update(products)
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
});

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
      const imageKeys = product.images.map((url: string) => StorageManager.getKeyFromUrl(url));
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
    const folder = formData.get('folder') as string || 'uploads';

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
        }
      });
    });

    const uploadResults = await Promise.all(uploadPromises);

    return c.json({ 
      success: true, 
      data: uploadResults,
      message: `${uploadResults.length} file(s) uploaded successfully`
    });
  } catch (error) {
    console.error('File upload error:', error);
    return c.json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to upload files'
    }, 500);
  }
});

// Blog Post Management
admin.get('/posts', zValidator('query', z.object({
  page: z.string().optional().default('1'),
  limit: z.string().optional().default('20'),
  status: z.string().optional(),
  search: z.string().optional(),
})), async (c) => {
  const db = c.get('db');
  const cache = c.get('cache');
  const { page, limit, status, search } = c.req.valid('query');

  const pageNum = parseInt(page);
  const limitNum = parseInt(limit);
  const offset = (pageNum - 1) * limitNum;

  try {
    const cacheKey = `admin:posts:${page}:${limit}:${status || 'all'}:${search || 'none'}`;
    
    const result = await cache.getOrSet(cacheKey, async () => {
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
        query.orderBy(desc(posts.updatedAt))
             .limit(limitNum)
             .offset(offset),
        countQuery
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
        }
      };
    }, CacheTTL.SHORT);

    return c.json({ success: true, data: result.posts, pagination: result.pagination });
  } catch (error) {
    console.error('Get posts error:', error);
    return c.json({ success: false, error: 'Failed to fetch posts' }, 500);
  }
});

admin.post('/posts', zValidator('json', z.object({
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
})), async (c) => {
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
});

admin.put('/posts/:id', zValidator('json', z.object({
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
})), async (c) => {
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

    const [updatedPost] = await db.update(posts)
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
});

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

export default admin;
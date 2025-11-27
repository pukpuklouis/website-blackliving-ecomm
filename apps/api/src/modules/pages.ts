import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';
import { pages, users, eq, desc, asc, and, or, like, count } from '@blackliving/db';
import { RESERVED_ROUTES } from '@blackliving/types';
import { createId } from '@paralleldrive/cuid2';
import { requireAdmin } from '../middleware/auth';
import { CacheManager, CacheTTL } from '../lib/cache';

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
// BlockNote block schema
type Block = {
    id?: string;
    type: string;
    props?: Record<string, any>;
    content?: any[];
    children?: Block[];
};

const blockSchema: z.ZodType<Block> = z.lazy(() =>
    z.object({
        id: z.string().optional(),
        type: z.string(),
        props: z.record(z.any()).optional(),
        content: z.array(z.any()).optional(),
        children: z.array(blockSchema).optional(),
    })
);

const createPageSchema = z.object({
    title: z.string().min(1, 'Title is required'),
    slug: z
        .string()
        .min(1, 'Slug is required')
        .regex(/^[a-z0-9-]+$/, 'Slug must contain only lowercase letters, numbers, and hyphens')
        .refine((slug) => !RESERVED_ROUTES.includes(slug), {
            message: 'This slug is reserved for system use',
        }),
    content: z.array(blockSchema).default([]), // JSON blocks
    contentMarkdown: z.string().optional(),
    status: z.enum(['draft', 'published', 'archived']).default('draft'),
    seoTitle: z.string().optional(),
    seoDescription: z.string().optional(),
    seoKeywords: z.array(z.string()).default([]),
    featuredImage: z.string().optional(),
    publishedAt: z.string().datetime().optional(), // ISO string
});

const updatePageSchema = createPageSchema.partial();

const pageQuerySchema = z.object({
    status: z.enum(['draft', 'published', 'archived']).optional(),
    search: z.string().optional(),
    limit: z.string().optional(),
    offset: z.string().optional(),
    sortBy: z.enum(['title', 'createdAt', 'updatedAt', 'publishedAt']).default('updatedAt'),
    sortOrder: z.enum(['asc', 'desc']).default('desc'),
});

// GET /api/pages - List all pages (Public/Admin)
app.get('/', zValidator('query', pageQuerySchema), async (c) => {
    try {
        const db = c.get('db');
        const user = c.get('user');
        const isAdmin = user?.role === 'admin';
        const query = c.req.valid('query');

        const conditions = [];

        // If not admin, force status to be 'published'
        if (!isAdmin) {
            conditions.push(eq(pages.status, 'published'));
        } else if (query.status) {
            // Admin can filter by any status
            conditions.push(eq(pages.status, query.status));
        }

        if (query.search) {
            const searchTerm = `%${query.search}%`;
            conditions.push(or(like(pages.title, searchTerm), like(pages.slug, searchTerm)));
        }

        let orderBy;
        const sortDirection = query.sortOrder === 'asc' ? asc : desc;

        switch (query.sortBy) {
            case 'title':
                orderBy = sortDirection(pages.title);
                break;
            case 'publishedAt':
                orderBy = sortDirection(pages.publishedAt);
                break;
            case 'createdAt':
                orderBy = sortDirection(pages.createdAt);
                break;
            default:
                orderBy = sortDirection(pages.updatedAt);
        }

        const limit = parseInt(query.limit || '20');
        const offset = parseInt(query.offset || '0');

        // Cache key for public list requests
        const cache = c.get('cache');
        const cacheKey = CacheManager.keys.pages.list(isAdmin ? 'admin' : 'public');

        // Try cache for public requests without search
        if (!isAdmin && !query.search && offset === 0) {
            const cached = await cache.get(cacheKey);
            if (cached) {
                return c.json({
                    success: true,
                    data: cached,
                    cached: true
                });
            }
        }

        const result = await db
            .select({
                id: pages.id,
                title: pages.title,
                slug: pages.slug,
                status: pages.status,
                updatedAt: pages.updatedAt,
                publishedAt: pages.publishedAt,
                authorId: pages.authorId,
            })
            .from(pages)
            .where(conditions.length > 0 ? and(...conditions) : undefined)
            .orderBy(orderBy)
            .limit(limit)
            .offset(offset);

        const [totalResult] = await db
            .select({ count: count() })
            .from(pages)
            .where(conditions.length > 0 ? and(...conditions) : undefined);

        const responseData = {
            pages: result,
            pagination: {
                limit,
                offset,
                total: totalResult.count,
                hasMore: offset + result.length < totalResult.count,
            },
        };

        // Cache public list response
        if (!isAdmin && !query.search && offset === 0) {
            await cache.set(cacheKey, responseData, CacheTTL.SHORT);
        }

        return c.json({
            success: true,
            data: responseData,
        });
    } catch (error) {
        console.error('Error fetching pages:', error);
        return c.json(
            {
                success: false,
                error: 'Internal Server Error',
                message: 'Failed to fetch pages',
            },
            500
        );
    }
});

// GET /api/pages/:slug - Get page by slug (Public/Admin)
app.get('/:slug', async (c) => {
    try {
        const db = c.get('db');
        const cache = c.get('cache');
        const slug = c.req.param('slug');
        const user = c.get('user');
        const isAdmin = user?.role === 'admin';

        const cacheKey = CacheManager.keys.pages.detail(slug);

        // Try cache first for public requests
        if (!isAdmin) {
            const cached = await cache.get(cacheKey);
            if (cached) {
                return c.json({
                    success: true,
                    data: cached,
                    cached: true,
                });
            }
        }

        const [page] = await db
            .select()
            .from(pages)
            .where(or(eq(pages.id, slug), eq(pages.slug, slug)))
            .limit(1);

        if (!page) {
            return c.json(
                {
                    success: false,
                    error: 'Not Found',
                    message: 'Page not found',
                },
                404
            );
        }

        // If not admin, only allow published pages
        if (!isAdmin && page.status !== 'published') {
            return c.json(
                {
                    success: false,
                    error: 'Not Found',
                    message: 'Page not found',
                },
                404
            );
        }

        // Cache published pages for 1 hour
        if (page.status === 'published') {
            await cache.set(cacheKey, page, CacheTTL.LONG);
        }

        return c.json({
            success: true,
            data: page,
        });
    } catch (error) {
        console.error('Error fetching page:', error);
        return c.json(
            {
                success: false,
                error: 'Internal Server Error',
                message: 'Failed to fetch page',
            },
            500
        );
    }
});

// POST /api/pages - Create page (Admin only)
app.post('/', requireAdmin(), zValidator('json', createPageSchema), async (c) => {
    try {
        const db = c.get('db');
        const user = c.get('user');
        const pageData = c.req.valid('json');

        // Ensure slug uniqueness
        let slug = pageData.slug;
        let counter = 1;
        while (true) {
            const [existing] = await db
                .select({ id: pages.id })
                .from(pages)
                .where(eq(pages.slug, slug));

            if (!existing) break;

            slug = `${pageData.slug}-${counter}`;
            counter++;
        }

        const pageId = createId();
        const now = new Date();

        const [newPage] = await db
            .insert(pages)
            .values({
                id: pageId,
                title: pageData.title,
                slug: slug,
                content: pageData.content,
                contentMarkdown: pageData.contentMarkdown,
                status: pageData.status,
                seoTitle: pageData.seoTitle,
                seoDescription: pageData.seoDescription,
                seoKeywords: pageData.seoKeywords,
                featuredImage: pageData.featuredImage,
                authorId: user.id,
                publishedAt: pageData.publishedAt ? new Date(pageData.publishedAt) : (pageData.status === 'published' ? now : null),
                createdAt: now,
                updatedAt: now,
            })
            .returning();

        return c.json(
            {
                success: true,
                data: newPage,
                message: 'Page created successfully',
            },
            201
        );
    } catch (error) {
        console.error('Error creating page:', error);
        return c.json(
            {
                success: false,
                error: 'Internal Server Error',
                message: 'Failed to create page',
            },
            500
        );
    }
});

// PUT /api/pages/:id - Update page (Admin only)
app.put('/:id', requireAdmin(), zValidator('json', updatePageSchema), async (c) => {
    try {
        const db = c.get('db');
        const cache = c.get('cache');
        const id = c.req.param('id');
        const updateData = c.req.valid('json');

        const [existingPage] = await db
            .select()
            .from(pages)
            .where(eq(pages.id, id));

        if (!existingPage) {
            return c.json(
                {
                    success: false,
                    error: 'Not Found',
                    message: 'Page not found',
                },
                404
            );
        }

        if (updateData.slug && updateData.slug !== existingPage.slug) {
            const [conflictingPage] = await db
                .select({ id: pages.id })
                .from(pages)
                .where(eq(pages.slug, updateData.slug));

            if (conflictingPage) {
                return c.json(
                    {
                        success: false,
                        error: 'Conflict',
                        message: 'A page with this slug already exists',
                    },
                    409
                );
            }
        }

        const [updatedPage] = await db
            .update(pages)
            .set({
                ...updateData,
                publishedAt: updateData.publishedAt
                    ? new Date(updateData.publishedAt)
                    : (updateData.status === 'published' && existingPage.status !== 'published' ? new Date() : undefined),
                updatedAt: new Date(),
            })
            .where(eq(pages.id, id))
            .returning();

        // Invalidate cache
        await cache.delete(CacheManager.keys.pages.detail(existingPage.slug));
        if (updateData.slug && updateData.slug !== existingPage.slug) {
            await cache.delete(CacheManager.keys.pages.detail(updateData.slug));
        }

        return c.json({
            success: true,
            data: updatedPage,
            message: 'Page updated successfully',
        });
    } catch (error) {
        console.error('Error updating page:', error);
        return c.json(
            {
                success: false,
                error: 'Internal Server Error',
                message: 'Failed to update page',
            },
            500
        );
    }
});

// DELETE /api/pages/:id - Delete page (Admin only)
app.delete('/:id', requireAdmin(), async (c) => {
    try {
        const db = c.get('db');
        const cache = c.get('cache');
        const id = c.req.param('id');

        const [existingPage] = await db
            .select({ slug: pages.slug })
            .from(pages)
            .where(eq(pages.id, id));

        if (!existingPage) {
            return c.json(
                {
                    success: false,
                    error: 'Not Found',
                    message: 'Page not found',
                },
                404
            );
        }

        await db.delete(pages).where(eq(pages.id, id));

        // Invalidate cache
        await cache.delete(CacheManager.keys.pages.detail(existingPage.slug));

        return c.json({
            success: true,
            message: 'Page deleted successfully',
        });
    } catch (error) {
        console.error('Error deleting page:', error);
        return c.json(
            {
                success: false,
                error: 'Internal Server Error',
                message: 'Failed to delete page',
            },
            500
        );
    }
});

export default app;

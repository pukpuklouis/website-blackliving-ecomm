import type { createAuth } from "@blackliving/auth";
import { requireAdmin } from "@blackliving/auth";
import type { createDB } from "@blackliving/db";
import { postCategories, posts } from "@blackliving/db/schema";
import type {
  D1Database,
  KVNamespace,
  R2Bucket,
} from "@cloudflare/workers-types";
import { zValidator } from "@hono/zod-validator";
import { createId } from "@paralleldrive/cuid2";
import type { SQL } from "drizzle-orm";
import { and, asc, count, desc, eq, inArray, like, or, sql } from "drizzle-orm";
import { Hono } from "hono";
import { z } from "zod";
import type { createCacheManager } from "../lib/cache";
import type { createStorageManager } from "../lib/storage";
import { transformPost } from "../utils/searchSync";

interface Env {
  DB: D1Database;
  R2: R2Bucket;
  CACHE: KVNamespace;
  NODE_ENV: string;
  JWT_SECRET: string;
  BETTER_AUTH_SECRET: string;
  GOOGLE_CLIENT_ID: string;
  GOOGLE_CLIENT_SECRET: string;
  GOOGLE_ADMIN_CLIENT_ID: string;
  GOOGLE_ADMIN_CLIENT_SECRET: string;
  GOOGLE_CUSTOMER_CLIENT_ID: string;
  GOOGLE_CUSTOMER_CLIENT_SECRET: string;
}

const postsRouter = new Hono<{
  Bindings: Env;
  Variables: {
    db: ReturnType<typeof createDB>;
    cache: ReturnType<typeof createCacheManager>;
    storage: ReturnType<typeof createStorageManager>;
    auth: ReturnType<typeof createAuth>;
    search: any;
    user: any;
    session: any;
  };
}>();

// Duplicate auth middleware removed - relying on global Enhanced Auth middleware

// Validation schemas
const createPostSchema = z.object({
  title: z.string().min(1, "文章標題為必填"),
  slug: z
    .string()
    .min(1, "URL slug 為必填")
    .regex(/^[a-z0-9-]+$/, "URL slug 格式不正確"),
  description: z.string().min(10, "文章描述至少需要10個字元"),
  excerpt: z.string().optional(),
  content: z.string().min(50, "文章內容至少需要50個字元"),
  categoryId: z.string().optional(),
  category: z.string().optional(), // Remove hardcoded enum, validate dynamically
  tags: z.array(z.string()).default([]),
  status: z
    .enum(["draft", "published", "scheduled", "archived"])
    .default("draft"),
  featured: z.boolean().default(false),
  allowComments: z.boolean().default(true),
  sortOrder: z
    .preprocess(
      (value) => {
        if (value === "" || value === null || value === undefined) {
          return 0;
        }
        if (typeof value === "string") {
          const numeric = Number.parseInt(value, 10);
          return Number.isNaN(numeric) ? value : numeric;
        }
        return value;
      },
      z.number().int().min(0, "排序順序必須大於或等於 0")
    )
    .default(0),
  featuredImage: z.string().optional(),
  // SEO Fields
  seoTitle: z.string().optional(),
  seoDescription: z.string().optional(),
  seoKeywords: z.array(z.string()).default([]),
  canonicalUrl: z.string().optional(),
  // Social Media
  ogTitle: z.string().optional(),
  ogDescription: z.string().optional(),
  ogImage: z.string().optional(),
  // Publishing
  scheduledAt: z.string().optional(),
  publishedAt: z.union([z.number(), z.string()]).optional(),
  readingTime: z.number().min(1).max(60).default(5),
  // Overlay Settings - Single JSON object as per design.md
  overlaySettings: z
    .object({
      enabled: z.boolean().default(false),
      title: z.string().max(50, "疊加標題不能超過50個字元").optional(),
      placement: z
        .enum([
          "bottom-left",
          "bottom-right",
          "bottom-center",
          "top-left",
          "center",
        ])
        .default("bottom-left"),
      gradientDirection: z
        .enum(["t", "tr", "r", "br", "b", "bl", "l", "tl"])
        .default("b"),
    })
    .optional(),
});

const updatePostSchema = createPostSchema.partial();

const batchSortOrderSchema = z.object({
  updates: z
    .array(
      z.object({
        postId: z.string().min(1, "Post ID is required"),
        sortOrder: createPostSchema.shape.sortOrder,
      })
    )
    .min(1, "至少需要一筆排序更新"),
});

const querySchema = z.object({
  page: z.string().optional().default("1"),
  limit: z.string().optional().default("20"),
  search: z.string().optional(),
  status: z
    .enum(["draft", "published", "scheduled", "archived", "all"])
    .optional()
    .default("all"),
  category: z.string().optional().default("all"), // Allow any string, validate dynamically
  featured: z.enum(["true", "false", "all"]).optional().default("all"),
  author: z.string().optional(),
  sortBy: z
    .enum(["sortOrder", "createdAt", "publishedAt", "title", "viewCount"])
    .optional()
    .default("sortOrder"),
  sortOrder: z.enum(["asc", "desc"]).optional().default("desc"),
});

// Helper functions
const generateSlug = (title: string): string =>
  title
    .toLowerCase()
    .replace(/[^a-z0-9\u4e00-\u9fff\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/^-+|-+$/g, "");

const calculateReadingTime = (content: string): number => {
  const wordsPerMinute = 200;
  const wordCount = content.length / 5; // Rough estimate for Chinese characters
  return Math.max(1, Math.ceil(wordCount / wordsPerMinute));
};

// Helper function to deserialize overlaySettings from JSON string to object
const deserializePost = (post: any) => {
  if (post.overlaySettings && typeof post.overlaySettings === "string") {
    try {
      post.overlaySettings = JSON.parse(post.overlaySettings);
    } catch (error) {
      console.warn("Failed to parse overlaySettings JSON:", error);
      post.overlaySettings = null; // Fallback to null if parsing fails
    }
  }
  return post;
};

const getThreeLayerSorting = (): SQL[] => [
  sql`(${posts.sortOrder} = 0)`,
  asc(posts.sortOrder),
  desc(posts.updatedAt),
];

// POST CATEGORIES ENDPOINTS

// GET /api/posts/categories - List all post categories (cached)
postsRouter.get("/categories", async (c) => {
  try {
    const db = c.get("db");
    const cache = c.get("cache");

    const cacheKey = "blog:categories:active";

    const cached = await cache.get(cacheKey);
    if (cached) {
      return c.json({ success: true, data: cached, cached: true });
    }

    const categories = await db
      .select()
      .from(postCategories)
      .where(eq(postCategories.isActive, true))
      .orderBy(postCategories.sortOrder, postCategories.name);

    // Cache for 24 hours and tag for invalidation
    await cache.setWithTags(cacheKey, categories, ["post-categories"], 86_400);

    return c.json({ success: true, data: categories, cached: false });
  } catch (error) {
    console.error("Error fetching post categories:", error);
    return c.json(
      {
        success: false,
        error: "Failed to fetch post categories",
      },
      500
    );
  }
});

// GET /api/posts/categories/:slug - Get category by slug with posts count
postsRouter.get("/categories/:slug", async (c) => {
  try {
    const db = c.get("db");
    const cache = c.get("cache");
    const slug = c.req.param("slug");

    const cacheKey = `blog:category:${slug}`;
    const cached = await cache.get(cacheKey);
    if (cached) {
      return c.json({ success: true, data: cached, cached: true });
    }

    // Get category
    const category = await db
      .select()
      .from(postCategories)
      .where(
        and(eq(postCategories.slug, slug), eq(postCategories.isActive, true))
      )
      .limit(1);

    if (category.length === 0) {
      return c.json(
        {
          success: false,
          error: "Category not found",
        },
        404
      );
    }

    // Get posts count for this category
    const postsCount = await db
      .select({ count: count() })
      .from(posts)
      .where(
        and(eq(posts.categoryId, category[0].id), eq(posts.status, "published"))
      );

    const payload = {
      ...category[0],
      postsCount: postsCount[0]?.count || 0,
    } as const;

    await cache.setWithTags(cacheKey, payload, ["post-categories"], 86_400);

    return c.json({ success: true, data: payload, cached: false });
  } catch (error) {
    console.error("Error fetching post category:", error);
    return c.json(
      {
        success: false,
        error: "Failed to fetch post category",
      },
      500
    );
  }
});

// POST /api/posts/categories/cache/invalidate - Invalidate categories cache (admin only)
postsRouter.post("/categories/cache/invalidate", requireAdmin(), async (c) => {
  try {
    const cache = c.get("cache");
    await cache.invalidateByTags(["post-categories"]);
    return c.json({ success: true, message: "Categories cache invalidated" });
  } catch (error) {
    console.error("Error invalidating categories cache:", error);
    return c.json(
      {
        success: false,
        error: "Failed to invalidate categories cache",
      },
      500
    );
  }
});

// POSTS ENDPOINTS

// GET /api/posts/by-category/:slug - Get posts by category slug (public)
postsRouter.get(
  "/by-category/:slug",
  zValidator("query", querySchema.omit({ status: true, category: true })),
  async (c) => {
    try {
      const db = c.get("db");
      const categorySlug = c.req.param("slug");
      const { page, limit, search, featured, sortBy, sortOrder } =
        c.req.valid("query");

      const pageNum = Number.parseInt(page);
      const limitNum = Number.parseInt(limit);
      const offset = (pageNum - 1) * limitNum;

      // Get category first
      const category = await db
        .select()
        .from(postCategories)
        .where(
          and(
            eq(postCategories.slug, categorySlug),
            eq(postCategories.isActive, true)
          )
        )
        .limit(1);

      if (category.length === 0) {
        return c.json(
          {
            success: false,
            error: "Category not found",
          },
          404
        );
      }

      // Build where conditions (only published posts from this category)
      const conditions = [
        eq(posts.status, "published"),
        eq(posts.categoryId, category[0].id),
      ];

      if (search) {
        conditions.push(
          or(
            like(posts.title, `%${search}%`),
            like(posts.description, `%${search}%`)
          )
        );
      }

      if (featured !== "all") {
        conditions.push(eq(posts.featured, featured === "true"));
      }

      const whereClause = and(...conditions);

      // Build sort order with three-layer sorting as the primary ordering
      const orderByClauses: SQL[] = [...getThreeLayerSorting()];

      if (sortBy && sortBy !== "sortOrder") {
        const isAscending = sortOrder === "asc";

        switch (sortBy) {
          case "publishedAt":
            orderByClauses.push(
              isAscending ? asc(posts.publishedAt) : desc(posts.publishedAt)
            );
            break;
          case "title":
            orderByClauses.push(
              isAscending ? asc(posts.title) : desc(posts.title)
            );
            break;
          case "viewCount":
            orderByClauses.push(
              isAscending ? asc(posts.viewCount) : desc(posts.viewCount)
            );
            break;
          case "createdAt":
            orderByClauses.push(
              isAscending ? asc(posts.createdAt) : desc(posts.createdAt)
            );
            break;
          default:
            break;
        }
      }

      // Get total count
      const totalQuery = await db
        .select({ count: count() })
        .from(posts)
        .where(whereClause);

      const total = totalQuery[0]?.count || 0;

      // Get posts (excluding content for list view)
      const postsQuery = db
        .select({
          id: posts.id,
          title: posts.title,
          slug: posts.slug,
          description: posts.description,
          excerpt: posts.excerpt,
          authorName: posts.authorName,
          status: posts.status,
          featured: posts.featured,
          category: posts.category,
          categoryId: posts.categoryId,
          tags: posts.tags,
          featuredImage: posts.featuredImage,
          publishedAt: posts.publishedAt,
          viewCount: posts.viewCount,
          readingTime: posts.readingTime,
          overlaySettings: posts.overlaySettings,
          createdAt: posts.createdAt,
          sortOrder: posts.sortOrder,
        })
        .from(posts)
        .where(whereClause)
        .orderBy(...orderByClauses)
        .limit(limitNum)
        .offset(offset);

      const postsData = await postsQuery.all();

      return c.json({
        success: true,
        data: postsData,
        category: category[0],
        pagination: {
          page: pageNum,
          limit: limitNum,
          total,
          totalPages: Math.ceil(total / limitNum),
        },
      });
    } catch (error) {
      console.error("Error fetching posts by category:", error);
      return c.json(
        {
          success: false,
          error: "Failed to fetch posts by category",
        },
        500
      );
    }
  }
);

// GET /api/posts - List posts with filtering and pagination
postsRouter.get(
  "/",
  requireAdmin(),
  zValidator("query", querySchema),
  async (c) => {
    try {
      const db = c.get("db");
      const {
        page,
        limit,
        search,
        status,
        category,
        featured,
        author,
        sortBy,
        sortOrder,
      } = c.req.valid("query");

      const pageNum = Number.parseInt(page);
      const limitNum = Number.parseInt(limit);
      const offset = (pageNum - 1) * limitNum;

      // Build where conditions
      const conditions = [];

      if (search) {
        conditions.push(
          or(
            like(posts.title, `%${search}%`),
            like(posts.description, `%${search}%`),
            like(posts.content, `%${search}%`)
          )
        );
      }

      if (status !== "all") {
        conditions.push(eq(posts.status, status));
      }

      if (category !== "all") {
        // Filter by category slug using categoryId relationship
        conditions.push(
          sql`${posts.categoryId} IN (SELECT id FROM ${postCategories} WHERE slug = ${category} AND is_active = 1)`
        );
      }

      if (featured !== "all") {
        conditions.push(eq(posts.featured, featured === "true"));
      }

      if (author) {
        conditions.push(eq(posts.authorId, author));
      }

      const whereClause =
        conditions.length > 0 ? and(...conditions) : undefined;

      // Build sort order with three-layer sorting as the primary ordering
      const orderByClauses: SQL[] = [...getThreeLayerSorting()];

      if (sortBy && sortBy !== "sortOrder") {
        const isAscending = sortOrder === "asc";

        switch (sortBy) {
          case "publishedAt":
            orderByClauses.push(
              isAscending ? asc(posts.publishedAt) : desc(posts.publishedAt)
            );
            break;
          case "title":
            orderByClauses.push(
              isAscending ? asc(posts.title) : desc(posts.title)
            );
            break;
          case "viewCount":
            orderByClauses.push(
              isAscending ? asc(posts.viewCount) : desc(posts.viewCount)
            );
            break;
          case "createdAt":
            orderByClauses.push(
              isAscending ? asc(posts.createdAt) : desc(posts.createdAt)
            );
            break;
          default:
            break;
        }
      }

      // Get total count
      const totalQuery = await db
        .select({ count: count() })
        .from(posts)
        .where(whereClause);

      const total = totalQuery[0]?.count || 0;

      // Get posts
      const postsQuery = db
        .select()
        .from(posts)
        .where(whereClause)
        .orderBy(...orderByClauses)
        .limit(limitNum)
        .offset(offset);

      const postsData = await postsQuery.all();

      // Deserialize overlaySettings for all posts
      const deserializedPosts = postsData.map(deserializePost);

      return c.json({
        success: true,
        data: deserializedPosts,
        pagination: {
          page: pageNum,
          limit: limitNum,
          total,
          totalPages: Math.ceil(total / limitNum),
        },
      });
    } catch (error) {
      console.error("Error fetching posts:", error);
      return c.json(
        {
          success: false,
          error: "Failed to fetch posts",
        },
        500
      );
    }
  }
);

// GET /api/posts/static-paths - Generate static paths for build time (public, published only)
postsRouter.get("/static-paths", async (c) => {
  try {
    const db = c.get("db");
    const cache = c.get("cache");
    const cacheKey = "blog:static-paths";

    // Try to get from cache first
    const cachedPaths = await cache.get(cacheKey);
    if (cachedPaths) {
      return c.json({
        success: true,
        data: JSON.parse(cachedPaths),
        cached: true,
      });
    }

    // Get all published posts for static path generation
    const publishedPosts = await db
      .select({
        id: posts.id,
        slug: posts.slug,
        title: posts.title,
        category: posts.category,
        categoryId: posts.categoryId,
        publishedAt: posts.publishedAt,
      })
      .from(posts)
      .where(eq(posts.status, "published"))
      .orderBy(desc(posts.publishedAt));

    // Cache for 30 minutes
    await cache.set(cacheKey, JSON.stringify(publishedPosts), { ttl: 1800 });

    return c.json({
      success: true,
      data: publishedPosts,
      cached: false,
    });
  } catch (error) {
    console.error("Error fetching static paths:", error);
    return c.json(
      {
        success: false,
        error: "Failed to fetch static paths",
      },
      500
    );
  }
});

// GET /api/posts/public - Public posts for website (published only)
postsRouter.get(
  "/public",
  zValidator("query", querySchema.omit({ status: true })),
  async (c) => {
    try {
      const db = c.get("db");
      const { page, limit, search, category, featured, sortBy, sortOrder } =
        c.req.valid("query");

      const pageNum = Number.parseInt(page);
      const limitNum = Number.parseInt(limit);
      const offset = (pageNum - 1) * limitNum;

      // Build where conditions (only published posts)
      const conditions = [eq(posts.status, "published")];

      if (search) {
        conditions.push(
          or(
            like(posts.title, `%${search}%`),
            like(posts.description, `%${search}%`)
          )
        );
      }

      if (category !== "all") {
        // Filter by category slug using categoryId relationship
        conditions.push(
          sql`${posts.categoryId} IN (SELECT id FROM ${postCategories} WHERE slug = ${category} AND is_active = 1)`
        );
      }

      if (featured !== "all") {
        conditions.push(eq(posts.featured, featured === "true"));
      }

      const whereClause = and(...conditions);

      // Build sort order with three-layer sorting as the primary ordering
      const orderByClauses: SQL[] = [...getThreeLayerSorting()];

      if (sortBy && sortBy !== "sortOrder") {
        const isAscending = sortOrder === "asc";

        switch (sortBy) {
          case "publishedAt":
            orderByClauses.push(
              isAscending ? asc(posts.publishedAt) : desc(posts.publishedAt)
            );
            break;
          case "title":
            orderByClauses.push(
              isAscending ? asc(posts.title) : desc(posts.title)
            );
            break;
          case "viewCount":
            orderByClauses.push(
              isAscending ? asc(posts.viewCount) : desc(posts.viewCount)
            );
            break;
          case "createdAt":
            orderByClauses.push(
              isAscending ? asc(posts.createdAt) : desc(posts.createdAt)
            );
            break;
          default:
            break;
        }
      }

      // Get total count
      const totalQuery = await db
        .select({ count: count() })
        .from(posts)
        .where(whereClause);

      const total = totalQuery[0]?.count || 0;

      // Get posts (excluding content for list view)
      const postsQuery = db
        .select({
          id: posts.id,
          title: posts.title,
          slug: posts.slug,
          description: posts.description,
          excerpt: posts.excerpt,
          authorName: posts.authorName,
          status: posts.status,
          featured: posts.featured,
          category: posts.category,
          categoryId: posts.categoryId,
          tags: posts.tags,
          featuredImage: posts.featuredImage,
          publishedAt: posts.publishedAt,
          viewCount: posts.viewCount,
          readingTime: posts.readingTime,
          overlaySettings: posts.overlaySettings,
          createdAt: posts.createdAt,
          sortOrder: posts.sortOrder,
        })
        .from(posts)
        .where(whereClause)
        .orderBy(...orderByClauses)
        .limit(limitNum)
        .offset(offset);

      const postsData = await postsQuery.all();

      // Deserialize overlaySettings for all posts
      const deserializedPosts = postsData.map(deserializePost);

      return c.json({
        success: true,
        data: deserializedPosts,
        pagination: {
          page: pageNum,
          limit: limitNum,
          total,
          totalPages: Math.ceil(total / limitNum),
        },
      });
    } catch (error) {
      console.error("Error fetching public posts:", error);
      return c.json(
        {
          success: false,
          error: "Failed to fetch posts",
        },
        500
      );
    }
  }
);

// GET /api/posts/:id - Get single post with optional includes
postsRouter.get("/:id", async (c) => {
  try {
    const db = c.get("db");
    const postIdOrSlug = c.req.param("id");
    const includeParam = c.req.query("include"); // e.g., "category" or "category,other"
    const includes = includeParam
      ? includeParam.split(",").map((s) => s.trim())
      : [];

    // Try by ID first (robust to non-standard IDs like 'post-01'), then fallback to slug
    let whereCondition = eq(posts.id, postIdOrSlug);
    let post = await db.select().from(posts).where(whereCondition).limit(1);
    if (post.length === 0) {
      whereCondition = eq(posts.slug, postIdOrSlug);
      post = await db.select().from(posts).where(whereCondition).limit(1);
    }

    if (post.length === 0) {
      return c.json(
        {
          success: false,
          error: "Post not found",
        },
        404
      );
    }

    // Increment view count if this is a public request (not admin)
    const user = c.get("user");
    if (!user || user.role !== "admin") {
      await db
        .update(posts)
        .set({
          viewCount: sql`${posts.viewCount} + 1`,
          updatedAt: new Date(),
        })
        .where(whereCondition);

      // Update the returned post data
      post[0].viewCount += 1;
    }

    // Prepare response data
    const postData = deserializePost(post[0]);
    const responseData: any = { ...postData };

    // Include category data if requested
    if (includes.includes("category") && postData.categoryId) {
      try {
        const category = await db
          .select()
          .from(postCategories)
          .where(eq(postCategories.id, postData.categoryId))
          .limit(1);

        if (category.length > 0) {
          responseData.category = category[0];
        }
      } catch (categoryError) {
        console.warn("Error fetching category for post:", categoryError);
        // Continue without category data rather than failing the entire request
      }
    }

    return c.json({
      success: true,
      data: responseData,
    });
  } catch (error) {
    console.error("Error fetching post:", error);
    return c.json(
      {
        success: false,
        error: "Failed to fetch post",
      },
      500
    );
  }
});

// POST /api/posts - Create new post
postsRouter.post(
  "/",
  requireAdmin(),
  zValidator("json", createPostSchema),
  async (c) => {
    try {
      const db = c.get("db");
      const user = c.get("user");
      const postData = c.req.valid("json");

      const parseIncomingDate = (val: unknown): Date | null => {
        if (val === null || val === undefined || val === "") return null;
        try {
          if (typeof val === "number") {
            // Treat numbers < 1e12 as seconds, otherwise milliseconds
            const ms = val < 1e12 ? val * 1000 : val;
            return new Date(ms);
          }
          if (typeof val === "string") {
            const d = new Date(val);
            return isNaN(d.getTime()) ? null : d;
          }
          if (val instanceof Date) return val;
        } catch {}
        return null;
      };

      // Check if slug already exists
      const existingPost = await db
        .select({ id: posts.id })
        .from(posts)
        .where(eq(posts.slug, postData.slug))
        .limit(1);

      if (existingPost.length > 0) {
        return c.json(
          {
            success: false,
            error: "URL slug already exists",
          },
          409
        );
      }

      // Calculate reading time if not provided
      const readingTime =
        postData.readingTime || calculateReadingTime(postData.content);

      const sanitizedSortOrder = Math.max(
        0,
        Math.floor(postData.sortOrder ?? 0)
      );

      // Resolve publishedAt: prefer client-provided value when present; otherwise default to now when publishing
      const resolvedPublishedAt =
        parseIncomingDate((postData as any).publishedAt) ??
        (postData.status === "published" ? new Date() : null);

      const newPost = {
        id: createId(),
        ...postData,
        sortOrder: sanitizedSortOrder,
        authorId: user.id,
        authorName: user.name || user.email,
        readingTime,
        publishedAt: resolvedPublishedAt,
        viewCount: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      await db.insert(posts).values(newPost);

      // Sync to search index if published
      if (newPost.status === "published") {
        try {
          const searchModule = c.get("search");
          const searchDocument = transformPost(newPost);
          await searchModule.indexDocument(searchDocument).catch((error) => {
            console.warn("Failed to index new post in search:", error);
          });
        } catch (error) {
          console.warn("Search sync failed for new post:", error);
        }
      }

      // Deserialize overlaySettings for the response
      const deserializedNewPost = deserializePost(newPost);

      return c.json(
        {
          success: true,
          data: deserializedNewPost,
        },
        201
      );
    } catch (error) {
      console.error("Error creating post:", error);
      return c.json(
        {
          success: false,
          error: "Failed to create post",
        },
        500
      );
    }
  }
);

// POST /api/posts/batch-sort-order - Update sort order in batch (atomic)
postsRouter.post(
  "/batch-sort-order",
  requireAdmin(),
  zValidator("json", batchSortOrderSchema),
  async (c) => {
    try {
      const db = c.get("db");
      const { updates } = c.req.valid("json");

      const normalized = updates.map((update) => ({
        postId: update.postId,
        sortOrder: Math.max(0, Math.floor(update.sortOrder ?? 0)),
      }));

      const uniqueIds = new Set(normalized.map((item) => item.postId));
      if (uniqueIds.size !== normalized.length) {
        return c.json(
          {
            success: false,
            error: "Duplicate post IDs detected in updates payload",
          },
          400
        );
      }

      const idList = Array.from(uniqueIds);
      if (idList.length === 0) {
        return c.json(
          {
            success: false,
            error: "No valid updates provided",
          },
          400
        );
      }

      const existingPosts = await db
        .select({ id: posts.id })
        .from(posts)
        .where(inArray(posts.id, idList));

      if (existingPosts.length !== idList.length) {
        const missingIds = idList.filter(
          (id) => !existingPosts.some((post) => post.id === id)
        );

        return c.json(
          {
            success: false,
            error: `Posts not found: ${missingIds.join(", ")}`,
          },
          404
        );
      }

      const now = new Date();

      const updateQueries = normalized.map(({ postId, sortOrder }) =>
        db
          .update(posts)
          .set({ sortOrder, updatedAt: now })
          .where(eq(posts.id, postId))
      );

      await db.batch(updateQueries);

      const updated = await db
        .select()
        .from(posts)
        .where(inArray(posts.id, idList));

      const postsById = new Map(
        updated.map((post) => [post.id, deserializePost(post)])
      );

      const orderedResults = normalized
        .map((update) => postsById.get(update.postId))
        .filter((post): post is Record<string, unknown> => Boolean(post));

      return c.json({
        success: true,
        data: orderedResults,
      });
    } catch (error) {
      console.error("Error updating post sort order batch:", error);
      return c.json(
        {
          success: false,
          error: "Failed to update post sort order",
        },
        500
      );
    }
  }
);

// PUT /api/posts/:id - Update post
postsRouter.put(
  "/:id",
  requireAdmin(),
  zValidator("json", updatePostSchema),
  async (c) => {
    try {
      const db = c.get("db");
      const param = c.req.param("id");
      const updates = c.req.valid("json");

      // Resolve by ID first, then by slug
      let existingPost = await db
        .select()
        .from(posts)
        .where(eq(posts.id, param))
        .limit(1);
      if (existingPost.length === 0) {
        existingPost = await db
          .select()
          .from(posts)
          .where(eq(posts.slug, param))
          .limit(1);
      }

      if (existingPost.length === 0) {
        return c.json(
          {
            success: false,
            error: "Post not found",
          },
          404
        );
      }

      const postId = existingPost[0].id;

      // Check if slug is being updated and doesn't conflict
      if (updates.slug && updates.slug !== existingPost[0].slug) {
        const slugConflict = await db
          .select({ id: posts.id })
          .from(posts)
          .where(
            and(eq(posts.slug, updates.slug), sql`${posts.id} != ${postId}`)
          )
          .limit(1);

        if (slugConflict.length > 0) {
          return c.json(
            {
              success: false,
              error: "URL slug already exists",
            },
            409
          );
        }
      }

      // Calculate reading time if content is updated
      if (updates.content && !updates.readingTime) {
        updates.readingTime = calculateReadingTime(updates.content);
      }

      // Normalize incoming publishedAt if provided
      const parseIncomingDate = (val: unknown): Date | null => {
        if (val === null || val === undefined || val === "") return null;
        try {
          if (typeof val === "number") {
            const ms = val < 1e12 ? val * 1000 : val;
            return new Date(ms);
          }
          if (typeof val === "string") {
            const d = new Date(val);
            return isNaN(d.getTime()) ? null : d;
          }
          if (val instanceof Date) return val;
        } catch {}
        return null;
      };

      if (updates.publishedAt !== undefined) {
        updates.publishedAt = parseIncomingDate(updates.publishedAt);
      }

      // Set published date if status is changing to published and no explicit date provided
      if (
        updates.status === "published" &&
        existingPost[0].status !== "published" &&
        updates.publishedAt == null
      ) {
        updates.publishedAt = new Date();
      }

      if (updates.sortOrder !== undefined) {
        const numericSortOrder = Math.max(0, Math.floor(updates.sortOrder));
        updates.sortOrder = numericSortOrder;
      }

      // Serialize overlaySettings to JSON string for D1 compatibility
      const updatedPost = {
        ...updates,
        updatedAt: new Date(),
      };

      // Convert overlaySettings object to JSON string if present
      if (updatedPost.overlaySettings) {
        updatedPost.overlaySettings = JSON.stringify(
          updatedPost.overlaySettings
        );
      }

      await db.update(posts).set(updatedPost).where(eq(posts.id, postId));

      // Sync to search index if status changed to/from published
      if (
        existingPost[0].status !== updatedPost.status &&
        (existingPost[0].status === "published" ||
          updatedPost.status === "published")
      ) {
        try {
          const searchModule = c.get("search");
          if (updatedPost.status === "published") {
            // Index the updated post
            const searchDocument = transformPost({
              ...existingPost[0],
              ...updatedPost,
            });
            await searchModule.indexDocument(searchDocument).catch((error) => {
              console.warn("Failed to index updated post in search:", error);
            });
          } else {
            // Remove from search index
            await searchModule
              .deleteDocument(existingPost[0].id)
              .catch((error) => {
                console.warn("Failed to remove post from search index:", error);
              });
          }
        } catch (error) {
          console.warn("Search sync failed for updated post:", error);
        }
      }

      // Fetch and return updated post
      const result = await db
        .select()
        .from(posts)
        .where(eq(posts.id, postId))
        .limit(1);

      // Deserialize overlaySettings for the updated post
      const deserializedResult = deserializePost(result[0]);

      return c.json({
        success: true,
        data: deserializedResult,
      });
    } catch (error) {
      console.error("Error updating post:", error);
      return c.json(
        {
          success: false,
          error: "Failed to update post",
        },
        500
      );
    }
  }
);

// DELETE /api/posts/:id - Delete post
postsRouter.delete("/:id", requireAdmin(), async (c) => {
  try {
    const db = c.get("db");
    const param = c.req.param("id");

    // Check if post exists by ID or slug
    let existingPost = await db
      .select({ id: posts.id, status: posts.status })
      .from(posts)
      .where(eq(posts.id, param))
      .limit(1);
    if (existingPost.length === 0) {
      existingPost = await db
        .select({ id: posts.id, status: posts.status })
        .from(posts)
        .where(eq(posts.slug, param))
        .limit(1);
    }

    if (existingPost.length === 0) {
      return c.json(
        {
          success: false,
          error: "Post not found",
        },
        404
      );
    }

    await db.delete(posts).where(eq(posts.id, existingPost[0].id));

    // Remove from search index if it was published
    if (existingPost[0].status === "published") {
      try {
        const searchModule = c.get("search");
        await searchModule.deleteDocument(existingPost[0].id).catch((error) => {
          console.warn("Failed to remove post from search index:", error);
        });
      } catch (error) {
        console.warn("Search sync failed for deleted post:", error);
      }
    }

    return c.json({
      success: true,
      message: "Post deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting post:", error);
    return c.json(
      {
        success: false,
        error: "Failed to delete post",
      },
      500
    );
  }
});

// GET /api/posts/analytics/stats - Get blog analytics
postsRouter.get("/analytics/stats", requireAdmin(), async (c) => {
  try {
    const db = c.get("db");

    // Get basic stats
    const totalPosts = await db.select({ count: count() }).from(posts);
    const publishedPosts = await db
      .select({ count: count() })
      .from(posts)
      .where(eq(posts.status, "published"));
    const draftPosts = await db
      .select({ count: count() })
      .from(posts)
      .where(eq(posts.status, "draft"));
    const featuredPosts = await db
      .select({ count: count() })
      .from(posts)
      .where(eq(posts.featured, true));

    // Get total views
    const totalViews = await db
      .select({ sum: sql<number>`sum(${posts.viewCount})` })
      .from(posts);

    // Get category distribution
    const categoryStats = await db
      .select({
        category: posts.category,
        count: count(),
        totalViews: sql<number>`sum(${posts.viewCount})`,
      })
      .from(posts)
      .groupBy(posts.category);

    // Get top posts by views
    const topPosts = await db
      .select({
        id: posts.id,
        title: posts.title,
        slug: posts.slug,
        viewCount: posts.viewCount,
        publishedAt: posts.publishedAt,
      })
      .from(posts)
      .where(eq(posts.status, "published"))
      .orderBy(desc(posts.viewCount))
      .limit(10);

    // Get recent posts
    const recentPosts = await db
      .select({
        id: posts.id,
        title: posts.title,
        slug: posts.slug,
        status: posts.status,
        createdAt: posts.createdAt,
        publishedAt: posts.publishedAt,
      })
      .from(posts)
      .orderBy(desc(posts.createdAt))
      .limit(10);

    return c.json({
      success: true,
      data: {
        summary: {
          totalPosts: totalPosts[0]?.count || 0,
          publishedPosts: publishedPosts[0]?.count || 0,
          draftPosts: draftPosts[0]?.count || 0,
          featuredPosts: featuredPosts[0]?.count || 0,
          totalViews: totalViews[0]?.sum || 0,
        },
        categories: categoryStats,
        topPosts,
        recentPosts,
      },
    });
  } catch (error) {
    console.error("Error fetching blog analytics:", error);
    return c.json(
      {
        success: false,
        error: "Failed to fetch blog analytics",
      },
      500
    );
  }
});

// GET /api/posts/:id/related - Get related posts based on category and tags
postsRouter.get("/:id/related", async (c) => {
  try {
    const db = c.get("db");
    const cache = c.get("cache");
    const postIdOrSlug = c.req.param("id");
    const limit = Number.parseInt(c.req.query("limit") || "3");

    const cacheKey = `blog:related:${postIdOrSlug}:${limit}`;

    // Try to get from cache first
    const cachedRelated = await cache.get(cacheKey);
    if (cachedRelated) {
      return c.json({
        success: true,
        data: JSON.parse(cachedRelated),
        cached: true,
      });
    }

    // Try ID first, then slug
    let whereCondition = eq(posts.id, postIdOrSlug);
    let currentPost = await db
      .select({
        id: posts.id,
        category: posts.category,
        categoryId: posts.categoryId,
        tags: posts.tags,
      })
      .from(posts)
      .where(whereCondition)
      .limit(1);

    if (currentPost.length === 0) {
      whereCondition = eq(posts.slug, postIdOrSlug);
      currentPost = await db
        .select({
          id: posts.id,
          category: posts.category,
          categoryId: posts.categoryId,
          tags: posts.tags,
        })
        .from(posts)
        .where(whereCondition)
        .limit(1);
    }

    if (currentPost.length === 0) {
      return c.json(
        {
          success: false,
          error: "Post not found",
        },
        404
      );
    }

    const current = currentPost[0];

    // Build conditions for related posts
    const conditions = [
      eq(posts.status, "published"), // Only published posts
      sql`${posts.id} != ${current.id}`, // Exclude current post
    ];

    // Prefer posts from same category
    if (current.categoryId) {
      conditions.push(eq(posts.categoryId, current.categoryId));
    } else if (current.category) {
      conditions.push(eq(posts.category, current.category));
    }

    const whereClause = and(...conditions);

    // Get related posts (exclude content for performance)
    const relatedPosts = await db
      .select({
        id: posts.id,
        title: posts.title,
        slug: posts.slug,
        description: posts.description,
        excerpt: posts.excerpt,
        category: posts.category,
        tags: posts.tags,
        featuredImage: posts.featuredImage,
        publishedAt: posts.publishedAt,
        readingTime: posts.readingTime,
        viewCount: posts.viewCount,
      })
      .from(posts)
      .where(whereClause)
      .orderBy(desc(posts.publishedAt))
      .limit(limit);

    // If we don't have enough related posts from same category, get from all categories
    if (relatedPosts.length < limit) {
      const additionalConditions = [
        eq(posts.status, "published"),
        sql`${posts.id} != ${current.id}`,
      ];

      // Exclude already selected posts
      if (relatedPosts.length > 0) {
        const excludeIds = relatedPosts.map((p) => p.id);
        additionalConditions.push(
          sql`${posts.id} NOT IN (${excludeIds.map((id) => `'${id}'`).join(", ")})`
        );
      }

      const additionalPosts = await db
        .select({
          id: posts.id,
          title: posts.title,
          slug: posts.slug,
          description: posts.description,
          excerpt: posts.excerpt,
          category: posts.category,
          tags: posts.tags,
          featuredImage: posts.featuredImage,
          publishedAt: posts.publishedAt,
          readingTime: posts.readingTime,
          viewCount: posts.viewCount,
        })
        .from(posts)
        .where(and(...additionalConditions))
        .orderBy(desc(posts.publishedAt))
        .limit(limit - relatedPosts.length);

      relatedPosts.push(...additionalPosts);
    }

    // Cache for 1 hour
    await cache.set(cacheKey, JSON.stringify(relatedPosts), { ttl: 3600 });

    return c.json({
      success: true,
      data: relatedPosts,
      cached: false,
    });
  } catch (error) {
    console.error("Error fetching related posts:", error);
    return c.json(
      {
        success: false,
        error: "Failed to fetch related posts",
      },
      500
    );
  }
});

// POST /api/posts/:id/duplicate - Duplicate post
postsRouter.post("/:id/duplicate", requireAdmin(), async (c) => {
  try {
    const db = c.get("db");
    const user = c.get("user");
    const postId = c.req.param("id");

    // Get original post
    const originalPost = await db
      .select()
      .from(posts)
      .where(eq(posts.id, postId))
      .limit(1);

    if (originalPost.length === 0) {
      return c.json(
        {
          success: false,
          error: "Post not found",
        },
        404
      );
    }

    const original = originalPost[0];

    // Create duplicate with modified title and slug
    const duplicateTitle = `${original.title} - 副本`;
    const duplicateSlug = `${original.slug}-copy-${Date.now()}`;

    const duplicatePost = {
      id: createId(),
      title: duplicateTitle,
      slug: duplicateSlug,
      description: original.description,
      excerpt: original.excerpt,
      content: original.content,
      authorId: user.id,
      authorName: user.name || user.email,
      status: "draft" as const,
      featured: false,
      category: original.category,
      tags: original.tags,
      featuredImage: original.featuredImage,
      seoTitle: original.seoTitle,
      seoDescription: original.seoDescription,
      seoKeywords: original.seoKeywords,
      canonicalUrl: original.canonicalUrl,
      ogTitle: original.ogTitle,
      ogDescription: original.ogDescription,
      ogImage: original.ogImage,
      readingTime: original.readingTime,
      allowComments: original.allowComments,
      viewCount: 0,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    await db.insert(posts).values(duplicatePost);

    // Deserialize overlaySettings for the response
    const deserializedDuplicatePost = deserializePost(duplicatePost);

    return c.json(
      {
        success: true,
        data: deserializedDuplicatePost,
      },
      201
    );
  } catch (error) {
    console.error("Error duplicating post:", error);
    return c.json(
      {
        success: false,
        error: "Failed to duplicate post",
      },
      500
    );
  }
});

export { postsRouter };

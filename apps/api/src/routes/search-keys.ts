import { Hono } from "hono";
import { CacheTTL } from "../lib/cache";

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
    search: any;
    user: any;
    session: any;
  };
};

const app = new Hono<Env>();

// GET /api/search/keys - Get public search key for frontend
app.get("/", async (c) => {
  try {
    const cache = c.get("cache");
    const cacheKey = "search:public-key";

    // Try cache first
    const cached = await cache.get(cacheKey);
    if (cached) {
      return c.json({
        success: true,
        data: JSON.parse(cached),
        cached: true,
      });
    }

    const searchModule = c.get("search");
    if (!searchModule) {
      return c.json(
        {
          success: false,
          error: "Search service not available",
          message: "Search service is not configured",
        },
        503
      );
    }

    // Get search configuration
    const config = await searchModule.getConfig();
    if (!(config && config.host)) {
      return c.json(
        {
          success: false,
          error: "Search not configured",
          message: "MeiliSearch has not been configured yet",
        },
        503
      );
    }

    // Generate a public search key (this would typically be done by MeiliSearch admin)
    // For now, we'll use a placeholder - in production this should be a read-only key
    const publicKey = config.searchKey || "placeholder-search-key";

    const responseData = {
      host: config.host,
      searchKey: publicKey,
      indexName: config.indexName,
    };

    // Cache for 1 hour
    await cache.set(cacheKey, JSON.stringify(responseData), CacheTTL.LONG);

    return c.json({
      success: true,
      data: responseData,
    });
  } catch (error) {
    console.error("Error fetching search keys:", error);
    return c.json(
      {
        success: false,
        error: "Internal Server Error",
        message: "Failed to fetch search configuration",
      },
      500
    );
  }
});

export default app;

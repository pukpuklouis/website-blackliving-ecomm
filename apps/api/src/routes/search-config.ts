import { zValidator } from "@hono/zod-validator";
import { Hono } from "hono";
import { z } from "zod";
import { getSearchConfig, saveSearchConfig } from "../modules/search";

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

// Require admin role for all search config endpoints
const requireAdmin = async (c: any, next: any) => {
  const user = c.get("user");
  if (!user || user.role !== "admin") {
    return c.json(
      {
        success: false,
        error: "Unauthorized",
        message: "Admin access required",
      },
      403
    );
  }
  await next();
};

// Configuration schema
const configSchema = z.object({
  host: z.string().url("Invalid MeiliSearch host URL"),
  masterKey: z.string().min(1, "Master key is required"),
  indexName: z
    .string()
    .min(1, "Index name is required")
    .default("blackliving_content"),
});

// POST /api/search/config - Save MeiliSearch configuration
app.post(
  "/config",
  requireAdmin,
  zValidator("json", configSchema),
  async (c) => {
    try {
      const config = c.req.valid("json");

      const result = await saveSearchConfig(c, config);

      if (result.success) {
        return c.json({
          success: true,
          message: "MeiliSearch configuration saved successfully",
        });
      }
      return c.json(
        {
          success: false,
          error: "Configuration Error",
          message: result.error,
        },
        400
      );
    } catch (error) {
      console.error("Error saving search configuration:", error);
      return c.json(
        {
          success: false,
          error: "Internal Server Error",
          message: "Failed to save search configuration",
        },
        500
      );
    }
  }
);

// GET /api/search/config - Get current MeiliSearch configuration (admin only)
app.get("/config", requireAdmin, async (c) => {
  try {
    const config = await getSearchConfig(c);

    if (!config) {
      return c.json({
        success: true,
        data: null,
        message: "No MeiliSearch configuration found",
      });
    }

    // Don't return the master key for security
    const { masterKey, ...safeConfig } = config;

    return c.json({
      success: true,
      data: {
        ...safeConfig,
        hasMasterKey: !!masterKey && masterKey.length > 0,
      },
    });
  } catch (error) {
    console.error("Error retrieving search configuration:", error);
    return c.json(
      {
        success: false,
        error: "Internal Server Error",
        message: "Failed to retrieve search configuration",
      },
      500
    );
  }
});

// GET /api/search/keys - Get public search key for frontend (no auth required)
app.get("/keys", async (c) => {
  try {
    const config = await getSearchConfig(c);

    if (!(config && config.searchKey)) {
      return c.json(
        {
          success: false,
          error: "Not Configured",
          message:
            "MeiliSearch is not configured or search key is not available",
        },
        503
      );
    }

    return c.json({
      success: true,
      data: {
        host: config.host,
        searchKey: config.searchKey,
        indexName: config.indexName,
      },
    });
  } catch (error) {
    console.error("Error retrieving search keys:", error);
    return c.json(
      {
        success: false,
        error: "Internal Server Error",
        message: "Failed to retrieve search keys",
      },
      500
    );
  }
});

export default app;

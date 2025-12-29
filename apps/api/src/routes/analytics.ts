import { zValidator } from "@hono/zod-validator";
import { createId } from "@paralleldrive/cuid2";
import { Hono } from "hono";
import { z } from "zod";

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

// Validation schema for search analytics events
const searchAnalyticsSchema = z.object({
  type: z.enum([
    "search_query",
    "search_result_click",
    "search_no_results",
    "search_error",
  ]),
  timestamp: z.string().datetime(),
  userId: z.string().optional(),
  sessionId: z.string().optional(),
  query: z.string().optional(),
  resultId: z.string().optional(),
  resultType: z.enum(["product", "post", "page"]).optional(),
  position: z.number().int().min(1).optional(),
  filters: z.record(z.any()).optional(),
  metadata: z.record(z.any()).optional(),
});

// POST /api/analytics/search - Log search analytics events
app.post("/search", zValidator("json", searchAnalyticsSchema), async (c) => {
  try {
    const event = c.req.valid("json");
    const db = c.get("db");

    // Create analytics event record
    const analyticsEvent = {
      id: createId(),
      ...event,
      createdAt: new Date().toISOString(),
    };

    // Store in database (you might want to use a separate analytics table)
    // For now, we'll store in a generic analytics table or log
    // In production, consider using a proper analytics database

    // Log the event for now (in production, you'd store this properly)
    console.log("Search Analytics Event:", analyticsEvent);

    // TODO: Implement proper storage in analytics table
    // await db.insert(analytics).values(analyticsEvent);

    return c.json({
      success: true,
      message: "Analytics event logged successfully",
    });
  } catch (error) {
    console.error("Error logging search analytics:", error);
    return c.json(
      {
        success: false,
        error: "Internal Server Error",
        message: "Failed to log analytics event",
      },
      500
    );
  }
});

// GET /api/analytics/search/summary - Get search analytics summary (for admin)
app.get("/search/summary", async (c) => {
  try {
    // This would typically query analytics data
    // For now, return placeholder data
    const summary = {
      totalQueries: 0,
      uniqueUsers: 0,
      averageResultsPerQuery: 0,
      topQueries: [],
      noResultsQueries: 0,
      errorRate: 0,
      lastUpdated: new Date().toISOString(),
    };

    return c.json({
      success: true,
      data: summary,
    });
  } catch (error) {
    console.error("Error fetching search analytics summary:", error);
    return c.json(
      {
        success: false,
        error: "Internal Server Error",
        message: "Failed to fetch analytics summary",
      },
      500
    );
  }
});

export default app;

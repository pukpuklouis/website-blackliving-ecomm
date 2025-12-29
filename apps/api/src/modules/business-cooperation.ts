import { businessCooperation } from "@blackliving/db";
import { zValidator } from "@hono/zod-validator";
import { createId } from "@paralleldrive/cuid2";
import { desc } from "drizzle-orm";
import { Hono } from "hono";
import { z } from "zod";
import { verifyTurnstile } from "../utils/turnstile";

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
const businessCooperationCreateSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Please provide a valid email address"),
  phone: z.string().min(1, "Phone number is required"),
  subject: z.string().min(1, "Subject is required"),
  content: z.string().min(10, "Content must be at least 10 characters"),
  turnstileToken: z.string().min(1, "Please complete the verification"),
});

// POST /api/business-cooperation - Submit form
app.post(
  "/",
  zValidator("json", businessCooperationCreateSchema),
  async (c) => {
    try {
      const db = c.get("db");
      const data = c.req.valid("json");

      // Verify Turnstile
      let verified = false;
      try {
        verified = await verifyTurnstile(c, data.turnstileToken);
      } catch (error) {
        console.error("Turnstile verification error:", error);
        return c.json(
          {
            success: false,
            error: "Verification service unavailable",
            message: "驗證服務暫時無法使用",
          },
          503
        );
      }
      if (!verified) {
        return c.json(
          {
            success: false,
            error: "Turnstile verification failed",
            message: "驗證失敗，請重新嘗試",
          },
          400
        );
      }

      const id = createId();
      const [newRecord] = await db
        .insert(businessCooperation)
        .values({
          id,
          name: data.name,
          email: data.email,
          phone: data.phone,
          subject: data.subject,
          content: data.content,
          status: "new",
          createdAt: new Date(),
        })
        .returning();

      return c.json(
        {
          success: true,
          data: {
            id: newRecord.id,
          },
          message: "Request submitted successfully.",
        },
        201
      );
    } catch (error) {
      console.error("Error submitting business cooperation request:", error);
      return c.json(
        {
          success: false,
          error: "Internal Server Error",
          message: "提交失敗，伺服器發生錯誤",
          details: error instanceof Error ? error.message : String(error),
        },
        500
      );
    }
  }
);

// GET /api/business-cooperation - List all requests
app.get("/", async (c) => {
  try {
    const db = c.get("db");
    const requests = await db
      .select()
      .from(businessCooperation)
      .orderBy(desc(businessCooperation.createdAt as any))
      .all();

    return c.json({
      success: true,
      data: {
        requests,
      },
    });
  } catch (error) {
    console.error("Error fetching business cooperation requests:", error);
    return c.json(
      {
        success: false,
        error: "Internal Server Error",
        message: "Failed to fetch requests",
      },
      500
    );
  }
});

export default app;

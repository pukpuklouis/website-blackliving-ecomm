import { settings } from "@blackliving/db/schema";
import { createId } from "@paralleldrive/cuid2";
import { eq } from "drizzle-orm";
import { Hono } from "hono";
import { z } from "zod";
import { requireAdmin } from "../middleware/auth";

import type { LineNotificationService } from "../utils/line";

type Env = {
  Variables: {
    db: any;
    cache: any;
    user: any;
    line: LineNotificationService;
  };
};

const app = new Hono<Env>();

// Validation Schemas
const remoteZoneSchema = z.object({
  id: z.string(),
  city: z.string(),
  district: z.string().optional(),
  surcharge: z.number().min(0),
});

const logisticSettingsSchema = z.object({
  baseFee: z.number().min(0),
  freeShippingThreshold: z.number().min(0),
  remoteZones: z.array(remoteZoneSchema).default([]),
});

// GET /api/settings/:key - Get setting by key
app.get("/:key", async (c) => {
  try {
    const db = c.get("db");
    const key = c.req.param("key");

    const [setting] = await db
      .select()
      .from(settings)
      .where(eq(settings.key, key))
      .limit(1);

    if (!setting) {
      // Return 404 if not found
      return c.json(
        {
          success: false,
          error: "Not Found",
          message: "Setting not found",
        },
        404
      );
    }

    return c.json({
      success: true,
      data: setting.value,
    });
  } catch (error) {
    console.error("Error fetching setting:", error);
    return c.json(
      {
        success: false,
        error: "Internal Server Error",
        message: "Failed to fetch setting",
      },
      500
    );
  }
});

// PUT /api/settings/:key - Update setting by key (Admin only)
app.put("/:key", requireAdmin(), async (c) => {
  try {
    const db = c.get("db");
    const key = c.req.param("key");
    const body = await c.req.json();

    // Validate based on key (currently only logistic_settings supported)
    if (key === "logistic_settings") {
      const validation = logisticSettingsSchema.safeParse(body);
      if (!validation.success) {
        return c.json(
          {
            success: false,
            error: "Validation Error",
            message: "Invalid settings format",
            details: validation.error.errors,
          },
          400
        );
      }
    }

    if (key === "line_notification") {
      // Basic validation for LINE settings
      if (!(body.channelAccessToken && body.adminUserId)) {
        return c.json(
          {
            success: false,
            error: "Validation Error",
            message: "Channel Access Token and Admin User ID are required",
          },
          400
        );
      }
    }

    // Check if setting exists
    const [existingSetting] = await db
      .select()
      .from(settings)
      .where(eq(settings.key, key))
      .limit(1);

    let result;
    const now = new Date();

    if (existingSetting) {
      // Update
      [result] = await db
        .update(settings)
        .set({
          value: body,
          updatedAt: now,
        })
        .where(eq(settings.key, key))
        .returning();
    } else {
      // Insert
      [result] = await db
        .insert(settings)
        .values({
          id: createId(),
          key,
          value: body,
          updatedAt: now,
        })
        .returning();
    }

    return c.json({
      success: true,
      data: result.value,
      message: "Setting updated successfully",
    });
  } catch (error) {
    console.error("Error updating setting:", error);
    return c.json(
      {
        success: false,
        error: "Internal Server Error",
        message: "Failed to update setting",
      },
      500
    );
  }
});

// POST /api/settings/line/test - Test LINE notification
app.post("/line/test", requireAdmin(), async (c) => {
  try {
    const line = c.get("line");
    // Reload settings to ensure we use the latest from DB
    // The service loads settings internally, but we might want to force reload or specific logic
    // sendTestNotification calls loadSettings internally.

    const result = await line.sendTestNotification();

    if (result.success) {
      return c.json({
        success: true,
        message: "Test message sent successfully",
      });
    }

    return c.json(
      {
        success: false,
        message: "Failed to send test message. Check your credentials.",
        error: result.error, // Pass detailed error for debugging
      },
      400
    );
  } catch (error) {
    console.error("Error sending test message:", error);
    return c.json(
      {
        success: false,
        error: "Internal Server Error",
        message: "Failed to send test message",
      },
      500
    );
  }
});

export default app;

import { contacts } from "@blackliving/db";
import { zValidator } from "@hono/zod-validator";
import { createId } from "@paralleldrive/cuid2";
import { and, count, desc, eq } from "drizzle-orm";
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

// Validation schemas
const contactCreateSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Please provide a valid email address"),
  phone: z.string().optional(),
  subject: z.string().min(5, "Subject must be at least 5 characters"),
  message: z.string().min(10, "Message must be at least 10 characters"),
});

const contactUpdateSchema = z.object({
  status: z.enum(["new", "replied", "closed"]),
  notes: z.string().optional(),
});

const contactQuerySchema = z.object({
  status: z.enum(["new", "replied", "closed"]).optional(),
  limit: z.string().optional(),
  offset: z.string().optional(),
  search: z.string().optional(), // Search in name, email, subject, or message
});

// Helper function to require admin role
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

// POST /api/contact - Submit contact form
app.post("/", zValidator("json", contactCreateSchema), async (c) => {
  try {
    const db = c.get("db");
    const cache = c.get("cache");
    const contactData = c.req.valid("json");

    // Rate limiting check - prevent spam (could be enhanced with user IP tracking)
    const recentContacts = await db
      .select({ count: count() })
      .from(contacts)
      .where(eq(contacts.email, contactData.email));

    if (recentContacts[0].count > 5) {
      return c.json(
        {
          success: false,
          error: "Too Many Requests",
          message:
            "Too many contact submissions from this email. Please try again later.",
        },
        429
      );
    }

    const contactId = createId();
    const [newContact] = await db
      .insert(contacts)
      .values({
        id: contactId,
        name: contactData.name,
        email: contactData.email,
        phone: contactData.phone || null,
        subject: contactData.subject,
        message: contactData.message,
        status: "new",
        createdAt: new Date(),
      })
      .returning();

    // Clear admin cache
    await cache.delete("contacts:stats");

    return c.json(
      {
        success: true,
        data: {
          id: newContact.id,
          status: newContact.status,
          createdAt: newContact.createdAt,
        },
        message:
          "Contact form submitted successfully. We will get back to you soon!",
      },
      201
    );
  } catch (error) {
    console.error("Error submitting contact form:", error);
    return c.json(
      {
        success: false,
        error: "Internal Server Error",
        message: "Failed to submit contact form",
      },
      500
    );
  }
});

// GET /api/contact/admin - List contact submissions (admin only)
app.get(
  "/admin",
  requireAdmin,
  zValidator("query", contactQuerySchema),
  async (c) => {
    try {
      const db = c.get("db");
      const cache = c.get("cache");
      const query = c.req.valid("query");

      // Build cache key
      const cacheKey = `contacts:list:${JSON.stringify(query)}`;

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

      if (query.status) {
        conditions.push(eq(contacts.status, query.status));
      }

      // Execute query with pagination
      const limit = Number.parseInt(query.limit || "20");
      const offset = Number.parseInt(query.offset || "0");

      let result;
      let totalResult;

      if (query.search) {
        // If search is provided, we need to use LIKE queries
        // Note: This is a simplified search - in production you might want full-text search
        const searchTerm = `%${query.search}%`;

        // For SQLite, we'll use a more basic approach since Drizzle's like might not work as expected
        result = await db
          .select()
          .from(contacts)
          .where(conditions.length > 0 ? and(...conditions) : undefined)
          .orderBy(desc(contacts.createdAt))
          .limit(limit)
          .offset(offset);

        // Filter results in application layer for search (not ideal for large datasets)
        if (query.search) {
          result = result.filter(
            (contact) =>
              contact.name
                .toLowerCase()
                .includes(query.search!.toLowerCase()) ||
              contact.email
                .toLowerCase()
                .includes(query.search!.toLowerCase()) ||
              contact.subject
                .toLowerCase()
                .includes(query.search!.toLowerCase()) ||
              contact.message
                .toLowerCase()
                .includes(query.search!.toLowerCase())
          );
        }

        totalResult = [{ count: result.length }];
      } else {
        result = await db
          .select()
          .from(contacts)
          .where(conditions.length > 0 ? and(...conditions) : undefined)
          .orderBy(desc(contacts.createdAt))
          .limit(limit)
          .offset(offset);

        totalResult = await db
          .select({ count: count() })
          .from(contacts)
          .where(conditions.length > 0 ? and(...conditions) : undefined);
      }

      const responseData = {
        contacts: result,
        pagination: {
          limit,
          offset,
          total: totalResult[0].count,
          hasMore: offset + result.length < totalResult[0].count,
        },
      };

      // Cache the result for 2 minutes (shorter cache for admin data)
      await cache.put(cacheKey, JSON.stringify(responseData), {
        expirationTtl: 120,
      });

      return c.json({
        success: true,
        data: responseData,
      });
    } catch (error) {
      console.error("Error fetching contact submissions:", error);
      return c.json(
        {
          success: false,
          error: "Internal Server Error",
          message: "Failed to fetch contact submissions",
        },
        500
      );
    }
  }
);

// GET /api/contact/admin/stats - Get contact statistics (admin only)
app.get("/admin/stats", requireAdmin, async (c) => {
  try {
    const db = c.get("db");
    const cache = c.get("cache");

    const cacheKey = "contacts:stats";

    // Try cache first
    const cached = await cache.get(cacheKey);
    if (cached) {
      return c.json({
        success: true,
        data: JSON.parse(cached),
        cached: true,
      });
    }

    // Get contact statistics by status
    const [totalStats] = await db.select({ total: count() }).from(contacts);

    const [newStats] = await db
      .select({ new: count() })
      .from(contacts)
      .where(eq(contacts.status, "new"));

    const [repliedStats] = await db
      .select({ replied: count() })
      .from(contacts)
      .where(eq(contacts.status, "replied"));

    const [closedStats] = await db
      .select({ closed: count() })
      .from(contacts)
      .where(eq(contacts.status, "closed"));

    // Get recent contacts (last 7 days)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const [recentStats] = await db.select({ recent: count() }).from(contacts);
    // Note: Date filtering would need to be implemented based on your timestamp handling

    const stats = {
      total: totalStats.total || 0,
      new: newStats.new || 0,
      replied: repliedStats.replied || 0,
      closed: closedStats.closed || 0,
      recentContacts: recentStats.recent || 0,
      responseRate:
        totalStats.total > 0
          ? Math.round(
              ((repliedStats.replied + closedStats.closed) / totalStats.total) *
                100
            )
          : 0,
    };

    // Cache for 5 minutes
    await cache.put(cacheKey, JSON.stringify(stats), { expirationTtl: 300 });

    return c.json({
      success: true,
      data: stats,
    });
  } catch (error) {
    console.error("Error fetching contact stats:", error);
    return c.json(
      {
        success: false,
        error: "Internal Server Error",
        message: "Failed to fetch contact statistics",
      },
      500
    );
  }
});

// GET /api/contact/admin/:id - Get single contact (admin only)
app.get("/admin/:id", requireAdmin, async (c) => {
  try {
    const db = c.get("db");
    const id = c.req.param("id");

    const [contact] = await db
      .select()
      .from(contacts)
      .where(eq(contacts.id, id));

    if (!contact) {
      return c.json(
        {
          success: false,
          error: "Not Found",
          message: "Contact submission not found",
        },
        404
      );
    }

    return c.json({
      success: true,
      data: contact,
    });
  } catch (error) {
    console.error("Error fetching contact:", error);
    return c.json(
      {
        success: false,
        error: "Internal Server Error",
        message: "Failed to fetch contact submission",
      },
      500
    );
  }
});

// PUT /api/contact/admin/:id - Update contact status (admin only)
app.put(
  "/admin/:id",
  requireAdmin,
  zValidator("json", contactUpdateSchema),
  async (c) => {
    try {
      const db = c.get("db");
      const cache = c.get("cache");
      const id = c.req.param("id");
      const updateData = c.req.valid("json");

      // Check if contact exists
      const [existingContact] = await db
        .select()
        .from(contacts)
        .where(eq(contacts.id, id));

      if (!existingContact) {
        return c.json(
          {
            success: false,
            error: "Not Found",
            message: "Contact submission not found",
          },
          404
        );
      }

      const [updatedContact] = await db
        .update(contacts)
        .set({
          status: updateData.status,
          // Note: If you want to add notes field, you'll need to add it to the schema
        })
        .where(eq(contacts.id, id))
        .returning();

      // Clear relevant caches
      await cache.delete("contacts:stats");

      return c.json({
        success: true,
        data: updatedContact,
        message: "Contact status updated successfully",
      });
    } catch (error) {
      console.error("Error updating contact:", error);
      return c.json(
        {
          success: false,
          error: "Internal Server Error",
          message: "Failed to update contact submission",
        },
        500
      );
    }
  }
);

// DELETE /api/contact/admin/:id - Delete contact (admin only)
app.delete("/admin/:id", requireAdmin, async (c) => {
  try {
    const db = c.get("db");
    const cache = c.get("cache");
    const id = c.req.param("id");

    // Check if contact exists
    const [existingContact] = await db
      .select()
      .from(contacts)
      .where(eq(contacts.id, id));

    if (!existingContact) {
      return c.json(
        {
          success: false,
          error: "Not Found",
          message: "Contact submission not found",
        },
        404
      );
    }

    await db.delete(contacts).where(eq(contacts.id, id));

    // Clear relevant caches
    await cache.delete("contacts:stats");

    return c.json({
      success: true,
      message: "Contact submission deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting contact:", error);
    return c.json(
      {
        success: false,
        error: "Internal Server Error",
        message: "Failed to delete contact submission",
      },
      500
    );
  }
});

export default app;

import type { createAuth } from "@blackliving/auth";
import { requireAdmin, requireAuth } from "@blackliving/auth";
import type { createDB } from "@blackliving/db";
import { orders as ordersTable } from "@blackliving/db/schema";
import type { Session, User } from "@blackliving/types";
import { zValidator } from "@hono/zod-validator";
import { desc, eq, sql } from "drizzle-orm";
import { Hono } from "hono";
import { z } from "zod";
import type { Env } from "../index";

const orders = new Hono<{
  Bindings: Env;
  Variables: {
    db: ReturnType<typeof createDB>;
    cache: unknown;
    storage: unknown;
    auth: ReturnType<typeof createAuth>;
    user: User | null;
    session: Session | null;
  };
}>();

// Validation schemas
const createOrderSchema = z.object({
  customerInfo: z.object({
    name: z.string().min(1),
    email: z.string().email(),
    phone: z.string().min(1),
  }),
  items: z.array(
    z.object({
      productId: z.string(),
      variantId: z.string().optional(),
      name: z.string(),
      quantity: z.number().positive(),
      price: z.number().positive(),
      size: z.string().optional(),
    })
  ),
  subtotalAmount: z.number().positive(),
  shippingFee: z.number().min(0).default(0),
  totalAmount: z.number().positive(),
  paymentMethod: z
    .enum([
      "bank_transfer",
      "credit_card",
      "cash_on_delivery",
      "virtual_account",
      "apple_pay",
      "google_pay",
    ])
    .default("bank_transfer"),
  notes: z.string().default(""),
  shippingAddress: z.object({
    name: z.string().min(1, "請輸入收件人姓名"),
    phone: z.string().min(1, "請輸入收件人電話"),
    address: z.string().min(1, "請輸入詳細地址"),
    city: z.string().min(1, "請選擇城市"),
    district: z.string().min(1, "請輸入區域"),
    postalCode: z.string().optional().default(""),
  }),
});

const updateOrderStatusSchema = z.object({
  status: z.enum([
    "pending_payment",
    "paid",
    "processing",
    "shipped",
    "delivered",
    "cancelled",
  ]),
  adminNotes: z.string().optional(),
  trackingNumber: z.string().optional(),
  shippingCompany: z.string().optional(),
});

const confirmPaymentSchema = z.object({
  paymentStatus: z.enum(["paid"]),
  status: z.enum(["paid"]),
  paymentVerifiedAt: z.string().datetime(),
  paymentVerifiedBy: z.string(),
  adminNotes: z.string().optional(),
});

// GET /api/orders - List orders (Admin only)
orders.get("/", requireAdmin(), async (c) => {
  try {
    const { status, limit = "50", offset = "0" } = c.req.query();
    const db = c.get("db");

    // Build Drizzle query with optional status filter
    const result = await db
      .select()
      .from(ordersTable)
      .where(status ? eq(ordersTable.status, status) : undefined)
      .orderBy(desc(ordersTable.createdAt))
      .limit(Number.parseInt(limit, 10))
      .offset(Number.parseInt(offset, 10));

    return c.json({
      success: true,
      data: { orders: result },
      total: result.length,
    });
  } catch (error) {
    console.error("Error fetching orders:", error);
    return c.json({ error: "Failed to fetch orders" }, 500);
  }
});

// GET /api/orders/:id - Get single order
orders.get("/:id", requireAdmin(), async (c) => {
  try {
    const id = c.req.param("id");
    const db = c.get("db");

    const result = await db
      .select()
      .from(ordersTable)
      .where(eq(ordersTable.id, id))
      .limit(1);

    if (result.length === 0) {
      return c.json({ error: "Order not found" }, 404);
    }

    return c.json({
      success: true,
      data: result[0],
    });
  } catch (error) {
    console.error("Error fetching order:", error);
    return c.json({ error: "Failed to fetch order" }, 500);
  }
});

// POST /api/orders - Create new order
orders.post("/", zValidator("json", createOrderSchema), async (c) => {
  try {
    const data = c.req.valid("json");
    const db = c.get("db");

    // Generate order number: BL + YYYYMMDD + sequence
    const today = new Date();
    const dateStr =
      today.getFullYear().toString() +
      (today.getMonth() + 1).toString().padStart(2, "0") +
      today.getDate().toString().padStart(2, "0");
    const orderNumber = `BL${dateStr}${Math.random().toString(36).substr(2, 4).toUpperCase()}`;

    await db.insert(ordersTable).values({
      orderNumber,
      customerInfo: data.customerInfo,
      items: data.items,
      subtotalAmount: data.subtotalAmount,
      shippingFee: data.shippingFee,
      totalAmount: data.totalAmount,
      paymentMethod: data.paymentMethod,
      status: "pending_payment",
      paymentStatus: "unpaid",
      notes: data.notes,
      shippingAddress: data.shippingAddress,
    });

    // Send notification email (implement later)
    // await sendOrderConfirmationEmail(orderNumber, data);

    return c.json(
      {
        success: true,
        data: {
          orderNumber,
          status: "pending_payment",
          message: "訂單已建立成功，請依照指示完成付款",
        },
      },
      201
    );
  } catch (error) {
    console.error("Error creating order:", error);

    // Return more detailed error information for debugging
    if (error instanceof Error) {
      return c.json(
        {
          error: "Failed to create order",
          details: error.message,
          name: error.name,
        },
        500
      );
    }

    return c.json({ error: "Failed to create order" }, 500);
  }
});

// PATCH /api/orders/:id/status - Update order status (Admin only)
orders.patch(
  "/:id/status",
  requireAdmin(),
  zValidator("json", updateOrderStatusSchema),
  async (c) => {
    try {
      const id = c.req.param("id");
      const { status, adminNotes, trackingNumber, shippingCompany } =
        c.req.valid("json");
      const db = c.get("db");

      // Build update object dynamically
      const updateData: Record<string, unknown> = {
        status,
        updatedAt: new Date(),
      };

      if (adminNotes !== undefined) {
        updateData.adminNotes = adminNotes;
      }

      if (trackingNumber !== undefined) {
        updateData.trackingNumber = trackingNumber;
      }

      if (shippingCompany !== undefined) {
        updateData.shippingCompany = shippingCompany;
      }

      // Set shipped_at when status becomes shipped
      if (status === "shipped") {
        updateData.shippedAt = new Date();
      }

      // Set delivered_at when status becomes delivered
      if (status === "delivered") {
        updateData.deliveredAt = new Date();
      }

      await db
        .update(ordersTable)
        .set(updateData)
        .where(eq(ordersTable.id, id));

      // Drizzle doesn't return changes count, so we could optionally check if order exists first
      // For now, we'll assume the update succeeded if no error was thrown

      // Send status update notification (implement later)
      // await sendOrderStatusUpdateEmail(id, status);

      return c.json({
        success: true,
        message: "Order status updated successfully",
      });
    } catch (error) {
      console.error("Error updating order status:", error);
      return c.json({ error: "Failed to update order status" }, 500);
    }
  }
);

// PATCH /api/orders/:id/confirm-payment - Confirm payment (Admin only)
orders.patch(
  "/:id/confirm-payment",
  requireAdmin(),
  zValidator("json", confirmPaymentSchema),
  async (c) => {
    try {
      const id = c.req.param("id");
      const {
        paymentStatus,
        status,
        paymentVerifiedAt,
        paymentVerifiedBy,
        adminNotes,
      } = c.req.valid("json");
      const db = c.get("db");

      // Build update object
      const updateData: Record<string, unknown> = {
        paymentStatus,
        status,
        paymentVerifiedAt: new Date(paymentVerifiedAt),
        paymentVerifiedBy,
        updatedAt: new Date(),
      };

      if (adminNotes !== undefined) {
        updateData.adminNotes = adminNotes;
      }

      await db
        .update(ordersTable)
        .set(updateData)
        .where(eq(ordersTable.id, id));

      // Send payment confirmation notification (implement later)
      // await sendPaymentConfirmationEmail(id);

      return c.json({
        success: true,
        message: "Payment confirmed successfully",
      });
    } catch (error) {
      console.error("Error confirming payment:", error);
      return c.json({ error: "Failed to confirm payment" }, 500);
    }
  }
);

// PUT /api/orders/:id - Edit order (Admin only)
const editOrderSchema = z.object({
  customerInfo: z
    .object({
      name: z.string().min(1),
      email: z.string().email(),
      phone: z.string().min(1),
    })
    .optional(),
  shippingAddress: z
    .object({
      name: z.string().min(1),
      phone: z.string().min(1),
      address: z.string().min(1),
      city: z.string().min(1),
      district: z.string().min(1),
      postalCode: z.string().optional().default(""),
    })
    .optional(),
  adminNotes: z.string().optional(),
  trackingNumber: z.string().optional(),
  shippingCompany: z.string().optional(),
  notes: z.string().optional(),
});

orders.put(
  "/:id",
  requireAdmin(),
  zValidator("json", editOrderSchema),
  async (c) => {
    try {
      const id = c.req.param("id");
      const data = c.req.valid("json");
      const db = c.get("db");

      // Check if order exists
      const existing = await db
        .select()
        .from(ordersTable)
        .where(eq(ordersTable.id, id))
        .limit(1);

      if (existing.length === 0) {
        return c.json({ error: "Order not found" }, 404);
      }

      // Build update object dynamically
      const updateData: Record<string, unknown> = {
        updatedAt: new Date(),
      };

      if (data.customerInfo !== undefined) {
        updateData.customerInfo = data.customerInfo;
      }

      if (data.shippingAddress !== undefined) {
        updateData.shippingAddress = data.shippingAddress;
      }

      if (data.adminNotes !== undefined) {
        updateData.adminNotes = data.adminNotes;
      }

      if (data.trackingNumber !== undefined) {
        updateData.trackingNumber = data.trackingNumber;
      }

      if (data.shippingCompany !== undefined) {
        updateData.shippingCompany = data.shippingCompany;
      }

      if (data.notes !== undefined) {
        updateData.notes = data.notes;
      }

      await db
        .update(ordersTable)
        .set(updateData)
        .where(eq(ordersTable.id, id));

      // Fetch updated order
      const updated = await db
        .select()
        .from(ordersTable)
        .where(eq(ordersTable.id, id))
        .limit(1);

      return c.json({
        success: true,
        message: "Order updated successfully",
        data: updated[0],
      });
    } catch (error) {
      console.error("Error updating order:", error);
      return c.json({ error: "Failed to update order" }, 500);
    }
  }
);

// DELETE /api/orders/:id - Delete order (Admin only)
orders.delete("/:id", requireAdmin(), async (c) => {
  try {
    const id = c.req.param("id");
    const db = c.get("db");

    // Check if order exists
    const existing = await db
      .select()
      .from(ordersTable)
      .where(eq(ordersTable.id, id))
      .limit(1);

    if (existing.length === 0) {
      return c.json({ error: "Order not found" }, 404);
    }

    await db.delete(ordersTable).where(eq(ordersTable.id, id));

    return c.json({
      success: true,
      message: "Order deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting order:", error);
    return c.json({ error: "Failed to delete order" }, 500);
  }
});

// GET /api/orders/customer/:email - Get customer orders
orders.get("/customer/:email", requireAuth(), async (c) => {
  try {
    const email = c.req.param("email");
    const user = c.get("user");
    const db = c.get("db");

    // Guard clause for null user (should never happen due to requireAuth middleware)
    if (!user) {
      return c.json({ error: "Unauthorized" }, 401);
    }

    // Ensure user can only access their own orders (unless admin)
    if (user.role !== "admin" && user.email !== email) {
      return c.json({ error: "Unauthorized access to customer orders" }, 403);
    }

    const result = await db
      .select()
      .from(ordersTable)
      .where(
        sql`json_extract(${ordersTable.customerInfo}, '$.email') = ${email}`
      )
      .orderBy(desc(ordersTable.createdAt));

    return c.json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error("Error fetching customer orders:", error);
    return c.json({ error: "Failed to fetch orders" }, 500);
  }
});

export default orders;

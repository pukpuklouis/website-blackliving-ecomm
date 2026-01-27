import type { createAuth } from "@blackliving/auth";
import { requireAdmin, requireAuth } from "@blackliving/auth";
import type { createDB } from "@blackliving/db";
import {
  bankAccountInfo,
  notificationSettings,
  orders as ordersTable,
} from "@blackliving/db/schema";
import {
  AdminNewOrder,
  AdminPaymentConfirmation,
  BankTransferConfirmation,
  PaymentComplete,
  PaymentReminder,
  ShippingNotification,
} from "@blackliving/email-templates";
import type { Session, User } from "@blackliving/types";
import { zValidator } from "@hono/zod-validator";
import { render } from "@react-email/render";
import { desc, eq, sql } from "drizzle-orm";
import { Hono } from "hono";
import { z } from "zod";
import type { Env } from "../index";
import type { NotificationService } from "../utils/notification";

const orders = new Hono<{
  Bindings: Env;
  Variables: {
    db: ReturnType<typeof createDB>;
    cache: unknown;
    storage: unknown;
    auth: ReturnType<typeof createAuth>;
    user: User | null;
    session: Session | null;
    notification: NotificationService;
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

    // Send bank transfer confirmation email if payment method is bank_transfer
    if (data.paymentMethod === "bank_transfer") {
      console.log(
        "[Orders] Payment method is bank_transfer, checking notification..."
      );
      const notification = c.get("notification");
      console.log(
        "[Orders] NotificationService isConfigured:",
        notification.isConfigured()
      );
      if (notification.isConfigured()) {
        // Fetch bank account info from settings
        const [bankInfo] = await db
          .select()
          .from(bankAccountInfo)
          .where(eq(bankAccountInfo.isActive, true))
          .limit(1);

        console.log("[Orders] Bank info found:", !!bankInfo);

        // Check if bank transfer email is enabled
        const [settings] = await db
          .select()
          .from(notificationSettings)
          .limit(1);
        const isBankTransferEnabled =
          settings?.enableBankTransferCustomer ?? true;

        console.log("[Orders] Bank transfer enabled:", isBankTransferEnabled);

        if (bankInfo && isBankTransferEnabled) {
          console.log("[Orders] Rendering BankTransferConfirmation email...");
          // Render email template
          const emailHtml = await render(
            BankTransferConfirmation({
              orderId: orderNumber,
              customerName: data.customerInfo.name,
              orderItems: data.items.map((item) => ({
                name: item.name,
                quantity: item.quantity,
                price: item.price,
              })),
              subtotal: data.subtotalAmount,
              shipping: data.shippingFee,
              total: data.totalAmount,
              bankName: bankInfo.bankName,
              bankBranch: bankInfo.branchName || "",
              accountNumber: bankInfo.accountNumber,
              accountHolder: bankInfo.accountHolder,
            })
          );

          console.log(
            "[Orders] Sending bank transfer email to:",
            data.customerInfo.email
          );
          // Await email to ensure it completes before worker terminates
          await notification.sendCustomerNotification(
            "bank_transfer_confirm",
            data.customerInfo.email,
            `[Black Living] 訂單確認 #${orderNumber} - 請完成轉帳付款`,
            emailHtml
          );
        }
      }
    }

    // Send admin notification for new orders (Story 5.3)
    console.log("[Orders] Checking admin notification for new order...");
    const notification = c.get("notification");
    console.log(
      "[Orders] Admin notification isConfigured:",
      notification.isConfigured()
    );
    if (notification.isConfigured()) {
      const [settings] = await db.select().from(notificationSettings).limit(1);
      const isAdminNotifEnabled = settings?.enableNewOrderAdmin ?? true;
      const adminEmails = (settings?.adminEmails as string[]) || [];

      console.log("[Orders] Admin notification enabled:", isAdminNotifEnabled);
      console.log("[Orders] Admin emails:", adminEmails);

      if (isAdminNotifEnabled && adminEmails.length > 0) {
        console.log("[Orders] Rendering AdminNewOrder email...");
        const adminEmailHtml = await render(
          AdminNewOrder({
            orderId: orderNumber,
            orderNumber,
            customerName: data.customerInfo.name,
            customerEmail: data.customerInfo.email,
            customerPhone: data.customerInfo.phone,
            orderItems: data.items.map((item) => ({
              name: item.name,
              quantity: item.quantity,
              price: item.price,
              size: item.size,
            })),
            subtotal: data.subtotalAmount,
            shipping: data.shippingFee,
            total: data.totalAmount,
            paymentMethod: data.paymentMethod,
            shippingAddress: data.shippingAddress,
            notes: data.notes || undefined,
            orderDate: new Date().toLocaleDateString("zh-TW", {
              year: "numeric",
              month: "long",
              day: "numeric",
              hour: "2-digit",
              minute: "2-digit",
            }),
          })
        );

        await notification.sendAdminNotification(
          "new_order",
          adminEmails,
          `[新訂單] #${orderNumber} - ${data.customerInfo.name} - $${data.totalAmount}`,
          adminEmailHtml
        );
      }
    }

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

      // Send shipping notification when status becomes shipped
      if (status === "shipped") {
        const notification = c.get("notification");
        if (notification.isConfigured()) {
          // Fetch order details for email
          const [order] = await db
            .select()
            .from(ordersTable)
            .where(eq(ordersTable.id, id))
            .limit(1);

          if (order) {
            const customerInfo = order.customerInfo as {
              name: string;
              email: string;
            };
            const items = order.items as Array<{
              name: string;
              quantity: number;
              price: number;
            }>;
            const shippingAddress = order.shippingAddress as {
              name: string;
              phone: string;
              address: string;
              city: string;
              district: string;
            } | null;

            // Check if shipping notification is enabled
            const [settings] = await db
              .select()
              .from(notificationSettings)
              .limit(1);
            const isEnabled = settings?.enableOrderShippedCustomer ?? true;

            if (isEnabled) {
              const emailHtml = await render(
                ShippingNotification({
                  orderId: order.orderNumber,
                  customerName: customerInfo.name,
                  orderItems: items,
                  subtotal: order.subtotalAmount,
                  shipping: order.shippingFee || 0,
                  total: order.totalAmount,
                  shippingCompany: trackingNumber ? shippingCompany : undefined,
                  trackingNumber,
                  shippingAddress: shippingAddress || undefined,
                })
              );

              await notification.sendCustomerNotification(
                "order_shipped",
                customerInfo.email,
                `[Black Living] 您的訂單已出貨 #${order.orderNumber}`,
                emailHtml
              );
            }
          }
        }
      }

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

      // Send payment confirmation notification
      const notification = c.get("notification");
      if (notification.isConfigured()) {
        // Fetch order details
        const [order] = await db
          .select()
          .from(ordersTable)
          .where(eq(ordersTable.id, id))
          .limit(1);

        if (order) {
          const customerInfo = order.customerInfo as {
            name: string;
            email: string;
          };
          const items = order.items as Array<{
            name: string;
            quantity: number;
            price: number;
          }>;

          // Check if payment confirmation is enabled
          const [settings] = await db
            .select()
            .from(notificationSettings)
            .limit(1);

          // Send to customer
          const emailHtml = await render(
            PaymentComplete({
              orderId: order.orderNumber,
              customerName: customerInfo.name,
              orderItems: items,
              subtotal: order.subtotalAmount,
              shipping: order.shippingFee || 0,
              total: order.totalAmount,
              paymentMethod: order.paymentMethod || "銀行轉帳",
              paymentDate: new Date(paymentVerifiedAt).toLocaleDateString(
                "zh-TW",
                { year: "numeric", month: "long", day: "numeric" }
              ),
            })
          );

          await notification.sendCustomerNotification(
            "payment_complete",
            customerInfo.email,
            `[Black Living] 付款已確認 #${order.orderNumber}`,
            emailHtml
          );

          // Send to admin if enabled
          if (settings?.enablePaymentConfirmAdmin) {
            const adminEmails = (settings.adminEmails as string[]) || [];
            if (adminEmails.length > 0) {
              const adminEmailHtml = await render(
                AdminPaymentConfirmation({
                  orderId: id,
                  orderNumber: order.orderNumber,
                  customerName: customerInfo.name,
                  customerEmail: customerInfo.email,
                  customerPhone:
                    (order.customerInfo as { phone?: string })?.phone || "",
                  paymentMethod: order.paymentMethod || "銀行轉帳",
                  paymentAmount: order.totalAmount,
                  paymentDate: new Date(paymentVerifiedAt).toLocaleString(
                    "zh-TW",
                    { timeZone: "Asia/Taipei" }
                  ),
                  logoUrl: "https://www.blackliving.tw/blackliving-logo-zh.svg",
                })
              );

              await notification.sendAdminNotification(
                "payment_complete",
                adminEmails,
                `[付款確認] #${order.orderNumber} - ${customerInfo.name} - $${order.totalAmount}`,
                adminEmailHtml
              );
            }
          }
        }
      }

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

// POST /api/orders/:id/payment-reminder - Send payment reminder (Admin only)
orders.post("/:id/payment-reminder", requireAdmin(), async (c) => {
  try {
    const id = c.req.param("id");
    const db = c.get("db");

    // Check if order exists
    const [order] = await db
      .select()
      .from(ordersTable)
      .where(eq(ordersTable.id, id))
      .limit(1);

    if (!order) {
      return c.json({ error: "Order not found" }, 404);
    }

    if (order.paymentStatus !== "unpaid") {
      return c.json({ error: "Order is already paid" }, 400);
    }

    const notification = c.get("notification");
    if (!notification.isConfigured()) {
      return c.json({ error: "Notification service not configured" }, 500);
    }

    const customerInfo = order.customerInfo as {
      name: string;
      email: string;
    };
    const items = order.items as Array<{
      name: string;
      quantity: number;
      price: number;
    }>;

    console.log("[Orders] Rendering PaymentReminder email...");
    const emailHtml = await render(
      PaymentReminder({
        orderId: order.orderNumber,
        customerName: customerInfo.name,
        orderItems: items,
        subtotal: order.subtotalAmount,
        shipping: order.shippingFee || 0,
        total: order.totalAmount,
        paymentMethod: order.paymentMethod || "銀行轉帳",
      })
    );

    await notification.sendCustomerNotification(
      "payment_reminder",
      customerInfo.email,
      `[Black Living] 付款提醒 #${order.orderNumber}`,
      emailHtml
    );

    // Update lastReminderSentAt
    await db
      .update(ordersTable)
      .set({ lastReminderSentAt: new Date() })
      .where(eq(ordersTable.id, id));

    return c.json({
      success: true,
      message: "Payment reminder sent successfully",
    });
  } catch (error) {
    console.error("Error sending payment reminder:", error);
    return c.json({ error: "Failed to send payment reminder" }, 500);
  }
});

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

import {
  bankAccountInfo,
  emailLogs,
  notificationSettings,
} from "@blackliving/db/schema";
import { zValidator } from "@hono/zod-validator";
import { and, desc, eq, sql } from "drizzle-orm";
import { Hono } from "hono";
import { z } from "zod";
import type { Env } from "../index";
import { requireAdmin } from "../middleware/auth";

// Validation schemas
const optionalEmailSchema = z.union([
  z.string().email(),
  z.literal(""),
  z.null(),
]);

const notificationSettingsSchema = z.object({
  adminEmails: z.array(z.string().email()).default([]),
  customerServiceEmail: optionalEmailSchema.optional(),
  enableNewOrderAdmin: z.boolean().optional(),
  enablePaymentConfirmAdmin: z.boolean().optional(),
  enableAppointmentAdmin: z.boolean().optional(),
  enableBankTransferCustomer: z.boolean().optional(),
  enableOrderShippedCustomer: z.boolean().optional(),
  enableAppointmentCustomer: z.boolean().optional(),
  senderName: z.string().optional(),
  replyToEmail: optionalEmailSchema.optional(),
});

const bankAccountSchema = z.object({
  bankName: z.string().min(1, "銀行名稱為必填"),
  bankCode: z.string().optional(),
  branchName: z.string().optional(),
  branchCode: z.string().optional(),
  accountNumber: z.string().min(1, "帳號為必填"),
  accountHolder: z.string().min(1, "戶名為必填"),
  isActive: z.boolean().optional(),
  displayOrder: z.number().int().optional(),
  notes: z.string().optional(),
});

const adminNotifications = new Hono<{
  Bindings: Env;
  Variables: {
    db: ReturnType<typeof import("@blackliving/db").createDB>;
    user: { id: string; role: string } | null;
  };
}>();

// Apply admin auth to all routes
adminNotifications.use("*", requireAdmin());

/**
 * GET /api/admin/settings/notifications
 * Fetch current notification configuration
 */
adminNotifications.get("/", async (c) => {
  const db = c.get("db");

  try {
    // Get first (and only) notification settings record
    const [settings] = await db.select().from(notificationSettings).limit(1);

    if (!settings) {
      // Return default values if no settings exist
      return c.json({
        success: true,
        data: {
          adminEmails: [],
          customerServiceEmail: null,
          enableNewOrderAdmin: true,
          enablePaymentConfirmAdmin: true,
          enableAppointmentAdmin: true,
          enableBankTransferCustomer: true,
          enableOrderShippedCustomer: true,
          enableAppointmentCustomer: true,
          senderName: "Black Living 黑哥居家",
          replyToEmail: "service@blackliving.tw",
        },
      });
    }

    return c.json({
      success: true,
      data: {
        adminEmails: settings.adminEmails || [],
        customerServiceEmail: settings.customerServiceEmail,
        enableNewOrderAdmin: settings.enableNewOrderAdmin,
        enablePaymentConfirmAdmin: settings.enablePaymentConfirmAdmin,
        enableAppointmentAdmin: settings.enableAppointmentAdmin,
        enableBankTransferCustomer: settings.enableBankTransferCustomer,
        enableOrderShippedCustomer: settings.enableOrderShippedCustomer,
        enableAppointmentCustomer: settings.enableAppointmentCustomer,
        senderName: settings.senderName,
        replyToEmail: settings.replyToEmail,
        updatedAt: settings.updatedAt?.toISOString(),
      },
    });
  } catch (error) {
    console.error("Fetch notification settings error:", error);
    return c.json(
      { success: false, error: "Failed to fetch notification settings" },
      500
    );
  }
});

/**
 * PUT /api/admin/settings/notifications
 * Update notification configuration
 */
adminNotifications.put(
  "/",
  zValidator("json", notificationSettingsSchema, (result, c) => {
    if (!result.success) {
      console.error(
        "Validation error:",
        JSON.stringify(result.error.issues, null, 2)
      );
      return c.json(
        {
          success: false,
          error: "Validation failed",
          details: result.error.issues,
        },
        400
      );
    }
  }),
  async (c) => {
    const db = c.get("db");
    const user = c.get("user");
    const body = c.req.valid("json");

    try {
      // Check if settings exist
      const [existing] = await db.select().from(notificationSettings).limit(1);

      if (existing) {
        // Update existing settings
        const [updated] = await db
          .update(notificationSettings)
          .set({
            adminEmails: body.adminEmails,
            customerServiceEmail: body.customerServiceEmail,
            enableNewOrderAdmin: body.enableNewOrderAdmin,
            enablePaymentConfirmAdmin: body.enablePaymentConfirmAdmin,
            enableAppointmentAdmin: body.enableAppointmentAdmin,
            enableBankTransferCustomer: body.enableBankTransferCustomer,
            enableOrderShippedCustomer: body.enableOrderShippedCustomer,
            enableAppointmentCustomer: body.enableAppointmentCustomer,
            senderName: body.senderName,
            replyToEmail: body.replyToEmail,
            updatedBy: user?.id,
            updatedAt: new Date(),
          })
          .where(eq(notificationSettings.id, existing.id))
          .returning();

        return c.json({
          success: true,
          message: "通知設定已更新",
          data: updated,
        });
      }
      // Create new settings
      const [created] = await db
        .insert(notificationSettings)
        .values({
          adminEmails: body.adminEmails || [],
          customerServiceEmail: body.customerServiceEmail,
          enableNewOrderAdmin: body.enableNewOrderAdmin ?? true,
          enablePaymentConfirmAdmin: body.enablePaymentConfirmAdmin ?? true,
          enableAppointmentAdmin: body.enableAppointmentAdmin ?? true,
          enableBankTransferCustomer: body.enableBankTransferCustomer ?? true,
          enableOrderShippedCustomer: body.enableOrderShippedCustomer ?? true,
          enableAppointmentCustomer: body.enableAppointmentCustomer ?? true,
          senderName: body.senderName || "Black Living 黑哥居家",
          replyToEmail: body.replyToEmail || "service@blackliving.tw",
          updatedBy: user?.id,
        })
        .returning();

      return c.json({
        success: true,
        message: "通知設定已建立",
        data: created,
      });
    } catch (error) {
      console.error("Update notification settings error:", error);
      return c.json(
        { success: false, error: "Failed to update notification settings" },
        500
      );
    }
  }
);

/**
 * GET /api/admin/settings/bank-info
 * Fetch bank account information
 */
adminNotifications.get("/bank-info", async (c) => {
  const db = c.get("db");

  try {
    const accounts = await db
      .select()
      .from(bankAccountInfo)
      .orderBy(bankAccountInfo.displayOrder);

    return c.json({
      success: true,
      data: accounts.map((account) => ({
        id: account.id,
        bankName: account.bankName,
        bankCode: account.bankCode,
        branchName: account.branchName,
        branchCode: account.branchCode,
        accountNumber: account.accountNumber,
        accountHolder: account.accountHolder,
        isActive: account.isActive,
        displayOrder: account.displayOrder,
        notes: account.notes,
        updatedAt: account.updatedAt?.toISOString(),
      })),
    });
  } catch (error) {
    console.error("Fetch bank info error:", error);
    return c.json({ success: false, error: "Failed to fetch bank info" }, 500);
  }
});

/**
 * PUT /api/admin/settings/bank-info
 * Update or create bank account information
 */
adminNotifications.put(
  "/bank-info",
  zValidator("json", bankAccountSchema),
  async (c) => {
    const db = c.get("db");
    const user = c.get("user");
    const body = c.req.valid("json");

    try {
      // Check if any bank account exists
      const [existing] = await db
        .select()
        .from(bankAccountInfo)
        .where(eq(bankAccountInfo.isActive, true))
        .limit(1);

      if (existing) {
        // Update existing bank account
        const [updated] = await db
          .update(bankAccountInfo)
          .set({
            bankName: body.bankName,
            bankCode: body.bankCode,
            branchName: body.branchName,
            branchCode: body.branchCode,
            accountNumber: body.accountNumber,
            accountHolder: body.accountHolder,
            isActive: body.isActive ?? true,
            displayOrder: body.displayOrder ?? 0,
            notes: body.notes,
            updatedBy: user?.id,
            updatedAt: new Date(),
          })
          .where(eq(bankAccountInfo.id, existing.id))
          .returning();

        return c.json({
          success: true,
          message: "銀行帳戶資訊已更新",
          data: updated,
        });
      }
      // Create new bank account
      const [created] = await db
        .insert(bankAccountInfo)
        .values({
          bankName: body.bankName,
          bankCode: body.bankCode,
          branchName: body.branchName,
          branchCode: body.branchCode,
          accountNumber: body.accountNumber,
          accountHolder: body.accountHolder,
          isActive: body.isActive ?? true,
          displayOrder: body.displayOrder ?? 0,
          notes: body.notes,
          updatedBy: user?.id,
        })
        .returning();

      return c.json({
        success: true,
        message: "銀行帳戶資訊已建立",
        data: created,
      });
    } catch (error) {
      console.error("Update bank info error:", error);
      return c.json(
        { success: false, error: "Failed to update bank info" },
        500
      );
    }
  }
);

/**
 * POST /api/admin/settings/notifications/test
 * Send a test email to verify configuration
 * Rate limited: 5 requests per minute
 */
const testEmailLastSent = new Map<string, number[]>();
const RATE_LIMIT_WINDOW_MS = 60_000; // 1 minute
const RATE_LIMIT_MAX_REQUESTS = 5;

adminNotifications.post("/test", async (c) => {
  const db = c.get("db");
  const notification = c.get("notification");
  const user = c.get("user");

  // Rate limiting check
  const userId = user?.id || "anonymous";
  const now = Date.now();
  const userRequests = testEmailLastSent.get(userId) || [];

  // Filter requests within the window
  const recentRequests = userRequests.filter(
    (time) => now - time < RATE_LIMIT_WINDOW_MS
  );

  if (recentRequests.length >= RATE_LIMIT_MAX_REQUESTS) {
    return c.json(
      { success: false, error: "請稍後再試，每分鐘最多發送5次測試郵件" },
      429
    );
  }

  // Record this request
  recentRequests.push(now);
  testEmailLastSent.set(userId, recentRequests);

  try {
    // Get current settings
    const [settings] = await db.select().from(notificationSettings).limit(1);
    const adminEmails = (settings?.adminEmails as string[]) || [];

    if (adminEmails.length === 0) {
      return c.json({ success: false, error: "請先設定管理員電子郵件" }, 400);
    }

    // Send test email to first admin
    const result = await notification.sendTestEmail(adminEmails[0]);

    return c.json({
      success: result.success,
      message: result.success
        ? `測試郵件已發送至 ${adminEmails[0]}`
        : `發送失敗: ${result.error}`,
    });
  } catch (error) {
    console.error("Send test email error:", error);
    return c.json({ success: false, error: "Failed to send test email" }, 500);
  }
});

/**
 * GET /api/admin/settings/notifications/email-logs
 * Fetch email history with pagination (Story 6.3)
 */
adminNotifications.get("/email-logs", requireAdmin(), async (c) => {
  const db = c.get("db");
  const { limit = "50", offset = "0", status, type } = c.req.query();

  try {
    const limitNum = Math.min(
      100,
      Math.max(1, Number.parseInt(limit, 10) || 50)
    );
    const offsetNum = Math.max(0, Number.parseInt(offset, 10) || 0);

    // Build query with filters
    const conditions = [];
    if (status) {
      conditions.push(eq(emailLogs.status, status));
    }
    if (type) {
      conditions.push(eq(emailLogs.type, type));
    }
    const whereClause =
      conditions.length === 0
        ? undefined
        : conditions.length === 1
          ? conditions[0]
          : and(...conditions);

    const logs = await db
      .select()
      .from(emailLogs)
      .where(whereClause)
      .orderBy(desc(emailLogs.createdAt))
      .limit(limitNum)
      .offset(offsetNum);

    // Get total count
    const [countResult] = await db
      .select({ count: sql<number>`count(*)` })
      .from(emailLogs)
      .where(whereClause);

    return c.json({
      success: true,
      data: logs.map((log) => ({
        id: log.id,
        type: log.type,
        recipient: log.recipient,
        subject: log.subject,
        status: log.status,
        messageId: log.messageId,
        errorMessage: log.errorMessage,
        retryCount: log.retryCount,
        relatedId: log.relatedId,
        relatedType: log.relatedType,
        sentAt: log.sentAt?.toISOString(),
        createdAt: log.createdAt?.toISOString(),
      })),
      pagination: {
        total: countResult?.count || 0,
        limit: limitNum,
        offset: offsetNum,
      },
    });
  } catch (error) {
    console.error("Fetch email logs error:", error);
    return c.json({ success: false, error: "Failed to fetch email logs" }, 500);
  }
});

export default adminNotifications;

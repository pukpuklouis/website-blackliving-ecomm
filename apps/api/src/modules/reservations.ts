import {
  appointments,
  notificationSettings,
  reservations,
} from "@blackliving/db/schema";
import {
  AdminAppointment,
  AppointmentConfirmation,
} from "@blackliving/email-templates";
import { zValidator } from "@hono/zod-validator";
import { createId } from "@paralleldrive/cuid2";
import { render } from "@react-email/render";
import { and, desc, eq, sql } from "drizzle-orm";
import { Hono } from "hono";
import { z } from "zod";
import type { Env } from "../index";
import type { NotificationService } from "../utils/notification";

const reservationsRouter = new Hono<{
  Bindings: Env;
  Variables: {
    db: any;
    cache: any;
    user: any;
    line: any;
    notification: NotificationService;
  };
}>();

const reservationSchema = z.object({
  storeId: z.string().min(1, "請選擇門市"),
  // Survey data - frontend sends null for unselected values
  source: z.string().nullable().optional(),
  hasTriedOtherStores: z.boolean().nullable().optional(),
  otherStoreNames: z.string().optional().default(""),
  priceAwareness: z.boolean().nullable().optional(),
  // Product preferences - frontend sends null for unselected values
  series: z.string().nullable().optional(),
  firmness: z.string().nullable().optional(),
  accessories: z.array(z.string()).optional().default([]),
  notes: z.string().max(500).optional().default(""),
  customerInfo: z.object({
    name: z.string().min(2, "請輸入姓名"),
    phone: z.string().min(8, "請輸入聯絡電話"),
    email: z.string().email("請輸入有效的Email"),
  }),
});

reservationsRouter.post(
  "/create",
  zValidator("json", reservationSchema),
  async (c) => {
    try {
      const db = c.get("db");
      const data = c.req.valid("json");

      // Get user from auth middleware (Better Auth session)
      const user = c.get("user");

      if (!user) {
        return c.json({ success: false, error: "未登入或登入已失效" }, 401);
      }

      const now = new Date();
      const appointmentId = createId();
      const reservationId = createId();

      const appointmentNumber = (() => {
        const today = new Date();
        const dateStr =
          today.getFullYear().toString() +
          (today.getMonth() + 1).toString().padStart(2, "0") +
          today.getDate().toString().padStart(2, "0");
        return `AP${dateStr}${Math.random().toString(36).substring(2, 6).toUpperCase()}`;
      })();

      const reservationPayload = {
        id: reservationId,
        userId: user.id,
        reservationData: JSON.stringify({
          storeId: data.storeId,
          source: data.source,
          hasTriedOtherStores: data.hasTriedOtherStores,
          otherStoreNames: data.otherStoreNames,
          priceAwareness: data.priceAwareness,
          series: data.series,
          firmness: data.firmness,
          accessories: data.accessories,
          notes: data.notes,
          customerInfo: data.customerInfo,
        }),
        status: "pending",
        verificationPending: user.emailVerified ? 0 : 1,
        appointmentId,
        createdAt: now,
        updatedAt: now,
      };

      const appointmentPayload = {
        id: appointmentId,
        appointmentNumber,
        userId: user.id,
        customerInfo: JSON.stringify(data.customerInfo),
        storeLocation: data.storeId,
        preferredDate: "待確認",
        preferredTime: "待確認",
        productInterest: JSON.stringify({
          series: data.series,
          firmness: data.firmness,
          accessories: data.accessories,
        }),
        visitPurpose: "trial",
        status: "pending",
        notes: [
          data.notes,
          data.source ? `來源: ${data.source}` : "",
          data.hasTriedOtherStores
            ? `曾試躺其他門市: ${data.otherStoreNames || "是"}`
            : "",
          data.priceAwareness !== null && data.priceAwareness !== undefined
            ? `價格認知: ${data.priceAwareness ? "是" : "否"}`
            : "",
        ]
          .filter(Boolean)
          .join(" | "),
        createdAt: now,
        updatedAt: now,
      };

      const verificationPending = !user.emailVerified;

      // D1 doesn't support SQL transactions, use batch for atomic operations
      await db.insert(appointments).values(appointmentPayload);
      await db.insert(reservations).values(reservationPayload);

      // Send LINE notification
      try {
        const line = c.get("line");
        console.log(
          `[Reservation] Sending LINE notification for ${appointmentNumber}`
        );

        await line.sendAppointmentNotification({
          appointmentNumber,
          customerInfo: data.customerInfo,
          storeLocation: data.storeId,
          series: data.series || "未選擇系列",
          firmness: data.firmness,
          accessories: data.accessories,
          notes: data.notes,
          source: data.source,
          hasTriedOtherStores: data.hasTriedOtherStores,
          otherStoreNames: data.otherStoreNames,
          priceAwareness: data.priceAwareness,
        });
        console.log("[Reservation] LINE notification sent successfully");
      } catch (error) {
        console.error("Failed to send LINE notification:", error);
      }

      // Send email notifications
      try {
        const notification = c.get("notification");
        if (notification.isConfigured()) {
          // Get store info helper
          const storeMap: Record<
            string,
            { name: string; address: string; phone: string }
          > = {
            zhonghe: {
              name: "Black Living 黑哥居家 - 新北中和店",
              address: "新北市中和區景平路398號2樓",
              phone: "02-2940-8888",
            },
            kaohsiung: {
              name: "Black Living 黑哥居家 - 高雄店",
              address: "高雄市前鎮區...",
              phone: "07-xxx-xxxx",
            },
          };
          const storeInfo = storeMap[data.storeId] || {
            name: data.storeId,
            address: "",
            phone: "",
          };

          // Fetch notification settings
          const [settings] = await db
            .select()
            .from(notificationSettings)
            .limit(1);

          // Send customer confirmation email
          const isCustomerEnabled = settings?.enableAppointmentCustomer ?? true;

          if (isCustomerEnabled) {
            const customerEmailHtml = await render(
              AppointmentConfirmation({
                appointmentId: appointmentNumber,
                customerName: data.customerInfo.name,
                appointmentDate: "待確認",
                appointmentTime: "待確認",
                storeName: storeInfo.name,
                storeAddress: storeInfo.address,
                storePhone: storeInfo.phone,
                notes: data.notes || undefined,
                logoUrl: "https://www.blackliving.tw/blackliving-logo-zh.svg",
              })
            );

            await notification.sendCustomerNotification(
              "appointment_confirm",
              data.customerInfo.email,
              `[Black Living] 預約確認 - ${appointmentNumber}`,
              customerEmailHtml
            );
          }

          // Send admin notification email
          const isAdminEnabled = settings?.enableAppointmentAdmin ?? true;
          const adminEmails = (settings?.adminEmails as string[]) || [];

          if (isAdminEnabled && adminEmails.length > 0) {
            const adminEmailHtml = await render(
              AdminAppointment({
                appointmentId: appointmentNumber,
                customerName: data.customerInfo.name,
                customerEmail: data.customerInfo.email,
                customerPhone: data.customerInfo.phone,
                appointmentDate: "待確認",
                appointmentTime: "待確認",
                storeName: storeInfo.name,
                storeAddress: storeInfo.address,
                notes: data.notes || undefined,
                logoUrl: "https://www.blackliving.tw/blackliving-logo-zh.svg",
              })
            );

            await notification.sendAdminNotification(
              "new_appointment",
              adminEmails,
              `[新預約] ${data.customerInfo.name} - ${storeInfo.name}`,
              adminEmailHtml
            );
          }
        }
      } catch (error) {
        console.error("Failed to send appointment email notifications:", error);
      }

      // Re-fetch appointment to ensure data integrity
      const [createdReservation] = await db
        .select()
        .from(reservations)
        .where(
          sql`${reservations.id} = ${reservationId} AND ${reservations.userId} = ${user.id}`
        )
        .limit(1);

      return c.json(
        {
          success: true,
          data: {
            reservationId,
            appointmentId,
            appointmentNumber,
            verificationPending,
            status: "pending",
            createdAt: now.toISOString(),
            reservation: createdReservation,
          },
        },
        201
      );
    } catch (error) {
      console.error("Error creating reservation:", error);
      return c.json(
        { success: false, error: "建立預約時發生錯誤，請稍後再試" },
        500
      );
    }
  }
);

reservationsRouter.get("/my", async (c) => {
  try {
    const user = c.get("user");
    if (!user) {
      return c.json({ success: false, error: "Unauthorized" }, 401);
    }
    const db = c.get("db");

    const userAppointments = await db
      .select()
      .from(appointments)
      .where(eq(appointments.userId, user.id))
      .orderBy(desc(appointments.createdAt));

    const formattedAppointments = userAppointments.map((apt) => {
      let customerInfo = apt.customerInfo;
      try {
        if (typeof customerInfo === "string") {
          customerInfo = JSON.parse(customerInfo);
        }
      } catch {
        // keep as is if parse fails
      }

      let productInterest = apt.productInterest;
      try {
        if (typeof productInterest === "string") {
          productInterest = JSON.parse(productInterest);
        }
      } catch {
        // keep as is if parse fails
      }

      return {
        ...apt,
        customerInfo,
        productInterest,
      };
    });

    return c.json({ success: true, data: formattedAppointments });
  } catch (error) {
    console.error("Error fetching my reservations:", error);
    return c.json({ success: false, error: "無法載入預約列表" }, 500);
  }
});

reservationsRouter.patch("/:id/cancel", async (c) => {
  try {
    const user = c.get("user");
    if (!user) {
      return c.json({ success: false, error: "Unauthorized" }, 401);
    }
    const db = c.get("db");
    const id = c.req.param("id");

    // Update appointment
    const [updatedAppointment] = await db
      .update(appointments)
      .set({ status: "cancelled", updatedAt: new Date() })
      .where(and(eq(appointments.id, id), eq(appointments.userId, user.id)))
      .returning();

    if (!updatedAppointment) {
      return c.json({ success: false, error: "找不到該預約" }, 404);
    }

    // Update linked reservation
    await db
      .update(reservations)
      .set({ status: "cancelled", updatedAt: new Date() })
      .where(
        and(
          eq(reservations.appointmentId, id),
          eq(reservations.userId, user.id)
        )
      );

    return c.json({ success: true, data: updatedAppointment });
  } catch (error) {
    console.error("Error cancelling reservation:", error);
    return c.json({ success: false, error: "取消預約時發生錯誤" }, 500);
  }
});

export default reservationsRouter;

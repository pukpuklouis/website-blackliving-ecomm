import { appointments, reservations } from "@blackliving/db/schema";
import { zValidator } from "@hono/zod-validator";
import { createId } from "@paralleldrive/cuid2";
import { and, desc, eq, sql } from "drizzle-orm";
import { Hono } from "hono";
import { z } from "zod";
import type { Env } from "../index";

const reservationsRouter = new Hono<{
  Bindings: Env;
  Variables: {
    db: any;
    cache: any;
    user: any;
    line: any;
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

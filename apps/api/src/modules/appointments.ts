import { requireAdmin } from "@blackliving/auth";
import { notificationSettings } from "@blackliving/db/schema";
import {
  AdminAppointment,
  AppointmentConfirmation,
} from "@blackliving/email-templates";
import { zValidator } from "@hono/zod-validator";
import { render } from "@react-email/render";
import { Hono } from "hono";
import { z } from "zod";
import type { Env } from "../index";
import type { NotificationService } from "../utils/notification";

const appointments = new Hono<{
  Bindings: Env;
  Variables: {
    db: any;
    cache: any;
    storage: any;
    auth: any;
    user: any;
    session: any;
    notification: NotificationService;
  };
}>();

// Validation schemas
const createAppointmentSchema = z.object({
  storeId: z.string().min(1),
  productId: z.string().min(1),
  customerInfo: z.object({
    name: z.string().min(2, "姓名至少需要2個字符"),
    phone: z.string().min(10, "請輸入有效的電話號碼"),
    email: z.string().email("請輸入有效的Email地址"),
  }),
  preferredDate: z.string(), // YYYY-MM-DD
  preferredTime: z.string().min(1),
  message: z.string().default(""),
  createAccount: z.boolean().default(false),
  hasExistingAccount: z.boolean().default(false),
});

const updateAppointmentStatusSchema = z.object({
  status: z.enum(["pending", "confirmed", "completed", "cancelled", "no_show"]),
  adminNotes: z.string().optional(),
  staffAssigned: z.string().optional(),
});

const confirmAppointmentSchema = z.object({
  status: z.enum(["confirmed"]),
  confirmedDateTime: z.string().datetime(),
  adminNotes: z.string().optional(),
  staffAssigned: z.string().optional(),
});

const updateAppointmentSchema = z.object({
  preferredDate: z.string().optional(),
  preferredTime: z.string().optional(),
  storeLocation: z.string().optional(),
  notes: z.string().optional(),
  adminNotes: z.string().optional(),
  staffAssigned: z.string().optional(),
  status: z
    .enum(["pending", "confirmed", "completed", "cancelled", "no_show"])
    .optional(),
  customerInfo: z
    .object({
      name: z.string(),
      phone: z.string(),
      email: z.string().optional(),
    })
    .optional(),
  followUpRequired: z.boolean().optional(),
  followUpNotes: z.string().optional(),
});

// GET /api/appointments - List appointments (Admin only)
appointments.get("/", requireAdmin(), async (c) => {
  try {
    const { status, store, date, limit = "50", offset = "0" } = c.req.query();

    let query = "SELECT * FROM appointments WHERE 1=1";
    const params: any[] = [];

    if (status && status !== "all") {
      query += " AND status = ?";
      params.push(status);
    }

    if (store && store !== "all") {
      query += " AND store_location = ?";
      params.push(store);
    }

    if (date) {
      query += " AND DATE(preferred_date) = ?";
      params.push(date);
    }

    query += " ORDER BY preferred_date ASC, created_at DESC LIMIT ? OFFSET ?";
    const limitNum = Math.max(
      1,
      Math.min(1000, Number.parseInt(limit, 10) || 50)
    );
    const offsetNum = Math.max(0, Number.parseInt(offset, 10) || 0);
    params.push(limitNum, offsetNum);

    const result = await c.env.DB.prepare(query)
      .bind(...params)
      .all();

    // Parse JSON fields for each appointment
    // Debug log to see raw structure (helpful for troubleshooting)
    console.log("First appointment raw:", result.results[0]);

    const appointments = result.results.map((appointment: any) => {
      let customerInfo = { name: "未知客戶", phone: "無電話", email: "" };

      // Defensively try to find customer info in various forms
      let rawInfo = appointment.customer_info || appointment.customerInfo;

      try {
        if (rawInfo) {
          // Handle potential double-serialization (e.g. '"{\"name\"...}"')
          while (typeof rawInfo === "string") {
            try {
              const parsed = JSON.parse(rawInfo);
              rawInfo = parsed;
            } catch (e) {
              // If parsing fails, stop trying and use what we have (if it's not valid JSON)
              break;
            }
          }

          if (typeof rawInfo === "object" && rawInfo !== null) {
            customerInfo = { ...customerInfo, ...rawInfo };
          }
        }
      } catch (e) {
        console.error("Failed to parse customer_info", e);
      }

      let productInterest = [];
      try {
        let rawInterest =
          appointment.product_interest || appointment.productInterest;
        if (rawInterest) {
          // Handle potential double-serialization
          while (typeof rawInterest === "string") {
            try {
              const parsed = JSON.parse(rawInterest);
              rawInterest = parsed;
            } catch (e) {
              break;
            }
          }

          if (Array.isArray(rawInterest)) {
            productInterest = rawInterest;
          } else if (typeof rawInterest === "object" && rawInterest !== null) {
            // Handle case where product interest might be an object wrapping the array or usage
            productInterest = rawInterest;
          }
        }
      } catch (e) {
        console.error("Failed to parse product_interest", e);
      }

      return {
        id: appointment.id,
        appointmentNumber: appointment.appointment_number || "N/A",
        storeLocation: appointment.store_location || "unknown",
        // Pass null if preferred_date is invalid or missing, to be handled by frontend
        preferredDate: appointment.preferred_date || null,
        preferredTime: appointment.preferred_time || "morning",
        visitPurpose: appointment.visit_purpose || "trial",
        status: appointment.status || "pending",
        notes: appointment.notes || "",
        adminNotes: appointment.admin_notes || "",
        staffAssigned: appointment.staff_assigned,
        customerInfo,
        productInterest,
        createdAt: appointment.created_at
          ? new Date(appointment.created_at)
          : new Date(),
        updatedAt: appointment.updated_at
          ? new Date(appointment.updated_at)
          : new Date(),
        confirmedDateTime: appointment.confirmed_datetime
          ? new Date(appointment.confirmed_datetime)
          : null,
        actualVisitTime: appointment.actual_visit_time
          ? new Date(appointment.actual_visit_time)
          : null,
        completedAt: appointment.completed_at
          ? new Date(appointment.completed_at)
          : null,
        followUpRequired: !!appointment.follow_up_required,
        followUpNotes: appointment.follow_up_notes || "",
      };
    });

    return c.json({
      success: true,
      data: { appointments },
      total: appointments.length,
    });
  } catch (error) {
    console.error("Error fetching appointments:", error);
    return c.json({ error: "Failed to fetch appointments" }, 500);
  }
});

// GET /api/appointments/:id - Get single appointment
appointments.get("/:id", async (c) => {
  try {
    const id = c.req.param("id");

    const result = await c.env.DB.prepare(
      "SELECT * FROM appointments WHERE id = ?"
    )
      .bind(id)
      .first();

    if (!result) {
      return c.json({ error: "Appointment not found" }, 404);
    }

    // Transform snake_case to camelCase and parse JSON
    const data = {
      ...result,
      customerInfo: JSON.parse(result.customer_info || "{}"),
      productInterest: JSON.parse(result.product_interest || "[]"),
      createdAt: new Date(result.created_at),
      updatedAt: new Date(result.updated_at),
    };

    return c.json({
      success: true,
      data,
    });
  } catch (error) {
    console.error("Error fetching appointment:", error);
    return c.json({ error: "Failed to fetch appointment" }, 500);
  }
});

// POST /api/appointments - Create new appointment
appointments.post(
  "/",
  zValidator("json", createAppointmentSchema),
  async (c) => {
    try {
      const data = c.req.valid("json");

      // Generate appointment number: AP + YYYYMMDD + sequence
      const today = new Date();
      const dateStr =
        today.getFullYear().toString() +
        (today.getMonth() + 1).toString().padStart(2, "0") +
        today.getDate().toString().padStart(2, "0");
      const appointmentNumber = `AP${dateStr}${Math.random().toString(36).substr(2, 4).toUpperCase()}`;

      const now = Date.now();

      const appointmentId = crypto.randomUUID();

      await c.env.DB.prepare(
        `
        INSERT INTO appointments (
          id, appointment_number, customer_info, store_location, preferred_date, 
          preferred_time, product_interest, visit_purpose, status, notes, 
          created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `
      )
        .bind(
          appointmentId,
          appointmentNumber,
          JSON.stringify(data.customerInfo),
          data.storeId,
          data.preferredDate,
          data.preferredTime,
          JSON.stringify([data.productId]),
          "trial",
          "pending",
          data.message,
          now,
          now
        )
        .run();

      // Fetch product details for notification
      const product = await c.env.DB.prepare(
        "SELECT * FROM products WHERE id = ?"
      )
        .bind(data.productId)
        .first();

      console.log(
        `[Appointment] Found product for notification: ${product?.name || "Unknown"}`
      );

      // Send LINE notification
      try {
        const line = c.get("line");
        console.log(
          `[Appointment] Sending LINE notification for ${appointmentNumber}`
        );
        await line.sendAppointmentNotification({
          appointmentNumber,
          customerInfo: data.customerInfo,
          storeLocation: data.storeId,
          series: (product?.name as string) || "未知產品", // Use product name as series for visibility
          firmness: null, // Product table doesn't have explicit firmness column
          accessories: [],
          notes: data.message,
          // Survey fields are not present in create schema yet
          source: null,
          hasTriedOtherStores: null,
          otherStoreNames: undefined,
          priceAwareness: null,
        });
        console.log("[Appointment] LINE notification sent successfully");
      } catch (error) {
        console.error("Failed to send LINE notification:", error);
        // Don't fail the request if notification fails
      }

      // Send email notifications
      try {
        const notification = c.get("notification");
        if (notification.isConfigured()) {
          const storeInfo = getStoreInfo(data.storeId);

          // Fetch notification settings
          const settingsResult = await c.env.DB.prepare(
            "SELECT * FROM notification_settings LIMIT 1"
          ).first();

          // Send customer confirmation email
          const isCustomerEnabled =
            (settingsResult as { enable_appointment_customer?: boolean })
              ?.enable_appointment_customer ?? true;

          if (isCustomerEnabled) {
            const customerEmailHtml = await render(
              AppointmentConfirmation({
                appointmentId: appointmentNumber,
                customerName: data.customerInfo.name,
                appointmentDate: data.preferredDate,
                appointmentTime: data.preferredTime,
                storeName: storeInfo.name,
                storeAddress: storeInfo.address,
                storePhone: storeInfo.phone,
                notes: data.message || undefined,
                logoUrl: "https://www.blackliving.tw/blackliving-logo-zh.svg",
              })
            );

            await notification.sendCustomerNotification(
              "appointment_confirm",
              data.customerInfo.email,
              `[Black Living] 預約確認 - ${data.preferredDate} ${data.preferredTime}`,
              customerEmailHtml
            );
          }

          // Send admin notification email
          const isAdminEnabled =
            (settingsResult as { enable_appointment_admin?: boolean })
              ?.enable_appointment_admin ?? true;
          const adminEmails =
            (settingsResult as { admin_emails?: string[] })?.admin_emails || [];

          if (isAdminEnabled && adminEmails.length > 0) {
            const adminEmailHtml = await render(
              AdminAppointment({
                appointmentId: appointmentNumber,
                customerName: data.customerInfo.name,
                customerEmail: data.customerInfo.email,
                customerPhone: data.customerInfo.phone,
                appointmentDate: data.preferredDate,
                appointmentTime: data.preferredTime,
                storeName: storeInfo.name,
                storeAddress: storeInfo.address,
                notes: data.message || undefined,
                logoUrl: "https://www.blackliving.tw/blackliving-logo-zh.svg",
              })
            );

            await notification.sendAdminNotification(
              "new_appointment",
              adminEmails,
              `[新預約] ${data.customerInfo.name} - ${data.preferredDate} ${data.preferredTime}`,
              adminEmailHtml
            );
          }
        }
      } catch (error) {
        console.error("Failed to send appointment email notifications:", error);
        // Don't fail the request if notification fails
      }

      return c.json(
        {
          success: true,
          data: {
            appointmentId,
            appointmentNumber,
            status: "pending",
            message: "預約已送出，我們將在24小時內與您聯繫確認時間",
            storeInfo: getStoreInfo(data.storeId),
          },
        },
        201
      );
    } catch (error) {
      console.error("Error creating appointment:", error);
      return c.json({ error: "Failed to create appointment" }, 500);
    }
  }
);

// PATCH /api/appointments/:id/status - Update appointment status (Admin only)
appointments.patch(
  "/:id/status",
  requireAdmin(),
  zValidator("json", updateAppointmentStatusSchema),
  async (c) => {
    try {
      const id = c.req.param("id");
      const { status, adminNotes, staffAssigned } = c.req.valid("json");

      const now = Date.now();
      let updateQuery = "UPDATE appointments SET status = ?, updated_at = ?";
      const params = [status, now];

      if (adminNotes !== undefined) {
        updateQuery += ", admin_notes = ?";
        params.push(adminNotes);
      }

      if (staffAssigned !== undefined) {
        updateQuery += ", staff_assigned = ?";
        params.push(staffAssigned);
      }

      // Set completed_at when status becomes completed
      if (status === "completed") {
        updateQuery += ", completed_at = ?";
        params.push(now);
      }

      updateQuery += " WHERE id = ?";
      params.push(id);

      const result = await c.env.DB.prepare(updateQuery)
        .bind(...params)
        .run();

      if (result.changes === 0) {
        return c.json({ error: "Appointment not found" }, 404);
      }

      // Send status update notification (implement later)
      // await sendAppointmentStatusUpdate(id, status);

      return c.json({
        success: true,
        message: "Appointment status updated successfully",
      });
    } catch (error) {
      console.error("Error updating appointment status:", error);
      return c.json({ error: "Failed to update appointment status" }, 500);
    }
  }
);

// PATCH /api/appointments/:id/confirm - Confirm appointment (Admin only)
appointments.patch(
  "/:id/confirm",
  requireAdmin(),
  zValidator("json", confirmAppointmentSchema),
  async (c) => {
    try {
      const id = c.req.param("id");
      const { status, confirmedDateTime, adminNotes, staffAssigned } =
        c.req.valid("json");

      const now = Date.now();
      const confirmedTime = new Date(confirmedDateTime).getTime();

      let updateQuery = `
        UPDATE appointments 
        SET status = ?, confirmed_datetime = ?, updated_at = ?
      `;
      const params = [status, confirmedTime, now];

      if (adminNotes !== undefined) {
        updateQuery += ", admin_notes = ?";
        params.push(adminNotes);
      }

      if (staffAssigned !== undefined) {
        updateQuery += ", staff_assigned = ?";
        params.push(staffAssigned);
      }

      updateQuery += " WHERE id = ?";
      params.push(id);

      const result = await c.env.DB.prepare(updateQuery)
        .bind(...params)
        .run();

      if (result.changes === 0) {
        return c.json({ error: "Appointment not found" }, 404);
      }

      // Send confirmation email to customer (Story 5.3)
      const notification = c.get("notification");
      if (notification.isConfigured()) {
        // Fetch appointment details
        const appointment = await c.env.DB.prepare(
          "SELECT * FROM appointments WHERE id = ?"
        )
          .bind(id)
          .first();

        if (appointment) {
          const customerInfo = JSON.parse(
            appointment.customer_info || "{}"
          ) as { name: string; email: string };
          const storeInfo = getStoreInfo(appointment.store_location);
          const confirmedDate = new Date(confirmedDateTime);

          // Check if appointment notification is enabled
          const db = c.get("db");
          const [settings] = await db
            .select()
            .from(notificationSettings)
            .limit(1);
          const isEnabled = settings?.enableAppointmentCustomer ?? true;

          if (isEnabled && customerInfo.email && storeInfo) {
            const emailHtml = await render(
              AppointmentConfirmation({
                appointmentId: appointment.appointment_number,
                customerName: customerInfo.name,
                appointmentDate: confirmedDate.toLocaleDateString("zh-TW", {
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                  weekday: "long",
                }),
                appointmentTime: confirmedDate.toLocaleTimeString("zh-TW", {
                  hour: "2-digit",
                  minute: "2-digit",
                }),
                storeName: storeInfo.name,
                storeAddress: storeInfo.address,
                storePhone: storeInfo.phone,
                googleMapsUrl: `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(storeInfo.address)}`,
                notes: appointment.notes || undefined,
              })
            );

            await notification.sendCustomerNotification(
              "appointment_confirmed",
              customerInfo.email,
              `[Black Living] 預約已確認 #${appointment.appointment_number}`,
              emailHtml
            );
          }
        }
      }

      return c.json({
        success: true,
        message: "Appointment confirmed successfully",
      });
    } catch (error) {
      console.error("Error confirming appointment:", error);
      return c.json({ error: "Failed to confirm appointment" }, 500);
    }
  }
);

// PATCH /api/appointments/:id - Generic Update (Admin only)
appointments.patch(
  "/:id",
  requireAdmin(),
  zValidator("json", updateAppointmentSchema),
  async (c) => {
    try {
      const id = c.req.param("id");
      const data = c.req.valid("json");

      const now = Date.now();
      let updateQuery = "UPDATE appointments SET updated_at = ?";
      const params: any[] = [now];

      if (data.preferredDate !== undefined) {
        updateQuery += ", preferred_date = ?";
        params.push(data.preferredDate);
      }
      if (data.preferredTime !== undefined) {
        updateQuery += ", preferred_time = ?";
        params.push(data.preferredTime);
      }
      if (data.storeLocation !== undefined) {
        updateQuery += ", store_location = ?";
        params.push(data.storeLocation);
      }
      if (data.notes !== undefined) {
        updateQuery += ", notes = ?";
        params.push(data.notes);
      }
      if (data.adminNotes !== undefined) {
        updateQuery += ", admin_notes = ?";
        params.push(data.adminNotes);
      }
      if (data.staffAssigned !== undefined) {
        updateQuery += ", staff_assigned = ?";
        params.push(data.staffAssigned);
      }
      if (data.status !== undefined) {
        updateQuery += ", status = ?";
        params.push(data.status);
      }
      if (data.customerInfo !== undefined) {
        updateQuery += ", customer_info = ?";
        params.push(JSON.stringify(data.customerInfo));
      }
      if (data.followUpRequired !== undefined) {
        updateQuery += ", follow_up_required = ?";
        params.push(data.followUpRequired ? 1 : 0);
      }
      if (data.followUpNotes !== undefined) {
        updateQuery += ", follow_up_notes = ?";
        params.push(data.followUpNotes);
      }

      updateQuery += " WHERE id = ?";
      params.push(id);

      const result = await c.env.DB.prepare(updateQuery)
        .bind(...params)
        .run();

      if (result.changes === 0) {
        return c.json({ error: "Appointment not found" }, 404);
      }

      return c.json({
        success: true,
        message: "Appointment updated successfully",
      });
    } catch (error) {
      console.error("Error updating appointment:", error);
      return c.json({ error: "Failed to update appointment" }, 500);
    }
  }
);

// GET /api/appointments/customer/:phone - Get customer appointments
appointments.get("/customer/:phone", async (c) => {
  try {
    // TODO: Add authentication middleware to ensure user can only access their own appointments
    const phone = c.req.param("phone");

    const result = await c.env.DB.prepare(
      `
      SELECT * FROM appointments 
      WHERE JSON_EXTRACT(customer_info, '$.phone') = ?
      ORDER BY preferred_date DESC
    `
    )
      .bind(phone)
      .all();

    return c.json({
      success: true,
      data: result.results,
    });
  } catch (error) {
    console.error("Error fetching customer appointments:", error);
    return c.json({ error: "Failed to fetch appointments" }, 500);
  }
});

// GET /api/appointments/availability/:store/:date - Check availability
appointments.get("/availability/:store/:date", (c) => {
  try {
    const store = c.req.param("store");
    const date = c.req.param("date");

    // Availability is checked by admin manually
    // We always return availability options to the frontend
    const availability = {
      morning: 5,
      afternoon: 5,
      evening: 3,
    };

    return c.json({
      success: true,
      data: {
        date,
        store,
        availability,
      },
    });
  } catch (error) {
    console.error("Error checking availability:", error);
    return c.json({ error: "Failed to check availability" }, 500);
  }
});

// Helper function to get store information
function getStoreInfo(location: string) {
  const stores = {
    zhonghe: {
      name: "Black Living 中和館",
      address: "新北市中和區景平路398號2樓",
      phone: "02-1234-5678",
      hours: "週一至週日 10:00-21:00",
    },
    zhongli: {
      name: "Black Living 桃園館",
      address: "桃園市中壢區義民路91號",
      phone: "03-1234-5678",
      hours: "週一至週日 10:00-21:00",
    },
  };

  return stores[location as keyof typeof stores];
}

export default appointments;

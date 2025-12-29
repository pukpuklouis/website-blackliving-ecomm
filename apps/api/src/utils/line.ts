import type { createDB } from "@blackliving/db";
import { settings } from "@blackliving/db/schema";
import { eq } from "drizzle-orm";
import { z } from "zod";
import type { Env } from "../index";

// Simple logger - can be replaced with proper logging library later
const logger = {
  warn: (message: string, ...args: unknown[]) => {
    console.warn(`[LINE] ${message}`, ...args);
  },
  error: (message: string, ...args: unknown[]) => {
    console.error(`[LINE] ${message}`, ...args);
  },
};

type Database = ReturnType<typeof createDB>;

const lineSettingsSchema = z.object({
  channelAccessToken: z.string().min(1, "Channel access token is required"),
  adminUserId: z.string().min(1, "Admin user ID is required"),
});

export class LineNotificationService {
  private channelAccessToken: string;
  private adminUserId: string;
  private readonly db?: Database;
  private settingsLoaded = false;
  private readonly rateLimitMap = new Map<
    string,
    { count: number; resetTime: number }
  >();
  private readonly rateLimitWindow = 60 * 1000; // 1 minute
  private readonly rateLimitMax = 10; // 10 calls per minute
  private storeNamesCache: Record<string, string> | null = null;
  private storeNamesLoaded = false;

  constructor(env: Env, db?: Database) {
    // Fallback to environment variables
    this.channelAccessToken = env.LINE_CHANNEL_ACCESS_TOKEN || "";
    this.adminUserId = env.LINE_ADMIN_USER_ID || "";
    this.db = db;
  }

  private async loadSettings(): Promise<void> {
    if (this.settingsLoaded || !this.db) {
      return;
    }

    try {
      const [setting] = await this.db
        .select()
        .from(settings)
        .where(eq(settings.key, "line_notification"))
        .limit(1);

      if (setting?.value) {
        const validationResult = lineSettingsSchema.safeParse(setting.value);
        if (validationResult.success) {
          const lineSettings = validationResult.data;
          this.channelAccessToken = lineSettings.channelAccessToken;
          this.adminUserId = lineSettings.adminUserId;
        } else {
          logger.warn("Invalid LINE settings format", validationResult.error);
        }
      }
    } catch (error) {
      logger.warn("Failed to load LINE settings from database", error);
    }

    this.settingsLoaded = true;
  }

  private async loadStoreNames(): Promise<void> {
    if (this.storeNamesLoaded || !this.db) {
      return;
    }

    try {
      const [setting] = await this.db
        .select()
        .from(settings)
        .where(eq(settings.key, "store_names"))
        .limit(1);

      if (setting?.value && typeof setting.value === "object") {
        this.storeNamesCache = setting.value as Record<string, string>;
      } else {
        // Fallback to hardcoded values if not configured
        this.storeNamesCache = {
          zhonghe: "中和門市",
          zhongli: "中壢門市",
        };
      }
    } catch (error) {
      logger.warn("Failed to load store names from database", error);
      // Fallback to hardcoded values
      this.storeNamesCache = {
        zhonghe: "中和門市",
        zhongli: "中壢門市",
      };
    }

    this.storeNamesLoaded = true;
  }

  private checkRateLimit(): boolean {
    const now = Date.now();
    const key = "line_api_calls";
    const current = this.rateLimitMap.get(key);

    if (!current || now > current.resetTime) {
      // Reset window
      this.rateLimitMap.set(key, {
        count: 1,
        resetTime: now + this.rateLimitWindow,
      });
      return true;
    }

    if (current.count >= this.rateLimitMax) {
      return false; // Rate limit exceeded
    }

    current.count += 1;
    return true;
  }

  private async sendPushMessage(to: string, messages: unknown[]) {
    await this.loadSettings();

    if (!this.channelAccessToken) {
      logger.warn("LINE_CHANNEL_ACCESS_TOKEN is not configured");
      return;
    }

    // Check rate limit
    if (!this.checkRateLimit()) {
      logger.warn("LINE API rate limit exceeded, skipping message");
      return;
    }

    try {
      const response = await fetch("https://api.line.me/v2/bot/message/push", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${this.channelAccessToken}`,
        },
        body: JSON.stringify({
          to,
          messages,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        logger.error("Failed to send LINE message", error);
      }
    } catch (error) {
      logger.error("Error sending LINE message", error);
    }
  }

  private createInfoBox(label: string, value: string) {
    return {
      type: "box",
      layout: "baseline",
      spacing: "sm",
      contents: [
        { type: "text", text: label, color: "#aaaaaa", size: "sm", flex: 2 },
        {
          type: "text",
          text: value,
          wrap: true,
          color: "#333333",
          size: "sm",
          flex: 5,
        },
      ],
    };
  }

  private buildCustomerInfoSection(
    customerInfo: { name: string; phone: string; email: string },
    storeName: string
  ) {
    return [
      this.createInfoBox("客戶", customerInfo.name),
      this.createInfoBox("電話", customerInfo.phone),
      this.createInfoBox("Email", customerInfo.email),
      this.createInfoBox("門市", storeName),
    ];
  }

  private buildProductPreferencesSection(appointment: {
    series?: string | null;
    firmness?: string | null;
    accessories?: string[];
  }) {
    const rows: unknown[] = [
      { type: "separator", margin: "lg" },
      {
        type: "text",
        text: "產品偏好",
        weight: "bold",
        size: "sm",
        color: "#1DB446",
        margin: "lg",
      },
    ];

    if (appointment.series) {
      rows.push(this.createInfoBox("系列", appointment.series));
    }

    if (appointment.firmness) {
      rows.push(this.createInfoBox("軟硬", appointment.firmness));
    }

    if (appointment.accessories && appointment.accessories.length > 0) {
      const accessoriesText = appointment.accessories
        .filter((a) => a !== "無")
        .join("、");
      if (accessoriesText) {
        rows.push(this.createInfoBox("配件", accessoriesText));
      }
    }

    return rows;
  }

  private buildSurveyDataSection(appointment: {
    source?: string | null;
    hasTriedOtherStores?: boolean | null;
    otherStoreNames?: string;
    priceAwareness?: boolean | null;
  }) {
    const rows: unknown[] = [
      { type: "separator", margin: "lg" },
      {
        type: "text",
        text: "調查資訊",
        weight: "bold",
        size: "sm",
        color: "#1DB446",
        margin: "lg",
      },
    ];

    if (appointment.source) {
      rows.push(this.createInfoBox("來源", appointment.source));
    }

    if (appointment.hasTriedOtherStores !== null) {
      let otherStoresText = appointment.hasTriedOtherStores ? "是" : "否";
      if (
        appointment.hasTriedOtherStores &&
        appointment.otherStoreNames?.trim()
      ) {
        otherStoresText += ` (${appointment.otherStoreNames})`;
      }
      rows.push(this.createInfoBox("他牌經驗", otherStoresText));
    }

    if (appointment.priceAwareness !== null) {
      const priceText = appointment.priceAwareness ? "了解價位" : "尚未了解";
      rows.push(this.createInfoBox("價格認知", priceText));
    }

    return rows;
  }

  private buildNotesSection(notes?: string) {
    if (!notes?.trim()) {
      return [];
    }

    return [
      { type: "separator", margin: "lg" },
      {
        type: "text",
        text: "備註",
        weight: "bold",
        size: "sm",
        color: "#1DB446",
        margin: "lg",
      },
      {
        type: "text",
        text: notes,
        wrap: true,
        color: "#666666",
        size: "sm",
        margin: "sm",
      },
    ];
  }

  async sendAppointmentNotification(appointment: {
    appointmentNumber: string;
    customerInfo: string | { name: string; phone: string; email: string };
    storeLocation: string;
    series?: string | null;
    firmness?: string | null;
    accessories?: string[];
    source?: string | null;
    hasTriedOtherStores?: boolean | null;
    otherStoreNames?: string;
    priceAwareness?: boolean | null;
    notes?: string;
  }) {
    await this.loadSettings();

    if (!this.adminUserId) {
      logger.warn("LINE_ADMIN_USER_ID is not configured");
      return;
    }

    let customerInfo: { name: string; phone: string; email: string };
    if (typeof appointment.customerInfo === "string") {
      try {
        customerInfo = JSON.parse(appointment.customerInfo);
      } catch (error) {
        logger.error("Failed to parse customer info", error);
        customerInfo = { name: "解析錯誤", phone: "", email: "" };
      }
    } else {
      customerInfo = appointment.customerInfo;
    }

    // Load store names from database
    await this.loadStoreNames();
    const storeName =
      this.storeNamesCache?.[appointment.storeLocation] ||
      appointment.storeLocation;

    // Build info rows using helper functions
    const infoRows: unknown[] = [
      ...this.buildCustomerInfoSection(customerInfo, storeName),
      ...this.buildProductPreferencesSection(appointment),
      ...this.buildSurveyDataSection(appointment),
      ...this.buildNotesSection(appointment.notes),
    ];

    const message = {
      type: "flex",
      altText: `收到新的預約通知 - ${appointment.appointmentNumber}`,
      contents: {
        type: "bubble",
        header: {
          type: "box",
          layout: "vertical",
          backgroundColor: "#1DB446",
          paddingAll: "20px",
          contents: [
            {
              type: "text",
              text: "🛏️ 新預約通知",
              weight: "bold",
              color: "#ffffff",
              size: "lg",
            },
            {
              type: "text",
              text: appointment.appointmentNumber,
              weight: "bold",
              size: "xxl",
              color: "#ffffff",
              margin: "sm",
            },
            {
              type: "text",
              text: "待確認",
              size: "xs",
              color: "#ffffff",
              margin: "sm",
            },
          ],
        },
        body: {
          type: "box",
          layout: "vertical",
          contents: infoRows,
        },
        footer: {
          type: "box",
          layout: "vertical",
          spacing: "sm",
          contents: [
            {
              type: "text",
              text: new Date().toLocaleString("zh-TW", {
                timeZone: "Asia/Taipei",
              }),
              size: "xs",
              color: "#aaaaaa",
              align: "center",
            },
          ],
        },
      },
    };

    await this.sendPushMessage(this.adminUserId, [message]);
  }

  async sendCancellationNotification(appointment: {
    appointmentNumber: string;
    customerInfo?: string | { name: string };
  }) {
    await this.loadSettings();

    if (!this.adminUserId) {
      return;
    }

    let customerInfo: { name: string } | undefined;
    if (typeof appointment.customerInfo === "string") {
      try {
        customerInfo = JSON.parse(appointment.customerInfo);
      } catch (error) {
        logger.error("Failed to parse customer info", error);
        customerInfo = { name: "解析錯誤" };
      }
    } else {
      customerInfo = appointment.customerInfo;
    }

    const customerName = customerInfo?.name || "未知客戶";

    const message = {
      type: "flex",
      altText: `預約已取消 - ${appointment.appointmentNumber}`,
      contents: {
        type: "bubble",
        header: {
          type: "box",
          layout: "vertical",
          backgroundColor: "#FF6B6B",
          paddingAll: "20px",
          contents: [
            {
              type: "text",
              text: "⚠️ 預約已取消",
              weight: "bold",
              color: "#ffffff",
              size: "lg",
            },
            {
              type: "text",
              text: appointment.appointmentNumber,
              weight: "bold",
              size: "xl",
              color: "#ffffff",
              margin: "sm",
            },
          ],
        },
        body: {
          type: "box",
          layout: "vertical",
          contents: [
            {
              type: "box",
              layout: "baseline",
              spacing: "sm",
              contents: [
                {
                  type: "text",
                  text: "客戶",
                  color: "#aaaaaa",
                  size: "sm",
                  flex: 2,
                },
                {
                  type: "text",
                  text: customerName,
                  wrap: true,
                  color: "#333333",
                  size: "sm",
                  flex: 5,
                },
              ],
            },
            {
              type: "box",
              layout: "baseline",
              spacing: "sm",
              margin: "md",
              contents: [
                {
                  type: "text",
                  text: "原因",
                  color: "#aaaaaa",
                  size: "sm",
                  flex: 2,
                },
                {
                  type: "text",
                  text: "用戶自行取消",
                  wrap: true,
                  color: "#333333",
                  size: "sm",
                  flex: 5,
                },
              ],
            },
          ],
        },
        footer: {
          type: "box",
          layout: "vertical",
          spacing: "sm",
          contents: [
            {
              type: "text",
              text: new Date().toLocaleString("zh-TW", {
                timeZone: "Asia/Taipei",
              }),
              size: "xs",
              color: "#aaaaaa",
              align: "center",
            },
          ],
        },
      },
    };

    await this.sendPushMessage(this.adminUserId, [message]);
  }

  async sendTestNotification(): Promise<{ success: boolean; error?: any }> {
    await this.loadSettings();

    if (!(this.adminUserId && this.channelAccessToken)) {
      return {
        success: false,
        error: "Settings not configured (Missing ID or Token)",
      };
    }

    const message = {
      type: "flex",
      altText: "LINE 通知測試",
      contents: {
        type: "bubble",
        body: {
          type: "box",
          layout: "vertical",
          contents: [
            {
              type: "text",
              text: "✅ LINE 通知測試成功",
              weight: "bold",
              size: "lg",
              color: "#1DB446",
            },
            {
              type: "text",
              text: "您的 LINE 通知設定已正確配置，當有新預約時會收到通知。",
              wrap: true,
              color: "#666666",
              size: "sm",
              margin: "md",
            },
            {
              type: "text",
              text: new Date().toLocaleString("zh-TW", {
                timeZone: "Asia/Taipei",
              }),
              size: "xs",
              color: "#aaaaaa",
              margin: "lg",
            },
          ],
        },
      },
    };

    try {
      const response = await fetch("https://api.line.me/v2/bot/message/push", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${this.channelAccessToken}`,
        },
        body: JSON.stringify({
          to: this.adminUserId,
          messages: [message],
        }),
      });

      if (response.ok) {
        return { success: true };
      }

      const errorData = await response.json();
      logger.error("Test notification failed", errorData);
      return { success: false, error: errorData };
    } catch (error) {
      logger.error("Test notification network error", error);
      return { success: false, error: "Network or unknown error" };
    }
  }
}

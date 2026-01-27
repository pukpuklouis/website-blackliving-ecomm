import type { createDB } from "@blackliving/db";
import { emailLogs } from "@blackliving/db/schema";
import type { Env } from "../index";

/**
 * Email notification types for the system
 */
type NotificationType =
  | "new_order"
  | "payment_complete"
  | "order_shipped"
  | "bank_transfer_confirm"
  | "appointment_confirmed"
  | "payment_reminder"
  | "test";

type SendEmailOptions = {
  to: string | string[];
  subject: string;
  html: string;
  replyTo?: string;
  type?: NotificationType;
  relatedId?: string;
  relatedType?: string;
};

type SendEmailResult = {
  success: boolean;
  messageId?: string;
  error?: string;
  retryCount?: number;
};

type NotificationResult = {
  success: boolean;
  type: NotificationType;
  recipient: string;
  error?: string;
};

// Retry configuration
const MAX_RETRIES = 3;
const BASE_DELAY_MS = 1000; // 1 second

// Simple logger for notification service
const logger = {
  info: (message: string, ...args: unknown[]) => {
    console.log(`[NotificationService] ${message}`, ...args);
  },
  warn: (message: string, ...args: unknown[]) => {
    console.warn(`[NotificationService] ${message}`, ...args);
  },
  error: (message: string, ...args: unknown[]) => {
    console.error(`[NotificationService] ${message}`, ...args);
  },
};

/**
 * Email validation regex - at top level for performance
 */
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * Simple email validation - checks basic format
 */
function isValidEmail(email: string): boolean {
  return EMAIL_REGEX.test(email);
}

/**
 * Filter and validate email addresses
 */
function validateRecipients(emails: string[]): {
  valid: string[];
  invalid: string[];
} {
  const valid: string[] = [];
  const invalid: string[] = [];
  for (const email of emails) {
    if (isValidEmail(email.trim())) {
      valid.push(email.trim());
    } else {
      invalid.push(email);
    }
  }
  return { valid, invalid };
}

/**
 * Sleep function for retry delays
 */
function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * NotificationService handles email sending via Resend API.
 *
 * Features:
 * - Retry with exponential backoff (3 attempts)
 * - Email logging to database
 * - Non-blocking fire-and-forget methods
 */
export class NotificationService {
  private readonly resendApiKey: string;
  private readonly fromEmail: string;
  private readonly db: ReturnType<typeof createDB> | null;

  constructor(env: Env, db?: ReturnType<typeof createDB>) {
    this.resendApiKey = env.RESEND_API_KEY || "";
    this.fromEmail = env.RESEND_FROM_EMAIL || "noreply@blackliving.tw";
    this.db = db || null;
  }

  /**
   * Check if the service is properly configured
   */
  isConfigured(): boolean {
    return Boolean(this.resendApiKey);
  }

  /**
   * Log email attempt to database
   */
  private async logEmail(
    type: NotificationType,
    recipient: string,
    subject: string,
    status: "pending" | "sent" | "failed",
    options: {
      messageId?: string;
      errorMessage?: string;
      retryCount?: number;
      relatedId?: string;
      relatedType?: string;
    } = {}
  ): Promise<void> {
    if (!this.db) {
      return;
    }

    try {
      await this.db.insert(emailLogs).values({
        type,
        recipient,
        subject,
        status,
        messageId: options.messageId,
        errorMessage: options.errorMessage,
        retryCount: options.retryCount ?? 0,
        relatedId: options.relatedId,
        relatedType: options.relatedType,
        sentAt: status === "sent" ? new Date() : undefined,
      });
    } catch (error) {
      logger.error("Failed to log email:", error);
    }
  }

  /**
   * Send an email via Resend API with retry logic.
   * Retries up to 3 times with exponential backoff.
   */
  async sendEmail(options: SendEmailOptions): Promise<SendEmailResult> {
    if (!this.isConfigured()) {
      logger.warn("Resend API key not configured, skipping email send");
      return { success: false, error: "Email service not configured" };
    }

    const rawRecipients = Array.isArray(options.to) ? options.to : [options.to];
    const { valid: recipients, invalid } = validateRecipients(rawRecipients);

    if (invalid.length > 0) {
      logger.warn("Invalid email addresses filtered out:", invalid);
    }

    if (recipients.length === 0) {
      logger.error("No valid recipients to send email to");
      return { success: false, error: "No valid recipients" };
    }

    let lastError = "";
    let retryCount = 0;

    // Retry loop with exponential backoff
    for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
      retryCount = attempt;

      try {
        const response = await fetch("https://api.resend.com/emails", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${this.resendApiKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            from: this.fromEmail,
            to: recipients,
            subject: options.subject,
            html: options.html,
            reply_to: options.replyTo,
          }),
        });

        if (response.ok) {
          const data = (await response.json()) as { id?: string };
          logger.info("Email sent successfully:", {
            messageId: data.id,
            recipients,
            retryCount,
          });

          // Log success
          for (const recipient of recipients) {
            await this.logEmail(
              options.type || "new_order",
              recipient,
              options.subject,
              "sent",
              {
                messageId: data.id,
                retryCount,
                relatedId: options.relatedId,
                relatedType: options.relatedType,
              }
            );
          }

          return { success: true, messageId: data.id, retryCount };
        }

        const errorData = await response.json().catch(() => ({}));
        lastError =
          (errorData as { message?: string }).message ||
          `HTTP ${response.status}`;
        logger.error(`Resend API error (attempt ${attempt + 1}):`, lastError);
      } catch (error) {
        lastError = error instanceof Error ? error.message : "Unknown error";
        logger.error(
          `Failed to send email (attempt ${attempt + 1}):`,
          lastError
        );
      }

      // Don't sleep after the last attempt
      if (attempt < MAX_RETRIES) {
        const delay = BASE_DELAY_MS * 2 ** attempt; // Exponential backoff
        logger.info(`Retrying in ${delay}ms...`);
        await sleep(delay);
      }
    }

    // Log failure after all retries exhausted
    for (const recipient of recipients) {
      await this.logEmail(
        options.type || "new_order",
        recipient,
        options.subject,
        "failed",
        {
          errorMessage: lastError,
          retryCount,
          relatedId: options.relatedId,
          relatedType: options.relatedType,
        }
      );
    }

    return { success: false, error: lastError, retryCount };
  }

  /**
   * Send a customer notification email (fire and forget).
   * This method does NOT block the calling function on failure.
   */
  async sendCustomerNotification(
    type: NotificationType,
    to: string,
    subject: string,
    html: string,
    relatedId?: string,
    relatedType?: string
  ): Promise<SendEmailResult> {
    logger.info(
      `sendCustomerNotification called: type=${type}, to=${to}, subject=${subject}`
    );

    try {
      const result = await this.sendEmail({
        to,
        subject,
        html,
        type,
        relatedId,
        relatedType,
      });
      if (result.success) {
        logger.info(
          `Customer notification [${type}] sent to ${to} (${result.retryCount} retries)`
        );
      } else {
        logger.error(
          `Customer notification [${type}] failed for ${to} after ${result.retryCount} retries:`,
          result.error
        );
      }
      return result;
    } catch (error) {
      logger.error(`Customer notification [${type}] exception:`, error);
      return { success: false, error: String(error) };
    }
  }

  /**
   * Send an admin notification email.
   * Accepts multiple recipients.
   */
  async sendAdminNotification(
    type: NotificationType,
    to: string[],
    subject: string,
    html: string,
    relatedId?: string,
    relatedType?: string
  ): Promise<SendEmailResult> {
    if (to.length === 0) {
      logger.warn(`Admin notification [${type}] skipped - no recipients`);
      return { success: false, error: "No recipients" };
    }

    try {
      const result = await this.sendEmail({
        to,
        subject,
        html,
        type,
        relatedId,
        relatedType,
      });
      if (result.success) {
        logger.info(
          `Admin notification [${type}] sent to ${to.length} recipients (${result.retryCount} retries)`
        );
      } else {
        logger.error(
          `Admin notification [${type}] failed after ${result.retryCount} retries:`,
          result.error
        );
      }
      return result;
    } catch (error) {
      logger.error(`Admin notification [${type}] exception:`, error);
      return { success: false, error: String(error) };
    }
  }

  /**
   * Send a test email to verify configuration.
   * This method DOES await the result for verification purposes.
   */
  async sendTestEmail(to: string): Promise<NotificationResult> {
    const testHtml = `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
        <h1 style="color: #C4A05F;">✅ Email 通知測試成功</h1>
        <p>您的 Email 通知設定已正確配置。</p>
        <p>當有新訂單或重要事件時，您將會收到 Email 通知。</p>
        <hr style="border: none; border-top: 1px solid #eee; margin: 24px 0;" />
        <p style="color: #666; font-size: 12px;">
          Black Living 黑哥居家 - 自動發送測試信
          <br />
          ${new Date().toLocaleString("zh-TW", { timeZone: "Asia/Taipei" })}
        </p>
      </div>
    `;

    const result = await this.sendEmail({
      to,
      subject: "[Black Living] Email 通知測試",
      html: testHtml,
      type: "test",
    });

    return {
      success: result.success,
      type: "test",
      recipient: to,
      error: result.error,
    };
  }
}

export type {
  NotificationType,
  SendEmailOptions,
  SendEmailResult,
  NotificationResult,
};

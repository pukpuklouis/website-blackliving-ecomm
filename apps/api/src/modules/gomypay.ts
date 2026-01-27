import { requireAdmin } from "@blackliving/auth";
import { settings as settingsTable } from "@blackliving/db/schema";
import { zValidator } from "@hono/zod-validator";
import MD5 from "crypto-js/md5";
import { eq } from "drizzle-orm";
import { Hono } from "hono";
import { z } from "zod";
import type { Env } from "../index";

// ============================================================================
// GOMYPAY 金流串接模組
// 基於 GOMYPAY 金流串接技術說明文件 v1.13.2
// ============================================================================

// ----------------------------------------------------------------------------
// Types
// ----------------------------------------------------------------------------

/** GOMYPAY 支付方式類型 */
export type GomypayPaymentType =
  | "credit_card" // 信用卡 (Send_Type: 0)
  | "virtual_account" // 虛擬帳號 (Send_Type: 4)
  | "apple_pay" // Apple Pay (Send_Code: 9003)
  | "google_pay"; // Google Pay (Send_Code: 9004)

/** GOMYPAY 設定 */
type GomypayConfig = {
  customerId: string;
  merchantId: string; // 明碼商店代號 (統編/身分證) - 用於 MD5 驗證
  strCheck: string;
  isTestMode: boolean;
  returnUrl: string;
  callbackUrl: string;
  enableApplePay: boolean;
  enableGooglePay: boolean;
  enableVirtualAccount: boolean;
};

/** 支付請求參數 */
type PaymentRequest = {
  orderNo: string;
  amount: number;
  buyerName: string;
  buyerPhone: string;
  buyerEmail: string;
  buyerMemo: string;
  paymentType: GomypayPaymentType;
};

/** 支付回傳結果 (from GOMYPAY) */
type GomypayResponse = {
  result: string;
  ret_msg?: string;
  return_msg?: string;
  OrderID?: string;
  e_orderno?: string;
  AvCode?: string;
  avcode?: string;
  str_check?: string;
  CardLastNum?: string;
  e_money?: string;
  e_date?: string;
  e_time?: string;
  e_payaccount?: string;
  LimitDate?: string;
  redirectPaymentUrl?: string;
  TM_Order_ID?: string;
  Customer_Order_ID?: string;
};

// ----------------------------------------------------------------------------
// Constants
// ----------------------------------------------------------------------------

const GOMYPAY_URLS = {
  production: "https://n.gomypay.asia/ShuntClass.aspx",
  test: "https://n.gomypay.asia/TestShuntClass.aspx",
  applePayProduction: "https://n.gomypay.asia/MPEPv1/applepay/createOrder",
  applePayTest: "https://n.gomypay.asia/MPEPt/applepay/createOrder",
  googlePayProduction: "https://n.gomypay.asia/MPEPv1/googlepay/createOrder",
  googlePayTest: "https://n.gomypay.asia/MPEPt/googlepay/createOrder",
  query: "https://n.gomypay.asia/CallOrder.aspx",
  queryTest: "https://n.gomypay.asia/TestCallOrder.aspx",
};

const SEND_TYPE_MAP: Record<GomypayPaymentType, string> = {
  credit_card: "0",
  virtual_account: "4",
  apple_pay: "9",
  google_pay: "9",
};

const SEND_CODE_MAP: Record<string, string> = {
  apple_pay: "9003",
  google_pay: "9004",
};

const SETTINGS_KEY = "gomypay_config";

// ----------------------------------------------------------------------------
// Utility Functions
// ----------------------------------------------------------------------------

/** 產生 str_check 所需的參數 */
type StrCheckParams = {
  result: string;
  eOrderno: string;
  customerId: string;
  amount: string | number;
  orderId: string;
  strCheckPassword: string;
};

/**
 * 產生 MD5 驗證碼 (str_check)
 */
function generateStrCheck(params: StrCheckParams): string {
  const { result, eOrderno, customerId, amount, orderId, strCheckPassword } =
    params;
  const rawString = `${result}${eOrderno}${customerId}${amount}${orderId}${strCheckPassword}`;
  return MD5(rawString).toString();
}

/**
 * 驗證回傳的 str_check
 */
function verifyStrCheck(
  response: GomypayResponse,
  customerId: string,
  amount: number,
  strCheckPassword: string
): boolean {
  const hasRequiredFields =
    response.str_check && response.OrderID && response.e_orderno;
  if (!hasRequiredFields) {
    return false;
  }
  const expectedStrCheck = generateStrCheck({
    result: response.result,
    eOrderno: response.e_orderno as string,
    customerId,
    amount,
    orderId: response.OrderID as string,
    strCheckPassword,
  });
  return expectedStrCheck === response.str_check;
}

/**
 * 從 query params 解析 GOMYPAY 回傳資料
 */
function parseCallbackParams(params: Record<string, string>): {
  response: GomypayResponse;
  amount: number;
} {
  return {
    response: {
      result: params.result || "",
      ret_msg: params.ret_msg || "",
      OrderID: params.OrderID || "",
      e_orderno: params.e_orderno || "",
      AvCode: params.AvCode || "",
      str_check: params.str_check || "",
      CardLastNum: params.CardLastNum || "",
    },
    amount: Number.parseInt(params.e_money || "0", 10),
  };
}

/**
 * 建立付款回調的重導向 URL
 */
function buildCallbackRedirectUrl(
  baseUrl: string,
  response: GomypayResponse
): string {
  const success = response.result === "1";
  const callbackUrl = new URL("/checkout/payment-callback", baseUrl);
  callbackUrl.searchParams.set("success", success.toString());
  callbackUrl.searchParams.set("orderNo", response.e_orderno || "");
  if (response.AvCode) {
    callbackUrl.searchParams.set("avCode", response.AvCode);
  }
  if (!success && response.ret_msg) {
    callbackUrl.searchParams.set("error", response.ret_msg);
  }
  return callbackUrl.toString();
}

/**
 * 判斷是否為多元支付類型
 */
function isMultiPayment(paymentType: GomypayPaymentType): boolean {
  return ["apple_pay", "google_pay"].includes(paymentType);
}

/**
 * 取得多元支付的 API URL
 */
function getMultiPaymentUrl(
  paymentType: GomypayPaymentType,
  isTestMode: boolean
): string {
  const urlMap: Record<string, { production: string; test: string }> = {
    apple_pay: {
      production: GOMYPAY_URLS.applePayProduction,
      test: GOMYPAY_URLS.applePayTest,
    },
    google_pay: {
      production: GOMYPAY_URLS.googlePayProduction,
      test: GOMYPAY_URLS.googlePayTest,
    },
  };
  const urls = urlMap[paymentType];
  return isTestMode ? urls.test : urls.production;
}

/**
 * 從資料庫讀取 GOMYPAY 設定
 */
async function getGomypayConfig(db: unknown): Promise<GomypayConfig | null> {
  const dbTyped = db as {
    select: () => {
      from: (table: unknown) => {
        where: (condition: unknown) => {
          limit: (n: number) => Promise<Array<{ value: unknown }>>;
        };
      };
    };
  };

  const result = await dbTyped
    .select()
    .from(settingsTable)
    .where(eq(settingsTable.key, SETTINGS_KEY))
    .limit(1);

  if (result.length === 0) {
    return null;
  }

  return result[0].value as GomypayConfig;
}

// ----------------------------------------------------------------------------
// API Routes
// ----------------------------------------------------------------------------

const gomypay = new Hono<{
  Bindings: Env;
  Variables: {
    db: unknown;
    cache: unknown;
    storage: unknown;
    auth: unknown;
    user: unknown;
    session: unknown;
  };
}>();

// Validation schemas
const initiatePaymentSchema = z.object({
  orderNo: z.string().min(1),
  amount: z.number().positive(),
  buyerName: z.string().min(1).max(20),
  buyerPhone: z.string().min(1).max(20),
  buyerEmail: z.string().email().max(50),
  buyerMemo: z.string().max(500).default(""),
  paymentType: z.enum([
    "credit_card",
    "virtual_account",
    "apple_pay",
    "google_pay",
  ]),
});

const saveConfigSchema = z.object({
  customerId: z.string().min(1).max(32),
  merchantId: z.string().min(1).max(20), // 明碼商店代號 (統編/身分證)
  strCheck: z.string().length(32).optional(),
  isTestMode: z.boolean().default(true),
  returnUrl: z.string().url().optional().or(z.literal("")),
  callbackUrl: z.string().url().optional().or(z.literal("")),
  enableApplePay: z.boolean().default(false),
  enableGooglePay: z.boolean().default(false),
  enableVirtualAccount: z.boolean().default(false),
});

// GET /api/payment/config - Get current config (admin only, masked)
gomypay.get("/config", requireAdmin(), async (c) => {
  try {
    const db = c.get("db");
    const config = await getGomypayConfig(db);

    if (!config) {
      return c.json({
        success: true,
        data: {
          hasConfig: false,
          customerId: "",
          isTestMode: true,
          returnUrl: "",
          callbackUrl: "",
          enableApplePay: false,
          enableGooglePay: false,
          enableVirtualAccount: false,
        },
      });
    }

    return c.json({
      success: true,
      data: {
        hasConfig: true,
        customerId: config.customerId,
        merchantId: config.merchantId,
        hasStrCheck: !!config.strCheck,
        isTestMode: config.isTestMode,
        returnUrl: config.returnUrl,
        callbackUrl: config.callbackUrl,
        enableApplePay: config.enableApplePay ?? false,
        enableGooglePay: config.enableGooglePay ?? false,
        enableVirtualAccount: config.enableVirtualAccount ?? false,
      },
    });
  } catch (error) {
    console.error("Error fetching GOMYPAY config:", error);
    return c.json({ error: "Failed to fetch config" }, 500);
  }
});

// GET /api/payment/methods - Get enabled payment methods (public, for checkout)
gomypay.get("/methods", async (c) => {
  try {
    const db = c.get("db");
    const config = await getGomypayConfig(db);

    // Always return credit_card, bank_transfer, cash_on_delivery as available
    // Other methods depend on admin settings
    return c.json({
      success: true,
      data: {
        enableApplePay: config?.enableApplePay ?? false,
        enableGooglePay: config?.enableGooglePay ?? false,
        enableVirtualAccount: config?.enableVirtualAccount ?? false,
      },
    });
  } catch (error) {
    console.error("Error fetching payment methods:", error);
    return c.json({
      success: true,
      data: {
        enableApplePay: false,
        enableGooglePay: false,
        enableVirtualAccount: false,
      },
    });
  }
});

// POST /api/payment/config - Save config (admin only)
gomypay.post(
  "/config",
  requireAdmin(),
  zValidator("json", saveConfigSchema),
  async (c) => {
    try {
      const data = c.req.valid("json");
      const db = c.get("db");
      const dbTyped = db as {
        insert: (table: unknown) => {
          values: (values: unknown) => {
            onConflictDoUpdate: (options: {
              target: unknown;
              set: unknown;
            }) => Promise<unknown>;
          };
        };
      };

      // Fetch existing config to merge strCheck if not provided
      const existingConfig = await getGomypayConfig(db);
      const strCheckToUse = data.strCheck ?? existingConfig?.strCheck;

      if (!strCheckToUse) {
        return c.json({ success: false, error: "請輸入交易驗證密碼" }, 400);
      }

      const configValue: GomypayConfig = {
        customerId: data.customerId,
        merchantId: data.merchantId,
        strCheck: strCheckToUse,
        isTestMode: data.isTestMode,
        returnUrl: data.returnUrl || "",
        callbackUrl: data.callbackUrl || "",
        enableApplePay: data.enableApplePay ?? false,
        enableGooglePay: data.enableGooglePay ?? false,
        enableVirtualAccount: data.enableVirtualAccount ?? false,
      };

      await dbTyped
        .insert(settingsTable)
        .values({
          key: SETTINGS_KEY,
          value: configValue,
        })
        .onConflictDoUpdate({
          target: settingsTable.key,
          set: {
            value: configValue,
            updatedAt: new Date(),
          },
        });

      return c.json({
        success: true,
        message: "GOMYPAY 設定已儲存",
      });
    } catch (error) {
      console.error("Error saving GOMYPAY config:", error);
      return c.json({ error: "Failed to save config" }, 500);
    }
  }
);

// POST /api/payment/initiate - Initiate payment
gomypay.post(
  "/initiate",
  zValidator("json", initiatePaymentSchema),
  async (c) => {
    try {
      const data = c.req.valid("json");
      const db = c.get("db");

      const config = await getGomypayConfig(db);
      if (!config) {
        return c.json({ error: "GOMYPAY 尚未設定，請聯繫管理員" }, 400);
      }

      const request: PaymentRequest = {
        orderNo: data.orderNo,
        amount: data.amount,
        buyerName: data.buyerName,
        buyerPhone: data.buyerPhone,
        buyerEmail: data.buyerEmail,
        buyerMemo: data.buyerMemo || `訂單 ${data.orderNo}`,
        paymentType: data.paymentType as GomypayPaymentType,
      };

      // For multi-payment (Apple Pay, Google Pay), use JSON API
      if (isMultiPayment(request.paymentType)) {
        const url = getMultiPaymentUrl(request.paymentType, config.isTestMode);

        const apiData = {
          e_return: "1",
          Str_Check: config.strCheck,
          Send_Code: SEND_CODE_MAP[request.paymentType],
          Send_Type: "9",
          Pay_Mode_No: "2",
          CustomerId: config.customerId,
          Order_No: request.orderNo,
          Amount: request.amount.toString(),
          Buyer_Name: request.buyerName,
          Buyer_Telm: request.buyerPhone,
          Buyer_Mail: request.buyerEmail,
          Buyer_Memo: request.buyerMemo,
          Callback_Url: config.callbackUrl,
        };

        const response = await fetch(url, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(apiData),
        });

        const result = (await response.json()) as GomypayResponse;

        if (result.result === "00000" && result.redirectPaymentUrl) {
          return c.json({
            success: true,
            data: {
              type: "redirect",
              redirectUrl: result.redirectPaymentUrl,
              gomypayOrderId: result.TM_Order_ID,
            },
          });
        }

        return c.json(
          {
            error: result.return_msg || "Payment initiation failed",
            code: result.result,
          },
          400
        );
      }

      // For traditional payments (credit card, virtual account), return form data
      const submitUrl = config.isTestMode
        ? GOMYPAY_URLS.test
        : GOMYPAY_URLS.production;

      const formData: Record<string, string> = {
        Send_Type: SEND_TYPE_MAP[request.paymentType],
        Pay_Mode_No: "2",
        CustomerId: config.customerId,
        Order_No: request.orderNo,
        Amount: request.amount.toString(),
        TransCode: "00",
        Buyer_Name: request.buyerName,
        Buyer_Telm: request.buyerPhone,
        Buyer_Mail: request.buyerEmail,
        Buyer_Memo: request.buyerMemo,
      };

      // For credit card, use hosted page (no CardNo etc.)
      if (request.paymentType === "credit_card") {
        formData.TransMode = "1"; // Normal transaction
        formData.Installment = "0";
      }

      // Set return URLs
      if (config.returnUrl) {
        formData.Return_url = config.returnUrl;
      }
      if (config.callbackUrl) {
        formData.Callback_Url = config.callbackUrl;
      }

      return c.json({
        success: true,
        data: {
          type: "form",
          submitUrl,
          formData,
        },
      });
    } catch (error) {
      console.error("Error initiating payment:", error);
      return c.json({ error: "Failed to initiate payment" }, 500);
    }
  }
);

// ----------------------------------------------------------------------------
// Helper Functions for Order Updates
// ----------------------------------------------------------------------------

/**
 * Update order status to paid
 */
async function updateOrderStatus(
  db: unknown,
  response: GomypayResponse,
  amount: number
) {
  // Import orders table dynamically to avoid circular deps
  const { orders: ordersTable } = await import("@blackliving/db/schema");
  const dbTyped = db as {
    update: (table: unknown) => {
      set: (values: unknown) => {
        where: (condition: unknown) => Promise<unknown>;
      };
    };
    select: () => {
      from: (table: unknown) => {
        where: (condition: unknown) => {
          limit: (n: number) => Promise<Array<{ status: string }>>;
        };
      };
    };
  };

  // Check current status first to avoid redundant updates
  const currentOrder = await dbTyped
    .select()
    .from(ordersTable)
    .where(eq(ordersTable.orderNumber, response.e_orderno))
    .limit(1);

  if (currentOrder.length > 0 && currentOrder[0].status === "paid") {
    // Already paid, skip update
    return;
  }

  await dbTyped
    .update(ordersTable)
    .set({
      status: "paid",
      paymentStatus: "paid",
      gomypayOrderId: response.OrderID,
      paymentCompletedAt: new Date(),
      paymentDetails: {
        avCode: response.AvCode,
        transactionDate: response.e_date,
        transactionTime: response.e_time,
        amount,
      },
      updatedAt: new Date(),
    })
    .where(eq(ordersTable.orderNumber, response.e_orderno));

  console.log(`Order ${response.e_orderno} status updated to paid`);
}

// GET /api/payment/callback - Handle GOMYPAY callback (Return_url)
gomypay.get("/callback", async (c) => {
  try {
    const params = c.req.query();
    const db = c.get("db");

    const config = await getGomypayConfig(db);
    const webBaseUrl = c.env.WEB_BASE_URL || "";
    if (!config) {
      return c.redirect(`${webBaseUrl}/checkout?error=config_missing`);
    }

    const { response, amount } = parseCallbackParams(params);

    // Verify str_check for successful payments
    // IMPORTANT: Use merchantId (plaintext) not customerId (encrypted) for MD5 verification
    const isSuccess = response.result === "1";
    const verificationFailed =
      isSuccess &&
      config.merchantId &&
      !verifyStrCheck(response, config.merchantId, amount, config.strCheck);

    if (verificationFailed) {
      console.error(
        "str_check verification failed for order:",
        response.e_orderno
      );
      return c.redirect(
        `${webBaseUrl}/checkout/payment-callback?success=false&error=verification_failed&orderNo=${response.e_orderno}`
      );
    }

    // Update order status if payment successful
    // This serves as a fallback for webhook (essential for localhost where webhook fails)
    if (isSuccess && response.e_orderno) {
      try {
        await updateOrderStatus(db, response, amount);
        console.log(
          `Order ${response.e_orderno} updated via callback (fallback)`
        );
      } catch (err) {
        console.error("Failed to update order in callback:", err);
        // Continue to redirect even if update fails (webhook might still succeed later)
      }
    }

    return c.redirect(buildCallbackRedirectUrl(webBaseUrl, response));
  } catch (error) {
    console.error("Error handling payment callback:", error);
    return c.redirect(
      `${c.env.WEB_BASE_URL || ""}/checkout?error=callback_failed`
    );
  }
});

// POST /api/payment/webhook - Handle background reconciliation (Callback_Url)
gomypay.post("/webhook", async (c) => {
  try {
    const body = await c.req.parseBody();
    const db = c.get("db");

    const config = await getGomypayConfig(db);
    if (!config) {
      console.error("GOMYPAY webhook: config not found");
      return c.text("OK", 200); // Return 200 to stop retries
    }

    const response: GomypayResponse = {
      result: String(body.result || ""),
      ret_msg: String(body.ret_msg || ""),
      OrderID: String(body.OrderID || ""),
      e_orderno: String(body.e_orderno || ""),
      AvCode: String(body.AvCode || body.avcode || ""),
      str_check: String(body.str_check || ""),
      e_money: String(body.e_money || ""),
      e_date: String(body.e_date || ""),
      e_time: String(body.e_time || ""),
    };

    const amount = Number.parseInt(response.e_money || "0", 10);

    // Verify str_check
    // IMPORTANT: Use merchantId (plaintext) not customerId (encrypted) for MD5 verification
    // Skip verification if merchantId is not configured (backward compatibility)
    if (
      config.merchantId &&
      !verifyStrCheck(response, config.merchantId, amount, config.strCheck)
    ) {
      console.error(
        "Webhook str_check verification failed for order:",
        response.e_orderno,
        {
          receivedStrCheck: response.str_check,
          merchantId: config.merchantId,
          amount,
        }
      );
      return c.text("OK", 200);
    }

    // Update order status if payment successful
    if (response.result === "1" && response.e_orderno) {
      await updateOrderStatus(db, response, amount);
      console.log(`Order ${response.e_orderno} payment confirmed via webhook`);
    }

    return c.text("OK", 200);
  } catch (error) {
    console.error("Error handling payment webhook:", error);
    return c.text("OK", 200); // Return 200 to stop retries
  }
});

// GET /api/payment/status/:orderNo - Query payment status
gomypay.get("/status/:orderNo", async (c) => {
  try {
    const orderNo = c.req.param("orderNo");
    const db = c.get("db");

    const config = await getGomypayConfig(db);
    if (!config) {
      return c.json({ error: "GOMYPAY 尚未設定" }, 400);
    }

    const queryUrl = config.isTestMode
      ? GOMYPAY_URLS.queryTest
      : GOMYPAY_URLS.query;

    const formData = new URLSearchParams({
      Order_No: orderNo,
      CustomerId: config.customerId,
      Str_Check: config.strCheck,
    });

    const response = await fetch(queryUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: formData.toString(),
    });

    const result = (await response.json()) as GomypayResponse;

    return c.json({
      success: true,
      data: {
        result: result.result,
        message: result.ret_msg,
        orderId: result.OrderID,
        orderNo: result.e_orderno,
        amount: result.e_money,
        date: result.e_date,
        time: result.e_time,
        avCode: result.avcode || result.AvCode,
      },
    });
  } catch (error) {
    console.error("Error querying payment status:", error);
    return c.json({ error: "Failed to query payment status" }, 500);
  }
});

// POST /api/payment/test-connection - Test GOMYPAY connection (admin only)
gomypay.post("/test-connection", requireAdmin(), async (c) => {
  try {
    const db = c.get("db");
    const config = await getGomypayConfig(db);

    if (!config) {
      return c.json({
        success: false,
        message: "請先儲存 GOMYPAY 設定",
      });
    }

    // Try to query a non-existent order to test connection
    const queryUrl = config.isTestMode
      ? GOMYPAY_URLS.queryTest
      : GOMYPAY_URLS.query;

    const formData = new URLSearchParams({
      Order_No: "TEST_CONNECTION_CHECK",
      CustomerId: config.customerId,
      Str_Check: config.strCheck,
    });

    const response = await fetch(queryUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: formData.toString(),
    });

    const result = (await response.json()) as GomypayResponse;

    // "查無訂單資料" means connection is working
    const isConnected =
      result.ret_msg?.includes("查無") || result.result === "0";

    return c.json({
      success: isConnected,
      message: isConnected
        ? "連線成功，GOMYPAY 設定正確"
        : `連線失敗: ${result.ret_msg || "Unknown error"}`,
      environment: config.isTestMode ? "測試環境" : "正式環境",
    });
  } catch (error) {
    console.error("Error testing GOMYPAY connection:", error);
    return c.json({
      success: false,
      message: "連線測試失敗，請檢查網路連線",
    });
  }
});

// POST /api/payment/retry/:orderNumber - Retry payment for unpaid order
gomypay.post("/retry/:orderNumber", async (c) => {
  try {
    const orderNumber = c.req.param("orderNumber");
    const db = c.get("db");

    const config = await getGomypayConfig(db);
    if (!config) {
      return c.json({ error: "GOMYPAY 尚未設定，請聯繫管理員" }, 400);
    }

    // Look up the order
    const { orders: ordersTable } = await import("@blackliving/db/schema");
    const dbTyped = db as {
      select: () => {
        from: (table: unknown) => {
          where: (condition: unknown) => {
            limit: (n: number) => Promise<
              Array<{
                orderNumber: string;
                status: string;
                paymentMethod: string;
                totalAmount: number;
                customerInfo: {
                  name: string;
                  phone: string;
                  email: string;
                };
              }>
            >;
          };
        };
      };
    };

    const orders = await dbTyped
      .select()
      .from(ordersTable)
      .where(eq(ordersTable.orderNumber, orderNumber))
      .limit(1);

    if (orders.length === 0) {
      return c.json({ error: "找不到此訂單" }, 404);
    }

    const order = orders[0];

    // Validate order status
    if (order.status !== "pending_payment") {
      return c.json({ error: "此訂單不需要付款" }, 400);
    }

    // Validate payment method is GOMYPAY
    const gomypayMethods = [
      "credit_card",
      "virtual_account",
      "apple_pay",
      "google_pay",
    ];
    if (!gomypayMethods.includes(order.paymentMethod)) {
      return c.json({ error: "此付款方式不支援線上付款" }, 400);
    }

    const paymentType = order.paymentMethod as GomypayPaymentType;

    // For multi-payment (Apple Pay, Google Pay), use JSON API
    if (isMultiPayment(paymentType)) {
      const url = getMultiPaymentUrl(paymentType, config.isTestMode);

      const apiData = {
        e_return: "1",
        Str_Check: config.strCheck,
        Send_Code: SEND_CODE_MAP[paymentType],
        Send_Type: "9",
        Pay_Mode_No: "2",
        CustomerId: config.customerId,
        Order_No: order.orderNumber,
        Amount: Math.round(order.totalAmount).toString(),
        Buyer_Name: order.customerInfo.name,
        Buyer_Telm: order.customerInfo.phone,
        Buyer_Mail: order.customerInfo.email,
        Buyer_Memo: `訂單 ${order.orderNumber}`,
        Callback_Url: config.callbackUrl,
      };

      const response = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(apiData),
      });

      const result = (await response.json()) as GomypayResponse;

      if (result.result === "00000" && result.redirectPaymentUrl) {
        return c.json({
          success: true,
          data: {
            type: "redirect",
            redirectUrl: result.redirectPaymentUrl,
            gomypayOrderId: result.TM_Order_ID,
          },
        });
      }

      return c.json(
        {
          error: result.return_msg || "Payment initiation failed",
          code: result.result,
        },
        400
      );
    }

    // For traditional payments (credit card, virtual account), return form data
    const submitUrl = config.isTestMode
      ? GOMYPAY_URLS.test
      : GOMYPAY_URLS.production;

    const formData: Record<string, string> = {
      Send_Type: SEND_TYPE_MAP[paymentType],
      Pay_Mode_No: "2",
      CustomerId: config.customerId,
      Order_No: order.orderNumber,
      Amount: Math.round(order.totalAmount).toString(),
      TransCode: "00",
      Buyer_Name: order.customerInfo.name,
      Buyer_Telm: order.customerInfo.phone,
      Buyer_Mail: order.customerInfo.email,
      Buyer_Memo: `訂單 ${order.orderNumber}`,
    };

    // For credit card, use hosted page
    if (paymentType === "credit_card") {
      formData.TransMode = "1";
      formData.Installment = "0";
    }

    // Set return URLs
    if (config.returnUrl) {
      formData.Return_url = config.returnUrl;
    }
    if (config.callbackUrl) {
      formData.Callback_Url = config.callbackUrl;
    }

    return c.json({
      success: true,
      data: {
        type: "form",
        submitUrl,
        formData,
      },
    });
  } catch (error) {
    console.error("Error retrying payment:", error);
    return c.json({ error: "付款重試失敗，請稍後再試" }, 500);
  }
});

export default gomypay;

// Checkout form utilities and shared types
// Extracted from CheckoutForm.tsx to reduce component complexity

import type { CustomerInfo, ShippingAddress } from "../../stores/cartStore";

// Validation regex patterns
export const PHONE_REGEX = /^09\d{8}$/;
export const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Email verification types and functions
export type EmailCheckResult = {
  status: "exists" | "not_found" | "error";
  shouldOpenModal: boolean;
};

export type EmailStatus =
  | "idle"
  | "checking"
  | "exists"
  | "not_found"
  | "error";

export async function performEmailCheck(
  email: string
): Promise<EmailCheckResult> {
  const apiUrl =
    import.meta.env.PUBLIC_API_URL || import.meta.env.VITE_API_URL || "";
  const endpoint = apiUrl
    ? `${apiUrl}/api/user/check-email`
    : "/api/user/check-email";

  try {
    const response = await fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: email.trim().toLowerCase() }),
    });

    if (!response.ok) {
      return { status: "error", shouldOpenModal: false };
    }

    const result = await response.json();
    const exists = result.data?.exists ?? false;
    return {
      status: exists ? "exists" : "not_found",
      shouldOpenModal: !exists,
    };
  } catch (error) {
    console.error("Email check error:", error);
    return { status: "error", shouldOpenModal: false };
  }
}

export type EmailStatusCheck = {
  error: string | null;
  shouldOpenAuthModal: boolean;
};

export function checkEmailStatus(status: EmailStatus): EmailStatusCheck {
  if (status === "not_found") {
    return { error: "請先登入或註冊帳號才能結帳", shouldOpenAuthModal: true };
  }
  if (status === "checking") {
    return { error: "正在驗證Email...", shouldOpenAuthModal: false };
  }
  return { error: null, shouldOpenAuthModal: false };
}

// Payment handling types and functions
export const GOMYPAY_METHODS = [
  "credit_card",
  "virtual_account",
  "apple_pay",
  "google_pay",
] as const;

export type PaymentResult = {
  success: boolean;
  error?: string;
  type?: "redirect" | "form";
  redirectUrl?: string;
  submitUrl?: string;
  formData?: Record<string, string>;
};

export function submitHiddenForm(
  submitUrl: string,
  formData: Record<string, string>
): void {
  const form = document.createElement("form");
  form.method = "POST";
  form.action = submitUrl;
  form.style.display = "none";

  for (const [key, value] of Object.entries(formData)) {
    const input = document.createElement("input");
    input.type = "hidden";
    input.name = key;
    input.value = value;
    form.appendChild(input);
  }

  document.body.appendChild(form);
  form.submit();
}

export function handlePaymentResult(result: PaymentResult): string | null {
  if (!result.success) {
    return result.error || "付款初始化失敗";
  }

  if (result.type === "redirect" && result.redirectUrl) {
    window.location.href = result.redirectUrl;
    return null;
  }

  if (result.type === "form" && result.submitUrl && result.formData) {
    submitHiddenForm(result.submitUrl, result.formData);
    return null;
  }

  return null;
}

// Field validation utilities
type Validator = (value: string) => string;

const FIELD_VALIDATORS: Record<string, Validator> = {
  name: (v) => (v.trim() ? "" : "請輸入姓名"),
  phone: (v) => {
    if (!v.trim()) {
      return "請輸入手機號碼";
    }
    if (!PHONE_REGEX.test(v)) {
      return "請輸入有效的手機號碼";
    }
    return "";
  },
  email: (v) => {
    if (!v.trim()) {
      return "請輸入 Email";
    }
    if (!EMAIL_REGEX.test(v)) {
      return "請輸入有效的 Email";
    }
    return "";
  },
  "shipping-name": (v) => (v.trim() ? "" : "請輸入收件人姓名"),
  "shipping-phone": (v) => {
    if (!v.trim()) {
      return "請輸入收件人手機";
    }
    if (!PHONE_REGEX.test(v)) {
      return "請輸入有效的手機號碼";
    }
    return "";
  },
  "shipping-city": (v) => (v.trim() ? "" : "請選擇城市"),
  "shipping-district": (v) => (v.trim() ? "" : "請輸入區域"),
  "shipping-address": (v) => (v.trim() ? "" : "請輸入詳細地址"),
};

export function validateField(field: string, value: string): string {
  const validator = FIELD_VALIDATORS[field];
  return validator ? validator(value) : "";
}

export function validateFormFields(
  customerInfo: CustomerInfo,
  shippingAddress: ShippingAddress
): Record<string, string> {
  return {
    name: validateField("name", customerInfo.name),
    phone: validateField("phone", customerInfo.phone),
    email: validateField("email", customerInfo.email),
    "shipping-name": validateField("shipping-name", shippingAddress.name),
    "shipping-phone": validateField("shipping-phone", shippingAddress.phone),
    "shipping-city": validateField("shipping-city", shippingAddress.city),
    "shipping-district": validateField(
      "shipping-district",
      shippingAddress.district
    ),
    "shipping-address": validateField(
      "shipping-address",
      shippingAddress.address
    ),
  };
}

// Constants
export const ALL_FIELDS_TOUCHED: Record<string, boolean> = {
  name: true,
  phone: true,
  email: true,
  "shipping-name": true,
  "shipping-phone": true,
  "shipping-city": true,
  "shipping-district": true,
  "shipping-address": true,
};

export const TAIWAN_CITIES = [
  "台北市",
  "新北市",
  "桃園市",
  "台中市",
  "台南市",
  "高雄市",
  "基隆市",
  "新竹市",
  "嘉義市",
  "新竹縣",
  "苗栗縣",
  "彰化縣",
  "南投縣",
  "雲林縣",
  "嘉義縣",
  "屏東縣",
  "宜蘭縣",
  "花蓮縣",
  "台東縣",
  "澎湖縣",
  "金門縣",
  "連江縣",
] as const;

// Helper to get input border class based on error/status
export function getInputBorderClass(
  hasError: boolean,
  isSuccess?: boolean
): string {
  if (hasError) {
    return "border-red-500 dark:border-red-400";
  }
  if (isSuccess) {
    return "border-green-500 dark:border-green-400";
  }
  return "border-gray-300 dark:border-zinc-600";
}

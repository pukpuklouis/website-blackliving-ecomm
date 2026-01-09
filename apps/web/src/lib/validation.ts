/**
 * Shared validation utilities for profile forms
 * Implements consistent validation rules across frontend and backend
 */

import { z } from "zod";

// Taiwan-specific validation patterns
export const taiwanPhoneRegex = /^09\d{8}$/;
export const taiwanPostalCodeRegex = /^\d{3,5}$/;
export const birthdayRegex = /^\d{4}-\d{2}-\d{2}$/;

// Profile validation schemas
export const profileValidationSchema = {
  firstName: z.string().min(1, "姓氏不能為空").max(50, "姓氏不能超過50個字符"),
  lastName: z.string().min(1, "名字不能為空").max(50, "名字不能超過50個字符"),
  phone: z
    .string()
    .regex(taiwanPhoneRegex, "請輸入有效的台灣手機號碼 (09xxxxxxxx)")
    .optional()
    .or(z.literal("")),
  birthday: z
    .string()
    .regex(birthdayRegex, "生日格式應為 YYYY-MM-DD")
    .optional()
    .or(z.literal("")),
  gender: z
    .enum(["male", "female", "other"], {
      errorMap: () => ({ message: "請選擇有效的性別" }),
    })
    .optional(),
  contactPreference: z
    .enum(["email", "phone", "sms"], {
      errorMap: () => ({ message: "請選擇有效的聯絡方式" }),
    })
    .optional(),
};

export const addressValidationSchema = {
  recipientName: z.string().min(1, "收件人姓名不能為空").max(100, "姓名過長"),
  recipientPhone: z
    .string()
    .regex(taiwanPhoneRegex, "請輸入有效的台灣手機號碼"),
  city: z.string().min(1, "請選擇縣市"),
  district: z.string().min(1, "請選擇區域"),
  postalCode: z.string().regex(taiwanPostalCodeRegex, "請輸入有效的郵遞區號"),
  street: z.string().min(1, "請輸入街道地址"),
  building: z.string().optional(),
  floor: z.string().optional(),
  room: z.string().optional(),
  deliveryInstructions: z
    .string()
    .max(500, "配送說明不能超過500字符")
    .optional(),
  accessCode: z.string().optional(),
  label: z.string().optional(),
};

export const passwordValidationSchema = {
  currentPassword: z.string().min(1, "請輸入目前密碼"),
  newPassword: z
    .string()
    .min(8, "新密碼至少需要8個字符")
    .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, "密碼需包含大小寫字母和數字"),
  confirmPassword: z.string(),
};

// Validation functions
export function validateFirstName(name: string): string | null {
  try {
    profileValidationSchema.firstName.parse(name);
    return null;
  } catch (error) {
    if (error instanceof z.ZodError) {
      return error.errors[0]?.message || "姓氏格式錯誤";
    }
    return "姓氏格式錯誤";
  }
}

export function validateLastName(name: string): string | null {
  try {
    profileValidationSchema.lastName.parse(name);
    return null;
  } catch (error) {
    if (error instanceof z.ZodError) {
      return error.errors[0]?.message || "名字格式錯誤";
    }
    return "名字格式錯誤";
  }
}

export function validatePhone(phone: string): string | null {
  // The phone number is optional, so an empty or whitespace-only string is considered valid.
  if (!phone || phone.trim() === "") {
    return null;
  }

  // Use the regex to test the format if the string is not empty.
  if (taiwanPhoneRegex.test(phone)) {
    return null; // The format is correct.
  }

  // If the format is incorrect, return the error message.
  return "請輸入有效的台灣手機號碼 (09xxxxxxxx)";
}

export function validateAddress(
  address: Record<string, any>
): Record<string, string> | null {
  const errors: Record<string, string> = {};

  Object.entries(addressValidationSchema).forEach(([field, schema]) => {
    try {
      schema.parse(address[field]);
    } catch (error) {
      if (error instanceof z.ZodError) {
        errors[field] = error.errors[0]?.message || "格式錯誤";
      }
    }
  });

  return Object.keys(errors).length > 0 ? errors : null;
}

export function validatePasswordForm(data: {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}): Record<string, string> | null {
  const errors: Record<string, string> = {};

  try {
    passwordValidationSchema.currentPassword.parse(data.currentPassword);
  } catch (error) {
    if (error instanceof z.ZodError) {
      errors.currentPassword = error.errors[0]?.message || "請輸入目前密碼";
    }
  }

  try {
    passwordValidationSchema.newPassword.parse(data.newPassword);
  } catch (error) {
    if (error instanceof z.ZodError) {
      errors.newPassword = error.errors[0]?.message || "新密碼格式錯誤";
    }
  }

  if (data.newPassword !== data.confirmPassword) {
    errors.confirmPassword = "確認密碼與新密碼不符";
  }

  return Object.keys(errors).length > 0 ? errors : null;
}

/** Validation for OAuth users setting a password for the first time (no current password) */
export function validateSetPasswordForm(data: {
  newPassword: string;
  confirmPassword: string;
}): Record<string, string> | null {
  const errors: Record<string, string> = {};

  try {
    passwordValidationSchema.newPassword.parse(data.newPassword);
  } catch (error) {
    if (error instanceof z.ZodError) {
      errors.newPassword = error.errors[0]?.message || "密碼格式錯誤";
    }
  }

  if (data.newPassword !== data.confirmPassword) {
    errors.confirmPassword = "確認密碼與新密碼不符";
  }

  return Object.keys(errors).length > 0 ? errors : null;
}

// Form state validation
export function isFormDirty(
  current: Record<string, any>,
  original: Record<string, any>
): boolean {
  return Object.keys(current).some(
    (key) =>
      current[key] !== original[key] &&
      !(current[key] === "" && original[key] === null)
  );
}

// Field sanitization
export function sanitizePhoneNumber(phone: string): string {
  return phone
    .replace(/\D/g, "")
    .replace(/^(\d{2})(\d{4})(\d{4})$/, "$1-$2-$3");
}

export function sanitizePostalCode(postalCode: string): string {
  return postalCode.replace(/\D/g, "");
}

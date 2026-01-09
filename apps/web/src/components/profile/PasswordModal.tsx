/**
 * PasswordModal Component
 * Handles password change/set functionality with proper validation.
 * Supports OAuth users who don't have a password yet (hasPassword=false).
 */

import { authClient } from "@blackliving/auth/client";
import {
  Alert,
  AlertDescription,
  Button,
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  Input,
  Label,
} from "@blackliving/ui";
import { Eye, EyeOff, Key, Loader2 } from "lucide-react";
import type React from "react";
import { useState } from "react";
import { validatePasswordForm } from "../../lib/validation";

type PasswordModalProps = {
  /** Whether user already has a password set (OAuth users may not) */
  hasPassword?: boolean;
  onSuccess?: (message: string) => void;
  onError?: (error: string) => void;
};

type PasswordFormData = {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
};

const initialFormData: PasswordFormData = {
  currentPassword: "",
  newPassword: "",
  confirmPassword: "",
};

// Top-level regex patterns for performance
const UPPERCASE_REGEX = /[A-Z]/;
const LOWERCASE_REGEX = /[a-z]/;
const NUMBER_REGEX = /\d/;
const SPECIAL_CHAR_REGEX = /[!@#$%^&*(),.?":{}|<>]/;

// Password strength rules with regex patterns
const passwordRules = [
  {
    key: "minLength",
    label: "至少8個字符",
    test: (p: string) => p.length >= 8,
  },
  {
    key: "hasUppercase",
    label: "一個大寫字母",
    test: (p: string) => UPPERCASE_REGEX.test(p),
  },
  {
    key: "hasLowercase",
    label: "一個小寫字母",
    test: (p: string) => LOWERCASE_REGEX.test(p),
  },
  {
    key: "hasNumber",
    label: "一個數字",
    test: (p: string) => NUMBER_REGEX.test(p),
  },
  {
    key: "hasSpecial",
    label: "一個特殊字符",
    test: (p: string) => SPECIAL_CHAR_REGEX.test(p),
  },
] as const;

// Calculate password strength score (0-5)
function getPasswordStrength(password: string): number {
  if (!password) return 0;
  return passwordRules.filter((rule) => rule.test(password)).length;
}

// Get strength label and color
function getStrengthConfig(strength: number): {
  label: string;
  colorClass: string;
  barColor: string;
} {
  if (strength === 0)
    return { label: "", colorClass: "text-gray-400", barColor: "bg-gray-200" };
  if (strength <= 2)
    return { label: "弱", colorClass: "text-red-500", barColor: "bg-red-500" };
  if (strength <= 3)
    return {
      label: "中等",
      colorClass: "text-yellow-500",
      barColor: "bg-yellow-500",
    };
  if (strength <= 4)
    return {
      label: "強",
      colorClass: "text-green-500",
      barColor: "bg-green-500",
    };
  return {
    label: "非常強",
    colorClass: "text-green-600",
    barColor: "bg-green-600",
  };
}

// Password Strength Indicator Component
function PasswordStrengthIndicator({ password }: { password: string }) {
  const strength = getPasswordStrength(password);
  const config = getStrengthConfig(strength);

  if (!password) return null;

  return (
    <div className="mt-2 space-y-2">
      {/* Strength Bar */}
      <div className="flex items-center gap-2">
        <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-gray-200">
          <div
            className={`h-full transition-all duration-300 ${config.barColor}`}
            style={{ width: `${(strength / 5) * 100}%` }}
          />
        </div>
        <span className={`font-medium text-xs ${config.colorClass}`}>
          {config.label}
        </span>
      </div>

      {/* Rules Checklist */}
      <ul className="grid grid-cols-2 gap-1 text-xs">
        {passwordRules.map((rule) => {
          const passed = rule.test(password);
          return (
            <li
              className={`flex items-center gap-1 transition-colors duration-200 ${
                passed ? "text-green-600" : "text-gray-400"
              }`}
              key={rule.key}
            >
              <span className="text-[10px]">{passed ? "✓" : "○"}</span>
              {rule.label}
            </li>
          );
        })}
      </ul>
    </div>
  );
}

export function PasswordModal({
  hasPassword = true,
  onSuccess,
  onError,
}: PasswordModalProps) {
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState<PasswordFormData>(initialFormData);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false,
  });

  // Handle input changes
  const handleInputChange = (field: keyof PasswordFormData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));

    // Clear field error when user types
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: "" }));
    }
  };

  // Toggle password visibility
  const togglePasswordVisibility = (field: "current" | "new" | "confirm") => {
    setShowPasswords((prev) => ({ ...prev, [field]: !prev[field] }));
  };

  // Validate form
  const validateForm = (): boolean => {
    const validationErrors = validatePasswordForm(formData);
    if (validationErrors) {
      setErrors(validationErrors);
      return false;
    }
    setErrors({});
    return true;
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);

    try {
      // Use Better Auth client for proper authentication
      const result = await authClient.changePassword({
        currentPassword: formData.currentPassword,
        newPassword: formData.newPassword,
      });

      if (result.error) {
        const errorMsg = result.error.message || "密碼更新失敗";
        setErrors({ currentPassword: errorMsg });
        onError?.(errorMsg);
        return;
      }

      setShowModal(false);
      setFormData(initialFormData);
      setErrors({});
      onSuccess?.("密碼更新成功！");
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "網路錯誤，請稍後再試";
      setErrors({ currentPassword: errorMessage });
      onError?.(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Check if form is valid
  const isFormValid = () =>
    formData.currentPassword &&
    formData.newPassword &&
    formData.confirmPassword &&
    Object.values(errors).every((e) => !e);

  // Don't render for OAuth-only users (no password to change)
  if (!hasPassword) {
    return null;
  }

  return (
    <Dialog
      onOpenChange={(open) => {
        if (open || isSubmitting) {
          setShowModal(open);
        } else {
          setShowModal(false);
          setFormData(initialFormData);
          setErrors({});
          setShowPasswords({ current: false, new: false, confirm: false });
        }
      }}
      open={showModal}
    >
      <DialogTrigger asChild>
        <Button variant="outline">
          <Key className="mr-2 h-4 w-4" />
          更改密碼
        </Button>
      </DialogTrigger>

      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>更改密碼</DialogTitle>
        </DialogHeader>

        <form className="space-y-4" onSubmit={handleSubmit}>
          {/* Current Password */}
          <div className="space-y-2">
            <Label htmlFor="currentPassword">目前密碼 *</Label>
            <div className="relative">
              <Input
                className={
                  errors.currentPassword ? "border-red-500 pr-10" : "pr-10"
                }
                id="currentPassword"
                onChange={(e) =>
                  handleInputChange("currentPassword", e.target.value)
                }
                placeholder="請輸入目前密碼"
                required
                type={showPasswords.current ? "text" : "password"}
                value={formData.currentPassword}
              />
              <Button
                className="absolute top-1/2 right-2 h-auto -translate-y-1/2 p-1"
                onClick={() => togglePasswordVisibility("current")}
                size="sm"
                type="button"
                variant="ghost"
              >
                {showPasswords.current ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </Button>
            </div>
            {errors.currentPassword && (
              <p className="text-red-500 text-sm">{errors.currentPassword}</p>
            )}
          </div>

          {/* New Password */}
          <div className="space-y-2">
            <Label htmlFor="newPassword">新密碼 *</Label>
            <div className="relative">
              <Input
                className={
                  errors.newPassword ? "border-red-500 pr-10" : "pr-10"
                }
                id="newPassword"
                onChange={(e) =>
                  handleInputChange("newPassword", e.target.value)
                }
                placeholder="請輸入新密碼"
                required
                type={showPasswords.new ? "text" : "password"}
                value={formData.newPassword}
              />
              <Button
                className="absolute top-1/2 right-2 h-auto -translate-y-1/2 p-1"
                onClick={() => togglePasswordVisibility("new")}
                size="sm"
                type="button"
                variant="ghost"
              >
                {showPasswords.new ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </Button>
            </div>
            {errors.newPassword && (
              <p className="text-red-500 text-sm">{errors.newPassword}</p>
            )}
            <PasswordStrengthIndicator password={formData.newPassword} />
          </div>

          {/* Confirm Password */}
          <div className="space-y-2">
            <Label htmlFor="confirmPassword">確認新密碼 *</Label>
            <div className="relative">
              <Input
                className={
                  errors.confirmPassword ? "border-red-500 pr-10" : "pr-10"
                }
                id="confirmPassword"
                onChange={(e) =>
                  handleInputChange("confirmPassword", e.target.value)
                }
                placeholder="請再次輸入新密碼"
                required
                type={showPasswords.confirm ? "text" : "password"}
                value={formData.confirmPassword}
              />
              <Button
                className="absolute top-1/2 right-2 h-auto -translate-y-1/2 p-1"
                onClick={() => togglePasswordVisibility("confirm")}
                size="sm"
                type="button"
                variant="ghost"
              >
                {showPasswords.confirm ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </Button>
            </div>
            {errors.confirmPassword && (
              <p className="text-red-500 text-sm">{errors.confirmPassword}</p>
            )}
          </div>

          {/* Security Tips */}
          <Alert>
            <AlertDescription className="text-sm">
              <strong>密碼安全提示：</strong>
              <ul className="mt-1 ml-4 list-disc space-y-1 text-xs">
                <li>使用至少8個字符的密碼</li>
                <li>包含大小寫字母、數字</li>
                <li>避免使用個人資訊</li>
                <li>定期更新密碼</li>
              </ul>
            </AlertDescription>
          </Alert>

          {/* Action Buttons */}
          <div className="flex justify-end space-x-2 pt-4">
            <Button
              disabled={isSubmitting}
              onClick={() => setShowModal(false)}
              type="button"
              variant="outline"
            >
              取消
            </Button>
            <Button disabled={!isFormValid() || isSubmitting} type="submit">
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  處理中...
                </>
              ) : (
                "更新密碼"
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

/**
 * PasswordModal Component
 * Handles password change functionality with proper validation
 */

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

interface PasswordModalProps {
  onSuccess?: (message: string) => void;
  onError?: (error: string) => void;
}

interface PasswordFormData {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

const initialFormData: PasswordFormData = {
  currentPassword: "",
  newPassword: "",
  confirmPassword: "",
};

export function PasswordModal({ onSuccess, onError }: PasswordModalProps) {
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
      const response = await fetch("/api/auth/change-password", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          currentPassword: formData.currentPassword,
          newPassword: formData.newPassword,
        }),
        credentials: "include",
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();

      if (result.success) {
        setShowModal(false);
        setFormData(initialFormData);
        setErrors({});
        onSuccess?.(result.message || "密碼更新成功！");
      } else {
        setErrors({ currentPassword: result.error || "密碼更新失敗" });
        onError?.(result.error || "密碼更新失敗");
      }
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "網路錯誤，請稍後再試";
      setErrors({ currentPassword: errorMessage });
      onError?.(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle modal close
  const handleClose = () => {
    if (!isSubmitting) {
      setShowModal(false);
      setFormData(initialFormData);
      setErrors({});
      setShowPasswords({ current: false, new: false, confirm: false });
    }
  };

  // Check if form is valid
  const isFormValid = () =>
    formData.currentPassword &&
    formData.newPassword &&
    formData.confirmPassword &&
    Object.keys(errors).length === 0;

  return (
    <Dialog onOpenChange={handleClose} open={showModal}>
      <DialogTrigger asChild>
        <Button onClick={() => setShowModal(true)} variant="outline">
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
            <p className="text-gray-600 text-xs">
              密碼至少需要8個字符，包含大小寫字母和數字
            </p>
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
              onClick={handleClose}
              type="button"
              variant="outline"
            >
              取消
            </Button>
            <Button disabled={!isFormValid() || isSubmitting} type="submit">
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  更新中...
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

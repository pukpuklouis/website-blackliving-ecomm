import type { ProfileUpdateRequest } from "@blackliving/types";
import {
  Alert,
  AlertDescription,
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Input,
  Label,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Separator,
} from "@blackliving/ui";
import { Loader2, Save } from "lucide-react";
import type React from "react";
import { useEffect, useState } from "react";
import { useProfile } from "../../hooks/use-profile";
import {
  validateFirstName,
  validateLastName,
  validatePhone,
} from "../../lib/validation";

type ProfileFormProps = {
  className?: string;
  onSuccess?: (message: string) => void;
  onError?: (error: string) => void;
};

type FormData = {
  firstName: string;
  lastName: string;
  phone: string;
  birthday: string;
  gender: string;
  contactPreference: string;
};

export function ProfileForm({
  className,
  onSuccess,
  onError,
}: ProfileFormProps) {
  const {
    profile,
    loading,
    error,
    isDirty,
    updateProfile,
    checkDirty,
    resetForm,
  } = useProfile();

  const [formData, setFormData] = useState<FormData>({
    firstName: "",
    lastName: "",
    phone: "",
    birthday: "",
    gender: "unspecified",
    contactPreference: "email",
  });

  const [errors, setErrors] = useState<Partial<Record<keyof FormData, string>>>(
    {}
  );
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");

  // Sync form data with profile
  useEffect(() => {
    if (
      profile &&
      profile.user &&
      profile.customerProfile &&
      profile.userProfile
    ) {
      setFormData({
        firstName: profile.user.firstName || "",
        lastName: profile.user.lastName || "",
        phone: profile.customerProfile.phone || "",
        birthday: profile.userProfile.birthday || "",
        gender: profile.userProfile.gender || "unspecified",
        contactPreference: profile.userProfile.contactPreference || "email",
      });
    }
  }, [profile]);

  // Check if form is dirty whenever data changes
  const [localIsDirty, setLocalIsDirty] = useState(false);

  useEffect(() => {
    if (
      profile &&
      profile.user &&
      profile.customerProfile &&
      profile.userProfile
    ) {
      const dirty =
        formData.firstName !== (profile.user.firstName || "") ||
        formData.lastName !== (profile.user.lastName || "") ||
        formData.phone !== (profile.customerProfile.phone || "") ||
        (formData.birthday !== "" &&
          formData.birthday !== (profile.userProfile.birthday || "")) ||
        (formData.gender !== "unspecified" &&
          formData.gender !== (profile.userProfile.gender || "unspecified")) ||
        formData.contactPreference !==
          (profile.userProfile.contactPreference || "email");

      setLocalIsDirty(dirty);
      checkDirty({
        firstName: formData.firstName,
        lastName: formData.lastName,
        phone: formData.phone,
        birthday: formData.birthday,
        gender: formData.gender === "unspecified" ? undefined : formData.gender,
        contactPreference: formData.contactPreference,
      });
    }
  }, [formData, profile, checkDirty]);

  // Handle input changes with validation
  const handleInputChange = (field: keyof FormData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    setSuccessMessage(""); // Clear success message on edit

    // Real-time validation
    let error = "";
    switch (field) {
      case "firstName":
        error = validateFirstName(value) || "";
        break;
      case "lastName":
        error = validateLastName(value) || "";
        break;
      case "phone":
        // Only validate phone if it's not empty
        if (value.trim() !== "") {
          error = validatePhone(value) || "";
        }
        break;
    }

    setErrors((prev) => ({ ...prev, [field]: error || undefined }));
  };

  // Validate entire form
  const validateForm = (): boolean => {
    const newErrors: Partial<Record<keyof FormData, string>> = {};

    const firstNameError = validateFirstName(formData.firstName);
    if (firstNameError) newErrors.firstName = firstNameError;

    const lastNameError = validateLastName(formData.lastName);
    if (lastNameError) newErrors.lastName = lastNameError;

    const phoneError = validatePhone(formData.phone);
    if (phoneError) newErrors.phone = phoneError;

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);

    try {
      const updateData: ProfileUpdateRequest = {
        firstName: formData.firstName,
        lastName: formData.lastName,
        phone: formData.phone || undefined,
        birthday: formData.birthday || undefined,
        gender: (formData.gender === "unspecified"
          ? undefined
          : formData.gender) as "male" | "female" | "other" | undefined,
        contactPreference: formData.contactPreference as
          | "email"
          | "phone"
          | "sms",
      };

      // Remove empty strings and convert to undefined
      Object.keys(updateData).forEach((key) => {
        const value = updateData[key as keyof ProfileUpdateRequest];
        if (value === "") {
          delete updateData[key as keyof ProfileUpdateRequest];
        }
      });

      const result = await updateProfile(updateData);

      if (result.success) {
        setSuccessMessage(result.message || "個人資料更新成功！");
        setLocalIsDirty(false);
        setTimeout(() => setSuccessMessage(""), 3000); // Auto-hide after 3 seconds
      } else {
        onError?.(result.error || "更新失敗");
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "更新失敗";
      onError?.(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle form reset
  const handleReset = () => {
    const originalProfile = resetForm();
    if (
      originalProfile &&
      originalProfile.user &&
      originalProfile.customerProfile &&
      originalProfile.userProfile
    ) {
      setFormData({
        firstName: originalProfile.user.firstName || "",
        lastName: originalProfile.user.lastName || "",
        phone: originalProfile.customerProfile.phone || "",
        birthday: originalProfile.userProfile.birthday || "",
        gender: originalProfile.userProfile.gender || "unspecified",
        contactPreference:
          originalProfile.userProfile.contactPreference || "email",
      });
    }
    setErrors({});
    setSuccessMessage("");
    setLocalIsDirty(false);
  };

  if (loading && !profile) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle>個人資料</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin" />
            <span className="ml-2">載入中...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error && !profile) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle>個人資料</CardTitle>
        </CardHeader>
        <CardContent>
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  return (
    <CardContent className="p-0 sm:p-6">
      {/* Header Section - visually distinct but clean */}
      <div className="mb-6 hidden sm:block">
        <h2 className="font-semibold text-lg text-slate-900">個人資料</h2>
        <p className="text-slate-500 text-sm">管理您的基本資訊與聯絡方式</p>
      </div>
      {!!successMessage && (
        <div className="fade-in slide-in-from-top-2 mb-4 flex animate-in items-center gap-2 rounded-lg border border-green-200 bg-green-50 px-3 py-2 text-green-700 text-sm">
          <svg
            className="h-4 w-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              d="M5 13l4 4L19 7"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
            />
          </svg>
          {successMessage}
        </div>
      )}

      <form className="space-y-8" onSubmit={handleSubmit}>
        {/* Group 1: Basic Info */}
        <div className="space-y-4">
          <h3 className="font-medium text-base text-slate-900">基本資料</h3>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label className="font-normal text-slate-600" htmlFor="lastName">
                姓氏 <span className="text-red-500">*</span>
              </Label>
              <Input
                className={`border-slate-200 focus:border-slate-900 ${errors.lastName ? "border-red-500" : ""}`}
                id="lastName"
                onChange={(e) => handleInputChange("lastName", e.target.value)}
                placeholder="請輸入姓氏"
                required
                type="text"
                value={formData.lastName}
              />
              {!!errors.lastName && (
                <p className="mt-1 text-red-500 text-xs">{errors.lastName}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label className="font-normal text-slate-600" htmlFor="firstName">
                名字 <span className="text-red-500">*</span>
              </Label>
              <Input
                className={`border-slate-200 focus:border-slate-900 ${errors.firstName ? "border-red-500" : ""}`}
                id="firstName"
                onChange={(e) => handleInputChange("firstName", e.target.value)}
                placeholder="請輸入名字"
                required
                type="text"
                value={formData.firstName}
              />
              {!!errors.firstName && (
                <p className="mt-1 text-red-500 text-xs">{errors.firstName}</p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label className="font-normal text-slate-600" htmlFor="birthday">
                生日
              </Label>
              <Input
                className="border-slate-200 focus:border-slate-900"
                id="birthday"
                onChange={(e) => handleInputChange("birthday", e.target.value)}
                type="date"
                value={formData.birthday}
              />
            </div>
            <div className="space-y-2">
              <Label className="font-normal text-slate-600" htmlFor="gender">
                性別
              </Label>
              <Select
                key={formData.gender}
                onValueChange={(value) => handleInputChange("gender", value)}
                value={formData.gender}
              >
                <SelectTrigger className="border-slate-200 focus:border-slate-900">
                  <SelectValue placeholder="請選擇性別" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="unspecified">不透露</SelectItem>
                  <SelectItem value="male">男性</SelectItem>
                  <SelectItem value="female">女性</SelectItem>
                  <SelectItem value="other">其他</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        <Separator className="bg-slate-100" />

        {/* Group 2: Contact Info */}
        <div className="space-y-4">
          <h3 className="font-medium text-base text-slate-900">聯絡資訊</h3>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label className="font-normal text-slate-600" htmlFor="phone">
                手機號碼
              </Label>
              <Input
                className={`border-slate-200 focus:border-slate-900 ${errors.phone ? "border-red-500" : ""}`}
                id="phone"
                onChange={(e) => handleInputChange("phone", e.target.value)}
                placeholder="09xxxxxxxx"
                type="tel"
                value={formData.phone}
              />
              {errors.phone ? (
                <p className="mt-1 text-red-500 text-xs">{errors.phone}</p>
              ) : (
                <p className="text-slate-400 text-xs">格式：09xxxxxxxx</p>
              )}
            </div>

            <div className="space-y-2">
              <Label
                className="font-normal text-slate-600"
                htmlFor="contactPreference"
              >
                聯絡方式偏好
              </Label>
              <Select
                key={formData.contactPreference}
                onValueChange={(value) =>
                  handleInputChange("contactPreference", value)
                }
                value={formData.contactPreference}
              >
                <SelectTrigger className="border-slate-200 focus:border-primary-900">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="email">電子郵件</SelectItem>
                  <SelectItem value="phone">電話</SelectItem>
                  <SelectItem value="sms">簡訊</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        {/* Action Bar - Sticky on Mobile */}
        <div
          className={`fixed right-0 bottom-0 left-0 z-50 flex items-center justify-between border-t bg-white/90 p-4 backdrop-blur-sm transition-transform duration-300 sm:static sm:z-0 sm:border-0 sm:bg-transparent sm:p-0 ${localIsDirty ? "translate-y-0" : "translate-y-full sm:translate-y-0"}
            `}
        >
          <div className="flex items-center gap-2 sm:hidden">
            {!!localIsDirty && (
              <span className="font-medium text-amber-600 text-xs">
                有未儲存的變更
              </span>
            )}
          </div>

          <div className="flex w-full items-center justify-end gap-3 sm:w-auto">
            {!!localIsDirty && (
              <Button
                className="flex-1 text-slate-600 hover:bg-slate-100 hover:text-slate-900 sm:flex-none"
                onClick={handleReset}
                type="button"
                variant="ghost"
              >
                取消變更
              </Button>
            )}

            <Button
              className="flex-1 sm:flex-none"
              disabled={
                !localIsDirty ||
                isSubmitting ||
                Object.keys(errors).some((key) => errors[key as keyof FormData])
              }
              type="submit"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  儲存中
                </>
              ) : (
                <>
                  <Save className="mr-2 h-4 w-4" />
                  儲存變更
                </>
              )}
            </Button>
          </div>
        </div>
      </form>
    </CardContent>
    // No wrapper Card here as per new design
  );
}

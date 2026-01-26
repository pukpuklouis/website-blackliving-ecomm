import type { ProfileUpdateRequest } from "@blackliving/types";
import {
  Alert,
  AlertDescription,
  Input,
  Label,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@blackliving/ui";
import {
  Calendar,
  CheckCircle,
  Contact,
  Info,
  Loader2,
  Pencil,
  User,
} from "lucide-react";
import { useEffect, useState } from "react";
import { useProfile } from "../../hooks/use-profile";
import { validateFirstName, validateLastName } from "../../lib/validation";

// Top-level regex for performance (avoids recreation on each call)
const PHONE_REGEX = /^09\d{8}$/;

type ProfileFormProps = {
  className?: string;
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

export function ProfileForm({ className, onError }: ProfileFormProps) {
  const { profile, loading, error, updateProfile, checkDirty, resetForm } =
    useProfile();

  // State
  const [formData, setFormData] = useState<FormData>({
    firstName: "",
    lastName: "",
    phone: "",
    birthday: "",
    gender: "unspecified",
    contactPreference: "email",
  });

  const [initialData, setInitialData] = useState<FormData | null>(null);
  const [errors, setErrors] = useState<Partial<Record<keyof FormData, string>>>(
    {}
  );
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [showStickyFooter, setShowStickyFooter] = useState(false);

  // Sync with profile data
  useEffect(() => {
    console.log("[ProfileForm] useEffect triggered, profile:", profile);
    if (profile?.user && profile?.customerProfile && profile?.userProfile) {
      const data = {
        firstName: profile.user.firstName || "",
        lastName: profile.user.lastName || "",
        phone: profile.customerProfile.phone || "",
        birthday: profile.userProfile.birthday || "",
        gender: profile.userProfile.gender || "unspecified",
        contactPreference: profile.userProfile.contactPreference || "email",
      };
      console.log("[ProfileForm] Setting formData to:", data);
      setFormData(data);
      setInitialData(data);
    }
  }, [profile]);

  // Dirty State Check & Completion Calculation
  useEffect(() => {
    if (!initialData) return;

    // Efficient dirty check using key-by-key comparison
    const isDirty = Object.keys(formData).some(
      (key) => formData[key as keyof FormData] !== initialData[key as keyof FormData]
    );
    setShowStickyFooter(isDirty);

    // Sync dirty state with useProfile hook
    checkDirty({
      firstName: formData.firstName,
      lastName: formData.lastName,
      phone: formData.phone,
      birthday: formData.birthday,
      gender: (formData.gender === "unspecified"
        ? undefined
        : formData.gender) as "male" | "female" | "other" | undefined,
      contactPreference: formData.contactPreference as
        | "email"
        | "phone"
        | "sms",
    });
  }, [formData, initialData, checkDirty]);

  // Completion Calculation (firstName + lastName required)
  const completionPercentage = (() => {
    const required = ["firstName", "lastName"];
    const filled = required.filter(
      (field) => !!formData[field as keyof FormData]?.trim()
    ).length;
    return Math.floor((filled / required.length) * 100);
  })();

  const isComplete = completionPercentage === 100;

  // Validation Logic
  const validateField = (field: keyof FormData, value: string): string => {
    switch (field) {
      case "firstName":
        return validateFirstName(value) || "";
      case "lastName":
        return validateLastName(value) || "";
      case "phone":
        // Spec 3.2: Accept format: 09xxxxxxxx
        if (value && !PHONE_REGEX.test(value)) {
          return "手機格式需為 09xxxxxxxx";
        }
        return "";
      case "birthday":
        // Spec 3.3: Prevent future dates
        if (value && new Date(value) > new Date()) {
          return "生日不能是未來日期";
        }
        return "";
      default:
        return "";
    }
  };

  const handleChange = (field: keyof FormData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    // Clear error immediately on change? Spec says validate on blur.
    // We can clear error on change to be nice, but validate strict on blur.
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: undefined }));
    }
  };

  const handleBlur = (field: keyof FormData) => {
    const errorMsg = validateField(field, formData[field]);
    setErrors((prev) => ({ ...prev, [field]: errorMsg || undefined }));
  };

  const handleSubmit = async () => {
    console.log("[ProfileForm] handleSubmit called");
    console.log("[ProfileForm] formData:", formData);
    console.log("[ProfileForm] initialData:", initialData);

    // Validate all
    const newErrors: Partial<Record<keyof FormData, string>> = {};
    let hasError = false;

    (Object.keys(formData) as Array<keyof FormData>).forEach((key) => {
      const errorMsg = validateField(key, formData[key]);
      if (errorMsg) {
        newErrors[key] = errorMsg;
        hasError = true;
      }
    });

    console.log(
      "[ProfileForm] validation errors:",
      newErrors,
      "hasError:",
      hasError
    );

    if (hasError) {
      setErrors(newErrors);
      return;
    }

    setIsSubmitting(true);
    try {
      // API Call
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

      // Clean undefined/empty
      Object.keys(updateData).forEach((key) => {
        if (updateData[key as keyof ProfileUpdateRequest] === "") {
          delete updateData[key as keyof ProfileUpdateRequest];
        }
      });

      const result = await updateProfile(updateData);

      if (result.success) {
        setSuccessMessage("個人資料已成功更新");
        setErrorMessage("");
        setInitialData(formData); // Reset dirty
        setShowStickyFooter(false);
        setTimeout(() => setSuccessMessage(""), 3000);
      } else {
        setErrorMessage(result.error || "更新失敗");
        setSuccessMessage("");
        setTimeout(() => setErrorMessage(""), 5000);
        onError?.(result.error || "更新失敗");
      }
    } catch (err) {
      const errMsg = err instanceof Error ? err.message : "更新失敗";
      setErrorMessage(errMsg);
      setSuccessMessage("");
      setTimeout(() => setErrorMessage(""), 5000);
      onError?.(errMsg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    const originalProfile = resetForm();
    if (
      originalProfile?.user &&
      originalProfile?.customerProfile &&
      originalProfile?.userProfile
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
    } else if (initialData) {
      setFormData(initialData);
    }
    setErrors({});
    setShowStickyFooter(false);
  };

  if (loading && !profile) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-slate-400" />
        <span className="ml-2 text-slate-500">載入中...</span>
      </div>
    );
  }

  if (error && !profile) {
    return (
      <Alert variant="destructive">
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    );
  }

  const todayStr = new Date().toISOString().split("T")[0];

  return (
    <div className={`space-y-16 ${className || ""}`}>
      {/* Success Toast / Message */}
      {successMessage && (
        <div className="fixed top-4 right-4 z-50 flex items-center rounded-lg bg-green-600 px-4 py-3 text-white shadow-lg animate-in fade-in slide-in-from-top-2">
          <CheckCircle className="mr-2 h-5 w-5" />
          {successMessage}
        </div>
      )}

      {/* Error Toast / Message */}
      {errorMessage && (
        <div className="fixed top-4 right-4 z-50 flex items-center rounded-lg bg-red-600 px-4 py-3 text-white shadow-lg animate-in fade-in slide-in-from-top-2">
          <Info className="mr-2 h-5 w-5" />
          {errorMessage}
        </div>
      )}

      {/* Header Section */}
      <div className="flex flex-col justify-between gap-6 md:flex-row md:items-center">
        <div>
          <h1 className="mb-2 text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
            個人資料
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            管理您的基本資訊與聯絡方式
          </p>
        </div>

        {/* Completion Status */}
        {isComplete ? (
          <div className="flex items-center gap-2 rounded-full border border-slate-100 bg-slate-50 px-4 py-2 dark:border-slate-700/50 dark:bg-slate-800/50">
            <CheckCircle className="h-5 w-5 text-green-500" />
            <span className="text-sm font-medium text-slate-600 dark:text-slate-300">
              個人資料已完成
            </span>
          </div>
        ) : (
          <div className="flex items-center gap-2 rounded-full border border-slate-100 bg-slate-50 px-4 py-2 dark:border-slate-700/50 dark:bg-slate-800/50">
            <div className="h-5 w-5 text-slate-400">
              <span className="text-xs font-bold">{completionPercentage}%</span>
            </div>
            <span className="text-sm font-medium text-slate-600 dark:text-slate-300">
              資料完整度
            </span>
          </div>
        )}
      </div>

      <div className="space-y-16">
        {/* Section 1: Basic Data */}
        <section>
          <div className="mb-8 flex items-center gap-3">
            <User className="h-6 w-6 text-primary" />
            <h2 className="text-xl font-bold text-slate-900 dark:text-white">
              基本資料
            </h2>
          </div>

          <div className="grid gap-x-10 gap-y-8 md:grid-cols-2">
            <div className="space-y-2">
              <Label
                htmlFor="lastName"
                className="text-sm font-medium text-slate-700 dark:text-slate-300"
              >
                姓氏 <span className="text-red-500">*</span>
              </Label>
              <Input
                id="lastName"
                placeholder="請輸入姓氏"
                value={formData.lastName}
                onChange={(e) => handleChange("lastName", e.target.value)}
                onBlur={() => handleBlur("lastName")}
                className={`w-full rounded-lg border bg-white px-4 py-6 text-base outline-none transition-all focus:border-primary focus:ring-2 focus:ring-primary/20 dark:bg-slate-800 dark:text-white ${errors.lastName ? "border-red-500" : "border-slate-200 dark:border-slate-700"}`}
              />
              {errors.lastName && (
                <p className="text-xs text-red-500">{errors.lastName}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label
                htmlFor="firstName"
                className="text-sm font-medium text-slate-700 dark:text-slate-300"
              >
                名字 <span className="text-red-500">*</span>
              </Label>
              <Input
                id="firstName"
                placeholder="請輸入名字"
                value={formData.firstName}
                onChange={(e) => handleChange("firstName", e.target.value)}
                onBlur={() => handleBlur("firstName")}
                className={`w-full rounded-lg border bg-white px-4 py-6 text-base outline-none transition-all focus:border-primary focus:ring-2 focus:ring-primary/20 dark:bg-slate-800 dark:text-white ${errors.firstName ? "border-red-500" : "border-slate-200 dark:border-slate-700"}`}
              />
              {errors.firstName && (
                <p className="text-xs text-red-500">{errors.firstName}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label
                htmlFor="birthday"
                className="text-sm font-medium text-slate-700 dark:text-slate-300"
              >
                生日
              </Label>
              <div className="relative">
                <Input
                  id="birthday"
                  type="date"
                  placeholder="YYYY/MM/DD"
                  max={todayStr}
                  value={formData.birthday}
                  onChange={(e) => handleChange("birthday", e.target.value)}
                  onBlur={() => handleBlur("birthday")}
                  className={`w-full rounded-lg border bg-white px-4 py-6 text-base outline-none transition-all focus:border-primary focus:ring-2 focus:ring-primary/20 dark:bg-slate-800 dark:text-white ${errors.birthday ? "border-red-500" : "border-slate-200 dark:border-slate-700"}`}
                />
                <Calendar className="pointer-events-none absolute right-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
              </div>
              {errors.birthday && (
                <p className="text-xs text-red-500">{errors.birthday}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label
                htmlFor="gender"
                className="text-sm font-medium text-slate-700 dark:text-slate-300"
              >
                性別
              </Label>
              <div className="relative">
                <Select
                  value={formData.gender}
                  onValueChange={(val) => handleChange("gender", val)}
                >
                  <SelectTrigger className="w-full rounded-lg border border-slate-200 bg-white px-4 py-6 text-base transition-all focus:border-primary focus:ring-2 focus:ring-primary/20 dark:border-slate-700 dark:bg-slate-800 dark:text-white">
                    <SelectValue placeholder="不透露" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="male">男性</SelectItem>
                    <SelectItem value="female">女性</SelectItem>
                    <SelectItem value="unspecified">不透露</SelectItem>
                    <SelectItem value="other">其他</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        </section>

        {/* Section 2: Contact Info */}
        <section>
          <div className="mb-8 flex items-center gap-3">
            <Contact className="h-6 w-6 text-primary" />
            <h2 className="text-xl font-bold text-slate-900 dark:text-white">
              聯絡資訊
            </h2>
          </div>

          <div className="grid gap-x-10 gap-y-8 md:grid-cols-2">
            <div className="space-y-2">
              <Label
                htmlFor="phone"
                className="text-sm font-medium text-slate-700 dark:text-slate-300"
              >
                手機號碼
              </Label>
              <div className="relative">
                <Input
                  id="phone"
                  type="tel"
                  placeholder="09xxxxxxxx"
                  value={formData.phone}
                  onChange={(e) => handleChange("phone", e.target.value)}
                  onBlur={() => handleBlur("phone")}
                  className={`w-full rounded-lg border bg-white px-4 py-6 text-base outline-none transition-all focus:border-primary focus:ring-2 focus:ring-primary/20 dark:bg-slate-800 dark:text-white ${errors.phone ? "border-red-500" : "border-primary/50 dark:border-primary/50"}`}
                />
                {!errors.phone &&
                  formData.phone &&
                  /^09\d{8}$/.test(formData.phone) && (
                    <CheckCircle className="absolute right-4 top-1/2 h-5 w-5 -translate-y-1/2 text-green-500" />
                  )}
                {errors.phone && (
                  <p className="absolute -bottom-6 left-0 text-xs text-red-500">
                    {errors.phone}
                  </p>
                )}
                {!errors.phone && !formData.phone && (
                  <Pencil className="absolute right-4 top-1/2 h-5 w-5 -translate-y-1/2 text-primary" />
                )}
              </div>
              <p className="mt-1.5 font-medium tracking-tight text-xs text-slate-400">
                格式：09xxxxxxxx
              </p>
            </div>

            <div className="space-y-2">
              <Label
                htmlFor="contactPreference"
                className="text-sm font-medium text-slate-700 dark:text-slate-300"
              >
                聯絡方式偏好
              </Label>
              <Select
                value={formData.contactPreference}
                onValueChange={(val) => handleChange("contactPreference", val)}
              >
                <SelectTrigger className="w-full rounded-lg border border-slate-200 bg-white px-4 py-6 text-base transition-all focus:border-primary focus:ring-2 focus:ring-primary/20 dark:border-slate-700 dark:bg-slate-800 dark:text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="email">電子郵件</SelectItem>
                  <SelectItem value="phone">電話</SelectItem>
                  <SelectItem value="sms">簡訊</SelectItem>
                </SelectContent>
              </Select>
              <p className="mt-2 flex items-center gap-1.5 font-medium text-xs text-slate-500 dark:text-slate-400">
                <Info className="h-[14px] w-[14px]" />
                我們將優先使用此方式與您聯繫
              </p>
            </div>
          </div>
        </section>
      </div>

      {/* Sticky Footer for Unsaved Changes */}
      {showStickyFooter && (
        <div className="fixed bottom-10 left-0 right-0 z-50 px-6 animate-in slide-in-from-bottom-4">
          <div className="mx-auto max-w-4xl">
            <div className="flex items-center justify-between rounded-xl border border-slate-700 bg-[#1e293b] px-8 py-5 text-white shadow-[0_20px_50px_rgba(0,0,0,0.3)]">
              <div className="flex items-center gap-4">
                <div className="relative flex items-center justify-center">
                  <div className="absolute h-3 w-3 animate-ping rounded-full bg-primary/20" />
                  <div className="relative h-2 w-2 rounded-full bg-primary" />
                </div>
                <span className="font-medium tracking-wide text-sm">
                  您有尚未儲存的變更
                </span>
              </div>
              <div className="flex items-center gap-8">
                <button
                  onClick={handleCancel}
                  type="button"
                  className="font-medium text-slate-400 text-sm transition-colors hover:text-white"
                >
                  取消
                </button>
                <button
                  onClick={handleSubmit}
                  disabled={isSubmitting}
                  className="rounded-lg bg-primary px-10 py-2.5 font-bold text-sm text-white shadow-lg shadow-primary/20 transition-all active:scale-95 hover:bg-primary/90 disabled:opacity-50"
                >
                  {isSubmitting ? (
                    <div className="flex items-center gap-2">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      儲存中
                    </div>
                  ) : (
                    "立即儲存"
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

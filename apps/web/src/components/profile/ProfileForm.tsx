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

// biome-ignore lint/complexity/noExcessiveCognitiveComplexity: form component requires coordinated state, validation, dirty tracking, and conditional UI rendering
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
    if (!initialData) {
      return;
    }

    // Efficient dirty check using key-by-key comparison
    const isDirty = Object.keys(formData).some(
      (key) =>
        formData[key as keyof FormData] !== initialData[key as keyof FormData]
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

  // biome-ignore lint/complexity/noExcessiveCognitiveComplexity: form submission logic requires validation and API handling in one flow
  const handleSubmit = async () => {
    console.log("[ProfileForm] handleSubmit called");
    console.log("[ProfileForm] formData:", formData);
    console.log("[ProfileForm] initialData:", initialData);

    // Validate all
    const newErrors: Partial<Record<keyof FormData, string>> = {};
    let hasError = false;

    for (const key of Object.keys(formData) as Array<keyof FormData>) {
      const errorMsg = validateField(key, formData[key]);
      if (errorMsg) {
        newErrors[key] = errorMsg;
        hasError = true;
      }
    }

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
      for (const key of Object.keys(updateData)) {
        if (updateData[key as keyof ProfileUpdateRequest] === "") {
          delete updateData[key as keyof ProfileUpdateRequest];
        }
      }

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
      {successMessage ? (
        <div className="fade-in slide-in-from-top-2 fixed top-4 right-4 z-50 flex animate-in items-center rounded-lg bg-green-600 px-4 py-3 text-white shadow-lg">
          <CheckCircle className="mr-2 h-5 w-5" />
          {successMessage}
        </div>
      ) : null}

      {/* Error Toast / Message */}
      {errorMessage ? (
        <div className="fade-in slide-in-from-top-2 fixed top-4 right-4 z-50 flex animate-in items-center rounded-lg bg-red-600 px-4 py-3 text-white shadow-lg">
          <Info className="mr-2 h-5 w-5" />
          {errorMessage}
        </div>
      ) : null}

      {/* Header Section */}
      <div className="flex flex-col justify-between gap-6 md:flex-row md:items-center">
        <div>
          <h1 className="mb-2 font-bold text-3xl text-slate-900 tracking-tight dark:text-white">
            個人資料
          </h1>
          <p className="text-slate-500 text-sm dark:text-slate-400">
            管理您的基本資訊與聯絡方式
          </p>
        </div>

        {/* Completion Status */}
        {isComplete ? (
          <div className="flex items-center gap-2 rounded-full border border-slate-100 bg-slate-50 px-4 py-2 dark:border-slate-700/50 dark:bg-slate-800/50">
            <CheckCircle className="h-5 w-5 text-green-500" />
            <span className="font-medium text-slate-600 text-sm dark:text-slate-300">
              個人資料已完成
            </span>
          </div>
        ) : (
          <div className="flex items-center gap-2 rounded-full border border-slate-100 bg-slate-50 px-4 py-2 dark:border-slate-700/50 dark:bg-slate-800/50">
            <div className="h-5 w-5 text-slate-400">
              <span className="font-bold text-xs">{completionPercentage}%</span>
            </div>
            <span className="font-medium text-slate-600 text-sm dark:text-slate-300">
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
            <h2 className="font-bold text-slate-900 text-xl dark:text-white">
              基本資料
            </h2>
          </div>

          <div className="grid gap-x-10 gap-y-8 md:grid-cols-2">
            <div className="space-y-2">
              <Label
                className="font-medium text-slate-700 text-sm dark:text-slate-300"
                htmlFor="lastName"
              >
                姓氏 <span className="text-red-500">*</span>
              </Label>
              <Input
                className={`w-full rounded-lg border bg-white px-4 py-6 text-base outline-none transition-all focus:border-primary focus:ring-2 focus:ring-primary/20 dark:bg-slate-800 dark:text-white ${errors.lastName ? "border-red-500" : "border-slate-200 dark:border-slate-700"}`}
                id="lastName"
                onBlur={() => handleBlur("lastName")}
                onChange={(e) => handleChange("lastName", e.target.value)}
                placeholder="請輸入姓氏"
                value={formData.lastName}
              />
              {errors.lastName ? (
                <p className="text-red-500 text-xs">{errors.lastName}</p>
              ) : null}
            </div>

            <div className="space-y-2">
              <Label
                className="font-medium text-slate-700 text-sm dark:text-slate-300"
                htmlFor="firstName"
              >
                名字 <span className="text-red-500">*</span>
              </Label>
              <Input
                className={`w-full rounded-lg border bg-white px-4 py-6 text-base outline-none transition-all focus:border-primary focus:ring-2 focus:ring-primary/20 dark:bg-slate-800 dark:text-white ${errors.firstName ? "border-red-500" : "border-slate-200 dark:border-slate-700"}`}
                id="firstName"
                onBlur={() => handleBlur("firstName")}
                onChange={(e) => handleChange("firstName", e.target.value)}
                placeholder="請輸入名字"
                value={formData.firstName}
              />
              {errors.firstName ? (
                <p className="text-red-500 text-xs">{errors.firstName}</p>
              ) : null}
            </div>

            <div className="space-y-2">
              <Label
                className="font-medium text-slate-700 text-sm dark:text-slate-300"
                htmlFor="birthday"
              >
                生日
              </Label>
              <div className="relative">
                <Input
                  className={`w-full rounded-lg border bg-white px-4 py-6 text-base outline-none transition-all focus:border-primary focus:ring-2 focus:ring-primary/20 dark:bg-slate-800 dark:text-white ${errors.birthday ? "border-red-500" : "border-slate-200 dark:border-slate-700"}`}
                  id="birthday"
                  max={todayStr}
                  onBlur={() => handleBlur("birthday")}
                  onChange={(e) => handleChange("birthday", e.target.value)}
                  placeholder="YYYY/MM/DD"
                  type="date"
                  value={formData.birthday}
                />
                <Calendar className="-translate-y-1/2 pointer-events-none absolute top-1/2 right-4 h-5 w-5 text-slate-400" />
              </div>
              {errors.birthday ? (
                <p className="text-red-500 text-xs">{errors.birthday}</p>
              ) : null}
            </div>

            <div className="space-y-2">
              <Label
                className="font-medium text-slate-700 text-sm dark:text-slate-300"
                htmlFor="gender"
              >
                性別
              </Label>
              <div className="relative">
                <Select
                  onValueChange={(val) => handleChange("gender", val)}
                  value={formData.gender}
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
            <h2 className="font-bold text-slate-900 text-xl dark:text-white">
              聯絡資訊
            </h2>
          </div>

          <div className="grid gap-x-10 gap-y-8 md:grid-cols-2">
            <div className="space-y-2">
              <Label
                className="font-medium text-slate-700 text-sm dark:text-slate-300"
                htmlFor="phone"
              >
                手機號碼
              </Label>
              <div className="relative">
                <Input
                  className={`w-full rounded-lg border bg-white px-4 py-6 text-base outline-none transition-all focus:border-primary focus:ring-2 focus:ring-primary/20 dark:bg-slate-800 dark:text-white ${errors.phone ? "border-red-500" : "border-primary/50 dark:border-primary/50"}`}
                  id="phone"
                  onBlur={() => handleBlur("phone")}
                  onChange={(e) => handleChange("phone", e.target.value)}
                  placeholder="09xxxxxxxx"
                  type="tel"
                  value={formData.phone}
                />
                {!errors.phone &&
                  formData.phone &&
                  PHONE_REGEX.test(formData.phone) && (
                    <CheckCircle className="-translate-y-1/2 absolute top-1/2 right-4 h-5 w-5 text-green-500" />
                  )}
                {errors.phone ? (
                  <p className="-bottom-6 absolute left-0 text-red-500 text-xs">
                    {errors.phone}
                  </p>
                ) : null}
                {!(errors.phone || formData.phone) && (
                  <Pencil className="-translate-y-1/2 absolute top-1/2 right-4 h-5 w-5 text-primary" />
                )}
              </div>
              <p className="mt-1.5 font-medium text-slate-400 text-xs tracking-tight">
                格式：09xxxxxxxx
              </p>
            </div>

            <div className="space-y-2">
              <Label
                className="font-medium text-slate-700 text-sm dark:text-slate-300"
                htmlFor="contactPreference"
              >
                聯絡方式偏好
              </Label>
              <Select
                onValueChange={(val) => handleChange("contactPreference", val)}
                value={formData.contactPreference}
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
              <p className="mt-2 flex items-center gap-1.5 font-medium text-slate-500 text-xs dark:text-slate-400">
                <Info className="h-[14px] w-[14px]" />
                我們將優先使用此方式與您聯繫
              </p>
            </div>
          </div>
        </section>
      </div>

      {/* Sticky Footer for Unsaved Changes */}
      {showStickyFooter ? (
        <div className="slide-in-from-bottom-4 fixed right-0 bottom-10 left-0 z-50 animate-in px-6">
          <div className="mx-auto max-w-4xl">
            <div className="flex items-center justify-between rounded-xl border border-slate-700 bg-[#1e293b] px-8 py-5 text-white shadow-[0_20px_50px_rgba(0,0,0,0.3)]">
              <div className="flex items-center gap-4">
                <div className="relative flex items-center justify-center">
                  <div className="absolute h-3 w-3 animate-ping rounded-full bg-primary/20" />
                  <div className="relative h-2 w-2 rounded-full bg-primary" />
                </div>
                <span className="font-medium text-sm tracking-wide">
                  您有尚未儲存的變更
                </span>
              </div>
              <div className="flex items-center gap-8">
                <button
                  className="font-medium text-slate-400 text-sm transition-colors hover:text-white"
                  onClick={handleCancel}
                  type="button"
                >
                  取消
                </button>
                <button
                  className="rounded-lg bg-primary px-10 py-2.5 font-bold text-sm text-white shadow-lg shadow-primary/20 transition-all hover:bg-primary/90 active:scale-95 disabled:opacity-50"
                  disabled={isSubmitting}
                  onClick={handleSubmit}
                  type="button"
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
      ) : null}
    </div>
  );
}

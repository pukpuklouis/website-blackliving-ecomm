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
} from "@blackliving/ui";
import { Loader2, RotateCcw, Save } from "lucide-react";
import type React from "react";
import { useEffect, useState } from "react";
import { useProfile } from "../../hooks/use-profile";
import {
  validateFirstName,
  validateLastName,
  validatePhone,
} from "../../lib/validation";

interface ProfileFormProps {
  className?: string;
  onSuccess?: (message: string) => void;
  onError?: (error: string) => void;
}

interface FormData {
  firstName: string;
  lastName: string;
  phone: string;
  birthday: string;
  gender: string;
  contactPreference: string;
}

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
    <Card className={className}>
      <CardHeader>
        <CardTitle>個人資料</CardTitle>
      </CardHeader>
      <CardContent>
        {successMessage && (
          <div className="relatvie mb-4 h-6 w-fit rounded-full border border-green-200 bg-green-50 p-2 text-green-600">
            <span className="relative mr-1 flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-green-400 opacity-75" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-green-500" />
            </span>
            <span className="w-fit text-xs">成功</span>
          </div>
        )}

        <form className="space-y-4" onSubmit={handleSubmit}>
          {/* Name Fields */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="firstName">姓氏 *</Label>
              <Input
                className={errors.firstName ? "border-red-500" : ""}
                id="firstName"
                onChange={(e) => handleInputChange("firstName", e.target.value)}
                placeholder="請輸入姓氏"
                required
                type="text"
                value={formData.firstName}
              />
              {errors.firstName && (
                <p className="text-red-500 text-sm">{errors.firstName}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="lastName">名字 *</Label>
              <Input
                className={errors.lastName ? "border-red-500" : ""}
                id="lastName"
                onChange={(e) => handleInputChange("lastName", e.target.value)}
                placeholder="請輸入名字"
                required
                type="text"
                value={formData.lastName}
              />
              {errors.lastName && (
                <p className="text-red-500 text-sm">{errors.lastName}</p>
              )}
            </div>
          </div>

          {/* Phone Field */}
          <div className="space-y-2">
            <Label htmlFor="phone">手機號碼</Label>
            <Input
              className={errors.phone ? "border-red-500" : ""}
              id="phone"
              onChange={(e) => handleInputChange("phone", e.target.value)}
              placeholder="09xxxxxxxx"
              type="tel"
              value={formData.phone}
            />
            {errors.phone && (
              <p className="text-red-500 text-sm">{errors.phone}</p>
            )}
            <p className="text-gray-600 text-sm">格式：09xxxxxxxx</p>
          </div>

          {/* Birthday Field */}
          <div className="space-y-2">
            <Label htmlFor="birthday">生日</Label>
            <Input
              id="birthday"
              onChange={(e) => handleInputChange("birthday", e.target.value)}
              type="date"
              value={formData.birthday}
            />
          </div>

          {/* Gender Field */}
          <div className="space-y-2">
            <Label htmlFor="gender">性別</Label>
            <Select
              key={formData.gender}
              onValueChange={(value) => handleInputChange("gender", value)}
              value={formData.gender}
            >
              <SelectTrigger>
                <SelectValue placeholder="請選擇性別" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="unspecified">未選擇</SelectItem>
                <SelectItem value="male">男性</SelectItem>
                <SelectItem value="female">女性</SelectItem>
                <SelectItem value="other">其他</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Contact Preference Field */}
          <div className="space-y-2">
            <Label htmlFor="contactPreference">聯絡方式偏好</Label>
            <Select
              key={formData.contactPreference}
              onValueChange={(value) =>
                handleInputChange("contactPreference", value)
              }
              value={formData.contactPreference}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="email">電子郵件</SelectItem>
                <SelectItem value="phone">電話</SelectItem>
                <SelectItem value="sms">簡訊</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-between pt-4">
            <Button
              className="flex items-center gap-2"
              disabled={!localIsDirty || isSubmitting}
              onClick={handleReset}
              type="button"
              variant="outline"
            >
              <RotateCcw className="h-4 w-4" />
              重置
            </Button>

            <Button
              className="flex items-center gap-2"
              disabled={
                !localIsDirty ||
                isSubmitting ||
                Object.keys(errors).some((key) => errors[key as keyof FormData])
              }
              type="submit"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  更新中...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4" />
                  更新資料
                </>
              )}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}

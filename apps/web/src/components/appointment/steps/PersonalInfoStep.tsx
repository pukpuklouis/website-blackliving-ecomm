import type React from "react";
import { useEffect, useState } from "react";
import { z } from "zod";
import { useAppointmentStore } from "../../../stores/appointmentStore";
import AuthModal from "../../auth/AuthModal";

const personalInfoSchema = z.object({
  name: z.string().min(2, "姓名至少需要2個字符"),
  phone: z.string().min(10, "請輸入有效的電話號碼"),
  email: z.string().min(1, "請輸入Email地址").email("請輸入有效的Email地址"),
  notes: z.string().optional(),
});

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function PersonalInfoStep() {
  const { appointmentData, updateAppointmentData, nextStep } =
    useAppointmentStore();
  const [formData, setFormData] = useState({
    name: appointmentData.name,
    phone: appointmentData.phone,
    email: appointmentData.email,
    notes: appointmentData.notes,
  });
  const [errors, setErrors] = useState<Record<string, string>>({
    name: "",
    phone: "",
    notes: "",
  });
  const [currentField, setCurrentField] = useState<
    "name" | "phone" | "email" | "notes"
  >("name");

  // Email check state
  const [isCheckingEmail, setIsCheckingEmail] = useState(false);
  const [emailExists, setEmailExists] = useState<boolean | null>(null);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [hasCheckedEmail, setHasCheckedEmail] = useState(false); // Track if check completed

  useEffect(() => {
    setFormData({
      name: appointmentData.name,
      phone: appointmentData.phone,
      email: appointmentData.email,
      notes: appointmentData.notes,
    });
  }, [appointmentData]);

  const validateField = (field: keyof typeof formData, value: string) => {
    try {
      if (field === "name") {
        personalInfoSchema.shape.name.parse(value);
      } else if (field === "phone") {
        personalInfoSchema.shape.phone.parse(value);
      } else if (field === "email") {
        personalInfoSchema.shape.email.parse(value);
      }
      setErrors((prev) => ({ ...prev, [field]: "" }));
      return true;
    } catch (error) {
      if (error instanceof z.ZodError) {
        setErrors((prev) => ({ ...prev, [field]: error.issues[0].message }));
      }
      return false;
    }
  };

  const handleInputChange = (
    field: keyof typeof formData,
    value: string
  ): boolean => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    updateAppointmentData({ [field]: value });

    // Reset email check state when email changes
    if (field === "email") {
      setHasCheckedEmail(false);
      setEmailExists(null);
    }

    // Clear error when user changes input
    if (errors[field]) {
      validateField(field, value);
    }
    return true; // Assuming this function is primarily for updating state and not immediate validation result
  };

  // Debounced email check
  useEffect(() => {
    const checkEmail = async () => {
      // Basic validation format before API call
      if (!(formData.email && EMAIL_REGEX.test(formData.email))) {
        return;
      }

      setIsCheckingEmail(true);
      try {
        const response = await fetch("/api/user/check-email", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email: formData.email }),
        });

        if (response.ok) {
          const result = await response.json();
          const exists = result.data.exists;
          setEmailExists(exists);
          setHasCheckedEmail(true);

          if (!exists) {
            // If user doesn't exist, prompt for signup
            setShowAuthModal(true);
          }
        }
      } catch (error) {
        console.error("Email check failed:", error);
      } finally {
        setIsCheckingEmail(false);
      }
    };

    const timer = setTimeout(() => {
      if (formData.email) {
        checkEmail();
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [formData.email]);

  const handleNext = () => {
    const nameValid = validateField("name", formData.name);
    const phoneValid = validateField("phone", formData.phone);
    const emailValid = validateField("email", formData.email);
    const notesValid = validateField("notes", formData.notes);

    if (nameValid && phoneValid && emailValid && notesValid) {
      nextStep();
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      if (currentField === "name" && formData.name.trim()) {
        setCurrentField("phone");
        document.getElementById("phone-input")?.focus();
      } else if (currentField === "phone" && formData.phone.trim()) {
        setCurrentField("email");
        document.getElementById("email-input")?.focus();
      } else if (currentField === "email" && formData.email.trim()) {
        handleNext();
      }
    }
  };

  return (
    <div className="text-center">
      <div className="mb-8">
        <h2 className="mb-4 font-bold text-3xl text-gray-900">填寫聯絡資訊</h2>
        <p className="text-gray-600 text-lg">我們需要您的基本資訊以安排預約</p>
      </div>

      <div className="mx-auto max-w-md space-y-8">
        {/* Name field */}
        <div className="text-left">
          <label
            className="mb-2 block font-medium text-gray-700 text-sm"
            htmlFor="name-input"
          >
            姓名 *
          </label>
          <input
            autoFocus
            className={`w-full border-0 border-b-2 bg-transparent px-0 py-3 text-lg transition-colors focus:outline-none focus:ring-0 ${
              errors.name
                ? "border-red-500 focus:border-red-500"
                : "border-gray-300 focus:border-black"
            }`}
            id="name-input"
            onChange={(e) => handleInputChange("name", e.target.value)}
            onFocus={() => setCurrentField("name")}
            onKeyPress={handleKeyPress}
            placeholder="請輸入您的姓名"
            type="text"
            value={formData.name}
          />
          {typeof errors.name === "string" && errors.name.trim() !== "" && (
            <p className="mt-2 text-red-500 text-sm">{errors.name}</p>
          )}
        </div>

        {/* Phone field */}
        <div className="text-left">
          <label
            className="mb-2 block font-medium text-gray-700 text-sm"
            htmlFor="phone-input"
          >
            電話號碼 *
          </label>
          <input
            className={`w-full border-0 border-b-2 bg-transparent px-0 py-3 text-lg transition-colors focus:outline-none focus:ring-0 ${
              errors.phone
                ? "border-red-500 focus:border-red-500"
                : "border-gray-300 focus:border-black"
            }`}
            id="phone-input"
            onChange={(e) => handleInputChange("phone", e.target.value)}
            onFocus={() => setCurrentField("phone")}
            onKeyPress={handleKeyPress}
            placeholder="0912-345-678"
            type="tel"
            value={formData.phone}
          />
          {typeof errors.phone === "string" && errors.phone.trim() !== "" && (
            <p className="mt-2 text-red-500 text-sm">{errors.phone}</p>
          )}
        </div>

        {/* Email field (editable) */}
        <div className="text-left">
          <label
            className="mb-2 block font-medium text-gray-700 text-sm"
            htmlFor="email-input"
          >
            Email 地址 *
          </label>
          <input
            className={`w-full border-0 border-b-2 bg-transparent px-0 py-3 text-lg transition-colors focus:outline-none focus:ring-0 ${
              errors.email
                ? "border-red-500 focus:border-red-500"
                : "border-gray-300 focus:border-black"
            }`}
            id="email-input"
            onChange={(e) => handleInputChange("email", e.target.value)}
            onFocus={() => setCurrentField("email")}
            onKeyPress={handleKeyPress}
            placeholder="your@email.com"
            type="email"
            value={formData.email}
          />
          {typeof errors.email === "string" && errors.email.trim() !== "" && (
            <p className="mt-2 text-red-500 text-sm">{errors.email}</p>
          )}

          {/* Email Check Status Indicator */}
          {!errors.email && formData.email && (
            <div className="mt-2 h-6 text-sm">
              {(() => {
                if (isCheckingEmail) {
                  return (
                    <span className="flex items-center text-gray-500">
                      <svg
                        className="mr-2 h-4 w-4 animate-spin"
                        viewBox="0 0 24 24"
                      >
                        <title>Loading</title>
                        <circle
                          className="opacity-25"
                          cx="12"
                          cy="12"
                          r="10"
                          stroke="currentColor"
                          strokeWidth="4"
                        />
                        <path
                          className="opacity-75"
                          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                          fill="currentColor"
                        />
                      </svg>
                      檢查中...
                    </span>
                  );
                }
                if (hasCheckedEmail) {
                  if (emailExists) {
                    return (
                      <span className="flex items-center text-green-600">
                        <svg
                          aria-hidden="true"
                          className="mr-1 h-4 w-4"
                          fill="currentColor"
                          viewBox="0 0 20 20"
                        >
                          <path
                            clipRule="evenodd"
                            d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                            fillRule="evenodd"
                          />
                        </svg>
                        已有帳號
                      </span>
                    );
                  }
                  return (
                    <span className="flex items-center text-blue-600">
                      <svg
                        aria-hidden="true"
                        className="mr-1 h-4 w-4"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path
                          clipRule="evenodd"
                          d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                          fillRule="evenodd"
                        />
                      </svg>
                      新朋友 (將協助建立帳號)
                    </span>
                  );
                }
                return null;
              })()}
            </div>
          )}
        </div>

        {/* Notes field (optional) */}
        <div className="text-left">
          <label
            className="mb-2 block font-medium text-gray-700 text-sm"
            htmlFor="notes-input"
          >
            備註 (選填)
          </label>
          <textarea
            className="w-full rounded-lg border-2 border-gray-300 px-4 py-3 transition-colors focus:border-black focus:outline-none"
            id="notes-input"
            onChange={(e) => handleInputChange("notes", e.target.value)}
            onFocus={() => setCurrentField("notes")}
            placeholder="有任何特殊需求或想告訴我們的事嗎?"
            rows={3}
            value={formData.notes}
          />
        </div>
      </div>

      {/* Continue button */}
      <div className="mt-8">
        <button
          className="rounded-lg bg-black px-8 py-3 font-medium text-white transition-colors hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-50"
          disabled={
            !(
              formData.name.trim() &&
              formData.phone.trim() &&
              formData.email.trim()
            ) || Object.values(errors).some((error) => error)
          }
          onClick={handleNext}
          type="button"
        >
          繼續預約時間
        </button>
      </div>

      <AuthModal
        defaultEmail={formData.email}
        initialTab="register"
        onAuthenticated={() => {
          setEmailExists(true);
          setShowAuthModal(false);
        }}
        onClose={() => setShowAuthModal(false)}
        open={showAuthModal}
      />
    </div>
  );
}

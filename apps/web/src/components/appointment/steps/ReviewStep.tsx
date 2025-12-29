import { useState } from "react";
import { getApiUrl } from "../../../lib/api";
import {
  type Store,
  useAppointmentStore,
} from "../../../stores/appointmentStore";
import { useAuthStore } from "../../../stores/authStore";

export default function ReviewStep() {
  const { appointmentData, setIsSubmitting, isSubmitting, resetForm } =
    useAppointmentStore();
  const { ensureFreshAccessToken, user } = useAuthStore();

  const [isSubmitted, setIsSubmitted] = useState(false);
  const [submissionError, setSubmissionError] = useState<string | null>(null);
  const [reservationSummary, setReservationSummary] = useState<{
    appointmentNumber: string;
    verificationPending: boolean;
  } | null>(null);

  const triggerAuthModal = () => {
    window.dispatchEvent(new CustomEvent("reservation-auth-required"));
  };

  const preparePayload = () => {
    if (!(appointmentData.selectedStore && appointmentData.series)) {
      throw new Error("請先選擇門市與試躺系列");
    }

    return {
      storeId: appointmentData.selectedStore.id,
      // Survey data
      source: appointmentData.source,
      hasTriedOtherStores: appointmentData.hasTriedOtherStores,
      otherStoreNames: appointmentData.otherStoreNames,
      priceAwareness: appointmentData.priceAwareness,
      // Product preferences
      series: appointmentData.series,
      firmness: appointmentData.firmness,
      accessories: appointmentData.accessories,
      notes: appointmentData.notes,
      customerInfo: {
        name: appointmentData.name,
        phone: appointmentData.phone,
        email: appointmentData.email,
      },
    };
  };

  const submitReservation = async (
    payload: ReturnType<typeof preparePayload>
  ) => {
    let token: string | null = null;
    try {
      token = await ensureFreshAccessToken();
    } catch {
      // Token missing is fine, we'll try cookie auth
    }

    const headers: HeadersInit = {
      "Content-Type": "application/json",
    };

    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }

    const response = await fetch(getApiUrl("/api/reservations/create"), {
      method: "POST",
      headers,
      credentials: "include", // Important: Send cookies!
      body: JSON.stringify(payload),
    });

    let result;
    try {
      result = await response.json();
    } catch {
      throw new Error("伺服器回應格式錯誤，請稍後再試");
    }

    if (!response.ok) {
      if (response.status === 401) {
        triggerAuthModal();
        throw new Error("登入驗證已過期，請重新登入後再嘗試提交。");
      }
      // Extract error message from result
      const errorMessage =
        typeof result?.error === "string"
          ? result.error
          : "預約提交失敗，請稍後再試";
      throw new Error(errorMessage);
    }

    if (!result?.success) {
      const errorMessage =
        typeof result?.error === "string"
          ? result.error
          : "預約提交失敗，請稍後再試";
      throw new Error(errorMessage);
    }

    return result;
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    setSubmissionError(null);

    try {
      const payload = preparePayload();
      const result = await submitReservation(payload);

      setReservationSummary({
        appointmentNumber: result.data?.appointmentNumber,
        verificationPending: Boolean(result.data?.verificationPending),
      });
      setIsSubmitted(true);
    } catch (error) {
      console.error("預約提交錯誤:", error);
      setSubmissionError(
        error instanceof Error ? error.message : "預約提交失敗，請稍後再試"
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleNewAppointment = () => {
    resetForm();
    setIsSubmitted(false);
    setSubmissionError(null);
    setReservationSummary(null);
  };

  if (isSubmitted) {
    const pendingMessage = reservationSummary?.verificationPending
      ? "系統顯示您的 Email 尚未驗證，請確認收件匣並完成 Magic Link 驗證後預約才會生效。"
      : "您的 Email 已完成驗證，專人將盡快與您聯繫確認預約時間。";

    return (
      <div className="py-8 text-center">
        <div className="mb-6">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-100 text-green-500">
            <svg
              aria-hidden="true"
              className="h-8 w-8"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <title>成功</title>
              <path
                d="M5 13l4 4L19 7"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
              />
            </svg>
          </div>
          <h2 className="mb-4 font-bold text-3xl text-gray-900">
            預約已送出！
          </h2>
          <p className="text-gray-600 text-lg">
            感謝您的預約，我們已收到您的申請
          </p>
        </div>

        <div className="mb-6 rounded-lg border border-green-200 bg-green-50 p-6 text-left">
          <h3 className="mb-3 font-semibold text-green-800">預約資訊</h3>
          <ul className="space-y-2 text-green-700">
            <li className="flex items-start">
              <span className="mr-2">預約編號</span>
              <span className="font-medium">
                {reservationSummary?.appointmentNumber || "建立中"}
              </span>
            </li>
            <li className="flex items-start">
              <span className="mr-2">姓名</span>
              <span>{appointmentData.name}</span>
            </li>
            <li className="flex items-start">
              <span className="mr-2">電子信箱</span>
              <span>{appointmentData.email}</span>
            </li>
          </ul>
          <p className="mt-4 text-green-700 text-sm">{pendingMessage}</p>
        </div>

        <div className="space-y-3">
          <button
            className="rounded-lg bg-black px-6 py-3 font-medium text-white transition-colors hover:bg-gray-800"
            onClick={handleNewAppointment}
            type="button"
          >
            預約其他產品
          </button>

          <div className="text-gray-500 text-sm">
            <p>預約相關問題請洽服務專線：</p>
            <p className="font-medium">
              {String(
                (appointmentData.selectedStore as Store & { phone?: string })
                  ?.phone || "N/A"
              )}
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="text-center">
      <div className="mb-8">
        <h2 className="mb-4 font-bold text-3xl text-gray-900">確認預約資訊</h2>
        <p className="text-gray-600 text-lg">請檢查以下預約資訊是否正確</p>
      </div>

      {/* Review information */}
      <div className="mx-auto max-w-lg space-y-6 text-left">
        {/* Store information */}
        <div className="rounded-lg bg-gray-50 p-6">
          <h3 className="mb-3 flex items-center font-semibold text-gray-900">
            <svg
              aria-hidden="true"
              className="mr-2 h-5 w-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
              />
            </svg>
            預約門市
          </h3>
          <p className="font-medium text-lg">
            {appointmentData.selectedStore?.name}
          </p>
          <p className="text-gray-600">
            {appointmentData.selectedStore?.address}
          </p>
        </div>

        {/* Trial Preferences */}
        <div className="rounded-lg bg-gray-50 p-6">
          <h3 className="mb-3 flex items-center font-semibold text-gray-900">
            <svg
              aria-hidden="true"
              className="mr-2 h-5 w-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
              />
            </svg>
            試躺需求
          </h3>
          <div className="space-y-2">
            <p>
              <span className="text-gray-600">系列：</span>
              {appointmentData.series || "未選擇"}
            </p>
            <p>
              <span className="text-gray-600">軟硬度：</span>
              {appointmentData.firmness || "未選擇"}
            </p>
            <p>
              <span className="text-gray-600">配件：</span>
              {(appointmentData.accessories?.length ?? 0) > 0
                ? appointmentData.accessories.join("、")
                : "無"}
            </p>
          </div>
        </div>

        {/* Personal information */}
        <div className="rounded-lg bg-gray-50 p-6">
          <h3 className="mb-3 flex items-center font-semibold text-gray-900">
            <svg
              aria-hidden="true"
              className="mr-2 h-5 w-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
              />
            </svg>
            聯絡資訊
          </h3>
          <div className="space-y-1">
            <p>
              <span className="text-gray-600">姓名：</span>
              {appointmentData.name}
            </p>
            <p>
              <span className="text-gray-600">電話：</span>
              {appointmentData.phone}
            </p>
            <p>
              <span className="text-gray-600">Email：</span>
              {appointmentData.email}
            </p>
          </div>
        </div>

        {/* Message */}
        {appointmentData.notes?.trim() ? (
          <div className="rounded-lg bg-gray-50 p-6">
            <h3 className="mb-3 flex items-center font-semibold text-gray-900">
              <svg
                aria-hidden="true"
                className="mr-2 h-5 w-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <title>備註說明</title>
                <path
                  d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                />
              </svg>
              備註說明
            </h3>
            <p className="text-gray-700">{String(appointmentData.notes)}</p>
          </div>
        ) : null}
      </div>

      {/* Error message */}
      {submissionError ? (
        <div className="mx-auto mt-6 max-w-lg rounded-lg border border-red-200 bg-red-50 p-4 text-red-700">
          <p>{String(submissionError)}</p>
        </div>
      ) : null}

      {/* Submit button */}
      <div className="mt-8 flex justify-center">
        <button
          className="rounded-lg bg-black px-8 py-3 font-medium text-lg text-white transition-colors hover:bg-gray-800 disabled:cursor-not-allowed disabled:bg-gray-400"
          disabled={isSubmitting}
          onClick={handleSubmit}
          type="button"
        >
          {isSubmitting ? "提交中..." : "送出預約"}
        </button>
      </div>

      <p className="mt-4 text-gray-500 text-sm">
        完成提交後，系統會保留您的預約資料並以 Email 通知。請確保信箱可收到
        blackliving.com 寄出的郵件。
      </p>

      {user ? (
        <p className="mt-2 text-gray-400 text-xs">
          目前以 {String(user.email)} 身份預約
        </p>
      ) : null}
    </div>
  );
}

import React, { useState } from 'react';
import { useAppointmentStore } from '../../../stores/appointmentStore';

const timeSlotLabels = {
  morning: '上午時段 (10:00-12:00)',
  afternoon: '下午時段 (14:00-17:00)',
  evening: '晚上時段 (18:00-21:00)',
};

export default function ReviewStep() {
  const { appointmentData, setIsSubmitting, isSubmitting, resetForm } = useAppointmentStore();

  const [isSubmitted, setIsSubmitted] = useState(false);
  const [submissionError, setSubmissionError] = useState<string | null>(null);

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    const weekdays = ['日', '一', '二', '三', '四', '五', '六'];
    const year = date.getFullYear();
    const month = date.getMonth() + 1;
    const day = date.getDate();
    const weekday = weekdays[date.getDay()];

    return `${year}年${month}月${day}日 (週${weekday})`;
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    setSubmissionError(null);

    try {
      // Prepare appointment data for API
      const appointmentPayload = {
        storeId: appointmentData.selectedStore?.id,
        productId: appointmentData.selectedProduct?.id,
        customerInfo: {
          name: appointmentData.name,
          phone: appointmentData.phone,
          email: appointmentData.email,
        },
        preferredDate: appointmentData.preferredDate,
        preferredTime: appointmentData.preferredTime,
        message: appointmentData.message,
        createAccount: appointmentData.createAccount,
        hasExistingAccount: appointmentData.hasAccount,
      };

      // Submit appointment to API
      const response = await fetch('/api/appointments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(appointmentPayload),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || '預約提交失敗');
      }

      const result = await response.json();

      // Success
      setIsSubmitted(true);

      // If user needs account creation, handle that
      if (appointmentData.createAccount) {
        try {
          await fetch('/api/user/create-account', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              email: appointmentData.email,
              name: appointmentData.name,
              phone: appointmentData.phone,
              appointmentId: result.appointmentId,
            }),
          });
        } catch (accountError) {
          console.warn('帳戶建立失敗，但預約已成功:', accountError);
        }
      }
    } catch (error) {
      console.error('預約提交錯誤:', error);
      setSubmissionError(error instanceof Error ? error.message : '預約提交失敗，請稍後再試');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleNewAppointment = () => {
    resetForm();
    setIsSubmitted(false);
    setSubmissionError(null);
  };

  if (isSubmitted) {
    return (
      <div className="text-center py-8">
        <div className="mb-6">
          <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
            <svg
              className="w-8 h-8 text-green-500"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M5 13l4 4L19 7"
              />
            </svg>
          </div>
          <h2 className="text-3xl font-bold text-gray-900 mb-4">預約成功！</h2>
          <p className="text-lg text-gray-600 mb-6">感謝您的預約，我們已收到您的申請</p>
        </div>

        <div className="bg-green-50 border border-green-200 rounded-lg p-6 mb-6 text-left max-w-md mx-auto">
          <h3 className="font-semibold text-green-800 mb-3">接下來的流程：</h3>
          <ul className="space-y-2 text-green-700">
            <li className="flex items-start">
              <span className="mr-2">1.</span>
              <span>我們會在24小時內致電給您確認預約時間</span>
            </li>
            <li className="flex items-start">
              <span className="mr-2">2.</span>
              <span>請攜帶身分證件準時到達門市</span>
            </li>
            <li className="flex items-start">
              <span className="mr-2">3.</span>
              <span>專業睡眠顧問將為您提供個人化試躺服務</span>
            </li>
            {appointmentData.createAccount && (
              <li className="flex items-start">
                <span className="mr-2">4.</span>
                <span>您的會員帳戶已建立，可享受會員專屬優惠</span>
              </li>
            )}
          </ul>
        </div>

        <div className="space-y-3">
          <button
            onClick={handleNewAppointment}
            className="px-6 py-3 bg-black text-white rounded-lg font-medium hover:bg-gray-800 transition-colors"
          >
            預約其他產品
          </button>

          <div className="text-sm text-gray-500">
            <p>預約相關問題請洽服務專線：</p>
            <p className="font-medium">{appointmentData.selectedStore?.phone}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="text-center">
      <div className="mb-8">
        <h2 className="text-3xl font-bold text-gray-900 mb-4">確認預約資訊</h2>
        <p className="text-lg text-gray-600">請檢查以下預約資訊是否正確</p>
      </div>

      {/* Review information */}
      <div className="max-w-lg mx-auto space-y-6 text-left">
        {/* Store information */}
        <div className="bg-gray-50 rounded-lg p-6">
          <h3 className="font-semibold text-gray-900 mb-3 flex items-center">
            <svg className="h-5 w-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
              />
            </svg>
            預約門市
          </h3>
          <p className="text-lg font-medium">{appointmentData.selectedStore?.name}</p>
          <p className="text-gray-600">{appointmentData.selectedStore?.address}</p>
          <p className="text-gray-600">{appointmentData.selectedStore?.phone}</p>
        </div>

        {/* Product information */}
        <div className="bg-gray-50 rounded-lg p-6">
          <h3 className="font-semibold text-gray-900 mb-3 flex items-center">
            <svg className="h-5 w-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"
              />
            </svg>
            試躺產品
          </h3>
          <p className="text-lg font-medium">{appointmentData.selectedProduct?.name}</p>
          <p className="text-gray-600">{appointmentData.selectedProduct?.description}</p>
        </div>

        {/* Personal information */}
        <div className="bg-gray-50 rounded-lg p-6">
          <h3 className="font-semibold text-gray-900 mb-3 flex items-center">
            <svg className="h-5 w-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
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

        {/* Date and time */}
        <div className="bg-gray-50 rounded-lg p-6">
          <h3 className="font-semibold text-gray-900 mb-3 flex items-center">
            <svg className="h-5 w-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
              />
            </svg>
            預約時間
          </h3>
          <p>
            <span className="text-gray-600">日期：</span>
            {formatDate(appointmentData.preferredDate)}
          </p>
          <p>
            <span className="text-gray-600">時段：</span>
            {timeSlotLabels[appointmentData.preferredTime as keyof typeof timeSlotLabels]}
          </p>
        </div>

        {/* Message */}
        {appointmentData.message && (
          <div className="bg-gray-50 rounded-lg p-6">
            <h3 className="font-semibold text-gray-900 mb-3 flex items-center">
              <svg className="h-5 w-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z"
                />
              </svg>
              備註說明
            </h3>
            <p className="text-gray-700">{appointmentData.message}</p>
          </div>
        )}
      </div>

      {/* Error message */}
      {submissionError && (
        <div className="mt-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 max-w-lg mx-auto">
          <p>{submissionError}</p>
        </div>
      )}

      {/* Submit button */}
      <div className="mt-8 space-y-4">
        <button
          onClick={handleSubmit}
          disabled={isSubmitting}
          className="
            px-8 py-4 bg-black text-white rounded-lg font-medium text-lg
            hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed
            transition-colors
          "
        >
          {isSubmitting ? '提交中...' : '確認預約'}
        </button>

        <p className="text-sm text-gray-500">點擊確認後，我們將在24小時內致電與您確認預約時間</p>
      </div>
    </div>
  );
}

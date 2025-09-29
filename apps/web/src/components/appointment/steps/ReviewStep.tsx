import { useState } from 'react';
import { useAppointmentStore } from '../../../stores/appointmentStore';
import { useAuthStore } from '../../../stores/authStore';

const timeSlotLabels = {
  morning: '上午時段 (10:00-12:00)',
  afternoon: '下午時段 (14:00-17:00)',
  evening: '晚上時段 (18:00-21:00)',
};

export default function ReviewStep() {
  const { appointmentData, setIsSubmitting, isSubmitting, resetForm } = useAppointmentStore();
  const { ensureFreshAccessToken, user } = useAuthStore();

  const [isSubmitted, setIsSubmitted] = useState(false);
  const [submissionError, setSubmissionError] = useState<string | null>(null);
  const [reservationSummary, setReservationSummary] = useState<{ appointmentNumber: string; verificationPending: boolean } | null>(
    null
  );

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    const weekdays = ['日', '一', '二', '三', '四', '五', '六'];
    const year = date.getFullYear();
    const month = date.getMonth() + 1;
    const day = date.getDate();
    const weekday = weekdays[date.getDay()];

    return `${year}年${month}月${day}日 (週${weekday})`;
  };

  const triggerAuthModal = () => {
    window.dispatchEvent(new CustomEvent('reservation-auth-required'));
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    setSubmissionError(null);

    try {
      const token = await ensureFreshAccessToken();
      if (!token) {
        triggerAuthModal();
        throw new Error('登入驗證已過期，請重新登入後再嘗試提交。');
      }

      if (!appointmentData.selectedStore || !appointmentData.selectedProduct) {
        throw new Error('請先選擇門市與產品');
      }

      const payload = {
        storeId: appointmentData.selectedStore.id,
        productId: appointmentData.selectedProduct.id,
        customerInfo: {
          name: appointmentData.name,
          phone: appointmentData.phone,
          email: appointmentData.email,
        },
        preferredDate: appointmentData.preferredDate,
        preferredTime: appointmentData.preferredTime,
        message: appointmentData.message,
      };

      const response = await fetch('/api/reservations/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      const result = await response.json();

      if (!response.ok || !result?.success) {
        throw new Error(result?.error || '預約提交失敗，請稍後再試');
      }

      setReservationSummary({
        appointmentNumber: result.data?.appointmentNumber,
        verificationPending: Boolean(result.data?.verificationPending),
      });
      setIsSubmitted(true);
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
    setReservationSummary(null);
  };

  if (isSubmitted) {
    const pendingMessage = reservationSummary?.verificationPending
      ? '系統顯示您的 Email 尚未驗證，請確認收件匣並完成 Magic Link 驗證後預約才會生效。'
      : '您的 Email 已完成驗證，專人將盡快與您聯繫確認預約時間。';

    return (
      <div className="py-8 text-center">
        <div className="mb-6">
          <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-100 text-green-500">
            <svg className="h-8 w-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h2 className="mb-4 text-3xl font-bold text-gray-900">預約已送出！</h2>
          <p className="text-lg text-gray-600">感謝您的預約，我們已收到您的申請</p>
        </div>

        <div className="mb-6 rounded-lg border border-green-200 bg-green-50 p-6 text-left">
          <h3 className="mb-3 font-semibold text-green-800">預約資訊</h3>
          <ul className="space-y-2 text-green-700">
            <li className="flex items-start">
              <span className="mr-2">預約編號</span>
              <span className="font-medium">{reservationSummary?.appointmentNumber || '建立中'}</span>
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
          <p className="mt-4 text-sm text-green-700">{pendingMessage}</p>
        </div>

        <div className="space-y-3">
          <button
            onClick={handleNewAppointment}
            className="rounded-lg bg-black px-6 py-3 font-medium text-white transition-colors hover:bg-gray-800"
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
        <h2 className="mb-4 text-3xl font-bold text-gray-900">確認預約資訊</h2>
        <p className="text-lg text-gray-600">請檢查以下預約資訊是否正確</p>
      </div>

      <div className="mx-auto max-w-lg space-y-6 text-left">
        <div className="rounded-lg bg-gray-50 p-6">
          <h3 className="mb-3 flex items-center font-semibold text-gray-900">
            <svg className="mr-2 h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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

        <div className="rounded-lg bg-gray-50 p-6">
          <h3 className="mb-3 flex items-center font-semibold text-gray-900">
            <svg className="mr-2 h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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

        <div className="rounded-lg bg-gray-50 p-6">
          <h3 className="mb-3 flex items-center font-semibold text-gray-900">
            <svg className="mr-2 h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
              />
            </svg>
            聯絡資訊
          </h3>
          <div className="space-y-1 text-gray-700">
            <p>{appointmentData.name}</p>
            <p>{appointmentData.phone}</p>
            <p>{appointmentData.email}</p>
          </div>
        </div>

        <div className="rounded-lg bg-gray-50 p-6">
          <h3 className="mb-3 flex items-center font-semibold text-gray-900">
            <svg className="mr-2 h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M8 7V3m8 4V3m-9 8h10m-9 6h8M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2h-3.5l-.72-1.447A2 2 0 0013.964 2H10.04a2 2 0 00-1.817 1.053L7.5 5H4a2 2 0 00-2 2v12a2 2 0 002 2z"
              />
            </svg>
            預約時段
          </h3>
          <p className="text-lg font-medium">{formatDate(appointmentData.preferredDate)}</p>
          <p className="text-gray-600">{timeSlotLabels[appointmentData.preferredTime as keyof typeof timeSlotLabels]}</p>
        </div>

        {appointmentData.message && (
          <div className="rounded-lg bg-gray-50 p-6">
            <h3 className="mb-3 flex items-center font-semibold text-gray-900">
              <svg className="mr-2 h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M8 10h.01M12 10h.01M16 10h.01M9 16h6m2 5H7a2 2 0 01-2-2V7a2 2 0 012-2h3.586a1 1 0 01.707.293l1.414 1.414a1 1 0 00.707.293H17a2 2 0 012 2v9a2 2 0 01-2 2z"
                />
              </svg>
              備註
            </h3>
            <p className="text-gray-700">{appointmentData.message}</p>
          </div>
        )}
      </div>

      {submissionError && (
        <div className="mt-6 rounded-lg border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">
          {submissionError}
        </div>
      )}

      <div className="mt-8 flex justify-center">
        <button
          onClick={handleSubmit}
          disabled={isSubmitting}
          className="rounded-lg bg-black px-8 py-3 text-lg font-medium text-white transition-colors hover:bg-gray-800 disabled:cursor-not-allowed disabled:bg-gray-400"
        >
          {isSubmitting ? '提交中...' : '送出預約'}
        </button>
      </div>

      <p className="mt-4 text-sm text-gray-500">
        完成提交後，系統會保留您的預約資料並以 Email 通知。請確保信箱可收到 blackliving.com 寄出的郵件。
      </p>

      {user && (
        <p className="mt-2 text-xs text-gray-400">目前以 {user.email} 身份預約</p>
      )}
    </div>
  );
}

import {
  CreditCard,
  Landmark,
  Loader2,
  Lock,
  ShieldCheck,
  Store,
} from "lucide-react";
import type { FC } from "react";
import { FaApple, FaGoogle } from "react-icons/fa6";

type PaymentMethod =
  | "bank_transfer"
  | "credit_card"
  | "virtual_account"
  | "apple_pay"
  | "google_pay";

type EnabledMethods = {
  enableApplePay: boolean;
  enableGooglePay: boolean;
  enableVirtualAccount: boolean;
};

type PaymentMethodSectionProps = {
  paymentMethod: PaymentMethod;
  isSubmittingOrder: boolean;
  onPaymentMethodChange: (method: PaymentMethod) => void;
  enabledMethods?: EnabledMethods;
};

const PaymentMethodSection: FC<PaymentMethodSectionProps> = ({
  paymentMethod,
  isSubmittingOrder,
  onPaymentMethodChange,
  enabledMethods = {
    enableApplePay: false,
    enableGooglePay: false,
    enableVirtualAccount: false,
  },
}) => {
  const { enableApplePay, enableGooglePay, enableVirtualAccount } =
    enabledMethods;
  const hasAnyQuickPay =
    enableApplePay || enableGooglePay || enableVirtualAccount;
  const getQuickPayButtonClass = (method: string) => {
    const isActive = paymentMethod === method;
    return `group flex flex-col items-center justify-center rounded-lg border p-4 transition-all ${
      isActive
        ? "border-primary bg-primary/10"
        : "border-gray-200 hover:border-primary hover:bg-gray-50 dark:border-zinc-600 dark:hover:border-primary dark:hover:bg-zinc-700"
    }`;
  };

  const getTabButtonClass = (method: string) => {
    const isActive = paymentMethod === method;
    return `flex min-w-[80px] flex-1 flex-col items-center gap-1 rounded-md px-4 py-2 font-medium text-sm transition-all ${
      isActive
        ? "bg-white text-primary shadow-sm dark:bg-zinc-600 dark:text-white"
        : "text-gray-500 hover:bg-white/50 dark:text-gray-400 dark:hover:bg-zinc-600/50"
    }`;
  };

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm sm:p-8 dark:border-zinc-700 dark:bg-zinc-800">
      <div className="mb-6 flex items-center gap-2">
        <Lock className="h-6 w-6 text-primary" />
        <h2 className="font-semibold text-gray-900 text-xl dark:text-white">
          付款方式
        </h2>
      </div>

      {/* Quick Pay Buttons - Only show if any quick pay method is enabled */}
      {hasAnyQuickPay ? (
        <div className="mb-6 grid grid-cols-3 gap-4">
          {enableApplePay ? (
            <button
              className={getQuickPayButtonClass("apple_pay")}
              onClick={() => onPaymentMethodChange("apple_pay")}
              type="button"
            >
              <FaApple className="mb-2 text-2xl text-gray-800 group-hover:text-black dark:text-white dark:group-hover:text-white" />
              <span className="font-medium text-gray-600 text-xs dark:text-gray-300">
                Apple Pay
              </span>
            </button>
          ) : null}
          {enableGooglePay ? (
            <button
              className={getQuickPayButtonClass("google_pay")}
              onClick={() => onPaymentMethodChange("google_pay")}
              type="button"
            >
              <FaGoogle className="mb-2 text-2xl text-gray-800 group-hover:text-primary dark:text-white" />
              <span className="font-medium text-gray-600 text-xs dark:text-gray-300">
                Google Pay
              </span>
            </button>
          ) : null}
          {enableVirtualAccount ? (
            <button
              className={getQuickPayButtonClass("virtual_account")}
              onClick={() => onPaymentMethodChange("virtual_account")}
              type="button"
            >
              <Landmark className="mb-2 h-6 w-6 text-gray-800 group-hover:text-primary dark:text-white" />
              <span className="font-medium text-gray-600 text-xs dark:text-gray-300">
                虛擬帳號
              </span>
            </button>
          ) : null}
        </div>
      ) : null}

      {/* Tab Style Payment Options */}
      <div className="mb-6 flex overflow-x-auto rounded-lg bg-gray-100 p-1 dark:bg-zinc-700">
        <button
          className={getTabButtonClass("credit_card")}
          onClick={() => onPaymentMethodChange("credit_card")}
          type="button"
        >
          <CreditCard className="h-5 w-5" />
          <span>信用卡</span>
        </button>
        <button
          className={getTabButtonClass("bank_transfer")}
          onClick={() => onPaymentMethodChange("bank_transfer")}
          type="button"
        >
          <Landmark className="h-5 w-5" />
          <span>銀行轉帳</span>
        </button>
      </div>

      {/* Payment Method Info */}
      {paymentMethod === "credit_card" && (
        <div className="rounded-lg border border-blue-200 bg-blue-50 p-4 dark:border-blue-800 dark:bg-blue-900/20">
          <div className="flex items-start gap-3">
            <ShieldCheck className="mt-0.5 h-5 w-5 flex-shrink-0 text-blue-600" />
            <div>
              <p className="font-medium text-blue-900 text-sm dark:text-blue-200">
                安全信用卡付款
              </p>
              <p className="mt-1 text-blue-700 text-xs dark:text-blue-300">
                點擊確認付款後，將導向安全的信用卡付款頁面。您的卡片資訊將在加密環境中處理，本站不會儲存您的卡片資料。
              </p>
            </div>
          </div>
        </div>
      )}

      {paymentMethod === "virtual_account" && (
        <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 dark:border-amber-800 dark:bg-amber-900/20">
          <div className="flex items-start gap-3">
            <Landmark className="mt-0.5 h-5 w-5 flex-shrink-0 text-amber-600" />
            <div>
              <p className="font-medium text-amber-900 text-sm dark:text-amber-200">
                虛擬帳號付款
              </p>
              <p className="mt-1 text-amber-700 text-xs dark:text-amber-300">
                提交訂單後，系統將產生專屬的虛擬帳號供您轉帳。請於繳款期限內完成付款。
              </p>
            </div>
          </div>
        </div>
      )}

      {(paymentMethod === "apple_pay" || paymentMethod === "google_pay") && (
        <div className="rounded-lg border border-green-200 bg-green-50 p-4 dark:border-green-800 dark:bg-green-900/20">
          <div className="flex items-start gap-3">
            <ShieldCheck className="mt-0.5 h-5 w-5 flex-shrink-0 text-green-600" />
            <div>
              <p className="font-medium text-green-900 text-sm dark:text-green-200">
                行動支付
              </p>
              <p className="mt-1 text-green-700 text-xs dark:text-green-300">
                點擊確認付款後，將導向行動支付頁面完成付款。
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Submit Button */}
      <div className="mt-8">
        <button
          className="group flex w-full items-center justify-center gap-2 rounded-lg bg-primary px-4 py-4 font-semibold text-white shadow-md transition-all duration-200 hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-70"
          disabled={isSubmittingOrder}
          type="submit"
        >
          {isSubmittingOrder ? (
            <Loader2 className="h-5 w-5 animate-spin" />
          ) : (
            <Lock className="h-4 w-4 transition-transform group-hover:scale-110" />
          )}
          {isSubmittingOrder ? "處理中..." : "確認付款"}
        </button>
        <p className="mt-4 flex items-center justify-center gap-1 text-center text-gray-500 text-xs dark:text-gray-400">
          <ShieldCheck className="h-3 w-3" />
          付款資訊採用 SSL 加密傳輸，確保您的交易安全
        </p>
      </div>
    </div>
  );
};

export default PaymentMethodSection;

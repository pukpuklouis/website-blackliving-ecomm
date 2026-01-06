import { AlertCircle, CheckCircle2, Loader2, User } from "lucide-react";
import type { FC } from "react";
import type { CustomerInfo } from "../../stores/cartStore";
import { type EmailStatus, getInputBorderClass } from "./checkout-form-utils";

type CustomerInfoSectionProps = {
  customerInfo: CustomerInfo;
  formErrors: Record<string, string>;
  formTouched: Record<string, boolean>;
  emailStatus: EmailStatus;
  isCheckingEmail: boolean;
  onFieldChange: (field: keyof CustomerInfo, value: string) => void;
  onFieldBlur: (field: string, value: string) => void;
};

const CustomerInfoSection: FC<CustomerInfoSectionProps> = ({
  customerInfo,
  formErrors,
  emailStatus,
  isCheckingEmail,
  onFieldChange,
  onFieldBlur,
}) => {
  const emailBorderClass = getInputBorderClass(
    !!formErrors.email,
    emailStatus === "exists"
  );

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm sm:p-8 dark:border-zinc-700 dark:bg-zinc-800">
      <div className="mb-6 flex items-center gap-2">
        <User className="h-6 w-6 text-primary" />
        <h2 className="font-semibold text-gray-900 text-xl dark:text-white">
          訂購人資訊
        </h2>
      </div>
      <div className="space-y-6">
        {/* Name Field */}
        <div>
          <label
            className="mb-1 block font-medium text-gray-700 text-sm dark:text-gray-300"
            htmlFor="name"
          >
            姓名 *
          </label>
          <input
            className={`mt-1 block w-full rounded-md px-3 py-2.5 shadow-sm transition-colors duration-200 focus:border-primary focus:ring-primary sm:text-sm dark:bg-zinc-700 dark:text-white ${getInputBorderClass(!!formErrors.name)}`}
            id="name"
            onBlur={(e) => onFieldBlur("name", e.target.value)}
            onChange={(e) => onFieldChange("name", e.target.value)}
            placeholder="王小明"
            type="text"
            value={customerInfo.name}
          />
          {!!formErrors.name && (
            <p className="mt-1 flex items-center gap-1 text-red-500 text-sm">
              <AlertCircle className="h-4 w-4" />
              {String(formErrors.name)}
            </p>
          )}
        </div>

        {/* Phone and Email Fields */}
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
          {/* Phone Field */}
          <div>
            <label
              className="mb-1 block font-medium text-gray-700 text-sm dark:text-gray-300"
              htmlFor="phone"
            >
              手機 *
            </label>
            <input
              className={`mt-1 block w-full rounded-md px-3 py-2.5 shadow-sm transition-colors duration-200 focus:border-primary focus:ring-primary sm:text-sm dark:bg-zinc-700 dark:text-white ${getInputBorderClass(!!formErrors.phone)}`}
              id="phone"
              onBlur={(e) => onFieldBlur("phone", e.target.value)}
              onChange={(e) => onFieldChange("phone", e.target.value)}
              placeholder="0912345678"
              type="tel"
              value={customerInfo.phone}
            />
            {!!formErrors.phone && (
              <p className="mt-1 flex items-center gap-1 text-red-500 text-sm">
                <AlertCircle className="h-4 w-4" />
                {String(formErrors.phone)}
              </p>
            )}
          </div>

          {/* Email Field */}
          <div>
            <label
              className="mb-1 block font-medium text-gray-700 text-sm dark:text-gray-300"
              htmlFor="email"
            >
              Email *
            </label>
            <div className="relative">
              <input
                className={`mt-1 block w-full rounded-md px-3 py-2.5 pr-10 shadow-sm transition-colors duration-200 focus:border-primary focus:ring-primary sm:text-sm dark:bg-zinc-700 dark:text-white ${emailBorderClass}`}
                id="email"
                onBlur={(e) => onFieldBlur("email", e.target.value)}
                onChange={(e) => onFieldChange("email", e.target.value)}
                placeholder="example@email.com"
                type="email"
                value={customerInfo.email}
              />
              {!!isCheckingEmail && (
                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3">
                  <Loader2 className="h-4 w-4 animate-spin text-gray-400" />
                </div>
              )}
              {emailStatus === "exists" && !isCheckingEmail ? (
                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3">
                  <CheckCircle2 className="h-4 w-4 text-green-500" />
                </div>
              ) : null}
            </div>
            {!!formErrors.email && (
              <p className="mt-1 flex items-center gap-1 text-red-500 text-sm">
                <AlertCircle className="h-4 w-4" />
                {String(formErrors.email)}
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CustomerInfoSection;

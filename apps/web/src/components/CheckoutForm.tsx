import { CheckCircle2 } from "lucide-react";
import type { FC } from "react";
import { useEffect, useState } from "react";
import {
  type CustomerInfo,
  type ShippingAddress,
  useCartStore,
} from "../stores/cartStore";
import AuthModal from "./auth/AuthModal";
import {
  ALL_FIELDS_TOUCHED,
  checkEmailStatus,
  EMAIL_REGEX,
  type EmailStatus,
  GOMYPAY_METHODS,
  handlePaymentResult,
  performEmailCheck,
  validateField,
  validateFormFields,
} from "./checkout/checkout-form-utils";
import CustomerInfoSection from "./checkout/customer-info-section";
import OrderSummarySection from "./checkout/order-summary-section";
import PaymentMethodSection from "./checkout/payment-method-section";
import ShippingAddressSection from "./checkout/shipping-address-section";

type CheckoutFormProps = {
  onSuccess: () => void;
};

const CheckoutForm: FC<CheckoutFormProps> = ({ onSuccess }) => {
  const {
    items,
    customerInfo,
    shippingAddress,
    paymentMethod,
    setCustomerInfo,
    setShippingAddress,
    setPaymentMethod,
    setNotes,
    createOrder,
    initiateGomypayPayment,
    isSubmittingOrder,
    validateCart,
    notes,
  } = useCartStore();

  const subtotal = useCartStore((state) => state.getSubtotal());
  const total = useCartStore((state) => state.getTotal());

  const [localCustomerInfo, setLocalCustomerInfo] = useState<CustomerInfo>(
    customerInfo || { name: "", email: "", phone: "" }
  );

  const [localShippingAddress, setLocalShippingAddress] =
    useState<ShippingAddress>(
      shippingAddress || {
        name: "",
        phone: "",
        address: "",
        city: "",
        district: "",
        postalCode: "",
      }
    );

  const [localNotes, setLocalNotes] = useState(notes);
  const [orderSuccess, setOrderSuccess] = useState<{
    success: boolean;
    orderNumber?: string;
  } | null>(null);

  // Form validation errors
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [formTouched, setFormTouched] = useState<Record<string, boolean>>({});

  // Email verification state
  const [emailStatus, setEmailStatus] = useState<EmailStatus>("idle");
  const [isCheckingEmail, setIsCheckingEmail] = useState(false);

  // Auth modal state
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);

  // Enabled payment methods (fetched from API)
  const [enabledMethods, setEnabledMethods] = useState<{
    enableApplePay: boolean;
    enableGooglePay: boolean;
    enableVirtualAccount: boolean;
  }>({
    enableApplePay: false,
    enableGooglePay: false,
    enableVirtualAccount: false,
  });

  // Fetch enabled payment methods on mount
  useEffect(() => {
    const fetchEnabledMethods = async () => {
      try {
        const apiUrl = import.meta.env.PUBLIC_API_URL || "";
        const response = await fetch(`${apiUrl}/api/payment/methods`);
        if (response.ok) {
          const result = await response.json();
          if (result.success && result.data) {
            setEnabledMethods(result.data);
          }
        }
      } catch (error) {
        console.error("Failed to fetch payment methods:", error);
      }
    };
    fetchEnabledMethods();
  }, []);

  // Debounced email check
  useEffect(() => {
    if (!EMAIL_REGEX.test(localCustomerInfo.email)) {
      return;
    }

    const timer = setTimeout(async () => {
      setIsCheckingEmail(true);
      setEmailStatus("checking");

      const result = await performEmailCheck(localCustomerInfo.email);
      setEmailStatus(result.status);
      setIsAuthModalOpen(result.shouldOpenModal);
      setIsCheckingEmail(false);
    }, 500);

    return () => clearTimeout(timer);
  }, [localCustomerInfo.email]);

  const handleFieldBlur = (field: string, value: string) => {
    setFormTouched((prev) => ({ ...prev, [field]: true }));
    const error = validateField(field, value);
    setFormErrors((prev) => ({ ...prev, [field]: error }));
  };

  const handleCustomerInfoChange = (
    field: keyof CustomerInfo,
    value: string
  ) => {
    const updated = { ...localCustomerInfo, [field]: value };
    setLocalCustomerInfo(updated);
    setCustomerInfo(updated);
    if (formTouched[field]) {
      const error = validateField(field, value);
      setFormErrors((prev) => ({ ...prev, [field]: error }));
    }
  };

  const handleShippingAddressChange = (
    field: keyof ShippingAddress,
    value: string
  ) => {
    const updated = { ...localShippingAddress, [field]: value };
    setLocalShippingAddress(updated);
    setShippingAddress(updated);
    const fieldKey = `shipping-${field}`;
    if (formTouched[fieldKey]) {
      const error = validateField(fieldKey, value);
      setFormErrors((prev) => ({ ...prev, [fieldKey]: error }));
    }
  };

  const validateAllFields = (): boolean => {
    const errors = validateFormFields(localCustomerInfo, localShippingAddress);
    setFormErrors(errors);
    setFormTouched(ALL_FIELDS_TOUCHED);
    return !Object.values(errors).some((e) => e !== "");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setNotes(localNotes);

    // Pre-submission validations
    const isFormValid = validateAllFields();
    const validation = validateCart();
    const emailCheck = checkEmailStatus(emailStatus);

    if (!isFormValid) {
      return;
    }

    if (!validation.isValid) {
      setFormErrors((prev) => ({
        ...prev,
        form: validation.errors[0] || "請檢查資料是否完整",
      }));
      return;
    }

    if (emailCheck.error) {
      setFormErrors((prev) => ({ ...prev, email: emailCheck.error || "" }));
      setIsAuthModalOpen(emailCheck.shouldOpenAuthModal);
      return;
    }

    const isGomypayMethod = GOMYPAY_METHODS.includes(
      paymentMethod as (typeof GOMYPAY_METHODS)[number]
    );

    if (!isGomypayMethod) {
      // Traditional order flow (bank_transfer, cash_on_delivery)
      const result = await createOrder();
      if (result.success) {
        setOrderSuccess(result);
      }
      return;
    }

    // GOMYPAY payment flow - sync local form data to store first
    setCustomerInfo(localCustomerInfo);
    setShippingAddress(localShippingAddress);

    const result = await initiateGomypayPayment();
    const paymentError = handlePaymentResult(result);
    if (paymentError) {
      setFormErrors((prev) => ({ ...prev, form: paymentError }));
    }
  };

  const handleBackToCart = () => {
    if (orderSuccess?.success) {
      setOrderSuccess(null);
    }
    onSuccess();
  };

  // Order success view
  if (orderSuccess?.success) {
    return (
      <div className="mx-auto w-full max-w-3xl rounded-xl border border-border-light bg-white p-8 text-center shadow-card dark:border-zinc-700 dark:bg-zinc-800">
        <div className="mb-6 flex justify-center">
          <div className="flex h-20 w-20 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/30">
            <CheckCircle2 className="h-10 w-10 text-green-600 dark:text-green-400" />
          </div>
        </div>
        <h2 className="mb-2 font-bold text-2xl text-gray-900 dark:text-white">
          訂單建立成功！
        </h2>
        <p className="mb-8 text-gray-500 dark:text-gray-400">
          感謝您的購買，您的訂單編號為：
          <span className="ml-2 font-bold font-mono text-gray-900 text-lg dark:text-white">
            {orderSuccess.orderNumber}
          </span>
        </p>

        <div className="mx-auto mb-8 max-w-md space-y-3 rounded-lg bg-gray-50 p-6 text-left dark:bg-zinc-700/50">
          <div className="flex items-start gap-3">
            <div className="mt-1">📧</div>
            <div className="text-gray-600 text-sm dark:text-gray-300">
              <p className="font-medium">訂單確認信已發送</p>
              <p className="text-gray-500 text-xs">請查看您的電子信箱</p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <div className="mt-1">💰</div>
            <div className="text-gray-600 text-sm dark:text-gray-300">
              {(() => {
                if (paymentMethod === "cash_on_delivery") {
                  return (
                    <>
                      <p className="font-medium">貨到付款</p>
                      <p className="text-gray-500 text-xs">
                        請於商品送達時準備好現金交給配送人員
                      </p>
                    </>
                  );
                }
                if (
                  paymentMethod === "bank_transfer" ||
                  paymentMethod === "virtual_account"
                ) {
                  return (
                    <>
                      <p className="font-medium">請完成付款</p>
                      <p className="text-gray-500 text-xs">
                        依照信中指示之帳號進行轉帳程序
                      </p>
                    </>
                  );
                }
                return (
                  <>
                    <p className="font-medium">付款已完成</p>
                    <p className="text-gray-500 text-xs">
                      我們已收到您的款項，將儘速為您安排出貨
                    </p>
                  </>
                );
              })()}
            </div>
          </div>
        </div>

        <div className="flex flex-col justify-center gap-4 sm:flex-row">
          <button
            className="rounded-lg bg-black px-8 py-3 font-semibold text-white shadow transition-colors hover:bg-gray-800"
            onClick={handleBackToCart}
            type="button"
          >
            繼續購物
          </button>
          <a
            className="rounded-lg border border-gray-200 bg-white px-8 py-3 font-semibold text-gray-700 transition-colors hover:bg-gray-50 dark:border-zinc-600 dark:bg-zinc-700 dark:text-gray-200 dark:hover:bg-zinc-600"
            href="/account/orders"
          >
            查看我的訂單
          </a>
        </div>
      </div>
    );
  }

  return (
    <>
      <form
        className="mx-auto grid w-full max-w-7xl grid-cols-1 gap-8 lg:grid-cols-12"
        onSubmit={handleSubmit}
      >
        <div className="space-y-8 lg:col-span-7">
          <CustomerInfoSection
            customerInfo={localCustomerInfo}
            emailStatus={emailStatus}
            formErrors={formErrors}
            formTouched={formTouched}
            isCheckingEmail={isCheckingEmail}
            onFieldBlur={handleFieldBlur}
            onFieldChange={handleCustomerInfoChange}
          />

          <ShippingAddressSection
            formErrors={formErrors}
            onFieldBlur={handleFieldBlur}
            onFieldChange={handleShippingAddressChange}
            shippingAddress={localShippingAddress}
          />

          <PaymentMethodSection
            enabledMethods={enabledMethods}
            isSubmittingOrder={isSubmittingOrder}
            onPaymentMethodChange={setPaymentMethod}
            paymentMethod={paymentMethod}
          />
        </div>

        <div className="lg:col-span-5">
          <OrderSummarySection
            items={items}
            subtotal={subtotal}
            total={total}
          />
        </div>
      </form>

      {/* Auth Modal for login/signup */}
      <AuthModal
        defaultEmail={localCustomerInfo.email}
        initialTab="register"
        onAuthenticated={() => {
          setEmailStatus("exists");
          setIsAuthModalOpen(false);
        }}
        onClose={() => setIsAuthModalOpen(false)}
        open={isAuthModalOpen}
      />
    </>
  );
};

export default CheckoutForm;

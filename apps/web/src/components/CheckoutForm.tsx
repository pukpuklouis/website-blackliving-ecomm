import type { FC } from "react";
import { useState } from "react";
import {
  type CustomerInfo,
  type ShippingAddress,
  useCartStore,
} from "../stores/cartStore";

interface CheckoutFormProps {
  onSuccess: () => void;
}

const CheckoutForm: FC<CheckoutFormProps> = ({ onSuccess }) => {
  const {
    items,
    customerInfo,
    shippingAddress,
    paymentMethod,
    notes,
    setCustomerInfo,
    setShippingAddress,
    setPaymentMethod,
    setNotes,
    createOrder,
    error,
    isSubmittingOrder,
    validateCart,
  } = useCartStore();

  // Use selectors for computed values
  const subtotal = useCartStore((state) => state.getSubtotal());
  const shippingFee = useCartStore((state) => state.getShippingFee());
  const total = useCartStore((state) => state.getTotal());

  const [currentStep, setCurrentStep] = useState(1);
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

  const cities = [
    "台北市",
    "新北市",
    "桃園市",
    "台中市",
    "台南市",
    "高雄市",
    "新竹縣",
    "新竹市",
    "苗栗縣",
    "彰化縣",
    "南投縣",
    "雲林縣",
    "嘉義縣",
    "嘉義市",
    "屏東縣",
    "宜蘭縣",
    "花蓮縣",
    "台東縣",
    "澎湖縣",
    "金門縣",
    "連江縣",
  ];

  const handleCustomerInfoSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setCustomerInfo(localCustomerInfo);
    if (!error) {
      setCurrentStep(2);
    }
  };

  const handleShippingAddressSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setShippingAddress(localShippingAddress);
    if (!error) {
      setCurrentStep(3);
    }
  };

  const handleFinalSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setNotes(localNotes);

    const validation = validateCart();
    if (!validation.isValid) {
      return;
    }

    const result = await createOrder();
    if (result.success) {
      setOrderSuccess(result);
      // Don't call onSuccess immediately, let user see the success message
    }
  };

  const handleBackToCart = () => {
    if (orderSuccess?.success) {
      // Reset order success state and go back to main cart
      setOrderSuccess(null);
      onSuccess();
    } else {
      onSuccess();
    }
  };

  if (orderSuccess?.success) {
    return (
      <div className="mx-auto max-w-2xl py-12 text-center">
        <div className="mb-8 rounded-lg border border-green-200 bg-green-50 p-8">
          <div className="mb-4 text-6xl text-green-600">✓</div>
          <h2 className="mb-4 font-semibold text-2xl text-green-800">
            訂單建立成功！
          </h2>
          <p className="mb-2 text-green-700">您的訂單編號：</p>
          <p className="mb-4 font-bold font-mono text-green-800 text-xl">
            {orderSuccess.orderNumber}
          </p>
          <div className="rounded bg-green-100 p-3 text-green-600 text-sm">
            <p>📧 訂單確認信已發送至您的電子郵件</p>
            <p>💰 請依照信中指示完成付款程序</p>
            <p>📞 如有問題請聯繫客服：02-2345-6789</p>
          </div>
        </div>

        <div className="space-y-4">
          <button
            className="rounded-lg bg-black px-8 py-3 text-white transition-colors hover:bg-gray-800"
            onClick={handleBackToCart}
          >
            繼續購物
          </button>
          <div>
            <a className="text-gray-600 hover:underline" href="/account/orders">
              查看我的訂單
            </a>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl">
      {/* Progress Steps */}
      <div className="mb-8">
        <div className="flex items-center justify-center space-x-4">
          {[1, 2, 3].map((step) => (
            <div className="flex items-center" key={step}>
              <div
                className={`flex h-8 w-8 items-center justify-center rounded-full font-semibold text-sm ${
                  step <= currentStep
                    ? "bg-black text-white"
                    : "bg-gray-200 text-gray-600"
                }`}
              >
                {step}
              </div>
              {step < 3 && (
                <div
                  className={`h-1 w-12 ${step < currentStep ? "bg-black" : "bg-gray-200"}`}
                />
              )}
            </div>
          ))}
        </div>
        <div className="mt-2 flex justify-center space-x-8 text-sm">
          <span
            className={
              currentStep >= 1 ? "font-semibold text-black" : "text-gray-500"
            }
          >
            客戶資料
          </span>
          <span
            className={
              currentStep >= 2 ? "font-semibold text-black" : "text-gray-500"
            }
          >
            配送地址
          </span>
          <span
            className={
              currentStep >= 3 ? "font-semibold text-black" : "text-gray-500"
            }
          >
            確認訂單
          </span>
        </div>
      </div>

      {error && (
        <div className="mb-6 rounded-lg border border-red-200 bg-red-50 p-4">
          <p className="text-red-600">{error}</p>
        </div>
      )}

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
        <div className="lg:col-span-2">
          {/* Step 1: Customer Information */}
          {currentStep === 1 && (
            <div className="rounded-lg bg-white p-6 shadow-md">
              <h2 className="mb-6 font-semibold text-xl">客戶資料</h2>
              <form className="space-y-4" onSubmit={handleCustomerInfoSubmit}>
                <div>
                  <label className="mb-1 block font-medium text-gray-700 text-sm">
                    姓名 *
                  </label>
                  <input
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-transparent focus:ring-2 focus:ring-black"
                    onChange={(e) =>
                      setLocalCustomerInfo((prev) => ({
                        ...prev,
                        name: e.target.value,
                      }))
                    }
                    required
                    type="text"
                    value={localCustomerInfo.name}
                  />
                </div>

                <div>
                  <label className="mb-1 block font-medium text-gray-700 text-sm">
                    電子郵件 *
                  </label>
                  <input
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-transparent focus:ring-2 focus:ring-black"
                    onChange={(e) =>
                      setLocalCustomerInfo((prev) => ({
                        ...prev,
                        email: e.target.value,
                      }))
                    }
                    required
                    type="email"
                    value={localCustomerInfo.email}
                  />
                </div>

                <div>
                  <label className="mb-1 block font-medium text-gray-700 text-sm">
                    電話號碼 *
                  </label>
                  <input
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-transparent focus:ring-2 focus:ring-black"
                    onChange={(e) =>
                      setLocalCustomerInfo((prev) => ({
                        ...prev,
                        phone: e.target.value,
                      }))
                    }
                    placeholder="例：0912345678"
                    required
                    type="tel"
                    value={localCustomerInfo.phone}
                  />
                </div>

                <button
                  className="w-full rounded-lg bg-black py-3 text-white transition-colors hover:bg-gray-800"
                  type="submit"
                >
                  下一步
                </button>
              </form>
            </div>
          )}

          {/* Step 2: Shipping Address */}
          {currentStep === 2 && (
            <div className="rounded-lg bg-white p-6 shadow-md">
              <div className="mb-6 flex items-center justify-between">
                <h2 className="font-semibold text-xl">配送地址</h2>
                <button
                  className="text-gray-600 hover:text-gray-800"
                  onClick={() => setCurrentStep(1)}
                >
                  ← 返回
                </button>
              </div>

              <form
                className="space-y-4"
                onSubmit={handleShippingAddressSubmit}
              >
                <div>
                  <label className="mb-1 block font-medium text-gray-700 text-sm">
                    收件人姓名 *
                  </label>
                  <input
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-transparent focus:ring-2 focus:ring-black"
                    onChange={(e) =>
                      setLocalShippingAddress((prev) => ({
                        ...prev,
                        name: e.target.value,
                      }))
                    }
                    required
                    type="text"
                    value={localShippingAddress.name}
                  />
                </div>

                <div>
                  <label className="mb-1 block font-medium text-gray-700 text-sm">
                    收件人電話 *
                  </label>
                  <input
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-transparent focus:ring-2 focus:ring-black"
                    onChange={(e) =>
                      setLocalShippingAddress((prev) => ({
                        ...prev,
                        phone: e.target.value,
                      }))
                    }
                    required
                    type="tel"
                    value={localShippingAddress.phone}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="mb-1 block font-medium text-gray-700 text-sm">
                      城市 *
                    </label>
                    <select
                      className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-transparent focus:ring-2 focus:ring-black"
                      onChange={(e) =>
                        setLocalShippingAddress((prev) => ({
                          ...prev,
                          city: e.target.value,
                        }))
                      }
                      required
                      value={localShippingAddress.city}
                    >
                      <option value="">請選擇城市</option>
                      {cities.map((city) => (
                        <option key={city} value={city}>
                          {city}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="mb-1 block font-medium text-gray-700 text-sm">
                      區域 *
                    </label>
                    <input
                      className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-transparent focus:ring-2 focus:ring-black"
                      onChange={(e) =>
                        setLocalShippingAddress((prev) => ({
                          ...prev,
                          district: e.target.value,
                        }))
                      }
                      placeholder="例：信義區"
                      required
                      type="text"
                      value={localShippingAddress.district}
                    />
                  </div>
                </div>

                <div>
                  <label className="mb-1 block font-medium text-gray-700 text-sm">
                    詳細地址 *
                  </label>
                  <input
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-transparent focus:ring-2 focus:ring-black"
                    onChange={(e) =>
                      setLocalShippingAddress((prev) => ({
                        ...prev,
                        address: e.target.value,
                      }))
                    }
                    placeholder="例：忠孝東路四段123號5樓"
                    required
                    type="text"
                    value={localShippingAddress.address}
                  />
                </div>

                <div>
                  <label className="mb-1 block font-medium text-gray-700 text-sm">
                    郵遞區號 *
                  </label>
                  <input
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-transparent focus:ring-2 focus:ring-black"
                    onChange={(e) =>
                      setLocalShippingAddress((prev) => ({
                        ...prev,
                        postalCode: e.target.value,
                      }))
                    }
                    placeholder="例：110"
                    required
                    type="text"
                    value={localShippingAddress.postalCode}
                  />
                </div>

                <button
                  className="w-full rounded-lg bg-black py-3 text-white transition-colors hover:bg-gray-800"
                  type="submit"
                >
                  下一步
                </button>
              </form>
            </div>
          )}

          {/* Step 3: Order Confirmation */}
          {currentStep === 3 && (
            <div className="space-y-6">
              <div className="rounded-lg bg-white p-6 shadow-md">
                <div className="mb-6 flex items-center justify-between">
                  <h2 className="font-semibold text-xl">確認訂單</h2>
                  <button
                    className="text-gray-600 hover:text-gray-800"
                    onClick={() => setCurrentStep(2)}
                  >
                    ← 返回
                  </button>
                </div>

                <form className="space-y-6" onSubmit={handleFinalSubmit}>
                  <div>
                    <h3 className="mb-2 font-semibold">付款方式</h3>
                    <div className="space-y-2">
                      <label className="flex items-center">
                        <input
                          checked={paymentMethod === "bank_transfer"}
                          className="mr-2"
                          name="paymentMethod"
                          onChange={(e) =>
                            setPaymentMethod(e.target.value as any)
                          }
                          type="radio"
                          value="bank_transfer"
                        />
                        銀行轉帳
                      </label>
                      <label className="flex items-center">
                        <input
                          checked={paymentMethod === "credit_card"}
                          className="mr-2"
                          name="paymentMethod"
                          onChange={(e) =>
                            setPaymentMethod(e.target.value as any)
                          }
                          type="radio"
                          value="credit_card"
                        />
                        信用卡付款
                      </label>
                      <label className="flex items-center">
                        <input
                          checked={paymentMethod === "cash_on_delivery"}
                          className="mr-2"
                          name="paymentMethod"
                          onChange={(e) =>
                            setPaymentMethod(e.target.value as any)
                          }
                          type="radio"
                          value="cash_on_delivery"
                        />
                        貨到付款
                      </label>
                    </div>
                  </div>

                  <div>
                    <label className="mb-1 block font-medium text-gray-700 text-sm">
                      備註
                    </label>
                    <textarea
                      className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-transparent focus:ring-2 focus:ring-black"
                      onChange={(e) => setLocalNotes(e.target.value)}
                      placeholder="如有特殊需求請註明..."
                      rows={3}
                      value={localNotes}
                    />
                  </div>

                  <button
                    className="w-full rounded-lg bg-black py-3 text-white transition-colors hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-50"
                    disabled={isSubmittingOrder}
                    type="submit"
                  >
                    {isSubmittingOrder ? "建立訂單中..." : "確認下單"}
                  </button>
                </form>
              </div>
            </div>
          )}
        </div>

        {/* Order Summary Sidebar */}
        <div className="lg:col-span-1">
          <div className="sticky top-4 rounded-lg bg-white p-6 shadow-md">
            <h3 className="mb-4 font-semibold text-lg">訂單摘要</h3>

            <div className="mb-4 space-y-3">
              {items.map((item) => {
                const itemKey = item.variantId
                  ? `${item.productId}-${item.variantId}`
                  : item.productId;
                return (
                  <div className="flex justify-between text-sm" key={itemKey}>
                    <div className="flex-1">
                      <p className="font-medium">{item.name}</p>
                      {item.variant && (
                        <p className="text-gray-500">{item.variant}</p>
                      )}
                      <p className="text-gray-500">數量: {item.quantity}</p>
                    </div>
                    <p className="font-medium">
                      NT$ {(item.price * item.quantity).toLocaleString()}
                    </p>
                  </div>
                );
              })}
            </div>

            <div className="space-y-2 border-t pt-4">
              <div className="flex justify-between">
                <span>小計</span>
                <span>NT$ {subtotal.toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span>運費</span>
                <span>
                  {shippingFee === 0 ? (
                    <span className="text-green-600">免運費</span>
                  ) : (
                    `NT$ ${shippingFee.toLocaleString()}`
                  )}
                </span>
              </div>
              <div className="flex justify-between border-t pt-2 font-semibold text-lg">
                <span>總計</span>
                <span>NT$ {total.toLocaleString()}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CheckoutForm;

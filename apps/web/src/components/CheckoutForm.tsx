import { useState } from 'react';
import type { FC } from 'react';
import { useCartStore, type CustomerInfo, type ShippingAddress } from '../stores/cartStore';

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
    customerInfo || { name: '', email: '', phone: '' }
  );
  const [localShippingAddress, setLocalShippingAddress] = useState<ShippingAddress>(
    shippingAddress || {
      name: '',
      phone: '',
      address: '',
      city: '',
      district: '',
      postalCode: '',
    }
  );
  const [localNotes, setLocalNotes] = useState(notes);
  const [orderSuccess, setOrderSuccess] = useState<{
    success: boolean;
    orderNumber?: string;
  } | null>(null);

  const cities = [
    '台北市',
    '新北市',
    '桃園市',
    '台中市',
    '台南市',
    '高雄市',
    '新竹縣',
    '新竹市',
    '苗栗縣',
    '彰化縣',
    '南投縣',
    '雲林縣',
    '嘉義縣',
    '嘉義市',
    '屏東縣',
    '宜蘭縣',
    '花蓮縣',
    '台東縣',
    '澎湖縣',
    '金門縣',
    '連江縣',
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
      <div className="max-w-2xl mx-auto text-center py-12">
        <div className="bg-green-50 border border-green-200 rounded-lg p-8 mb-8">
          <div className="text-green-600 text-6xl mb-4">✓</div>
          <h2 className="text-2xl font-semibold text-green-800 mb-4">訂單建立成功！</h2>
          <p className="text-green-700 mb-2">您的訂單編號：</p>
          <p className="text-xl font-mono font-bold text-green-800 mb-4">
            {orderSuccess.orderNumber}
          </p>
          <div className="text-sm text-green-600 bg-green-100 rounded p-3">
            <p>📧 訂單確認信已發送至您的電子郵件</p>
            <p>💰 請依照信中指示完成付款程序</p>
            <p>📞 如有問題請聯繫客服：02-2345-6789</p>
          </div>
        </div>

        <div className="space-y-4">
          <button
            onClick={handleBackToCart}
            className="bg-black text-white px-8 py-3 rounded-lg hover:bg-gray-800 transition-colors"
          >
            繼續購物
          </button>
          <div>
            <a href="/account/orders" className="text-gray-600 hover:underline">
              查看我的訂單
            </a>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      {/* Progress Steps */}
      <div className="mb-8">
        <div className="flex items-center justify-center space-x-4">
          {[1, 2, 3].map((step) => (
            <div key={step} className="flex items-center">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold ${step <= currentStep ? 'bg-black text-white' : 'bg-gray-200 text-gray-600'
                  }`}
              >
                {step}
              </div>
              {step < 3 && (
                <div className={`w-12 h-1 ${step < currentStep ? 'bg-black' : 'bg-gray-200'}`} />
              )}
            </div>
          ))}
        </div>
        <div className="flex justify-center mt-2 space-x-8 text-sm">
          <span className={currentStep >= 1 ? 'text-black font-semibold' : 'text-gray-500'}>
            客戶資料
          </span>
          <span className={currentStep >= 2 ? 'text-black font-semibold' : 'text-gray-500'}>
            配送地址
          </span>
          <span className={currentStep >= 3 ? 'text-black font-semibold' : 'text-gray-500'}>
            確認訂單
          </span>
        </div>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-red-600">{error}</p>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
          {/* Step 1: Customer Information */}
          {currentStep === 1 && (
            <div className="bg-white p-6 rounded-lg shadow-md">
              <h2 className="text-xl font-semibold mb-6">客戶資料</h2>
              <form onSubmit={handleCustomerInfoSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">姓名 *</label>
                  <input
                    type="text"
                    required
                    value={localCustomerInfo.name}
                    onChange={(e) =>
                      setLocalCustomerInfo((prev) => ({ ...prev, name: e.target.value }))
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">電子郵件 *</label>
                  <input
                    type="email"
                    required
                    value={localCustomerInfo.email}
                    onChange={(e) =>
                      setLocalCustomerInfo((prev) => ({ ...prev, email: e.target.value }))
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">電話號碼 *</label>
                  <input
                    type="tel"
                    required
                    value={localCustomerInfo.phone}
                    onChange={(e) =>
                      setLocalCustomerInfo((prev) => ({ ...prev, phone: e.target.value }))
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
                    placeholder="例：0912345678"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full bg-black text-white py-3 rounded-lg hover:bg-gray-800 transition-colors"
                >
                  下一步
                </button>
              </form>
            </div>
          )}

          {/* Step 2: Shipping Address */}
          {currentStep === 2 && (
            <div className="bg-white p-6 rounded-lg shadow-md">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold">配送地址</h2>
                <button
                  onClick={() => setCurrentStep(1)}
                  className="text-gray-600 hover:text-gray-800"
                >
                  ← 返回
                </button>
              </div>

              <form onSubmit={handleShippingAddressSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    收件人姓名 *
                  </label>
                  <input
                    type="text"
                    required
                    value={localShippingAddress.name}
                    onChange={(e) =>
                      setLocalShippingAddress((prev) => ({ ...prev, name: e.target.value }))
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    收件人電話 *
                  </label>
                  <input
                    type="tel"
                    required
                    value={localShippingAddress.phone}
                    onChange={(e) =>
                      setLocalShippingAddress((prev) => ({ ...prev, phone: e.target.value }))
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">城市 *</label>
                    <select
                      required
                      value={localShippingAddress.city}
                      onChange={(e) =>
                        setLocalShippingAddress((prev) => ({ ...prev, city: e.target.value }))
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
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
                    <label className="block text-sm font-medium text-gray-700 mb-1">區域 *</label>
                    <input
                      type="text"
                      required
                      value={localShippingAddress.district}
                      onChange={(e) =>
                        setLocalShippingAddress((prev) => ({ ...prev, district: e.target.value }))
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
                      placeholder="例：信義區"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">詳細地址 *</label>
                  <input
                    type="text"
                    required
                    value={localShippingAddress.address}
                    onChange={(e) =>
                      setLocalShippingAddress((prev) => ({ ...prev, address: e.target.value }))
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
                    placeholder="例：忠孝東路四段123號5樓"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">郵遞區號 *</label>
                  <input
                    type="text"
                    required
                    value={localShippingAddress.postalCode}
                    onChange={(e) =>
                      setLocalShippingAddress((prev) => ({ ...prev, postalCode: e.target.value }))
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
                    placeholder="例：110"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full bg-black text-white py-3 rounded-lg hover:bg-gray-800 transition-colors"
                >
                  下一步
                </button>
              </form>
            </div>
          )}

          {/* Step 3: Order Confirmation */}
          {currentStep === 3 && (
            <div className="space-y-6">
              <div className="bg-white p-6 rounded-lg shadow-md">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-semibold">確認訂單</h2>
                  <button
                    onClick={() => setCurrentStep(2)}
                    className="text-gray-600 hover:text-gray-800"
                  >
                    ← 返回
                  </button>
                </div>

                <form onSubmit={handleFinalSubmit} className="space-y-6">
                  <div>
                    <h3 className="font-semibold mb-2">付款方式</h3>
                    <div className="space-y-2">
                      <label className="flex items-center">
                        <input
                          type="radio"
                          name="paymentMethod"
                          value="bank_transfer"
                          checked={paymentMethod === 'bank_transfer'}
                          onChange={(e) => setPaymentMethod(e.target.value as any)}
                          className="mr-2"
                        />
                        銀行轉帳
                      </label>
                      <label className="flex items-center">
                        <input
                          type="radio"
                          name="paymentMethod"
                          value="credit_card"
                          checked={paymentMethod === 'credit_card'}
                          onChange={(e) => setPaymentMethod(e.target.value as any)}
                          className="mr-2"
                        />
                        信用卡付款
                      </label>
                      <label className="flex items-center">
                        <input
                          type="radio"
                          name="paymentMethod"
                          value="cash_on_delivery"
                          checked={paymentMethod === 'cash_on_delivery'}
                          onChange={(e) => setPaymentMethod(e.target.value as any)}
                          className="mr-2"
                        />
                        貨到付款
                      </label>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">備註</label>
                    <textarea
                      value={localNotes}
                      onChange={(e) => setLocalNotes(e.target.value)}
                      rows={3}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
                      placeholder="如有特殊需求請註明..."
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={isSubmittingOrder}
                    className="w-full bg-black text-white py-3 rounded-lg hover:bg-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isSubmittingOrder ? '建立訂單中...' : '確認下單'}
                  </button>
                </form>
              </div>
            </div>
          )}
        </div>

        {/* Order Summary Sidebar */}
        <div className="lg:col-span-1">
          <div className="bg-white p-6 rounded-lg shadow-md sticky top-4">
            <h3 className="text-lg font-semibold mb-4">訂單摘要</h3>

            <div className="space-y-3 mb-4">
              {items.map((item) => {
                const itemKey = item.variantId
                  ? `${item.productId}-${item.variantId}`
                  : item.productId;
                return (
                  <div key={itemKey} className="flex justify-between text-sm">
                    <div className="flex-1">
                      <p className="font-medium">{item.name}</p>
                      {item.variant && <p className="text-gray-500">{item.variant}</p>}
                      <p className="text-gray-500">數量: {item.quantity}</p>
                    </div>
                    <p className="font-medium">
                      NT$ {(item.price * item.quantity).toLocaleString()}
                    </p>
                  </div>
                );
              })}
            </div>

            <div className="space-y-2 pt-4 border-t">
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
              <div className="flex justify-between text-lg font-semibold pt-2 border-t">
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

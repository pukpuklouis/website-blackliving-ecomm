import { useState } from 'react';
import type { FC } from 'react';
import { useCartStore } from '../stores/cartStore';
import CheckoutForm from './CheckoutForm';

const ShoppingCart: FC = () => {
  const {
    items: cartItems,
    updateQuantity,
    removeItem,
    error,
    isSubmittingOrder,
    logisticSettings,
  } = useCartStore();

  // Use selectors for computed values
  const itemCount = useCartStore((state) => state.getItemCount());
  const subtotal = useCartStore((state) => state.getSubtotal());
  const shippingFee = useCartStore((state) => state.getShippingFee());
  const total = useCartStore((state) => state.getTotal());

  const [showCheckout, setShowCheckout] = useState(false);

  const handleQuantityChange = (productId: string, newQuantity: number, variantId?: string) => {
    updateQuantity(productId, newQuantity, variantId);
  };

  const handleRemoveItem = (productId: string, variantId?: string) => {
    removeItem(productId, variantId);
  };

  if (showCheckout) {
    return (
      <div className="max-w-4xl mx-auto">
        <div className="mb-6">
          <button
            onClick={() => setShowCheckout(false)}
            className="flex items-center text-gray-600 hover:text-gray-800"
          >
            ← 返回購物車
          </button>
        </div>
        <CheckoutForm onSuccess={() => setShowCheckout(false)} />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      {cartItems.length === 0 ? (
        <div className="text-center py-12">
          <h2 className="text-2xl font-semibold text-gray-700 mb-4">購物車是空的</h2>
          <p className="text-gray-500 mb-8">快去選購您喜愛的床墊吧！</p>
          <a
            href="/simmons-black"
            className="inline-block bg-black text-white px-8 py-3 rounded-lg hover:bg-gray-800 transition-colors"
          >
            開始購物
          </a>
        </div>
      ) : (
        <div>
          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-red-600">{error}</p>
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2">
              <h2 className="text-2xl font-semibold mb-6">購物車項目</h2>
              <div className="space-y-4">
                {cartItems.map((item) => {
                  const itemKey = item.variantId
                    ? `${item.productId}-${item.variantId}`
                    : item.productId;
                  return (
                    <div key={itemKey} className="bg-white p-6 rounded-lg shadow-md">
                      <div className="flex items-center space-x-4">
                        <img
                          src={item.image}
                          alt={item.name}
                          className="w-20 h-20 object-cover rounded-lg"
                          onError={(e) => {
                            e.currentTarget.src = '/images/placeholder-product.jpg';
                          }}
                        />
                        <div className="flex-1">
                          <h3 className="font-semibold text-lg">{item.name}</h3>
                          {item.variant && <p className="text-gray-600 text-sm">{item.variant}</p>}
                          {item.size && <p className="text-gray-500 text-sm">尺寸: {item.size}</p>}
                          <div className="flex items-center space-x-2 mt-2">
                            <p className="text-lg font-bold">NT$ {item.price.toLocaleString()}</p>
                            {item.originalPrice && item.originalPrice > item.price && (
                              <p className="text-sm text-gray-500 line-through">
                                NT$ {item.originalPrice.toLocaleString()}
                              </p>
                            )}
                          </div>
                          {!item.inStock && <p className="text-red-500 text-sm mt-1">目前缺貨</p>}
                        </div>
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={() =>
                              handleQuantityChange(
                                item.productId,
                                item.quantity - 1,
                                item.variantId
                              )
                            }
                            className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center hover:bg-gray-300 disabled:opacity-50"
                            disabled={isSubmittingOrder}
                          >
                            -
                          </button>
                          <span className="px-3 py-1 bg-gray-100 rounded">{item.quantity}</span>
                          <button
                            onClick={() =>
                              handleQuantityChange(
                                item.productId,
                                item.quantity + 1,
                                item.variantId
                              )
                            }
                            className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center hover:bg-gray-300 disabled:opacity-50"
                            disabled={isSubmittingOrder || !item.inStock}
                          >
                            +
                          </button>
                          <button
                            onClick={() => handleRemoveItem(item.productId, item.variantId)}
                            className="ml-4 text-red-500 hover:text-red-700 text-sm"
                            disabled={isSubmittingOrder}
                          >
                            移除
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="lg:col-span-1">
              <div className="bg-white p-6 rounded-lg shadow-md sticky top-4">
                <h2 className="text-xl font-semibold mb-4">訂單摘要</h2>
                <div className="space-y-2 mb-4">
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
                  {shippingFee === 0 && subtotal < logisticSettings.freeShippingThreshold && (
                    <p className="text-sm text-gray-500">滿 NT$ {logisticSettings.freeShippingThreshold.toLocaleString()} 享免運費</p>
                  )}
                  <hr className="my-2" />
                  <div className="flex justify-between text-lg font-semibold">
                    <span>總計</span>
                    <span>NT$ {total.toLocaleString()}</span>
                  </div>
                </div>

                <button
                  onClick={() => setShowCheckout(true)}
                  disabled={isSubmittingOrder || cartItems.some((item) => !item.inStock)}
                  className="w-full bg-black text-white py-3 rounded-lg hover:bg-gray-800 transition-colors mb-3 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSubmittingOrder ? '處理中...' : '前往結帳'}
                </button>

                {cartItems.some((item) => !item.inStock) && (
                  <p className="text-red-500 text-sm text-center mb-3">
                    購物車中有缺貨商品，請移除後再結帳
                  </p>
                )}

                <a
                  href="/simmons-black"
                  className="block text-center text-gray-600 hover:underline"
                >
                  繼續購物
                </a>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ShoppingCart;

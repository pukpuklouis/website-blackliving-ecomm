import type { FC } from "react";
import { useState } from "react";
import { useCartStore } from "../stores/cartStore";
import CheckoutForm from "./CheckoutForm";

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
  const _itemCount = useCartStore((state) => state.getItemCount());
  const subtotal = useCartStore((state) => state.getSubtotal());
  const shippingFee = useCartStore((state) => state.getShippingFee());
  const total = useCartStore((state) => state.getTotal());

  const [showCheckout, setShowCheckout] = useState(false);

  const handleQuantityChange = (
    productId: string,
    newQuantity: number,
    variantId?: string
  ) => {
    updateQuantity(productId, newQuantity, variantId);
  };

  const handleRemoveItem = (productId: string, variantId?: string) => {
    removeItem(productId, variantId);
  };

  if (showCheckout) {
    return (
      <div className="mx-auto max-w-4xl">
        <div className="mb-6">
          <button
            className="flex items-center text-gray-600 hover:text-gray-800"
            onClick={() => setShowCheckout(false)}
            type="button"
          >
            ← 返回購物車
          </button>
        </div>
        <CheckoutForm onSuccess={() => setShowCheckout(false)} />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl">
      {cartItems.length === 0 ? (
        <div className="py-12 text-center">
          <h2 className="mb-4 font-semibold text-2xl text-gray-700">
            購物車是空的
          </h2>
          <p className="mb-8 text-gray-500">快去選購您喜愛的床墊吧！</p>
          <a
            className="inline-block rounded-lg bg-black px-8 py-3 text-white transition-colors hover:bg-gray-800"
            href="/shop/simmons-black"
          >
            開始購物
          </a>
        </div>
      ) : (
        <div>
          {error ? (
            <div className="mb-6 rounded-lg border border-red-200 bg-red-50 p-4">
              <p className="text-red-600">{error}</p>
            </div>
          ) : null}

          <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
            <div className="lg:col-span-2">
              <h2 className="mb-6 font-semibold text-2xl">購物車項目</h2>
              <div className="space-y-4">
                {cartItems.map((item) => {
                  const itemKey = item.variantId
                    ? `${item.productId}-${item.variantId}`
                    : item.productId;
                  return (
                    <div
                      className="rounded-lg bg-white p-6 shadow-md"
                      key={itemKey}
                    >
                      <div className="flex items-center space-x-4">
                        <img
                          alt={item.name}
                          className="h-20 w-20 rounded-lg object-cover"
                          height={80}
                          src={item.image}
                          width={80}
                        />
                        <div className="flex-1">
                          <h3 className="font-semibold text-lg">{item.name}</h3>
                          {item.variant ? (
                            <p className="text-gray-600 text-sm">
                              {item.variant}
                            </p>
                          ) : null}
                          {item.size ? (
                            <p className="text-gray-500 text-sm">
                              尺寸: {item.size}
                            </p>
                          ) : null}
                          <div className="mt-2 flex items-center space-x-2">
                            <p className="font-bold text-lg">
                              NT$ {item.price.toLocaleString()}
                            </p>
                            {item.originalPrice !== undefined &&
                            item.originalPrice > item.price ? (
                              <p className="text-gray-500 text-sm line-through">
                                NT$ {item.originalPrice.toLocaleString()}
                              </p>
                            ) : null}
                          </div>
                          {!item.inStock && (
                            <p className="mt-1 text-red-500 text-sm">
                              目前缺貨
                            </p>
                          )}
                        </div>
                        <div className="flex items-center space-x-2">
                          <button
                            className="flex h-8 w-8 items-center justify-center rounded-full bg-gray-200 hover:bg-gray-300 disabled:opacity-50"
                            disabled={isSubmittingOrder}
                            onClick={() =>
                              handleQuantityChange(
                                item.productId,
                                item.quantity - 1,
                                item.variantId
                              )
                            }
                            type="button"
                          >
                            -
                          </button>
                          <span className="rounded bg-gray-100 px-3 py-1">
                            {item.quantity}
                          </span>
                          <button
                            className="flex h-8 w-8 items-center justify-center rounded-full bg-gray-200 hover:bg-gray-300 disabled:opacity-50"
                            disabled={isSubmittingOrder || !item.inStock}
                            onClick={() =>
                              handleQuantityChange(
                                item.productId,
                                item.quantity + 1,
                                item.variantId
                              )
                            }
                            type="button"
                          >
                            +
                          </button>
                          <button
                            className="ml-4 text-red-500 text-sm hover:text-red-700"
                            disabled={isSubmittingOrder}
                            onClick={() =>
                              handleRemoveItem(item.productId, item.variantId)
                            }
                            type="button"
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
              <div className="sticky top-4 rounded-lg bg-white p-6 shadow-md">
                <h2 className="mb-4 font-semibold text-xl">訂單摘要</h2>
                <div className="mb-4 space-y-2">
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
                  {shippingFee === 0 &&
                    subtotal < logisticSettings.freeShippingThreshold && (
                      <p className="text-gray-500 text-sm">
                        滿 NT${" "}
                        {logisticSettings.freeShippingThreshold.toLocaleString()}{" "}
                        享免運費
                      </p>
                    )}
                  <hr className="my-2" />
                  <div className="flex justify-between font-semibold text-lg">
                    <span>總計</span>
                    <span>NT$ {total.toLocaleString()}</span>
                  </div>
                </div>

                <button
                  className="mb-3 w-full rounded-lg bg-black py-3 text-white transition-colors hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-50"
                  disabled={
                    isSubmittingOrder || cartItems.some((item) => !item.inStock)
                  }
                  onClick={() => setShowCheckout(true)}
                  type="button"
                >
                  {isSubmittingOrder ? "處理中..." : "前往結帳"}
                </button>

                {cartItems.some((item) => !item.inStock) && (
                  <p className="mb-3 text-center text-red-500 text-sm">
                    購物車中有缺貨商品，請移除後再結帳
                  </p>
                )}

                <a
                  className="block text-center text-gray-600 hover:underline"
                  href="/shop/simmons-black"
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

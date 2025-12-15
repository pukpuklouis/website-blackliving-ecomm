import { Badge, Button, cn, Separator } from "@blackliving/ui";
import {
  ArrowRight,
  Minus,
  Package,
  Plus,
  ShoppingCart,
  Trash2,
  Truck,
  X,
} from "lucide-react";
import type { FC } from "react";
import { useEffect, useState } from "react";
import { useCartStore } from "../stores/cartStore";

interface MiniCartProps {
  isOpen: boolean;
  onClose: () => void;
  onCheckout?: () => void;
  className?: string;
}

const MiniCart: FC<MiniCartProps> = ({
  isOpen,
  onClose,
  onCheckout,
  className = "",
}) => {
  const { items, updateQuantity, removeItem, logisticSettings } =
    useCartStore();

  // Use selectors to get computed values reactively
  const itemCount = useCartStore((state) => state.getItemCount());
  const subtotal = useCartStore((state) => state.getSubtotal());
  const shippingFee = useCartStore((state) => state.getShippingFee());
  const total = useCartStore((state) => state.getTotal());

  const [isAnimating, setIsAnimating] = useState(false);

  // Handle animation states
  useEffect(() => {
    if (isOpen) {
      setIsAnimating(true);
    } else {
      const timer = setTimeout(() => setIsAnimating(false), 300);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  // Close on escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener("keydown", handleEscape);
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }

    return () => {
      document.removeEventListener("keydown", handleEscape);
      document.body.style.overflow = "unset";
    };
  }, [isOpen, onClose]);

  const handleQuantityChange = (
    productId: string,
    variantId: string | undefined,
    newQuantity: number
  ) => {
    if (newQuantity <= 0) {
      removeItem(productId, variantId);
    } else {
      updateQuantity(productId, newQuantity, variantId);
    }
  };

  const handleCheckout = () => {
    onCheckout?.();
    onClose();
  };

  if (!(isAnimating || isOpen)) {
    return null;
  }

  return (
    <>
      {/* Backdrop */}
      <div
        className={cn(
          "fixed inset-0 z-50 bg-black/60 backdrop-blur-sm transition-opacity duration-300",
          isOpen ? "opacity-100" : "opacity-0"
        )}
        onClick={onClose}
      />

      {/* Mini Cart Drawer */}
      <div
        className={cn(
          "fixed top-0 right-0 z-50 h-full w-full max-w-md bg-white shadow-2xl",
          "transform transition-transform duration-300 ease-out",
          "flex flex-col",
          isOpen ? "translate-x-0" : "translate-x-full",
          className
        )}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b bg-gray-50 p-4">
          <div className="flex items-center space-x-2">
            <ShoppingCart className="h-5 w-5" />
            <h2 className="font-semibold text-lg">購物車</h2>
            {itemCount > 0 && (
              <Badge className="ml-2" variant="secondary">
                {itemCount} 件
              </Badge>
            )}
          </div>
          <Button
            aria-label="關閉購物車"
            className="h-8 w-8 p-1"
            onClick={onClose}
            size="sm"
            variant="ghost"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* Content */}
        <div className="flex flex-1 flex-col overflow-hidden">
          {items.length === 0 ? (
            /* Empty Cart */
            <div className="flex flex-1 flex-col items-center justify-center p-8 text-gray-500">
              <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-gray-100">
                <ShoppingCart className="h-8 w-8 text-gray-400" />
              </div>
              <h3 className="mb-2 font-medium text-lg">購物車是空的</h3>
              <p className="mb-6 text-center text-sm">
                瀏覽我們的商品，將喜歡的床墊加入購物車吧！
              </p>
              <Button
                className="bg-black text-white hover:bg-gray-800"
                onClick={onClose}
              >
                繼續購物
              </Button>
            </div>
          ) : (
            <>
              {/* Cart Items */}
              <div className="flex-1 space-y-4 overflow-y-auto p-4">
                {items.map((item) => (
                  <div
                    className="flex space-x-3 rounded-lg border bg-gray-50 p-3 transition-colors hover:bg-gray-100"
                    key={`${item.productId}-${item.variantId || "default"}`}
                  >
                    {/* Product Image */}
                    <div className="flex-shrink-0">
                      <img
                        alt={item.name}
                        className="h-16 w-16 rounded-lg border bg-white object-cover"
                        onError={(e) => {
                          const target = e.target as HTMLImageElement;
                          target.src = "/images/placeholder-mattress.jpg";
                        }}
                        src={item.image}
                      />
                    </div>

                    {/* Product Info */}
                    <div className="min-w-0 flex-1">
                      <h4 className="truncate font-medium text-gray-900 text-sm">
                        {item.name}
                      </h4>
                      {item.variant && (
                        <p className="mt-1 text-gray-600 text-xs">
                          {item.variant}
                        </p>
                      )}
                      {item.size && (
                        <p className="text-gray-500 text-xs">
                          尺寸: {item.size}
                        </p>
                      )}

                      {/* Price */}
                      <div className="mt-2 flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <span className="font-semibold text-sm">
                            NT$ {item.price.toLocaleString()}
                          </span>
                          {item.originalPrice &&
                            item.originalPrice > item.price && (
                              <span className="text-gray-500 text-xs line-through">
                                NT$ {item.originalPrice.toLocaleString()}
                              </span>
                            )}
                        </div>
                        <Button
                          aria-label="移除商品"
                          className="h-6 w-6 p-1 text-red-500 hover:bg-red-50 hover:text-red-700"
                          onClick={() =>
                            removeItem(item.productId, item.variantId)
                          }
                          size="sm"
                          variant="ghost"
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>

                      {/* Quantity Controls */}
                      <div className="mt-2 flex items-center space-x-2">
                        <div className="flex items-center rounded border bg-white">
                          <Button
                            aria-label="減少數量"
                            className="h-7 w-7 p-1"
                            disabled={item.quantity <= 1}
                            onClick={() =>
                              handleQuantityChange(
                                item.productId,
                                item.variantId,
                                item.quantity - 1
                              )
                            }
                            size="sm"
                            variant="ghost"
                          >
                            <Minus className="h-3 w-3" />
                          </Button>
                          <span className="min-w-[40px] px-3 py-1 text-center font-medium text-sm">
                            {item.quantity}
                          </span>
                          <Button
                            aria-label="增加數量"
                            className="h-7 w-7 p-1"
                            disabled={item.quantity >= 10}
                            onClick={() =>
                              handleQuantityChange(
                                item.productId,
                                item.variantId,
                                item.quantity + 1
                              )
                            }
                            size="sm"
                            variant="ghost"
                          >
                            <Plus className="h-3 w-3" />
                          </Button>
                        </div>
                        <span className="text-gray-500 text-xs">
                          小計: NT${" "}
                          {(item.price * item.quantity).toLocaleString()}
                        </span>
                      </div>

                      {/* Stock Warning */}
                      {!item.inStock && (
                        <div className="mt-1 rounded bg-red-50 px-2 py-1 text-red-600 text-xs">
                          ⚠️ 商品目前缺貨
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              {/* Footer */}
              <div className="space-y-4 border-t bg-white p-4">
                {/* Price Summary */}
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">商品小計</span>
                    <span>NT$ {subtotal.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="flex items-center space-x-1 text-gray-600">
                      <Truck className="h-3 w-3" />
                      <span>運費</span>
                    </span>
                    <span className={shippingFee === 0 ? "text-green-600" : ""}>
                      {shippingFee === 0
                        ? "免運"
                        : `NT$ ${shippingFee.toLocaleString()}`}
                    </span>
                  </div>
                  {subtotal < logisticSettings.freeShippingThreshold &&
                    shippingFee > 0 && (
                      <div className="rounded bg-amber-50 px-2 py-1 text-amber-600 text-xs">
                        💡 再購買 NT${" "}
                        {(
                          logisticSettings.freeShippingThreshold - subtotal
                        ).toLocaleString()}{" "}
                        即可免運
                      </div>
                    )}
                  <Separator />
                  <div className="flex justify-between font-semibold text-base">
                    <span>總計</span>
                    <span>NT$ {total.toLocaleString()}</span>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="space-y-2">
                  <Button
                    className="h-12 w-full bg-black font-semibold text-base text-white hover:bg-gray-800"
                    disabled={items.some((item) => !item.inStock)}
                    onClick={handleCheckout}
                  >
                    <span className="flex items-center justify-center space-x-2">
                      <span>前往結帳</span>
                      <ArrowRight className="h-4 w-4" />
                    </span>
                  </Button>
                  <Button
                    className="w-full"
                    onClick={onClose}
                    variant="outline"
                  >
                    繼續購物
                  </Button>
                </div>

                {/* Service Info */}
                <div className="grid grid-cols-2 gap-2 border-t pt-2 text-gray-500 text-xs">
                  <div className="flex items-center space-x-1">
                    <Package className="h-3 w-3" />
                    <span>3-5 天配送</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <span>🛡️</span>
                    <span>品質保證</span>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </>
  );
};

export default MiniCart;

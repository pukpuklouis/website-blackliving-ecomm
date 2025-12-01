import { useState, useEffect } from 'react';
import type { FC } from 'react';
import { useCartStore } from '../stores/cartStore';
import { Button } from '@blackliving/ui';
import { Badge } from '@blackliving/ui';
import { Separator } from '@blackliving/ui';
import { ShoppingCart, X, Plus, Minus, Trash2, ArrowRight, Package, Truck } from 'lucide-react';
import { cn } from '@blackliving/ui';

interface MiniCartProps {
  isOpen: boolean;
  onClose: () => void;
  onCheckout?: () => void;
  className?: string;
}

const MiniCart: FC<MiniCartProps> = ({ isOpen, onClose, onCheckout, className = '' }) => {
  const { items, updateQuantity, removeItem, logisticSettings } = useCartStore();

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
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = 'unset';
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

  if (!isAnimating && !isOpen) {
    return null;
  }

  return (
    <>
      {/* Backdrop */}
      <div
        className={cn(
          'fixed inset-0 bg-black/60 backdrop-blur-sm z-50 transition-opacity duration-300',
          isOpen ? 'opacity-100' : 'opacity-0'
        )}
        onClick={onClose}
      />

      {/* Mini Cart Drawer */}
      <div
        className={cn(
          'fixed right-0 top-0 h-full w-full max-w-md bg-white shadow-2xl z-50',
          'transform transition-transform duration-300 ease-out',
          'flex flex-col',
          isOpen ? 'translate-x-0' : 'translate-x-full',
          className
        )}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b bg-gray-50">
          <div className="flex items-center space-x-2">
            <ShoppingCart className="h-5 w-5" />
            <h2 className="text-lg font-semibold">購物車</h2>
            {itemCount > 0 && (
              <Badge variant="secondary" className="ml-2">
                {itemCount} 件
              </Badge>
            )}
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="p-1 h-8 w-8"
            aria-label="關閉購物車"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-hidden flex flex-col">
          {items.length === 0 ? (
            /* Empty Cart */
            <div className="flex-1 flex flex-col items-center justify-center p-8 text-gray-500">
              <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mb-4">
                <ShoppingCart className="h-8 w-8 text-gray-400" />
              </div>
              <h3 className="text-lg font-medium mb-2">購物車是空的</h3>
              <p className="text-sm text-center mb-6">瀏覽我們的商品，將喜歡的床墊加入購物車吧！</p>
              <Button onClick={onClose} className="bg-black hover:bg-gray-800 text-white">
                繼續購物
              </Button>
            </div>
          ) : (
            <>
              {/* Cart Items */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {items.map((item) => (
                  <div
                    key={`${item.productId}-${item.variantId || 'default'}`}
                    className="flex space-x-3 p-3 border rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors"
                  >
                    {/* Product Image */}
                    <div className="flex-shrink-0">
                      <img
                        src={item.image}
                        alt={item.name}
                        className="w-16 h-16 object-cover rounded-lg bg-white border"
                        onError={(e) => {
                          const target = e.target as HTMLImageElement;
                          target.src = '/images/placeholder-mattress.jpg';
                        }}
                      />
                    </div>

                    {/* Product Info */}
                    <div className="flex-1 min-w-0">
                      <h4 className="font-medium text-sm text-gray-900 truncate">{item.name}</h4>
                      {item.variant && <p className="text-xs text-gray-600 mt-1">{item.variant}</p>}
                      {item.size && <p className="text-xs text-gray-500">尺寸: {item.size}</p>}

                      {/* Price */}
                      <div className="flex items-center justify-between mt-2">
                        <div className="flex items-center space-x-2">
                          <span className="font-semibold text-sm">
                            NT$ {item.price.toLocaleString()}
                          </span>
                          {item.originalPrice && item.originalPrice > item.price && (
                            <span className="text-xs text-gray-500 line-through">
                              NT$ {item.originalPrice.toLocaleString()}
                            </span>
                          )}
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removeItem(item.productId, item.variantId)}
                          className="p-1 h-6 w-6 text-red-500 hover:text-red-700 hover:bg-red-50"
                          aria-label="移除商品"
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>

                      {/* Quantity Controls */}
                      <div className="flex items-center space-x-2 mt-2">
                        <div className="flex items-center border rounded bg-white">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() =>
                              handleQuantityChange(
                                item.productId,
                                item.variantId,
                                item.quantity - 1
                              )
                            }
                            disabled={item.quantity <= 1}
                            className="p-1 h-7 w-7"
                            aria-label="減少數量"
                          >
                            <Minus className="h-3 w-3" />
                          </Button>
                          <span className="px-3 py-1 text-sm font-medium min-w-[40px] text-center">
                            {item.quantity}
                          </span>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() =>
                              handleQuantityChange(
                                item.productId,
                                item.variantId,
                                item.quantity + 1
                              )
                            }
                            disabled={item.quantity >= 10}
                            className="p-1 h-7 w-7"
                            aria-label="增加數量"
                          >
                            <Plus className="h-3 w-3" />
                          </Button>
                        </div>
                        <span className="text-xs text-gray-500">
                          小計: NT$ {(item.price * item.quantity).toLocaleString()}
                        </span>
                      </div>

                      {/* Stock Warning */}
                      {!item.inStock && (
                        <div className="mt-1 text-xs text-red-600 bg-red-50 px-2 py-1 rounded">
                          ⚠️ 商品目前缺貨
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              {/* Footer */}
              <div className="border-t bg-white p-4 space-y-4">
                {/* Price Summary */}
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">商品小計</span>
                    <span>NT$ {subtotal.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600 flex items-center space-x-1">
                      <Truck className="h-3 w-3" />
                      <span>運費</span>
                    </span>
                    <span className={shippingFee === 0 ? 'text-green-600' : ''}>
                      {shippingFee === 0 ? '免運' : `NT$ ${shippingFee.toLocaleString()}`}
                    </span>
                  </div>
                  {subtotal < logisticSettings.freeShippingThreshold && shippingFee > 0 && (
                    <div className="text-xs text-amber-600 bg-amber-50 px-2 py-1 rounded">
                      💡 再購買 NT$ {(logisticSettings.freeShippingThreshold - subtotal).toLocaleString()} 即可免運
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
                    onClick={handleCheckout}
                    className="w-full bg-black hover:bg-gray-800 text-white h-12 text-base font-semibold"
                    disabled={items.some((item) => !item.inStock)}
                  >
                    <span className="flex items-center justify-center space-x-2">
                      <span>前往結帳</span>
                      <ArrowRight className="h-4 w-4" />
                    </span>
                  </Button>
                  <Button onClick={onClose} variant="outline" className="w-full">
                    繼續購物
                  </Button>
                </div>

                {/* Service Info */}
                <div className="grid grid-cols-2 gap-2 text-xs text-gray-500 pt-2 border-t">
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

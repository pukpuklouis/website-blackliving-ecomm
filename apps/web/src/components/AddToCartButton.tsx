import { Button } from "@blackliving/ui/components/ui/button";
import { cn } from "@blackliving/ui/lib/utils";
import { Check, Minus, Plus, ShoppingCart } from "lucide-react";
import type { FC } from "react";
import { useState } from "react";
import { type CartItem, useCartStore } from "../stores/cartStore";

interface Product {
  id: string;
  name: string;
  slug: string;
  images: string[];
  variants: Array<{
    id: string;
    name: string;
    size?: string;
    firmness?: string;
    price: number;
    originalPrice?: number;
    inStock: boolean;
    sku?: string;
  }>;
  inStock: boolean;
}

interface AddToCartButtonProps {
  product: Product;
  selectedVariantId?: string;
  className?: string;
  size?: "sm" | "md" | "lg";
  showQuantitySelector?: boolean;
  disabled?: boolean;
  onAddToCartSuccess?: (item: CartItem) => void;
  onAddToCartError?: (error: string) => void;
}

const AddToCartButton: FC<AddToCartButtonProps> = ({
  product,
  selectedVariantId,
  className = "",
  size = "md",
  showQuantitySelector = true,
  disabled = false,
  onAddToCartSuccess,
  onAddToCartError,
}) => {
  const { addItem, error, setError } = useCartStore();
  const itemCount = useCartStore((state) => state.getItemCount());
  const [quantity, setQuantity] = useState(1);
  const [isAdding, setIsAdding] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);

  // Maximum quantity allowed
  const maxQuantity = variant?.inStock ? Math.min(10, variant.stock || 10) : 10;

  // Get selected variant or first variant
  const selectedVariant = selectedVariantId
    ? product.variants.find((v) => v.id === selectedVariantId)
    : product.variants[0];

  // If no variants, create a default one from product
  const variant = selectedVariant || {
    id: "default",
    name: "Standard",
    price: 0, // This should be set appropriately
    inStock: product.inStock,
  };

  const isAvailable = variant.inStock && product.inStock && !disabled;
  const displayPrice = variant.price;
  const displayImage = product.images[0] || "/images/placeholder-product.jpg";
  const currentError = localError || error;

  const sizeClasses = {
    sm: "h-9 px-4 text-sm",
    md: "h-11 px-6 text-base",
    lg: "h-12 px-8 text-lg",
  };

  const handleAddToCart = async () => {
    if (!isAvailable) {
      const errorMsg = "此商品目前缺貨";
      setLocalError(errorMsg);
      onAddToCartError?.(errorMsg);
      return;
    }

    if (!selectedVariantId && product.variants.length > 1) {
      const errorMsg = "請先選擇商品規格";
      setLocalError(errorMsg);
      onAddToCartError?.(errorMsg);
      return;
    }

    setIsAdding(true);
    setError(null);
    setLocalError(null);

    try {
      const cartItem: Omit<CartItem, "quantity"> = {
        productId: product.id,
        variantId: selectedVariantId,
        name: product.name,
        variant: variant.name !== "Standard" ? variant.name : undefined,
        size: variant.size,
        price: variant.price,
        originalPrice: variant.originalPrice,
        image: displayImage,
        inStock: variant.inStock,
      };

      // Add the specified quantity
      for (let i = 0; i < quantity; i++) {
        addItem(cartItem);
      }

      // Show success feedback
      setShowSuccess(true);
      onAddToCartSuccess?.({
        ...cartItem,
        quantity,
      });

      // Open cart drawer
      useCartStore.getState().openCart();

      setTimeout(() => setShowSuccess(false), 3000);

      // Reset quantity if selector is shown
      if (showQuantitySelector) {
        setQuantity(1);
      }
    } catch (err) {
      console.error("Error adding to cart:", err);
      const errorMsg = "加入購物車失敗，請稍後再試";
      setLocalError(errorMsg);
      onAddToCartError?.(errorMsg);
    } finally {
      setIsAdding(false);
    }
  };

  const handleQuantityChange = (newQuantity: number) => {
    const validQuantity = Math.max(1, Math.min(maxQuantity, newQuantity));
    setQuantity(validQuantity);
    setLocalError(null);
  };

  if (showSuccess) {
    return (
      <Button
        className={cn(
          sizeClasses[size],
          "bg-green-600 text-white hover:bg-green-700",
          className
        )}
        disabled
      >
        <Check className="mr-2 h-4 w-4" />
        已加入購物車 ({itemCount})
      </Button>
    );
  }

  return (
    <div className="space-y-4">
      {/* Error Messages */}
      {currentError && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-red-600 text-sm">
          {currentError}
        </div>
      )}

      {/* Price Display */}
      {displayPrice > 0 && (
        <div className="flex items-center justify-between">
          <div>
            <div className="font-bold text-2xl text-gray-900">
              NT$ {displayPrice.toLocaleString()}
            </div>
            {variant.originalPrice && variant.originalPrice > displayPrice && (
              <div className="text-gray-500 text-sm line-through">
                原價 NT$ {variant.originalPrice.toLocaleString()}
              </div>
            )}
          </div>
          {variant.size && (
            <div className="rounded bg-gray-100 px-2 py-1 text-gray-600 text-sm">
              尺寸: {variant.size}
            </div>
          )}
        </div>
      )}

      {/* Quantity Selector */}
      {showQuantitySelector && isAvailable && (
        <div className="flex items-center space-x-4">
          <label className="font-medium text-gray-700 text-sm">數量:</label>
          <div className="flex items-center rounded-lg border">
            <Button
              className="h-10 w-10 p-0"
              disabled={quantity <= 1 || isAdding}
              onClick={() => handleQuantityChange(quantity - 1)}
              size="sm"
              type="button"
              variant="ghost"
            >
              <Minus className="h-4 w-4" />
            </Button>
            <div className="min-w-[50px] px-4 py-2 text-center font-medium">
              {quantity}
            </div>
            <Button
              className="h-10 w-10 p-0"
              disabled={quantity >= maxQuantity || isAdding}
              onClick={() => handleQuantityChange(quantity + 1)}
              size="sm"
              type="button"
              variant="ghost"
            >
              <Plus className="h-4 w-4" />
            </Button>
          </div>
          <span className="text-gray-500 text-xs">最多 {maxQuantity} 件</span>
        </div>
      )}

      {/* Add to Cart Button */}
      <Button
        className={cn(
          sizeClasses[size],
          "w-full font-semibold transition-all duration-200",
          isAvailable
            ? "bg-black text-white shadow-lg hover:bg-gray-800 hover:shadow-xl"
            : "cursor-not-allowed bg-gray-300 text-gray-500",
          className
        )}
        disabled={!isAvailable || isAdding}
        onClick={handleAddToCart}
      >
        {isAdding ? (
          <>
            <div className="mr-2 h-4 w-4 animate-spin rounded-full border-white border-b-2" />
            加入購物車中...
          </>
        ) : isAvailable ? (
          <>
            <ShoppingCart className="mr-2 h-4 w-4" />
            加入購物車
            {showQuantitySelector && quantity > 1 && (
              <span className="ml-2 text-sm">({quantity} 件)</span>
            )}
          </>
        ) : (
          "目前缺貨"
        )}
      </Button>

      {/* Variant Selection Hint */}
      {product.variants.length > 1 && !selectedVariantId && (
        <div className="rounded border border-amber-200 bg-amber-50 p-2 text-amber-700 text-xs">
          💡 提示：將使用預設規格，建議先選擇所需規格
        </div>
      )}

      {/* Stock Information */}
      {variant.stock !== undefined &&
        variant.stock > 0 &&
        variant.stock <= 5 && (
          <div className="text-orange-600 text-xs">
            ⚠️ 僅剩 {variant.stock} 件庫存
          </div>
        )}
    </div>
  );
};

export default AddToCartButton;

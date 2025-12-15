import { Badge, Button, cn, Separator } from "@blackliving/ui";
import {
  AlertCircle,
  Check,
  CreditCard,
  Heart,
  Minus,
  Phone,
  Plus,
  Share2,
  Shield,
  ShoppingCart,
  Truck,
} from "lucide-react";
import type { FC } from "react";
import { useState } from "react";
import { type CartItem, useCartStore } from "../stores/cartStore";

interface Product {
  id: string;
  name: string;
  slug: string;
  description: string;
  images: string[];
  variants: Array<{
    id: string;
    name: string;
    size?: string;
    firmness?: string;
    price: number;
    originalPrice?: number;
    inStock: boolean;
    stock?: number;
    sku?: string;
  }>;
  inStock: boolean;
  category?: string;
}

interface AddToCartSectionProps {
  product: Product;
  selectedVariantId?: string;
  onVariantSelect?: (variantId: string) => void;
  onAddToCartSuccess?: (item: CartItem) => void;
  onAddToCartError?: (error: string) => void;
  className?: string;
}

const AddToCartSection: FC<AddToCartSectionProps> = ({
  product,
  selectedVariantId,
  onVariantSelect,
  onAddToCartSuccess,
  onAddToCartError,
  className = "",
}) => {
  const { addItem, error, setError, items } = useCartStore();
  const itemCount = useCartStore((state) => state.getItemCount());
  const [quantity, setQuantity] = useState(1);
  const [isAdding, setIsAdding] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);
  const [isWishlisted, setIsWishlisted] = useState(false);

  // Get selected variant or first variant
  const selectedVariant = selectedVariantId
    ? product.variants.find((v) => v.id === selectedVariantId)
    : product.variants[0];

  // If no variants, create a default one from product
  const variant = selectedVariant || {
    id: "default",
    name: "Standard",
    price: 0,
    inStock: product.inStock,
  };

  const isAvailable = variant.inStock && product.inStock;
  const displayPrice = variant.price;
  const displayImage = product.images[0] || "/images/placeholder-product.jpg";
  const currentError = localError || error;
  const maxQuantity = variant.stock ? Math.min(10, variant.stock) : 10;

  // Check if item is already in cart
  const cartItem = items.find(
    (item) =>
      item.productId === product.id && item.variantId === selectedVariantId
  );
  const currentQuantityInCart = cartItem?.quantity || 0;

  // Calculate savings if there's an original price
  const savings = variant.originalPrice
    ? variant.originalPrice - variant.price
    : 0;
  const savingsPercentage = variant.originalPrice
    ? Math.round((savings / variant.originalPrice) * 100)
    : 0;

  // Handle add to cart
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
      const cartItemData: Omit<CartItem, "quantity"> = {
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
        addItem(cartItemData);
      }

      // Show success feedback
      setShowSuccess(true);
      onAddToCartSuccess?.({
        ...cartItemData,
        quantity,
      });

      setTimeout(() => setShowSuccess(false), 3000);
      setQuantity(1); // Reset quantity
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

  const handleWishlist = () => {
    setIsWishlisted(!isWishlisted);
    // TODO: Implement wishlist functionality
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: product.name,
          text: product.description,
          url: window.location.href,
        });
      } catch (err) {
        // Sharing failed - fall through to clipboard fallback
      }
    } else {
      // Fallback: copy to clipboard
      navigator.clipboard.writeText(window.location.href);
      // Could show a toast here
    }
  };

  return (
    <div className={cn("rounded-xl border bg-white shadow-sm", className)}>
      {/* Sticky Header on Mobile */}
      <div className="sticky top-0 z-10 rounded-t-xl border-b bg-white p-4 md:p-6">
        {/* Product Title & Category */}
        <div className="mb-4">
          {product.category && (
            <Badge className="mb-2" variant="outline">
              {product.category}
            </Badge>
          )}
          <h2 className="font-bold text-gray-900 text-xl leading-tight md:text-2xl">
            {product.name}
          </h2>
        </div>

        {/* Price Section */}
        <div className="space-y-2">
          <div className="flex items-baseline justify-between">
            <div className="flex items-baseline space-x-3">
              <span className="font-bold text-2xl text-gray-900 md:text-3xl">
                NT$ {displayPrice.toLocaleString()}
              </span>
              {variant.originalPrice &&
                variant.originalPrice > displayPrice && (
                  <span className="text-gray-500 text-lg line-through">
                    NT$ {variant.originalPrice.toLocaleString()}
                  </span>
                )}
            </div>
            {/* Action Buttons */}
            <div className="flex items-center space-x-2">
              <Button
                aria-label="加入心願清單"
                className="h-auto p-2"
                onClick={handleWishlist}
                size="sm"
                variant="ghost"
              >
                <Heart
                  className={cn(
                    "h-5 w-5",
                    isWishlisted && "fill-red-500 text-red-500"
                  )}
                />
              </Button>
              <Button
                aria-label="分享商品"
                className="h-auto p-2"
                onClick={handleShare}
                size="sm"
                variant="ghost"
              >
                <Share2 className="h-5 w-5" />
              </Button>
            </div>
          </div>

          {/* Savings Badge */}
          {savings > 0 && (
            <div className="inline-flex items-center space-x-2">
              <Badge
                className="border-green-200 bg-green-100 text-green-800"
                variant="secondary"
              >
                省下 NT$ {savings.toLocaleString()}
              </Badge>
              <Badge
                className="border-green-300 text-green-700"
                variant="outline"
              >
                -{savingsPercentage}%
              </Badge>
            </div>
          )}

          {/* Variant Info */}
          {variant.size && (
            <div className="text-gray-600 text-sm">
              規格: <span className="font-medium">{variant.size}</span>
              {variant.firmness && (
                <span className="ml-2">
                  硬度: <span className="font-medium">{variant.firmness}</span>
                </span>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Cart Section */}
      <div className="space-y-6 p-4 md:p-6">
        {/* Error Messages */}
        {currentError && (
          <div className="flex items-start space-x-2 rounded-lg border border-red-200 bg-red-50 p-3 text-red-700">
            <AlertCircle className="mt-0.5 h-4 w-4 flex-shrink-0" />
            <span className="text-sm">{currentError}</span>
          </div>
        )}

        {/* Stock Status */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <span className="font-medium text-sm">庫存狀態:</span>
            <div
              className={cn(
                "flex items-center space-x-1 text-sm",
                isAvailable ? "text-green-600" : "text-red-600"
              )}
            >
              <div
                className={cn(
                  "h-2 w-2 rounded-full",
                  isAvailable ? "bg-green-500" : "bg-red-500"
                )}
              />
              <span>{isAvailable ? "現貨供應" : "暫時缺貨"}</span>
            </div>
          </div>
          {variant.stock && variant.stock <= 5 && variant.stock > 0 && (
            <span className="font-medium text-orange-600 text-xs">
              僅剩 {variant.stock} 件
            </span>
          )}
        </div>

        {/* Current Cart Info */}
        {currentQuantityInCart > 0 && (
          <div className="rounded-lg border border-blue-200 bg-blue-50 p-3">
            <div className="text-blue-800 text-sm">
              💡 購物車中已有{" "}
              <span className="font-medium">{currentQuantityInCart}</span>{" "}
              件此商品
            </div>
          </div>
        )}

        {/* Quantity Selector */}
        {isAvailable && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="font-medium text-gray-700 text-sm">
                選擇數量:
              </label>
              <span className="text-gray-500 text-xs">
                最多 {maxQuantity} 件
              </span>
            </div>
            <div className="flex items-center space-x-4">
              <div className="flex items-center rounded-lg border bg-gray-50">
                <Button
                  aria-label="減少數量"
                  className="h-12 w-12 p-0 hover:bg-gray-200"
                  disabled={quantity <= 1 || isAdding}
                  onClick={() => handleQuantityChange(quantity - 1)}
                  size="sm"
                  type="button"
                  variant="ghost"
                >
                  <Minus className="h-4 w-4" />
                </Button>
                <div className="min-w-[80px] bg-white px-6 py-3 text-center font-semibold text-lg">
                  {quantity}
                </div>
                <Button
                  aria-label="增加數量"
                  className="h-12 w-12 p-0 hover:bg-gray-200"
                  disabled={quantity >= maxQuantity || isAdding}
                  onClick={() => handleQuantityChange(quantity + 1)}
                  size="sm"
                  type="button"
                  variant="ghost"
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
              <div className="text-gray-600 text-sm">
                小計:{" "}
                <span className="font-semibold">
                  NT$ {(displayPrice * quantity).toLocaleString()}
                </span>
              </div>
            </div>
          </div>
        )}

        <Separator />

        {/* Add to Cart Button */}
        {showSuccess ? (
          <Button
            className="h-14 w-full bg-green-600 font-semibold text-lg text-white hover:bg-green-700"
            disabled
          >
            <Check className="mr-3 h-5 w-5" />
            已成功加入購物車！
            <span className="ml-2 rounded-full bg-green-700 px-2 py-1 text-sm">
              {itemCount}
            </span>
          </Button>
        ) : (
          <Button
            className={cn(
              "h-14 w-full font-semibold text-lg transition-all duration-200",
              isAvailable
                ? "hover:-translate-y-0.5 transform bg-black text-white shadow-lg hover:bg-gray-800 hover:shadow-xl"
                : "cursor-not-allowed bg-gray-200 text-gray-500"
            )}
            disabled={!isAvailable || isAdding}
            onClick={handleAddToCart}
          >
            {isAdding ? (
              <>
                <div className="mr-3 h-5 w-5 animate-spin rounded-full border-white border-b-2" />
                加入購物車中...
              </>
            ) : isAvailable ? (
              <>
                <ShoppingCart className="mr-3 h-5 w-5" />
                加入購物車
                {quantity > 1 && (
                  <span className="ml-2 rounded-full bg-gray-700 px-2 py-1 text-sm">
                    {quantity} 件
                  </span>
                )}
              </>
            ) : (
              <>
                <AlertCircle className="mr-3 h-5 w-5" />
                目前缺貨
              </>
            )}
          </Button>
        )}

        {/* Service Features */}
        <div className="grid grid-cols-1 gap-3 border-t pt-4 sm:grid-cols-3">
          <div className="flex items-center space-x-2 text-gray-600 text-sm">
            <Truck className="h-4 w-4 text-blue-600" />
            <span>免費配送安裝</span>
          </div>
          <div className="flex items-center space-x-2 text-gray-600 text-sm">
            <Shield className="h-4 w-4 text-green-600" />
            <span>原廠品質保固</span>
          </div>
          <div className="flex items-center space-x-2 text-gray-600 text-sm">
            <CreditCard className="h-4 w-4 text-purple-600" />
            <span>分期零利率</span>
          </div>
        </div>

        {/* Contact for Quote */}
        {!isAvailable && (
          <div className="rounded-lg border-2 border-gray-200 border-dashed bg-gray-50 p-4">
            <div className="space-y-3 text-center">
              <Phone className="mx-auto h-8 w-8 text-gray-400" />
              <div>
                <h4 className="mb-1 font-semibold text-gray-900">需要協助？</h4>
                <p className="text-gray-600 text-sm">
                  聯繫我們的專業顧問獲取更多資訊
                </p>
              </div>
              <div className="flex flex-col gap-2 sm:flex-row">
                <Button asChild className="flex-1" size="sm" variant="outline">
                  <a href="tel:+886-2-12345678">📞 02-1234-5678</a>
                </Button>
                <Button asChild className="flex-1" size="sm" variant="outline">
                  <a href="mailto:info@blackliving.com">✉️ 聯繫我們</a>
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AddToCartSection;

import { useState } from 'react';
import type { FC } from 'react';
import { useCartStore, type CartItem } from '../stores/cartStore';

interface Product {
  id: string;
  name: string;
  slug: string;
  images: string[];
  variants: Array<{
    id: string;
    name: string;
    size?: string;
    price: number;
    originalPrice?: number;
    inStock: boolean;
  }>;
  inStock: boolean;
}

interface AddToCartButtonProps {
  product: Product;
  selectedVariantId?: string;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  showQuantitySelector?: boolean;
}

const AddToCartButton: FC<AddToCartButtonProps> = ({
  product,
  selectedVariantId,
  className = '',
  size = 'md',
  showQuantitySelector = false,
}) => {
  const { addItem, error, setError } = useCartStore();
  const [quantity, setQuantity] = useState(1);
  const [isAdding, setIsAdding] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  // Get selected variant or first variant
  const selectedVariant = selectedVariantId
    ? product.variants.find(v => v.id === selectedVariantId)
    : product.variants[0];

  // If no variants, create a default one from product
  const variant = selectedVariant || {
    id: 'default',
    name: 'Standard',
    price: 0, // This should be set appropriately
    inStock: product.inStock,
  };

  const isAvailable = variant.inStock && product.inStock;
  const displayPrice = variant.price;
  const displayImage = product.images[0] || '/images/placeholder-product.jpg';

  const sizeClasses = {
    sm: 'px-4 py-2 text-sm',
    md: 'px-6 py-3 text-base',
    lg: 'px-8 py-4 text-lg',
  };

  const handleAddToCart = async () => {
    if (!isAvailable) {
      setError('此商品目前缺貨');
      return;
    }

    setIsAdding(true);
    setError(null);

    try {
      const cartItem: Omit<CartItem, 'quantity'> = {
        productId: product.id,
        variantId: selectedVariantId,
        name: product.name,
        variant: variant.name !== 'Standard' ? variant.name : undefined,
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
      setTimeout(() => setShowSuccess(false), 2000);

      // Reset quantity if selector is shown
      if (showQuantitySelector) {
        setQuantity(1);
      }
    } catch (err) {
      console.error('Error adding to cart:', err);
      setError('加入購物車失敗，請稍後再試');
    } finally {
      setIsAdding(false);
    }
  };

  if (showSuccess) {
    return (
      <button
        className={`
          ${sizeClasses[size]}
          bg-green-600 text-white rounded-lg
          flex items-center justify-center
          ${className}
        `}
        disabled
      >
        <span className="mr-2">✓</span>
        已加入購物車
      </button>
    );
  }

  return (
    <div className="space-y-2">
      {error && <div className="text-red-500 text-sm">{error}</div>}

      {showQuantitySelector && isAvailable && (
        <div className="flex items-center space-x-2">
          <span className="text-sm text-gray-700">數量:</span>
          <div className="flex items-center space-x-1">
            <button
              onClick={() => setQuantity(Math.max(1, quantity - 1))}
              className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center hover:bg-gray-300 text-sm"
              disabled={isAdding}
            >
              -
            </button>
            <span className="px-3 py-1 bg-gray-100 rounded text-sm min-w-[40px] text-center">
              {quantity}
            </span>
            <button
              onClick={() => setQuantity(quantity + 1)}
              className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center hover:bg-gray-300 text-sm"
              disabled={isAdding}
            >
              +
            </button>
          </div>
        </div>
      )}

      <button
        onClick={handleAddToCart}
        disabled={!isAvailable || isAdding}
        className={`
          ${sizeClasses[size]}
          rounded-lg font-semibold transition-colors
          disabled:opacity-50 disabled:cursor-not-allowed
          ${isAvailable ? 'bg-black text-white hover:bg-gray-800' : 'bg-gray-300 text-gray-500'}
          ${className}
        `}
      >
        {isAdding ? (
          <div className="flex items-center">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
            加入中...
          </div>
        ) : !isAvailable ? (
          '目前缺貨'
        ) : (
          <>
            加入購物車
            {displayPrice > 0 && <span className="ml-2">NT$ {displayPrice.toLocaleString()}</span>}
          </>
        )}
      </button>

      {/* Variant selector hint */}
      {product.variants.length > 1 && !selectedVariantId && (
        <p className="text-xs text-gray-500">* 將使用預設規格，可在商品頁選擇其他規格</p>
      )}
    </div>
  );
};

export default AddToCartButton;

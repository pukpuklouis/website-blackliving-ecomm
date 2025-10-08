import React, { type FC } from 'react';
import { useCartStore } from '../stores/cartStore';
import { useToast } from './ToastNotification';
import { StarRating } from './StarRating';
import ProductVariantSelector from './ProductVariantSelector';

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
  averageRating?: number;
  reviewCount?: number;
}

interface CategoryConfig {
  series: string;
  category: string;
}

interface ProductDetailProps {
  product: Product;
  categoryConfig: CategoryConfig;
  className?: string;
}

const ProductDetail: FC<ProductDetailProps> = ({ product, categoryConfig, className = '' }) => {
  const { addItem } = useCartStore();
  const { addToast } = useToast();

  // Get reviews data from product - default to 0 if not available
  const reviewsData = {
    rating: product.averageRating || 0,
    count: product.reviewCount || 0,
  };

  // Convert product variants to ProductVariantSelector format
  const convertedVariants = product.variants.map((variant) => {
    // Extract firmness from name field (e.g., "Extra Firm(最硬)" -> "extra-firm")
    let firmness = 'medium';
    if (variant.name && typeof variant.name === 'string') {
      const nameLower = variant.name.toLowerCase();
      if (nameLower.includes('extra firm')) firmness = 'extra-firm';
      else if (nameLower.includes('firm')) firmness = 'firm';
      else if (nameLower.includes('plush')) firmness = 'plush';
      else if (nameLower.includes('medium')) firmness = 'medium';
    }

    // Extract size from size field (e.g., "Queen(150x200)" -> "queen")
    let size = 'standard';
    if (variant.size && typeof variant.size === 'string') {
      const sizeLower = variant.size.toLowerCase();
      if (sizeLower.includes('twin')) size = 'twin';
      else if (sizeLower.includes('full')) size = 'full';
      else if (sizeLower.includes('queen')) size = 'queen';
      else if (sizeLower.includes('king')) size = 'king';
      else if (sizeLower.includes('cal')) size = 'cal-king';
    }

    return {
      size,
      firmness,
      price: variant.price || 0,
      stock: variant.stock || 10, // Default to 10 since API doesn't provide stock
      sku: variant.sku || variant.id || `${firmness}-${size}`,
    };
  });

  // Handle add to cart from ProductVariantSelector
  const handleAddToCart = async (variantData: any) => {
    // Create cart item compatible with existing cartStore interface
    const cartItem = {
      productId: product.id,
      variantId: variantData.sku, // Use SKU as variantId
      name: product.name,
      variant: `${variantData.size} / ${variantData.firmness}`,
      size: variantData.size,
      price: variantData.price,
      image: product.images?.[0] || '',
      inStock: true, // Assume in stock if we can add to cart
    };

    // Add multiple items based on quantity (existing store adds 1 at a time)
    for (let i = 0; i < variantData.quantity; i++) {
      addItem(cartItem);
    }

    addToast({
      type: 'success',
      title: '已成功加入購物車！',
      message: `${product.name} (${variantData.size}/${variantData.firmness}) x${variantData.quantity}`,
      duration: 4000,
    });
  };

  return (
    <div className={`bg-white rounded-xl p-6 ${className}`}>
      {/* Series Information */}
      <div className="mb-4">
        <div className="inline-block bg-black text-white text-sm px-3 py-1 rounded">
          {categoryConfig.series}
        </div>
      </div>

      {/* Product Name */}
      <div className="mb-6">
        <h1 className="text-2xl lg:text-4xl font-bold text-gray-900 mb-2">{product.name}</h1>

        {/* Star Rating */}
        <StarRating
          rating={reviewsData.rating}
          reviewCount={reviewsData.count}
          size="md"
          className="mb-3"
        />

        {/* Product Description */}
        <p className="text-gray-600 text-sm">{product.description}</p>
      </div>

      {/* Variant Selector with integrated quantity and add to cart */}
      <ProductVariantSelector
        productId={product.id}
        variants={convertedVariants}
        onVariantChange={() => {}} // Optional callback for variant changes
        onAddToCart={handleAddToCart}
        className="mb-6"
      />

      {/* Delivery Information */}
      <div className="text-center text-sm text-gray-600 bg-gray-50 p-3 rounded-lg">
        預估配送期：訂單成立後約 3 個月
      </div>
    </div>
  );
};

export default ProductDetail;

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
  features?: string[];
  featuresMarkdown?: string;
  specifications?: Record<string, string>;
}

interface CategoryConfig {
  series: string;
  title: string;
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

  // Use product variants directly from API without conversion
  const convertedVariants = product.variants.map((variant) => ({
    size: variant.size || 'standard',
    firmness: variant.firmness || 'medium',
    price: variant.price || 0,
    stock: variant.stock || 10, // Default to 10 since API doesn't provide stock
    sku: variant.sku || variant.id || `${variant.firmness || 'medium'}-${variant.size || 'standard'}`,
  }));

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
          {categoryConfig.title}
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
        <p className="text-gray-600 text-lg whitespace-break-spaces">{product.description}</p>
      </div>

      {/* Features Section */}
      {(product.featuresMarkdown || (product.features && product.features.length > 0)) && (
        <div className="mb-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-3">產品特色</h2>
          {product.featuresMarkdown ? (
            <div
              className="prose prose-gray max-w-none text-gray-700"
              dangerouslySetInnerHTML={{
                __html: product.featuresMarkdown
                  .replace(/\n/g, '<br>')
                  .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
                  .replace(/\*(.*?)\*/g, '<em>$1</em>')
                  .replace(/^- (.+)$/gm, '<li>$1</li>')
                  .replace(/(<li>.*<\/li>)/s, '<ul>$1</ul>')
              }}
            />
          ) : (
            <ul className="space-y-2">
              {product.features?.map((feature, index) => (
                <li key={index} className="flex items-start gap-2 text-gray-700">
                  <span className="text-green-600 mt-1">✓</span>
                  <span>{feature}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      {/* Specifications Section */}
      {product.specifications && Object.keys(product.specifications).length > 0 && (
        <div className="mb-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-3">產品規格</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {Object.entries(product.specifications).map(([key, value]) => (
              <div key={key} className="flex justify-between py-2 border-b border-gray-100">
                <span className="font-medium text-gray-700">{key}</span>
                <span className="text-gray-600">{value}</span>
              </div>
            ))}
          </div>
        </div>
      )}

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

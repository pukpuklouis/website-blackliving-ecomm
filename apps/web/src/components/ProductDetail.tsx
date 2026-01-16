import type { FC } from "react";
import { useCartStore } from "../stores/cartStore";
import ProductVariantSelector from "./ProductVariantSelector";
import { StarRating } from "./StarRating";
import { useToast } from "./ToastNotification";

type Product = {
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
};

type CategoryConfig = {
  series: string;
  title: string;
  category: string;
};

type ProductDetailProps = {
  product: Product;
  categoryConfig: CategoryConfig;
  className?: string;
};

const ProductDetail: FC<ProductDetailProps> = ({
  product,
  categoryConfig,
  className = "",
}) => {
  const { addItem } = useCartStore();
  const { addToast } = useToast();

  // Get reviews data from product - default to 0 if not available
  const reviewsData = {
    rating: product.averageRating || 0,
    count: product.reviewCount || 0,
  };

  // Use product variants directly from API without conversion
  const convertedVariants = product.variants.map((variant) => {
    // Dynamically extract options by excluding known non-option fields
    const reservedKeys = [
      "id",
      "name",
      "price",
      "originalPrice",
      "stock",
      "sku",
      "inStock",
      "image",
      "images",
    ];
    const options: Record<string, string> = {};

    for (const key of Object.keys(variant)) {
      if (!reservedKeys.includes(key) && variant[key as keyof typeof variant]) {
        options[key] = String(variant[key as keyof typeof variant]);
      }
    }

    return {
      options,
      price: variant.price || 0,
      stock: variant.stock || 10, // Default to 10 since API doesn't provide stock
      sku: variant.sku || variant.id || Object.values(options).join("-"),
    };
  });

  // Handle add to cart from ProductVariantSelector
  const handleAddToCart = (variantData: {
    options?: Record<string, string>;
    price: number;
    sku: string;
    quantity: number;
  }) => {
    const options = variantData.options || {};
    const variantLabel = Object.values(options).join(" / ");

    // Create cart item compatible with existing cartStore interface
    const cartItem = {
      productId: product.id,
      variantId: variantData.sku, // Use SKU as variantId
      name: product.name,
      variant: variantLabel,
      // Spread all options so they are saved in the cart item
      ...options,
      price: variantData.price,
      image: product.images?.[0] || "",
      inStock: true, // Assume in stock if we can add to cart
    };

    // Add multiple items based on quantity (existing store adds 1 at a time)
    for (let i = 0; i < variantData.quantity; i++) {
      addItem(cartItem);
    }

    addToast({
      type: "success",
      title: "已成功加入購物車！",
      message: `${product.name} (${variantLabel}) x${variantData.quantity}`,
      duration: 4000,
    });
  };

  return (
    <div className={`rounded-xl bg-white p-6 ${className}`}>
      {/* Series Information */}
      <div className="mb-4">
        <div className="inline-block rounded bg-black px-3 py-1 text-sm text-white">
          {categoryConfig.title}
        </div>
      </div>

      {/* Product Name */}
      <div className="mb-6">
        <h1 className="mb-2 font-bold text-2xl text-gray-900 lg:text-4xl">
          {product.name}
        </h1>

        {/* Star Rating */}
        <StarRating
          className="mb-3 hidden"
          rating={reviewsData.rating}
          reviewCount={reviewsData.count}
          size="md"
        />

        {/* Product Description */}
        <p className="whitespace-break-spaces text-gray-600 text-md md:text-lg">
          {product.description}
        </p>
      </div>

      {/* Variant Selector with integrated quantity and add to cart */}
      <ProductVariantSelector
        className="mb-6"
        onAddToCart={handleAddToCart}
        // onVariantChange is optional - not needed for this implementation
        productId={product.id}
        variants={convertedVariants}
      />

      {/* Delivery Information */}
      <div className="rounded-lg bg-gray-50 p-3 text-center text-gray-600 text-sm">
        預估配送期：訂單成立後約 3 個月
      </div>
    </div>
  );
};

export default ProductDetail;

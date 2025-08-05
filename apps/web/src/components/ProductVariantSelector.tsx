import React, { useState, useEffect } from 'react';
import { z } from 'zod';

// Dynamic validation schema that adapts to available variants
const createVariantSchema = (variants: ProductVariant[]) => {
  const availableSizes = [...new Set(variants.map(v => v.size))];
  const availableFirmness = [...new Set(variants.map(v => v.firmness))];

  return z.object({
    size: z.enum(availableSizes as [string, ...string[]], { message: '請選擇尺寸' }),
    firmness: z.enum(availableFirmness as [string, ...string[]], { message: '請選擇類型' }),
    quantity: z.number().min(1, '數量至少為1').max(10, '數量不能超過10'),
  });
};

type VariantData = {
  size: string;
  firmness: string;
  quantity: number;
};

interface ProductVariant {
  size: string;
  firmness: string;
  price: number;
  stock: number;
  sku: string;
}

interface ProductVariantSelectorProps {
  productId: string;
  variants: ProductVariant[];
  onVariantChange: (variant: VariantData & { price: number; sku: string }) => void;
  onAddToCart?: (variant: VariantData & { price: number; sku: string }) => void;
  className?: string;
}

export default function ProductVariantSelector({
  productId,
  variants,
  onVariantChange,
  onAddToCart,
  className = '',
}: ProductVariantSelectorProps) {
  const [selectedVariant, setSelectedVariant] = useState<Partial<VariantData>>({
    quantity: 1,
  });
  const [errors, setErrors] = useState<Partial<Record<keyof VariantData, string>>>({});
  const [currentPrice, setCurrentPrice] = useState<number | null>(null);
  const [currentSku, setCurrentSku] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);

  // Auto-select variant if only one option exists
  useEffect(() => {
    if (variants.length === 1) {
      const singleVariant = variants[0];
      setSelectedVariant(prev => ({
        ...prev,
        size: singleVariant.size,
        firmness: singleVariant.firmness,
      }));
    }
  }, [variants]);

  // Generate dynamic options from variant data
  const availableSizes = [...new Set(variants.map(v => v.size))];
  const availableFirmness = [...new Set(variants.map(v => v.firmness))];

  // Size label mapping with fallback to value
  const getSizeLabel = (size: string) => {
    const sizeMap: Record<string, { label: string; width?: string }> = {
      single: { label: '單人 (3.5尺)', width: '105cm' },
      double: { label: '雙人 (5尺)', width: '152cm' },
      queen: { label: '加大雙人 (6尺)', width: '182cm' },
      king: { label: '特大雙人 (7尺)', width: '212cm' },
      small: { label: '小號' },
      medium: { label: '中號' },
      large: { label: '大號' },
      standard: { label: '標準尺寸' },
      compact: { label: '迷你尺寸' },
    };
    return sizeMap[size] || { label: size }; // Fallback to raw value
  };

  // Firmness label mapping with fallback to value
  const getFirmnessLabel = (firmness: string) => {
    const firmnessMap: Record<string, { label: string; description?: string }> = {
      soft: { label: '偏軟', description: '適合側睡者' },
      medium: { label: '適中', description: '適合多數人' },
      firm: { label: '偏硬', description: '適合仰睡者' },
      standard: { label: '標準' },
      premium: { label: '高級' },
      basic: { label: '基本款' },
    };
    return firmnessMap[firmness] || { label: firmness }; // Fallback to raw value
  };

  const sizeOptions = availableSizes.map(size => ({
    value: size,
    ...getSizeLabel(size),
  }));

  const firmnessOptions = availableFirmness.map(firmness => ({
    value: firmness,
    ...getFirmnessLabel(firmness),
  }));

  // Update price and SKU when variant selection changes
  useEffect(() => {
    if (selectedVariant.size && selectedVariant.firmness) {
      const variant = variants.find(
        v => v.size === selectedVariant.size && v.firmness === selectedVariant.firmness
      );

      if (variant) {
        setCurrentPrice(variant.price);
        setCurrentSku(variant.sku);

        try {
          const variantSchema = createVariantSchema(variants);
          const validatedVariant = variantSchema.parse(selectedVariant);
          onVariantChange({
            ...validatedVariant,
            price: variant.price,
            sku: variant.sku,
          });
        } catch (error) {
          // Validation failed, don't call onVariantChange
        }
      }
    }
  }, [selectedVariant, variants, onVariantChange]);

  const handleVariantChange = (field: keyof VariantData, value: string | number) => {
    setSelectedVariant(prev => ({ ...prev, [field]: value }));

    // Clear error when user makes a selection
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
    }
  };

  const validateAndAddToCart = async () => {
    if (!onAddToCart) return;

    setIsLoading(true);
    setErrors({});

    try {
      const variantSchema = createVariantSchema(variants);
      const validatedVariant = variantSchema.parse(selectedVariant);
      const variant = variants.find(
        v => v.size === validatedVariant.size && v.firmness === validatedVariant.firmness
      );

      if (!variant) {
        throw new Error('找不到對應的產品規格');
      }

      if (variant.stock < validatedVariant.quantity) {
        throw new Error('庫存不足');
      }

      await onAddToCart({
        ...validatedVariant,
        price: variant.price,
        sku: variant.sku,
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        const fieldErrors: Partial<Record<keyof VariantData, string>> = {};
        error.errors.forEach(err => {
          if (err.path[0]) {
            fieldErrors[err.path[0] as keyof VariantData] = err.message;
          }
        });
        setErrors(fieldErrors);
      } else {
        alert(error instanceof Error ? error.message : '加入購物車失敗');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const getCurrentStock = () => {
    if (!selectedVariant.size || !selectedVariant.firmness) return null;
    const variant = variants.find(
      v => v.size === selectedVariant.size && v.firmness === selectedVariant.firmness
    );
    return variant?.stock || 0;
  };

  const currentStock = getCurrentStock();

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Size Selection - only show if multiple options */}
      {sizeOptions.length > 1 ? (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-3">尺寸選擇 *</label>
          <div className="grid grid-cols-2 gap-3">
            {sizeOptions.map(option => (
              <button
                key={option.value}
                type="button"
                onClick={() => handleVariantChange('size', option.value)}
                className={`p-3 border rounded-lg text-left transition-colors ${
                  selectedVariant.size === option.value
                    ? 'border-black bg-black text-white'
                    : 'border-gray-300 hover:border-gray-400'
                }`}
              >
                <div className="font-medium">{option.label}</div>
                <div className="text-sm opacity-75">{option.width}</div>
              </button>
            ))}
          </div>
          {errors.size && <p className="text-red-500 text-sm mt-1">{errors.size}</p>}
        </div>
      ) : (
        sizeOptions.length === 1 && (
          <div className="p-3 bg-gray-50 rounded-lg">
            <span className="text-sm text-gray-600">尺寸: </span>
            <span className="font-medium">{sizeOptions[0].label}</span>
          </div>
        )
      )}

      {/* Firmness Selection - only show if multiple options */}
      {firmnessOptions.length > 1 ? (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-3">軟硬度選擇 *</label>
          <div className="grid grid-cols-3 gap-3">
            {firmnessOptions.map(option => (
              <button
                key={option.value}
                type="button"
                onClick={() => handleVariantChange('firmness', option.value)}
                className={`p-3 border rounded-lg text-center transition-colors ${
                  selectedVariant.firmness === option.value
                    ? 'border-black bg-black text-white'
                    : 'border-gray-300 hover:border-gray-400'
                }`}
              >
                <div className="font-medium">{option.label}</div>
                <div className="text-xs opacity-75">{option.description}</div>
              </button>
            ))}
          </div>
          {errors.firmness && <p className="text-red-500 text-sm mt-1">{errors.firmness}</p>}
        </div>
      ) : (
        firmnessOptions.length === 1 && (
          <div className="p-3 bg-gray-50 rounded-lg">
            <span className="text-sm text-gray-600">軟硬度: </span>
            <span className="font-medium">{firmnessOptions[0].label}</span>
            <span className="text-xs text-gray-500 ml-2">({firmnessOptions[0].description})</span>
          </div>
        )
      )}

      {/* Price Display */}
      {currentPrice && (
        <div className="p-4 bg-gray-50 rounded-lg">
          <div className="flex justify-between items-center">
            <span className="text-lg font-semibold">售價</span>
            <span className="text-2xl font-bold text-red-600">
              NT$ {currentPrice.toLocaleString()}
            </span>
          </div>
          {currentStock !== null && (
            <div className="text-sm text-gray-600 mt-1">庫存: {currentStock} 件</div>
          )}
        </div>
      )}

      {/* Quantity Selection */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">數量 *</label>
        <div className="flex items-center space-x-3">
          <button
            type="button"
            onClick={() =>
              handleVariantChange('quantity', Math.max(1, (selectedVariant.quantity || 1) - 1))
            }
            className="w-10 h-10 border border-gray-300 rounded-lg flex items-center justify-center hover:bg-gray-50"
            disabled={(selectedVariant.quantity || 1) <= 1}
          >
            -
          </button>
          <input
            type="number"
            min="1"
            max={Math.min(10, currentStock || 10)}
            value={selectedVariant.quantity || 1}
            onChange={e => handleVariantChange('quantity', parseInt(e.target.value) || 1)}
            className="w-20 text-center border border-gray-300 rounded-lg py-2"
          />
          <button
            type="button"
            onClick={() =>
              handleVariantChange(
                'quantity',
                Math.min(10, currentStock || 10, (selectedVariant.quantity || 1) + 1)
              )
            }
            className="w-10 h-10 border border-gray-300 rounded-lg flex items-center justify-center hover:bg-gray-50"
            disabled={(selectedVariant.quantity || 1) >= Math.min(10, currentStock || 10)}
          >
            +
          </button>
        </div>
        {errors.quantity && <p className="text-red-500 text-sm mt-1">{errors.quantity}</p>}
      </div>

      {/* Add to Cart Button */}
      {onAddToCart && (
        <button
          type="button"
          onClick={validateAndAddToCart}
          disabled={isLoading || !currentPrice || currentStock === 0}
          className="w-full bg-black text-white py-4 px-6 rounded-lg font-semibold text-lg hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {isLoading ? '處理中...' : currentStock === 0 ? '暫時缺貨' : '加入購物車'}
        </button>
      )}

      {/* SKU Display */}
      {currentSku && <div className="text-xs text-gray-500">商品編號: {currentSku}</div>}
    </div>
  );
}

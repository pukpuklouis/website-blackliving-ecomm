import React, { useState, useEffect } from 'react';
import { z } from 'zod';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@blackliving/ui';

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

  const sizeOptions = availableSizes.map(size => ({
    value: size,
    label: size,
  }));

  const firmnessOptions = availableFirmness.map(firmness => ({
    value: firmness,
    label: firmness,
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
      {/* Size Selection - always show dropdown, even for single option */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-3">選擇尺寸 *</label>
        <Select
          value={selectedVariant.size || ''}
          onValueChange={(value: string) => handleVariantChange('size', value)}
        >
          <SelectTrigger className="w-full">
            <SelectValue placeholder="請選擇尺寸" />
          </SelectTrigger>
          <SelectContent>
            {sizeOptions.map(option => (
              <SelectItem key={option.value} value={option.value}>
                <span className="font-medium">{option.label}</span>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {errors.size && <p className="text-red-500 text-sm mt-1">{errors.size}</p>}
      </div>

      {/* Firmness Selection - always show dropdown, even for single option */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-3">選擇軟硬度 *</label>
        <Select
          value={selectedVariant.firmness || ''}
          onValueChange={(value: string) => handleVariantChange('firmness', value)}
        >
          <SelectTrigger className="w-full">
            <SelectValue placeholder="請選擇軟硬度" />
          </SelectTrigger>
          <SelectContent>
            {firmnessOptions.map(option => (
              <SelectItem key={option.value} value={option.value}>
                <span className="font-medium">{option.label}</span>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {errors.firmness && <p className="text-red-500 text-sm mt-1">{errors.firmness}</p>}
      </div>

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

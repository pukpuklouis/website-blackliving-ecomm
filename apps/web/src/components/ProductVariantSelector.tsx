import React, { useState, useEffect } from 'react';
import { z } from 'zod';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@blackliving/ui';
import { OPTION_DISPLAY_NAMES } from '@blackliving/types/product-templates';

// Dynamic validation schema that adapts to available variants
const createVariantSchema = (optionNames: string[], variants: ProductVariant[]) => {
  const schemaShape: Record<string, z.ZodTypeAny> = {};

  optionNames.forEach((optionName) => {
    const availableValues = [...new Set(variants.map((v) => v.options[optionName]))];
    schemaShape[optionName] = z.enum(availableValues as [string, ...string[]], {
      message: `請選擇${optionName}`,
    });
  });

  schemaShape.quantity = z.number().min(1, '數量至少為1').max(10, '數量不能超過10');

  return z.object(schemaShape);
};

type VariantData = {
  options: Record<string, string>;
  quantity: number;
};

interface ProductVariant {
  options: Record<string, string>;
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
  const optionNames =
    variants &&
      variants.length > 0 &&
      variants[0] &&
      variants[0].options &&
      typeof variants[0].options === 'object'
      ? Object.keys(variants[0].options)
      : [];

  const [selectedOptions, setSelectedOptions] = useState<Record<string, string>>({});
  const [quantity, setQuantity] = useState<number>(1);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [currentPrice, setCurrentPrice] = useState<number | null>(null);
  const [currentSku, setCurrentSku] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);

  // Auto-select variant if only one option exists
  useEffect(() => {
    if (variants.length === 1 && variants[0]?.options) {
      setSelectedOptions(variants[0].options);
      setQuantity(1);
    }
  }, [variants]);

  // Generate dynamic options from variant data
  const optionConfigs = optionNames.map((optionName) => ({
    name: optionName,
    displayName: OPTION_DISPLAY_NAMES[optionName] || optionName,
    values: [...new Set(variants.map((v) => v.options?.[optionName]).filter(Boolean))],
    isColor: optionName.toLowerCase().includes('color'),
  }));

  // Update price and SKU when variant selection changes
  useEffect(() => {
    if (variants.length === 0 || optionNames.length === 0) return;

    const allOptionsSelected = optionNames.every((name) => selectedOptions[name]);
    if (allOptionsSelected) {
      const variant = variants.find(
        (v) => v.options && optionNames.every((name) => v.options[name] === selectedOptions[name])
      );

      if (variant) {
        setCurrentPrice(variant.price);
        setCurrentSku(variant.sku);

        try {
          const variantSchema = createVariantSchema(optionNames, variants);
          const validatedData = variantSchema.parse({ ...selectedOptions, quantity });
          onVariantChange({
            options: selectedOptions,
            quantity,
            price: variant.price,
            sku: variant.sku,
          });
        } catch (error) {
          // Validation failed, don't call onVariantChange
        }
      }
    }
  }, [selectedOptions, quantity, variants, onVariantChange, optionNames]);

  const handleVariantChange = (field: string, value: string | number) => {
    if (field === 'quantity') {
      setQuantity(value as number);
    } else {
      setSelectedOptions((prev) => ({ ...prev, [field]: value as string }));
    }

    // Clear error when user makes a selection
    if (errors[field]) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  const validateAndAddToCart = async () => {
    if (!onAddToCart || variants.length === 0 || optionNames.length === 0) return;

    setIsLoading(true);
    setErrors({});

    try {
      const variantSchema = createVariantSchema(optionNames, variants);
      const validatedData = variantSchema.parse({ ...selectedOptions, quantity });
      const variant = variants.find(
        (v) => v.options && optionNames.every((name) => v.options[name] === selectedOptions[name])
      );

      if (!variant) {
        throw new Error('找不到對應的產品規格');
      }

      if (variant.stock < quantity) {
        throw new Error('庫存不足');
      }

      await onAddToCart({
        options: selectedOptions,
        quantity,
        price: variant.price,
        sku: variant.sku,
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        const fieldErrors: Record<string, string> = {};
        error.issues.forEach((err) => {
          if (err.path[0]) {
            fieldErrors[err.path[0] as string] = err.message;
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
    if (variants.length === 0 || optionNames.length === 0) return null;
    const allOptionsSelected = optionNames.every((name) => selectedOptions[name]);
    if (!allOptionsSelected) return null;
    const variant = variants.find(
      (v) => v.options && optionNames.every((name) => v.options[name] === selectedOptions[name])
    );
    return variant?.stock || 0;
  };

  const currentStock = getCurrentStock();

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Dynamic Option Selections */}
      {optionConfigs.map((config) => (
        <div key={config.name}>
          <label className="block text-md md:text-lg font-medium text-gray-700 mb-3">
            選擇{config.displayName} *
          </label>
          <Select
            value={selectedOptions[config.name] || ''}
            onValueChange={(value: string) => handleVariantChange(config.name, value)}
          >
            <SelectTrigger className="w-full text-md md:text-lg md:w-[50%]">
              <SelectValue placeholder={`請選擇${config.displayName}`} />
            </SelectTrigger>
            <SelectContent>
              {config.values.map((value) => (
                <SelectItem key={value} value={value}>
                  <span className="text-md md:text-lg font-medium">{value}</span>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {errors[config.name] && (
            <p className="text-destructive text-md mt-1">{errors[config.name]}</p>
          )}
        </div>
      ))}

      {/* Price Display */}
      {currentPrice && (
        <div className="p-4 bg-gray-50 rounded-lg">
          <div className="flex justify-between items-center">
            <span className="text-lg font-semibold">售價</span>
            <span className="text-2xl md:text-3xl font-bold text-destructive">
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
            onClick={() => handleVariantChange('quantity', Math.max(1, quantity - 1))}
            className="w-10 h-10 border border-gray-300 rounded-lg flex items-center justify-center hover:bg-gray-50"
            disabled={quantity <= 1}
          >
            -
          </button>
          <input
            type="number"
            min="1"
            max={Math.min(10, currentStock || 10)}
            value={quantity}
            onChange={(e) => handleVariantChange('quantity', parseInt(e.target.value) || 1)}
            className="w-20 text-center border border-gray-300 rounded-lg py-2"
          />
          <button
            type="button"
            onClick={() =>
              handleVariantChange('quantity', Math.min(10, currentStock || 10, quantity + 1))
            }
            className="w-10 h-10 border border-gray-300 rounded-lg flex items-center justify-center hover:bg-gray-50"
            disabled={quantity >= Math.min(10, currentStock || 10)}
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

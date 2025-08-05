import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { z } from 'zod';

// Types and schemas
export interface ProductVariant {
  id: string;
  name: string;
  size?: string;
  price: number;
  originalPrice?: number;
  inStock: boolean;
}

export interface CartItem {
  productId: string;
  variantId?: string;
  name: string;
  variant?: string;
  size?: string;
  price: number;
  originalPrice?: number;
  quantity: number;
  image: string;
  inStock: boolean;
}

export interface ShippingAddress {
  name: string;
  phone: string;
  address: string;
  city: string;
  district: string;
  postalCode: string;
}

export interface CustomerInfo {
  name: string;
  email: string;
  phone: string;
}

// Validation schemas
const cartItemSchema = z.object({
  productId: z.string().min(1),
  variantId: z.string().optional(),
  name: z.string().min(1),
  variant: z.string().optional(),
  size: z.string().optional(),
  price: z.number().positive(),
  originalPrice: z.number().positive().optional(),
  quantity: z.number().positive(),
  image: z.string().url(),
  inStock: z.boolean(),
});

const customerInfoSchema = z.object({
  name: z.string().min(1, '請輸入姓名'),
  email: z.string().email('請輸入有效的電子郵件'),
  phone: z.string().min(10, '請輸入有效的電話號碼'),
});

const shippingAddressSchema = z.object({
  name: z.string().min(1, '請輸入收件人姓名'),
  phone: z.string().min(10, '請輸入收件人電話'),
  address: z.string().min(1, '請輸入詳細地址'),
  city: z.string().min(1, '請選擇城市'),
  district: z.string().min(1, '請選擇區域'),
  postalCode: z.string().regex(/^\d{3,5}$/, '請輸入有效的郵遞區號'),
});

export interface CartStore {
  // State
  items: CartItem[];
  isLoading: boolean;
  error: string | null;
  customerInfo: CustomerInfo | null;
  shippingAddress: ShippingAddress | null;
  paymentMethod: 'bank_transfer' | 'credit_card' | 'cash_on_delivery';
  notes: string;
  isSubmittingOrder: boolean;

  // Computed values
  itemCount: number;
  subtotal: number;
  shippingFee: number;
  total: number;

  // Actions
  addItem: (item: Omit<CartItem, 'quantity'>) => void;
  removeItem: (productId: string, variantId?: string) => void;
  updateQuantity: (productId: string, quantity: number, variantId?: string) => void;
  clearCart: () => void;

  // Customer & shipping
  setCustomerInfo: (info: CustomerInfo) => void;
  setShippingAddress: (address: ShippingAddress) => void;
  setPaymentMethod: (method: 'bank_transfer' | 'credit_card' | 'cash_on_delivery') => void;
  setNotes: (notes: string) => void;

  // Order creation
  createOrder: () => Promise<{ success: boolean; orderNumber?: string; error?: string }>;

  // Utility
  setError: (error: string | null) => void;
  setLoading: (loading: boolean) => void;
  validateCart: () => { isValid: boolean; errors: string[] };
  getItemKey: (productId: string, variantId?: string) => string;
}

// Helper functions
const calculateShippingFee = (subtotal: number): number => {
  // Free shipping for orders over NT$30,000
  return subtotal >= 30000 ? 0 : 1500;
};

const getItemKey = (productId: string, variantId?: string): string => {
  return variantId ? `${productId}-${variantId}` : productId;
};

const createOrder = async (
  items: CartItem[],
  customerInfo: CustomerInfo,
  shippingAddress: ShippingAddress | null,
  paymentMethod: string,
  notes: string,
  subtotal: number,
  shippingFee: number,
  total: number
) => {
  try {
    const orderData = {
      customerInfo,
      items: items.map(item => ({
        productId: item.productId,
        variantId: item.variantId,
        name: item.name,
        quantity: item.quantity,
        price: item.price,
        size: item.size,
      })),
      subtotalAmount: subtotal,
      shippingFee,
      totalAmount: total,
      paymentMethod,
      notes,
      shippingAddress,
    };

    const response = await fetch('/api/orders', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(orderData),
    });

    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.error || '訂單建立失敗');
    }

    return {
      success: true,
      orderNumber: result.data?.orderNumber,
    };
  } catch (error) {
    console.error('Order creation error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : '訂單建立失敗，請稍後再試',
    };
  }
};

export const useCartStore = create<CartStore>()(
  persist(
    (set, get) => ({
      // Initial state
      items: [],
      isLoading: false,
      error: null,
      customerInfo: null,
      shippingAddress: null,
      paymentMethod: 'bank_transfer',
      notes: '',
      isSubmittingOrder: false,

      // Computed values (getters)
      get itemCount() {
        return get().items.reduce((sum, item) => sum + item.quantity, 0);
      },

      get subtotal() {
        return get().items.reduce((sum, item) => sum + item.price * item.quantity, 0);
      },

      get shippingFee() {
        return calculateShippingFee(get().subtotal);
      },

      get total() {
        return get().subtotal + get().shippingFee;
      },

      // Actions
      addItem: newItem => {
        set(state => {
          const itemKey = getItemKey(newItem.productId, newItem.variantId);
          const existingItemIndex = state.items.findIndex(
            item => getItemKey(item.productId, item.variantId) === itemKey
          );

          if (existingItemIndex >= 0) {
            // Update existing item quantity
            const updatedItems = [...state.items];
            updatedItems[existingItemIndex] = {
              ...updatedItems[existingItemIndex],
              quantity: updatedItems[existingItemIndex].quantity + 1,
            };
            return { items: updatedItems };
          } else {
            // Add new item
            return {
              items: [...state.items, { ...newItem, quantity: 1 }],
            };
          }
        });
      },

      removeItem: (productId, variantId) => {
        set(state => {
          const itemKey = getItemKey(productId, variantId);
          return {
            items: state.items.filter(
              item => getItemKey(item.productId, item.variantId) !== itemKey
            ),
          };
        });
      },

      updateQuantity: (productId, quantity, variantId) => {
        set(state => {
          if (quantity <= 0) {
            // Remove item if quantity is 0 or less
            const itemKey = getItemKey(productId, variantId);
            return {
              items: state.items.filter(
                item => getItemKey(item.productId, item.variantId) !== itemKey
              ),
            };
          }

          return {
            items: state.items.map(item => {
              const itemKey = getItemKey(item.productId, item.variantId);
              const targetKey = getItemKey(productId, variantId);

              if (itemKey === targetKey) {
                return { ...item, quantity: Math.max(1, quantity) };
              }
              return item;
            }),
          };
        });
      },

      clearCart: () => {
        set({
          items: [],
          error: null,
          customerInfo: null,
          shippingAddress: null,
          notes: '',
        });
      },

      setCustomerInfo: info => {
        try {
          customerInfoSchema.parse(info);
          set({ customerInfo: info, error: null });
        } catch (error) {
          if (error instanceof z.ZodError) {
            set({ error: error.issues[0]?.message || '客戶資料格式錯誤' });
          }
        }
      },

      setShippingAddress: address => {
        try {
          shippingAddressSchema.parse(address);
          set({ shippingAddress: address, error: null });
        } catch (error) {
          if (error instanceof z.ZodError) {
            set({ error: error.issues[0]?.message || '配送地址格式錯誤' });
          }
        }
      },

      setPaymentMethod: method => {
        set({ paymentMethod: method });
      },

      setNotes: notes => {
        set({ notes });
      },

      createOrder: async () => {
        const state = get();

        // Validate cart
        const validation = state.validateCart();
        if (!validation.isValid) {
          set({ error: validation.errors[0] });
          return { success: false, error: validation.errors[0] };
        }

        set({ isSubmittingOrder: true, error: null });

        try {
          const result = await createOrder(
            state.items,
            state.customerInfo!,
            state.shippingAddress,
            state.paymentMethod,
            state.notes,
            state.subtotal,
            state.shippingFee,
            state.total
          );

          if (result.success) {
            // Clear cart on successful order
            get().clearCart();
          } else {
            set({ error: result.error || '訂單建立失敗' });
          }

          return result;
        } finally {
          set({ isSubmittingOrder: false });
        }
      },

      setError: error => set({ error }),
      setLoading: loading => set({ isLoading: loading }),

      validateCart: () => {
        const state = get();
        const errors: string[] = [];

        if (state.items.length === 0) {
          errors.push('購物車不能為空');
        }

        if (!state.customerInfo) {
          errors.push('請填寫客戶資料');
        }

        // Check stock availability
        const outOfStockItems = state.items.filter(item => !item.inStock);
        if (outOfStockItems.length > 0) {
          errors.push(`以下商品缺貨：${outOfStockItems.map(item => item.name).join(', ')}`);
        }

        return {
          isValid: errors.length === 0,
          errors,
        };
      },

      getItemKey,
    }),
    {
      name: 'cart-store',
      partialize: state => ({
        items: state.items,
        customerInfo: state.customerInfo,
        shippingAddress: state.shippingAddress,
        paymentMethod: state.paymentMethod,
        notes: state.notes,
      }),
    }
  )
);

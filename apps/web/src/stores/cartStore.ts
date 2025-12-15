import { z } from "zod";
import { create } from "zustand";
import { persist } from "zustand/middleware";

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

export interface LogisticSettings {
  baseFee: number;
  freeShippingThreshold: number;
  remoteZones: Array<{
    id: string;
    city: string;
    district?: string;
    surcharge: number;
  }>;
}

// Validation schemas

const customerInfoSchema = z.object({
  name: z.string().min(1, "請輸入姓名"),
  email: z.string().email("請輸入有效的電子郵件"),
  phone: z.string().min(10, "請輸入有效的電話號碼"),
});

const shippingAddressSchema = z.object({
  name: z.string().min(1, "請輸入收件人姓名"),
  phone: z.string().min(10, "請輸入收件人電話"),
  address: z.string().min(1, "請輸入詳細地址"),
  city: z.string().min(1, "請選擇城市"),
  district: z.string().min(1, "請選擇區域"),
  postalCode: z.string().regex(/^\d{3,5}$/, "請輸入有效的郵遞區號"),
});

export interface CartStore {
  // State
  items: CartItem[];
  isLoading: boolean;
  error: string | null;
  customerInfo: CustomerInfo | null;
  shippingAddress: ShippingAddress | null;
  paymentMethod: "bank_transfer" | "credit_card" | "cash_on_delivery";
  notes: string;
  isSubmittingOrder: boolean;
  logisticSettings: LogisticSettings;

  // Computed selectors (methods that calculate values on demand)
  getItemCount: () => number;
  getSubtotal: () => number;
  getShippingFee: () => number;
  getTotal: () => number;

  // Actions
  addItem: (item: Omit<CartItem, "quantity">) => void;
  removeItem: (productId: string, variantId?: string) => void;
  updateQuantity: (
    productId: string,
    quantity: number,
    variantId?: string
  ) => void;
  clearCart: () => void;

  // Customer & shipping
  setCustomerInfo: (info: CustomerInfo) => void;
  setShippingAddress: (address: ShippingAddress) => void;
  setPaymentMethod: (
    method: "bank_transfer" | "credit_card" | "cash_on_delivery"
  ) => void;
  setNotes: (notes: string) => void;

  // UI State
  isCartOpen: boolean;
  openCart: () => void;
  closeCart: () => void;
  toggleCart: () => void;

  // Order creation
  createOrder: () => Promise<{
    success: boolean;
    orderNumber?: string;
    error?: string;
  }>;

  // Utility
  setError: (error: string | null) => void;
  setLoading: (loading: boolean) => void;
  validateCart: () => { isValid: boolean; errors: string[] };
  getItemKey: (productId: string, variantId?: string) => string;
  fetchLogisticSettings: () => Promise<void>;
}

// Helper functions
// Helper to get API URL from environment
const getApiUrl = (): string => {
  const candidates: unknown[] = [
    import.meta.env.PUBLIC_API_BASE_URL,
    import.meta.env.PUBLIC_API_URL,
  ];

  if (typeof globalThis !== "undefined") {
    const runtimeEnv =
      (globalThis as Record<string, unknown>).ENV ??
      (globalThis as Record<string, unknown>).__ENV__ ??
      (globalThis as Record<string, unknown>).__ENV;

    if (runtimeEnv && typeof runtimeEnv === "object") {
      const envRecord = runtimeEnv as Record<string, unknown>;
      candidates.push(envRecord.PUBLIC_API_BASE_URL);
      candidates.push(envRecord.PUBLIC_API_URL);
    }
  }

  const apiUrl = candidates.reduce<string>((acc, candidate) => {
    if (acc) return acc;
    if (typeof candidate === "string") {
      const trimmed = candidate.trim();
      if (trimmed) {
        return trimmed.endsWith("/") ? trimmed.slice(0, -1) : trimmed;
      }
    }
    return acc;
  }, "");

  // Return the found URL or empty string (will fallback to relative URL)
  return apiUrl;
};

// Helper functions
// Helper functions
export const calculateShippingFee = (
  subtotal: number,
  settings: LogisticSettings,
  address: ShippingAddress | null
): number => {
  let fee = 0;

  // 1. Base Fee logic
  if (subtotal < settings.freeShippingThreshold) {
    fee += settings.baseFee;
  }

  // 2. Remote Zone Surcharge logic
  if (address && settings.remoteZones.length > 0) {
    const zone = settings.remoteZones.find((z) => {
      // Simple string matching, can be improved
      const cityMatch =
        address.city.includes(z.city) || z.city.includes(address.city);
      if (!cityMatch) return false;

      // If zone has district, it must match
      if (z.district) {
        return (
          address.district.includes(z.district) ||
          z.district.includes(address.district)
        );
      }
      return true;
    });

    if (zone) {
      fee += zone.surcharge;
    }
  }

  return fee;
};

const getItemKey = (productId: string, variantId?: string): string =>
  variantId ? `${productId}-${variantId}` : productId;

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
      items: items.map((item) => ({
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

    const apiUrl = getApiUrl();
    const orderEndpoint = apiUrl ? `${apiUrl}/api/orders` : "/api/orders";

    const response = await fetch(orderEndpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(orderData),
    });

    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.error || "訂單建立失敗");
    }

    return {
      success: true,
      orderNumber: result.data?.orderNumber,
    };
  } catch (error) {
    console.error("Order creation error:", error);
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "訂單建立失敗，請稍後再試",
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
      paymentMethod: "bank_transfer",
      notes: "",
      isSubmittingOrder: false,
      isCartOpen: false,
      logisticSettings: {
        baseFee: 1500,
        freeShippingThreshold: 30_000,
        remoteZones: [],
      },

      // Computed selectors (NOT persisted, calculated on demand)
      getItemCount: () =>
        get().items.reduce((sum, item) => sum + item.quantity, 0),

      getSubtotal: () =>
        get().items.reduce((sum, item) => sum + item.price * item.quantity, 0),

      getShippingFee: () => {
        const state = get();
        const subtotal = state.getSubtotal();
        return calculateShippingFee(
          subtotal,
          state.logisticSettings,
          state.shippingAddress
        );
      },

      getTotal: () => {
        const state = get();
        return state.getSubtotal() + state.getShippingFee();
      },

      // Actions
      addItem: (newItem) => {
        set((state) => {
          const itemKey = getItemKey(newItem.productId, newItem.variantId);
          const existingItemIndex = state.items.findIndex(
            (item) => getItemKey(item.productId, item.variantId) === itemKey
          );

          if (existingItemIndex >= 0) {
            // Update existing item quantity
            const updatedItems = [...state.items];
            updatedItems[existingItemIndex] = {
              ...updatedItems[existingItemIndex],
              quantity: updatedItems[existingItemIndex].quantity + 1,
            };
            return { items: updatedItems };
          }
          // Add new item
          return {
            items: [...state.items, { ...newItem, quantity: 1 }],
          };
        });
      },

      removeItem: (productId, variantId) => {
        set((state) => {
          const itemKey = getItemKey(productId, variantId);
          return {
            items: state.items.filter(
              (item) => getItemKey(item.productId, item.variantId) !== itemKey
            ),
          };
        });
      },

      updateQuantity: (productId, quantity, variantId) => {
        set((state) => {
          if (quantity <= 0) {
            // Remove item if quantity is 0 or less
            const itemKey = getItemKey(productId, variantId);
            return {
              items: state.items.filter(
                (item) => getItemKey(item.productId, item.variantId) !== itemKey
              ),
            };
          }

          return {
            items: state.items.map((item) => {
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
          notes: "",
        });
      },

      setCustomerInfo: (info) => {
        try {
          customerInfoSchema.parse(info);
          set({ customerInfo: info, error: null });
        } catch (error) {
          if (error instanceof z.ZodError) {
            set({ error: error.issues[0]?.message || "客戶資料格式錯誤" });
          }
        }
      },

      setShippingAddress: (address) => {
        try {
          shippingAddressSchema.parse(address);
          set({ shippingAddress: address, error: null });
        } catch (error) {
          if (error instanceof z.ZodError) {
            set({ error: error.issues[0]?.message || "配送地址格式錯誤" });
          }
        }
      },

      setPaymentMethod: (method) => {
        set({ paymentMethod: method });
      },

      setNotes: (notes) => {
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
            state.getSubtotal(),
            state.getShippingFee(),
            state.getTotal()
          );

          if (result.success) {
            // Clear cart on successful order
            get().clearCart();
          } else {
            set({ error: result.error || "訂單建立失敗" });
          }

          return result;
        } finally {
          set({ isSubmittingOrder: false });
        }
      },

      setError: (error) => set({ error }),
      setLoading: (loading) => set({ isLoading: loading }),

      validateCart: () => {
        const state = get();
        const errors: string[] = [];

        if (state.items.length === 0) {
          errors.push("購物車不能為空");
        }

        if (!state.customerInfo) {
          errors.push("請填寫客戶資料");
        }

        // Check stock availability
        const outOfStockItems = state.items.filter((item) => !item.inStock);
        if (outOfStockItems.length > 0) {
          errors.push(
            `以下商品缺貨：${outOfStockItems.map((item) => item.name).join(", ")}`
          );
        }

        return {
          isValid: errors.length === 0,
          errors,
        };
      },

      getItemKey,

      // UI Actions
      openCart: () => set({ isCartOpen: true }),
      closeCart: () => set({ isCartOpen: false }),
      toggleCart: () => set((state) => ({ isCartOpen: !state.isCartOpen })),

      fetchLogisticSettings: async () => {
        try {
          const apiUrl = getApiUrl();
          const logisticEndpoint = apiUrl
            ? `${apiUrl}/api/settings/logistic_settings`
            : "/api/settings/logistic_settings";

          const response = await fetch(logisticEndpoint, {
            credentials: "include",
          });
          if (response.ok) {
            const result = await response.json();
            if (result.success && result.data) {
              const currentSettings = get().logisticSettings;
              // Only update if settings have changed to avoid unnecessary re-renders
              if (
                JSON.stringify(currentSettings) !== JSON.stringify(result.data)
              ) {
                set({ logisticSettings: result.data });
              }
            }
          }
        } catch (error) {
          console.error("Failed to fetch logistic settings:", error);
        }
      },
    }),
    {
      name: "cart-store",
      version: 2,
      partialize: (state) => ({
        items: state.items,
        customerInfo: state.customerInfo,
        shippingAddress: state.shippingAddress,
        paymentMethod: state.paymentMethod,
        notes: state.notes,
        logisticSettings: state.logisticSettings,
        // Don't persist UI state
      }),
      merge: (persistedState, currentState) => {
        // Merge persisted state with current state
        // Methods (getters) are never persisted, so they're safe
        return {
          ...currentState,
          ...(persistedState || {}),
        };
      },
    }
  )
);

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface Store {
  id: string;
  name: string;
  address: string;
  phone: string;
  hours: string;
}

export interface Product {
  id: string;
  name: string;
  category: 'simmons-black' | 'accessories' | 'us-imports';
  description: string;
  image?: string;
}

export interface AppointmentData {
  // Step 1: Store selection
  selectedStore: Store | null;
  
  // Step 2: Product selection
  selectedProduct: Product | null;
  
  // Step 3: Personal info
  name: string;
  phone: string;
  email: string;
  
  // Step 4: Date & time
  preferredDate: string;
  preferredTime: string;
  
  // Step 5: Additional info
  message: string;
  
  // Account creation
  hasAccount: boolean;
  createAccount: boolean;
}

export interface AppointmentStore {
  currentStep: number;
  appointmentData: AppointmentData;
  isSubmitting: boolean;
  
  // Store data
  stores: Store[];
  products: Product[];
  
  // Actions
  setCurrentStep: (step: number) => void;
  updateAppointmentData: (data: Partial<AppointmentData>) => void;
  nextStep: () => void;
  prevStep: () => void;
  resetForm: () => void;
  setIsSubmitting: (submitting: boolean) => void;
  
  // Data loaders
  setStores: (stores: Store[]) => void;
  setProducts: (products: Product[]) => void;
}

const initialAppointmentData: AppointmentData = {
  selectedStore: null,
  selectedProduct: null,
  name: '',
  phone: '',
  email: '',
  preferredDate: '',
  preferredTime: '',
  message: '',
  hasAccount: false,
  createAccount: false,
};

export const useAppointmentStore = create<AppointmentStore>()(
  persist(
    (set, get) => ({
      currentStep: 0,
      appointmentData: initialAppointmentData,
      isSubmitting: false,
      
      stores: [
        {
          id: 'zhonghe',
          name: '中和展間',
          address: '新北市中和區中正路123號',
          phone: '02-2234-5678',
          hours: '週一至週日 10:00-21:00'
        },
        {
          id: 'zhongli',
          name: '中壢展間', 
          address: '桃園市中壢區中央西路456號',
          phone: '03-4567-890',
          hours: '週一至週日 10:00-21:00'
        }
      ],
      
      products: [
        {
          id: 'black-label-firm',
          name: '席夢思黑標 - 堅硬型',
          category: 'simmons-black',
          description: '專為追求支撐性的睡眠者設計'
        },
        {
          id: 'black-label-medium',
          name: '席夢思黑標 - 中等硬度',
          category: 'simmons-black', 
          description: '平衡舒適與支撐的完美選擇'
        },
        {
          id: 'black-label-plush',
          name: '席夢思黑標 - 柔軟型',
          category: 'simmons-black',
          description: '提供雲朵般的舒適睡眠體驗'
        },
        {
          id: 'pillow-premium',
          name: '頂級記憶枕',
          category: 'accessories',
          description: '配合床墊的完美枕頭選擇'
        },
        {
          id: 'mattress-protector',
          name: '床墊保護套',
          category: 'accessories',
          description: '延長床墊使用壽命的必備配件'
        }
      ],
      
      setCurrentStep: (step) => set({ currentStep: step }),
      
      updateAppointmentData: (data) => 
        set((state) => ({
          appointmentData: { ...state.appointmentData, ...data }
        })),
      
      nextStep: () => 
        set((state) => ({ currentStep: Math.min(state.currentStep + 1, 5) })),
      
      prevStep: () => 
        set((state) => ({ currentStep: Math.max(state.currentStep - 1, 0) })),
      
      resetForm: () => 
        set({ 
          currentStep: 0, 
          appointmentData: initialAppointmentData,
          isSubmitting: false 
        }),
      
      setIsSubmitting: (submitting) => set({ isSubmitting: submitting }),
      
      setStores: (stores) => set({ stores }),
      setProducts: (products) => set({ products }),
    }),
    {
      name: 'appointment-store',
      partialize: (state) => ({ 
        appointmentData: state.appointmentData,
        currentStep: state.currentStep 
      }),
    }
  )
);
import { create } from "zustand";
import { persist } from "zustand/middleware";

export type Store = {
  id: string;
  name: string;
  address: string;
};

export type AppointmentData = {
  // Step 1: Store selection
  selectedStore: Store | null;

  // Step 2: Source/Referral
  source: "社群" | "朋友介紹" | "Google" | "蝦皮" | null;

  // Step 3: Competitor research
  hasTriedOtherStores: boolean | null;
  otherStoreNames: string;

  // Step 4: Price awareness
  priceAwareness: boolean | null;

  // Step 5: Series selection
  series: "一系列" | "二系列" | "三系列" | "四系列" | null;

  // Step 6: Firmness preference
  firmness: "偏硬" | "中等" | "偏軟" | null;

  // Step 7: Accessories
  accessories: ("無" | "枕頭" | "寢具" | "下墊")[];

  // Step 8: Personal info
  name: string;
  phone: string;
  email: string;
  createAccount: boolean | null;
  notes: string;
};

export type AppointmentStore = {
  currentStep: number;
  appointmentData: AppointmentData;
  isSubmitting: boolean;

  // Store data
  stores: Store[];

  // Actions
  setCurrentStep: (step: number) => void;
  updateAppointmentData: (data: Partial<AppointmentData>) => void;
  nextStep: () => void;
  prevStep: () => void;
  resetForm: () => void;
  setIsSubmitting: (submitting: boolean) => void;

  // Data loaders
  setStores: (stores: Store[]) => void;
};

const MAX_STEP_INDEX = 8; // 9 steps (0-8)

const initialAppointmentData: AppointmentData = {
  selectedStore: null,
  source: null,
  hasTriedOtherStores: null,
  otherStoreNames: "",
  priceAwareness: null,
  series: null,
  firmness: null,
  accessories: [],
  name: "",
  phone: "",
  email: "",
  createAccount: null,
  notes: "",
};

export const useAppointmentStore = create<AppointmentStore>()(
  persist(
    (set) => ({
      currentStep: 0,
      appointmentData: initialAppointmentData,
      isSubmitting: false,

      stores: [
        {
          id: "zhonghe",
          name: "Black Living 中和館",
          address: "新北市中和區景平路398號2樓",
        },
        {
          id: "zhongli",
          name: "Black Living 桃園館",
          address: "桃園市中壢區義民路91號",
        },
      ],

      setCurrentStep: (step) => set({ currentStep: step }),

      updateAppointmentData: (data) =>
        set((state) => ({
          appointmentData: { ...state.appointmentData, ...data },
        })),

      nextStep: () =>
        set((state) => ({
          currentStep: Math.min(state.currentStep + 1, MAX_STEP_INDEX),
        })),

      prevStep: () =>
        set((state) => ({ currentStep: Math.max(state.currentStep - 1, 0) })),

      resetForm: () =>
        set({
          currentStep: 0,
          appointmentData: initialAppointmentData,
          isSubmitting: false,
        }),

      setIsSubmitting: (submitting) => set({ isSubmitting: submitting }),

      setStores: (stores) => set({ stores }),
    }),
    {
      name: "appointment-store",
      partialize: (state) => ({
        appointmentData: state.appointmentData,
        currentStep: state.currentStep,
      }),
    }
  )
);

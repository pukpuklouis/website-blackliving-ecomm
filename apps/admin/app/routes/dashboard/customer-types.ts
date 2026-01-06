export type CustomerAddress = {
  city: string;
  district: string;
  street: string;
  postalCode: string;
};

export type CustomerTag = {
  id: string;
  name: string;
  color: string;
  category: string;
};

export type CustomerProfile = {
  id: string;
  customerNumber: string;
  userId?: string;
  name: string;
  email: string;
  phone: string;
  birthday?: string;
  gender?: "male" | "female" | "other";
  address?: CustomerAddress;
  shippingAddresses: CustomerAddress[];
  // Purchase Behavior
  totalSpent: number;
  orderCount: number;
  avgOrderValue: number;
  lastPurchaseAt?: Date;
  firstPurchaseAt?: Date;
  // Preferences & Segmentation
  favoriteCategories: string[];
  purchaseHistory: unknown[];
  segment: "new" | "regular" | "vip" | "inactive";
  lifetimeValue: number;
  churnRisk: "low" | "medium" | "high";
  // Interaction
  lastContactAt?: Date;
  contactPreference: "email" | "phone" | "sms";
  notes: string;
  source: string;
  tags: CustomerTag[];
  createdAt: Date;
  updatedAt: Date;
};

export type CustomerInteraction = {
  id: string;
  type: string;
  title: string;
  description?: string;
  performedBy?: string;
  createdAt: Date;
};

export const segmentLabels = {
  new: "新客戶",
  regular: "一般客戶",
  vip: "VIP客戶",
  inactive: "非活躍客戶",
} as const;

export const segmentColors = {
  new: "bg-blue-500",
  regular: "bg-green-500",
  vip: "bg-purple-500",
  inactive: "bg-gray-500",
} as const;

export const churnRiskLabels = {
  low: "低風險",
  medium: "中風險",
  high: "高風險",
} as const;

export const churnRiskColors = {
  low: "bg-green-500",
  medium: "bg-yellow-500",
  high: "bg-red-500",
} as const;

// Interaction types for customer interactions
export const interactionTypes = [
  "email",
  "note",
  "call",
  "appointment",
] as const;
export type InteractionType = (typeof interactionTypes)[number];

export const interactionTypeLabels: Record<InteractionType, string> = {
  email: "電子郵件",
  note: "備註",
  call: "電話",
  appointment: "預約",
};

export const interactionTypeIcons: Record<InteractionType, string> = {
  email: "mail",
  note: "file-text",
  call: "phone",
  appointment: "calendar",
};

// Gender labels
export const genderLabels = {
  male: "男性",
  female: "女性",
  other: "其他",
} as const;

// Contact preference labels
export const contactPreferenceLabels = {
  email: "電子郵件",
  phone: "電話",
  sms: "簡訊",
} as const;

// Form data type for editing customer
export type CustomerEditFormData = {
  name: string;
  email: string;
  phone: string;
  birthday?: string;
  gender?: "male" | "female" | "other";
  address?: CustomerAddress;
  shippingAddresses: CustomerAddress[];
  notes: string;
  contactPreference: "email" | "phone" | "sms";
  segment: "new" | "regular" | "vip" | "inactive";
  churnRisk: "low" | "medium" | "high";
};

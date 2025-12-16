export type AddressType = "home" | "office" | "other";

export type Address = {
  id: string;
  customerId: string;
  type: AddressType;
  street: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
  isDefault: boolean;
};

export type AddressCreateRequest = {
  type: "shipping" | "billing" | "both";
  label?: string;
  recipientName: string;
  recipientPhone: string;
  city: string;
  district: string;
  postalCode: string;
  street: string;
  building?: string;
  floor?: string;
  room?: string;
  deliveryInstructions?: string;
  accessCode?: string;
  isDefault?: boolean;
};

export type AddressUpdateRequest = Partial<AddressCreateRequest>;

// Customer Address type (from database schema)
export type CustomerAddress = {
  id: string;
  userId: string;
  type: "shipping" | "billing" | "both";
  label?: string;
  isDefault: boolean;
  recipientName: string;
  recipientPhone: string;
  city: string;
  district: string;
  postalCode: string;
  street: string;
  building?: string;
  floor?: string;
  room?: string;
  deliveryInstructions?: string;
  accessCode?: string;
  lastUsedAt?: Date;
  usageCount: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
};

// API Response types
export type AddressApiResponse = {
  success: boolean;
  data?: CustomerAddress;
  error?: string;
  message?: string;
};

export type AddressesApiResponse = {
  success: boolean;
  data?: CustomerAddress[];
  error?: string;
  message?: string;
};

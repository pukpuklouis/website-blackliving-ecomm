import type { Address } from "./address";
import type { CustomerProfile, User, UserProfile } from "./user";

export type FullUserProfile = {
  user: User;
  userProfile: UserProfile;
  customerProfile: CustomerProfile;
  addresses: Address[];
};

export type ProfileAnalytics = {
  totalSpent: number;
  orderCount: number;
  avgOrderValue: number;
  lastOrderAt?: Date;
  lastPurchaseAt?: Date;
  firstPurchaseAt?: Date;
};

// Profile Update Request Types
export type ProfileUpdateRequest = {
  firstName?: string;
  lastName?: string;
  phone?: string;
  birthday?: string;
  gender?: "male" | "female" | "other";
  contactPreference?: "email" | "phone" | "sms";
  notes?: string;
  preferences?: Record<string, unknown>;
};

// Error Types
export type ProfileError = {
  code: string;
  message: string;
  field?: string;
  details?: Record<string, unknown>;
};

export type ProfileValidationError = ProfileError & {
  code: "VALIDATION_ERROR";
  field: string;
};

export type ProfileNotFoundError = ProfileError & {
  code: "PROFILE_NOT_FOUND";
};

export type ProfileUnauthorizedError = ProfileError & {
  code: "UNAUTHORIZED";
};

// Re-export address-related types for convenience
export type {
  AddressApiResponse,
  AddressCreateRequest,
  AddressesApiResponse,
  AddressUpdateRequest,
  CustomerAddress,
} from "./address";

/**
 * Profile API Response Types
 * Shared types for consistent API responses across frontend and backend
 */

// Base API response structure
export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
  timestamp?: string;
  requestId?: string;
}

// User Profile Types
export interface BasicProfile {
  id: string;
  name: string | null;
  email: string;
  phone: string | null;
  image: string | null;
  role: string;
  preferences: Record<string, unknown>;
  birthday: string | null;
  gender: string | null;
  contactPreference: string | null;
}

export interface ExtendedProfile extends BasicProfile {
  customerProfile?: {
    customerNumber: string;
    birthday: string | null;
    gender: string | null;
    totalSpent: number | null;
    orderCount: number | null;
    avgOrderValue: number | null;
    segment: string | null;
    lifetimeValue: number | null;
    churnRisk: string | null;
    lastContactAt: Date | null;
    contactPreference: string | null;
    notes: string | null;
    source: string | null;
  };
}

export interface ProfileAnalytics {
  totalSpent: number;
  orderCount: number;
  avgOrderValue: number;
  lastOrderAt?: Date;
  lastPurchaseAt?: Date;
  firstPurchaseAt?: Date;
}

// Address Types
export interface CustomerAddress {
  id: string;
  userId: string;
  type: 'shipping' | 'billing' | 'both';
  label?: string | null;
  isDefault: boolean;
  recipientName: string;
  recipientPhone: string;
  city: string;
  district: string;
  postalCode: string;
  street: string;
  building?: string | null;
  floor?: string | null;
  room?: string | null;
  deliveryInstructions?: string | null;
  accessCode?: string | null;
  lastUsedAt?: Date | null;
  usageCount: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// Profile Update Request Types
export interface ProfileUpdateRequest {
  name?: string;
  phone?: string;
  birthday?: string;
  gender?: 'male' | 'female' | 'other';
  contactPreference?: 'email' | 'phone' | 'sms';
  notes?: string;
  preferences?: Record<string, unknown>;
}

export interface AddressCreateRequest {
  type: 'shipping' | 'billing' | 'both';
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
}

export interface AddressUpdateRequest extends Partial<AddressCreateRequest> {}

// API Response Types
export type ProfileApiResponse = ApiResponse<BasicProfile>;
export type FullProfileApiResponse = ApiResponse<ExtendedProfile>;
export type AnalyticsApiResponse = ApiResponse<ProfileAnalytics>;
export type AddressesApiResponse = ApiResponse<CustomerAddress[]>;
export type AddressApiResponse = ApiResponse<CustomerAddress>;

// Error Types
export interface ProfileError {
  code: string;
  message: string;
  field?: string;
  details?: Record<string, unknown>;
}

export interface ProfileValidationError extends ProfileError {
  code: 'VALIDATION_ERROR';
  field: string;
}

export interface ProfileNotFoundError extends ProfileError {
  code: 'PROFILE_NOT_FOUND';
}

export interface ProfileUnauthorizedError extends ProfileError {
  code: 'UNAUTHORIZED';
}

// Cache Types
export interface CacheMetadata {
  etag: string;
  lastModified: string;
  maxAge: number;
}
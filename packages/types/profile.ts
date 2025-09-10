import type { User, UserProfile, CustomerProfile } from './user';
import type { Address } from './address';

export interface FullUserProfile {
    user: User;
    userProfile: UserProfile;
    customerProfile: CustomerProfile;
    addresses: Address[];
}

export interface ProfileAnalytics {
  totalSpent: number;
  orderCount: number;
  avgOrderValue: number;
  lastOrderAt?: Date;
  lastPurchaseAt?: Date;
  firstPurchaseAt?: Date;
}

// Profile Update Request Types
export interface ProfileUpdateRequest {
  firstName?: string;
  lastName?: string;
  phone?: string;
  birthday?: string;
  gender?: 'male' | 'female' | 'other';
  contactPreference?: 'email' | 'phone' | 'sms';
  notes?: string;
  preferences?: Record<string, unknown>;
}

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

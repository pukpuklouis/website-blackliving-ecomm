export interface User {
  id: string;
  email: string;
  firstName: string | null;
  lastName: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface UserProfile {
  userId: string;
  avatarUrl?: string;
  bio?: string;
  birthday?: string | null;
  gender?: 'male' | 'female' | 'other' | 'unspecified';
  contactPreference?: 'email' | 'phone' | 'sms';
}

export interface CustomerProfile {
  customerId: string;
  userId: string;
  companyName?: string;
  phone?: string;
}
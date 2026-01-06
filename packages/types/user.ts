export type UserRole = "customer" | "admin";

export type User = {
  id: string;
  email: string;
  firstName: string | null;
  lastName: string | null;
  role: UserRole;
  createdAt: string;
  updatedAt: string;
};

export type UserProfile = {
  userId: string;
  avatarUrl?: string;
  bio?: string;
  birthday?: string | null;
  gender?: "male" | "female" | "other" | "unspecified";
  contactPreference?: "email" | "phone" | "sms";
};

export type CustomerProfile = {
  customerId: string;
  userId: string;
  companyName?: string;
  phone?: string;
};

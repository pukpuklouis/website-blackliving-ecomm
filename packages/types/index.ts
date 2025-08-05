import { z } from 'zod';

// Product Types
export const ProductVariantSchema = z.object({
  size: z.string(),
  firmness: z.string().optional(),
  price: z.number().positive(),
  originalPrice: z.number().positive().optional(),
});

export const ProductSchema = z.object({
  id: z.string(),
  name: z.string(),
  slug: z.string(),
  description: z.string(),
  category: z.enum(['simmons-black', 'accessories', 'us-imports']),
  images: z.array(z.string()),
  variants: z.array(ProductVariantSchema),
  features: z.array(z.string()),
  specifications: z.record(z.string()),
  inStock: z.boolean().default(true),
  featured: z.boolean().default(false),
  seoTitle: z.string().optional(),
  seoDescription: z.string().optional(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export type Product = z.infer<typeof ProductSchema>;
export type ProductVariant = z.infer<typeof ProductVariantSchema>;

// Order Types
export const OrderItemSchema = z.object({
  productId: z.string(),
  productName: z.string(),
  variant: z.string(),
  quantity: z.number().positive(),
  price: z.number().positive(),
});

export const CustomerInfoSchema = z.object({
  name: z.string().min(1),
  email: z.string().email(),
  phone: z.string().min(1),
  address: z.string().min(1),
});

export const OrderSchema = z.object({
  id: z.string(),
  customerInfo: CustomerInfoSchema,
  items: z.array(OrderItemSchema),
  totalAmount: z.number().positive(),
  paymentMethod: z.enum(['bank_transfer']).default('bank_transfer'),
  status: z.enum(['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled']),
  notes: z.string().optional(),
  trackingNumber: z.string().optional(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export type Order = z.infer<typeof OrderSchema>;
export type OrderItem = z.infer<typeof OrderItemSchema>;
export type CustomerInfo = z.infer<typeof CustomerInfoSchema>;

// Appointment Types
export const AppointmentCustomerInfoSchema = z.object({
  name: z.string().min(1),
  phone: z.string().min(1),
  email: z.string().email().optional(),
});

export const AppointmentSchema = z.object({
  id: z.string(),
  customerInfo: AppointmentCustomerInfoSchema,
  storeLocation: z.enum(['中和', '中壢']),
  preferredDate: z.string(),
  preferredTime: z.enum(['上午', '下午', '晚上']),
  confirmedDateTime: z.string().optional(),
  productInterest: z.array(z.string()).optional(),
  status: z.enum(['pending', 'confirmed', 'completed', 'cancelled']),
  notes: z.string().optional(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export type Appointment = z.infer<typeof AppointmentSchema>;
export type AppointmentCustomerInfo = z.infer<typeof AppointmentCustomerInfoSchema>;

// Blog Post Types
export const PostSchema = z.object({
  id: z.string(),
  title: z.string(),
  slug: z.string(),
  description: z.string(),
  content: z.string(),
  authorId: z.string().optional(),
  status: z.enum(['draft', 'published', 'archived']),
  featured: z.boolean().default(false),
  tags: z.array(z.string()),
  featuredImage: z.string().optional(),
  seoTitle: z.string().optional(),
  seoDescription: z.string().optional(),
  publishedAt: z.date().optional(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export type Post = z.infer<typeof PostSchema>;

// User Types
export const UserRoleSchema = z.enum(['customer', 'admin']);

export const UserSchema = z.object({
  id: z.string(),
  name: z.string().optional(),
  email: z.string().email(),
  emailVerified: z.boolean().default(false),
  image: z.string().optional(),
  phone: z.string().optional(),
  role: UserRoleSchema.default('customer'),
  preferences: z.record(z.any()).default({}),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export type User = z.infer<typeof UserSchema>;
export type UserRole = z.infer<typeof UserRoleSchema>;

// API Response Types
export const APIResponseSchema = z.object({
  success: z.boolean(),
  data: z.any().optional(),
  error: z.string().optional(),
  message: z.string().optional(),
});

export type APIResponse<T = any> = {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
};

// Store Information
export const StoreInfoSchema = z.object({
  name: z.string(),
  address: z.string(),
  phone: z.string(),
  hours: z.string(),
});

export type StoreInfo = z.infer<typeof StoreInfoSchema>;

// SEO Types
export const SEODataSchema = z.object({
  title: z.string(),
  description: z.string(),
  image: z.string().optional(),
  url: z.string().optional(),
  type: z.enum(['website', 'article', 'product']).default('website'),
  publishDate: z.date().optional(),
  author: z.string().optional(),
  price: z.string().optional(),
  category: z.string().optional(),
});

export type SEOData = z.infer<typeof SEODataSchema>;

// Cart Types
export const CartItemSchema = z.object({
  id: z.string(),
  productId: z.string(),
  name: z.string(),
  variant: z.string(),
  price: z.number(),
  quantity: z.number().positive(),
  image: z.string(),
});

export type CartItem = z.infer<typeof CartItemSchema>;

// Review/Testimonial Types
export const ReviewSchema = z.object({
  id: z.string(),
  customerName: z.string(),
  productId: z.string().optional(),
  rating: z.number().min(1).max(5),
  content: z.string(),
  source: z.enum(['website', 'shopee', 'google']).default('website'),
  verified: z.boolean().default(false),
  featured: z.boolean().default(false),
  createdAt: z.date(),
});

export type Review = z.infer<typeof ReviewSchema>;

// Export all API types
export * from './api';

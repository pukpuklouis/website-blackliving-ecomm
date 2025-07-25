import { sqliteTable, text, integer, real, blob } from 'drizzle-orm/sqlite-core';
import { createId } from '@paralleldrive/cuid2';

// Users table (Better Auth will manage this)
export const users = sqliteTable('users', {
  id: text('id').primaryKey().$defaultFn(() => createId()),
  name: text('name'),
  email: text('email').notNull().unique(),
  emailVerified: integer('email_verified', { mode: 'boolean' }).default(false),
  image: text('image'),
  phone: text('phone'),
  role: text('role').default('customer'), // customer, admin
  preferences: text('preferences', { mode: 'json' }).default('{}'),
  createdAt: integer('created_at', { mode: 'timestamp' }).$defaultFn(() => new Date()),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).$defaultFn(() => new Date()),
});

// Sessions table (Better Auth will manage this)
export const sessions = sqliteTable('sessions', {
  id: text('id').primaryKey(),
  userId: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  expiresAt: integer('expires_at', { mode: 'timestamp' }).notNull(),
  ipAddress: text('ip_address'),
  userAgent: text('user_agent'),
  createdAt: integer('created_at', { mode: 'timestamp' }).$defaultFn(() => new Date()),
});

// Accounts table (Better Auth will manage this for OAuth)
export const accounts = sqliteTable('accounts', {
  id: text('id').primaryKey().$defaultFn(() => createId()),
  userId: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  provider: text('provider').notNull(),
  providerAccountId: text('provider_account_id').notNull(),
  type: text('type').notNull(),
  accessToken: text('access_token'),
  refreshToken: text('refresh_token'),
  expiresAt: integer('expires_at', { mode: 'timestamp' }),
  tokenType: text('token_type'),
  scope: text('scope'),
  idToken: text('id_token'),
  createdAt: integer('created_at', { mode: 'timestamp' }).$defaultFn(() => new Date()),
});

// Products table
export const products = sqliteTable('products', {
  id: text('id').primaryKey().$defaultFn(() => createId()),
  name: text('name').notNull(),
  slug: text('slug').notNull().unique(),
  description: text('description').notNull(),
  category: text('category').notNull(), // simmons-black, accessories, us-imports
  images: text('images', { mode: 'json' }).notNull().default('[]'),
  variants: text('variants', { mode: 'json' }).notNull().default('[]'),
  features: text('features', { mode: 'json' }).notNull().default('[]'),
  specifications: text('specifications', { mode: 'json' }).notNull().default('{}'),
  inStock: integer('in_stock', { mode: 'boolean' }).default(true),
  featured: integer('featured', { mode: 'boolean' }).default(false),
  sortOrder: integer('sort_order').default(0),
  seoTitle: text('seo_title'),
  seoDescription: text('seo_description'),
  createdAt: integer('created_at', { mode: 'timestamp' }).$defaultFn(() => new Date()),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).$defaultFn(() => new Date()),
});

// Orders table
export const orders = sqliteTable('orders', {
  id: text('id').primaryKey(),
  userId: text('user_id').references(() => users.id),
  customerInfo: text('customer_info', { mode: 'json' }).notNull(),
  items: text('items', { mode: 'json' }).notNull(),
  totalAmount: real('total_amount').notNull(),
  paymentMethod: text('payment_method').default('bank_transfer'),
  status: text('status').default('pending'), // pending, confirmed, processing, shipped, delivered, cancelled
  notes: text('notes').default(''),
  shippingAddress: text('shipping_address', { mode: 'json' }),
  trackingNumber: text('tracking_number'),
  createdAt: integer('created_at', { mode: 'timestamp' }).$defaultFn(() => new Date()),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).$defaultFn(() => new Date()),
});

// Appointments table
export const appointments = sqliteTable('appointments', {
  id: text('id').primaryKey(),
  userId: text('user_id').references(() => users.id),
  customerInfo: text('customer_info', { mode: 'json' }).notNull(),
  storeLocation: text('store_location').notNull(), // 中和, 中壢
  preferredDate: text('preferred_date').notNull(),
  preferredTime: text('preferred_time').notNull(), // 上午, 下午, 晚上
  confirmedDateTime: text('confirmed_datetime'),
  productInterest: text('product_interest', { mode: 'json' }).default('[]'),
  status: text('status').default('pending'), // pending, confirmed, completed, cancelled
  notes: text('notes').default(''),
  createdAt: integer('created_at', { mode: 'timestamp' }).$defaultFn(() => new Date()),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).$defaultFn(() => new Date()),
});

// Blog posts table
export const posts = sqliteTable('posts', {
  id: text('id').primaryKey().$defaultFn(() => createId()),
  title: text('title').notNull(),
  slug: text('slug').notNull().unique(),
  description: text('description').notNull(),
  content: text('content').notNull(),
  authorId: text('author_id').references(() => users.id),
  status: text('status').default('draft'), // draft, published, archived
  featured: integer('featured', { mode: 'boolean' }).default(false),
  tags: text('tags', { mode: 'json' }).default('[]'),
  featuredImage: text('featured_image'),
  seoTitle: text('seo_title'),
  seoDescription: text('seo_description'),
  publishedAt: integer('published_at', { mode: 'timestamp' }),
  createdAt: integer('created_at', { mode: 'timestamp' }).$defaultFn(() => new Date()),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).$defaultFn(() => new Date()),
});

// Reviews/Testimonials table
export const reviews = sqliteTable('reviews', {
  id: text('id').primaryKey().$defaultFn(() => createId()),
  customerName: text('customer_name').notNull(),
  productId: text('product_id').references(() => products.id),
  rating: integer('rating').notNull(),
  content: text('content').notNull(),
  source: text('source').default('website'), // website, shopee, google
  verified: integer('verified', { mode: 'boolean' }).default(false),
  featured: integer('featured', { mode: 'boolean' }).default(false),
  createdAt: integer('created_at', { mode: 'timestamp' }).$defaultFn(() => new Date()),
});

// Newsletter subscriptions
export const newsletters = sqliteTable('newsletters', {
  id: text('id').primaryKey().$defaultFn(() => createId()),
  email: text('email').notNull().unique(),
  status: text('status').default('active'), // active, unsubscribed
  source: text('source').default('website'),
  createdAt: integer('created_at', { mode: 'timestamp' }).$defaultFn(() => new Date()),
});

// Contact form submissions
export const contacts = sqliteTable('contacts', {
  id: text('id').primaryKey().$defaultFn(() => createId()),
  name: text('name').notNull(),
  email: text('email').notNull(),
  phone: text('phone'),
  subject: text('subject').notNull(),
  message: text('message').notNull(),
  status: text('status').default('new'), // new, replied, closed
  createdAt: integer('created_at', { mode: 'timestamp' }).$defaultFn(() => new Date()),
});
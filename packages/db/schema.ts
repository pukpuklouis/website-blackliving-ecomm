import { sqliteTable, text, integer, real, blob } from 'drizzle-orm/sqlite-core';
import { createId } from '@paralleldrive/cuid2';

// Better Auth Tables (using plural naming with usePlural: true)
export const users = sqliteTable('users', {
  id: text('id').primaryKey().$defaultFn(() => createId()),
  name: text('name'),
  email: text('email').notNull().unique(),
  emailVerified: integer('email_verified', { mode: 'boolean' }).default(false),
  image: text('image'),
  createdAt: integer('created_at', { mode: 'timestamp' }).$defaultFn(() => new Date()),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).$defaultFn(() => new Date()),
  // Additional fields for our app (Better Auth supports additionalFields)
  phone: text('phone'),
  role: text('role').default('customer'), // customer, admin
  preferences: text('preferences', { mode: 'json' }).default('{}'),
});

// Better Auth session table - follows Better Auth's recommended schema
// Role is stored in users table, not sessions table per Better Auth design
export const sessions = sqliteTable('sessions', {
  id: text('id').primaryKey(),
  expiresAt: integer('expires_at', { mode: 'timestamp' }).notNull(),
  token: text('token').notNull().unique(),
  createdAt: integer('created_at', { mode: 'timestamp' }).$defaultFn(() => new Date()),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).$defaultFn(() => new Date()),
  ipAddress: text('ip_address'),
  userAgent: text('user_agent'),
  userId: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
});

export const accounts = sqliteTable('accounts', {
  id: text('id').primaryKey().$defaultFn(() => createId()),
  accountId: text('account_id').notNull(),
  providerId: text('provider_id').notNull(),
  userId: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  accessToken: text('access_token'),
  refreshToken: text('refresh_token'),
  idToken: text('id_token'),
  accessTokenExpiresAt: integer('access_token_expires_at', { mode: 'timestamp' }),
  refreshTokenExpiresAt: integer('refresh_token_expires_at', { mode: 'timestamp' }),
  scope: text('scope'),
  password: text('password'),
  createdAt: integer('created_at', { mode: 'timestamp' }).$defaultFn(() => new Date()),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).$defaultFn(() => new Date()),
});

export const verifications = sqliteTable('verifications', {
  id: text('id').primaryKey().$defaultFn(() => createId()),
  identifier: text('identifier').notNull(),
  value: text('value').notNull(),
  expiresAt: integer('expires_at', { mode: 'timestamp' }).notNull(),
  createdAt: integer('created_at', { mode: 'timestamp' }).$defaultFn(() => new Date()),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).$defaultFn(() => new Date()),
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

// Orders table - Taiwan e-commerce order management
export const orders = sqliteTable('orders', {
  id: text('id').primaryKey().$defaultFn(() => createId()),
  orderNumber: text('order_number').notNull().unique(), // 訂單編號 (e.g. BL2024010001)
  userId: text('user_id').references(() => users.id),
  customerInfo: text('customer_info', { mode: 'json' }).notNull(), // { name, email, phone }
  items: text('items', { mode: 'json' }).notNull(), // [{ productId, variantId, quantity, price, name }]
  subtotalAmount: real('subtotal_amount').notNull(), // 小計
  shippingFee: real('shipping_fee').default(0), // 運費
  totalAmount: real('total_amount').notNull(), // 總金額
  paymentMethod: text('payment_method').default('bank_transfer'), // bank_transfer, credit_card, cash_on_delivery
  status: text('status').default('pending_payment'), // 待付款, 已付款, 配送中, 已完成, 已取消
  paymentStatus: text('payment_status').default('unpaid'), // unpaid, paid, refunded
  paymentProof: text('payment_proof'), // 匯款證明圖片 URL
  paymentVerifiedAt: integer('payment_verified_at', { mode: 'timestamp' }), // 付款確認時間
  paymentVerifiedBy: text('payment_verified_by'), // 確認付款的管理員
  notes: text('notes').default(''), // 訂單備註
  adminNotes: text('admin_notes').default(''), // 管理員備註
  shippingAddress: text('shipping_address', { mode: 'json' }), // 配送地址
  trackingNumber: text('tracking_number'), // 物流追蹤號碼
  shippingCompany: text('shipping_company'), // 物流公司
  shippedAt: integer('shipped_at', { mode: 'timestamp' }), // 出貨時間
  deliveredAt: integer('delivered_at', { mode: 'timestamp' }), // 送達時間
  createdAt: integer('created_at', { mode: 'timestamp' }).$defaultFn(() => new Date()),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).$defaultFn(() => new Date()),
});

// Appointments table - 預約試躺管理
export const appointments = sqliteTable('appointments', {
  id: text('id').primaryKey().$defaultFn(() => createId()),
  appointmentNumber: text('appointment_number').notNull().unique(), // 預約編號 (e.g. AP2024010001)
  userId: text('user_id').references(() => users.id),
  customerInfo: text('customer_info', { mode: 'json' }).notNull(), // { name, phone, email }
  storeLocation: text('store_location').notNull(), // 中和店, 中壢店
  preferredDate: text('preferred_date').notNull(), // YYYY-MM-DD
  preferredTime: text('preferred_time').notNull(), // 上午(09:00-12:00), 下午(13:00-17:00), 晚上(18:00-21:00)
  confirmedDateTime: integer('confirmed_datetime', { mode: 'timestamp' }), // 確認的具體時間
  productInterest: text('product_interest', { mode: 'json' }).default('[]'), // 感興趣的產品
  visitPurpose: text('visit_purpose').default('試躺體驗'), // 試躺體驗, 產品諮詢, 價格洽談
  status: text('status').default('pending'), // pending(待確認), confirmed(已確認), completed(已完成), cancelled(已取消), no_show(未到場)
  notes: text('notes').default(''), // 客戶備註
  adminNotes: text('admin_notes').default(''), // 管理員備註
  staffAssigned: text('staff_assigned'), // 指派的服務人員
  actualVisitTime: integer('actual_visit_time', { mode: 'timestamp' }), // 實際到店時間
  completedAt: integer('completed_at', { mode: 'timestamp' }), // 完成時間
  followUpRequired: integer('follow_up_required', { mode: 'boolean' }).default(false), // 是否需要後續追蹤
  followUpNotes: text('follow_up_notes').default(''), // 後續追蹤備註
  createdAt: integer('created_at', { mode: 'timestamp' }).$defaultFn(() => new Date()),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).$defaultFn(() => new Date()),
});

// Blog posts table - Enhanced for comprehensive content management
export const posts = sqliteTable('posts', {
  id: text('id').primaryKey().$defaultFn(() => createId()),
  title: text('title').notNull(),
  slug: text('slug').notNull().unique(),
  description: text('description').notNull(),
  content: text('content').notNull(),
  excerpt: text('excerpt'), // Short summary for listing pages
  authorId: text('author_id').references(() => users.id),
  authorName: text('author_name'), // Cached author name for performance
  status: text('status').default('draft'), // draft, published, scheduled, archived
  featured: integer('featured', { mode: 'boolean' }).default(false),
  category: text('category').default('睡眠知識'), // 睡眠知識, 產品介紹, 健康生活, 門市活動
  tags: text('tags', { mode: 'json' }).default('[]'),
  featuredImage: text('featured_image'),
  // SEO Fields
  seoTitle: text('seo_title'),
  seoDescription: text('seo_description'),
  seoKeywords: text('seo_keywords', { mode: 'json' }).default('[]'), // Array of keywords
  canonicalUrl: text('canonical_url'), // For duplicate content prevention
  // Social Media
  ogTitle: text('og_title'), // Open Graph title
  ogDescription: text('og_description'), // Open Graph description
  ogImage: text('og_image'), // Open Graph image
  // Publishing
  publishedAt: integer('published_at', { mode: 'timestamp' }),
  scheduledAt: integer('scheduled_at', { mode: 'timestamp' }), // For scheduled posts
  // Analytics
  viewCount: integer('view_count').default(0),
  readingTime: integer('reading_time').default(5), // Estimated reading time in minutes
  // Settings
  allowComments: integer('allow_comments', { mode: 'boolean' }).default(true),
  sortOrder: integer('sort_order').default(0), // For manual ordering
  // Metadata
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

// Customer Profiles - Enhanced customer management
export const customerProfiles = sqliteTable('customer_profiles', {
  id: text('id').primaryKey().$defaultFn(() => createId()),
  userId: text('user_id').references(() => users.id),
  customerNumber: text('customer_number').notNull().unique(), // CU2024010001
  // Personal Information
  name: text('name').notNull(),
  email: text('email').notNull(),
  phone: text('phone').notNull(),
  birthday: text('birthday'), // YYYY-MM-DD
  gender: text('gender'), // male, female, other
  // Address Information
  address: text('address', { mode: 'json' }), // { city, district, street, postalCode }
  shippingAddresses: text('shipping_addresses', { mode: 'json' }).default('[]'), // Multiple addresses
  // Purchase Behavior
  totalSpent: real('total_spent').default(0), // 總消費金額
  orderCount: integer('order_count').default(0), // 訂單數量
  avgOrderValue: real('avg_order_value').default(0), // 平均客單價
  lastOrderAt: integer('last_order_at', { mode: 'timestamp' }), // 最後訂單時間
  lastPurchaseAt: integer('last_purchase_at', { mode: 'timestamp' }), // 最後購買時間
  firstPurchaseAt: integer('first_purchase_at', { mode: 'timestamp' }), // 首次購買時間
  // Product Preferences
  favoriteCategories: text('favorite_categories', { mode: 'json' }).default('[]'), // 偏好產品分類
  purchaseHistory: text('purchase_history', { mode: 'json' }).default('[]'), // 購買歷史摘要
  // Customer Segmentation
  segment: text('segment').default('new'), // new, regular, vip, inactive
  lifetimeValue: real('lifetime_value').default(0), // 客戶終身價值
  churnRisk: text('churn_risk').default('low'), // low, medium, high
  // Interaction History
  lastContactAt: integer('last_contact_at', { mode: 'timestamp' }), // 最後聯繫時間
  contactPreference: text('contact_preference').default('email'), // email, phone, sms
  notes: text('notes').default(''), // 客戶備註
  // Metadata
  source: text('source').default('website'), // website, referral, social, store
  createdAt: integer('created_at', { mode: 'timestamp' }).$defaultFn(() => new Date()),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).$defaultFn(() => new Date()),
});

// Customer Tags - Flexible tagging system
export const customerTags = sqliteTable('customer_tags', {
  id: text('id').primaryKey().$defaultFn(() => createId()),
  name: text('name').notNull().unique(), // VIP客戶, 潛在客戶, 回購客戶, 高價值客戶
  color: text('color').default('#6B7280'), // Hex color for UI
  description: text('description'),
  category: text('category').default('custom'), // behavioral, demographic, custom
  isSystem: integer('is_system', { mode: 'boolean' }).default(false), // System vs user-created tags
  createdAt: integer('created_at', { mode: 'timestamp' }).$defaultFn(() => new Date()),
});

// Customer Tag Assignments - Many-to-many relationship
export const customerTagAssignments = sqliteTable('customer_tag_assignments', {
  id: text('id').primaryKey().$defaultFn(() => createId()),
  customerProfileId: text('customer_profile_id').references(() => customerProfiles.id, { onDelete: 'cascade' }),
  customerTagId: text('customer_tag_id').references(() => customerTags.id, { onDelete: 'cascade' }),
  assignedBy: text('assigned_by'), // Admin user who assigned the tag
  assignedAt: integer('assigned_at', { mode: 'timestamp' }).$defaultFn(() => new Date()),
});

// Customer Interactions - Track all touchpoints
export const customerInteractions = sqliteTable('customer_interactions', {
  id: text('id').primaryKey().$defaultFn(() => createId()),
  customerProfileId: text('customer_profile_id').references(() => customerProfiles.id, { onDelete: 'cascade' }),
  type: text('type').notNull(), // order, appointment, contact, support, call, email
  title: text('title').notNull(),
  description: text('description'),
  relatedId: text('related_id'), // Reference to order, appointment, etc.
  relatedType: text('related_type'), // orders, appointments, contacts
  performedBy: text('performed_by'), // Staff member or system
  metadata: text('metadata', { mode: 'json' }).default('{}'), // Additional data
  createdAt: integer('created_at', { mode: 'timestamp' }).$defaultFn(() => new Date()),
});
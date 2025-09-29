import { sqliteTable, text, integer, real, blob } from 'drizzle-orm/sqlite-core';
import { createId } from '@paralleldrive/cuid2';

// Better Auth Tables (using plural naming with usePlural: true)
export const users = sqliteTable('users', {
  id: text('id')
    .primaryKey()
    .$defaultFn(() => createId()),
  name: text('name'),
  email: text('email').notNull().unique(),
  emailVerified: integer('email_verified', { mode: 'boolean' }).default(false),
  emailVerifiedAt: integer('email_verified_at', { mode: 'timestamp' }),
  image: text('image'),
  createdAt: integer('created_at', { mode: 'timestamp' }).$defaultFn(() => new Date()),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).$defaultFn(() => new Date()),
  // Additional fields for our app (Better Auth supports additionalFields)
  phone: text('phone'),
  role: text('role').default('customer'), // customer, admin
  preferences: text('preferences', { mode: 'json' }).default('{}'),
});

export const authTokens = sqliteTable('auth_tokens', {
  id: text('id')
    .primaryKey()
    .$defaultFn(() => createId()),
  userId: text('user_id').references(() => users.id, { onDelete: 'cascade' }),
  email: text('email').notNull(),
  tokenHash: text('token_hash').notNull(),
  type: text('type').notNull(),
  context: text('context', { mode: 'json' }).default('{}'),
  expiresAt: integer('expires_at', { mode: 'timestamp' }).notNull(),
  usedAt: integer('used_at', { mode: 'timestamp' }),
  createdAt: integer('created_at', { mode: 'timestamp' }).$defaultFn(() => new Date()),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).$defaultFn(() => new Date()),
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
  userId: text('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
});

export const accounts = sqliteTable('accounts', {
  id: text('id')
    .primaryKey()
    .$defaultFn(() => createId()),
  accountId: text('account_id').notNull(),
  providerId: text('provider_id').notNull(),
  userId: text('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
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
  id: text('id')
    .primaryKey()
    .$defaultFn(() => createId()),
  identifier: text('identifier').notNull(),
  value: text('value').notNull(),
  expiresAt: integer('expires_at', { mode: 'timestamp' }).notNull(),
  createdAt: integer('created_at', { mode: 'timestamp' }).$defaultFn(() => new Date()),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).$defaultFn(() => new Date()),
});

// Products table
export const products = sqliteTable('products', {
  id: text('id')
    .primaryKey()
    .$defaultFn(() => createId()),
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
  id: text('id')
    .primaryKey()
    .$defaultFn(() => createId()),
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
  id: text('id')
    .primaryKey()
    .$defaultFn(() => createId()),
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

export const reservations = sqliteTable('reservations', {
  id: text('id')
    .primaryKey()
    .$defaultFn(() => createId()),
  userId: text('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  reservationData: text('reservation_data', { mode: 'json' }).notNull(),
  status: text('status').default('pending'),
  verificationPending: integer('verification_pending', { mode: 'boolean' }).default(true),
  appointmentId: text('appointment_id').references(() => appointments.id, { onDelete: 'set null' }),
  createdAt: integer('created_at', { mode: 'timestamp' }).$defaultFn(() => new Date()),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).$defaultFn(() => new Date()),
});

// Post Categories table - 文章分類管理
export const postCategories = sqliteTable('post_categories', {
  id: text('id')
    .primaryKey()
    .$defaultFn(() => createId()),
  name: text('name').notNull().unique(), // 分類名稱: 部落格文章, 客戶評價
  slug: text('slug').notNull().unique(), // URL slug: blog-post, client-review
  description: text('description'), // 分類描述
  color: text('color').default('#6B7280'), // 分類顏色 (用於 UI 區分)
  icon: text('icon'), // 分類圖示 (可選)
  isActive: integer('is_active', { mode: 'boolean' }).default(true),
  sortOrder: integer('sort_order').default(0), // 排序順序
  // SEO
  seoTitle: text('seo_title'),
  seoDescription: text('seo_description'),
  // Metadata
  createdAt: integer('created_at', { mode: 'timestamp' }).$defaultFn(() => new Date()),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).$defaultFn(() => new Date()),
});

// Blog posts table - Enhanced for comprehensive content management
export const posts = sqliteTable('posts', {
  id: text('id')
    .primaryKey()
    .$defaultFn(() => createId()),
  title: text('title').notNull(),
  slug: text('slug').notNull().unique(),
  description: text('description').notNull(),
  content: text('content').notNull(),
  excerpt: text('excerpt'), // Short summary for listing pages
  authorId: text('author_id').references(() => users.id),
  authorName: text('author_name'), // Cached author name for performance
  status: text('status').default('draft'), // draft, published, scheduled, archived
  featured: integer('featured', { mode: 'boolean' }).default(false),
  categoryId: text('category_id').references(() => postCategories.id), // 關聯到分類表
  category: text('category').default('部落格文章'), // 兼容性字段，逐步遷移到 categoryId
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
  id: text('id')
    .primaryKey()
    .$defaultFn(() => createId()),
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
  id: text('id')
    .primaryKey()
    .$defaultFn(() => createId()),
  email: text('email').notNull().unique(),
  status: text('status').default('active'), // active, unsubscribed
  source: text('source').default('website'),
  createdAt: integer('created_at', { mode: 'timestamp' }).$defaultFn(() => new Date()),
});

// Contact form submissions
export const contacts = sqliteTable('contacts', {
  id: text('id')
    .primaryKey()
    .$defaultFn(() => createId()),
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
  id: text('id')
    .primaryKey()
    .$defaultFn(() => createId()),
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
  id: text('id')
    .primaryKey()
    .$defaultFn(() => createId()),
  name: text('name').notNull().unique(), // VIP客戶, 潛在客戶, 回購客戶, 高價值客戶
  color: text('color').default('#6B7280'), // Hex color for UI
  description: text('description'),
  category: text('category').default('custom'), // behavioral, demographic, custom
  isSystem: integer('is_system', { mode: 'boolean' }).default(false), // System vs user-created tags
  createdAt: integer('created_at', { mode: 'timestamp' }).$defaultFn(() => new Date()),
});

// Customer Tag Assignments - Many-to-many relationship
export const customerTagAssignments = sqliteTable('customer_tag_assignments', {
  id: text('id')
    .primaryKey()
    .$defaultFn(() => createId()),
  customerProfileId: text('customer_profile_id').references(() => customerProfiles.id, {
    onDelete: 'cascade',
  }),
  customerTagId: text('customer_tag_id').references(() => customerTags.id, { onDelete: 'cascade' }),
  assignedBy: text('assigned_by'), // Admin user who assigned the tag
  assignedAt: integer('assigned_at', { mode: 'timestamp' }).$defaultFn(() => new Date()),
});

// Customer Interactions - Track all touchpoints
export const customerInteractions = sqliteTable('customer_interactions', {
  id: text('id')
    .primaryKey()
    .$defaultFn(() => createId()),
  customerProfileId: text('customer_profile_id').references(() => customerProfiles.id, {
    onDelete: 'cascade',
  }),
  type: text('type').notNull(), // order, appointment, contact, support, call, email
  title: text('title').notNull(),
  description: text('description'),
  relatedId: text('related_id'), // Reference to order, appointment, etc.
  relatedType: text('related_type'), // orders, appointments, contacts
  performedBy: text('performed_by'), // Staff member or system
  metadata: text('metadata', { mode: 'json' }).default('{}'), // Additional data
  createdAt: integer('created_at', { mode: 'timestamp' }).$defaultFn(() => new Date()),
});

// Customer Addresses - Critical: Address management system
export const customerAddresses = sqliteTable('customer_addresses', {
  id: text('id')
    .primaryKey()
    .$defaultFn(() => createId()),
  userId: text('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  type: text('type').notNull(), // shipping, billing, both
  label: text('label'), // 家裡, 公司, 其他
  isDefault: integer('is_default', { mode: 'boolean' }).default(false),

  // Address Details
  recipientName: text('recipient_name').notNull(), // 收件人姓名
  recipientPhone: text('recipient_phone').notNull(), // 收件人電話

  // Taiwan Address Format
  city: text('city').notNull(), // 縣市 (台北市, 新北市, 桃園市...)
  district: text('district').notNull(), // 區域 (中正區, 信義區...)
  postalCode: text('postal_code').notNull(), // 郵遞區號
  street: text('street').notNull(), // 街道地址
  building: text('building'), // 大樓名稱
  floor: text('floor'), // 樓層
  room: text('room'), // 房號

  // Delivery Instructions
  deliveryInstructions: text('delivery_instructions'), // 配送備註
  accessCode: text('access_code'), // 大樓密碼/門禁代碼

  // Metadata
  lastUsedAt: integer('last_used_at', { mode: 'timestamp' }),
  usageCount: integer('usage_count').default(0), // 使用次數
  isActive: integer('is_active', { mode: 'boolean' }).default(true),
  createdAt: integer('created_at', { mode: 'timestamp' }).$defaultFn(() => new Date()),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).$defaultFn(() => new Date()),
});

// Payment Methods - Critical: Secure payment method storage
export const customerPaymentMethods = sqliteTable('customer_payment_methods', {
  id: text('id')
    .primaryKey()
    .$defaultFn(() => createId()),
  userId: text('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  type: text('type').notNull(), // credit_card, bank_account, digital_wallet
  provider: text('provider'), // visa, mastercard, jcb, line_pay, apple_pay

  // Tokenized Card Information (PCI compliant)
  cardToken: text('card_token'), // Tokenized card number from payment processor
  lastFourDigits: text('last_four_digits'), // Last 4 digits for display
  expiryMonth: text('expiry_month'), // MM
  expiryYear: text('expiry_year'), // YYYY
  cardholderName: text('cardholder_name'),

  // Bank Account Information
  bankName: text('bank_name'), // 銀行名稱
  bankCode: text('bank_code'), // 銀行代碼 (808, 822, etc.)
  accountType: text('account_type'), // checking, savings
  accountLastFour: text('account_last_four'), // 帳號後四碼

  // Digital Wallet
  walletProvider: text('wallet_provider'), // line_pay, apple_pay, google_pay
  walletAccountId: text('wallet_account_id'), // Encrypted wallet account reference

  // Settings
  isDefault: integer('is_default', { mode: 'boolean' }).default(false),
  isActive: integer('is_active', { mode: 'boolean' }).default(true),
  nickname: text('nickname'), // 自訂名稱 "我的信用卡", "公司卡"

  // Security & Compliance
  encryptionKeyId: text('encryption_key_id'), // Reference to encryption key
  lastUsedAt: integer('last_used_at', { mode: 'timestamp' }),
  usageCount: integer('usage_count').default(0),

  // Metadata
  createdAt: integer('created_at', { mode: 'timestamp' }).$defaultFn(() => new Date()),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).$defaultFn(() => new Date()),
});

// User Security - High Priority: Password & security management
export const userSecurity = sqliteTable('user_security', {
  id: text('id')
    .primaryKey()
    .$defaultFn(() => createId()),
  userId: text('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),

  // Password Management
  passwordHash: text('password_hash'), // Bcrypt hash
  passwordSalt: text('password_salt'),
  passwordLastChanged: integer('password_last_changed', { mode: 'timestamp' }),
  forcePasswordChange: integer('force_password_change', { mode: 'boolean' }).default(false),

  // Login Tracking
  lastLoginAt: integer('last_login_at', { mode: 'timestamp' }),
  lastLoginIp: text('last_login_ip'),
  lastLoginUserAgent: text('last_login_user_agent'),
  loginCount: integer('login_count').default(0),

  // Security Settings
  twoFactorEnabled: integer('two_factor_enabled', { mode: 'boolean' }).default(false),
  twoFactorSecret: text('two_factor_secret'), // TOTP secret
  backupCodes: text('backup_codes', { mode: 'json' }).default('[]'),

  // Account Security
  isLocked: integer('is_locked', { mode: 'boolean' }).default(false),
  lockedAt: integer('locked_at', { mode: 'timestamp' }),
  lockedReason: text('locked_reason'),
  failedLoginAttempts: integer('failed_login_attempts').default(0),
  lastFailedLoginAt: integer('last_failed_login_at', { mode: 'timestamp' }),

  // Privacy Settings
  allowDataCollection: integer('allow_data_collection', { mode: 'boolean' }).default(true),
  allowMarketing: integer('allow_marketing', { mode: 'boolean' }).default(true),
  allowSmsMarketing: integer('allow_sms_marketing', { mode: 'boolean' }).default(false),

  // Metadata
  createdAt: integer('created_at', { mode: 'timestamp' }).$defaultFn(() => new Date()),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).$defaultFn(() => new Date()),
});

// Wishlist - Medium Priority: Customer personalization
export const customerWishlists = sqliteTable('customer_wishlists', {
  id: text('id')
    .primaryKey()
    .$defaultFn(() => createId()),
  userId: text('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  productId: text('product_id')
    .notNull()
    .references(() => products.id, { onDelete: 'cascade' }),
  variantId: text('variant_id'), // Specific product variant if applicable

  // Wishlist Details
  notes: text('notes'), // Personal notes about the product
  priority: text('priority').default('medium'), // high, medium, low
  priceAlert: real('price_alert'), // Price threshold for notifications

  // Metadata
  addedAt: integer('added_at', { mode: 'timestamp' }).$defaultFn(() => new Date()),
  lastViewedAt: integer('last_viewed_at', { mode: 'timestamp' }),
  viewCount: integer('view_count').default(1),
});

// Recently Viewed Products - Medium Priority: Personalization
export const customerRecentlyViewed = sqliteTable('customer_recently_viewed', {
  id: text('id')
    .primaryKey()
    .$defaultFn(() => createId()),
  userId: text('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  productId: text('product_id')
    .notNull()
    .references(() => products.id, { onDelete: 'cascade' }),

  // Viewing Details
  viewedAt: integer('viewed_at', { mode: 'timestamp' }).$defaultFn(() => new Date()),
  viewDurationSeconds: integer('view_duration_seconds'), // Time spent viewing
  referrerUrl: text('referrer_url'), // How they found the product
  deviceType: text('device_type'), // mobile, desktop, tablet

  // Metadata for cleanup (keep only recent views)
  createdAt: integer('created_at', { mode: 'timestamp' }).$defaultFn(() => new Date()),
});

// Customer Reviews - Medium Priority: User-generated content
export const customerReviews = sqliteTable('customer_reviews', {
  id: text('id')
    .primaryKey()
    .$defaultFn(() => createId()),
  userId: text('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  productId: text('product_id')
    .notNull()
    .references(() => products.id, { onDelete: 'cascade' }),
  orderId: text('order_id').references(() => orders.id), // Link to purchase

  // Review Content
  rating: integer('rating').notNull(), // 1-5 stars
  title: text('title').notNull(),
  content: text('content').notNull(),
  pros: text('pros', { mode: 'json' }).default('[]'), // Array of positive points
  cons: text('cons', { mode: 'json' }).default('[]'), // Array of negative points

  // Review Images
  images: text('images', { mode: 'json' }).default('[]'), // User-uploaded photos

  // Moderation
  status: text('status').default('pending'), // pending, approved, rejected, flagged
  moderatedBy: text('moderated_by'), // Admin who moderated
  moderatedAt: integer('moderated_at', { mode: 'timestamp' }),
  moderationNotes: text('moderation_notes'),

  // Helpfulness
  helpfulCount: integer('helpful_count').default(0),
  totalVotes: integer('total_votes').default(0),

  // Purchase Verification
  verified: integer('verified', { mode: 'boolean' }).default(false), // Verified purchase
  purchaseDate: integer('purchase_date', { mode: 'timestamp' }),

  // Display Settings
  featured: integer('featured', { mode: 'boolean' }).default(false),
  displayName: text('display_name'), // How reviewer name appears
  showFullName: integer('show_full_name', { mode: 'boolean' }).default(false),

  // Metadata
  createdAt: integer('created_at', { mode: 'timestamp' }).$defaultFn(() => new Date()),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).$defaultFn(() => new Date()),
});

// Notification Preferences - Medium Priority: Communication management
export const customerNotificationPreferences = sqliteTable('customer_notification_preferences', {
  id: text('id')
    .primaryKey()
    .$defaultFn(() => createId()),
  userId: text('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),

  // Email Notifications
  emailOrderUpdates: integer('email_order_updates', { mode: 'boolean' }).default(true),
  emailAppointmentReminders: integer('email_appointment_reminders', { mode: 'boolean' }).default(
    true
  ),
  emailNewsletters: integer('email_newsletters', { mode: 'boolean' }).default(true),
  emailPromotions: integer('email_promotions', { mode: 'boolean' }).default(true),
  emailPriceAlerts: integer('email_price_alerts', { mode: 'boolean' }).default(true),
  emailProductRecommendations: integer('email_product_recommendations', {
    mode: 'boolean',
  }).default(false),

  // SMS Notifications
  smsOrderUpdates: integer('sms_order_updates', { mode: 'boolean' }).default(false),
  smsAppointmentReminders: integer('sms_appointment_reminders', { mode: 'boolean' }).default(true),
  smsPromotions: integer('sms_promotions', { mode: 'boolean' }).default(false),
  smsDeliveryUpdates: integer('sms_delivery_updates', { mode: 'boolean' }).default(true),

  // Push Notifications (for future mobile app)
  pushOrderUpdates: integer('push_order_updates', { mode: 'boolean' }).default(true),
  pushAppointmentReminders: integer('push_appointment_reminders', { mode: 'boolean' }).default(
    true
  ),
  pushPromotions: integer('push_promotions', { mode: 'boolean' }).default(false),

  // Communication Frequency
  emailFrequency: text('email_frequency').default('immediate'), // immediate, daily, weekly
  smsFrequency: text('sms_frequency').default('important_only'), // immediate, important_only, never

  // Metadata
  createdAt: integer('created_at', { mode: 'timestamp' }).$defaultFn(() => new Date()),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).$defaultFn(() => new Date()),
});

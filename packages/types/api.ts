// API Response types
export interface ApiError {
  code: string;
  message: string;
  details?: any;
}

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

// Cache-related types
export interface CacheOptions {
  ttl?: number; // Time to live in seconds
  key: string;
  tags?: string[];
}

// File upload types
export interface UploadedFile {
  key: string;
  url: string;
  size: number;
  contentType: string;
  originalName: string;
}

// Admin API request types
export interface CreateProductRequest {
  name: string;
  slug: string;
  description: string;
  category: string;
  productType?: string;
  images: UploadedFile[];
  variants: ProductVariant[];
  features: string[];
  featuresMarkdown?: string;
  accessoryType?: "standalone" | "accessory" | "bundle";
  parentProductId?: string;
  specifications: Record<string, any>;
  inStock: boolean;
  featured: boolean;
  sortOrder: number;
  seoTitle?: string;
  seoDescription?: string;
}

export interface UpdateProductRequest extends Partial<CreateProductRequest> {
  id: string;
}

export interface ProductCategoryInput {
  slug: string;
  title: string;
  description: string;
  series: string;
  brand: string;
  features: string[];
  seoKeywords?: string;
  urlPath: string;
  isActive: boolean;
  sortOrder: number;
}

export interface ProductCategory extends ProductCategoryInput {
  id: string;
  createdAt: string;
  updatedAt: string;
  stats?: {
    productCount: number;
    inStockCount: number;
  };
}

export interface ProductVariant {
  id: string;
  name: string;
  sku: string;
  price: number;
  originalPrice?: number;
  size?: string;
  firmness?: string;
  inStock: boolean;
  sortOrder: number;
}

export interface CreatePostRequest {
  title: string;
  slug: string;
  description: string;
  content: string;
  status: "draft" | "published" | "archived";
  featured: boolean;
  tags: string[];
  featuredImage?: UploadedFile;
  seoTitle?: string;
  seoDescription?: string;
  publishedAt?: string;
  sortOrder?: number;
}

export interface UpdatePostRequest extends Partial<CreatePostRequest> {
  id: string;
}

export interface UpdateOrderRequest {
  id: string;
  status?:
    | "pending"
    | "confirmed"
    | "processing"
    | "shipped"
    | "delivered"
    | "cancelled";
  notes?: string;
  trackingNumber?: string;
}

export interface UpdateAppointmentRequest {
  id: string;
  status?: "pending" | "confirmed" | "completed" | "cancelled";
  confirmedDateTime?: string;
  notes?: string;
}

// Filters and queries
export interface ProductFilters {
  category?: string;
  featured?: boolean;
  inStock?: boolean;
  search?: string;
}

export interface OrderFilters {
  status?: string;
  userId?: string;
  dateFrom?: string;
  dateTo?: string;
}

export interface AppointmentFilters {
  status?: string;
  storeLocation?: string;
  dateFrom?: string;
  dateTo?: string;
}

export interface PostFilters {
  status?: string;
  featured?: boolean;
  authorId?: string;
  search?: string;
}

// Analytics types
export interface DashboardStats {
  totalOrders: number;
  totalRevenue: number;
  pendingAppointments: number;
  publishedPosts: number;
  recentOrders: Array<{
    id: string;
    customerInfo: any;
    totalAmount: number;
    status: string;
    createdAt: string;
  }>;
  recentAppointments: Array<{
    id: string;
    customerInfo: any;
    storeLocation: string;
    preferredDate: string;
    status: string;
    createdAt: string;
  }>;
}

export interface SalesAnalytics {
  totalSales: number;
  ordersCount: number;
  averageOrderValue: number;
  salesByCategory: Record<string, number>;
  salesByMonth: Array<{
    month: string;
    sales: number;
    orders: number;
  }>;
  topProducts: Array<{
    productId: string;
    productName: string;
    sales: number;
    orders: number;
  }>;
  salesGrowth?: number | null;
  ordersGrowth?: number | null;
}

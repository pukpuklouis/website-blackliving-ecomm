# Black Living E-commerce API Documentation

This document provides comprehensive documentation for the Black Living (黑哥家居) e-commerce API backend built with Hono on Cloudflare Workers.

## Table of Contents

- [Overview](#overview)
- [Base URL](#base-url)
- [Authentication](#authentication)
- [Response Format](#response-format)
- [Error Handling](#error-handling)
- [Rate Limiting](#rate-limiting)
- [Caching](#caching)
- [File Upload](#file-upload)
- [Public API Endpoints](#public-api-endpoints)
- [Admin API Endpoints](#admin-api-endpoints)
- [Cloudflare Integration](#cloudflare-integration)
- [Usage Examples](#usage-examples)

## Overview

The Black Living API is a RESTful API built on Cloudflare Workers using the Hono framework. It provides endpoints for managing products, orders, appointments, and blog posts for a premium Simmons mattress e-commerce platform.

### Architecture

- **Framework**: Hono v4.8.9 on Cloudflare Workers
- **Database**: Cloudflare D1 (SQLite) with Drizzle ORM
- **Storage**: Cloudflare R2 for file uploads
- **Cache**: Cloudflare KV for response caching
- **Authentication**: Better Auth integration
- **Validation**: Zod schemas for request/response validation

### Core Features

- Product catalog management
- Order processing and tracking
- Appointment booking system
- Blog/CMS functionality
- File upload to R2 storage
- Admin dashboard analytics
- Multi-location store support (中和/中壢)

## Base URL

```
Production: https://api.blackliving.com
Development: http://localhost:8787
```

## Authentication

The API uses Better Auth for authentication with support for:

- Google OAuth integration
- Session-based authentication
- Role-based access control (customer/admin)

### Authentication Endpoints

All authentication is handled through Better Auth:

```
POST /api/auth/sign-in
POST /api/auth/sign-up
POST /api/auth/sign-out
GET  /api/auth/session
```

### Admin Routes Protection

Admin routes require authentication and admin role:

```javascript
// Example admin middleware usage
admin.use('*', requireAdmin());
```

### CORS Configuration

The API supports CORS for the following origins:

- `http://localhost:4321` (Astro dev)
- `http://localhost:5173` (Admin dev)
- `https://blackliving.com` (Production web)
- `https://admin.blackliving.com` (Production admin)

## Response Format

All API responses follow a consistent format:

### Success Response

```json
{
  "success": true,
  "data": {
    // Response data
  },
  "message": "Optional success message"
}
```

### Error Response

```json
{
  "success": false,
  "error": "Error message",
  "message": "Additional context (optional)"
}
```

### Paginated Response

```json
{
  "success": true,
  "data": [
    // Array of items
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 150,
    "totalPages": 8
  }
}
```

## Error Handling

### HTTP Status Codes

- `200` - Success
- `201` - Created
- `400` - Bad Request (validation errors)
- `401` - Unauthorized
- `403` - Forbidden (admin access required)
- `404` - Not Found
- `500` - Internal Server Error

### Common Error Types

```json
{
  "success": false,
  "error": "Validation failed",
  "details": {
    "field": "name",
    "message": "Name is required"
  }
}
```

## Rate Limiting

Currently no rate limiting is implemented, but recommended for production:

- Public endpoints: 100 requests/minute per IP
- Admin endpoints: 200 requests/minute per user
- File upload: 10 uploads/minute per user

## Caching

The API uses Cloudflare KV for intelligent caching with TTL values:

### Cache TTLs

```javascript
const CacheTTL = {
  SHORT: 300, // 5 minutes
  MEDIUM: 1800, // 30 minutes
  LONG: 3600, // 1 hour
  VERY_LONG: 86400, // 24 hours
};
```

### Cache Keys

```javascript
// Products
products:list:${category}:${featured}
products:detail:${id}
products:search:${query}

// Orders
orders:list:${filters}
orders:detail:${id}

// Posts
posts:list:${status}
posts:detail:${id}

// Admin dashboard
admin:dashboard:stats
admin:products:${page}:${limit}:${filters}
```

### Cache Invalidation

Cache is automatically invalidated when:

- Products are created/updated/deleted
- Posts are published/updated
- Orders status changes
- Admin performs bulk operations

## File Upload

Files are uploaded to Cloudflare R2 storage with validation and optimization.

### Supported File Types

```javascript
const FileTypes = {
  IMAGES: ['image/jpeg', 'image/png', 'image/webp', 'image/gif'],
  DOCUMENTS: ['application/pdf', 'text/plain', 'application/msword'],
};
```

### File Size Limits

```javascript
const FileSizes = {
  SMALL: 1MB,    // Profile images
  MEDIUM: 5MB,   // Product images
  LARGE: 10MB,   // Document uploads
  XLARGE: 50MB   // Video/large files
}
```

### File URL Format

Uploaded files are accessible via CDN:

```
https://images.blackliving.com/media/uploads/1640995200000-product-image-abc123.jpg
```

### Media delivery worker

- **Read endpoint**: `GET https://images.blackliving.com/media/:key`
- **Caching**: Responses include `Cache-Control: public, max-age=31536000, immutable` and are cached at Cloudflare edge. Regenerate keys or purge the cache after replacements.
- **Range requests**: Byte-range requests are supported for streaming (audio/video) workloads.
- **Protected assets**: Keys starting with `private/` are blocked unless a signed URL flow is implemented.
- **Staging domain**: Until the staging worker host is ready, assets are served from Cloudflare’s generated R2 endpoint `https://pub-bdf23ffacc974ac28ddec02806cf30cb.r2.dev`.

---

## Public API Endpoints

### Health Check

Check API status and version.

**GET** `/`

**Response:**

```json
{
  "message": "Black Living API is running",
  "timestamp": "2024-01-01T00:00:00.000Z",
  "version": "1.0.0"
}
```

---

### Products

#### List Products

Retrieve products with optional filtering.

**GET** `/api/products`

**Query Parameters:**

- `category` (optional): `simmons-black`, `accessories`, `us-imports`
- `featured` (optional): `true`, `false`
- `inStock` (optional): `true`, `false`

**Example Request:**

```bash
GET /api/products?category=simmons-black&featured=true
```

**Response:**

```json
{
  "success": true,
  "data": [
    {
      "id": "prod_123",
      "name": "Simmons Black Label S3 頂級獨立筒床墊",
      "slug": "simmons-s3-premium",
      "description": "美國原裝進口，頂級獨立筒設計...",
      "category": "simmons-black",
      "images": ["https://images.blackliving.com/media/products/s3-1.jpg"],
      "variants": [
        {
          "size": "雙人加大6尺",
          "firmness": "軟硬適中",
          "price": 58000,
          "originalPrice": 120000
        }
      ],
      "features": ["美國原裝進口", "1200顆獨立筒彈簧", "天然乳膠層"],
      "specifications": {
        "thickness": "32cm",
        "material": "天然乳膠+獨立筒",
        "warranty": "10年保固"
      },
      "inStock": true,
      "featured": true,
      "createdAt": "2024-01-01T00:00:00.000Z",
      "updatedAt": "2024-01-01T00:00:00.000Z"
    }
  ],
  "total": 1
}
```

#### Get Single Product

**GET** `/api/products/{id}`

**Response:**

```json
{
  "success": true,
  "data": {
    "id": "prod_123",
    "name": "Simmons Black Label S3"
    // ... full product details
  }
}
```

---

### Orders

#### Create Order

Create a new order for bank transfer payment.

**POST** `/api/orders`

**Request Body:**

```json
{
  "customerInfo": {
    "name": "王小明",
    "email": "customer@example.com",
    "phone": "0912-345-678",
    "address": "台北市信義區信義路123號"
  },
  "items": [
    {
      "productId": "prod_123",
      "productName": "Simmons Black Label S3",
      "variant": "雙人加大6尺 軟硬適中",
      "quantity": 1,
      "price": 58000
    }
  ],
  "totalAmount": 58000,
  "paymentMethod": "bank_transfer",
  "notes": "請在平日上午配送"
}
```

**Response:**

```json
{
  "success": true,
  "data": {
    "id": "BL1640995200000ABC1",
    "status": "pending",
    "message": "訂單已建立成功，我們將盡快與您聯繫確認付款資訊"
  }
}
```

#### Get Order

**GET** `/api/orders/{id}`

**Response:**

```json
{
  "success": true,
  "data": {
    "id": "BL1640995200000ABC1",
    "customerInfo": {
      "name": "王小明",
      "email": "customer@example.com",
      "phone": "0912-345-678",
      "address": "台北市信義區信義路123號"
    },
    "items": [...],
    "totalAmount": 58000,
    "status": "pending",
    "paymentMethod": "bank_transfer",
    "notes": "請在平日上午配送",
    "createdAt": "2024-01-01T00:00:00.000Z",
    "updatedAt": "2024-01-01T00:00:00.000Z"
  }
}
```

#### Get Customer Orders

**GET** `/api/orders/customer/{email}`

**Response:**

```json
{
  "success": true,
  "data": [
    {
      "id": "BL1640995200000ABC1",
      "status": "delivered",
      "totalAmount": 58000,
      "createdAt": "2024-01-01T00:00:00.000Z"
    }
  ]
}
```

---

### Appointments

#### Create Appointment

Book a showroom visit appointment.

**POST** `/api/appointments`

**Request Body:**

```json
{
  "customerInfo": {
    "name": "王小明",
    "phone": "0912-345-678",
    "email": "customer@example.com"
  },
  "storeLocation": "中和",
  "preferredDate": "2024-01-15",
  "preferredTime": "下午",
  "productInterest": ["Simmons S3", "電動床架"],
  "notes": "想了解不同軟硬度的差異"
}
```

**Response:**

```json
{
  "success": true,
  "data": {
    "id": "APT1640995200000XYZ1",
    "status": "pending",
    "message": "預約已送出，我們將在24小時內與您聯繫確認時間",
    "storeInfo": {
      "name": "Black Living 中和門市",
      "address": "新北市中和區中正路123號",
      "phone": "02-1234-5678",
      "hours": "週一至週日 10:00-21:00"
    }
  }
}
```

#### Check Availability

Check appointment availability for specific date and store.

**GET** `/api/appointments/availability/{store}/{date}`

**Example:**

```bash
GET /api/appointments/availability/中和/2024-01-15
```

**Response:**

```json
{
  "success": true,
  "data": {
    "date": "2024-01-15",
    "store": "中和",
    "availability": {
      "上午": 3,
      "下午": 5,
      "晚上": 2
    }
  }
}
```

#### Get Customer Appointments

**GET** `/api/appointments/customer/{phone}`

**Response:**

```json
{
  "success": true,
  "data": [
    {
      "id": "APT1640995200000XYZ1",
      "storeLocation": "中和",
      "preferredDate": "2024-01-15",
      "status": "confirmed",
      "confirmedDateTime": "2024-01-15T14:00:00.000Z"
    }
  ]
}
```

---

## Admin API Endpoints

All admin endpoints require authentication and admin role.

### Dashboard Analytics

#### Get Dashboard Stats

**GET** `/api/admin/dashboard/stats`

**Response:**

```json
{
  "success": true,
  "data": {
    "totalOrders": 150,
    "totalRevenue": 8750000,
    "pendingAppointments": 12,
    "publishedPosts": 25,
    "recentOrders": [
      {
        "id": "BL1640995200000ABC1",
        "customerInfo": { "name": "王小明" },
        "totalAmount": 58000,
        "status": "pending",
        "createdAt": "2024-01-01T00:00:00.000Z"
      }
    ],
    "recentAppointments": [
      {
        "id": "APT1640995200000XYZ1",
        "customerInfo": { "name": "李小華" },
        "storeLocation": "中和",
        "preferredDate": "2024-01-15",
        "status": "pending",
        "createdAt": "2024-01-01T00:00:00.000Z"
      }
    ]
  }
}
```

---

### Product Management

#### List Products (Admin)

**GET** `/api/admin/products`

**Query Parameters:**

- `page` (default: 1): Page number
- `limit` (default: 20): Items per page
- `category`: Filter by category
- `search`: Search in product names
- `featured`: Filter by featured status

**Response:**

```json
{
  "success": true,
  "data": [
    {
      "id": "prod_123",
      "name": "Simmons Black Label S3",
      "slug": "simmons-s3-premium",
      "category": "simmons-black",
      "inStock": true,
      "featured": true,
      "sortOrder": 1,
      "createdAt": "2024-01-01T00:00:00.000Z",
      "updatedAt": "2024-01-01T00:00:00.000Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 50,
    "totalPages": 3
  }
}
```

#### Create Product

**POST** `/api/admin/products`

**Request Body:**

```json
{
  "name": "Simmons Black Label S4 旗艦款",
  "slug": "simmons-s4-flagship",
  "description": "旗艦級床墊，極致舒適體驗...",
  "category": "simmons-black",
  "images": ["https://images.blackliving.com/media/products/s4-1.jpg"],
  "variants": [
    {
      "size": "標準雙人5尺",
      "firmness": "軟硬適中",
      "price": 68000,
      "originalPrice": 140000
    }
  ],
  "features": ["美國原裝進口", "1400顆獨立筒彈簧", "天然乳膠+記憶泡棉"],
  "specifications": {
    "thickness": "35cm",
    "material": "乳膠+記憶泡棉+獨立筒",
    "warranty": "10年保固"
  },
  "inStock": true,
  "featured": true,
  "sortOrder": 1,
  "seoTitle": "Simmons S4 旗艦款床墊 - 專櫃品質優惠價",
  "seoDescription": "Simmons Black Label S4 旗艦款，1400顆獨立筒..."
}
```

**Response:**

```json
{
  "success": true,
  "data": {
    "id": "prod_456"
    // ... created product data
  }
}
```

#### Update Product

**PUT** `/api/admin/products/{id}`

**Request Body:** (Same as create, but all fields optional)

#### Delete Product

**DELETE** `/api/admin/products/{id}`

**Response:**

```json
{
  "success": true,
  "message": "Product deleted successfully"
}
```

---

### File Upload

#### Upload Files

**POST** `/api/admin/upload`

**Request:** Multipart form data

- `files`: File(s) to upload
- `folder` (optional): Destination folder (default: "uploads")

**Example:**

```bash
curl -X POST /api/admin/upload \
  -H "Authorization: Bearer <token>" \
  -F "files=@product-image.jpg" \
  -F "folder=products"
```

**Response:**

```json
{
  "success": true,
  "data": [
    {
      "key": "products/1640995200000-product-image-abc123.jpg",
      "url": "https://images.blackliving.com/media/products/1640995200000-product-image-abc123.jpg",
      "size": 245760
    }
  ],
  "message": "1 file(s) uploaded successfully"
}
```

**File Validation:**

- Max size: 5MB for images
- Allowed types: JPEG, PNG, WebP, GIF
- Files are automatically renamed with timestamp and random suffix

---

### Blog Management

#### List Posts

**GET** `/api/admin/posts`

**Query Parameters:**

- `page`, `limit`: Pagination
- `status`: `draft`, `published`, `archived`
- `search`: Search in post titles

#### Create Post

**POST** `/api/admin/posts`

**Request Body:**

```json
{
  "title": "如何選擇適合的床墊軟硬度",
  "slug": "how-to-choose-mattress-firmness",
  "description": "詳細介紹不同睡眠習慣所適合的床墊軟硬度...",
  "content": "<p>床墊的軟硬度選擇...</p>",
  "status": "published",
  "featured": true,
  "tags": ["床墊選購", "睡眠健康", "Simmons"],
  "featuredImage": "https://images.blackliving.com/media/posts/mattress-guide.jpg",
  "seoTitle": "床墊軟硬度選擇指南 - Black Living",
  "seoDescription": "專業床墊顧問教你如何選擇...",
  "publishedAt": "2024-01-01T00:00:00.000Z"
}
```

#### Update Post

**PUT** `/api/admin/posts/{id}`

**Request Body:** (Same as create, all fields optional)

#### Delete Post

**DELETE** `/api/admin/posts/{id}`

---

### Order Management

#### List Orders

**GET** `/api/admin/orders`

**Query Parameters:**

- `status`: Filter by order status
- `limit`, `offset`: Pagination

**Response:**

```json
{
  "success": true,
  "data": [
    {
      "id": "BL1640995200000ABC1",
      "customerInfo": {
        "name": "王小明",
        "email": "customer@example.com",
        "phone": "0912-345-678"
      },
      "totalAmount": 58000,
      "status": "pending",
      "createdAt": "2024-01-01T00:00:00.000Z"
    }
  ]
}
```

#### Update Order Status

**PUT** `/api/admin/orders/{id}/status`

**Request Body:**

```json
{
  "status": "confirmed",
  "notes": "已確認付款，準備出貨"
}
```

---

### Appointment Management

#### List Appointments

**GET** `/api/admin/appointments`

**Query Parameters:**

- `status`: Filter by appointment status
- `store`: Filter by store location
- `date`: Filter by specific date
- `limit`, `offset`: Pagination

#### Update Appointment

**PUT** `/api/admin/appointments/{id}`

**Request Body:**

```json
{
  "status": "confirmed",
  "confirmedDateTime": "2024-01-15T14:00:00.000Z",
  "notes": "已確認預約時間，請準時到店"
}
```

---

## Cloudflare Integration

### Environment Variables

The API requires the following Cloudflare Worker environment variables:

```toml
# wrangler.toml
[env.production.vars]
NODE_ENV = "production"
BETTER_AUTH_SECRET = "your-secret-key"
GOOGLE_CLIENT_ID = "your-google-client-id"
GOOGLE_CLIENT_SECRET = "your-google-client-secret"

[[env.production.d1_databases]]
binding = "DB"
database_name = "blackliving-db"
database_id = "your-database-id"

[[env.production.r2_buckets]]
binding = "R2"
bucket_name = "blackliving-images"

[[env.production.kv_namespaces]]
binding = "CACHE"
namespace_id = "your-kv-namespace-id"
```

### Database Schema

The API uses Cloudflare D1 with the following main tables:

- `products` - Product catalog
- `orders` - Customer orders
- `appointments` - Store visit appointments
- `posts` - Blog posts and content
- `users` - User accounts and sessions
- `reviews` - Customer reviews and testimonials

### R2 Storage Structure

```
blackliving-images/
├── products/           # Product images
├── posts/             # Blog post images
├── uploads/           # General uploads
└── users/             # User avatars
```

---

## Usage Examples

### Frontend Integration

#### React/Astro Product Listing

```javascript
async function fetchProducts(category = '') {
  const url = new URL('/api/products', 'https://api.blackliving.com');
  if (category) url.searchParams.set('category', category);

  const response = await fetch(url);
  const data = await response.json();

  if (data.success) {
    return data.data;
  }
  throw new Error(data.error);
}

// Usage
const simmonsProducts = await fetchProducts('simmons-black');
```

#### Order Creation

```javascript
async function createOrder(orderData) {
  const response = await fetch('/api/orders', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(orderData),
  });

  const result = await response.json();

  if (result.success) {
    // Redirect to confirmation page
    window.location.href = `/order-confirmation?id=${result.data.id}`;
  } else {
    // Show error message
    alert(result.error);
  }
}
```

#### Appointment Booking

```javascript
async function bookAppointment(appointmentData) {
  const response = await fetch('/api/appointments', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(appointmentData),
  });

  const result = await response.json();

  if (result.success) {
    return {
      id: result.data.id,
      message: result.data.message,
      storeInfo: result.data.storeInfo,
    };
  }
  throw new Error(result.error);
}
```

### Admin Dashboard Integration

#### Product Management

```javascript
// List products with pagination
async function getProducts(page = 1, filters = {}) {
  const url = new URL('/api/admin/products', 'https://api.blackliving.com');
  url.searchParams.set('page', page.toString());

  Object.entries(filters).forEach(([key, value]) => {
    if (value) url.searchParams.set(key, value);
  });

  const response = await fetch(url, {
    headers: {
      Authorization: `Bearer ${getAuthToken()}`,
    },
  });

  return response.json();
}

// Create new product
async function createProduct(productData) {
  const response = await fetch('/api/admin/products', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${getAuthToken()}`,
    },
    body: JSON.stringify(productData),
  });

  return response.json();
}
```

#### File Upload

```javascript
async function uploadProductImages(files) {
  const formData = new FormData();

  files.forEach(file => {
    formData.append('files', file);
  });
  formData.append('folder', 'products');

  const response = await fetch('/api/admin/upload', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${getAuthToken()}`,
    },
    body: formData,
  });

  const result = await response.json();

  if (result.success) {
    return result.data.map(file => file.url);
  }
  throw new Error(result.error);
}
```

### Error Handling Best Practices

```javascript
class APIClient {
  constructor(baseURL, getAuthToken) {
    this.baseURL = baseURL;
    this.getAuthToken = getAuthToken;
  }

  async request(endpoint, options = {}) {
    const url = `${this.baseURL}${endpoint}`;
    const headers = {
      'Content-Type': 'application/json',
      ...options.headers,
    };

    // Add auth token for admin routes
    if (endpoint.startsWith('/api/admin')) {
      headers.Authorization = `Bearer ${this.getAuthToken()}`;
    }

    try {
      const response = await fetch(url, {
        ...options,
        headers,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new APIError(data.error || 'Request failed', response.status, data);
      }

      return data;
    } catch (error) {
      if (error instanceof APIError) {
        throw error;
      }
      throw new APIError('Network error', 0, { originalError: error });
    }
  }
}

class APIError extends Error {
  constructor(message, status, data) {
    super(message);
    this.status = status;
    this.data = data;
  }
}
```

---

## Security Considerations

### Input Validation

All endpoints use Zod schemas for validation:

```javascript
const createProductSchema = z.object({
  name: z.string().min(1),
  description: z.string().min(1),
  category: z.enum(['simmons-black', 'accessories', 'us-imports']),
  // ... other fields
});
```

### File Upload Security

- File type validation
- Size limits enforced
- Unique file naming to prevent conflicts
- Metadata sanitization

### Database Security

- Prepared statements prevent SQL injection
- Input sanitization on all user data
- Role-based access control

### Recommendations

1. Implement rate limiting in production
2. Add request logging and monitoring
3. Use HTTPS for all communications
4. Regularly update dependencies
5. Monitor Cloudflare security dashboard

---

## Performance Optimization

### Caching Strategy

- Static data cached for 1 hour
- Dynamic data cached for 5-30 minutes
- Cache invalidation on data updates
- CDN caching for images and static assets

### Database Optimization

- Indexed commonly queried fields
- Pagination for large datasets
- Efficient query patterns with Drizzle ORM

### File Storage

- Images served via Cloudflare CDN
- Automatic image optimization
- WebP format support for modern browsers

---

This documentation covers the complete Black Living API. For additional support or questions, contact the development team or refer to the source code in the repository.

# Black Living API - Cloudflare Workers Backend

A high-performance backend API built with Hono framework on Cloudflare Workers, providing CMS functionality for the Black Living e-commerce platform.

## 🚀 Tech Stack

- **Runtime**: Cloudflare Workers
- **Framework**: Hono.js
- **Database**: Cloudflare D1 (SQLite)
- **ORM**: Drizzle ORM
- **Storage**: Cloudflare R2
- **Cache**: Cloudflare KV
- **Authentication**: Better Auth
- **Validation**: Zod

## 🏗️ Architecture

```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   Admin Panel   │    │   Customer Web   │    │   Mobile App    │
│   (React SPA)   │    │   (Astro SSG)    │    │   (Future)      │
└─────────────────┘    └──────────────────┘    └─────────────────┘
          │                       │                       │
          └───────────────────────┼───────────────────────┘
                                  │
                    ┌─────────────▼─────────────┐
                    │     Hono API Server       │
                    │   (Cloudflare Workers)    │
                    └─────────────┬─────────────┘
                                  │
          ┌───────────────────────┼───────────────────────┐
          │                       │                       │
┌─────────▼─────────┐   ┌─────────▼─────────┐   ┌─────────▼─────────┐
│   Cloudflare D1   │   │   Cloudflare R2   │   │   Cloudflare KV   │
│   (Database)      │   │   (File Storage)  │   │   (Cache Layer)   │
└───────────────────┘   └───────────────────┘   └───────────────────┘
```

## 📁 Project Structure

```
src/
├── index.ts              # Main application entry point
├── lib/
│   ├── cache.ts          # KV caching utilities
│   └── storage.ts        # R2 file storage utilities
└── modules/
    ├── products.ts       # Product management APIs
    ├── orders.ts         # Order management APIs
    ├── appointments.ts   # Appointment booking APIs
    └── admin.ts          # Admin CMS APIs
```

## 🔐 Authentication & Authorization

The API uses **Better Auth** for secure authentication with the following features:

- **Multi-provider Support**: Email/Password + Google OAuth
- **Role-based Access**: Customer vs Admin permissions
- **Session Management**: Secure session handling with KV storage
- **Cross-domain Cookies**: Shared auth across subdomains

### Protected Routes

- `/api/admin/*` - Requires admin role
- `/api/orders` (POST) - Requires authentication
- `/api/appointments` (POST) - Requires authentication

## 🛠️ API Endpoints

### Admin CMS APIs

#### Dashboard

- `GET /api/admin/dashboard/stats` - Get dashboard analytics

#### Product Management

- `GET /api/admin/products` - List products with filters
- `POST /api/admin/products` - Create new product
- `PUT /api/admin/products/:id` - Update product
- `DELETE /api/admin/products/:id` - Delete product

#### File Upload

- `POST /api/admin/upload` - Upload files to R2 storage

#### Blog Management

- `GET /api/admin/posts` - List blog posts
- `POST /api/admin/posts` - Create new post
- `PUT /api/admin/posts/:id` - Update post
- `DELETE /api/admin/posts/:id` - Delete post

### Public APIs

#### Products

- `GET /api/products` - List products (cached)
- `GET /api/products/:id` - Get product details (cached)

#### Orders

- `POST /api/orders` - Create new order (auth required)
- `GET /api/orders` - Get user orders (auth required)

#### Appointments

- `POST /api/appointments` - Book appointment (auth required)
- `GET /api/appointments` - Get user appointments (auth required)

### Authentication

- `POST /api/auth/sign-in` - User login
- `POST /api/auth/sign-up` - User registration
- `POST /api/auth/sign-out` - User logout
- `GET /api/auth/session` - Get current session

## 🗄️ Database Schema

The database uses **Drizzle ORM** with the following main tables:

- `users` - User accounts and profiles
- `sessions` - Authentication sessions
- `products` - Product catalog
- `orders` - Customer orders
- `appointments` - Store visit appointments
- `posts` - Blog posts and content
- `reviews` - Customer testimonials

## 💾 Caching Strategy

**Cloudflare KV** provides intelligent caching:

- **Product Data**: 1 hour TTL
- **Dashboard Stats**: 5 minutes TTL
- **Blog Posts**: 30 minutes TTL
- **Tag-based Invalidation**: Automatic cache clearing on updates

## 📁 File Storage

**Cloudflare R2** handles all file operations:

- **Product Images**: Optimized image storage
- **Blog Media**: Rich content assets
- **User Uploads**: Profile pictures, documents
- **Automatic Validation**: File type and size limits

## 🚀 Deployment

### Development

```bash
# Start development server
pnpm dev

# Run database migrations
pnpm db:generate
pnpm db:migrate
```

### Staging/Production

```bash
# Deploy to staging
wrangler deploy --env staging

# Deploy to production
wrangler deploy --env production
```

### Environment Setup

1. **Create Cloudflare Resources**:

   ```bash
   # Create D1 database
   wrangler d1 create blackliving-db

   # Create R2 bucket
   wrangler r2 bucket create blackliving-images

   # Create KV namespace
   wrangler kv:namespace create "CACHE"
   ```

2. **Set Environment Secrets**:

   ```bash
   wrangler secret put BETTER_AUTH_SECRET --env production
   wrangler secret put GOOGLE_CLIENT_ID --env production
   wrangler secret put GOOGLE_CLIENT_SECRET --env production
   ```

3. **Update wrangler.toml** with your resource IDs

## 🔧 Configuration

### Environment Variables

- `NODE_ENV` - Environment mode (development/staging/production)
- `API_BASE_URL` - API base URL for CORS
- `WEB_BASE_URL` - Frontend URL for CORS

### Secrets (via Wrangler)

- `BETTER_AUTH_SECRET` - Authentication encryption key
- `GOOGLE_CLIENT_ID` - Google OAuth client ID
- `GOOGLE_CLIENT_SECRET` - Google OAuth client secret

## 📊 Performance Features

- **Edge Computing**: Global distribution via Cloudflare Workers
- **Smart Caching**: Multi-layer caching with KV
- **Optimized Queries**: Efficient database operations with Drizzle
- **File CDN**: Global file delivery via R2
- **Auto-scaling**: Serverless architecture

## 🔍 Monitoring

Monitor API performance through:

- Cloudflare Workers Analytics
- Real-time error tracking
- Performance metrics dashboard
- Cache hit/miss ratios

## 🧪 Testing

```bash
# Run tests
pnpm test

# Test specific endpoint
curl -X GET https://api.blackliving.com/api/products
```

## 📚 API Documentation

Full API documentation available at: `https://api.blackliving.com/docs` (TODO: Add OpenAPI spec)

---

**Built with ❤️ for Black Living 黑哥家居 - Premium Simmons Mattress Retailer**

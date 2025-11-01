# Black Living Admin Dashboard

A comprehensive management dashboard for the Black Living e-commerce platform, built with modern React technologies and deployed on Cloudflare Workers.

## Overview

The Black Living Admin Dashboard is a full-stack web application that provides e-commerce management capabilities for the Black Living mattress retailer. It offers a complete suite of tools for managing products, orders, customers, content, and analytics.

## Features

### 🛍️ Product Management
- Product catalog management
- Inventory tracking
- Category organization
- Product image management

### 📦 Order Management
- Order processing and fulfillment
- Order status tracking
- Customer order history
- Order analytics

### 👥 Customer Management
- Customer database
- Customer profiles
- Purchase history
- Customer communication

### 📝 Content Management System (CMS)
- Blog post creation and editing
- Dynamic category management
- Rich text editor (BlockNote)
- Media library integration

### 📅 Appointment System
- Appointment scheduling
- Customer appointment management
- Calendar integration

### 📊 Analytics Dashboard
- Sales analytics
- Customer insights
- Performance metrics
- Business intelligence

### ⚙️ System Settings
- Configuration management
- User permissions
- System preferences

## Tech Stack

### Frontend Framework
- **React Router v7** - Full-stack routing and data loading
- **React 19** - UI framework
- **TypeScript** - Type safety

### UI & Styling
- **Tailwind CSS v4** - Utility-first CSS framework
- **Shadcn/ui** - Component library
- **Lucide React** - Icon library

### Data Management
- **TanStack Table** - Data table components
- **React Hook Form** - Form management
- **Zod** - Schema validation

### Content Editing
- **BlockNote** - Rich text editor
- **Unpic React** - Image optimization

### Development & Build
- **Vite** - Build tool and dev server
- **Wrangler** - Cloudflare deployment
- **Playwright** - E2E testing
- **Vitest** - Unit testing

### Backend Integration
- **Cloudflare Workers** - Serverless backend
- **Cloudflare D1** - SQLite database
- **Cloudflare R2** - File storage
- **Better Auth** - Authentication

## Getting Started

### Prerequisites

- **Node.js** >= 18.0.0
- **PNPM** >= 8.0.0 (workspace package manager)
- **Wrangler CLI** (for Cloudflare deployment)

### Installation

1. **Clone the repository** (if not already done):
   ```bash
   git clone <repository-url>
   cd website-blackliving-ecomm
   ```

2. **Install dependencies**:
   ```bash
   pnpm install
   ```

3. **Set up environment variables**:
   ```bash
   cp apps/admin/.env.example apps/admin/.env
   # Edit .env with your configuration
   ```

4. **Configure Wrangler** (for Cloudflare deployment):
   ```bash
   cp apps/admin/wrangler.example.toml apps/admin/wrangler.toml
   # Edit wrangler.toml with your Cloudflare account details
   ```

### Development

1. **Start the development server**:
   ```bash
   cd apps/admin
   pnpm dev
   ```

   The application will be available at `http://localhost:5173`

2. **Start the API server** (in another terminal):
   ```bash
   cd apps/api
   pnpm dev
   ```

   The API will be available at `http://localhost:8787`

### Building

Create a production build:

```bash
pnpm build
```

## Testing

### Unit Tests

Run unit tests with Vitest:

```bash
pnpm test:unit
```

### End-to-End Tests

Run E2E tests with Playwright:

```bash
pnpm test
```

The E2E tests include both API and UI testing with automatic test server startup.

### Manual Sort Order Verification (Chrome DevTools)

Use Chrome DevTools when validating the blog post sort-order workflow end-to-end:

1. Start the API (`pnpm dev` in `apps/api`) and admin (`pnpm dev` in `apps/admin`) servers, then sign in as an admin user.
2. Open the Blog Composer (`/dashboard/blog-composer`), set **排序順序** to a non-zero value, and submit the form. In DevTools → Network, confirm the `POST /api/posts` request body includes `sortOrder` with the expected integer.
3. Navigate to **文章管理** (`/dashboard/posts`) and confirm the manual post appears ahead of “自動排序” rows. Filtering or searching must retain the manual order (requirement 3.4).
4. With DevTools open, drag the row using the grip icon to reorder posts. Verify Chrome logs a `POST /api/posts/batch-sort-order` call where each payload entry has the recalculated `sortOrder` (requirement 6.5).
5. Inspect the batch endpoint response to ensure the API returns the updated posts array, then confirm the UI reflects the new ordering. If the network call fails, the UI should revert and surface the toast error.

Repeat the workflow for posts where `sortOrder = 0` to ensure auto-sorted items remain at the end of filtered results.

## Deployment

### Cloudflare Workers Deployment

The application is designed to deploy to Cloudflare Workers with three environments:

#### Development
- Local development with hot reload
- Connects to local API server

#### Staging
- Deployed to `blackliving-admin-staging.pukpuk-tw.workers.dev`
- Connects to staging API

#### Production
- Deployed to `blackliving-admin.pukpuk-tw.workers.dev`
- Connects to production API

### Deployment Commands

```bash
# Deploy to staging
pnpm deploy:staging

# Deploy to production
pnpm deploy:production
```

### Environment Configuration

Each environment has specific configuration in `wrangler.toml`:

- **API URLs**: Different endpoints for each environment
- **Image CDN**: Cloudflare R2 integration
- **Authentication**: Better Auth configuration

## API Integration

The admin dashboard integrates with the Black Living API (`apps/api`) which provides:

- RESTful endpoints for CRUD operations
- Authentication via Better Auth
- Media upload and management
- Caching with Cloudflare KV
- Database operations with Cloudflare D1

### Key API Endpoints

- `/api/products` - Product management
- `/api/orders` - Order processing
- `/api/customers` - Customer data
- `/api/posts` - Blog content
- `/api/appointments` - Appointment scheduling
- `/api/media` - File uploads

## Project Structure

```
apps/admin/
├── app/                    # Application source
│   ├── components/         # Reusable UI components
│   ├── contexts/           # React contexts
│   ├── lib/                # Utility functions
│   ├── routes/             # Route components
│   ├── services/           # API service functions
│   └── welcome/            # Welcome/onboarding
├── functions/              # Cloudflare Worker functions
├── public/                 # Static assets
├── tests/                  # Test files
├── .env.example           # Environment template
├── components.json        # Shadcn/ui configuration
├── package.json           # Dependencies and scripts
├── playwright.config.ts   # E2E test configuration
├── tsconfig.json          # TypeScript configuration
├── vite.config.ts         # Vite build configuration
├── vitest.config.ts       # Unit test configuration
├── wrangler.toml          # Cloudflare deployment config
└── README.md              # This file
```

## Development Guidelines

### Code Style

- **TypeScript**: Strict type checking enabled
- **ESLint**: Code linting with React Router rules
- **Prettier**: Code formatting
- **Tailwind**: Utility-first CSS approach

### Component Architecture

- **Shadcn/ui**: Consistent component library
- **React Hook Form**: Form management
- **Zod**: Runtime validation
- **Context API**: State management

### Testing Strategy

- **Unit Tests**: Component and utility function testing
- **Integration Tests**: API integration testing
- **E2E Tests**: Critical user journey testing

## Blog Composer Features

The blog composer includes dynamic category management:

- **Dynamic Categories**: Loads categories from API instead of hardcoded values
- **Category Selection**: Dropdown with real-time category loading
- **Cache Management**: Refresh button to clear server cache
- **Backward Compatibility**: Maintains category name in posts schema

### API Integration

```bash
# Load categories
GET ${PUBLIC_API_URL}/api/posts/categories

# Invalidate cache after category changes
POST ${PUBLIC_API_URL}/api/posts/categories/cache/invalidate
```

## Contributing

1. Follow the established code style and architecture patterns
2. Write tests for new features
3. Update documentation as needed
4. Ensure TypeScript types are properly defined
5. Test deployment in staging before production

## Environment Variables

### Required Variables

- `PUBLIC_API_URL`: API endpoint URL
- `PUBLIC_IMAGE_CDN_URL`: Image CDN URL
- `PUBLIC_SITE_URL`: Admin dashboard URL
- `PUBLIC_WEB_URL`: Customer website URL

### Optional Variables

- `NODE_ENV`: Environment (development/staging/production)
- `API_BASE_URL`: Base API URL for internal calls

## Troubleshooting

### Common Issues

1. **API Connection Issues**
   - Ensure API server is running on port 8787
   - Check environment variables in `.env`

2. **Build Failures**
   - Clear node_modules: `rm -rf node_modules && pnpm install`
   - Check TypeScript errors: `pnpm typecheck`

3. **Deployment Issues**
   - Verify Wrangler authentication: `wrangler auth login`
   - Check Cloudflare account permissions

### Debug Commands

```bash
# Check API connectivity
curl http://localhost:8787/api/health

# Run type checking
pnpm typecheck

# Run linting
pnpm lint

# Clear caches
rm -rf .react-router build
```

## License

This project is part of the Black Living e-commerce platform.

---

Built with ❤️ for Black Living mattress retail management.

---

📖 [English Version](README.md) | [繁體中文版](README-zh-TW.md)

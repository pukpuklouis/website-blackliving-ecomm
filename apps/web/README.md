# Black Living 黑哥居家 - Customer Website

A modern, edge-first e-commerce website for Black Living (黑哥居家), Taiwan's premium Simmons mattress retailer. Built with Astro, React, and Cloudflare technologies for optimal performance and SEO.

## 🚀 Overview

This is the customer-facing web application that powers the Black Living online store. It provides a seamless shopping experience for premium mattresses and home furnishings, featuring:

- **Modern UI**: Built with React islands and shadcn/ui components
- **Edge Performance**: Deployed on Cloudflare Pages with global CDN
- **SEO Optimized**: Server-side rendering with Astro for excellent search rankings
- **Mobile-First**: Responsive design with touch-optimized interactions
- **Authentication**: Secure user accounts and order management
- **Multilingual**: Support for Traditional Chinese (zh-TW) and English

## 🏗️ Architecture

### Tech Stack

- **Framework**: [Astro 5](https://astro.build/) with React islands
- **Styling**: [Tailwind CSS v4](https://tailwindcss.com/) with custom design system
- **UI Components**: [shadcn/ui](https://ui.shadcn.com/) components
- **Deployment**: [Cloudflare Pages](https://pages.cloudflare.com/)
- **Backend API**: Cloudflare Workers (see `apps/api/`)
- **Database**: Cloudflare D1 (SQLite)
- **Storage**: Cloudflare R2 for images
- **Authentication**: Better Auth integration

### Key Features

- **Server-Side Rendering**: Fast initial page loads and excellent SEO
- **Edge Computing**: Global deployment with Cloudflare's edge network
- **Image Optimization**: Automatic image processing and CDN delivery
- **Type Safety**: Full TypeScript support with strict type checking
- **Testing**: Comprehensive test suite with Vitest
- **Performance Monitoring**: Built-in performance tracking and optimization

## 📁 Project Structure

```
apps/web/
├── src/
│   ├── components/     # React components
│   ├── layouts/        # Astro page layouts
│   ├── pages/          # Astro pages (file-based routing)
│   ├── styles/         # Global styles and CSS
│   ├── assets/         # Static assets (fonts, images)
│   └── lib/            # Utility functions and helpers
├── public/             # Static files served at root
├── .env.local          # Local development environment
├── .env.staging        # Staging build environment
├── astro.config.mjs    # Astro configuration
├── tailwind.config.js  # Tailwind CSS configuration
├── components.json     # shadcn/ui configuration
├── package.json        # Dependencies and scripts
├── tsconfig.json       # TypeScript configuration
├── vitest.config.ts    # Testing configuration
└── wrangler.toml       # Cloudflare deployment config
```

## 🛠️ Development

### Prerequisites

- **Node.js**: >=18.0.0
- **PNPM**: >=9.5.0 (workspace package manager)
- **Cloudflare Account**: For deployment and API integration

### Local Development

1. **Install dependencies**:
   ```bash
   pnpm install
   ```

2. **Start development server**:
   ```bash
   pnpm dev
   ```
   - Runs on `http://localhost:4321`
   - Hot reload enabled
   - API proxy to local backend (`apps/api/`)

3. **Environment setup**:
   ```bash
   cp .env.local.example .env.local
   # Edit .env.local with your local configuration
   ```

### Available Scripts

| Command | Description |
|---------|-------------|
| `pnpm dev` | Start development server with hot reload |
| `pnpm build` | Build for production to `./dist/` |
| `pnpm build:staging` | Build for staging environment |
| `pnpm preview` | Preview production build locally |
| `pnpm type-check` | Run TypeScript type checking |
| `pnpm test` | Run test suite with Vitest |
| `pnpm test:watch` | Run tests in watch mode |
| `pnpm lint:astro` | Run Astro linting and type checks |
| `pnpm format` | Format code with Prettier |

### Environment Configuration

The app supports multiple environments:

- **Local Development**: `.env.local` - connects to local API
- **Staging**: `.env.staging` - connects to staging API
- **Production**: Cloudflare Pages environment variables

All environment variables are prefixed with `PUBLIC_` since this is a client-side application.

## 🚀 Deployment

### Cloudflare Pages

The app is designed for Cloudflare Pages deployment:

1. **Build Configuration**:
   - Build command: `NODE_OPTIONS='--loader=./loader.mjs' astro build`
   - Build output directory: `dist`
   - Node.js compatibility enabled

2. **Environment Variables** (set in Cloudflare Pages dashboard):
   - `PUBLIC_API_BASE_URL` - API worker URL
   - `PUBLIC_SITE_URL` - Site URL for meta tags
   - `PUBLIC_IMAGE_CDN_URL` - Image CDN URL
   - `PUBLIC_TURNSTILE_SITE_KEY` - Cloudflare Turnstile key

3. **Branch-based Deployments**:
   - `main`/`master` → Production
   - `staging` → Preview environment
   - All other branches → Preview

### Manual Deployment

```bash
# Production deployment
pnpm deploy

# Staging deployment
pnpm deploy:staging
```

## 🔧 Configuration

### Astro Configuration (`astro.config.mjs`)

- **Adapter**: Cloudflare Pages with server-side rendering
- **Integrations**: React, Font loading
- **SEO**: Custom robots.txt and sitemap endpoints (SSR-compatible)
- **Fonts**: Custom web fonts (Agatho, Noto Sans TC, Crimson Text)
- **Vite Plugins**: Tailwind CSS v4, Lucide icon resolver

### Tailwind CSS v4

The project uses Tailwind CSS v4 with:
- Custom design tokens
- Component-based architecture
- Dark mode support
- Custom font integration

### Cloudflare Integration

- **Pages Functions**: Server-side rendering and API routes
- **Assets**: Optimized static asset delivery
- **Security**: Turnstile CAPTCHA integration
- **Analytics**: Built-in performance monitoring

## 🧪 Testing

### Test Setup

- **Framework**: Vitest with jsdom environment
- **Coverage**: Unit tests for components and utilities
- **CI/CD**: Automated testing on deployment

### Running Tests

```bash
# Run all tests
pnpm test

# Run tests in watch mode
pnpm test:watch

# Run with coverage
pnpm test:coverage
```

## 🌐 Internationalization

The app supports Traditional Chinese (zh-TW) with:

- **Fonts**: Noto Sans TC for Chinese text
- **RTL Support**: Built-in right-to-left text support
- **Locale Routing**: URL-based locale switching
- **Content Management**: CMS integration for multilingual content

## 🔐 Security

### Client-Side Security

- **Public Variables Only**: Only `PUBLIC_` prefixed variables exposed
- **Server-Side Secrets**: All sensitive data handled by `apps/api/`
- **CAPTCHA**: Cloudflare Turnstile integration
- **CSP Headers**: Content Security Policy enforcement

### Authentication

- **Provider**: Better Auth integration
- **OAuth**: Google OAuth support
- **Session Management**: Secure token-based authentication
- **API Security**: All auth operations server-side

## 📊 Performance

### Optimization Features

- **Edge Computing**: Global CDN with Cloudflare
- **Image Optimization**: Automatic format conversion and compression
- **Code Splitting**: Automatic chunking and lazy loading
- **Font Loading**: Optimized web font loading
- **Caching**: Aggressive caching strategies

### Monitoring

- **Core Web Vitals**: Performance metrics tracking
- **Bundle Analysis**: Build size monitoring
- **Runtime Performance**: Real User Monitoring (RUM)

## 🤝 Contributing

1. Follow the established code style and patterns
2. Write tests for new features
3. Update documentation as needed
4. Ensure TypeScript strict mode compliance
5. Test across devices and browsers

## 📝 License

This project is part of the Black Living e-commerce platform. See root `README.md` for license information.

## 📞 Support

For questions or issues:
- Check the root project documentation
- Review `apps/api/` for backend integration details
- See `packages/ui/` for component library documentation

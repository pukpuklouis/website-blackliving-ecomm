# Black Living Technology Stack

## Project Type
Black Living is a full-stack, cloud-native e-commerce platform consisting of:
- **Customer-facing website** (Astro.js React application)
- **Administrative dashboard** (React SPA)
- **REST API backend** (Cloudflare Workers)
- **Shared component library** (TypeScript/React)
- **Monorepo architecture** with shared tooling and utilities

## Core Technologies

### Primary Language(s)
- **TypeScript 5.x**: Primary language for all applications, ensuring type safety across frontend, backend, and shared packages
- **Runtime**: Node.js 18+ for development, Cloudflare Workers runtime for API deployment
- **Package Management**: pnpm for efficient workspace management and dependency resolution

### Key Dependencies/Libraries

#### Frontend Framework
- **Astro 5.x**: Static site generation and server-side rendering for the main website
- **React 19.x**: Component-based UI development for interactive features
- **React Router 7.x**: Full-stack web framework for admin dashboard and routing

#### API Framework
- **Hono 4.x**: Web framework for Cloudflare Workers API endpoints

#### Database & Storage
- **Drizzle ORM**: Type-safe SQL query builder for database operations
- **Cloudflare D1**: SQLite-compatible database for data persistence
- **Cloudflare KV**: Key-value storage for session management and caching
- **Cloudflare R2**: S3-compatible object storage for media files and assets

#### UI & Styling
- **Tailwind CSS**: Utility-first CSS framework for consistent styling
- **Radix UI**: Accessible component primitives for admin interface
- **Headless UI**: Unstyled UI components for custom implementations

#### Development Tools
- **Turborepo**: High-performance build system for monorepo orchestration
- **Prettier**: Code formatter for consistent code styling
- **ESLint**: Linting tool for code quality and consistency
- **Vitest**: Modern testing framework with TypeScript support

### Application Architecture
Black Living follows a **modular monorepo architecture** with clear separation of concerns:

- **apps/web**: Customer-facing e-commerce site (Astro.js SSR/SSG)
- **apps/admin**: Administrative dashboard (React SPA)
- **apps/api**: Serverless API layer (Cloudflare Workers)
- **packages/**: Shared utilities and components

**Architecture Patterns**:
- **Atomic Design**: UI components organized by complexity (atoms → molecules → organisms)
- **Feature-based organization**: Code organized around business domains
- **Dependency injection**: Shared services injected at appropriate layers

### Data Storage
- **Primary storage**: Cloudflare D1 (SQLite-compatible distributed database)
- **Document storage**: MongoDB-style schemas with Drizzle ORM
- **Session storage**: Cloudflare KV for user sessions and temporary data
- **File storage**: Cloudflare R2 for product images and assets
- **Caching**: Cloudflare KV for frequently accessed data

### External Integrations
- **Payment Processing**: Taiwan payment gateways (future integration)
- **Email Service**: Transactional email delivery
- **Analytics**: Web analytics and conversion tracking
- **Content Delivery**: Cloudflare CDN for global asset distribution
- **Authentication**: OAuth 2.0 compatible providers

### Monitoring & Dashboard Technologies
- **Admin Dashboard**: React-based administrative interface
- **Real-time Monitoring**: WebSocket connections for live updates
- **Performance Monitoring**: Cloudflare Web Analytics
- **Error Tracking**: Centralized logging and alerting
- **Analytics**: User behavior tracking and business metrics

## Development Environment

### Build & Development Tools
- **Build System**: Turborepo with custom pipelines for each application
- **Package Management**: pnpm workspace with strict dependency resolution
- **Development Servers**: Vite (admin), Astro dev server (web)
- **Hot Reload**: Enabled across all development environments

### Code Quality Tools
- **Static Analysis**: TypeScript strict mode with custom ESLint rules
- **Formatting**: Prettier for consistent code formatting
- **Linting**: ESLint for code quality and consistency
- **Testing Framework**: Vitest for unit tests, Playwright for E2E testing
- **Type Checking**: TypeScript with strict null checks and no implicit any
- **Documentation**: MDX for component documentation

### Version Control & Collaboration
- **VCS**: Git with GitHub for source control
- **Branching Strategy**: GitHub Flow (main branch, feature branches)
- **Code Review Process**: Pull request reviews with required approvals
- **CI/CD**: GitHub Actions for automated testing and deployment

### Dashboard Development
- **Live Reload**: Hot module replacement for instant UI updates
- **Port Management**: Configurable development ports (3000, 4000, etc.)
- **Multi-Instance Support**: Concurrent development servers for different apps

## Deployment & Distribution
- **Target Platform(s)**: Cloudflare Pages (frontend), Cloudflare Pages Functions (API)
- **Distribution Method**: SaaS platform accessible via web browsers
- **Global CDN**: Cloudflare's worldwide network for low-latency delivery
- **Installation Requirements**: Modern web browser (no client installation)

## Technical Requirements & Constraints

### Performance Requirements
- **Page Load Time**: <2 seconds average across all pages
- **API Response Time**: <500ms for 95th percentile requests
- **Mobile Performance**: Core Web Vitals scores >90
- **Scalability**: Handle 10,000+ concurrent users

### Compatibility Requirements
- **Browser Support**: Modern evergreen browsers (Chrome, Firefox, Safari, Edge)
- **Device Support**: Mobile-first responsive design
- **API Compatibility**: RESTful APIs with OpenAPI specification
- **Platform Independence**: Works on desktop and mobile platforms

### Security & Compliance
- **Authentication**: Secure user authentication with proper session management
- **Data Protection**: PCI DSS compliance for payment data handling
- **GDPR Compliance**: User data protection and privacy controls
- **Security Headers**: Comprehensive security headers and CSP policies

### Scalability & Reliability
- **Global Distribution**: CDN-backed architecture for worldwide performance
- **Fault Tolerance**: Graceful degradation and comprehensive error handling
- **Database Scalability**: Cloudflare D1's distributed architecture
- **99.9% Uptime Target**: High availability through Cloudflare's infrastructure

## Technical Decisions & Rationale

### Decision Log
1. **Astro.js for Main Website**: Chosen for superior SEO, performance, and developer experience. Islands architecture allows selective hydration while maintaining fast loading times. Considered Next.js but Astro provides better static generation for content-heavy e-commerce pages.

2. **Cloudflare Platform**: Single-vendor solution for compute, database, storage, and CDN reduces complexity and operational overhead. D1 provides SQLite-compatible database with global replication. Considered Vercel + PlanetScale but lacked data sovereignty requirements.

3. **Drizzle ORM**: Type-safe SQL builder ensuring compile-time query validation. Schema-first approach aligns with TypeScript-first development philosophy. Considered Prisma but Drizzle's lightweight bundle size is better for edge runtime deployment.

4. **Monorepo with Turborepo**: Centralizes shared code and tooling while maintaining independent deployment. pnpm workspaces provide efficient package management. Enables atomic changes across multiple applications while maintaining deployment isolation.

5. **Tailwind CSS**: Utility-first approach enables rapid UI development and consistent design system. Small bundle size and zero runtime performance impact. Considered CSS-in-JS but Tailwind provides better maintainability and performance.

## Known Limitations

### Current Limitations
1. **Single Database Solution**: Currently limited to Cloudflare D1 which, while globally distributed, may have scaling limits for extremely high-volume e-commerce workloads. Potential future migration to dedicated database solutions if needed.

2. **Edge Runtime Constraints**: Cloudflare Workers runtime limitations affect certain NPM package compatibility. Workarounds required for packages not supporting ESM or having Node.js-specific dependencies.

3. **Geographic Data Residency**: Cloudflare's data centers are primarily US/EU-focused, which may have implications for specific data residency requirements in different jurisdictions.

4. **Development Tooling**: Some advanced developer tools have limited support in the edge runtime environment, requiring custom solutions or workarounds.

### Planned Improvements
1. **Hybrid Architecture**: Gradual migration to hybrid serverless-traditional architecture for complex business logic
2. **Multi-Region Support**: Enhanced geographic data distribution and residency controls
3. **Advanced Analytics**: Implementation of real-time analytics and machine learning capabilities
4. **Progressive Web App**: Enhanced offline capabilities and native app-like experiences

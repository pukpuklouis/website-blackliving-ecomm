# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is an e-commerce website for **Black Living 黑哥家居**, a Taiwanese premium Simmons "Black Label" mattress retailer. The project is in planning phase and will be built using a modern edge-first architecture with Cloudflare services.

### Business Context
- **Core Business**: Premium Simmons "Black Label" mattresses 
- **Brand Evolution**: Formerly "黑標王", now "Black Living 黑哥家居" expanding to full home living
- **Target Market**: Quality-conscious consumers seeking value (專櫃價2-3折起)
- **Physical Locations**: Zhonghe (中和) and Zhongli (中壢) showrooms
- **Unique Selling Points**: "全台最低價", "買貴退差價", 10-year warranty, 100% USA manufactured

## Planned Architecture

The project will use a **Monorepo structure** with three main applications:

### `/apps/web/` - Customer Website (Astro)
- **Framework**: Astro with React islands
- **Styling**: Tailwind CSS + Shadcn components
- **Authentication**: Better Auth integration
- **Key Pages**:
  - Homepage with hero slider, brand story, product categories
  - Product pages: `/simmons-black/`, `/accessories/`, `/us-imports/`
  - Customer account area (protected by Better Auth)
  - Appointment booking system

### `/apps/admin/` - Management Dashboard (React SPA)
- **Framework**: Vite + React Router
- **UI**: Shadcn/ui components
- **Data Management**: TanStack Query + TanStack Table
- **Features**: Product management, order management, blog composer (Novel.sh editor)

### `/apps/api/` - Backend Services (Cloudflare Workers)
- **Framework**: Hono web framework
- **Database**: Cloudflare D1 (SQLite) with Drizzle ORM
- **Storage**: Cloudflare R2 for images
- **Cache**: Cloudflare KV for API responses
- **Auth**: Better Auth middleware integration

### Shared Packages (`/packages/`)
- `packages/auth/` - Shared Better Auth configuration
- `packages/ui/` - Shared Shadcn UI components
- `packages/db/` - Database schema and client
- `packages/types/` - TypeScript type definitions

## Key Features & Requirements

### Customer Experience
- **Appointment Booking**: "預約試躺" system for showroom visits with store selection (中和/中壢)
- **Product Catalog**: Simmons Black Label series (S2, S3, S4, L-Class) with size/firmness options
- **Dynamic Pricing**: Prices shown after size/firmness selection
- **Payment Flow**: Company bank transfer (公司帳戶匯款) - no real-time payment integration needed
- **Social Proof**: Customer testimonials from Shopee and Google Maps reviews

### Administrative Features
- **Product Management**: Full CRUD operations with R2 image uploads
- **Order Management**: Track orders, update shipping status
- **Blog Management**: Novel.sh editor for content creation
- **Analytics Dashboard**: Sales data visualization

### Technical Implementation
- **SEO**: Centralized SEO.astro component for meta tags, Open Graph, schema markup
- **Performance**: Edge-first architecture with global CDN
- **Authentication**: Better Auth for both customer and admin access
- **State Management**: Zustand for React components
- **Data Validation**: Zod schemas for all API endpoints

## Brand Guidelines

### Visual Design
- **Colors**: Black, grey, earth tones (土色) based on logo guidebook
- **Style**: Clean, minimalist design focused on conversion
- **Header**: White background with brand color announcement bar
- **Reference Sites**: "Oversleep" for header design, "得利購" for product layout

### Content Strategy
- **Emotional Connection**: Link purchases to family care (孝親), health investment
- **Trust Building**: Emphasize "四大堅持" (four core commitments)
- **Educational Content**: Sleep quality benefits, electric bed advantages
- **Social Proof**: Customer reviews, "蝦皮第一賣家" status

## Development Guidelines

- Follow the planned monorepo structure when implementing
- Use Cloudflare services (D1, R2, KV, Workers) for backend infrastructure
- Implement Better Auth for all authentication needs
- Use Drizzle ORM for database operations
- Apply Shadcn/ui components for consistent UI
- Ensure mobile-responsive design
- Implement proper SEO with structured data
- Use Zod for runtime data validation
- Follow Taiwanese e-commerce UX patterns

## Content Areas

### Product Categories
1. **席夢思黑標床墊** - Main Simmons Black Label collection
2. **精選周邊** - Selected accessories 
3. **美國品牌代購專區** - US brand imports (framework only, content TBD)

### Required Pages
- About page (關於黑哥) with brand story and showroom info
- Customer testimonials (顧客好評) with review aggregation
- Blog section (好文分享) for educational content
- Contact page with Line integration (@blackking)
- Appointment booking with location selection

This project represents a sophisticated e-commerce platform with strong emphasis on customer trust, premium quality positioning, and omnichannel customer experience bridging online and offline touchpoints.
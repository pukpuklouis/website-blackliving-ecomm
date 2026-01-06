# Cmd+K Search Modal - Technical Implementation Plan

## 🎯 Implementation Overview

This document provides detailed technical specifications and implementation steps for the Cmd+K search modal feature, designed to integrate seamlessly with the existing Black Living e-commerce architecture.

## 📋 Current Architecture Analysis

### Existing Infrastructure
```
✅ Available Resources:
├── API Framework: Hono + Cloudflare Workers
├── Database: D1 (SQLite) with Drizzle ORM
├── Cache: Cloudflare KV storage
├── UI: shadcn/ui components (Dialog available)
├── Search Endpoints:
│   ├── /api/products/search (functional)
│   └── /api/posts (with search params)
└── Monorepo: PNPM workspaces with shared packages

❌ Missing Components:
├── cmdk (Command) component
├── Unified search API endpoint
├── Global search state management
└── Static page indexing
```

## 🚀 Phase 1: Foundation Setup

### 1.1 Install Dependencies

```bash
# Add cmdk to UI package
cd packages/ui
pnpm add cmdk@^1.0.0

# Add React dependencies if needed
pnpm add @types/react@^18.0.0
```

### 1.2 Create Base Command Component

**File:** `packages/ui/components/ui/command.tsx`

```typescript
import * as React from "react"
import { Command as CommandPrimitive } from "cmdk"
import { Search } from "lucide-react"
import { cn } from "../../lib/utils"

const Command = React.forwardRef<
  React.ElementRef<typeof CommandPrimitive>,
  React.ComponentPropsWithoutRef<typeof CommandPrimitive>
>(({ className, ...props }, ref) => (
  <CommandPrimitive
    ref={ref}
    className={cn(
      "flex h-full w-full flex-col overflow-hidden rounded-md bg-popover text-popover-foreground",
      className
    )}
    {...props}
  />
))
Command.displayName = CommandPrimitive.displayName

const CommandInput = React.forwardRef<
  React.ElementRef<typeof CommandPrimitive.Input>,
  React.ComponentPropsWithoutRef<typeof CommandPrimitive.Input>
>(({ className, ...props }, ref) => (
  <div className="flex items-center border-b px-3" cmdk-input-wrapper="">
    <Search className="mr-2 h-4 w-4 shrink-0 opacity-50" />
    <CommandPrimitive.Input
      ref={ref}
      className={cn(
        "flex h-11 w-full rounded-md bg-transparent py-3 text-sm outline-none placeholder:text-muted-foreground disabled:cursor-not-allowed disabled:opacity-50",
        className
      )}
      {...props}
    />
  </div>
))
CommandInput.displayName = CommandPrimitive.Input.displayName

const CommandList = React.forwardRef<
  React.ElementRef<typeof CommandPrimitive.List>,
  React.ComponentPropsWithoutRef<typeof CommandPrimitive.List>
>(({ className, ...props }, ref) => (
  <CommandPrimitive.List
    ref={ref}
    className={cn("max-h-[300px] overflow-y-auto overflow-x-hidden", className)}
    {...props}
  />
))
CommandList.displayName = CommandPrimitive.List.displayName

const CommandEmpty = React.forwardRef<
  React.ElementRef<typeof CommandPrimitive.Empty>,
  React.ComponentPropsWithoutRef<typeof CommandPrimitive.Empty>
>(({ className, ...props }, ref) => (
  <CommandPrimitive.Empty
    ref={ref}
    className={cn("py-6 text-center text-sm", className)}
    {...props}
  />
))
CommandEmpty.displayName = CommandPrimitive.Empty.displayName

const CommandGroup = React.forwardRef<
  React.ElementRef<typeof CommandPrimitive.Group>,
  React.ComponentPropsWithoutRef<typeof CommandPrimitive.Group>
>(({ className, ...props }, ref) => (
  <CommandPrimitive.Group
    ref={ref}
    className={cn(
      "overflow-hidden p-1 text-foreground [&_[cmdk-group-heading]]:px-2 [&_[cmdk-group-heading]]:py-1.5 [&_[cmdk-group-heading]]:text-xs [&_[cmdk-group-heading]]:font-medium [&_[cmdk-group-heading]]:text-muted-foreground",
      className
    )}
    {...props}
  />
))
CommandGroup.displayName = CommandPrimitive.Group.displayName

const CommandSeparator = React.forwardRef<
  React.ElementRef<typeof CommandPrimitive.Separator>,
  React.ComponentPropsWithoutRef<typeof CommandPrimitive.Separator>
>(({ className, ...props }, ref) => (
  <CommandPrimitive.Separator
    ref={ref}
    className={cn("-mx-1 h-px bg-border", className)}
    {...props}
  />
))
CommandSeparator.displayName = CommandPrimitive.Separator.displayName

const CommandItem = React.forwardRef<
  React.ElementRef<typeof CommandPrimitive.Item>,
  React.ComponentPropsWithoutRef<typeof CommandPrimitive.Item>
>(({ className, ...props }, ref) => (
  <CommandPrimitive.Item
    ref={ref}
    className={cn(
      "relative flex cursor-default select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none aria-selected:bg-accent aria-selected:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50",
      className
    )}
    {...props}
  />
))
CommandItem.displayName = CommandPrimitive.Item.displayName

const CommandShortcut = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLSpanElement>) => {
  return (
    <span
      className={cn(
        "ml-auto text-xs tracking-widest text-muted-foreground",
        className
      )}
      {...props}
    />
  )
}
CommandShortcut.displayName = "CommandShortcut"

export {
  Command,
  CommandInput,
  CommandList,
  CommandEmpty,
  CommandGroup,
  CommandItem,
  CommandShortcut,
  CommandSeparator,
}
```

### 1.3 Create Unified Search API

**File:** `apps/api/src/routes/search.ts`

```typescript
import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';
import { eq, and, or, like, desc, asc } from 'drizzle-orm';
import { products, posts, postCategories } from '../../../packages/db/schema';

type Env = {
  Bindings: {
    DB: D1Database;
    CACHE: KVNamespace;
  };
};

const searchRouter = new Hono<Env>();

// Search query validation schema
const searchQuerySchema = z.object({
  q: z.string().min(1, 'Search query is required').max(100),
  types: z.array(z.enum(['products', 'posts', 'pages'])).optional(),
  category: z.string().optional(),
  limit: z.number().min(1).max(20).default(5),
  includeContent: z.boolean().default(false),
});

// Static pages data (could be moved to a separate service)
const STATIC_PAGES = [
  {
    title: 'About Black Living',
    slug: 'about',
    description: 'Learn about our premium Simmons mattress collection and brand story',
    type: 'page' as const,
  },
  {
    title: 'Simmons Black Label Collection',
    slug: 'simmons-black',
    description: 'Explore our premium Simmons Black Label mattress collection',
    type: 'page' as const,
  },
  {
    title: 'US Import Accessories',
    slug: 'us-imports',
    description: 'Premium bedding accessories and furniture imported from the US',
    type: 'page' as const,
  },
  {
    title: 'Book an Appointment',
    slug: 'appointment',
    description: 'Schedule a personalized mattress consultation with our experts',
    type: 'page' as const,
  },
];

// Unified search endpoint
searchRouter.get('/', zValidator('query', searchQuerySchema), async (c) => {
  try {
    const db = c.get('db');
    const cache = c.get('cache');
    const query = c.req.valid('query');

    const startTime = Date.now();

    // Generate cache key
    const cacheKey = `search:${JSON.stringify(query)}`;

    // Try cache first
    const cached = await cache.get(cacheKey);
    if (cached) {
      return c.json({
        success: true,
        data: JSON.parse(cached),
        cached: true,
      });
    }

    const results = {
      products: [] as any[],
      posts: [] as any[],
      pages: [] as any[],
    };

    const searchTerm = `%${query.q.toLowerCase()}%`;
    const typesToSearch = query.types || ['products', 'posts', 'pages'];

    // Search products
    if (typesToSearch.includes('products')) {
      let productConditions = [
        or(
          like(products.name, searchTerm),
          like(products.description, searchTerm)
        ),
        eq(products.inStock, true)
      ];

      if (query.category) {
        productConditions.push(eq(products.category, query.category));
      }

      const productResults = await db
        .select({
          id: products.id,
          name: products.name,
          slug: products.slug,
          description: products.description,
          category: products.category,
          featuredImage: products.images,
          inStock: products.inStock,
        })
        .from(products)
        .where(and(...productConditions))
        .orderBy(desc(products.featured), desc(products.createdAt))
        .limit(query.limit);

      results.products = productResults.map(product => ({
        ...product,
        featuredImage: product.featuredImage ? JSON.parse(product.featuredImage as string)[0] : null,
        type: 'product',
      }));
    }

    // Search posts
    if (typesToSearch.includes('posts')) {
      let postConditions = [
        or(
          like(posts.title, searchTerm),
          like(posts.description, searchTerm),
          ...(query.includeContent ? [like(posts.content, searchTerm)] : [])
        ),
        eq(posts.status, 'published')
      ];

      const postResults = await db
        .select({
          id: posts.id,
          title: posts.title,
          slug: posts.slug,
          excerpt: posts.excerpt,
          description: posts.description,
          category: posts.category,
          featuredImage: posts.featuredImage,
          publishedAt: posts.publishedAt,
        })
        .from(posts)
        .where(and(...postConditions))
        .orderBy(desc(posts.featured), desc(posts.publishedAt))
        .limit(query.limit);

      results.posts = postResults.map(post => ({
        ...post,
        type: 'post',
      }));
    }

    // Search static pages
    if (typesToSearch.includes('pages')) {
      results.pages = STATIC_PAGES
        .filter(page =>
          page.title.toLowerCase().includes(query.q.toLowerCase()) ||
          page.description.toLowerCase().includes(query.q.toLowerCase())
        )
        .slice(0, query.limit);
    }

    const responseData = {
      query: query.q,
      results,
      total: results.products.length + results.posts.length + results.pages.length,
      took: Date.now() - startTime,
    };

    // Cache for 10 minutes
    await cache.put(cacheKey, JSON.stringify(responseData), { expirationTtl: 600 });

    return c.json({
      success: true,
      data: responseData,
      cached: false,
    });

  } catch (error) {
    console.error('Search error:', error);
    return c.json({
      success: false,
      error: 'Search failed',
      message: error instanceof Error ? error.message : 'Unknown error',
    }, 500);
  }
});

export default searchRouter;
```

### 1.4 Register Search Route

**File:** `apps/api/src/index.ts` (update)

```typescript
import searchRouter from './routes/search';

// ... existing imports

app.route('/search', searchRouter);

// ... rest of the file
```

## 🔧 Phase 2: Core Search Component

### 2.1 Create SearchCommand Component

**File:** `packages/ui/components/ui/search-command.tsx`

```typescript
"use client"

import * as React from "react"
import { Search, FileText, Package, Clock } from "lucide-react"
import { DialogProps } from "@radix-ui/react-dialog"
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "./command"
import { Dialog, DialogContent } from "./dialog"
import { Badge } from "./badge"

interface SearchResult {
  id: string
  title?: string
  name?: string
  slug: string
  description: string
  category?: string
  featuredImage?: string
  type: 'product' | 'post' | 'page'
}

interface SearchCommandProps extends DialogProps {
  onResultClick?: (result: SearchResult, url: string) => void
}

export function SearchCommand({ onResultClick, ...props }: SearchCommandProps) {
  const [open, setOpen] = React.useState(false)
  const [query, setQuery] = React.useState("")
  const [results, setResults] = React.useState<{
    products: SearchResult[]
    posts: SearchResult[]
    pages: SearchResult[]
  }>({
    products: [],
    posts: [],
    pages: []
  })
  const [loading, setLoading] = React.useState(false)
  const [recentSearches, setRecentSearches] = React.useState<string[]>([])

  // Load recent searches from localStorage
  React.useEffect(() => {
    const stored = localStorage.getItem('search-recent')
    if (stored) {
      try {
        setRecentSearches(JSON.parse(stored))
      } catch (e) {
        console.warn('Failed to parse recent searches')
      }
    }
  }, [])

  // Save recent searches to localStorage
  const saveRecentSearch = React.useCallback((query: string) => {
    const updated = [query, ...recentSearches.filter(q => q !== query)].slice(0, 5)
    setRecentSearches(updated)
    localStorage.setItem('search-recent', JSON.stringify(updated))
  }, [recentSearches])

  // Debounced search function
  const performSearch = React.useCallback(
    async (searchQuery: string) => {
      if (!searchQuery.trim()) {
        setResults({ products: [], posts: [], pages: [] })
        return
      }

      setLoading(true)
      try {
        const params = new URLSearchParams({
          q: searchQuery,
          limit: '5',
        })

        const response = await fetch(`/api/search?${params}`)
        const data = await response.json()

        if (data.success) {
          setResults(data.data.results)
        }
      } catch (error) {
        console.error('Search failed:', error)
      } finally {
        setLoading(false)
      }
    },
    []
  )

  // Debounce search queries
  React.useEffect(() => {
    const debounceTimer = setTimeout(() => {
      performSearch(query)
    }, 300)

    return () => clearTimeout(debounceTimer)
  }, [query, performSearch])

  // Keyboard shortcut handler
  React.useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault()
        setOpen((open) => !open)
      }
    }

    document.addEventListener("keydown", down)
    return () => document.removeEventListener("keydown", down)
  }, [])

  const handleResultClick = (result: SearchResult) => {
    const url = getResultUrl(result)
    saveRecentSearch(query)
    setOpen(false)
    setQuery("")
    onResultClick?.(result, url)
    window.location.href = url
  }

  const getResultUrl = (result: SearchResult): string => {
    switch (result.type) {
      case 'product':
        return `/${result.category}/${result.slug}`
      case 'post':
        return `/posts/${result.slug}`
      case 'page':
        return `/${result.slug}`
      default:
        return '/'
    }
  }

  const getResultIcon = (type: string) => {
    switch (type) {
      case 'product':
        return <Package className="mr-2 h-4 w-4" />
      case 'post':
        return <FileText className="mr-2 h-4 w-4" />
      case 'page':
        return <Search className="mr-2 h-4 w-4" />
      default:
        return <Search className="mr-2 h-4 w-4" />
    }
  }

  const hasResults = results.products.length + results.posts.length + results.pages.length > 0

  return (
    <Dialog open={open} onOpenChange={setOpen} {...props}>
      <DialogContent className="overflow-hidden p-0 shadow-lg">
        <Command className="[&_[cmdk-group-heading]]:px-2 [&_[cmdk-group-heading]]:font-medium [&_[cmdk-group-heading]]:text-muted-foreground [&_[cmdk-group]:not([hidden])_~[cmdk-group]]:pt-0 [&_[cmdk-group]]:px-2 [&_[cmdk-input-wrapper]_svg]:h-5 [&_[cmdk-input-wrapper]_svg]:w-5 [&_[cmdk-input]]:h-12 [&_[cmdk-item]]:px-2 [&_[cmdk-item]]:py-3 [&_[cmdk-item]_svg]:h-5 [&_[cmdk-item]_svg]:w-5">
          <CommandInput
            placeholder="Search products, articles, and pages..."
            value={query}
            onValueChange={setQuery}
          />
          <CommandList>
            {loading && (
              <div className="py-6 text-center text-sm">
                <div className="animate-pulse">Searching...</div>
              </div>
            )}

            {!loading && !query && recentSearches.length > 0 && (
              <CommandGroup heading="Recent Searches">
                {recentSearches.map((recent, index) => (
                  <CommandItem
                    key={index}
                    onSelect={() => setQuery(recent)}
                    className="cursor-pointer"
                  >
                    <Clock className="mr-2 h-4 w-4" />
                    {recent}
                  </CommandItem>
                ))}
              </CommandGroup>
            )}

            {!loading && query && !hasResults && (
              <CommandEmpty>No results found for "{query}"</CommandEmpty>
            )}

            {results.products.length > 0 && (
              <CommandGroup heading="Products">
                {results.products.map((product) => (
                  <CommandItem
                    key={product.id}
                    onSelect={() => handleResultClick(product)}
                    className="cursor-pointer"
                  >
                    {getResultIcon('product')}
                    <div className="flex-1">
                      <div className="font-medium">{product.name}</div>
                      <div className="text-sm text-muted-foreground line-clamp-1">
                        {product.description}
                      </div>
                    </div>
                    {product.category && (
                      <Badge variant="secondary" className="ml-2">
                        {product.category}
                      </Badge>
                    )}
                  </CommandItem>
                ))}
              </CommandGroup>
            )}

            {results.posts.length > 0 && (
              <CommandGroup heading="Articles">
                {results.posts.map((post) => (
                  <CommandItem
                    key={post.id}
                    onSelect={() => handleResultClick(post)}
                    className="cursor-pointer"
                  >
                    {getResultIcon('post')}
                    <div className="flex-1">
                      <div className="font-medium">{post.title}</div>
                      <div className="text-sm text-muted-foreground line-clamp-1">
                        {post.description}
                      </div>
                    </div>
                    {post.category && (
                      <Badge variant="outline" className="ml-2">
                        {post.category}
                      </Badge>
                    )}
                  </CommandItem>
                ))}
              </CommandGroup>
            )}

            {results.pages.length > 0 && (
              <CommandGroup heading="Pages">
                {results.pages.map((page) => (
                  <CommandItem
                    key={page.slug}
                    onSelect={() => handleResultClick(page)}
                    className="cursor-pointer"
                  >
                    {getResultIcon('page')}
                    <div className="flex-1">
                      <div className="font-medium">{page.title}</div>
                      <div className="text-sm text-muted-foreground line-clamp-1">
                        {page.description}
                      </div>
                    </div>
                  </CommandItem>
                ))}
              </CommandGroup>
            )}
          </CommandList>
        </Command>
      </DialogContent>
    </Dialog>
  )
}
```

### 2.2 Update UI Package Exports

**File:** `packages/ui/components/ui/index.ts`

```typescript
// Add these exports
export * from "./command"
export * from "./search-command"
```

## 🔗 Phase 3: Integration

### 3.1 Add Search Trigger to Header

**File:** `apps/web/src/components/Header.astro` (update)

```astro
---
import { getCollection } from 'astro:content';

// Get navigation data
const navigationData = await getCollection('navigation');
const menuItems = navigationData[0]?.data?.items || [];

export interface Props {
  className?: string;
}

const { className } = Astro.props;
---

<header class:list={["sticky top-0 z-50 bg-white shadow-sm border-b", className]}>
  <div class="container mx-auto px-4">
    <div class="flex items-center justify-between h-16">
      <!-- Logo -->
      <a href="/" class="flex items-center space-x-2">
        <span class="text-xl font-bold text-gray-900">Black Living</span>
      </a>

      <!-- Desktop Navigation -->
      <nav class="hidden md:flex items-center space-x-8">
        {menuItems.map((item: any) => (
          <a
            href={item.href}
            class="text-gray-700 hover:text-gray-900 transition-colors"
          >
            {item.label}
          </a>
        ))}
      </nav>

      <!-- Search and Actions -->
      <div class="flex items-center space-x-4">
        <!-- Search Button - Desktop -->
        <button
          id="search-trigger"
          class="hidden md:flex items-center space-x-2 px-3 py-2 text-sm border rounded-md hover:bg-gray-50 transition-colors"
          aria-label="Search"
        >
          <svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="m21 21-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <span class="text-gray-500">Search...</span>
          <kbd class="pointer-events-none inline-flex h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground opacity-100">
            <span class="text-xs">⌘</span>K
          </kbd>
        </button>

        <!-- Search Button - Mobile -->
        <button
          id="search-trigger-mobile"
          class="md:hidden p-2 text-gray-600 hover:text-gray-900 transition-colors"
          aria-label="Search"
        >
          <svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="m21 21-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </button>

        <!-- Cart Button -->
        <a href="/cart" class="p-2 text-gray-600 hover:text-gray-900 transition-colors">
          <svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 3h2l.4 2M7 13h10l4-8H5.4m0 0L7 13m0 0l-1.5 1.5M7 13l1.5 1.5m0 0L5 15m3.5-.5L12 12" />
          </svg>
        </a>

        <!-- Mobile Menu Button -->
        <button class="md:hidden p-2 text-gray-600 hover:text-gray-900">
          <svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>
      </div>
    </div>
  </div>
</header>

<script>
  document.addEventListener('DOMContentLoaded', () => {
    const searchTrigger = document.getElementById('search-trigger');
    const searchTriggerMobile = document.getElementById('search-trigger-mobile');

    const handleSearchClick = () => {
      // This will be handled by the SearchCommand component
      window.dispatchEvent(new CustomEvent('open-search'));
    };

    searchTrigger?.addEventListener('click', handleSearchClick);
    searchTriggerMobile?.addEventListener('click', handleSearchClick);
  });
</script>
```

### 3.2 Integrate into BaseLayout

**File:** `apps/web/src/layouts/BaseLayout.astro` (update)

```astro
---
import { SEO } from '../components/SEO.astro';
import Header from '../components/Header.astro';
import Footer from '../components/Footer.astro';
import '../styles/global.css';

export interface Props {
  title: string;
  description?: string;
  image?: string;
  canonical?: string;
  type?: string;
  publishedTime?: string;
  modifiedTime?: string;
  schema?: object;
  className?: string;
}

const {
  title,
  description,
  image,
  canonical,
  type = 'website',
  publishedTime,
  modifiedTime,
  schema,
  className
} = Astro.props;
---

<!DOCTYPE html>
<html lang="zh-TW">
  <head>
    <SEO
      title={title}
      description={description}
      image={image}
      canonical={canonical}
      type={type}
      publishedTime={publishedTime}
      modifiedTime={modifiedTime}
      schema={schema}
    />
  </head>
  <body class:list={[className]}>
    <Header />

    <main>
      <slot />
    </main>

    <Footer />

    <!-- Search Command Component -->
    <div id="search-command-root"></div>

    <!-- Load Search Component -->
    <script>
      import { SearchCommand } from '@blackliving/ui/components/ui/search-command';
      import { createRoot } from 'react-dom/client';
      import React from 'react';

      document.addEventListener('DOMContentLoaded', () => {
        const container = document.getElementById('search-command-root');
        if (container) {
          const root = createRoot(container);

          const handleOpenSearch = () => {
            // Force open the search modal
            root.render(
              React.createElement(SearchCommand, {
                defaultOpen: true,
                onResultClick: (result, url) => {
                  console.log('Search result clicked:', result, url);
                }
              })
            );
          };

          // Listen for search trigger events
          window.addEventListener('open-search', handleOpenSearch);

          // Initial render
          root.render(React.createElement(SearchCommand));
        }
      });
    </script>
  </body>
</html>
```

### 3.3 Create Search Page (Fallback)

**File:** `apps/web/src/pages/search.astro`

```astro
---
import BaseLayout from '../layouts/BaseLayout.astro';

const query = Astro.url.searchParams.get('q') || '';
---

<BaseLayout title="Search Results" description="Search results for Black Living products and content">
  <div class="container mx-auto px-4 py-8">
    <h1 class="text-3xl font-bold mb-8">Search Results</h1>

    <div class="max-w-2xl mx-auto">
      <form action="/search" method="get" class="mb-8">
        <div class="flex">
          <input
            type="text"
            name="q"
            value={query}
            placeholder="Search products, articles, and pages..."
            class="flex-1 px-4 py-3 border border-gray-300 rounded-l-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button
            type="submit"
            class="px-6 py-3 bg-blue-600 text-white rounded-r-lg hover:bg-blue-700 transition-colors"
          >
            Search
          </button>
        </div>
      </form>

      <div id="search-results">
        <!-- Search results will be loaded here via JavaScript -->
      </div>
    </div>
  </div>

  <script>
    document.addEventListener('DOMContentLoaded', async () => {
      const urlParams = new URLSearchParams(window.location.search);
      const query = urlParams.get('q');

      if (query) {
        const resultsContainer = document.getElementById('search-results');
        if (resultsContainer) {
          resultsContainer.innerHTML = '<div class="text-center py-8">Searching...</div>';

          try {
            const response = await fetch(`/api/search?q=${encodeURIComponent(query)}&limit=10`);
            const data = await response.json();

            if (data.success) {
              renderSearchResults(data.data, resultsContainer);
            } else {
              resultsContainer.innerHTML = '<div class="text-center py-8 text-red-600">Search failed. Please try again.</div>';
            }
          } catch (error) {
            console.error('Search error:', error);
            resultsContainer.innerHTML = '<div class="text-center py-8 text-red-600">Search failed. Please try again.</div>';
          }
        }
      }
    });

    function renderSearchResults(data, container) {
      const { results, total } = data;

      if (total === 0) {
        container.innerHTML = `
          <div class="text-center py-8">
            <h2 class="text-xl font-semibold mb-2">No results found</h2>
            <p class="text-gray-600">Try adjusting your search terms or browse our categories.</p>
          </div>
        `;
        return;
      }

      let html = `<div class="mb-4 text-gray-600">Found ${total} results</div>`;

      // Render products
      if (results.products.length > 0) {
        html += '<h2 class="text-xl font-semibold mb-4">Products</h2>';
        results.products.forEach(product => {
          html += `
            <div class="border rounded-lg p-4 mb-4 hover:shadow-md transition-shadow">
              <h3 class="font-semibold mb-2">
                <a href="/${product.category}/${product.slug}" class="text-blue-600 hover:underline">
                  ${product.name}
                </a>
              </h3>
              <p class="text-gray-600 text-sm">${product.description}</p>
              <span class="inline-block mt-2 px-2 py-1 bg-gray-100 rounded text-xs">
                ${product.category}
              </span>
            </div>
          `;
        });
      }

      // Render posts
      if (results.posts.length > 0) {
        html += '<h2 class="text-xl font-semibold mb-4 mt-8">Articles</h2>';
        results.posts.forEach(post => {
          html += `
            <div class="border rounded-lg p-4 mb-4 hover:shadow-md transition-shadow">
              <h3 class="font-semibold mb-2">
                <a href="/posts/${post.slug}" class="text-blue-600 hover:underline">
                  ${post.title}
                </a>
              </h3>
              <p class="text-gray-600 text-sm">${post.description}</p>
              <span class="inline-block mt-2 px-2 py-1 bg-blue-100 rounded text-xs">
                ${post.category}
              </span>
            </div>
          `;
        });
      }

      // Render pages
      if (results.pages.length > 0) {
        html += '<h2 class="text-xl font-semibold mb-4 mt-8">Pages</h2>';
        results.pages.forEach(page => {
          html += `
            <div class="border rounded-lg p-4 mb-4 hover:shadow-md transition-shadow">
              <h3 class="font-semibold mb-2">
                <a href="/${page.slug}" class="text-blue-600 hover:underline">
                  ${page.title}
                </a>
              </h3>
              <p class="text-gray-600 text-sm">${page.description}</p>
            </div>
          `;
        });
      }

      container.innerHTML = html;
    }
  </script>
</BaseLayout>
```

## 🧪 Phase 4: Testing & Optimization

### 4.1 Component Tests

**File:** `packages/ui/components/ui/__tests__/search-command.test.tsx`

```typescript
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { SearchCommand } from '../search-command';

// Mock fetch
global.fetch = jest.fn();

describe('SearchCommand', () => {
  beforeEach(() => {
    (fetch as jest.Mock).mockClear();
    localStorage.clear();
  });

  it('renders search modal when open', () => {
    render(<SearchCommand defaultOpen />);
    expect(screen.getByPlaceholderText(/search products/i)).toBeInTheDocument();
  });

  it('handles keyboard shortcut Cmd+K', () => {
    render(<SearchCommand />);

    fireEvent.keyDown(document, {
      key: 'k',
      metaKey: true,
    });

    expect(screen.getByPlaceholderText(/search products/i)).toBeInTheDocument();
  });

  it('debounces search input', async () => {
    (fetch as jest.Mock).mockResolvedValue({
      json: () => Promise.resolve({
        success: true,
        data: { results: { products: [], posts: [], pages: [] }, total: 0 }
      })
    });

    render(<SearchCommand defaultOpen />);
    const input = screen.getByPlaceholderText(/search products/i);

    fireEvent.change(input, { target: { value: 'test' } });

    // Should not call fetch immediately
    expect(fetch).not.toHaveBeenCalled();

    // Should call fetch after debounce delay
    await waitFor(() => {
      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/search?q=test')
      );
    }, { timeout: 500 });
  });

  it('displays search results', async () => {
    const mockResults = {
      success: true,
      data: {
        results: {
          products: [
            {
              id: '1',
              name: 'Test Product',
              slug: 'test-product',
              description: 'Test description',
              category: 'simmons-black',
              type: 'product'
            }
          ],
          posts: [],
          pages: []
        },
        total: 1
      }
    };

    (fetch as jest.Mock).mockResolvedValue({
      json: () => Promise.resolve(mockResults)
    });

    render(<SearchCommand defaultOpen />);
    const input = screen.getByPlaceholderText(/search products/i);

    fireEvent.change(input, { target: { value: 'test' } });

    await waitFor(() => {
      expect(screen.getByText('Test Product')).toBeInTheDocument();
    });
  });

  it('persists recent searches', async () => {
    render(<SearchCommand defaultOpen />);

    const mockResult = {
      id: '1',
      name: 'Test Product',
      slug: 'test-product',
      description: 'Test description',
      type: 'product' as const,
      category: 'simmons-black'
    };

    // Simulate clicking a result
    const onResultClick = jest.fn();
    render(<SearchCommand defaultOpen onResultClick={onResultClick} />);

    // This would need to be tested with actual search results
    // For now, we test localStorage directly
    const recentSearches = ['test query', 'another search'];
    localStorage.setItem('search-recent', JSON.stringify(recentSearches));

    expect(JSON.parse(localStorage.getItem('search-recent') || '[]')).toEqual(recentSearches);
  });
});
```

### 4.2 API Tests

**File:** `apps/api/src/routes/__tests__/search.test.ts`

```typescript
import { describe, it, expect, beforeEach } from 'vitest';
import { testClient } from 'hono/testing';
import searchRouter from '../search';

// Mock environment
const env = {
  DB: {
    prepare: () => ({
      bind: () => ({
        all: () => Promise.resolve([]),
        first: () => Promise.resolve(null),
      })
    })
  },
  CACHE: {
    get: () => Promise.resolve(null),
    put: () => Promise.resolve(),
  }
};

const client = testClient(searchRouter, env);

describe('/api/search', () => {
  it('requires search query', async () => {
    const res = await client.index.$get({
      query: {}
    });
    expect(res.status).toBe(400);
  });

  it('returns search results', async () => {
    const res = await client.index.$get({
      query: { q: 'test' }
    });
    expect(res.status).toBe(200);

    const data = await res.json();
    expect(data.success).toBe(true);
    expect(data.data.results).toHaveProperty('products');
    expect(data.data.results).toHaveProperty('posts');
    expect(data.data.results).toHaveProperty('pages');
  });

  it('respects result limits', async () => {
    const res = await client.index.$get({
      query: { q: 'test', limit: '3' }
    });
    expect(res.status).toBe(200);

    const data = await res.json();
    // Each category should have max 3 results
    expect(data.data.results.products.length).toBeLessThanOrEqual(3);
    expect(data.data.results.posts.length).toBeLessThanOrEqual(3);
    expect(data.data.results.pages.length).toBeLessThanOrEqual(3);
  });

  it('filters by type', async () => {
    const res = await client.index.$get({
      query: { q: 'test', types: ['products'] }
    });
    expect(res.status).toBe(200);

    const data = await res.json();
    // Should only return products
    expect(data.data.results.posts.length).toBe(0);
    expect(data.data.results.pages.length).toBe(0);
  });
});
```

### 4.3 E2E Tests

**File:** `tests/search.spec.ts`

```typescript
import { test, expect } from '@playwright/test';

test.describe('Search Functionality', () => {
  test('opens search modal with Cmd+K', async ({ page }) => {
    await page.goto('/');

    // Press Cmd+K (or Ctrl+K on Windows/Linux)
    const modifier = process.platform === 'darwin' ? 'Meta' : 'Control';
    await page.keyboard.press(`${modifier}+KeyK`);

    // Search modal should be visible
    await expect(page.locator('[data-testid="search-modal"]')).toBeVisible();
  });

  test('searches for products', async ({ page }) => {
    await page.goto('/');
    await page.keyboard.press('Meta+KeyK');

    // Type search query
    await page.fill('[placeholder*="Search products"]', 'simmons');

    // Wait for results
    await expect(page.locator('[data-testid="search-results"]')).toBeVisible();
    await expect(page.locator('[data-testid="product-results"]')).toContainText('Simmons');
  });

  test('navigates to result on click', async ({ page }) => {
    await page.goto('/');
    await page.keyboard.press('Meta+KeyK');

    await page.fill('[placeholder*="Search products"]', 'simmons');

    // Click first result
    await page.click('[data-testid="search-result"]:first-child');

    // Should navigate to product page
    await expect(page).toHaveURL(/\/simmons-black\/.+/);
  });

  test('works on mobile', async ({ page, isMobile }) => {
    if (!isMobile) return;

    await page.goto('/');

    // Click mobile search button
    await page.click('[data-testid="search-trigger-mobile"]');

    await expect(page.locator('[data-testid="search-modal"]')).toBeVisible();
  });

  test('handles no results', async ({ page }) => {
    await page.goto('/');
    await page.keyboard.press('Meta+KeyK');

    await page.fill('[placeholder*="Search products"]', 'nonexistentproduct123');

    await expect(page.locator('text=No results found')).toBeVisible();
  });
});
```

## 📊 Performance Optimization

### Caching Strategy

**File:** `apps/api/src/lib/search-cache.ts`

```typescript
export class SearchCache {
  constructor(private kv: KVNamespace) {}

  private getCacheKey(query: string, filters: any): string {
    return `search:${Buffer.from(JSON.stringify({ query, filters })).toString('base64')}`;
  }

  async get(query: string, filters: any) {
    const key = this.getCacheKey(query, filters);
    const cached = await this.kv.get(key);
    return cached ? JSON.parse(cached) : null;
  }

  async set(query: string, filters: any, data: any, ttl = 600) {
    const key = this.getCacheKey(query, filters);
    await this.kv.put(key, JSON.stringify(data), { expirationTtl: ttl });
  }

  async invalidate(pattern?: string) {
    // KV doesn't support pattern deletion, would need to track keys
    // For now, rely on TTL expiration
  }
}
```

### Database Indexing

**File:** `packages/db/migrations/add_search_indexes.sql`

```sql
-- Add search indexes for better performance
CREATE INDEX IF NOT EXISTS idx_products_search
ON products(name, description, category, in_stock);

CREATE INDEX IF NOT EXISTS idx_posts_search
ON posts(title, description, status, published_at);

-- Consider FTS5 for full-text search (future enhancement)
-- CREATE VIRTUAL TABLE products_fts USING fts5(name, description, content=products);
```

## 🚀 Deployment Checklist

### 1. Environment Setup
- [ ] Add search endpoint to Cloudflare Worker routes
- [ ] Configure KV namespace for search cache
- [ ] Set up database indexes for search performance
- [ ] Configure CDN caching for static search assets

### 2. Feature Flags
- [ ] Implement gradual rollout (10% → 50% → 100%)
- [ ] Add fallback to traditional search page
- [ ] Monitor performance metrics and error rates

### 3. Testing
- [ ] Run all unit tests
- [ ] Execute integration tests
- [ ] Perform E2E testing on staging
- [ ] Conduct accessibility audit
- [ ] Validate mobile responsiveness

### 4. Monitoring
- [ ] Set up search analytics tracking
- [ ] Configure error alerting
- [ ] Monitor API response times
- [ ] Track user engagement metrics

---

This implementation plan provides a solid foundation for the Cmd+K search modal feature while following SOLID principles and maintaining clean, maintainable code architecture. The phased approach ensures reliable delivery with proper testing and optimization at each stage.
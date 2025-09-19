// Blog Post Types - Consolidated from multiple locations

/**
 * Complete blog post interface used for full post display
 * Consolidates interfaces from PostLayout.astro and [postSlug].astro
 * Compatible with API responses and database schema
 */
export interface BlogPost {
  id: string;
  title: string;
  slug: string;
  description: string;
  excerpt: string;
  content: string;
  authorName: string;
  category: string;
  categoryId: string;
  tags: string[];
  featuredImage: string;
  publishedAt: string;
  viewCount: number;
  readingTime: number;
  status: 'draft' | 'published' | 'archived';
  featured: boolean;
  seoTitle?: string;
  seoDescription?: string;
  createdAt?: string;
  updatedAt?: string;
}

/**
 * Simplified blog post interface for card displays
 * Used in BlogPostCard and listing pages
 */
export interface BlogPostSummary {
  slug: string;
  title: string;
  excerpt?: string;
  description?: string;
  featuredImage?: string;
  category: string;
  readingTime: string;
  authorName: string;
  publishedAt: string;
}

/**
 * Post category interface
 * Used for categorization and navigation
 */
export interface PostCategory {
  id: string;
  name: string;
  slug: string;
  description: string;
  color: string;
  icon: string;
}

// Component Prop Interfaces
// Based on planned 6-component breakdown of PostLayout.astro

/**
 * Props for BlogBreadcrumb component
 */
export interface BlogBreadcrumbProps {
  post: Pick<BlogPost, 'title'>;
  category?: PostCategory | null;
}

/**
 * Props for BlogHeader component
 */
export interface BlogHeaderProps {
  post: Pick<
    BlogPost,
    'title' | 'authorName' | 'publishedAt' | 'readingTime' | 'viewCount' | 'featuredImage'
  >;
  category?: PostCategory | null;
}

/**
 * Props for BlogContent component
 */
export interface BlogContentProps {
  content: string;
}

/**
 * Props for BlogTags component
 */
export interface BlogTagsProps {
  tags: string[];
}

/**
 * Props for BlogShare component
 */
export interface BlogShareProps {
  post: Pick<BlogPost, 'title'>;
  url: string;
}

/**
 * Props for BlogRelatedPosts component
 */
export interface BlogRelatedPostsProps {
  relatedPosts: BlogPostSummary[];
}

// Layout and Page Props

/**
 * Props for PostLayout component
 * Consolidates from existing PostLayout.astro Props interface
 */
export interface PostLayoutProps {
  post: BlogPost;
  category?: PostCategory | null;
  relatedPosts?: BlogPost[];
  seoTitle: string;
  seoDescription: string;
  ogImage: string;
}

/**
 * Props for BlogPostCard component
 * Consolidates from existing BlogPostCard.tsx Props interface
 */
export interface BlogPostCardProps {
  post: BlogPostSummary;
  variant?: 'vertical' | 'horizontal';
  className?: string;
}

// API and Data Types

/**
 * Blog post creation request
 * Compatible with existing CreatePostRequest in api.ts
 */
export interface BlogPostCreateRequest {
  title: string;
  slug: string;
  description: string;
  excerpt: string;
  content: string;
  categoryId: string;
  status: 'draft' | 'published' | 'archived';
  featured: boolean;
  tags: string[];
  featuredImage?: string;
  seoTitle?: string;
  seoDescription?: string;
  publishedAt?: string;
}

/**
 * Blog post update request
 * Compatible with existing UpdatePostRequest in api.ts
 */
export interface BlogPostUpdateRequest extends Partial<BlogPostCreateRequest> {
  id: string;
}

/**
 * Blog post filters for API queries
 */
export interface BlogPostFilters {
  category?: string;
  categoryId?: string;
  authorName?: string;
  tags?: string[];
  published?: boolean;
  featured?: boolean;
  limit?: number;
  offset?: number;
  search?: string;
}

/**
 * Content Fetching Utilities
 * Leverages existing API infrastructure for blog posts and customer reviews
 */

interface BlogPost {
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
  seoTitle?: string;
  seoDescription?: string;
}

interface FetchResult<T> {
  data: T | null;
  error: string | null;
  notFound: boolean;
}

/**
 * Fetch a single blog post by slug
 * Reuses existing API pattern from fetchProduct
 */
export async function fetchBlogPost(slug: string): Promise<FetchResult<BlogPost>> {
  try {
    // Direct API call following existing pattern - include category for related posts
    const response = await fetch(`/api/posts/${encodeURIComponent(slug)}?include=category`);

    if (!response.ok) {
      if (response.status === 404) {
        return { data: null, error: null, notFound: true };
      }

      const errorText = await response.text().catch(() => 'Unknown error');
      return {
        data: null,
        error: `Failed to fetch post: ${response.status} ${errorText}`,
        notFound: false,
      };
    }

    const result = await response.json();
    if (result.success) {
      return { data: result.data, error: null, notFound: false };
    } else {
      return { data: null, error: result.error || 'Unknown error', notFound: false };
    }
  } catch (error) {
    console.warn('Network error fetching blog post:', error);
    return {
      data: null,
      error: 'Network error - please check your connection',
      notFound: false,
    };
  }
}

/**
 * Fetch all blog posts with optional category filtering
 * Direct API call with minimal processing
 */
export async function fetchAllBlogPosts(category?: string, limit?: number): Promise<BlogPost[]> {
  try {
    // Use the public endpoint for published posts
    const params = new URLSearchParams();
    if (category) params.set('category', category);
    if (limit) params.set('limit', limit.toString());

    const url = `/api/posts/public${params.toString() ? `?${params.toString()}` : ''}`;
    const response = await fetch(url);

    if (!response.ok) {
      console.warn(`Failed to fetch blog posts: ${response.status}`);
      return [];
    }

    const result = await response.json();

    // Handle API response format
    if (result.success && Array.isArray(result.data)) {
      return result.data;
    }

    return [];
  } catch (error) {
    console.warn('Error fetching blog posts:', error);
    return [];
  }
}

/**
 * Fetch customer review posts (blog posts with customer-reviews category)
 */
export async function fetchCustomerReviews(limit?: number): Promise<BlogPost[]> {
  return await fetchAllBlogPosts('customer-reviews', limit);
}

/**
 * Fetch posts by category with enhanced error handling
 */
export async function fetchPostsByCategory(
  category: string,
  options: {
    limit?: number;
    offset?: number;
    sortBy?: 'publishedAt' | 'viewCount' | 'title';
    sortOrder?: 'asc' | 'desc';
  } = {}
): Promise<FetchResult<BlogPost[]>> {
  try {
    const { limit, offset, sortBy = 'publishedAt', sortOrder = 'desc' } = options;

    const params = new URLSearchParams({
      category,
      sortBy,
      sortOrder,
    });

    if (limit) params.set('limit', limit.toString());
    if (offset) params.set('offset', offset.toString());

    const response = await fetch(`/api/posts?${params.toString()}`);

    if (!response.ok) {
      return {
        data: null,
        error: `Failed to fetch posts for category "${category}"`,
        notFound: response.status === 404,
      };
    }

    const data = await response.json();
    const posts = Array.isArray(data) ? data : data.posts || [];

    return { data: posts, error: null, notFound: false };
  } catch (error) {
    return {
      data: null,
      error: 'Network error fetching posts by category',
      notFound: false,
    };
  }
}

/**
 * Fetch related posts based on tags and category
 */
export async function fetchRelatedPosts(
  currentPostId: string,
  tags: string[] = [],
  category?: string,
  limit: number = 3
): Promise<BlogPost[]> {
  try {
    const params = new URLSearchParams({
      limit: limit.toString(),
    });

    const response = await fetch(
      `/api/posts/${encodeURIComponent(currentPostId)}/related?${params.toString()}`
    );

    if (!response.ok) {
      // Fallback: get recent posts from same category
      return await fetchAllBlogPosts(category, limit);
    }

    const result = await response.json();
    if (result.success && Array.isArray(result.data)) {
      return result.data;
    }

    // Fallback: get recent posts from same category
    return await fetchAllBlogPosts(category, limit);
  } catch (error) {
    console.warn('Error fetching related posts:', error);
    // Fallback: get recent posts from same category
    return await fetchAllBlogPosts(category, limit);
  }
}

/**
 * Search blog posts by query string
 */
export async function searchBlogPosts(
  query: string,
  options: {
    category?: string;
    limit?: number;
    includeContent?: boolean;
  } = {}
): Promise<FetchResult<BlogPost[]>> {
  try {
    const { category, limit = 10, includeContent = false } = options;

    const params = new URLSearchParams({
      q: query,
      limit: limit.toString(),
      includeContent: includeContent.toString(),
    });

    if (category) params.set('category', category);

    const response = await fetch(`/api/posts/search?${params.toString()}`);

    if (!response.ok) {
      return {
        data: null,
        error: 'Failed to search posts',
        notFound: false,
      };
    }

    const data = await response.json();
    const posts = Array.isArray(data) ? data : data.results || [];

    return { data: posts, error: null, notFound: false };
  } catch (error) {
    return {
      data: null,
      error: 'Network error during search',
      notFound: false,
    };
  }
}

/**
 * Fetch posts by tag
 */
export async function fetchPostsByTag(
  tag: string,
  limit?: number
): Promise<FetchResult<BlogPost[]>> {
  try {
    const params = new URLSearchParams({ tag });
    if (limit) params.set('limit', limit.toString());

    const response = await fetch(`/api/posts/by-tag?${params.toString()}`);

    if (!response.ok) {
      return {
        data: null,
        error: `Failed to fetch posts with tag "${tag}"`,
        notFound: response.status === 404,
      };
    }

    const data = await response.json();
    const posts = Array.isArray(data) ? data : data.posts || [];

    return { data: posts, error: null, notFound: false };
  } catch (error) {
    return {
      data: null,
      error: 'Network error fetching posts by tag',
      notFound: false,
    };
  }
}

/**
 * Get post statistics (view count, reading time, etc.)
 */
export async function fetchPostStats(slug: string): Promise<{
  viewCount: number;
  likeCount: number;
  commentCount: number;
  shareCount: number;
} | null> {
  try {
    const response = await fetch(`/api/posts/${encodeURIComponent(slug)}/stats`);

    if (!response.ok) {
      return null;
    }

    return await response.json();
  } catch (error) {
    console.warn('Error fetching post stats:', error);
    return null;
  }
}

/**
 * Increment post view count
 */
export async function incrementPostView(slug: string): Promise<void> {
  try {
    await fetch(`/api/posts/${encodeURIComponent(slug)}/view`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
    });
  } catch (error) {
    // Silently fail - view tracking is not critical
    console.warn('Failed to track post view:', error);
  }
}

/**
 * Utility function to format post data for components
 */
export function formatPostForComponent(post: BlogPost): BlogPost & {
  formattedDate: string;
  categoryName: string;
  readingTimeText: string;
} {
  return {
    ...post,
    formattedDate: new Date(post.publishedAt).toLocaleDateString('zh-TW', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    }),
    categoryName: post.category === 'customer-reviews' ? '客戶評價' : '部落格',
    readingTimeText: `${post.readingTime} 分鐘閱讀`,
  };
}

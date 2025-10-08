/**
 * Blog Static Path Generation Utilities
 * Handles path generation for all blog content including customer reviews
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

interface StaticPathOptions {
  category?: string;
  limit?: number;
  published?: boolean;
}

/**
 * Fetch all blog posts with optional filtering
 */
export async function fetchAllBlogPosts(options: StaticPathOptions = {}): Promise<BlogPost[]> {
  const { category, limit, published = true } = options;

  try {
    if (published) {
      // Use static-paths endpoint for build-time generation
      const response = await fetch('/api/posts/static-paths');

      if (!response.ok) {
        console.warn(`Failed to fetch static paths from API: ${response.status}`);
        return getSampleBlogPosts(options);
      }

      const result = await response.json();
      let posts = result.success ? result.data : [];

      // Apply category filter if specified
      if (category && posts.length > 0) {
        posts = posts.filter((post: BlogPost) => post.category === category);
      }

      // Apply limit if specified
      if (limit && posts.length > limit) {
        posts = posts.slice(0, limit);
      }

      return posts;
    } else {
      // Use public endpoint for other cases
      const params = new URLSearchParams();
      if (category) params.set('category', category);
      if (limit) params.set('limit', limit.toString());

      const apiUrl = `/api/posts/public${params.toString() ? `?${params.toString()}` : ''}`;
      const response = await fetch(apiUrl);

      if (!response.ok) {
        console.warn(`Failed to fetch blog posts from API: ${response.status}`);
        return getSampleBlogPosts(options);
      }

      const result = await response.json();
      return result.success ? result.data : [];
    }
  } catch (error) {
    console.warn('Error fetching blog posts from API:', error);
    return getSampleBlogPosts(options);
  }
}

/**
 * Generate static paths for blog posts
 */
export async function generateBlogPaths(category?: string): Promise<
  Array<{
    params: { postSlug: string };
    props: { post: BlogPost };
  }>
> {
  try {
    const posts = await fetchAllBlogPosts({ category, published: true });

    return posts.map((post) => ({
      params: { postSlug: post.slug },
      props: { post },
    }));
  } catch (error) {
    console.warn('Error generating blog paths:', error);
    return getSampleBlogPaths(category);
  }
}

/**
 * Generate static paths specifically for customer reviews
 */
export async function generateReviewPaths(): Promise<
  Array<{
    params: { postSlug: string };
    props: { post: BlogPost };
  }>
> {
  return await generateBlogPaths('customer-reviews');
}

/**
 * Generate static paths for all blog content (unified approach)
 */
export async function generateBlogStaticPaths(category?: string): Promise<
  Array<{
    params: { postSlug: string };
    props: { post: BlogPost };
  }>
> {
  return await generateBlogPaths(category);
}

/**
 * Fallback sample paths for build-time failures
 */
function getSampleBlogPaths(category?: string): Array<{
  params: { postSlug: string };
  props: { post: BlogPost };
}> {
  const samplePosts = getSampleBlogPosts({ category });

  return samplePosts.map((post) => ({
    params: { postSlug: post.slug },
    props: { post },
  }));
}

/**
 * Sample blog posts for development and fallback
 */
function getSampleBlogPosts(options: StaticPathOptions = {}): BlogPost[] {
  const { category } = options;

  const allSamplePosts: BlogPost[] = [
    {
      id: 'sample-1',
      title: 'Simmons Black Label 床墊選購指南',
      slug: 'simmons-black-label-buying-guide',
      description: '全面介紹 Simmons Black Label 系列床墊的特色與選購建議',
      excerpt:
        '選擇合適的床墊對睡眠品質至關重要，本文將深入解析 Simmons Black Label 系列的各項特色...',
      content: '# Simmons Black Label 床墊選購指南\n\n選擇合適的床墊對睡眠品質至關重要...',
      authorName: '黑哥家居團隊',
      category: 'blog',
      categoryId: 'mattress-guide',
      tags: ['床墊', 'Simmons', '選購指南'],
      featuredImage: '/images/blog/simmons-guide.jpg',
      publishedAt: '2024-01-15T10:00:00Z',
      viewCount: 1250,
      readingTime: 8,
      seoTitle: 'Simmons Black Label 床墊完整選購指南 | 黑哥家居',
      seoDescription: '專業介紹 Simmons Black Label 系列床墊特色，幫您選擇最適合的床墊型號',
    },
    {
      id: 'sample-2',
      title: '客戶分享：使用 Simmons 床墊三個月心得',
      slug: 'customer-review-simmons-3-months',
      description: '真實客戶分享使用 Simmons Black Label 床墊三個月的使用心得',
      excerpt: '購買 Simmons Black Label Natasha 已經三個月了，想跟大家分享一下使用心得...',
      content:
        '# 客戶分享：使用 Simmons 床墊三個月心得\n\n購買 Simmons Black Label Natasha 已經三個月了...',
      authorName: '張小姐',
      category: 'customer-reviews',
      categoryId: 'customer-reviews',
      tags: ['客戶心得', 'Simmons', 'Black Label'],
      featuredImage: '/images/reviews/customer-review-1.jpg',
      publishedAt: '2024-01-10T14:30:00Z',
      viewCount: 890,
      readingTime: 5,
      seoTitle: '客戶真實分享：Simmons 床墊使用心得 | 黑哥家居',
      seoDescription: '真實客戶分享 Simmons Black Label 床墊使用三個月的詳細心得與評價',
    },
  ];

  // Filter by category if specified
  if (category) {
    return allSamplePosts.filter((post) => post.category === category);
  }

  return allSamplePosts;
}

/**
 * Utility to get related posts for a given post
 */
export async function getRelatedPosts(
  currentPost: BlogPost,
  limit: number = 3
): Promise<BlogPost[]> {
  try {
    // Fetch posts from the same category, excluding current post
    const relatedPosts = await fetchAllBlogPosts({
      category: currentPost.category,
      limit: limit + 1, // Get one extra to exclude current post
    });

    // Filter out current post and limit results
    return relatedPosts.filter((post) => post.id !== currentPost.id).slice(0, limit);
  } catch (error) {
    console.warn('Error fetching related posts:', error);
    return [];
  }
}

/**
 * Utility to validate blog post slugs
 */
export function validatePostSlug(slug: string): boolean {
  // Basic slug validation: alphanumeric, hyphens, minimum length
  const slugPattern = /^[a-zA-Z0-9\-]{3,}$/;
  return slugPattern.test(slug);
}

/**
 * Generate SEO-friendly meta data for blog posts
 */
export function generatePostSEO(post: BlogPost): {
  seoTitle: string;
  seoDescription: string;
  ogImage: string;
} {
  return {
    seoTitle: post.seoTitle || `${post.title} | 黑哥家居`,
    seoDescription: post.seoDescription || post.excerpt || post.description,
    ogImage: post.featuredImage || '/images/og-default.jpg',
  };
}

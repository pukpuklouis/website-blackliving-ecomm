import { cn } from '@blackliving/ui';

export interface BlogPost {
  slug: string;
  title: string;
  excerpt?: string;
  description?: string;
  featuredImage?: string;
  category: string;
  readingTime?: string;
  authorName: string;
  publishedAt: string;
}

export interface BlogPostCardProps {
  post: BlogPost;
  variant?: 'vertical' | 'horizontal';
  className?: string;
  href: string;
}

export function BlogPostCard({ post, variant = 'vertical', className, href }: BlogPostCardProps) {
  const baseClasses = 'bg-white rounded-lg shadow-md overflow-hidden';

  if (variant === 'horizontal') {
    return (
      <article className={cn(baseClasses, 'flex flex-col sm:flex-row max-w-3xl mx-auto', className)}>
        {post.featuredImage && (
          <div className="sm:w-80 flex-shrink-0 overflow-hidden">
            <img
              src={post.featuredImage}
              alt={post.title}
              className="w-full aspect-video sm:h-full object-cover transition-transform duration-300 hover:scale-105"
              loading="lazy"
            />
          </div>
        )}
        <div className="p-6 flex flex-1 flex-col justify-between">
          <div>
            <h2 className="text-xl md:text-3xl font-semibold text-gray-900 mb-3">
              <a
                href={href}
                className="hover:text-primary transition-colors duration-200 focus:outline-none rounded"
                aria-label={`閱讀文章：${post.title}`}
              >
                {post.title}
              </a>
            </h2>
            <p className="text-lg md:text-xl text-gray-800 mb-4 line-clamp-3">
              {post.excerpt || post.description}
            </p>
          </div>
          <div className="flex w-full items-center justify-end text-sm md:text-lg text-gray-700">
            <a href={href} aria-label={`閱讀文章：${post.title}`}>
              繼續閱讀 →
            </a>
          </div>
        </div>
      </article>
    );
  }

  // Vertical variant (Mobile to Horizontal)
  return (
    <article className={cn('flex flex-row md:flex-col h-full bg-white border border-3 border-primary rounded-2xl shadow-md overflow-hidden', className)}>
      {post.featuredImage && (
        <div className="relative overflow-hidden">
          <img
            src={post.featuredImage}
            alt={post.title}
            className="w-32 h-full md:w-full md:h-48 aspect-[4/5] md:aspect-video object-cover transition-transform duration-300 hover:scale-105"
            loading="lazy"
          />
        </div>
      )}
      <div className="px-6 pb-0 md:pb-3 flex flex-1 flex-col items-start gap-0 md:gap-3">
        <h2 className="text-md md:text-xl font-semibold text-gray-900 mt-3">
          <a
            href={href}
            className="transition-colors duration-200 focus:outline-none rounded"
            aria-label={`閱讀文章：${post.title}`}
          >
            {post.title}
          </a>
        </h2>
        <p className="text-sm md:text-md text-gray-600 line-clamp-3">
          {post.excerpt || post.description}
        </p>
        <div className="mt-auto mb-2 md:mb-0 flex w-full items-center justify-end md:justify-center font-bold text-xs md:text-md text-gray-50 whitespace-nowrap">
          <a
            href={href}
            className="rounded-full bg-primary py-1 px-3 md:py-2 md:px-6 hover:scale-105 hover:shadow-md focus:scale-105 focus:shadow-md transition-transform duration-300 inline-block text-center focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
            aria-label={`閱讀文章：${post.title}`}
          >
            閱讀更多⏵
          </a>
        </div>
      </div>
    </article>
  );
}

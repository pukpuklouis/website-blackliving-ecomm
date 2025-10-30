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
  const baseClasses = 'bg-white transition-shadow duration-300';
  const verticalBaseClasses =
    'flex flex-row md:flex-col md:h-full aspect-[7/3] md:aspect-[4/5] rounded-2xl overflow-hidden bg-white border-3 border-primary duration-300';

  if (variant === 'horizontal') {
    return (
      <article
        className={cn(baseClasses, 'flex flex-col sm:flex-row max-w-3xl mx-auto', className)}
      >
        {post.featuredImage && (
          <div className="rounded-xl sm:w-80 flex-shrink-0 overflow-hidden">
            <div className="bg-gradient-to-t from-gray-900 via-80% to-gray-800/0 z-10"></div>
            <img
              src={post.featuredImage}
              alt={post.title}
              className="w-full aspect-video md:aspect-[5/3] sm:h-full object-cover transition-transform duration-300 hover:scale-105"
              loading="lazy"
            />
          </div>
        )}
        <div className="p-2 pl-8 flex flex-1 flex-col justify-between">
          <h2 className="text-xl md:text-3xl font-semibold text-gray-900 mb-3">
            <a
              href={href}
              className="hover:text-primary line-clamp-2 transition-colors duration-200 focus:outline-none rounded"
              aria-label={`閱讀文章：${post.title}`}
            >
              {post.title}
            </a>
          </h2>
          <p className="text-lg md:text-xl text-gray-800 mb-4 line-clamp-3">
            {post.excerpt || post.description}
          </p>
          <div className="flex w-full flex-row items-center justify-end text-sm md:text-lg text-gray-700">
            <a href={href} className="" aria-label={`閱讀文章：${post.title}`}>
              繼續閱讀 →
            </a>
          </div>
        </div>
      </article>
    );
  }

  // Vertical variant (default)
  return (
    <article className={cn(verticalBaseClasses, className)}>
      {post.featuredImage && (
        <div className="relative overflow-hidden">
          <img
            src={post.featuredImage}
            alt={post.title}
            className="w-full h-full md:h-48 aspect-[4/5] md:aspect-video object-cover transition-transform duration-300 hover:scale-105"
            loading="lazy"
          />
        </div>
      )}
      <div className="px-6 pb-0 md:pb-6 flex flex-1 flex-col items-start gap-0 md:gap-3">
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
        <div className="mt-auto mb-2 flex w-full items-center justify-end font-bold text-sm md:text-md text-gray-50 whitespace-nowrap">
          <a href={href} aria-label={`閱讀文章：${post.title}`}>
            <div className="rounded-full bg-primary py-1 px-3 md:py-2 md:px-6 hover:scale-105 hover:shadow-md transition-transform duration-300">
              閱讀更多⏵
            </div>
          </a>
        </div>
      </div>
    </article>
  );
}

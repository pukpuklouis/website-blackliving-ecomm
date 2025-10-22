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
              className="w-full aspect-video md:aspect-[4/3] sm:h-full object-cover transition-transform duration-300 hover:scale-105"
              loading="lazy"
            />
          </div>
        )}
        <div className="p-2 pl-8 flex-1">
          <h2 className="text-xl md:text-3xl font-semibold text-gray-900 mb-3">
            <a
              href={href}
              className="hover:text-primary line-clamp-1 transition-colors duration-200 focus:outline-none rounded"
              aria-label={`閱讀文章：${post.title}`}
            >
              {post.title}
            </a>
          </h2>
          <p className="text-lg md:text-xl text-gray-800 mb-4 line-clamp-3">
            {post.excerpt || post.description}
          </p>
          <div className="flex w-full flex-row-reverse items-center justify-between text-sm md:text-lg text-gray-700">
            {/*<time dateTime={post.publishedAt}>
              {new Date(post.publishedAt).toLocaleDateString('zh-TW')}
            </time>*/}
            <a
              href={href}
              className="hover:text-primary transition-colors duration-200 focus:outline-none rounded"
              aria-label={`閱讀文章：${post.title}`}
            >
              繼續閱讀 →
            </a>
          </div>
        </div>
      </article>
    );
  }

  // Vertical variant (default)
  return (
    <article className={cn(baseClasses, className)}>
      {post.featuredImage && (
        <div className="relative overflow-hidden">
          <img
            src={post.featuredImage}
            alt={post.title}
            className="w-full h-48 aspect-video object-cover transition-transform duration-300 hover:scale-105"
            loading="lazy"
          />
        </div>
      )}
      <div className="p-6">
        <div className="flex items-center mb-3">
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-primary text-primary-foreground opacity-80">
            {post.category}
          </span>
        </div>
        <h2 className="text-xl font-semibold text-gray-900 mb-3">
          <a
            href={href}
            className="hover:text-blue-600 transition-colors duration-200 focus:outline-none rounded"
            aria-label={`閱讀文章：${post.title}`}
          >
            {post.title}
          </a>
        </h2>
        <p className="text-gray-600 mb-4 line-clamp-3">{post.excerpt || post.description}</p>
        <div className="flex items-center justify-between text-sm text-gray-500">
          <time dateTime={post.publishedAt}>
            {new Date(post.publishedAt).toLocaleDateString('zh-TW')}
          </time>
        </div>
      </div>
    </article>
  );
}

import { memo } from 'react';
import { cn } from '@blackliving/ui';
import type { BlogPostSummary } from '@blackliving/types';
import { OverlayContainer } from './OverlayContainer';

export interface BlogPostCardProps {
  post: BlogPostSummary;
  variant?: 'vertical' | 'horizontal';
  className?: string;
  href: string;
}

/**
 * Base CSS classes that are reused across variants
 * Extracted as constants to avoid string concatenation overhead
 */
const BASE_CLASSES = 'bg-white rounded-lg shadow-md overflow-hidden';
const FOCUS_RING_CLASSES =
  'focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2';

/**
 * BlogPostCard - Displays blog posts in card format
 *
 * Variants:
 * - horizontal: Wide layout with image on left, content on right
 * - vertical: Stacked layout, mobile-first responsive
 *
 * Performance Optimizations:
 * - React.memo prevents unnecessary re-renders
 * - Extracted CSS class constants
 * - Conditional rendering optimized
 * - Minimal inline computations
 *
 * Accessibility Features:
 * - Proper semantic HTML (article, h2 headings)
 * - ARIA labels for images and links
 * - Focus management for keyboard navigation
 * - Sufficient color contrast ratios (WCAG AA)
 * - Touch-friendly interactive areas
 */
export const BlogPostCard = memo(function BlogPostCard({
  post,
  variant = 'vertical',
  className,
  href,
}: BlogPostCardProps) {
  const formatPublishedAt = (val?: string) => {
    if (!val) return '';
    try {
      // Accept ISO string or epoch seconds (as string)
      let d: Date | null = null;
      if (/^\d+(\.\d+)?$/.test(val)) {
        const num = Number(val);
        const ms = num < 1e12 ? num * 1000 : num; // seconds vs ms
        d = new Date(ms);
      } else {
        const parsed = new Date(val);
        d = isNaN(parsed.getTime()) ? null : parsed;
      }
      if (!d) return '';
      return d.toLocaleDateString('zh-TW', { year: 'numeric', month: '2-digit', day: '2-digit' });
    } catch {
      return '';
    }
  };

  if (variant === 'horizontal') {
    return (
      <article
        className={cn(BASE_CLASSES, 'flex flex-row max-w-3xl mx-auto', className)}
        role="article"
      >
        {post.featuredImage && (
          <div
            className="relative w-[50%] md:w-[24rem] aspect-[15/9] flex-shrink-0 self-start overflow-hidden"
            role="img"
            aria-label={`${post.title} 的特色圖片`}
          >
            <img
              src={post.featuredImage}
              alt={`${post.title} 特色圖片`}
              className="absolute inset-0 w-full h-full object-cover transition-transform duration-300 hover:scale-105"
              loading="lazy"
              decoding="async"
            />
            {/* Overlay Text - Memoized component with optimized rendering */}
            <OverlayContainer
              settings={post.overlaySettings || {}}
              id={post.id ? `overlay-${post.id}` : undefined}
            />
          </div>
        )}
        <div className="p-2 px-4 md:px-4 md:py-3 flex flex-1 flex-col justify-center md:justify-between">
          <div>
            <h2 className="text-md md:text-2xl line-clamp-2 font-semibold text-gray-900 mb-0 md:mb-1">
              <a
                href={href}
                className={cn(
                  'hover:text-primary transition-colors duration-200 rounded'
                )}
                aria-label={`閱讀文章：${post.title}`}
              >
                {post.title}
              </a>
            </h2>
            <p className="text-sm md:text-lg text-gray-800 mb-1 md:mb-2 line-clamp-2 md:line-clamp-3">
              {post.excerpt || post.description}
            </p>
          </div>
          <div className="flex w-full items-center justify-end text-xs md:text-lg text-gray-700">
            <a
              href={href}
              className={cn('transition-colors duration-200 rounded px-1', FOCUS_RING_CLASSES)}
              aria-label={`閱讀完整文章：${post.title}`}
            >
              繼續閱讀 →
            </a>
          </div>
        </div>
      </article>
    );
  }

  // Vertical variant (Mobile to Horizontal)
  return (
    <article
      className={cn(
        'flex flex-row md:flex-col h-full bg-white border-3 border-primary rounded-2xl shadow-md overflow-hidden',
        className
      )}
      role="article"
    >
      {post.featuredImage && (
        <div
          className="relative overflow-hidden"
          role="img"
          aria-label={`${post.title} 的特色圖片`}
        >
          <img
            src={post.featuredImage}
            alt={`${post.title} 特色圖片`}
            className="w-32 h-full md:w-full md:h-48 aspect-[4/5] md:aspect-video object-cover transition-transform duration-300 hover:scale-105"
            loading="lazy"
            decoding="async"
          />
          {/* Overlay Text - REMOVED: Only horizontal variant supports overlay per design.md */}
        </div>
      )}
      <div className="px-6 pb-0 md:pb-3 flex flex-1 flex-col items-start gap-0 md:gap-3">
        <h2 className="text-md md:text-xl font-semibold text-gray-900 mt-3">
          <a
            href={href}
            className={cn('transition-colors duration-200 rounded px-1', FOCUS_RING_CLASSES)}
            aria-label={`閱讀文章：${post.title}`}
          >
            {post.title}
          </a>
        </h2>
        {post.publishedAt ? (
          <p className="text-md md:text-lg text-gray-500 -mt-3">
           {formatPublishedAt(post.publishedAt)}
          </p>
        ) : null}
        <p className="text-sm md:text-md text-gray-600 line-clamp-3">
          {post.excerpt || post.description}
        </p>
        <div className="mt-auto mb-2 md:mb-0 flex w-full items-center justify-end md:justify-center font-bold text-xs md:text-lg text-gray-50 whitespace-nowrap">
          <a
            href={href}
            className={cn(
              'rounded-full bg-primary py-1 px-3 md:py-2 md:px-6',
              'hover:scale-105 hover:shadow-md transition-transform duration-300 inline-block text-center',
              FOCUS_RING_CLASSES
            )}
            aria-label={`閱讀更多：${post.title}`}
          >
            閱讀更多⏵
          </a>
        </div>
      </div>
    </article>
  );
});

// Display name for React DevTools
BlogPostCard.displayName = 'BlogPostCard';

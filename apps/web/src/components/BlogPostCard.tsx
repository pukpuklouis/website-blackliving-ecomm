import type { BlogPostSummary } from "@blackliving/types";
import { cn } from "@blackliving/ui";
import { memo } from "react";
import { OverlayContainer } from "./OverlayContainer";

export interface BlogPostCardProps {
  post: BlogPostSummary;
  variant?: "vertical" | "horizontal";
  className?: string;
  href: string;
}

/**
 * Base CSS classes that are reused across variants
 * Extracted as constants to avoid string concatenation overhead
 */
const BASE_CLASSES = "bg-white rounded-lg shadow-md overflow-hidden";
const FOCUS_RING_CLASSES =
  "focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2";

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
  variant = "vertical",
  className,
  href,
}: BlogPostCardProps) {
  const formatPublishedAt = (val?: string) => {
    if (!val) return "";
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
      if (!d) return "";
      return d.toLocaleDateString("zh-TW", {
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
      });
    } catch {
      return "";
    }
  };

  if (variant === "horizontal") {
    return (
      <article
        className={cn(
          BASE_CLASSES,
          "mx-auto flex max-w-3xl flex-row",
          className
        )}
        role="article"
      >
        {post.featuredImage && (
          <div
            aria-label={`${post.title} 的特色圖片`}
            className="relative aspect-[15/9] w-[50%] flex-shrink-0 self-start overflow-hidden md:w-[24rem]"
            role="img"
          >
            <img
              alt={`${post.title} 特色圖片`}
              className="absolute inset-0 h-full w-full object-cover transition-transform duration-300 hover:scale-105"
              decoding="async"
              loading="lazy"
              src={post.featuredImage}
            />
            {/* Overlay Text - Memoized component with optimized rendering */}
            <OverlayContainer
              id={post.id ? `overlay-${post.id}` : undefined}
              settings={post.overlaySettings || {}}
            />
          </div>
        )}
        <div className="flex flex-1 flex-col justify-center p-2 px-4 md:justify-between md:px-4 md:py-3">
          <div>
            <h2 className="mb-0 line-clamp-2 font-semibold text-gray-900 text-md md:mb-1 md:text-2xl">
              <a
                aria-label={`閱讀文章：${post.title}`}
                className={cn(
                  "rounded transition-colors duration-200 hover:text-primary"
                )}
                href={href}
              >
                {post.title}
              </a>
            </h2>
            <p className="mb-1 line-clamp-2 text-gray-800 text-sm md:mb-2 md:line-clamp-3 md:text-lg">
              {post.excerpt || post.description}
            </p>
          </div>
          <div className="flex w-full items-center justify-end text-gray-700 text-xs md:text-lg">
            <a
              aria-label={`閱讀完整文章：${post.title}`}
              className={cn(
                "rounded px-1 transition-colors duration-200",
                FOCUS_RING_CLASSES
              )}
              href={href}
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
        "flex h-full flex-row overflow-hidden rounded-2xl border-3 border-primary bg-white shadow-md md:flex-col",
        className
      )}
      role="article"
    >
      {post.featuredImage && (
        <div
          aria-label={`${post.title} 的特色圖片`}
          className="relative overflow-hidden"
          role="img"
        >
          <img
            alt={`${post.title} 特色圖片`}
            className="aspect-[4/3] h-full w-48 object-cover transition-transform duration-300 hover:scale-105 md:aspect-video md:h-48 md:w-full"
            decoding="async"
            loading="lazy"
            src={post.featuredImage}
          />
          {/* Overlay Text - REMOVED: Only horizontal variant supports overlay per design.md */}
        </div>
      )}
      <div className="flex flex-1 flex-col items-start gap-0 px-3 pb-0 md:gap-3 md:px-6 md:pb-3">
        <h2 className="mt-3 font-semibold text-gray-900 text-md md:text-xl">
          <a
            aria-label={`閱讀文章：${post.title}`}
            className={cn(
              "line-clamp-1 rounded px-1 transition-colors duration-200 md:line-clamp-2",
              FOCUS_RING_CLASSES
            )}
            href={href}
          >
            {post.title}
          </a>
        </h2>
        {post.publishedAt ? (
          <p className="-mt-1 md:-mt-3 text-gray-500 text-sm md:text-lg">
            {formatPublishedAt(post.publishedAt)}
          </p>
        ) : null}
        <p className="line-clamp-2 text-gray-600 text-sm md:line-clamp-3 md:text-md">
          {post.excerpt || post.description}
        </p>
        <div className="mt-auto mb-2 flex w-full items-center justify-end whitespace-nowrap font-bold text-gray-50 text-xs md:mb-0 md:justify-center md:text-lg">
          <a
            aria-label={`閱讀更多：${post.title}`}
            className={cn(
              "rounded-full bg-primary px-3 py-1 md:px-6 md:py-2",
              "inline-block text-center transition-transform duration-300 hover:scale-105 hover:shadow-md",
              FOCUS_RING_CLASSES
            )}
            href={href}
          >
            閱讀更多⏵
          </a>
        </div>
      </div>
    </article>
  );
});

// Display name for React DevTools
BlogPostCard.displayName = "BlogPostCard";

import { cn } from "@blackliving/ui"

export interface BlogPost {
  slug: string
  title: string
  excerpt?: string
  description?: string
  featuredImage?: string
  category: string
  readingTime: string
  authorName: string
  publishedAt: string
}

export interface BlogPostCardProps {
  post: BlogPost
  variant?: "vertical" | "horizontal"
  className?: string
}

export function BlogPostCard({ 
  post, 
  variant = "vertical", 
  className 
}: BlogPostCardProps) {
  const baseClasses = "bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow duration-300"
  
  if (variant === "horizontal") {
    return (
      <article className={cn(baseClasses, "flex flex-col sm:flex-row", className)}>
        {post.featuredImage && (
          <div className="sm:w-80 flex-shrink-0">
            <img 
              src={post.featuredImage} 
              alt={post.title} 
              className="w-full h-48 sm:h-full object-cover transition-transform duration-300 hover:scale-105" 
              loading="lazy"
            />
          </div>
        )}
        <div className="p-6 flex-1">
          <div className="flex items-center mb-3">
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-primary text-forwardground">
              {post.category}
            </span>
            <span className="ml-2 text-sm text-gray-500">{post.readingTime} 分鐘閱讀</span>
          </div>
          <h2 className="text-xl font-semibold text-gray-900 mb-3">
            <a 
              href={`/posts/${post.slug}`} 
              className="hover:text-blue-600 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 rounded"
              aria-label={`閱讀文章：${post.title}`}
            >
              {post.title}
            </a>
          </h2>
          <p className="text-gray-600 mb-4 line-clamp-3">
            {post.excerpt || post.description}
          </p>
          <div className="flex items-center justify-between text-sm text-gray-500">
            <span>作者：{post.authorName}</span>
            <time dateTime={post.publishedAt}>
              {new Date(post.publishedAt).toLocaleDateString('zh-TW')}
            </time>
          </div>
        </div>
      </article>
    )
  }

  // Vertical variant (default)
  return (
    <article className={cn(baseClasses, className)}>
      {post.featuredImage && (
        <div className="relative overflow-hidden">
          <img 
            src={post.featuredImage} 
            alt={post.title} 
            className="w-full h-48 object-cover transition-transform duration-300 hover:scale-105" 
            loading="lazy"
          />
        </div>
      )}
      <div className="p-6">
        <div className="flex items-center mb-3">
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
            {post.category}
          </span>
          <span className="ml-2 text-sm text-gray-500">{post.readingTime} 分鐘閱讀</span>
        </div>
        <h2 className="text-xl font-semibold text-gray-900 mb-3">
          <a 
            href={`/posts/${post.slug}`} 
            className="hover:text-blue-600 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 rounded"
            aria-label={`閱讀文章：${post.title}`}
          >
            {post.title}
          </a>
        </h2>
        <p className="text-gray-600 mb-4 line-clamp-3">
          {post.excerpt || post.description}
        </p>
        <div className="flex items-center justify-between text-sm text-gray-500">
          <span>作者：{post.authorName}</span>
          <time dateTime={post.publishedAt}>
            {new Date(post.publishedAt).toLocaleDateString('zh-TW')}
          </time>
        </div>
      </div>
    </article>
  )
}
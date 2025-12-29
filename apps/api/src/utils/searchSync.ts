import type { pages, posts, products } from "@blackliving/db";
import type { SearchContentType, SearchDocument } from "@blackliving/types";

// Type definitions for database rows
type ProductRow = typeof products.$inferSelect & {
  images?: string[] | string | null;
  variants?: any[] | null;
  features?: string[] | null;
};

type PostRow = typeof posts.$inferSelect & {
  category?: string | null;
  tags?: string[] | null;
  authorName?: string | null;
};

type PageRow = typeof pages.$inferSelect;

/**
 * Search sync utilities for transforming content into MeiliSearch document format
 * Handles content extraction, sanitization, and document structure conversion
 */

// Product type from database schema
type ProductRow = typeof products.$inferSelect & {
  images?: string[] | string | null;
  variants?: any[] | null;
  features?: string[] | null;
};

// Post type from database schema
type PostRow = typeof posts.$inferSelect & {
  category?: string | null;
  tags?: string[] | null;
  authorName?: string | null;
};

// Page type from database schema
type PageRow = typeof pages.$inferSelect;

/**
 * Convert text to URL-friendly segment
 */
function toUrlSegment(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\u4e00-\u9fa5]+/g, "-") // Allow Chinese characters
    .replace(/(^-|-$)/g, "");
}

/**
 * Transform a product into a MeiliSearch document
 */
export function transformProduct(product: ProductRow): SearchDocument {
  if (!product) {
    throw new Error("Product data is null or undefined");
  }

  // Extract first image from images array or string
  let image: string | undefined;
  if (Array.isArray(product.images) && product.images.length > 0) {
    image = product.images[0];
  } else if (typeof product.images === "string") {
    try {
      const parsed = JSON.parse(product.images);
      if (Array.isArray(parsed) && parsed.length > 0) {
        image = parsed[0];
      }
    } catch (error) {
      // If parsing fails, use as-is or set to undefined
      console.warn("Failed to parse product images JSON for search sync");
    }
  }

  // Extract price from variants
  let price: number | undefined;
  if (Array.isArray(product.variants) && product.variants.length > 0) {
    const firstVariant = product.variants[0];
    if (
      typeof firstVariant === "object" &&
      firstVariant &&
      "price" in firstVariant
    ) {
      price =
        typeof firstVariant.price === "number" ? firstVariant.price : undefined;
    }
  }

  // Ensure features is an array
  const tags = Array.isArray(product.features) ? product.features : [];
  const categorySegment = product.category
    ? toUrlSegment(product.category)
    : "uncategorized";

  // Ensure title is present
  const title = product.name || product.slug || "Untitled Product";

  return {
    id: `product_${product.id}`,
    type: "product",
    title,
    slug: product.slug,
    href: `/shop/${categorySegment}/${product.slug}`,
    description: product.description || "",
    content: product.description || "", // Use description as searchable content
    image,
    category: product.category || undefined,
    tags,
    updatedAt: product.updatedAt?.toISOString() || new Date().toISOString(),
    price,
    inStock: product.inStock,
  };
}

/**
 * Transform a blog post into a MeiliSearch document
 */
export function transformPost(post: PostRow): SearchDocument {
  if (!post) {
    throw new Error("Post data is null or undefined");
  }

  // Strip HTML from content for search
  const cleanContent = stripHtml(post.content || "");

  // Extract tags
  const tags = Array.isArray(post.tags) ? post.tags : [];
  const categorySegment = post.category
    ? toUrlSegment(post.category)
    : "uncategorized";

  return {
    id: `post_${post.id}`,
    type: "post",
    title: post.title,
    slug: post.slug,
    href: `/blog/${categorySegment}/${post.slug}`,
    description: post.excerpt || truncateText(cleanContent, 200),
    content: cleanContent,
    image: post.featuredImage || undefined,
    category: post.category || undefined,
    tags,
    updatedAt: post.updatedAt?.toISOString() || new Date().toISOString(),
    published: post.status === "published",
    author: post.authorName || undefined,
  };
}

/**
 * Transform a static page into a MeiliSearch document
 */
export function transformPage(page: PageRow): SearchDocument {
  if (!page) {
    throw new Error("Page data is null or undefined");
  }

  // Strip HTML from content for search
  const contentString =
    typeof page.content === "string"
      ? page.content
      : page.contentMarkdown || "";
  const cleanContent = stripHtml(contentString);

  return {
    id: `page_${page.id}`,
    type: "page",
    title: page.title,
    slug: page.slug,
    href: `/${page.slug}`,
    description: truncateText(cleanContent, 200),
    content: cleanContent,
    image: page.featuredImage || undefined,
    category: "page",
    tags: [],
    updatedAt: page.updatedAt?.toISOString() || new Date().toISOString(),
    published: page.publishedAt ? true : false,
  };
}

/**
 * Generic document transformer that determines type and applies appropriate transformation
 */
export function transformDocument(
  type: SearchContentType,
  data: any
): SearchDocument | null {
  try {
    if (!data) {
      console.warn(
        `Attempted to transform null/undefined data for type: ${type}`
      );
      return null;
    }

    switch (type) {
      case "product":
        return transformProduct(data as ProductRow);
      case "post":
        return transformPost(data as PostRow);
      case "page":
        return transformPage(data as PageRow);
      default:
        console.warn(`Unknown document type for transformation: ${type}`);
        return null;
    }
  } catch (error) {
    console.error(`Failed to transform ${type} document:`, error);
    // Log the data that caused the error for debugging (be careful with PII)
    try {
      console.error(
        "Problematic data:",
        JSON.stringify(data).substring(0, 200) + "..."
      );
    } catch (e) {
      // Ignore JSON stringify errors
    }
    return null;
  }
}

/**
 * Batch transform multiple documents of the same type
 */
export function transformDocuments(
  type: SearchContentType,
  documents: any[]
): SearchDocument[] {
  return documents
    .map((doc) => transformDocument(type, doc))
    .filter((doc): doc is SearchDocument => doc !== null);
}

/**
 * Strip HTML tags from content while preserving text
 */
export function stripHtml(html: string): string {
  if (!html) return "";

  // Remove HTML tags
  const withoutTags = html.replace(/<[^>]*>/g, " ");

  // Decode HTML entities
  const decoded = decodeHtmlEntities(withoutTags);

  // Normalize whitespace
  return decoded.replace(/\s+/g, " ").trim();
}

/**
 * Decode common HTML entities
 */
function decodeHtmlEntities(text: string): string {
  const entities: Record<string, string> = {
    "&": "&",
    "<": "<",
    ">": ">",
    '"': '"',
    "&apos;": "'",
    "&nbsp;": " ",
    "&copy;": "©",
    "&reg;": "®",
    "&trade;": "™",
    "&hellip;": "…",
    "&mdash;": "—",
    "&ndash;": "–",
    "&lsquo;": "'",
    "&rsquo;": "'",
    "&ldquo;": '"',
    "&rdquo;": '"',
  };

  let decoded = text;
  for (const [entity, replacement] of Object.entries(entities)) {
    decoded = decoded.replace(new RegExp(entity, "g"), replacement);
  }

  return decoded;
}

/**
 * Truncate text to a specific length with ellipsis
 */
export function truncateText(text: string, maxLength: number): string {
  if (!text || text.length <= maxLength) return text;
  return text.slice(0, maxLength - 1) + "…";
}

/**
 * Extract keywords from content for enhanced search
 */
export function extractKeywords(content: string, maxKeywords = 10): string[] {
  if (!content) return [];

  // Remove punctuation and split into words
  const words = content
    .toLowerCase()
    .replace(/[^\w\s\u4e00-\u9fff]/g, " ")
    .split(/\s+/)
    .filter((word) => word.length > 2) // Filter out very short words
    .filter((word) => !isStopWord(word)); // Filter out common stop words

  // Count word frequency
  const wordCount: Record<string, number> = {};
  words.forEach((word) => {
    wordCount[word] = (wordCount[word] || 0) + 1;
  });

  // Sort by frequency and return top keywords
  return Object.entries(wordCount)
    .sort(([, a], [, b]) => b - a)
    .slice(0, maxKeywords)
    .map(([word]) => word);
}

/**
 * Check if a word is a common stop word
 */
function isStopWord(word: string): boolean {
  const stopWords = new Set([
    "the",
    "a",
    "an",
    "and",
    "or",
    "but",
    "in",
    "on",
    "at",
    "to",
    "for",
    "of",
    "with",
    "by",
    "is",
    "are",
    "was",
    "were",
    "be",
    "been",
    "being",
    "have",
    "has",
    "had",
    "do",
    "does",
    "did",
    "will",
    "would",
    "could",
    "should",
    "may",
    "might",
    "must",
    "can",
    "this",
    "that",
    "these",
    "those",
    "i",
    "you",
    "he",
    "she",
    "it",
    "we",
    "they",
    "me",
    "him",
    "her",
    "us",
    "them",
    "my",
    "your",
    "his",
    "its",
    "our",
    "their",
    "what",
    "which",
    "who",
    "when",
    "where",
    "why",
    "how",
    "all",
    "any",
    "both",
    "each",
    "few",
    "more",
    "most",
    "other",
    "some",
    "such",
    "no",
    "nor",
    "not",
    "only",
    "own",
    "same",
    "so",
    "than",
    "too",
    "very",
    // Chinese stop words
    "的",
    "了",
    "和",
    "是",
    "就",
    "都",
    "而",
    "及",
    "與",
    "著",
    "或",
    "一個",
    "沒有",
    "我們",
    "你們",
  ]);

  return stopWords.has(word);
}

/**
 * Validate a transformed document before indexing
 */
export function validateDocument(doc: SearchDocument): {
  isValid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  if (!doc.id) errors.push("Document ID is required");
  if (!doc.type) errors.push("Document type is required");
  if (!doc.title) errors.push("Document title is required");
  if (!doc.slug) errors.push("Document slug is required");
  if (!doc.updatedAt) errors.push("Document updatedAt is required");

  // Validate ID format
  if (doc.id && !doc.id.includes("_")) {
    errors.push("Document ID must be in format: {type}_{id}");
  }

  // Validate type matches ID prefix
  if (doc.id && doc.type) {
    const expectedPrefix = `${doc.type}_`;
    if (!doc.id.startsWith(expectedPrefix)) {
      errors.push(
        `Document ID should start with "${expectedPrefix}" for type "${doc.type}"`
      );
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

/**
 * Sanitize document content for search indexing
 */
export function sanitizeForSearch(content: string): string {
  if (!content) return "";

  return (
    content
      .trim()
      // Remove excessive whitespace
      .replace(/\s+/g, " ")
      // Remove control characters
      .replace(/[\x00-\x1F\x7F]/g, "")
      // Limit length to prevent indexing issues
      .slice(0, 10_000)
  );
}

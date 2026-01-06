/**
 * Shared TypeScript interfaces for MeiliSearch integration
 * Ensures type safety across frontend, backend, and admin applications
 */

// Content types that can be indexed in MeiliSearch
export type SearchContentType = "product" | "post" | "page";

// MeiliSearch document structure for unified search
export interface SearchDocument {
  // Unique identifier combining type and ID (e.g., "product_123", "post_456")
  id: string;

  // Content type discriminator
  type: SearchContentType;

  // Core content fields
  title: string;
  slug: string;
  description: string;
  content: string; // Full searchable content (HTML stripped)
  href?: string; // Navigation URL path

  // Optional media
  image?: string;

  // Categorization
  category?: string;
  tags: string[];

  // Metadata
  updatedAt: string;

  // Type-specific fields
  // Product fields
  price?: number;
  inStock?: boolean;

  // Content fields
  published?: boolean;
  author?: string;
}

// MeiliSearch configuration
export interface SearchConfig {
  host: string; // MeiliSearch server URL
  masterKey: string; // Admin key for indexing operations
  searchKey?: string; // Public key for search operations (generated from master key)
  indexName: string; // Index name (default: 'blackliving_content')
}

// Search query parameters
export interface SearchQuery {
  q: string; // Search query string
  types?: SearchContentType[]; // Content types to search (optional)
  category?: string; // Category filter (optional)
  limit?: number; // Results limit (default: 5)
  includeContent?: boolean; // Include full content in results (default: false)
}

// Unified search result structure
export interface SearchResult {
  id: string;
  title: string;
  description: string;
  category: string | null;
  slug: string;
  href: string;
  type: SearchContentType;
  thumbnail: string | null;
  metadata?: Record<string, any>;
}

// Unified search response
export interface UnifiedSearchResponse {
  query: string;
  results: {
    products: SearchResult[];
    posts: SearchResult[];
    pages: SearchResult[];
  };
  total: number;
  took: number; // Response time in milliseconds
  cached?: boolean; // Whether result came from cache
}

// Search analytics event types
export type SearchAnalyticsEventType =
  | "search_query"
  | "search_result_click"
  | "search_no_results"
  | "search_error";

// Search analytics event
export interface SearchAnalyticsEvent {
  id: string;
  type: SearchAnalyticsEventType;
  timestamp: string;
  userId?: string; // Anonymous user ID
  sessionId?: string; // Session identifier
  query?: string; // Search query (for query events)
  resultId?: string; // Clicked result ID
  resultType?: SearchContentType; // Clicked result type
  position?: number; // Position in results (1-based)
  filters?: Record<string, any>; // Applied filters
  metadata?: Record<string, any>; // Additional event data
}

// API response types for search endpoints
export interface SearchApiSuccess<T = any> {
  success: true;
  data: T;
  message?: string;
}

export interface SearchApiError {
  success: false;
  error: string;
  message?: string;
}

export type SearchApiResponse<T = any> = SearchApiSuccess<T> | SearchApiError;

// Reindex operation result
export interface ReindexResult {
  indexed: number; // Number of documents successfully indexed
  errors: string[]; // List of error messages
  message: string; // Human-readable summary
}

// Search configuration validation
export interface SearchConfigValidation {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

// Search health check result
export interface SearchHealthStatus {
  status: "healthy" | "degraded" | "unhealthy";
  message: string;
  configValid: boolean;
  indexExists: boolean;
  documentCount?: number;
  lastIndexed?: string;
}

// Search performance metrics
export interface SearchPerformanceMetrics {
  averageResponseTime: number; // Average query response time in ms
  queriesPerSecond: number; // Query throughput
  cacheHitRate: number; // Cache effectiveness (0-1)
  errorRate: number; // Query error rate (0-1)
  indexSize: number; // Index size in bytes
  lastUpdated: string; // When metrics were last calculated
}

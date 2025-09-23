export type SearchResultType = 'product' | 'post' | 'page';

export interface BaseSearchResult {
  id: string;
  title: string;
  description?: string | null;
  category?: string | null;
  slug: string;
  href: string;
  type: SearchResultType;
  thumbnail?: string | null;
  score?: number;
  metadata?: Record<string, unknown> | null;
}

export interface ProductSearchResult extends BaseSearchResult {
  type: 'product';
  category: string;
  priceRange?: {
    min: number;
    max: number;
  } | null;
  inStock?: boolean;
}

export interface PostSearchResult extends BaseSearchResult {
  type: 'post';
  publishedAt?: string | null;
  readingTime?: number | null;
}

export interface PageSearchResult extends BaseSearchResult {
  type: 'page';
}

export type UnifiedSearchResult = ProductSearchResult | PostSearchResult | PageSearchResult;

export interface SearchResultSections {
  products: ProductSearchResult[];
  posts: PostSearchResult[];
  pages: PageSearchResult[];
}

export interface SearchQueryOptions {
  query: string;
  types?: SearchResultType[];
  category?: string;
  limit?: number;
  includeContent?: boolean;
}

export interface UnifiedSearchResponse {
  query: string;
  total: number;
  took: number;
  results: SearchResultSections;
  cached?: boolean;
}

export interface UnifiedSearchApiResponse {
  success: boolean;
  data?: UnifiedSearchResponse;
  error?: string;
  message?: string;
}

export interface RecentSearchEntry {
  id: string;
  query: string;
  executedAt: string;
}

export interface SearchAnalyticsEvent {
  query: string;
  resultCount: number;
  clickedResultId?: string;
  clickedResultType?: SearchResultType;
  timestamp: string;
}

import { MeiliSearch } from 'meilisearch';
import type {
  SearchQueryOptions,
  UnifiedSearchResponse,
  UnifiedSearchResult,
} from '@blackliving/types/search';

interface MeiliSearchServiceConfig {
  host: string;
  apiKey: string;
  indexName: string;
}

class MeiliSearchService {
  private client: MeiliSearch | null = null;
  private config: MeiliSearchServiceConfig | null = null;
  private initialized = false;

  async initialize(): Promise<void> {
    if (this.initialized) return;

    try {
      // Get API URL from environment variables
      const candidates: unknown[] = [
        import.meta.env.PUBLIC_API_BASE_URL,
        import.meta.env.PUBLIC_API_URL,
      ];

      if (typeof globalThis !== 'undefined') {
        const runtimeEnv =
          (globalThis as Record<string, unknown>).ENV ??
          (globalThis as Record<string, unknown>).__ENV__ ??
          (globalThis as Record<string, unknown>).__ENV;

        if (runtimeEnv && typeof runtimeEnv === 'object') {
          const envRecord = runtimeEnv as Record<string, unknown>;
          candidates.push(envRecord.PUBLIC_API_BASE_URL);
          candidates.push(envRecord.PUBLIC_API_URL);
        }
      }

      const apiUrl = candidates.reduce<string>((acc, candidate) => {
        if (acc) return acc;
        if (typeof candidate === 'string') {
          const trimmed = candidate.trim();
          if (trimmed) {
            return trimmed.endsWith('/') ? trimmed.slice(0, -1) : trimmed;
          }
        }
        return acc;
      }, '');

      if (!apiUrl) {
        throw new Error('PUBLIC_API_URL is not configured');
      }

      // Get search key from API
      const response = await fetch(`${apiUrl}/api/search/keys`);
      if (!response.ok) {
        throw new Error('Failed to fetch search configuration');
      }

      const data = await response.json();
      if (!data.success || !data.data) {
        throw new Error('Invalid search configuration response');
      }

      this.config = {
        host: data.data.host,
        apiKey: data.data.searchKey,
        indexName: data.data.indexName || 'blackliving_content',
      };

      this.client = new MeiliSearch({
        host: this.config.host,
        apiKey: this.config.apiKey,
      });

      this.initialized = true;
    } catch (error) {
      console.warn('Failed to initialize MeiliSearch client:', error);
      // Don't throw - allow graceful degradation
    }
  }

  async search(
    options: SearchQueryOptions & { signal?: AbortSignal }
  ): Promise<UnifiedSearchResponse> {
    if (!this.client) {
      await this.initialize();
    }

    if (!this.client || !this.config) {
      // Fallback to API-based search if MeiliSearch is not available
      console.warn('MeiliSearch not available, falling back to API search');
      const { fetchUnifiedSearch } = await import('./searchService');
      return fetchUnifiedSearch(options);
    }

    try {
      const trimmedQuery = options.query.trim();
      if (!trimmedQuery) {
        throw new Error('Search query cannot be empty');
      }

      // Build search parameters
      const searchParams: any = {
        q: trimmedQuery,
        limit: options.limit || 20,
        offset: options.offset || 0,
      };

      // Add filters based on options
      const filters: string[] = [];

      if (options.types && options.types.length > 0) {
        filters.push(`type IN [${options.types.map((t) => `"${t}"`).join(', ')}]`);
      }

      if (options.category) {
        filters.push(`category = "${options.category}"`);
      }

      if (filters.length > 0) {
        searchParams.filter = filters;
      }

      // Search across the single index
      const index = this.client.index(this.config.indexName);
      const searchResult = await index.search(searchParams.q, searchParams);

      // Transform results to expected format
      const transformToSearchResult = (hit: any): UnifiedSearchResult => ({
        id: hit.id,
        title: hit.title,
        description: hit.description,
        category: hit.category || null,
        slug: hit.slug,
        href:
          hit.href ||
          `/${hit.type === 'product' ? 'products' : hit.type === 'post' ? 'blog' : 'pages'}/${hit.slug}`,
        type: hit.type,
        thumbnail: hit.image || null,
        metadata: {
          tags: hit.tags || [],
          updatedAt: hit.updatedAt,
          ...(hit.price && { price: hit.price }),
          ...(hit.inStock !== undefined && { inStock: hit.inStock }),
          ...(hit.author && { author: hit.author }),
        },
      });

      const allResults = searchResult.hits.map(transformToSearchResult);

      // Redistribute results back to categories
      const finalProducts = allResults.filter((r) => r.type === 'product');
      const finalPosts = allResults.filter((r) => r.type === 'post');
      const finalPages = allResults.filter((r) => r.type === 'page');

      return {
        query: trimmedQuery,
        results: {
          products: finalProducts,
          posts: finalPosts,
          pages: finalPages,
        },
        total: searchResult.estimatedTotalHits || allResults.length,
        took: searchResult.processingTimeMs,
      };
    } catch (error) {
      console.error('MeiliSearch query failed:', error);
      if (error instanceof Error) {
        console.error('Error details:', {
          message: error.message,
          stack: error.stack,
          name: error.name,
        });
      }

      // Fallback to API-based search
      console.warn('Falling back to API search due to MeiliSearch error');
      const { fetchUnifiedSearch } = await import('./searchService');
      return fetchUnifiedSearch(options);
    }
  }

  // Health check method
  async healthCheck(): Promise<boolean> {
    if (!this.client) {
      await this.initialize();
    }

    if (!this.client) {
      return false;
    }

    try {
      await this.client.health();
      return true;
    } catch {
      return false;
    }
  }
}

// Export singleton instance
export const meiliSearchService = new MeiliSearchService();
export default meiliSearchService;

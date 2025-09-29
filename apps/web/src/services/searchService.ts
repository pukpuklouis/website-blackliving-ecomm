import type {
  SearchQueryOptions,
  UnifiedSearchApiResponse,
  UnifiedSearchResponse,
} from '@blackliving/types/search';

interface SearchRequestOptions extends SearchQueryOptions {
  signal?: AbortSignal;
}

const DEFAULT_LIMIT = 8;

export async function fetchUnifiedSearch(
  options: SearchRequestOptions
): Promise<UnifiedSearchResponse> {
  const params = new URLSearchParams();
  const trimmedQuery = options.query.trim();

  if (!trimmedQuery) {
    throw new Error('Search query cannot be empty');
  }

  params.set('q', trimmedQuery);
  params.set('limit', String(options.limit ?? DEFAULT_LIMIT));

  if (options.types && options.types.length > 0) {
    for (const type of options.types) {
      params.append('types', type);
    }
  }

  if (options.category) {
    params.set('category', options.category);
  }

  if (options.includeContent) {
    params.set('includeContent', 'true');
  }

  const candidates: unknown[] = [
    import.meta.env.PUBLIC_API_BASE_URL,
    import.meta.env.PUBLIC_API_URL,
  ];

  if (typeof process !== 'undefined') {
    candidates.push(process.env?.PUBLIC_API_BASE_URL);
    candidates.push(process.env?.PUBLIC_API_URL);
  }

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

  const apiBaseFromEnv = candidates.reduce<string>((acc, candidate) => {
    if (acc) return acc;
    if (typeof candidate === 'string') {
      const trimmed = candidate.trim();
      if (trimmed) {
        return trimmed.endsWith('/') ? trimmed.slice(0, -1) : trimmed;
      }
    }
    return acc;
  }, '');

  const searchEndpoint = apiBaseFromEnv ? `${apiBaseFromEnv}/api/search` : '/api/search';

  const response = await fetch(`${searchEndpoint}?${params.toString()}`, {
    method: 'GET',
    signal: options.signal,
    headers: {
      Accept: 'application/json',
    },
  });

  if (!response.ok) {
    throw new Error(`Search request failed with status ${response.status}`);
  }

  const data = (await response.json()) as UnifiedSearchApiResponse;

  if (!data.success || !data.data) {
    throw new Error(data.error || 'Search request failed');
  }

  return data.data;
}

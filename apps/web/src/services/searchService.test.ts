import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { fetchUnifiedSearch } from './searchService';

const originalFetch = globalThis.fetch;

const createMockResponse = () => ({
  ok: true,
  status: 200,
  json: async () => ({
    success: true,
    data: {
      query: 'Simmons',
      results: {
        products: [],
        posts: [],
        pages: [],
      },
      total: 0,
      took: 0,
    },
  }),
});

describe('fetchUnifiedSearch', () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  afterEach(() => {
    globalThis.fetch = originalFetch;
    vi.unstubAllEnvs();
    // eslint-disable-next-line @typescript-eslint/no-dynamic-delete
    delete (globalThis as Record<string, unknown>).ENV;
    // eslint-disable-next-line @typescript-eslint/no-dynamic-delete
    delete (globalThis as Record<string, unknown>).__ENV__;
  });

  it('uses PUBLIC_API_BASE_URL when provided', async () => {
    vi.stubEnv('PUBLIC_API_BASE_URL', 'https://api.example.com/');

    const mockFetch = vi.fn().mockResolvedValue(createMockResponse());
    globalThis.fetch = mockFetch as unknown as typeof fetch;

    await fetchUnifiedSearch({ query: 'Simmons', limit: 5 });

    expect(mockFetch).toHaveBeenCalledWith(
      'https://api.example.com/api/search?q=Simmons&limit=5',
      expect.objectContaining({
        method: 'GET',
        headers: { Accept: 'application/json' },
      })
    );
  });

  it('falls back to relative path when no base URL is configured', async () => {
    const mockFetch = vi.fn().mockResolvedValue(createMockResponse());
    globalThis.fetch = mockFetch as unknown as typeof fetch;

    await fetchUnifiedSearch({ query: 'Simmons' });

    expect(mockFetch).toHaveBeenCalledWith(
      '/api/search?q=Simmons&limit=8',
      expect.objectContaining({
        method: 'GET',
        headers: { Accept: 'application/json' },
      })
    );
  });

  it('reads runtime ENV configuration when available', async () => {
    (globalThis as Record<string, unknown>).ENV = {
      PUBLIC_API_BASE_URL: 'https://runtime.example.com',
    };

    const mockFetch = vi.fn().mockResolvedValue(createMockResponse());
    globalThis.fetch = mockFetch as unknown as typeof fetch;

    await fetchUnifiedSearch({ query: 'Simmons', types: ['products'] });

    expect(mockFetch).toHaveBeenCalledWith(
      'https://runtime.example.com/api/search?q=Simmons&limit=8&types=products',
      expect.objectContaining({
        method: 'GET',
        headers: { Accept: 'application/json' },
      })
    );
  });
});


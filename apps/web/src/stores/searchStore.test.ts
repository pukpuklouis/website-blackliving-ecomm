import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import { webcrypto } from 'node:crypto';

import { useSearchStore, resetSearchStoreState } from './searchStore';
import type { SearchResultSections } from '@blackliving/types/search';
import { fetchUnifiedSearch } from '../services/searchService';

vi.mock('../services/searchService', () => ({
  fetchUnifiedSearch: vi.fn(),
}));

const mockFetch = fetchUnifiedSearch as unknown as vi.Mock;

class LocalStorageMock {
  private store = new Map<string, string>();

  getItem(key: string) {
    return this.store.has(key) ? this.store.get(key)! : null;
  }

  setItem(key: string, value: string) {
    this.store.set(key, value);
  }

  removeItem(key: string) {
    this.store.delete(key);
  }

  clear() {
    this.store.clear();
  }
}

describe('searchStore', () => {
  beforeAll(() => {
    if (!globalThis.crypto) {
      // @ts-expect-error assigning webcrypto for tests
      globalThis.crypto = webcrypto;
    }
  });

  beforeEach(() => {
    // @ts-expect-error override for tests
    globalThis.localStorage = new LocalStorageMock();
    mockFetch.mockReset();
    resetSearchStoreState();
  });

  afterEach(() => {
    resetSearchStoreState();
  });

  it('toggles modal visibility', () => {
    const { openModal, closeModal } = useSearchStore.getState();
    openModal();
    expect(useSearchStore.getState().isOpen).toBe(true);
    closeModal();
    expect(useSearchStore.getState().isOpen).toBe(false);
  });

  it('adds recent searches and removes duplicates', () => {
    const { addRecent } = useSearchStore.getState();
    addRecent('Simmons');
    addRecent('Simmons');
    addRecent('Foam');

    const entries = useSearchStore.getState().recent;
    expect(entries).toHaveLength(2);
    expect(entries[0].query).toBe('Foam');
  });

  it('hydrates recent searches from localStorage once', () => {
    const stored = [
      { id: '1', query: 'Simmons', executedAt: new Date().toISOString() },
    ];
    globalThis.localStorage.setItem('blackliving:search:recent', JSON.stringify(stored));

    const { hydrate } = useSearchStore.getState();
    hydrate();
    expect(useSearchStore.getState().recent).toHaveLength(1);

    globalThis.localStorage.setItem('blackliving:search:recent', '[]');
    hydrate(); // second call should be ignored
    expect(useSearchStore.getState().recent).toHaveLength(1);
  });

  it('clears results when query is empty', async () => {
    const { setQuery, search } = useSearchStore.getState();
    setQuery('');
    await search();
    const state = useSearchStore.getState();
    expect(state.results.products).toHaveLength(0);
    expect(state.lastFetchedQuery).toBeNull();
  });

  it('performs search and stores results', async () => {
    const mockResults: SearchResultSections = {
      products: [
        {
          id: 'prod-1',
          title: 'Simmons Black',
          description: 'Premium mattress',
          category: 'simmons-black',
          slug: 'simmons-black',
          href: '/simmons-black/simmons-black',
          type: 'product',
          thumbnail: null,
          metadata: null,
        },
      ],
      posts: [],
      pages: [],
    };

    mockFetch.mockResolvedValue({
      query: 'Simmons',
      results: mockResults,
      total: 1,
      took: 20,
    });

    useSearchStore.setState({ query: 'Simmons' });
    await useSearchStore.getState().search();

    const state = useSearchStore.getState();
    expect(mockFetch).toHaveBeenCalledTimes(1);
    expect(state.results.products).toHaveLength(1);
    expect(state.isLoading).toBe(false);
    expect(state.error).toBeNull();
  });

  it('records error when search fails', async () => {
    mockFetch.mockRejectedValue(new Error('Network error'));

    useSearchStore.setState({ query: 'Simmons' });
    await useSearchStore.getState().search();

    const { error, isLoading } = useSearchStore.getState();
    expect(isLoading).toBe(false);
    expect(error).toContain('Network error');
  });
});

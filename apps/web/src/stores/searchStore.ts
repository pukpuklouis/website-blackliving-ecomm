import type {
  RecentSearchEntry,
  SearchResultSections,
  UnifiedSearchResult,
} from "@blackliving/types/search";
import { create } from "zustand";
import { analyticsService } from "../services/analyticsService";
import { meiliSearchService } from "../services/meiliSearchService";

const RECENT_STORAGE_KEY = "blackliving:search:recent";
const MAX_RECENT_ITEMS = 8;

const EMPTY_RESULTS = (): SearchResultSections => ({
  products: [],
  posts: [],
  pages: [],
});

type SearchTypeFilter = "product" | "post" | "page";

type SearchOptions = {
  query?: string;
  types?: SearchTypeFilter[];
  includeContent?: boolean;
};

interface SearchStoreState {
  isOpen: boolean;
  query: string;
  results: SearchResultSections;
  isLoading: boolean;
  error: string | null;
  recent: RecentSearchEntry[];
  hasHydrated: boolean;
  lastFetchedQuery: string | null;
  abortController: AbortController | null;

  openModal: () => void;
  closeModal: () => void;
  toggleModal: () => void;
  setQuery: (value: string) => void;
  clearResults: () => void;
  hydrate: () => void;
  addRecent: (query: string) => void;
  removeRecent: (id: string) => void;
  registerResultClick: (result: UnifiedSearchResult, position?: number) => void;
  search: (options?: SearchOptions) => Promise<void>;
  setLoading: (loading: boolean) => void;
  setError: (message: string | null) => void;
}

function loadRecentEntries(): RecentSearchEntry[] {
  const storage = (globalThis as typeof globalThis & { localStorage?: Storage })
    .localStorage;
  if (!storage) return [];

  try {
    const raw = storage.getItem(RECENT_STORAGE_KEY);
    if (!raw) return [];

    const parsed = JSON.parse(raw) as RecentSearchEntry[];
    if (!Array.isArray(parsed)) return [];

    return parsed
      .filter(
        (entry) =>
          typeof entry?.id === "string" && typeof entry?.query === "string"
      )
      .slice(0, MAX_RECENT_ITEMS);
  } catch (error) {
    console.warn("Failed to parse recent searches", error);
    return [];
  }
}

function persistRecentEntries(entries: RecentSearchEntry[]) {
  const storage = (globalThis as typeof globalThis & { localStorage?: Storage })
    .localStorage;
  if (!storage) return;

  try {
    storage.setItem(RECENT_STORAGE_KEY, JSON.stringify(entries));
  } catch (error) {
    console.warn("Failed to persist recent searches", error);
  }
}

function createRecentEntry(query: string): RecentSearchEntry {
  return {
    id:
      typeof crypto !== "undefined" && crypto.randomUUID
        ? crypto.randomUUID()
        : `${Date.now()}-${Math.random()}`,
    query,
    executedAt: new Date().toISOString(),
  };
}

export const useSearchStore = create<SearchStoreState>((set, get) => ({
  isOpen: false,
  query: "",
  results: EMPTY_RESULTS(),
  isLoading: false,
  error: null,
  recent: [],
  hasHydrated: false,
  lastFetchedQuery: null,
  abortController: null,

  openModal: () => set({ isOpen: true }),
  closeModal: () => set({ isOpen: false }),
  toggleModal: () => set((state) => ({ isOpen: !state.isOpen })),

  setQuery: (value) => set({ query: value }),

  clearResults: () =>
    set((state) => {
      const hasData =
        state.results.products.length > 0 ||
        state.results.posts.length > 0 ||
        state.results.pages.length > 0 ||
        state.error !== null ||
        state.lastFetchedQuery !== null;

      if (!hasData) {
        return {}; // Return empty object instead of undefined to preserve state
      }

      return {
        results: EMPTY_RESULTS(),
        error: null,
        lastFetchedQuery: null,
      };
    }),

  setLoading: (loading) => set({ isLoading: loading }),

  setError: (message) => set({ error: message }),

  hydrate: () => {
    if (get().hasHydrated) return;
    const entries = loadRecentEntries();
    set({ recent: entries, hasHydrated: true });
  },

  addRecent: (query) => {
    const trimmed = query.trim();
    if (!trimmed) return;

    const { recent } = get();
    const filtered = recent.filter((entry) => entry.query !== trimmed);
    const nextEntries = [createRecentEntry(trimmed), ...filtered].slice(
      0,
      MAX_RECENT_ITEMS
    );

    set({ recent: nextEntries });
    persistRecentEntries(nextEntries);
  },

  removeRecent: (id) => {
    const nextEntries = get().recent.filter((entry) => entry.id !== id);
    set({ recent: nextEntries });
    persistRecentEntries(nextEntries);
  },

  registerResultClick: (result, position) => {
    const state = get();
    state.addRecent(state.query || result.title);

    // Track result click analytics
    analyticsService.trackResultClick(
      state.query || "",
      result.id,
      result.type,
      position || 1, // Default to position 1 if not provided
      {
        resultTitle: result.title,
        category: result.category,
      }
    );
  },

  search: async (options) => {
    const state = get();
    const query = (options?.query ?? state.query).trim();

    if (!query) {
      set({
        results: EMPTY_RESULTS(),
        isLoading: false,
        error: null,
        lastFetchedQuery: null,
      });
      return;
    }

    if (state.lastFetchedQuery === query && !options?.types) {
      // Avoid duplicate searches for same query when filters unchanged
      return;
    }

    if (state.abortController) {
      state.abortController.abort();
    }

    const controller = new AbortController();
    set({ isLoading: true, error: null, abortController: controller });

    try {
      const response = await meiliSearchService.search({
        query,
        limit: 8,
        types: options?.types ?? undefined,
        includeContent: options?.includeContent,
        signal: controller.signal,
      });

      // Track successful search
      analyticsService.trackSearchQuery(response.query, {
        types: options?.types,
        hasResults:
          response.results.products.length > 0 ||
          response.results.posts.length > 0 ||
          response.results.pages.length > 0,
        totalResults:
          response.results.products.length +
          response.results.posts.length +
          response.results.pages.length,
      });

      set({
        results: response.results,
        isLoading: false,
        error: null,
        lastFetchedQuery: response.query,
      });
    } catch (error) {
      if ((error as Error).name === "AbortError") {
        return;
      }

      const errorMessage = (error as Error).message || "搜尋失敗，請稍後再試";

      // Track search error analytics
      analyticsService.trackSearchError(query, errorMessage, {
        types: options?.types,
      });

      set({ error: errorMessage, isLoading: false });
    } finally {
      set({ abortController: null });
    }
  },
}));

export type { SearchStoreState };

export function resetSearchStoreState() {
  useSearchStore.setState({
    isOpen: false,
    query: "",
    results: EMPTY_RESULTS(),
    isLoading: false,
    error: null,
    recent: [],
    hasHydrated: false,
    lastFetchedQuery: null,
    abortController: null,
  });
}

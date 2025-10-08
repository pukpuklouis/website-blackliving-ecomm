'use client';

import { useEffect, useMemo } from 'react';
import { SearchCommand as SearchCommandUI, type SearchResultItem } from '@blackliving/ui';
import { useShallow } from 'zustand/react/shallow';

import { useSearchStore } from '../stores/searchStore';
import { useSearchKeyboardShortcut } from '../hooks/useSearchKeyboardShortcut';

const SUCCESS_FOOTER = '使用 ⌘ + K（或 Ctrl + K）快速開啟搜尋 · Esc 關閉';

export default function SearchModal() {
  const {
    isOpen,
    query,
    results,
    isLoading,
    recent,
    error,
    openModal,
    closeModal,
    setQuery,
    addRecent,
    registerResultClick,
    search,
    hydrate,
    clearResults,
    setError,
  } = useSearchStore(
    useShallow((state) => ({
      isOpen: state.isOpen,
      query: state.query,
      results: state.results,
      isLoading: state.isLoading,
      recent: state.recent,
      error: state.error,
      openModal: state.openModal,
      closeModal: state.closeModal,
      setQuery: state.setQuery,
      addRecent: state.addRecent,
      registerResultClick: state.registerResultClick,
      search: state.search,
      hydrate: state.hydrate,
      clearResults: state.clearResults,
      setError: state.setError,
    }))
  );

  useSearchKeyboardShortcut();

  useEffect(() => {
    hydrate();
  }, [hydrate]);

  useEffect(() => {
    if (!query.trim()) {
      clearResults();
      return;
    }

    const debounce = window.setTimeout(() => {
      search({ query });
    }, 250);

    return () => {
      window.clearTimeout(debounce);
    };
  }, [query, search, clearResults]);

  const footerMessage = useMemo(() => {
    if (error) {
      return `搜尋發生錯誤：${error}`;
    }
    if (!query.trim()) {
      return '輸入關鍵字以搜尋商品、文章或頁面';
    }
    if (!isLoading && results.products.length + results.posts.length + results.pages.length === 0) {
      return `找不到與「${query}」相關的結果`;
    }
    return SUCCESS_FOOTER;
  }, [error, query, isLoading, results]);

  const handleResultSelect = (item: SearchResultItem) => {
    addRecent(query || item.title);
    registerResultClick({
      id: item.id,
      title: item.title,
      description: item.description,
      category: item.category ?? undefined,
      slug: item.slug,
      href: item.href,
      type: item.type,
      thumbnail: item.thumbnail ?? undefined,
      metadata: item.metadata ?? undefined,
    });
    setQuery('');
    setError(null);
    closeModal();
    window.setTimeout(() => {
      window.location.assign(item.href);
    }, 100);
  };

  return (
    <SearchCommandUI
      open={isOpen}
      onOpenChange={(open) => (open ? openModal() : closeModal())}
      query={query}
      onQueryChange={(value) => {
        setError(null);
        setQuery(value);
      }}
      results={results}
      isLoading={isLoading}
      recentSearches={recent}
      onRecentSelect={(entry) => setQuery(entry.query)}
      onResultSelect={handleResultSelect}
      footer={footerMessage}
      placeholder="搜尋商品、文章與頁面"
    />
  );
}

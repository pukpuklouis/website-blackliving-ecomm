'use client';

import * as React from 'react';
import { FileText, History, Loader2, Package, Search as SearchIcon } from 'lucide-react';

import { Dialog, DialogContent } from './dialog';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from './command';
import { Badge } from './badge';
import { cn } from '@/lib/utils';

export type SearchResultType = 'product' | 'post' | 'page';

export interface SearchResultItem {
  id: string;
  title: string;
  description?: string;
  category?: string | null;
  slug: string;
  href: string;
  type: SearchResultType;
  thumbnail?: string | null;
  metadata?: Record<string, unknown> | null;
}

export interface SearchResultSections {
  products: SearchResultItem[];
  posts: SearchResultItem[];
  pages: SearchResultItem[];
}

export interface RecentSearchEntry {
  id: string;
  query: string;
  executedAt: string;
}

export interface SearchCommandProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  query: string;
  onQueryChange: (value: string) => void;
  results: SearchResultSections;
  isLoading?: boolean;
  recentSearches?: RecentSearchEntry[];
  onRecentSelect?: (entry: RecentSearchEntry) => void;
  onResultSelect: (item: SearchResultItem) => void;
  emptyMessage?: string;
  placeholder?: string;
  className?: string;
  footer?: React.ReactNode;
}

const DEFAULT_LABELS: Record<keyof SearchResultSections, string> = {
  products: 'Products',
  posts: 'Articles',
  pages: 'Pages',
};

const ICON_MAP: Record<SearchResultType, React.ReactNode> = {
  product: <Package className="mr-3 h-5 w-5 text-muted-foreground" aria-hidden />,
  post: <FileText className="mr-3 h-5 w-5 text-muted-foreground" aria-hidden />,
  page: <SearchIcon className="mr-3 h-5 w-5 text-muted-foreground" aria-hidden />,
};

export function SearchCommand({
  className,
  open,
  onOpenChange,
  query,
  onQueryChange,
  results,
  isLoading = false,
  recentSearches,
  onRecentSelect,
  onResultSelect,
  emptyMessage = 'No results found',
  placeholder = 'Search products, articles, and pages…',
  footer,
}: SearchCommandProps) {
  const hasResults = results.products.length + results.posts.length + results.pages.length > 0;

  const handleRecentSelect = (entry: RecentSearchEntry) => {
    onQueryChange(entry.query);
    onRecentSelect?.(entry);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className={cn(
          'overflow-hidden border-none bg-popover p-0 shadow-xl sm:max-w-3xl lg:max-w-4xl',
          className
        )}
        showCloseButton
        data-testid="search-modal"
      >
        <Command className="bg-popover" shouldFilter={false}>
          <CommandInput
            value={query}
            onValueChange={onQueryChange}
            placeholder={placeholder}
            aria-label="Search"
            data-testid="search-input"
          />
          <CommandList data-testid="search-results">
            {isLoading && (
              <div className="flex items-center justify-center gap-2 py-6 text-base text-muted-foreground">
                <Loader2 className="h-5 w-5 animate-spin" aria-hidden />
                Searching…
              </div>
            )}

            {!isLoading && !query && recentSearches && recentSearches.length > 0 && (
              <CommandGroup heading="Recent Searches" data-testid="recent-searches">
                {recentSearches.map((entry) => (
                  <CommandItem
                    key={entry.id}
                    value={entry.query}
                    onSelect={() => handleRecentSelect(entry)}
                    className="cursor-pointer"
                  >
                    <History className="mr-3 h-5 w-5 text-muted-foreground" aria-hidden />
                    <div className="flex flex-col">
                      <span className="text-base">{entry.query}</span>
                      <span className="text-sm text-muted-foreground">
                        {new Date(entry.executedAt).toLocaleString()}
                      </span>
                    </div>
                  </CommandItem>
                ))}
              </CommandGroup>
            )}

            {!isLoading && query && !hasResults && (
              <CommandEmpty data-testid="search-empty">{emptyMessage}</CommandEmpty>
            )}

            {renderSection('products', results.products, onResultSelect)}
            {renderSection('posts', results.posts, onResultSelect)}
            {renderSection('pages', results.pages, onResultSelect)}

            {footer && (
              <>
                <CommandSeparator />
                <div className="px-4 py-3 text-sm text-muted-foreground">{footer}</div>
              </>
            )}
          </CommandList>
        </Command>
      </DialogContent>
    </Dialog>
  );
}

function renderSection(
  key: keyof SearchResultSections,
  items: SearchResultItem[],
  onResultSelect: (item: SearchResultItem) => void
) {
  if (items.length === 0) return null;

  return (
    <CommandGroup key={key} heading={DEFAULT_LABELS[key]} data-testid={`${key}-results`}>
      {items.map((item) => (
        <CommandItem
          key={item.id}
          onSelect={() => onResultSelect(item)}
          value={`${item.type}:${item.id}`}
          className="cursor-pointer"
          data-testid="search-result"
        >
          {ICON_MAP[item.type]}
          <div className="flex flex-1 flex-col gap-1">
            <span className="text-base font-medium leading-none">{item.title}</span>
            {item.description && (
              <span className="text-sm text-muted-foreground line-clamp-2">{item.description}</span>
            )}
          </div>
          {item.category && (
            <Badge variant="secondary" className="ml-2">
              {item.category}
            </Badge>
          )}
        </CommandItem>
      ))}
    </CommandGroup>
  );
}

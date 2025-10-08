import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  Input,
  Button,
  Tabs,
  TabsList,
  TabsTrigger,
} from '@blackliving/ui';
import SearchIcon from '@lucide/react/search';
import PaperclipIcon from '@lucide/react/paperclip';
import Loader2 from '@lucide/react/loader-2';

import {
  fetchMediaLibrary,
  type MediaLibraryItem,
  type MediaLibraryCategory,
} from '../../services/mediaLibrary';
import { formatBytes } from '../../lib/format';

type PickerCategory = Exclude<MediaLibraryCategory, 'all'>;

type MediaLibraryDialogProps = {
  open: boolean;
  initialCategory: PickerCategory;
  onSelect: (asset: MediaLibraryItem) => void;
  onClose: () => void;
};

const PAGE_SIZE = 30;

export function MediaLibraryDialog({
  open,
  initialCategory,
  onSelect,
  onClose,
}: MediaLibraryDialogProps) {
  const [category, setCategory] = useState<PickerCategory>(initialCategory);
  const [assets, setAssets] = useState<MediaLibraryItem[]>([]);
  const [cursor, setCursor] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(false);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');

  // Keep local category aligned with external state when the dialog re-opens
  useEffect(() => {
    if (open) {
      setCategory(initialCategory);
    }
  }, [open, initialCategory]);

  // Debounce search input for smoother UX
  useEffect(() => {
    if (!open) {
      return;
    }

    const timer = window.setTimeout(() => {
      setDebouncedSearch(search.trim());
    }, 250);

    return () => window.clearTimeout(timer);
  }, [open, search]);

  const loadAssets = useCallback(
    async (nextCursor: string | null, append: boolean) => {
      const result = await fetchMediaLibrary({
        cursor: nextCursor,
        limit: PAGE_SIZE,
        type: category,
        search: debouncedSearch || undefined,
        sort: 'recent',
      });

      setAssets((prev) => (append ? [...prev, ...result.items] : result.items));
      setCursor(result.pageInfo.nextCursor);
      setHasMore(result.pageInfo.hasMore);
    },
    [category, debouncedSearch]
  );

  useEffect(() => {
    if (!open) {
      return;
    }

    let cancelled = false;

    const fetchInitial = async () => {
      setLoading(true);
      setError(null);
      try {
        await loadAssets(null, false);
      } catch (err) {
        if (!cancelled) {
          const message = err instanceof Error ? err.message : '無法載入媒體庫';
          setError(message);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    void fetchInitial();

    return () => {
      cancelled = true;
    };
  }, [open, category, debouncedSearch, loadAssets]);

  const handleOpenChange = useCallback(
    (nextOpen: boolean) => {
      if (!nextOpen) {
        onClose();
      }
    },
    [onClose]
  );

  const handleLoadMore = useCallback(async () => {
    if (!cursor) return;
    setLoadingMore(true);
    setError(null);
    try {
      await loadAssets(cursor, true);
    } catch (err) {
      const message = err instanceof Error ? err.message : '無法載入更多媒體';
      setError(message);
    } finally {
      setLoadingMore(false);
    }
  }, [cursor, loadAssets]);

  const stateMessage = useMemo(() => {
    if (loading) return '媒體庫載入中...';
    if (error) return error;
    if (!assets.length) return '目前沒有媒體檔案';
    return null;
  }, [assets.length, loading, error]);

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="min-w-3xl max-w-4xl overflow-hidden">
        <div className="flex max-h-[85vh] flex-col gap-6 overflow-hidden">
          <DialogHeader>
            <DialogTitle>媒體庫</DialogTitle>
            <DialogDescription>從媒體庫挑選擇要用的圖片或檔案</DialogDescription>
          </DialogHeader>

          <Tabs
            value={category}
            onValueChange={(value) => setCategory(value as PickerCategory)}
            className="flex h-full w-full flex-col overflow-hidden"
          >
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <TabsList>
                <TabsTrigger value="images">圖片</TabsTrigger>
                <TabsTrigger value="files">檔案</TabsTrigger>
              </TabsList>
              <div className="relative w-full sm:max-w-xs">
                <SearchIcon className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="搜尋檔名…"
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  className="pl-9"
                />
              </div>
            </div>

            <div className="min-h-[18rem] flex-1 overflow-y-auto pr-1">
              {stateMessage ? (
                <div className="flex h-full flex-col items-center justify-center gap-3 text-sm text-muted-foreground">
                  {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : null}
                  <p>{stateMessage}</p>
                </div>
              ) : (
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {assets.map((asset) => (
                    <button
                      type="button"
                      key={`${asset.key}-${asset.lastModified}`}
                      onClick={() => onSelect(asset)}
                      className="group flex flex-col gap-2 rounded-md border border-border bg-muted/40 p-3 text-left transition hover:border-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    >
                      <div className="relative flex h-40 items-center justify-center overflow-hidden rounded-md border border-dashed border-border bg-background text-muted-foreground">
                        {asset.isImage ? (
                          <img
                            src={asset.url}
                            alt={asset.name}
                            className="h-full w-full object-cover"
                            loading="lazy"
                          />
                        ) : (
                          <PaperclipIcon className="h-10 w-10" />
                        )}
                      </div>
                      <div className="space-y-1">
                        <p className="truncate text-sm font-medium text-foreground">{asset.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {formatBytes(asset.size)} ·{' '}
                          {new Date(asset.lastModified).toLocaleString('zh-TW')}
                        </p>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </Tabs>

          <div className="flex items-center justify-end gap-2 pt-1">
            <Button variant="secondary" onClick={onClose}>
              取消
            </Button>
            <Button
              onClick={handleLoadMore}
              disabled={!hasMore || loadingMore || loading}
              variant="outline"
            >
              {loadingMore ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              {hasMore ? '載入更多' : '沒有更多檔案'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

import { useCallback, useEffect, useMemo, useState, useRef } from 'react';
import { useInfiniteQuery, useQueryClient } from '@tanstack/react-query';
import { useVirtualizer } from '@tanstack/react-virtual';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  Input,
  Button,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@blackliving/ui';
import SearchIcon from '@lucide/react/search';
import PaperclipIcon from '@lucide/react/paperclip';
import Loader2 from '@lucide/react/loader-2';
import UploadIcon from '@lucide/react/upload';

import {
  fetchMediaLibrary,
  type MediaLibraryItem,
  type MediaLibraryCategory,
  type MediaLibraryResponse,
} from '../../services/mediaLibrary';
import { formatBytes } from '../../lib/format';
import { useApiUrl } from '../../contexts/EnvironmentContext';
import { useImageUpload } from '../../contexts/ImageUploadContext';

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
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const apiUrl = useApiUrl();
  const { uploadImages } = useImageUpload();
  const queryClient = useQueryClient();

  useEffect(() => {
    if (open) {
      setCategory(initialCategory);
    }
  }, [open, initialCategory]);

  useEffect(() => {
    if (!open) {
      return;
    }

    const timer = window.setTimeout(() => {
      setDebouncedSearch(search.trim());
    }, 250);

    return () => window.clearTimeout(timer);
  }, [open, search]);

  useEffect(() => {
    setUploadError(null);
  }, [category, debouncedSearch]);

  const {
    data,
    error: queryError,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isFetching,
    isLoading,
  } = useInfiniteQuery({
    queryKey: ['media-library', category, debouncedSearch || '', apiUrl],
    enabled: open,
    initialPageParam: null as string | null,
    refetchOnWindowFocus: false,
    staleTime: 30_000,
    getNextPageParam: (lastPage: MediaLibraryResponse) => lastPage.pageInfo.nextCursor ?? undefined,
    queryFn: async ({ pageParam }) =>
      fetchMediaLibrary(
        {
          cursor: pageParam ?? null,
          limit: PAGE_SIZE,
          type: category,
          search: debouncedSearch || undefined,
          sort: 'recent',
        },
        apiUrl
      ),
  });

  const assets = useMemo(() => data?.pages.flatMap((page) => page.items) ?? [], [data]);
  const isInitialLoading = isLoading && assets.length === 0;
  const fetchErrorMessage =
    queryError && queryError instanceof Error
      ? queryError.message
      : queryError
        ? '無法載入媒體庫'
        : null;

  const stateMessage = useMemo(() => {
    if (isInitialLoading) return '媒體庫載入中...';
    if (uploadError) return uploadError;
    if (fetchErrorMessage) return fetchErrorMessage;
    if (!assets.length) return '目前沒有媒體檔案';
    return null;
  }, [assets.length, fetchErrorMessage, isInitialLoading, uploadError]);

  const handleImageUpload = useCallback(
    async (files: FileList | null) => {
      if (!files || files.length === 0 || category !== 'images') return;
      setUploading(true);
      setUploadError(null);
      try {
        await uploadImages(files, { folder: 'uploads' });
        setSearch('');
        setDebouncedSearch('');
        await queryClient.invalidateQueries({ queryKey: ['media-library'] });
      } catch (err) {
        const message = err instanceof Error ? err.message : '上傳失敗';
        setUploadError(message);
      } finally {
        setUploading(false);
        if (fileInputRef.current) fileInputRef.current.value = '';
      }
    },
    [category, uploadImages, queryClient]
  );

  const handleOpenChange = useCallback(
    (nextOpen: boolean) => {
      if (!nextOpen) {
        onClose();
      }
    },
    [onClose]
  );

  const renderUploadZone = () => (
    <div
      className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center mb-4"
      onDragOver={(event) => event.preventDefault()}
      onDrop={(event) => {
        event.preventDefault();
        handleImageUpload(event.dataTransfer.files);
      }}
    >
      <UploadIcon className="h-8 w-8 text-gray-400 mx-auto mb-2" />
      <p className="text-sm text-gray-600 mb-1">
        拖放圖片到此或
        <label className="text-primary underline cursor-pointer ml-1">
          選擇檔案上傳
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            multiple
            className="hidden"
            onChange={(event) => handleImageUpload(event.target.files)}
          />
        </label>
      </p>
      <p className="text-xs text-gray-500">支援 JPG/PNG/WebP，大小 5MB 以內</p>
      {uploading && <p className="text-sm text-blue-600 mt-1">上傳中...</p>}
    </div>
  );

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

            <TabsContent value="images" className="min-h-[18rem] flex-1 overflow-hidden">
              <div className="h-full flex flex-col overflow-hidden">
                {category === 'images' && renderUploadZone()}
                <VirtualizedAssetGrid
                  assets={assets}
                  onSelect={onSelect}
                  stateMessage={stateMessage}
                  showSpinner={isInitialLoading}
                  fetchNextPage={fetchNextPage}
                  hasNextPage={Boolean(hasNextPage)}
                  isFetchingNextPage={isFetchingNextPage}
                />
              </div>
            </TabsContent>

            <TabsContent value="files" className="min-h-[18rem] flex-1 overflow-hidden">
              <div className="h-full flex flex-col overflow-hidden">
                <VirtualizedAssetGrid
                  assets={assets}
                  onSelect={onSelect}
                  stateMessage={stateMessage}
                  showSpinner={isInitialLoading}
                  fetchNextPage={fetchNextPage}
                  hasNextPage={Boolean(hasNextPage)}
                  isFetchingNextPage={isFetchingNextPage}
                />
              </div>
            </TabsContent>
          </Tabs>

          <div className="flex items-center justify-end gap-2 pt-1">
            <Button variant="secondary" onClick={onClose}>
              取消
            </Button>
            {isFetching && assets.length ? (
              <span className="text-xs text-muted-foreground">更新中…</span>
            ) : null}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

type VirtualizedAssetGridProps = {
  assets: MediaLibraryItem[];
  onSelect: (asset: MediaLibraryItem) => void;
  stateMessage: string | null;
  showSpinner: boolean;
  fetchNextPage: () => Promise<unknown>;
  hasNextPage: boolean;
  isFetchingNextPage: boolean;
};

function VirtualizedAssetGrid({
  assets,
  onSelect,
  stateMessage,
  showSpinner,
  fetchNextPage,
  hasNextPage,
  isFetchingNextPage,
}: VirtualizedAssetGridProps) {
  const scrollParentRef = useRef<HTMLDivElement | null>(null);
  const virtualizer = useVirtualizer({
    count: assets.length,
    getScrollElement: () => scrollParentRef.current,
    estimateSize: () => 220,
    overscan: 8,
  });

  useEffect(() => {
    const element = scrollParentRef.current;
    if (!element || !hasNextPage) {
      return;
    }

    const handleScroll = () => {
      if (isFetchingNextPage) return;
      const distanceFromBottom = element.scrollHeight - (element.scrollTop + element.clientHeight);
      if (distanceFromBottom < 320) {
        void fetchNextPage();
      }
    };

    element.addEventListener('scroll', handleScroll);
    return () => {
      element.removeEventListener('scroll', handleScroll);
    };
  }, [fetchNextPage, hasNextPage, isFetchingNextPage]);

  useEffect(() => {
    if (!hasNextPage || isFetchingNextPage) return;
    const element = scrollParentRef.current;
    if (!element) return;
    if (element.scrollHeight <= element.clientHeight * 1.5) {
      void fetchNextPage();
    }
  }, [assets.length, fetchNextPage, hasNextPage, isFetchingNextPage]);

  if (stateMessage) {
    return (
      <div className="flex-1 overflow-y-auto pr-1" ref={scrollParentRef}>
        <div className="flex h-full flex-col items-center justify-center gap-3 text-sm text-muted-foreground">
          {showSpinner ? <Loader2 className="h-5 w-5 animate-spin" /> : null}
          <p>{stateMessage}</p>
        </div>
      </div>
    );
  }

  const virtualItems = virtualizer.getVirtualItems();
  const paddingTop = virtualItems.length > 0 ? virtualItems[0]?.start ?? 0 : 0;
  const paddingBottom = virtualItems.length > 0
    ? Math.max(0, virtualizer.getTotalSize() - (virtualItems[virtualItems.length - 1]?.end ?? 0))
    : 0;

  return (
    <div className="flex-1 overflow-y-auto pr-1" ref={scrollParentRef}>
      <div style={{ paddingTop, paddingBottom }}>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {virtualItems.map((virtualRow) => {
            const asset = assets[virtualRow.index];
            if (!asset) return null;
            return <AssetCard key={`${asset.key}-${asset.lastModified}`} asset={asset} onSelect={onSelect} />;
          })}
        </div>
      </div>
      {isFetchingNextPage ? (
        <div className="flex items-center justify-center py-4 text-sm text-muted-foreground">
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          載入更多媒體...
        </div>
      ) : null}
    </div>
  );
}

type AssetCardProps = {
  asset: MediaLibraryItem;
  onSelect: (asset: MediaLibraryItem) => void;
};

function AssetCard({ asset, onSelect }: AssetCardProps) {
  return (
    <button
      type="button"
      onClick={() => onSelect(asset)}
      className="group flex flex-col gap-2 rounded-md border border-border bg-muted/40 p-3 text-left transition hover:border-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
    >
      <div className="relative flex h-40 items-center justify-center overflow-hidden rounded-md border border-dashed border-border bg-background text-muted-foreground">
        {asset.isImage ? (
          <img src={asset.url} alt={asset.name} className="h-full w-full object-cover" loading="lazy" />
        ) : (
          <PaperclipIcon className="h-10 w-10" />
        )}
      </div>
      <div className="space-y-1">
        <p className="truncate text-sm font-medium text-foreground">{asset.name}</p>
        <p className="text-xs text-muted-foreground">
          {formatBytes(asset.size)} · {new Date(asset.lastModified).toLocaleString('zh-TW')}
        </p>
      </div>
    </button>
  );
}

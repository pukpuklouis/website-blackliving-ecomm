import { useCallback, useEffect, useMemo, useState, useRef } from 'react';
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
  const [assets, setAssets] = useState<MediaLibraryItem[]>([]);
  const [cursor, setCursor] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(false);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [uploading, setUploading] = useState(false); // NEW: Track upload state

  // NEW: File input ref for hidden file picker
  const fileInputRef = useRef<HTMLInputElement>(null);

  // NEW: Get API URL from context (falls back to localhost:8787)
  const apiUrl = useApiUrl();
  const { uploadImages } = useImageUpload(); // NEW: Get upload function from context

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
      const result = await fetchMediaLibrary(
        {
          cursor: nextCursor,
          limit: PAGE_SIZE,
          type: category,
          search: debouncedSearch || undefined,
          sort: 'recent',
        },
        apiUrl
      );

      setAssets((prev) => (append ? [...prev, ...result.items] : result.items));
      setCursor(result.pageInfo.nextCursor);
      setHasMore(result.pageInfo.hasMore);
    },
    [category, debouncedSearch, apiUrl]
  );

  // NEW: Handle image upload and refresh library
  const handleImageUpload = useCallback(
    async (files: FileList | null) => {
      if (!files || files.length === 0 || category !== 'images') return; // Only for images tab
      setUploading(true);
      setError(null);
      try {
        await uploadImages(files, { folder: 'uploads' }); // Use default folder; adjust if needed
        // Refresh the library to include new uploads
        setSearch(''); // Clear search to show recent
        setDebouncedSearch('');
        await loadAssets(null, false); // Reload from start
      } catch (err) {
        const message = err instanceof Error ? err.message : '上傳失敗';
        setError(message);
      } finally {
        setUploading(false);
        if (fileInputRef.current) fileInputRef.current.value = ''; // Reset input
      }
    },
    [category, uploadImages, loadAssets]
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
  }, [cursor, loadAssets, apiUrl]);

  const stateMessage = useMemo(() => {
    if (loading) return '媒體庫載入中...';
    if (error) return error;
    if (!assets.length) return '目前沒有媒體檔案';
    return null;
  }, [assets.length, loading, error]);

  // NEW: Render upload dropzone only for images tab
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

            {/* NEW: Use TabsContent for better structure */}
            <TabsContent value="images" className="min-h-[18rem] flex-1 overflow-hidden">
              <div className="h-full flex flex-col overflow-hidden">
                {/* Upload zone only for images */}
                {category === 'images' && renderUploadZone()}
                <div className="flex-1 overflow-y-auto pr-1">
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
                            <p className="truncate text-sm font-medium text-foreground">
                              {asset.name}
                            </p>
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
              </div>
            </TabsContent>

            <TabsContent value="files" className="min-h-[18rem] flex-1 overflow-hidden">
              {/* Files tab: Same as before, no upload */}
              <div className="h-full flex flex-col overflow-hidden">
                <div className="flex-1 overflow-y-auto pr-1">
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
                            <p className="truncate text-sm font-medium text-foreground">
                              {asset.name}
                            </p>
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
              </div>
            </TabsContent>
          </Tabs>

          <div className="flex items-center justify-end gap-2 pt-1">
            <Button variant="secondary" onClick={onClose}>
              取消
            </Button>
            <Button
              onClick={handleLoadMore}
              disabled={!hasMore || loadingMore || loading || uploading} // UPDATED: Disable during upload
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

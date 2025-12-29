import {
  Button,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  Input,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@blackliving/ui";
import Loader2 from "@lucide/react/loader-2";
import PaperclipIcon from "@lucide/react/paperclip";
import SearchIcon from "@lucide/react/search";
import UploadIcon from "@lucide/react/upload";
import { useInfiniteQuery, useQueryClient } from "@tanstack/react-query";
import { useVirtualizer } from "@tanstack/react-virtual";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useApiUrl } from "../../contexts/EnvironmentContext";
import { useImageUpload } from "../../contexts/ImageUploadContext";
import { formatBytes } from "../../lib/format";
import {
  fetchMediaLibrary,
  type MediaLibraryCategory,
  type MediaLibraryItem,
  type MediaLibraryResponse,
} from "../../services/mediaLibrary";

type PickerCategory = Exclude<MediaLibraryCategory, "all">;

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
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
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

  // biome-ignore lint/correctness/useExhaustiveDependencies: Effect should run when category or search changes to clear upload errors
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
    queryKey: ["media-library", category, debouncedSearch || "", apiUrl],
    enabled: open,
    initialPageParam: null as string | null,
    refetchOnWindowFocus: false,
    staleTime: 30_000,
    getNextPageParam: (lastPage: MediaLibraryResponse) =>
      lastPage.pageInfo.nextCursor ?? undefined,
    queryFn: async ({ pageParam }) =>
      fetchMediaLibrary(
        {
          cursor: pageParam ?? null,
          limit: PAGE_SIZE,
          type: category,
          search: debouncedSearch || undefined,
          sort: "recent",
        },
        apiUrl
      ),
  });

  const assets = useMemo(
    () => data?.pages.flatMap((page) => page.items) ?? [],
    [data]
  );
  const isInitialLoading = isLoading && assets.length === 0;
  let fetchErrorMessage: string | null = null;
  if (queryError) {
    if (queryError instanceof Error) {
      fetchErrorMessage = queryError.message;
    } else {
      fetchErrorMessage = "無法載入媒體庫";
    }
  }

  const stateMessage = useMemo(() => {
    if (isInitialLoading) {
      return "媒體庫載入中...";
    }
    if (uploadError) {
      return uploadError;
    }
    if (fetchErrorMessage) {
      return fetchErrorMessage;
    }
    if (!assets.length) {
      return "目前沒有媒體檔案";
    }
    return null;
  }, [assets.length, fetchErrorMessage, isInitialLoading, uploadError]);

  const handleImageUpload = useCallback(
    async (files: FileList | null) => {
      if (!files || files.length === 0 || category !== "images") {
        return;
      }
      setUploading(true);
      setUploadError(null);
      try {
        await uploadImages(files, { folder: "uploads" });
        setSearch("");
        setDebouncedSearch("");
        await queryClient.invalidateQueries({ queryKey: ["media-library"] });
      } catch (err) {
        const message = err instanceof Error ? err.message : "上傳失敗";
        setUploadError(message);
      } finally {
        setUploading(false);
        if (fileInputRef.current) {
          fileInputRef.current.value = "";
        }
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
    // biome-ignore lint: Drag and drop zone requires event handlers and keyboard focus for accessibility
    <div
      aria-label="圖片上傳區域"
      className="mb-4 rounded-lg border-2 border-gray-300 border-dashed p-4 text-center"
      onDragOver={(event) => event.preventDefault()}
      onDrop={(event) => {
        event.preventDefault();
        handleImageUpload(event.dataTransfer.files);
      }}
      role="region"
      // biome-ignore lint/a11y/noNoninteractiveTabindex: Drag and drop zone requires keyboard focus for accessibility
      tabIndex={0}
    >
      <UploadIcon className="mx-auto mb-2 h-8 w-8 text-gray-400" />
      <p className="mb-1 text-gray-600 text-sm">
        拖放圖片到此或
        <label className="ml-1 cursor-pointer text-primary underline">
          選擇檔案上傳
          <input
            accept="image/*"
            className="hidden"
            multiple
            onChange={(event) => handleImageUpload(event.target.files)}
            ref={fileInputRef}
            type="file"
          />
        </label>
      </p>
      <p className="text-gray-500 text-xs">支援 JPG/PNG/WebP，大小 5MB 以內</p>
      {uploading ? (
        <p className="mt-1 text-blue-600 text-sm">上傳中...</p>
      ) : null}
    </div>
  );

  return (
    <Dialog onOpenChange={handleOpenChange} open={open}>
      <DialogContent className="min-w-3xl max-w-4xl overflow-hidden">
        <div className="flex max-h-[85vh] flex-col gap-6 overflow-hidden">
          <DialogHeader>
            <DialogTitle>媒體庫</DialogTitle>
            <DialogDescription>
              從媒體庫挑選擇要用的圖片或檔案
            </DialogDescription>
          </DialogHeader>

          <Tabs
            className="flex h-full w-full flex-col overflow-hidden"
            onValueChange={(value) => setCategory(value as PickerCategory)}
            value={category}
          >
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <TabsList>
                <TabsTrigger value="images">圖片</TabsTrigger>
                <TabsTrigger value="files">檔案</TabsTrigger>
              </TabsList>
              <div className="relative w-full sm:max-w-xs">
                <SearchIcon className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  className="pl-9"
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="搜尋檔名…"
                  value={search}
                />
              </div>
            </div>

            <TabsContent
              className="min-h-[18rem] flex-1 overflow-hidden"
              value="images"
            >
              <div className="flex h-full flex-col overflow-hidden">
                {category === "images" && renderUploadZone()}
                <VirtualizedAssetGrid
                  assets={assets}
                  fetchNextPage={fetchNextPage}
                  hasNextPage={Boolean(hasNextPage)}
                  isFetchingNextPage={isFetchingNextPage}
                  onSelect={onSelect}
                  showSpinner={isInitialLoading}
                  stateMessage={stateMessage}
                />
              </div>
            </TabsContent>

            <TabsContent
              className="min-h-[18rem] flex-1 overflow-hidden"
              value="files"
            >
              <div className="flex h-full flex-col overflow-hidden">
                <VirtualizedAssetGrid
                  assets={assets}
                  fetchNextPage={fetchNextPage}
                  hasNextPage={Boolean(hasNextPage)}
                  isFetchingNextPage={isFetchingNextPage}
                  onSelect={onSelect}
                  showSpinner={isInitialLoading}
                  stateMessage={stateMessage}
                />
              </div>
            </TabsContent>
          </Tabs>

          <div className="flex items-center justify-end gap-2 pt-1">
            <Button onClick={onClose} variant="secondary">
              取消
            </Button>
            {/** biome-ignore lint/nursery/noLeakedRender: Conditional rendering of loading indicator during fetch with existing assets */}
            {isFetching && Boolean(assets.length) ? (
              <span className="text-muted-foreground text-xs">更新中…</span>
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
    if (!(element && hasNextPage)) {
      return;
    }

    const handleScroll = () => {
      if (isFetchingNextPage) {
        return;
      }
      const distanceFromBottom =
        element.scrollHeight - (element.scrollTop + element.clientHeight);
      if (distanceFromBottom < 320) {
        fetchNextPage();
      }
    };

    element.addEventListener("scroll", handleScroll);
    return () => {
      element.removeEventListener("scroll", handleScroll);
    };
  }, [fetchNextPage, hasNextPage, isFetchingNextPage]);

  useEffect(() => {
    if (!hasNextPage || isFetchingNextPage) {
      return;
    }
    const element = scrollParentRef.current;
    if (!element) {
      return;
    }
    if (element.scrollHeight <= element.clientHeight * 1.5) {
      fetchNextPage();
    }
  }, [fetchNextPage, hasNextPage, isFetchingNextPage]);

  if (stateMessage) {
    return (
      <div className="flex-1 overflow-y-auto pr-1" ref={scrollParentRef}>
        <div className="flex h-full flex-col items-center justify-center gap-3 text-muted-foreground text-sm">
          {showSpinner ? <Loader2 className="h-5 w-5 animate-spin" /> : null}
          <p>{stateMessage}</p>
        </div>
      </div>
    );
  }

  const virtualItems = virtualizer.getVirtualItems();
  const paddingTop =
    virtualItems.length > 0 ? (virtualItems[0]?.start ?? 0) : 0;
  const paddingBottom =
    virtualItems.length > 0
      ? Math.max(
          0,
          virtualizer.getTotalSize() - (virtualItems.at(-1)?.end ?? 0)
        )
      : 0;

  return (
    <div className="flex-1 overflow-y-auto pr-1" ref={scrollParentRef}>
      <div style={{ paddingTop, paddingBottom }}>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {virtualItems.map((virtualRow) => {
            const asset = assets[virtualRow.index];
            if (!asset) {
              return null;
            }
            return (
              <AssetCard
                asset={asset}
                key={`${asset.key}-${asset.lastModified}`}
                onSelect={onSelect}
              />
            );
          })}
        </div>
      </div>
      {isFetchingNextPage ? (
        <div className="flex items-center justify-center py-4 text-muted-foreground text-sm">
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
      className="group flex flex-col gap-2 rounded-md border border-border bg-muted/40 p-3 text-left transition hover:border-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      onClick={() => onSelect(asset)}
      type="button"
    >
      <div className="relative flex h-40 items-center justify-center overflow-hidden rounded-md border border-border border-dashed bg-background text-muted-foreground">
        {asset.isImage ? (
          <img
            alt={asset.name}
            className="h-full w-full object-cover"
            height={160}
            loading="lazy"
            src={asset.url}
            width={160}
          />
        ) : (
          <PaperclipIcon className="h-10 w-10" />
        )}
      </div>
      <div className="space-y-1">
        <p className="truncate font-medium text-foreground text-sm">
          {asset.name}
        </p>
        <p className="text-muted-foreground text-xs">
          {formatBytes(asset.size)} ·{" "}
          {new Date(asset.lastModified).toLocaleString("zh-TW")}
        </p>
      </div>
    </button>
  );
}

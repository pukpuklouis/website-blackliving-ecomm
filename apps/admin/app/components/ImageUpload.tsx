import ArrowDown from "@lucide/react/arrow-down";
import ArrowUp from "@lucide/react/arrow-up";
import GripVertical from "@lucide/react/grip-vertical";
import UploadIcon from "@lucide/react/upload";
import { Image } from "@unpic/react";
import { useCallback, useRef } from "react";
import { useImageUpload } from "../contexts/ImageUploadContext";
import { reorderList } from "../lib/array";

type ImageUploadProps = {
  value: string[];
  onChange: (images: string[]) => void;
  title?: string;
  description?: string;
  folder?: string;
  multiple?: boolean;
  emptyHint?: string;
  error?: string;
  className?: string;
};

export function ImageUpload({
  value = [],
  onChange,
  title,
  description,
  folder = "uploads",
  multiple = true,
  emptyHint,
  error,
  className,
}: ImageUploadProps) {
  const { uploadImages, isUploading } = useImageUpload();
  const dragIndexRef = useRef<number | null>(null);

  const handleFilesSelected = useCallback(
    async (files: FileList | null) => {
      if (!files || files.length === 0) return;
      try {
        const uploaded = await uploadImages(files, { folder });
        if (!uploaded.length) return;

        const merged = mergeImages(value, uploaded, multiple);
        onChange(merged);
      } catch (error) {
        // Errors are surfaced via toast in the upload context.
      }
    },
    [folder, multiple, onChange, uploadImages, value]
  );

  const handleDragStart = useCallback((index: number) => {
    dragIndexRef.current = index;
  }, []);

  const handleDragEnter = useCallback(
    (index: number) => {
      const from = dragIndexRef.current;
      if (from === null || from === index) return;
      dragIndexRef.current = index;
      onChange(reorderList(value, from, index));
    },
    [onChange, value]
  );

  const handleDragEnd = useCallback(() => {
    dragIndexRef.current = null;
  }, []);

  const removeImage = useCallback(
    (index: number) => {
      const next = value.filter((_, i) => i !== index);
      onChange(next);
    },
    [onChange, value]
  );

  const moveImage = useCallback(
    (index: number, direction: number) => {
      if (!multiple) return;
      const nextIndex = Math.min(
        Math.max(index + direction, 0),
        value.length - 1
      );
      if (nextIndex === index) return;
      onChange(reorderList(value, index, nextIndex));
    },
    [multiple, onChange, value]
  );

  return (
    <div className={className}>
      {title && <h4 className="font-medium">{title}</h4>}
      {description && (
        <p className="mt-1 text-gray-600 text-sm">{description}</p>
      )}

      <div
        className="mt-4 rounded-lg border-2 border-gray-300 border-dashed p-6 text-center"
        onDragOver={(event) => event.preventDefault()}
        onDrop={(event) => {
          event.preventDefault();
          handleFilesSelected(event.dataTransfer.files);
        }}
      >
        <UploadIcon className="mx-auto mb-2 h-10 w-10 text-gray-400" />
        <p className="mb-2 text-gray-600">
          拖放圖片到此或
          <label className="ml-1 cursor-pointer text-primary underline">
            選擇檔案
            <input
              accept="image/*"
              className="hidden"
              multiple={multiple}
              onChange={(event) => {
                handleFilesSelected(event.target.files);
                event.target.value = "";
              }}
              type="file"
            />
          </label>
        </p>
        <p className="text-gray-500 text-xs">
          支援 JPG/PNG/WebP，大小 5MB 以內
        </p>
        {isUploading && <p className="mt-2 text-gray-600 text-sm">上傳中...</p>}
      </div>

      {value && value.length > 0 && (
        <div className="mt-4 grid grid-cols-4 gap-4">
          {value.map((url, index) => (
            <div
              className="group relative overflow-hidden rounded-md border"
              draggable={multiple}
              key={`${url}-${index}`}
              onDragEnd={handleDragEnd}
              onDragEnter={() => handleDragEnter(index)}
              onDragOver={(event) => event.preventDefault()}
              onDragStart={() => handleDragStart(index)}
              onDrop={handleDragEnd}
            >
              <Image
                alt={`uploaded-${index}`}
                className="h-32 w-full object-cover"
                height={256}
                layout="constrained"
                src={url}
                width={320}
              />
              {multiple && (
                <div className="absolute top-1 left-1 flex items-center gap-1 rounded-full bg-black/50 px-2 py-1 text-white text-xs">
                  <GripVertical aria-hidden className="h-3 w-3" />
                  <span>{index + 1}</span>
                </div>
              )}
              {multiple && (
                <div className="absolute inset-x-0 bottom-0 flex justify-between bg-black/50 p-1 text-white text-xs">
                  <div className="space-x-1">
                    <button
                      aria-label="上移圖片"
                      className="rounded p-1 hover:bg-white/20"
                      onClick={() => moveImage(index, -1)}
                      type="button"
                    >
                      <ArrowUp aria-hidden className="h-3 w-3" />
                      <span className="sr-only">上移圖片</span>
                    </button>
                    <button
                      aria-label="下移圖片"
                      className="rounded p-1 hover:bg-white/20"
                      onClick={() => moveImage(index, 1)}
                      type="button"
                    >
                      <ArrowDown aria-hidden className="h-3 w-3" />
                      <span className="sr-only">下移圖片</span>
                    </button>
                  </div>
                  <button
                    className="rounded px-1 hover:bg-white/20"
                    onClick={() => removeImage(index)}
                    type="button"
                  >
                    移除
                  </button>
                </div>
              )}
              {!multiple && (
                <button
                  className="absolute top-2 right-2 rounded bg-black/60 px-2 py-1 text-white text-xs"
                  onClick={() => removeImage(index)}
                  type="button"
                >
                  移除
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      {emptyHint && value.length === 0 && (
        <p className="mt-2 text-muted-foreground/30 text-xs">{emptyHint}</p>
      )}
      {error && <p className="mt-2 text-red-500 text-xs">{error}</p>}
    </div>
  );
}

export function mergeImages(
  current: string[],
  uploaded: string[],
  multiple: boolean
): string[] {
  if (!multiple) {
    const last = uploaded[uploaded.length - 1];
    return last ? [last] : [];
  }

  const combined = [...current, ...uploaded];
  const seen = new Set<string>();
  return combined.filter((url) => {
    if (seen.has(url)) return false;
    seen.add(url);
    return true;
  });
}

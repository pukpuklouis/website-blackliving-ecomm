import { useCallback, useRef } from 'react';
import UploadIcon from '@lucide/react/upload';
import GripVertical from '@lucide/react/grip-vertical';
import ArrowUp from '@lucide/react/arrow-up';
import ArrowDown from '@lucide/react/arrow-down';
import { Image } from '@unpic/react';
import { reorderList } from '../lib/array';
import { useImageUpload } from '../contexts/ImageUploadContext';

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
  folder = 'uploads',
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
      const nextIndex = Math.min(Math.max(index + direction, 0), value.length - 1);
      if (nextIndex === index) return;
      onChange(reorderList(value, index, nextIndex));
    },
    [multiple, onChange, value]
  );

  return (
    <div className={className}>
      {title && <h4 className="font-medium">{title}</h4>}
      {description && <p className="text-sm text-gray-600 mt-1">{description}</p>}

      <div
        className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center mt-4"
        onDragOver={(event) => event.preventDefault()}
        onDrop={(event) => {
          event.preventDefault();
          handleFilesSelected(event.dataTransfer.files);
        }}
      >
        <UploadIcon className="h-10 w-10 text-gray-400 mx-auto mb-2" />
        <p className="text-gray-600 mb-2">
          拖放圖片到此或
          <label className="text-primary underline cursor-pointer ml-1">
            選擇檔案
            <input
              type="file"
              accept="image/*"
              multiple={multiple}
              className="hidden"
              onChange={(event) => {
                handleFilesSelected(event.target.files);
                event.target.value = '';
              }}
            />
          </label>
        </p>
        <p className="text-xs text-gray-500">支援 JPG/PNG/WebP，大小 5MB 以內</p>
        {isUploading && <p className="text-sm text-gray-600 mt-2">上傳中...</p>}
      </div>

      {value && value.length > 0 && (
        <div className="grid grid-cols-4 gap-4 mt-4">
          {value.map((url, index) => (
            <div
              key={`${url}-${index}`}
              className="relative border rounded-md overflow-hidden group"
              draggable={multiple}
              onDragStart={() => handleDragStart(index)}
              onDragEnter={() => handleDragEnter(index)}
              onDragOver={(event) => event.preventDefault()}
              onDragEnd={handleDragEnd}
              onDrop={handleDragEnd}
            >
              <Image
                src={url}
                alt={`uploaded-${index}`}
                layout="constrained"
                width={320}
                height={256}
                className="w-full h-32 object-cover"
              />
              {multiple && (
                <div className="absolute top-1 left-1 bg-black/50 text-white text-xs flex items-center gap-1 px-2 py-1 rounded-full">
                  <GripVertical className="h-3 w-3" aria-hidden />
                  <span>{index + 1}</span>
                </div>
              )}
              {multiple && (
                <div className="absolute inset-x-0 bottom-0 bg-black/50 text-white text-xs flex justify-between p-1">
                  <div className="space-x-1">
                    <button
                      type="button"
                      onClick={() => moveImage(index, -1)}
                      className="p-1 hover:bg-white/20 rounded"
                      aria-label="上移圖片"
                    >
                      <ArrowUp className="h-3 w-3" aria-hidden />
                      <span className="sr-only">上移圖片</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => moveImage(index, 1)}
                      className="p-1 hover:bg-white/20 rounded"
                      aria-label="下移圖片"
                    >
                      <ArrowDown className="h-3 w-3" aria-hidden />
                      <span className="sr-only">下移圖片</span>
                    </button>
                  </div>
                  <button
                    type="button"
                    onClick={() => removeImage(index)}
                    className="px-1 hover:bg-white/20 rounded"
                  >
                    移除
                  </button>
                </div>
              )}
              {!multiple && (
                <button
                  type="button"
                  onClick={() => removeImage(index)}
                  className="absolute top-2 right-2 bg-black/60 text-white text-xs px-2 py-1 rounded"
                >
                  移除
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      {emptyHint && value.length === 0 && (
        <p className="text-xs text-muted-foreground/30 mt-2">{emptyHint}</p>
      )}
      {error && <p className="text-xs text-red-500 mt-2">{error}</p>}
    </div>
  );
}

export function mergeImages(current: string[], uploaded: string[], multiple: boolean): string[] {
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

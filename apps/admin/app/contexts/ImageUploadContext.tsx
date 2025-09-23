import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { toast } from 'sonner';
import { resolveAssetUrl, type UploadResult } from '../lib/assets';
import { safeParseJSON } from '../lib/http';
import { convertFileToWebP } from '../lib/imageConversion';

interface UploadOptions {
  folder?: string;
}

interface ImageUploadContextValue {
  isUploading: boolean;
  uploadImages: (files: FileList | File[] | null, options?: UploadOptions) => Promise<string[]>;
}

const ImageUploadContext = createContext<ImageUploadContextValue | undefined>(undefined);

export function ImageUploadProvider({ children }: { children: ReactNode }) {
  const API_BASE = (import.meta.env.PUBLIC_API_URL as string | undefined) ?? '';
  const cdnBase = (import.meta.env.PUBLIC_IMAGE_CDN_URL as string | undefined)?.trim();
  const fallbackAssetBase = useMemo(
    () => (typeof window !== 'undefined' ? window.location.origin : undefined),
    []
  );
  const [isUploading, setIsUploading] = useState(false);

  const uploadImages = useCallback<
    ImageUploadContextValue['uploadImages']
  >(
    async (input, options = {}) => {
      const files = normalizeFileInput(input);
      if (!files.length) return [];

      if (!API_BASE) {
        const message = 'PUBLIC_API_URL is not configured for image uploads.';
        toast.error(message);
        throw new Error(message);
      }

      setIsUploading(true);
      try {
        const folder = options.folder ?? 'uploads';
        const convertedFiles = await Promise.all(files.map(file => convertFileToWebP(file)));
        const form = new FormData();
        convertedFiles.forEach(file => form.append('files', file, file.name));
        form.append('folder', folder);

        const response = await fetch(`${API_BASE}/api/admin/upload`, {
          method: 'POST',
          body: form,
          credentials: 'include',
        });

        const payload = await safeParseJSON(response);

        if (!response.ok) {
          const message = extractErrorMessage(payload) ?? '上傳失敗';
          throw new Error(message);
        }

        const uploadResults = Array.isArray((payload as any)?.data)
          ? ((payload as any).data as UploadResult[])
          : [];
        const resolved = uploadResults
          .map(file => resolveAssetUrl(file, cdnBase, fallbackAssetBase))
          .filter(Boolean);

        toast.success(`已上傳 ${resolved.length} 張圖片`);

        return resolved as string[];
      } catch (error) {
        const message = error instanceof Error ? error.message : '上傳失敗';
        toast.error(message);
        throw error;
      } finally {
        setIsUploading(false);
      }
    },
    [API_BASE, cdnBase, fallbackAssetBase]
  );

  const value = useMemo<ImageUploadContextValue>(
    () => ({
      isUploading,
      uploadImages,
    }),
    [isUploading, uploadImages]
  );

  return <ImageUploadContext.Provider value={value}>{children}</ImageUploadContext.Provider>;
}

export function useImageUpload(): ImageUploadContextValue {
  const context = useContext(ImageUploadContext);
  if (!context) {
    throw new Error('useImageUpload must be used within an ImageUploadProvider');
  }
  return context;
}

export function normalizeFileInput(input: FileList | File[] | null): File[] {
  if (!input) return [];
  if (Array.isArray(input)) {
    return input.filter(Boolean);
  }
  return Array.from(input).filter(Boolean);
}

export function extractErrorMessage(payload: unknown): string | null {
  if (!payload || typeof payload !== 'object') return null;
  const withMessage = payload as Record<string, unknown>;
  const message = withMessage.error || withMessage.message;
  return typeof message === 'string' ? message : null;
}

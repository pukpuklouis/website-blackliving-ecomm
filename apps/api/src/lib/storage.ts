import type { R2Bucket } from '@cloudflare/workers-types';

export class StorageManager {
  constructor(private r2: R2Bucket) {}

  /**
   * Upload a file to R2 storage
   */
  async uploadFile(
    key: string, 
    file: File | ArrayBuffer | Uint8Array | string,
    options: {
      contentType?: string;
      metadata?: Record<string, string>;
    } = {}
  ): Promise<{ key: string; url: string; size: number }> {
    try {
      let body: ArrayBuffer | Uint8Array | string;
      let contentType = options.contentType;
      let size = 0;

      if (file instanceof File) {
        body = await file.arrayBuffer();
        contentType = contentType || file.type;
        size = file.size;
      } else if (file instanceof ArrayBuffer) {
        body = file;
        size = file.byteLength;
      } else if (file instanceof Uint8Array) {
        body = file;
        size = file.length;
      } else {
        body = file;
        size = new TextEncoder().encode(file).length;
      }

      await this.r2.put(key, body, {
        httpMetadata: {
          contentType: contentType || 'application/octet-stream',
        },
        customMetadata: options.metadata,
      });

      const url = `https://images.blackliving.com/${key}`;
      
      return { key, url, size };
    } catch (error) {
      console.error('Storage upload error:', error);
      throw new Error('Failed to upload file');
    }
  }

  /**
   * Upload multiple files
   */
  async uploadFiles(
    files: Array<{ key: string; file: File | ArrayBuffer | Uint8Array | string; options?: any }>
  ): Promise<Array<{ key: string; url: string; size: number }>> {
    const uploadPromises = files.map(({ key, file, options = {} }) => 
      this.uploadFile(key, file, options)
    );
    
    return Promise.all(uploadPromises);
  }

  /**
   * Delete a file from R2 storage
   */
  async deleteFile(key: string): Promise<void> {
    try {
      await this.r2.delete(key);
    } catch (error) {
      console.error('Storage delete error:', error);
      throw new Error('Failed to delete file');
    }
  }

  /**
   * Delete multiple files
   */
  async deleteFiles(keys: string[]): Promise<void> {
    const deletePromises = keys.map(key => this.deleteFile(key));
    await Promise.all(deletePromises);
  }

  /**
   * Get file metadata
   */
  async getFileInfo(key: string): Promise<{
    key: string;
    size: number;
    contentType: string;
    lastModified: Date;
    metadata?: Record<string, string>;
  } | null> {
    try {
      const object = await this.r2.head(key);
      if (!object) return null;

      return {
        key,
        size: object.size,
        contentType: object.httpMetadata?.contentType || 'application/octet-stream',
        lastModified: object.uploaded,
        metadata: object.customMetadata,
      };
    } catch (error) {
      console.error('Storage get file info error:', error);
      return null;
    }
  }

  /**
   * List files with optional prefix
   */
  async listFiles(prefix?: string, limit = 100): Promise<Array<{
    key: string;
    size: number;
    lastModified: Date;
  }>> {
    try {
      const result = await this.r2.list({
        prefix,
        limit,
      });

      return result.objects.map(obj => ({
        key: obj.key,
        size: obj.size,
        lastModified: obj.uploaded,
      }));
    } catch (error) {
      console.error('Storage list files error:', error);
      return [];
    }
  }

  /**
   * Generate a unique file key with timestamp and random suffix
   */
  static generateFileKey(originalName: string, folder = 'uploads'): string {
    const timestamp = Date.now();
    const randomSuffix = Math.random().toString(36).substring(2, 8);
    const extension = originalName.split('.').pop();
    const nameWithoutExt = originalName.replace(/\.[^/.]+$/, '');
    const sanitizedName = nameWithoutExt.replace(/[^a-zA-Z0-9-_]/g, '-');
    
    return `${folder}/${timestamp}-${sanitizedName}-${randomSuffix}.${extension}`;
  }

  /**
   * Validate file type and size
   */
  static validateFile(
    file: File,
    allowedTypes: string[] = ['image/jpeg', 'image/png', 'image/webp'],
    maxSize = 5 * 1024 * 1024 // 5MB
  ): { valid: boolean; error?: string } {
    if (!allowedTypes.includes(file.type)) {
      return {
        valid: false,
        error: `File type ${file.type} is not allowed. Allowed types: ${allowedTypes.join(', ')}`
      };
    }

    if (file.size > maxSize) {
      return {
        valid: false,
        error: `File size ${(file.size / 1024 / 1024).toFixed(2)}MB exceeds maximum size ${(maxSize / 1024 / 1024)}MB`
      };
    }

    return { valid: true };
  }

  /**
   * Get file URL for a given key
   */
  static getFileUrl(key: string): string {
    return `https://images.blackliving.com/${key}`;
  }

  /**
   * Extract key from URL
   */
  static getKeyFromUrl(url: string): string {
    return url.replace('https://images.blackliving.com/', '');
  }
}

// Helper function to create storage manager instance
export function createStorageManager(r2: R2Bucket): StorageManager {
  return new StorageManager(r2);
}

// File type constants
export const FileTypes = {
  IMAGES: ['image/jpeg', 'image/png', 'image/webp', 'image/gif'],
  DOCUMENTS: ['application/pdf', 'text/plain', 'application/msword'],
  ALL: ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'application/pdf', 'text/plain'],
} as const;

// File size constants (in bytes)
export const FileSizes = {
  SMALL: 1 * 1024 * 1024,    // 1MB
  MEDIUM: 5 * 1024 * 1024,   // 5MB
  LARGE: 10 * 1024 * 1024,   // 10MB
  XLARGE: 50 * 1024 * 1024,  // 50MB
} as const;
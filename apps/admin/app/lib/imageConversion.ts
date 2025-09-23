const WEBP_MIME = 'image/webp';
const DEFAULT_QUALITY = 0.92;

export function toWebpFileName(originalName: string): string {
  const trimmed = originalName.trim();
  if (!trimmed) return 'image.webp';
  const withoutExt = trimmed.replace(/\.[^/.]+$/, '');
  return `${withoutExt || 'image'}.webp`;
}

export async function convertFileToWebP(file: File, quality = DEFAULT_QUALITY): Promise<File> {
  if (file.type === WEBP_MIME) {
    return file;
  }

  const targetName = toWebpFileName(file.name);
  const bitmap = await tryCreateImageBitmap(file);
  const { width, height, draw } = bitmap
    ? {
        width: bitmap.width,
        height: bitmap.height,
        draw: (ctx: CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D) => {
          ctx.drawImage(bitmap, 0, 0);
          bitmap.close?.();
        },
      }
    : await loadImageElement(file);

  const canvas = createCanvas(width, height);
  const context = canvas.getContext('2d');
  if (!context) {
    throw new Error('Unable to obtain 2D context for canvas when converting image.');
  }

  draw(context);

  const blob = await canvasToBlob(canvas, quality);
  return new File([blob], targetName, { type: WEBP_MIME });
}

async function tryCreateImageBitmap(file: File): Promise<ImageBitmap | null> {
  if (typeof createImageBitmap !== 'function') {
    return null;
  }

  try {
    return await createImageBitmap(file);
  } catch (error) {
    console.warn('createImageBitmap failed, falling back to HTMLImageElement', error);
    return null;
  }
}

async function loadImageElement(
  file: File
): Promise<{
  width: number;
  height: number;
  draw: (ctx: CanvasRenderingContext2D) => void;
}> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    const objectUrl = URL.createObjectURL(file);

    image.onload = () => {
      const { width, height } = image;
      resolve({
        width,
        height,
        draw: (ctx: CanvasRenderingContext2D) => {
          ctx.drawImage(image, 0, 0, width, height);
          URL.revokeObjectURL(objectUrl);
        },
      });
    };

    image.onerror = event => {
      URL.revokeObjectURL(objectUrl);
      reject(new Error('Unable to load image for WebP conversion.'));
      console.error('Image load error during WebP conversion:', event);
    };

    image.src = objectUrl;
  });
}

function createCanvas(width: number, height: number): HTMLCanvasElement | OffscreenCanvas {
  if (typeof OffscreenCanvas === 'function') {
    return new OffscreenCanvas(width, height);
  }

  if (typeof document === 'undefined') {
    throw new Error('Canvas APIs are not available in this environment.');
  }

  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  return canvas;
}

async function canvasToBlob(
  canvas: HTMLCanvasElement | OffscreenCanvas,
  quality: number
): Promise<Blob> {
  if ('convertToBlob' in canvas) {
    return canvas.convertToBlob({ type: WEBP_MIME, quality });
  }

  const htmlCanvas = canvas as HTMLCanvasElement;
  return new Promise((resolve, reject) => {
    htmlCanvas.toBlob(
      blob => {
        if (!blob) {
          reject(new Error('Failed to convert canvas to WebP blob.'));
          return;
        }
        resolve(blob);
      },
      WEBP_MIME,
      quality
    );
  });
}

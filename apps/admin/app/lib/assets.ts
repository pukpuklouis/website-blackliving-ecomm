export type UploadResult = { key?: string | null; url?: string | null };

export function resolveAssetUrl(
  file: UploadResult,
  cdnUrl?: string,
  fallbackBase?: string
): string {
  const key = file?.key ? String(file.key) : undefined;
  const providedUrl = file?.url ? String(file.url) : undefined;

  if (cdnUrl && key) {
    return joinUrlSegments(cdnUrl, key);
  }

  if (providedUrl) {
    return providedUrl;
  }

  if (fallbackBase && key) {
    return joinUrlSegments(fallbackBase, key);
  }

  return key || providedUrl || '';
}

export function joinUrlSegments(base: string, key: string): string {
  const normalizedBase = base.replace(/\/+$/, '');
  const normalizedKey = key.replace(/^\/+/, '');
  return `${normalizedBase}/${normalizedKey}`;
}

export function extractAssetKey(value: string | undefined): string | undefined {
  if (!value) return undefined;
  try {
    const parsed = new URL(value);
    if (parsed.protocol === 'data:') return value;
    return stripMediaPrefix(parsed.pathname.replace(/^\//, ''));
  } catch (error) {
    return stripMediaPrefix(value.replace(/^\//, ''));
  }
}

function stripMediaPrefix(v: string): string {
  return v.startsWith('media/') ? v.slice('media/'.length) : v;
}

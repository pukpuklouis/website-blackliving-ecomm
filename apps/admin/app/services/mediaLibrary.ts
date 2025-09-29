import { safeParseJSON } from '../lib/http';

export type MediaLibraryCategory = 'images' | 'files' | 'all';

export type MediaLibraryItem = {
  key: string;
  name: string;
  url: string;
  size: number;
  contentType?: string;
  lastModified: string;
  metadata?: Record<string, string>;
  isImage: boolean;
};

export type MediaLibraryResponse = {
  items: MediaLibraryItem[];
  pageInfo: {
    nextCursor: string | null;
    hasMore: boolean;
  };
};

type MediaLibraryApiSuccess = {
  success: true;
  data: MediaLibraryResponse;
};

type MediaLibraryApiError = {
  success: false;
  error?: string;
};

type MediaLibraryApiResponse = MediaLibraryApiSuccess | MediaLibraryApiError;

export type FetchMediaLibraryParams = {
  cursor?: string | null;
  limit?: number;
  type?: MediaLibraryCategory;
  search?: string;
  prefix?: string;
  sort?: 'recent' | 'name';
};

export async function fetchMediaLibrary(
  params: FetchMediaLibraryParams = {},
  apiBase?: string
): Promise<MediaLibraryResponse> {
  const apiUrl = apiBase || (import.meta.env.PUBLIC_API_URL as string | undefined)?.trim();

  if (!apiUrl) {
    throw new Error('PUBLIC_API_URL is not configured.');
  }

  const query = new URLSearchParams();

  const { cursor, limit, type = 'all', search, prefix, sort = 'recent' } = params;

  if (cursor) {
    query.set('cursor', cursor);
  }
  if (limit) {
    query.set('limit', String(limit));
  }
  if (type && type !== 'all') {
    query.set('type', type);
  }
  if (search) {
    query.set('search', search);
  }
  if (prefix) {
    query.set('prefix', prefix);
  }
  if (sort) {
    query.set('sort', sort);
  }

  const url = `${apiUrl.replace(/\/$/, '')}/api/admin/media/library${
    query.size ? `?${query.toString()}` : ''
  }`;

  const response = await fetch(url, {
    credentials: 'include',
  });

  const payload = (await safeParseJSON(response)) as MediaLibraryApiResponse | null;

  if (!response.ok) {
    const message =
      (payload && 'error' in payload && typeof payload.error === 'string'
        ? payload.error
        : undefined) || 'Failed to fetch media library';
    throw new Error(message);
  }

  if (!payload || payload.success !== true || !payload.data) {
    throw new Error('Malformed response from media library endpoint');
  }

  const { items, pageInfo } = payload.data;

  return {
    items: Array.isArray(items) ? items : [],
    pageInfo: {
      nextCursor:
        pageInfo && typeof pageInfo.nextCursor === 'string'
          ? pageInfo.nextCursor
          : pageInfo?.nextCursor ?? null,
      hasMore: Boolean(pageInfo?.hasMore),
    },
  };
}

import { Hono } from 'hono';
import type { R2Bucket, R2GetOptions, R2Object, R2ObjectBody } from '@cloudflare/workers-types';

const MEDIA_CACHE_SECONDS = 60 * 60 * 24 * 365; // 1 year
const IMMUTABLE_CACHE_CONTROL = `public, max-age=${MEDIA_CACHE_SECONDS}, immutable`;
const PROTECTED_PREFIXES = ['private'];

interface MediaBindings {
  R2: R2Bucket;
}

const media = new Hono<{ Bindings: MediaBindings }>();

media.get('/:key{.+}', async (c) => {
  const rawKey = c.req.param('key');
  const key = sanitizeKey(rawKey);

  if (!key) {
    console.warn('[media] rejected empty or invalid key', { rawKey });
    return c.json({ error: 'Missing or invalid key' }, 400);
  }

  if (isProtectedKey(key)) {
    console.warn('[media] attempted access to protected key', {
      key,
      ip: c.req.header('cf-connecting-ip'),
    });
    return c.json({ error: 'Forbidden' }, 403);
  }

  const rangeHeader = c.req.header('range');
  const parsedRange = rangeHeader ? parseRange(rangeHeader) : undefined;

  if (rangeHeader && !parsedRange) {
    return new Response('Invalid Range', {
      status: 416,
      headers: { 'Content-Range': `bytes */${(await getObjectSize(c.env.R2, key)) ?? '*'}` },
    });
  }

  const cacheKey = createCacheRequest(c.req.raw);

  if (!parsedRange) {
    const cacheHit = await caches.default.match(cacheKey);
    if (cacheHit) {
      console.info('[media] cache hit', { key });
      return augmentCachedResponse(cacheHit);
    }
  }

  const getOptions = buildGetOptions(parsedRange, c.req.raw.headers);

  const object = await c.env.R2.get(key, getOptions);

  if (!object) {
    console.warn('[media] object not found', { key });
    return new Response('Not Found', { status: 404 });
  }

  const response = buildObjectResponse(object, parsedRange);

  if (!parsedRange) {
    await caches.default.put(cacheKey, response.clone());
    console.info('[media] stored in cache', { key });
  }

  return response;
});

media.on('HEAD', '/:key{.+}', async (c) => {
  const rawKey = c.req.param('key');
  const key = sanitizeKey(rawKey);

  if (!key) {
    return new Response(null, { status: 400 });
  }

  const object = await c.env.R2.head(key);
  if (!object) {
    return new Response(null, { status: 404 });
  }

  const headers = new Headers();
  object.writeHttpMetadata(headers);
  headers.set('Cache-Control', IMMUTABLE_CACHE_CONTROL);
  headers.set('Accept-Ranges', 'bytes');
  if (object.httpEtag) {
    headers.set('ETag', object.httpEtag);
  }
  headers.set('Last-Modified', object.uploaded.toUTCString());

  return new Response(null, {
    status: 200,
    headers,
  });
});

export default media;

function sanitizeKey(rawKey?: string): string | null {
  if (!rawKey) return null;
  try {
    const decoded = decodeURIComponent(rawKey);
    const normalized = decoded.replace(/^\/+/, '').replace(/\\/g, '/');
    if (!normalized || normalized.includes('..')) {
      return null;
    }
    return normalized;
  } catch (error) {
    console.error('[media] failed to decode key', { rawKey, error });
    return null;
  }
}

function isProtectedKey(key: string): boolean {
  return PROTECTED_PREFIXES.some((prefix) => key.startsWith(`${prefix}/`));
}

function createCacheRequest(request: Request): Request {
  const headers = new Headers();
  const varyHeaders = ['accept'] as const;
  varyHeaders.forEach((header) => {
    const value = request.headers.get(header);
    if (value) headers.set(header, value);
  });
  return new Request(request.url, {
    method: 'GET',
    headers,
  });
}

type ParsedRange =
  | { type: 'bytes'; start: number; end?: number }
  | { type: 'suffix'; length: number };

function parseRange(header: string): ParsedRange | undefined {
  if (!header.startsWith('bytes=')) return undefined;
  const value = header.slice('bytes='.length).trim();

  // suffix form: "-500"
  if (value.startsWith('-')) {
    const suffixLength = Number(value.slice(1));
    if (!Number.isInteger(suffixLength) || suffixLength <= 0) return undefined;
    return { type: 'suffix', length: suffixLength };
  }

  const [startStr, endStr = ''] = value.split('-', 2);
  if (!startStr) return undefined;

  const start = Number(startStr);
  if (!Number.isInteger(start) || start < 0) return undefined;

  if (!endStr) {
    return { type: 'bytes', start };
  }

  const end = Number(endStr);
  if (!Number.isInteger(end) || end < start) return undefined;

  return { type: 'bytes', start, end };
}

function buildGetOptions(range: ParsedRange | undefined, headers: Headers): R2GetOptions {
  const options: R2GetOptions = {};

  const conditionalHeaders = new Headers();
  for (const header of ['if-none-match', 'if-match', 'if-modified-since', 'if-unmodified-since']) {
    const value = headers.get(header);
    if (value) {
      conditionalHeaders.set(header, value);
    }
  }

  if ([...conditionalHeaders.keys()].length > 0) {
    options.onlyIf = conditionalHeaders;
  }

  if (range) {
    if (range.type === 'bytes') {
      options.range =
        range.end !== undefined
          ? { offset: range.start, length: range.end - range.start + 1 }
          : { offset: range.start };
    } else {
      options.range = { suffix: range.length };
    }
  }

  return options;
}

function buildObjectResponse(
  object: R2ObjectBody | R2Object,
  requestedRange?: ParsedRange
): Response {
  const headers = new Headers();
  object.writeHttpMetadata(headers);
  headers.set('Cache-Control', IMMUTABLE_CACHE_CONTROL);
  headers.set('Accept-Ranges', 'bytes');
  headers.set('Last-Modified', object.uploaded.toUTCString());
  if (object.httpEtag) {
    headers.set('ETag', object.httpEtag);
  }

  const bodyAvailable = 'body' in object && object.body;

  if (requestedRange && bodyAvailable) {
    const totalSize = object.size;
    const { start, end } = resolveRangeBounds(requestedRange, totalSize);
    headers.set('Content-Range', `bytes ${start}-${end}/${totalSize}`);
    headers.set('Content-Length', String(end - start + 1));
    return new Response(object.body!, {
      status: 206,
      headers,
    });
  }

  headers.set('Content-Length', String(object.size));

  if (!bodyAvailable) {
    return new Response(null, {
      status: 304,
      headers,
    });
  }

  return new Response(object.body!, {
    status: 200,
    headers,
  });
}

function resolveRangeBounds(range: ParsedRange, totalSize: number): { start: number; end: number } {
  if (range.type === 'bytes') {
    const start = range.start;
    const end = Math.min(range.end ?? totalSize - 1, totalSize - 1);
    return { start, end };
  }

  const length = Math.min(range.length, totalSize);
  const end = totalSize - 1;
  const start = Math.max(0, totalSize - length);
  return { start, end };
}

async function getObjectSize(r2: R2Bucket, key: string): Promise<number | undefined> {
  try {
    const object = await r2.head(key);
    return object?.size;
  } catch (error) {
    console.error('[media] failed to head object for size', { key, error });
    return undefined;
  }
}

function augmentCachedResponse(response: Response): Response {
  const headers = new Headers(response.headers);
  headers.set('CF-Cache-Status', 'HIT');
  return new Response(response.body, {
    status: response.status,
    headers,
  });
}

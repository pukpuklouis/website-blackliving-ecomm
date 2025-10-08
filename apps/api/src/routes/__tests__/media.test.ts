import { describe, it, expect, beforeEach } from 'vitest';
import { Hono } from 'hono';
import media from '../media';
import type { R2Bucket, R2Range } from '@cloudflare/workers-types';

class FakeCache {
  private store = new Map<string, Response>();

  async match(request: Request): Promise<Response | undefined> {
    const key = normalizeUrl(request.url);
    const response = this.store.get(key);
    return response?.clone();
  }

  async put(request: Request, response: Response): Promise<void> {
    const key = normalizeUrl(request.url);
    this.store.set(key, response.clone());
  }

  async delete(request: Request): Promise<boolean> {
    const key = normalizeUrl(request.url);
    return this.store.delete(key);
  }
}

const uploadedAt = new Date('2024-01-01T00:00:00.000Z');

function createFakeBucket(data: Record<string, string | Uint8Array>, contentType = 'text/plain') {
  let getCalls = 0;
  const encoder = new TextEncoder();
  const store = new Map<string, Uint8Array>(
    Object.entries(data).map(([key, value]) => [
      key,
      typeof value === 'string' ? encoder.encode(value) : value,
    ])
  );

  const bucket: Partial<R2Bucket> = {
    async get(key: string, options?: { range?: R2Range }): Promise<any> {
      getCalls += 1;
      const record = store.get(key);
      if (!record) return null;
      return createObjectBody(key, record, contentType, options?.range);
    },
    async head(key: string): Promise<any> {
      const record = store.get(key);
      if (!record) return null;
      return createObjectMeta(key, record, contentType);
    },
  };

  return {
    bucket: bucket as R2Bucket,
    getCallCount: () => getCalls,
  };
}

function createObjectMeta(key: string, body: Uint8Array, contentType: string) {
  return {
    key,
    version: '1',
    size: body.length,
    etag: `"${key}-etag"`,
    httpEtag: `"${key}-etag"`,
    checksums: {} as any,
    uploaded: uploadedAt,
    httpMetadata: { contentType, cacheControl: 'public, max-age=31536000, immutable' },
    customMetadata: {},
    writeHttpMetadata(headers: Headers) {
      if (this.httpMetadata?.contentType)
        headers.set('Content-Type', this.httpMetadata.contentType);
      if (this.httpMetadata?.cacheControl)
        headers.set('Cache-Control', this.httpMetadata.cacheControl);
    },
  };
}

function createObjectBody(key: string, body: Uint8Array, contentType: string, range?: R2Range) {
  let slice = body;
  let appliedRange: { offset: number; length?: number; suffix?: number } | undefined;

  if (range) {
    if ('suffix' in range && typeof range.suffix === 'number') {
      const length = Math.min(range.suffix, body.length);
      slice = body.slice(body.length - length);
      appliedRange = { suffix: length };
    } else {
      const offset = Math.max(0, range.offset ?? 0);
      const length =
        range.length && range.length > 0
          ? Math.min(range.length, body.length - offset)
          : body.length - offset;
      slice = body.slice(offset, offset + length);
      appliedRange = { offset, length };
    }
  }

  const response = new Response(slice);
  const meta = createObjectMeta(key, body, contentType);

  return {
    ...meta,
    range: appliedRange,
    get body() {
      return response.body!;
    },
    get bodyUsed() {
      return response.bodyUsed;
    },
    async arrayBuffer() {
      const cloned = new Uint8Array(slice);
      return cloned.buffer.slice(cloned.byteOffset, cloned.byteOffset + cloned.byteLength);
    },
    async bytes() {
      return new Uint8Array(slice);
    },
    async text() {
      return new TextDecoder().decode(slice);
    },
    async json<T>() {
      return JSON.parse(new TextDecoder().decode(slice)) as T;
    },
    async blob() {
      return new Blob([slice]);
    },
  };
}

function normalizeUrl(url: string): string {
  return new URL(url).toString();
}

function createApp(bucket: R2Bucket) {
  const app = new Hono();
  app.route('/media', media);
  const env = { R2: bucket };
  return { app, env };
}

describe('media delivery route', () => {
  beforeEach(() => {
    // @ts-expect-error - provide custom caches implementation for tests
    globalThis.caches = { default: new FakeCache() };
  });

  it('streams existing objects with immutable headers', async () => {
    const { bucket } = createFakeBucket({ 'uploads/example.txt': 'hello world' });
    const { app, env } = createApp(bucket);

    const response = await app.request('http://example.dev/media/uploads/example.txt', {}, env);

    expect(response.status).toBe(200);
    expect(await response.text()).toBe('hello world');
    expect(response.headers.get('Cache-Control')).toBe('public, max-age=31536000, immutable');
    expect(response.headers.get('Content-Type')).toBe('text/plain');
    expect(response.headers.get('Accept-Ranges')).toBe('bytes');
  });

  it('returns 404 when object is missing', async () => {
    const { bucket } = createFakeBucket({});
    const { app, env } = createApp(bucket);

    const response = await app.request('http://example.dev/media/uploads/missing.jpg', {}, env);

    expect(response.status).toBe(404);
  });

  it('honors byte range requests', async () => {
    const { bucket } = createFakeBucket(
      { 'uploads/data.bin': 'abcdefghijk' },
      'application/octet-stream'
    );
    const { app, env } = createApp(bucket);

    const response = await app.request(
      'http://example.dev/media/uploads/data.bin',
      { headers: { range: 'bytes=0-3' } },
      env
    );

    expect(response.status).toBe(206);
    expect(await response.text()).toBe('abcd');
    expect(response.headers.get('Content-Range')).toBe('bytes 0-3/11');
    expect(response.headers.get('Content-Length')).toBe('4');
  });

  it('returns cached content without hitting R2', async () => {
    const tracker = createFakeBucket({ 'uploads/foo.txt': 'cache me' });
    const { app, env } = createApp(tracker.bucket);

    const first = await app.request('http://example.dev/media/uploads/foo.txt', {}, env);
    expect(first.status).toBe(200);
    expect(await first.text()).toBe('cache me');
    expect(tracker.getCallCount()).toBe(1);

    const second = await app.request('http://example.dev/media/uploads/foo.txt', {}, env);
    expect(second.status).toBe(200);
    expect(await second.text()).toBe('cache me');
    expect(second.headers.get('CF-Cache-Status')).toBe('HIT');
    expect(tracker.getCallCount()).toBe(1);
  });

  it('blocks access to protected prefixes', async () => {
    const { bucket } = createFakeBucket({ 'private/secret.txt': 'top secret' });
    const { app, env } = createApp(bucket);

    const response = await app.request('http://example.dev/media/private/secret.txt', {}, env);
    expect(response.status).toBe(403);
  });

  it('supports HEAD metadata requests', async () => {
    const { bucket } = createFakeBucket(
      { 'uploads/meta.png': new Uint8Array([0, 1, 2]) },
      'image/png'
    );
    const { app, env } = createApp(bucket);

    const response = await app.request(
      'http://example.dev/media/uploads/meta.png',
      { method: 'HEAD' },
      env
    );

    expect(response.status).toBe(200);
    expect(response.headers.get('Content-Type')).toBe('image/png');
    expect(response.headers.get('Cache-Control')).toBe('public, max-age=31536000, immutable');
  });

  it('rejects invalid range headers', async () => {
    const { bucket } = createFakeBucket({ 'uploads/file.txt': '12345' });
    const { app, env } = createApp(bucket);

    const response = await app.request(
      'http://example.dev/media/uploads/file.txt',
      { headers: { range: 'bytes=5-1' } },
      env
    );

    expect(response.status).toBe(416);
  });
});

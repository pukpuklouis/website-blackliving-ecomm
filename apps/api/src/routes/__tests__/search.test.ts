import { describe, expect, it, beforeEach, vi } from 'vitest';
import { Hono } from 'hono';

import searchRouter from '../search';
import type { UnifiedSearchResponse } from '@blackliving/types/search';

interface SelectBuilder<T> {
  from: ReturnType<typeof vi.fn>;
  where: ReturnType<typeof vi.fn>;
  orderBy: ReturnType<typeof vi.fn>;
  limit: ReturnType<typeof vi.fn> & ((value: number) => Promise<T[]>);
}

describe('GET /api/search', () => {
  const app = new Hono();
  const cache = {
    get: vi.fn<[], Promise<UnifiedSearchResponse | null>>(),
    set: vi.fn(),
    deleteByPrefix: vi.fn(),
    delete: vi.fn(),
  };

  const db = {
    select: vi.fn(),
  } as unknown as {
    select: ReturnType<typeof vi.fn>;
  };

  app.use('*', async (c, next) => {
    c.set('db', db);
    c.set('cache', cache as any);
    await next();
  });

  app.route('/api/search', searchRouter);

  const createSelectBuilder = <T>(rows: T[]): SelectBuilder<T> => {
    const builder: any = {
      from: vi.fn().mockReturnThis(),
      where: vi.fn().mockReturnThis(),
      orderBy: vi.fn().mockReturnThis(),
      limit: vi.fn().mockResolvedValue(rows),
    };
    return builder;
  };

  beforeEach(() => {
    vi.clearAllMocks();
    cache.get.mockResolvedValue(null);
  });

  it('validates required query parameter', async () => {
    const res = await app.request('/api/search');
    expect(res.status).toBe(400);
  });

  it('returns combined search results', async () => {
    const productRows = [
      {
        id: 'prod-1',
        name: 'Simmons Black Pillow Top',
        slug: 'simmons-black-pillow-top',
        description: 'Premium Simmons mattress for back support',
        category: 'simmons-black',
        images: ['https://example.com/mattress.jpg'],
        inStock: true,
      },
    ];

    const postRows = [
      {
        id: 'post-1',
        title: 'Simmons 床墊挑選指南',
        slug: 'choose-mattress',
        description: '床墊挑選指南',
        category: '睡眠指南',
        featuredImage: 'https://example.com/post.jpg',
        publishedAt: Date.now(),
        readingTime: 6,
      },
    ];

    (db.select as any)
      .mockImplementationOnce(() => createSelectBuilder(productRows))
      .mockImplementationOnce(() => createSelectBuilder(postRows));

    const res = await app.request('/api/search?q=simmons&limit=5');
    expect(res.status).toBe(200);

    const body = await res.json();
    expect(body.success).toBe(true);
    expect(body.data.total).toBeGreaterThanOrEqual(3);
    expect(body.data.results.products).toHaveLength(1);
    expect(body.data.results.posts).toHaveLength(1);
    expect(body.data.results.pages.length).toBeGreaterThanOrEqual(1);
    expect(cache.set).toHaveBeenCalled();
  });

  it('returns cached response when available', async () => {
    const cachedResponse: UnifiedSearchResponse = {
      query: 'foam',
      total: 1,
      took: 10,
      results: {
        products: [
          {
            id: 'prod-1',
            title: 'Cached product',
            description: 'Foam mattress',
            category: 'simmons-black',
            slug: 'cached-product',
            href: '/simmons-black/cached-product',
            type: 'product',
            thumbnail: null,
            metadata: null,
          },
        ],
        posts: [],
        pages: [],
      },
    };

    cache.get.mockResolvedValueOnce(cachedResponse);

    const res = await app.request('/api/search?q=foam');
    expect(res.status).toBe(200);
    const body = await res.json();

    expect(body.cached).toBe(true);
    expect(body.data.results.products[0].title).toBe('Cached product');
    expect(db.select).not.toHaveBeenCalled();
    expect(cache.set).not.toHaveBeenCalled();
  });

  it('honours type filters by skipping queries', async () => {
    const res = await app.request('/api/search?q=appointment&types=pages');
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(db.select).not.toHaveBeenCalled();
    expect(body.data.results.products).toHaveLength(0);
    expect(body.data.results.pages.length).toBeGreaterThan(0);
  });

  it('handles empty search results gracefully', async () => {
    (db.select as any)
      .mockImplementationOnce(() => createSelectBuilder([]))
      .mockImplementationOnce(() => createSelectBuilder([]));

    const res = await app.request('/api/search?q=nope');
    expect(res.status).toBe(200);

    const body = await res.json();
    expect(body.data.total).toBeGreaterThanOrEqual(0);
    expect(body.data.results.products).toHaveLength(0);
    expect(body.data.results.posts).toHaveLength(0);
  });
});

import { describe, expect, it } from 'vitest';
import { productCategories } from '@blackliving/db';

import {
  normalizeCategoryRecord,
  normalizeCategoryUrlPath,
  parseCategoryFeaturesInput,
  toCategoryIsoString,
} from '../../modules/admin';

describe('admin product category helpers', () => {
  it('parses feature collections from arrays and strings', () => {
    expect(parseCategoryFeaturesInput([' A ', 'B', '', 42])).toEqual(['A', 'B', '42']);

    expect(parseCategoryFeaturesInput('One,Two\nThree')).toEqual(['One', 'Two', 'Three']);

    expect(parseCategoryFeaturesInput(null)).toEqual([]);
  });

  it('normalizes category url paths', () => {
    expect(normalizeCategoryUrlPath(undefined, 'test')).toBe('/test');
    expect(normalizeCategoryUrlPath('', 'test')).toBe('/test');
    expect(normalizeCategoryUrlPath('custom-path', 'test')).toBe('/custom-path');
    expect(normalizeCategoryUrlPath('/prefixed', 'test')).toBe('/prefixed');
  });

  it('normalizes category records with stats', () => {
    const createdAt = new Date('2024-01-01T00:00:00.000Z');
    const updatedAt = new Date('2024-01-02T12:34:56.000Z');

    const record: typeof productCategories.$inferSelect = {
      id: 'cat_test',
      slug: 'test',
      title: '測試分類',
      description: '描述',
      series: '系列',
      brand: '品牌',
      features: ['特色一', '特色二'],
      seoKeywords: null,
      urlPath: null,
      isActive: true,
      sortOrder: 5,
      createdAt,
      updatedAt,
    };

    const normalized = normalizeCategoryRecord(record, {
      productCount: 3,
      inStockCount: 2,
    });

    expect(normalized.slug).toBe('test');
    expect(normalized.urlPath).toBe('/test');
    expect(normalized.features).toEqual(['特色一', '特色二']);
    expect(normalized.isActive).toBe(true);
    expect(normalized.stats).toEqual({ productCount: 3, inStockCount: 2 });
    expect(normalized.createdAt).toBe(createdAt.toISOString());
    expect(normalized.updatedAt).toBe(updatedAt.toISOString());
  });

  it('formats timestamps into ISO strings', () => {
    expect(toCategoryIsoString(new Date('2024-03-01T00:00:00.000Z'))).toBe(
      '2024-03-01T00:00:00.000Z'
    );
    expect(toCategoryIsoString(1709251200000)).toBe('2024-03-01T00:00:00.000Z');
    expect(toCategoryIsoString('2024-03-01T00:00:00.000Z')).toBe('2024-03-01T00:00:00.000Z');
  });
});

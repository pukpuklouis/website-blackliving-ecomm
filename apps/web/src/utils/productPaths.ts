import type { CategoryConfig } from '../types/category.ts';

const API_BASE = import.meta.env.PUBLIC_API_BASE_URL || 'http://localhost:8787';

type CategoryApiEntry = {
  category: Record<string, unknown>;
  stats?: { productCount?: number; inStockCount?: number };
  sampleProducts?: unknown[];
};

type CategoryListResponse = {
  success: boolean;
  data?: {
    categories?: CategoryApiEntry[];
  };
};

type CategoryDetailResponse = {
  success: boolean;
  data?: CategoryApiEntry;
};

type FetchCategoryResult = {
  categoryConfig: CategoryConfig | null;
  stats?: { productCount: number; inStockCount: number };
  error: string | null;
  notFound: boolean;
};

function normalizeFeatures(rawFeatures: unknown): string[] {
  if (Array.isArray(rawFeatures)) {
    return rawFeatures.map((feature) => String(feature));
  }

  if (typeof rawFeatures === 'string') {
    try {
      const parsed = JSON.parse(rawFeatures);
      if (Array.isArray(parsed)) {
        return parsed.map((feature) => String(feature));
      }
      return [rawFeatures];
    } catch {
      return rawFeatures
        .split(',')
        .map((feature) => feature.trim())
        .filter(Boolean);
    }
  }

  return [];
}

function coerceBoolean(input: unknown): boolean | undefined {
  if (typeof input === 'boolean') {
    return input;
  }
  if (typeof input === 'number') {
    return input === 1;
  }
  if (typeof input === 'string') {
    if (input === '1' || input.toLowerCase() === 'true') {
      return true;
    }
    if (input === '0' || input.toLowerCase() === 'false') {
      return false;
    }
  }
  return undefined;
}

function mapCategoryPayload(payload: Record<string, unknown> | undefined): CategoryConfig | null {
  if (!payload) {
    return null;
  }

  const slugCandidate =
    typeof payload.slug === 'string'
      ? payload.slug
      : typeof payload.category === 'string'
        ? payload.category
        : null;

  if (!slugCandidate) {
    return null;
  }

  const features = normalizeFeatures(payload.features);
  const urlPath =
    typeof payload.urlPath === 'string' && payload.urlPath.length > 0
      ? payload.urlPath
      : `/shop/${slugCandidate}`;

  const title =
    typeof payload.title === 'string' && payload.title.length > 0 ? payload.title : slugCandidate;

  const series =
    typeof payload.series === 'string' && payload.series.length > 0 ? payload.series : title;

  return {
    slug: slugCandidate,
    category: slugCandidate,
    title,
    description: typeof payload.description === 'string' ? payload.description : '',
    series,
    brand: typeof payload.brand === 'string' ? payload.brand : '',
    features,
    seoKeywords: typeof payload.seoKeywords === 'string' ? payload.seoKeywords : '',
    urlPath,
    isActive: coerceBoolean(payload.isActive),
    sortOrder:
      typeof payload.sortOrder === 'number'
        ? payload.sortOrder
        : typeof payload.sortOrder === 'string'
          ? Number.parseInt(payload.sortOrder, 10)
          : undefined,
  };
}

async function fetchJson<T>(endpoint: string): Promise<T | null> {
  try {
    const response = await fetch(`${API_BASE}${endpoint}`);

    if (!response.ok) {
      if (response.status === 404) {
        return null;
      }
      throw new Error(`Request failed with status ${response.status}`);
    }

    return (await response.json()) as T;
  } catch (error) {
    console.error(`Failed to fetch ${endpoint}:`, error);
    return null;
  }
}

export async function fetchCategories(): Promise<CategoryConfig[]> {
  const data = await fetchJson<CategoryListResponse>('/api/products/categories');

  if (!data || !data.success) {
    return [];
  }

  const entries = data.data?.categories ?? [];

  return entries
    .map((entry) => mapCategoryPayload(entry.category as Record<string, unknown>))
    .filter((category): category is CategoryConfig => category !== null);
}

export async function generateCategoryStaticPaths() {
  const categories = await fetchCategories();

  if (categories.length === 0) {
    console.warn('No categories available for static generation, using fallback category path');
    return [
      {
        params: { category: 'catalog-sample' },
        props: {
          categoryConfig: {
            slug: 'catalog-sample',
            category: 'catalog-sample',
            title: '示範產品分類',
            description: '此為預設示範分類，請確認 API 類別資料是否正確提供。',
            series: 'Sample Series',
            brand: 'Black Living',
            features: ['示範特色一', '示範特色二', '示範特色三'],
            seoKeywords: 'sample,category',
            urlPath: '/shop/catalog-sample',
          } satisfies CategoryConfig,
        },
      },
    ];
  }

  return categories.map((category) => ({
    params: { category: category.slug },
    props: { categoryConfig: category },
  }));
}

export async function generateProductStaticPaths() {
  const categories = await fetchCategories();

  if (categories.length === 0) {
    console.warn('No categories available for product static generation, using fallback paths');
    return [
      {
        params: { category: 'catalog-sample', productSlug: 'sample-product' },
      },
    ];
  }

  const paths = await Promise.all(
    categories.map(async (category) => {
      const response = await fetchJson<any>(
        `/api/products?category=${encodeURIComponent(category.slug)}`
      );

      const productsData = response?.data?.products;

      if (!Array.isArray(productsData) || productsData.length === 0) {
        return [];
      }

      return productsData.map((product: Record<string, unknown>) => ({
        params: {
          category: category.slug,
          productSlug: typeof product.slug === 'string' ? product.slug : `${category.slug}-sample`,
        },
        props: {
          categoryConfig: category,
        },
      }));
    })
  );

  return paths.flat();
}

export async function fetchCategoryConfig(
  slug: string,
  fallback?: CategoryConfig
): Promise<FetchCategoryResult> {
  const detail = await fetchJson<CategoryDetailResponse>(
    `/api/products/categories/${encodeURIComponent(slug)}`
  );

  if (!detail) {
    if (fallback) {
      return {
        categoryConfig: fallback,
        stats: undefined,
        error: 'Category fetch failed, using fallback data',
        notFound: false,
      };
    }

    return {
      categoryConfig: null,
      stats: undefined,
      error: 'Category not found',
      notFound: true,
    };
  }

  if (!detail.success) {
    return {
      categoryConfig: fallback ?? null,
      stats: undefined,
      error: 'Category response returned unsuccessful status',
      notFound: !fallback,
    };
  }

  const mapped = mapCategoryPayload(detail.data?.category as Record<string, unknown>);

  if (!mapped) {
    return {
      categoryConfig: fallback ?? null,
      stats: undefined,
      error: 'Category payload missing or malformed',
      notFound: !fallback,
    };
  }

  return {
    categoryConfig: mapped,
    stats: {
      productCount: Number(detail.data?.stats?.productCount ?? 0),
      inStockCount: Number(detail.data?.stats?.inStockCount ?? 0),
    },
    error: null,
    notFound: false,
  };
}

export async function fetchProduct(productSlug: string) {
  try {
    const response = await fetch(`${API_BASE}/api/products/${productSlug}`);

    if (!response.ok) {
      if (response.status === 404) {
        return { product: null, error: null, notFound: true };
      }
      throw new Error(`Failed to fetch product: ${response.status}`);
    }

    const data = await response.json();
    const product = data && data.success && data.data ? data.data : null;

    return { product, error: null, notFound: false };
  } catch (err) {
    console.error('Error fetching product:', err);
    const error = err instanceof Error ? err.message : 'Unknown error occurred';
    return { product: null, error, notFound: false };
  }
}

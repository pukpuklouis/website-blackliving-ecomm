// API configuration
const API_BASE = import.meta.env.PUBLIC_API_BASE_URL || 'http://localhost:8787';

export async function generateStaticPaths(category: string) {
  try {
    console.log('Fetching static paths from:', `${API_BASE}/api/products?category=${category}`);

    // Fetch all products for the category for static generation
    const response = await fetch(`${API_BASE}/api/products?category=${category}`);

    if (!response.ok) {
      console.error(
        'Failed to fetch products for static paths:',
        response.status,
        response.statusText
      );
      // Fallback to hardcoded paths during development
      return [{ params: { productSlug: `${category}-sample` } }];
    }

    const data = await response.json();
    const products =
      data && data.success && data.data && data.data.products ? data.data.products : [];

    // Ensure products is an array before calling map
    if (!Array.isArray(products)) {
      console.error('Products data is not an array:', products);
      // Fallback to hardcoded paths
      return [{ params: { productSlug: `${category}-sample` } }];
    }

    if (products.length === 0) {
      console.warn('No products found, using fallback paths');
      return [{ params: { productSlug: `${category}-sample` } }];
    }

    const paths = products.map((product: any) => ({
      params: { productSlug: product.slug },
    }));

    console.log('Generated static paths:', paths);
    return paths;
  } catch (error) {
    console.error('Error fetching static paths:', error);
    // Fallback to hardcoded paths during development
    return [{ params: { productSlug: `${category}-sample` } }];
  }
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

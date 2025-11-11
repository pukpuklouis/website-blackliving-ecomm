import type { Route } from './+types/dashboard.products';
import { useLoaderData } from 'react-router';
import ProductManagement from '../../components/ProductManagement';

export const loader: Route.Loader = async ({ request, context }) => {
  try {
    // Use Service Binding if available (production/staging), otherwise use HTTP fetch (local dev)
    const apiService = context?.env?.API || context?.cloudflare?.env?.API;
    const apiUrl =
      context?.cloudflare?.env?.PUBLIC_API_URL ||
      context?.env?.PUBLIC_API_URL ||
      'http://localhost:8787';

    let res;
    if (apiService) {
      const apiRequest = new Request('http://internal/api/products', {
        method: 'GET',
      });
      res = await apiService.fetch(apiRequest);
    } else {
      res = await fetch(`${apiUrl}/api/products`, {
        // forward cookies for auth-required endpoints
        headers: { cookie: request.headers.get('cookie') ?? '' },
        credentials: 'include',
      });
    }

    if (!res.ok) {
      return Response.json({ products: [] });
    }
    const data = await res.json();
    const products = data?.success ? (data?.data?.products ?? []) : [];
    return Response.json({ products });
  } catch (e) {
    console.error('[Products] Error loading products:', e);
    return Response.json({ products: [] });
  }
};

export default function ProductsPage() {
  const { products } = useLoaderData<typeof loader>();
  return <ProductManagement initialProducts={products} />;
}

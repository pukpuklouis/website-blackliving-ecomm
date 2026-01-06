import { useLoaderData } from "react-router";
import ProductEditPage from "../../components/ProductEditPage";

export const loader = async ({ params, request, context }: any) => {
  const productId = params.productId;

  // Use Service Binding if available (production/staging), otherwise use HTTP fetch (local dev)
  const apiService = context?.env?.API || context?.cloudflare?.env?.API;
  const apiUrl =
    context?.cloudflare?.env?.PUBLIC_API_URL ||
    context?.env?.PUBLIC_API_URL ||
    "http://localhost:8787";

  try {
    // Load product data using Service Binding or HTTP
    let productRes;
    if (apiService) {
      // Use Service Binding (direct Worker-to-Worker communication)
      const apiRequest = new Request(
        `http://internal/api/products/${productId}`,
        {
          method: "GET",
        }
      );
      productRes = await apiService.fetch(apiRequest);
    } else {
      // Fallback to HTTP fetch for local development
      productRes = await fetch(`${apiUrl}/api/products/${productId}`);
    }

    if (!productRes.ok) {
      const errorText = await productRes.text();
      console.error("[ProductEdit] Failed to load product:", {
        status: productRes.status,
        error: errorText,
      });
      throw new Error(`Failed to load product: ${productRes.status}`);
    }

    const productData = await productRes.json();
    const product = productData?.success ? productData?.data : null;

    // Load categories using Service Binding or HTTP
    let categoriesRes;
    if (apiService) {
      const categoriesRequest = new Request(
        "http://internal/api/admin/products/categories",
        {
          method: "GET",
        }
      );
      categoriesRes = await apiService.fetch(categoriesRequest);
    } else {
      categoriesRes = await fetch(`${apiUrl}/api/admin/products/categories`);
    }

    const categoriesData = categoriesRes.ok
      ? await categoriesRes.json()
      : { data: [] };
    const categories = categoriesData?.success
      ? (categoriesData?.data ?? [])
      : [];

    return Response.json({ product, categories });
  } catch (error: any) {
    console.error("[ProductEdit] Loader error:", error.message);

    // Return empty data instead of throwing to avoid breaking the page
    return Response.json({
      product: null,
      categories: [],
      error: error.message,
    });
  }
};

export default function EditProductPage() {
  const { product, categories } = useLoaderData<typeof loader>();
  return (
    <ProductEditPage
      initialData={product || undefined}
      productId={product?.id || undefined}
    />
  );
}

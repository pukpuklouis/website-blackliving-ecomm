import { useLoaderData } from "react-router";
import ProductEditPage from "../../components/ProductEditPage";

export const loader = async ({ request, context }: any) => {
  try {
    // Use Service Binding if available (production/staging), otherwise use HTTP fetch (local dev)
    const apiService = context?.env?.API || context?.cloudflare?.env?.API;
    const apiUrl =
      context?.cloudflare?.env?.PUBLIC_API_URL ||
      context?.env?.PUBLIC_API_URL ||
      "http://localhost:8787";

    let res;
    if (apiService) {
      const apiRequest = new Request(
        "http://internal/api/admin/products/categories",
        {
          method: "GET",
        }
      );
      res = await apiService.fetch(apiRequest);
    } else {
      res = await fetch(`${apiUrl}/api/admin/products/categories`, {
        headers: { cookie: request.headers.get("cookie") ?? "" },
        credentials: "include",
      });
    }

    if (!res.ok) {
      return Response.json({ categories: [] });
    }
    const data = await res.json();
    const categories = data?.success ? (data?.data ?? []) : [];
    return Response.json({ categories });
  } catch (e) {
    console.error("[ProductNew] Error loading categories:", e);
    return Response.json({ categories: [] });
  }
};

export default function NewProductPage() {
  const { categories } = useLoaderData<typeof loader>();
  return <ProductEditPage />;
}

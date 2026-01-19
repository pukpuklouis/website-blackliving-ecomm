import type { APIContext } from "astro";

type SitemapUrl = {
  loc: string;
  lastmod?: string;
  priority: string;
  changefreq: string;
};

type PageData = {
  slug: string;
  updatedAt?: string;
};

type ProductData = {
  slug: string;
  category?: { slug: string };
  updatedAt?: string;
};

type PostData = {
  slug: string;
  category?: { slug: string };
  updatedAt?: string;
};

// Static pages with their priorities
const STATIC_PAGES: SitemapUrl[] = [
  { loc: "", priority: "1.0", changefreq: "weekly" },
  { loc: "about", priority: "0.8", changefreq: "monthly" },
  { loc: "appointment", priority: "0.9", changefreq: "monthly" },
  { loc: "business-cooperation", priority: "0.6", changefreq: "monthly" },
];

/**
 * Fetch CMS pages and convert to sitemap URLs
 */
async function fetchPages(apiUrl: string, now: string): Promise<SitemapUrl[]> {
  try {
    const response = await fetch(
      `${apiUrl}/api/pages?status=published&limit=1000`
    );
    if (!response.ok) {
      return [];
    }
    const json = (await response.json()) as {
      success: boolean;
      data: { pages: PageData[] };
    };
    if (!json.success) {
      return [];
    }
    return json.data.pages.map((page) => ({
      loc: page.slug,
      lastmod: page.updatedAt?.split("T")[0] ?? now,
      priority: "0.7",
      changefreq: "monthly",
    }));
  } catch (error) {
    console.warn("Failed to fetch pages for sitemap:", error);
    return [];
  }
}

/**
 * Fetch products and convert to sitemap URLs
 */
async function fetchProducts(
  apiUrl: string,
  now: string
): Promise<SitemapUrl[]> {
  try {
    const response = await fetch(
      `${apiUrl}/api/products?status=published&limit=1000`
    );
    if (!response.ok) {
      return [];
    }
    const json = (await response.json()) as {
      success: boolean;
      data: { products: ProductData[] };
    };
    if (!json.success) {
      return [];
    }
    return json.data.products.map((product) => ({
      loc: `shop/${product.category?.slug ?? "products"}/${product.slug}`,
      lastmod: product.updatedAt?.split("T")[0] ?? now,
      priority: "0.8",
      changefreq: "weekly",
    }));
  } catch (error) {
    console.warn("Failed to fetch products for sitemap:", error);
    return [];
  }
}

/**
 * Fetch blog posts and convert to sitemap URLs
 */
async function fetchPosts(apiUrl: string, now: string): Promise<SitemapUrl[]> {
  try {
    const response = await fetch(
      `${apiUrl}/api/posts?status=published&limit=1000`
    );
    if (!response.ok) {
      return [];
    }
    const json = (await response.json()) as {
      success: boolean;
      data: { posts: PostData[] };
    };
    if (!json.success) {
      return [];
    }
    return json.data.posts.map((post) => ({
      loc: `blog/${post.category?.slug ?? "blog"}/${post.slug}`,
      lastmod: post.updatedAt?.split("T")[0] ?? now,
      priority: "0.7",
      changefreq: "monthly",
    }));
  } catch (error) {
    console.warn("Failed to fetch posts for sitemap:", error);
    return [];
  }
}

/**
 * Convert URL entries to XML format
 */
function urlToXml(siteUrl: string, url: SitemapUrl, now: string): string {
  return `  <url>
    <loc>${siteUrl}${url.loc}</loc>
    <lastmod>${url.lastmod ?? now}</lastmod>
    <changefreq>${url.changefreq}</changefreq>
    <priority>${url.priority}</priority>
  </url>`;
}

/**
 * Dynamic sitemap.xml endpoint for SSR mode
 * Fetches all pages, products, and blog posts from the API
 */
export async function GET(context: APIContext): Promise<Response> {
  const siteUrl = context.site?.href ?? "https://www.blackliving.tw/";
  const apiUrl = import.meta.env.PUBLIC_API_URL || "http://localhost:8787";
  const now = new Date().toISOString().split("T")[0];

  // Fetch all dynamic content in parallel
  const [pages, products, posts] = await Promise.all([
    fetchPages(apiUrl, now),
    fetchProducts(apiUrl, now),
    fetchPosts(apiUrl, now),
  ]);

  // Combine all URLs
  const allUrls = [...STATIC_PAGES, ...pages, ...products, ...posts];

  // Build XML
  const urlEntries = allUrls
    .map((url) => urlToXml(siteUrl, url, now))
    .join("\n");

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urlEntries}
</urlset>`;

  return new Response(xml, {
    headers: {
      "Content-Type": "application/xml; charset=utf-8",
      "Cache-Control": "public, max-age=3600", // Cache for 1 hour
    },
  });
}

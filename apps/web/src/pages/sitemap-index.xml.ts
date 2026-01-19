import type { APIContext } from "astro";

/**
 * Dynamic sitemap-index.xml endpoint for SSR mode
 * @astrojs/sitemap doesn't work with output: "server", so we create a custom endpoint
 */
export function GET(context: APIContext): Response {
  const siteUrl = context.site?.href ?? "https://www.blackliving.tw/";
  const now = new Date().toISOString().split("T")[0];

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <sitemap>
    <loc>${siteUrl}sitemap-0.xml</loc>
    <lastmod>${now}</lastmod>
  </sitemap>
</sitemapindex>`;

  return new Response(xml, {
    headers: {
      "Content-Type": "application/xml; charset=utf-8",
      "Cache-Control": "public, max-age=3600", // Cache for 1 hour
    },
  });
}

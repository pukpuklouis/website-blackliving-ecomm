import cloudflare from "@astrojs/cloudflare";
import react from "@astrojs/react";
import tailwindcss from "@tailwindcss/vite";
import { defineConfig, fontProviders } from "astro/config";
import type { Plugin } from "vite";

// Environment detection
const isDev = process.env.NODE_ENV !== "production";

// Lucide icon import resolver for both dev and production
function lucideIconResolver(): Plugin {
  return {
    name: "lucide-icon-resolver",
    resolveId(id: string) {
      // Handle @lucide/react/* imports in both dev and production
      if (id.startsWith("@lucide/react/")) {
        const iconName = id.replace("@lucide/react/", "");

        if (isDev) {
          // Development: create virtual module ID
          return `\0lucide-icon:${iconName}`;
        }
        // Production: resolve to individual icon files for tree-shaking
        // The iconName is already in kebab-case (e.g., "panel-left")
        return {
          id: `lucide-react/dist/esm/icons/${iconName}.js`,
          external: false,
        };
      }
      return null;
    },
    load(id: string) {
      // In development, create a virtual module that exports the icon from lucide-react
      if (isDev && id.startsWith("\0lucide-icon:")) {
        const iconName = id.replace("\0lucide-icon:", "");
        // Convert kebab-case to PascalCase for the actual export name
        const pascalIconName = iconName
          .split("-")
          .map((word: string) => word.charAt(0).toUpperCase() + word.slice(1))
          .join("");

        return `export { ${pascalIconName} as default } from 'lucide-react';`;
      }
      return null;
    },
  };
}

// https://astro.build/config
// Note: Using Tailwind v4 - no @astrojs/tailwind integration needed
// Note: Using custom sitemap endpoints for SSR mode - @astrojs/sitemap doesn't work with output: "server"
export default defineConfig({
  site:
    process.env.PUBLIC_SITE_URL ||
    (process.env.NODE_ENV === "production"
      ? "https://www.blackliving.tw"
      : "http://localhost:4321"),
  integrations: [react()],

  output: "server",
  adapter: cloudflare(),
  markdown: {
    gfm: true,
  },
  experimental: {
    fonts: [
      {
        name: "Agatho",
        cssVariable: "--font-agatho",
        provider: "local",
        variants: [
          {
            src: ["./src/assets/fonts/agatho/Agatho_Light.woff2"],
            weight: "300",
            style: "normal",
          },
          {
            src: ["./src/assets/fonts/agatho/Agatho_Regular.woff2"],
            weight: "400",
            style: "normal",
          },
          {
            src: ["./src/assets/fonts/agatho/Agatho_Medium.woff2"],
            weight: "500",
            style: "normal",
          },
          {
            src: ["./src/assets/fonts/agatho/Agatho_Bold.woff2"],
            weight: "700",
            style: "normal",
          },
        ],
      },
      {
        provider: fontProviders.google(),
        name: "Noto Sans TC",
        weights: [400, 500, 600, 700],
        styles: ["normal"],
        subsets: ["chinese-traditional"],
        cssVariable: "--font-noto-tc",
      },
      {
        provider: fontProviders.google(),
        name: "Crimson Text",
        weights: [400, 600, 700],
        styles: ["normal", "italic"],
        cssVariable: "--font-crimson-text",
      },
    ],
  },

  vite: {
    plugins: [tailwindcss(), lucideIconResolver()],
    resolve: {
      alias: {
        "~": new URL("./src", import.meta.url).pathname,
        "@": new URL("../../packages/ui", import.meta.url).pathname,
        "@/lib": new URL("../../packages/ui/lib", import.meta.url).pathname,
        "@/components": new URL("../../packages/ui/components", import.meta.url)
          .pathname,
        "@/hooks": new URL("../../packages/ui/hooks", import.meta.url).pathname,
        // Simple alias approach for Lucide icons
        ...(isDev
          ? {}
          : {
              "@lucide/react/": "lucide-react/dist/esm/icons/",
            }),
        ...(!isDev && {
          "react-dom/server": "react-dom/server.edge",
        }),
      },
      dedupe: [
        "prosemirror-state",
        "prosemirror-view",
        "prosemirror-model",
        "prosemirror-transform",
        "prosemirror-schema-list",
        "prosemirror-gapcursor",
        "@blocknote/core",
        "@blocknote/react",
        "@blocknote/shadcn",
        "@blocknote/xl-multi-column",
      ],
    },
    optimizeDeps: {
      include: ["marked", ...(isDev ? ["lucide-react"] : [])],
      exclude: isDev ? [] : ["lucide-react"],
    },
    ssr: {
      noExternal: [
        "marked",
        "@blocknote/core",
        "@blocknote/react",
        "@blocknote/shadcn",
        "@blocknote/xl-multi-column",
      ],
    },
    build: {
      rollupOptions: {
        external: [],
        output: {
          manualChunks(id: string) {
            // Group node_modules into vendor chunk
            if (id.includes("node_modules")) {
              // Markdown parser gets its own chunk
              if (id.includes("marked")) return "markdown";
              // Other vendor packages
              return "vendor";
            }
          },
        },
      },
    },
    server: {
      proxy: {
        "/api": {
          target: "http://localhost:8787",
          changeOrigin: true,
          secure: false,
        },
      },
    },
  },
});

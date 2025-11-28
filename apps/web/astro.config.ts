import { defineConfig, fontProviders } from 'astro/config';
import react from '@astrojs/react';
import sitemap from '@astrojs/sitemap';
import cloudflare from '@astrojs/cloudflare';
import tailwindcss from '@tailwindcss/vite';
import type { Plugin } from 'vite';

// Environment detection
const isDev = process.env.NODE_ENV !== 'production';

// Lucide icon import resolver for both dev and production
function lucideIconResolver(): Plugin {
  return {
    name: 'lucide-icon-resolver',
    resolveId(id: string) {
      // Handle @lucide/react/* imports in both dev and production
      if (id.startsWith('@lucide/react/')) {
        const iconName = id.replace('@lucide/react/', '');

        if (isDev) {
          // Development: create virtual module ID
          return `\0lucide-icon:${iconName}`;
        } else {
          // Production: resolve to individual icon files for tree-shaking
          // The iconName is already in kebab-case (e.g., "panel-left")
          return {
            id: `lucide-react/dist/esm/icons/${iconName}.js`,
            external: false
          };
        }
      }
      return null;
    },
    load(id: string) {
      // In development, create a virtual module that exports the icon from lucide-react
      if (isDev && id.startsWith('\0lucide-icon:')) {
        const iconName = id.replace('\0lucide-icon:', '');
        // Convert kebab-case to PascalCase for the actual export name
        const pascalIconName = iconName.split('-').map((word: string) =>
          word.charAt(0).toUpperCase() + word.slice(1)
        ).join('');

        return `export { ${pascalIconName} as default } from 'lucide-react';`;
      }
      return null;
    }
  };
}


// Function to fetch dynamic pages for sitemap
async function getDynamicPages(): Promise<string[]> {
  try {
    const apiUrl = process.env.PUBLIC_API_URL || 'http://localhost:8787';
    // Fetch published pages
    const response = await fetch(`${apiUrl}/api/pages?status=published&limit=1000`);
    if (!response.ok) return [];
    const json = await response.json() as { success: boolean; data: { pages: { slug: string }[] } };
    if (!json.success) return [];

    const siteUrl = process.env.PUBLIC_SITE_URL ||
      (process.env.NODE_ENV === 'production' ? "https://blackliving-web.pages.dev" : "http://localhost:4321");

    return json.data.pages.map(page => `${siteUrl}/${page.slug}`);
  } catch (error) {
    console.warn('Failed to fetch dynamic pages for sitemap:', error);
    return [];
  }
}

// https://astro.build/config
// Note: Using Tailwind v4 - no @astrojs/tailwind integration needed
export default defineConfig({
  site: process.env.PUBLIC_SITE_URL ||
    (process.env.NODE_ENV === 'production' ? "https://blackliving-web.pages.dev" : "http://localhost:4321"),
  integrations: [
    react(),
    sitemap({
      customPages: await getDynamicPages(),
    })
  ],

  output: 'server',
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
            src: [
              "./src/assets/fonts/agatho/Agatho_Light.woff2"
            ],
            weight: "300",
            style: "normal"
          },
          {
            src: [
              "./src/assets/fonts/agatho/Agatho_Regular.woff2"
            ],
            weight: "400",
            style: "normal"
          },
          {
            src: [
              "./src/assets/fonts/agatho/Agatho_Medium.woff2"
            ],
            weight: "500",
            style: "normal"
          },
          {
            src: [
              "./src/assets/fonts/agatho/Agatho_Bold.woff2"
            ],
            weight: "700",
            style: "normal"
          }
        ]
      },
      {
        provider: fontProviders.google(),
        name: "Noto Sans TC",
        weights: [400, 500, 600, 700],
        styles: ["normal"],
        subsets: ["chinese-traditional"],
        cssVariable: "--font-noto-tc"
      },
      {
        provider: fontProviders.google(),
        name: "Crimson Text",
        weights: [400, 600, 700],
        styles: ["normal", "italic"],
        cssVariable: "--font-crimson-text"
      }
    ]
  },

  vite: {
    plugins: [tailwindcss(), lucideIconResolver()],
    resolve: {
      alias: {
        '~': new URL('./src', import.meta.url).pathname,
        '@': new URL('../../packages/ui', import.meta.url).pathname,
        '@/lib': new URL('../../packages/ui/lib', import.meta.url).pathname,
        '@/components': new URL('../../packages/ui/components', import.meta.url).pathname,
        '@/hooks': new URL('../../packages/ui/hooks', import.meta.url).pathname,
        // Simple alias approach for Lucide icons
        ...(isDev ? {} : {
          '@lucide/react/': 'lucide-react/dist/esm/icons/'
        }),
        ...(!isDev && {
          "react-dom/server": "react-dom/server.edge"
        })
      },
      dedupe: ['react', 'react-dom', 'lucide-react']
    },
    optimizeDeps: {
      include: ['marked', ...(isDev ? ['lucide-react'] : [])],
      exclude: isDev ? [] : ['lucide-react']
    },
    ssr: {
      noExternal: ['marked']
    },
    build: {
      rollupOptions: {
        output: {
          manualChunks(id: string) {
            // Group node_modules into vendor chunk
            if (id.includes('node_modules')) {
              // Large packages get their own chunks
              if (id.includes('@blackliving/ui')) return 'ui';
              // Markdown parser gets its own chunk
              if (id.includes('marked')) return 'markdown';
              // Other vendor packages
              return 'vendor';
            }
          }
        }
      }
    },
    server: {
      proxy: {
        '/api': {
          target: 'http://localhost:8787',
          changeOrigin: true,
          secure: false
        }
      }
    }
  }
});

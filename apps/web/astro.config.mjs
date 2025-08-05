// @ts-check
import { defineConfig, fontProviders } from 'astro/config';
import react from '@astrojs/react';
import sitemap from '@astrojs/sitemap';
import cloudflare from '@astrojs/cloudflare';
import tailwindcss from '@tailwindcss/vite';


// https://astro.build/config
// Note: Using Tailwind v4 - no @astrojs/tailwind integration needed
export default defineConfig({
  site: "http://localhost:4321",
  integrations: [react(), sitemap()],

  output: 'static',
  adapter: cloudflare(),

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
    plugins: [tailwindcss()],
    resolve: {
      alias: {
        '~': new URL('./src', import.meta.url).pathname,
        '@': new URL('../../packages/ui', import.meta.url).pathname
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
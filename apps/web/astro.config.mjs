// @ts-check
import { defineConfig } from 'astro/config';
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

  vite: {
    plugins: [tailwindcss()],
    resolve: {
      alias: {
        '~': new URL('./src', import.meta.url).pathname,
        '@': new URL('../../packages/ui', import.meta.url).pathname
      }
    }
  }
});
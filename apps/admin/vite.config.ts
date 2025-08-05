import { reactRouter } from '@react-router/dev/vite';
import { defineConfig } from 'vite';
import tsconfigPaths from 'vite-tsconfig-paths';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  plugins: [tailwindcss(), reactRouter(), tsconfigPaths()],
  css: {
    modules: {
      localsConvention: 'camelCase',
    },
  },
  // 優化依賴處理
  optimizeDeps: {
    include: ['novel'],
  },
  // Build optimization for tree-shaking
  build: {
    sourcemap: false, // Disable sourcemaps to avoid UI component errors
    rollupOptions: {
      external: (id) => {
        // Don't bundle all lucide-react icons
        if (id.includes('lucide-react/dist/esm/icons/') && 
            !id.match(/\/(plus|search|edit|trash-2|upload|eye|filter|chevron-up|log-out|user|arrow-up-right|bar-chart-3|lock|plus-circle|users|calendar|package|more-horizontal|save|bold|italic|list|image|link|code|at-sign|phone|mail|map-pin|clock|file-image)\.js$/)) {
          return true;
        }
        return false;
      },
    },
  },
  // SSR 配置 - 根據你的建議
  ssr: {
    // 將 react-tweet 設為 noExternal，讓 Vite 處理其 CSS 檔案
    noExternal: ['novel', 'react-tweet'],
  },
  // 測試環境配置（如果使用 Vitest）
  test: {
    deps: {
      web: {
        // 讓 Vitest 處理 CSS 檔案
        transformCss: true,
      },
    },
  },
});

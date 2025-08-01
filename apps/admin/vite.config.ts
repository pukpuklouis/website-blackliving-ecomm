import { reactRouter } from "@react-router/dev/vite";
import { defineConfig } from "vite";
import tsconfigPaths from "vite-tsconfig-paths";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  plugins: [tailwindcss(), reactRouter(), tsconfigPaths()],
  css: {
    modules: {
      localsConvention: 'camelCase',
    },
  },
  // 優化依賴處理
  optimizeDeps: {
    include: ["novel"],
  },
  // SSR 配置 - 根據你的建議
  ssr: {
    // 將 react-tweet 設為 noExternal，讓 Vite 處理其 CSS 檔案
    noExternal: ["novel", "react-tweet"],
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

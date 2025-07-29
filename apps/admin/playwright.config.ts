import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './tests',
  use: {
    baseURL: 'http://localhost:5173/',
    // 指定 Chromium 執行路徑
    launchOptions: {
      executablePath: '/Users/pukpuk/Library/Caches/ms-playwright/chromium_headless_shell-1182/chrome-mac/headless_shell',
    },
  },
});
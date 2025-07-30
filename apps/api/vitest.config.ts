import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    testTimeout: 60000,
    setupFiles: ['./src/lib/vitest-setup.ts'],
    exclude: [
      '**/node_modules/**',
      '**/dist/**',
      '**/build/**',
      '**/.wrangler/**',
      '**/*.integration.test.ts' // Exclude integration tests from main config
    ],
    poolOptions: {
      threads: {
        singleThread: true // Prevent race conditions with Miniflare instances
      }
    },
    env: {
      NODE_ENV: 'test',
      VITEST: 'true'
    }
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@/lib': path.resolve(__dirname, './src/lib'),
      '@/modules': path.resolve(__dirname, './src/modules')
    }
  }
});
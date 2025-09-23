import { defineConfig } from 'vitest/config';
import tsconfigPaths from 'vite-tsconfig-paths';

export default defineConfig({
  plugins: [tsconfigPaths()],
  resolve: {
    alias: {
      '@lucide/react': 'lucide-react/dist/esm/icons',
    },
  },
  test: {
    environment: 'happy-dom',
    setupFiles: ['./vitest.setup.ts'],
    globals: true,
    include: ['app/**/__tests__/**/*.test.{ts,tsx}'],
    exclude: ['tests/**', 'node_modules/**'],
  },
});

import { reactRouter } from '@react-router/dev/vite';
import { defineConfig } from 'vite';
import tsconfigPaths from 'vite-tsconfig-paths';
import tailwindcss from '@tailwindcss/vite';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const projectDir = dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  plugins: [tailwindcss(), reactRouter(), tsconfigPaths()],
  // Expose both VITE_* (default) and PUBLIC_* to import.meta.env
  envPrefix: ['VITE_', 'PUBLIC_'],
  resolve: {
    alias: {
      // Lucide tree-shaking alias for individual icon imports
      '@lucide/react': 'lucide-react/dist/esm/icons',
      '@tailwindcss/typography': resolve(
        projectDir,
        '../../packages/tailwindcss-typography/index.js'
      ),
    },
    // Prevent multiple React copies across workspace
    dedupe: ['react', 'react-dom'],
  },
  // 優化依賴處理
  optimizeDeps: {
    // Rely on Vite defaults; prebundling certain libs can pull duplicate React
    include: ['lucide-react'],
    exclude: ['@lucide/react'],
  },
  // Build optimization
  build: {
    sourcemap: false, // Disable sourcemaps to avoid UI component errors
    minify: 'esbuild', // Use esbuild for faster builds
    target: 'esnext',
    rollupOptions: {
      onwarn(warning, warn) {
        // Suppress warnings about circular dependencies and other non-critical issues
        if (warning.code === 'CIRCULAR_DEPENDENCY') return;
        if (warning.code === 'THIS_IS_UNDEFINED') return;
        if (warning.code === 'PLUGIN_WARNING') return;
        warn(warning);
      },
      output: {
        manualChunks(id) {
          // Group node_modules into vendor chunk
          if (id.includes('node_modules')) {
            // Large packages get their own chunks
            if (id.includes('@blocknote')) return 'blocknote';
            if (id.includes('@blackliving/ui')) return 'ui';
            if (id.includes('lucide-react')) return 'icons';
            // Other vendor packages
            return 'vendor';
          }
        },
      },
    },
  },
  // Ensure proper handling of workspace packages
  server: {
    fs: {
      allow: ['..', '../..'], // Allow access to workspace packages
    },
  },
  test: {
    environment: 'node',
    include: ['app/components/__tests__/**/*.test.ts'],
    exclude: ['tests/**'],
  },
});

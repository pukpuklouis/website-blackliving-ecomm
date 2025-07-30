import { defineWorkersConfig } from '@cloudflare/vitest-pool-workers/config';

export default defineWorkersConfig({
  test: {
    globals: true,
    testTimeout: 60000,
    include: ['**/*.integration.test.ts', '**/*.workers.test.ts', '**/*.standalone.test.ts'],
    exclude: [
      '**/node_modules/**',
      '**/dist/**',
      '**/build/**',
      '**/.wrangler/**'
    ],
    poolOptions: {
      workers: {
        wrangler: { configPath: './wrangler.toml' },
      },
    },
    env: {
      NODE_ENV: 'test',
      VITEST: 'true'
    }
  }
});
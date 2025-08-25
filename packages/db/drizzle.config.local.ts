import type { Config } from 'drizzle-kit';

// Local database configuration for drizzle-kit studio
export default {
  schema: './schema.ts',
  out: './migrations',
  dialect: 'sqlite',
  dbCredentials: {
    url: '../../apps/api/.wrangler/state/v3/d1/miniflare-D1DatabaseObject/b8dd0a76c8249a147ff2f10a0f7e41b199ee43d419f7aa3a917793b2859c95ad.sqlite',
  },
  verbose: true,
  strict: true,
} satisfies Config;
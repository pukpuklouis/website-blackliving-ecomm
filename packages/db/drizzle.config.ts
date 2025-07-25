import type { Config } from 'drizzle-kit';

export default {
  schema: './schema.ts',
  out: './migrations',
  driver: 'libsql',
  dbCredentials: {
    url: process.env.DATABASE_URL || 'file:./dev.db',
    authToken: process.env.TURSO_AUTH_TOKEN,
  },
  verbose: true,
  strict: true,
} satisfies Config;
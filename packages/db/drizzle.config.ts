import type { Config } from "drizzle-kit";

// Single source of truth for database configuration
// Remote sync-enabled configuration for Cloudflare D1
export default {
  schema: "./schema.ts",
  out: "./migrations",
  dialect: "sqlite",
  driver: "d1-http",
  dbCredentials: {
    databaseId:
      process.env.CLOUDFLARE_D1_DATABASE_ID ||
      "6e8078ae-a12b-48e2-ab44-f3adf4ba3482",
    token: process.env.CLOUDFLARE_API_TOKEN || "",
    accountId: process.env.CLOUDFLARE_ACCOUNT_ID || "",
  },
  verbose: true,
  strict: true,
} satisfies Config;

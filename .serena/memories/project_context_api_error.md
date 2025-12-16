This project uses a monorepo structure with `apps/api` (Cloudflare Workers/Hono likely), `apps/web`, `apps/admin`.
The `apps/api` seems to be using `wrangler`.
The error `Uncaught TypeError: The argument 'path' ... Received 'undefined'` is likely due to `createRequire(import.meta.url)` where `import.meta.url` is undefined after bundling.
We need to fix this by enabling `nodejs_compat` or checking build config.
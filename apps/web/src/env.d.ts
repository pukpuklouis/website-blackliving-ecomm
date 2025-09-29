/// <reference types="astro/client" />

declare namespace ImportMetaEnv {
  interface Env {
    readonly PUBLIC_API_BASE_URL?: string;
    readonly PUBLIC_TURNSTILE_SITE_KEY?: string;
  }
}

interface ImportMeta {
  readonly env: ImportMetaEnv.Env;
}
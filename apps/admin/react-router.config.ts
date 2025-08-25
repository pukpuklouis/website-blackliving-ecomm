// @ts-nocheck
import type { Config } from '@react-router/dev/config';

export default {
  // Enable pure SPA mode - no server-side rendering or prerendering
  ssr: true,
  // Configure for client-side only
  future: {
    unstable_singleFetch: true,
  },
} satisfies Config;

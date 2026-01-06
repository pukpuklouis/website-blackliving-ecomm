// @ts-nocheck
import type { Config } from "@react-router/dev/config";

export default {
  ssr: true,
  serverModuleFormat: "esm",
  future: {
    unstable_singleFetch: true,
  },
} satisfies Config;

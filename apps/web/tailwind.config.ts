import type { Config } from "tailwindcss"

const config: Config = {
  content: [
    "./src/**/*.{astro,html,js,jsx,md,mdx,svelte,ts,tsx,vue}",
    "../../packages/ui/components/**/*.{ts,tsx}",
    "../../packages/ui/lib/**/*.{ts,tsx}",
  ],
  darkMode: "class",
  plugins: [
    require("tailwindcss-animate")
  ],
}

export default config
import type { Config } from "tailwindcss"
import baseConfig from "../../packages/ui/tailwind.config"

const config: Config = {
  content: [
    "./app/**/*.{ts,tsx}",
    "../../packages/ui/components/**/*.{ts,tsx}",
    "../../packages/ui/lib/**/*.{ts,tsx}",
    "../../packages/ui/hooks/**/*.{ts,tsx}",
  ],
  darkMode: baseConfig.darkMode,
  theme: baseConfig.theme,
  plugins: baseConfig.plugins || [],
}

export default config
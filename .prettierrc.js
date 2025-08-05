/** @type {import("prettier").Config} */
module.exports = {
  // Basic formatting
  printWidth: 100,
  tabWidth: 2,
  useTabs: false,
  semi: true,
  singleQuote: true,
  quoteProps: 'as-needed',
  trailingComma: 'es5',
  bracketSpacing: true,
  bracketSameLine: false,
  arrowParens: 'avoid',
  endOfLine: 'lf',

  // Plugin configuration
  plugins: ['prettier-plugin-astro'],

  // File-specific overrides
  overrides: [
    {
      files: '*.astro',
      options: {
        parser: 'astro',
        // Astro-specific formatting options
        astroAllowShorthand: true,
        htmlWhitespaceSensitivity: 'ignore',
        // Keep existing attribute style (class vs className)
        jsxSingleQuote: true,
        // Don't format CSS inside style tags
        embeddedLanguageFormatting: 'off',
      },
    },
    {
      files: '*.{ts,tsx,js,jsx}',
      options: {
        parser: 'typescript',
        singleQuote: true,
        trailingComma: 'es5',
      },
    },
    {
      files: '*.{json,jsonc}',
      options: {
        parser: 'json',
        singleQuote: false,
      },
    },
    {
      files: '*.md',
      options: {
        parser: 'markdown',
        proseWrap: 'preserve',
      },
    },
  ],
};

export interface EstimateReadingTimeOptions {
  /** Average words read per minute. */
  wordsPerMinute?: number;
  /** Approximate number of characters that make up one word. */
  charsPerWord?: number;
  /** Maximum minutes to clamp the return value to. */
  maxMinutes?: number;
  /** Minimum minutes (applied only when the content is non-empty). */
  minMinutes?: number;
}

const DEFAULT_OPTIONS: Required<EstimateReadingTimeOptions> = {
  wordsPerMinute: 200,
  charsPerWord: 5,
  maxMinutes: 60,
  minMinutes: 1,
};

/**
 * Roughly estimate the reading time in minutes for a Markdown document.
 * The calculation strips out common Markdown tokens so formatting does not
 * artificially inflate the character count. Returns `0` when the content is
 * empty after sanitization.
 */
export function estimateReadingTimeMinutes(
  markdown: string,
  options: EstimateReadingTimeOptions = {}
): number {
  const { wordsPerMinute, charsPerWord, maxMinutes, minMinutes } = {
    ...DEFAULT_OPTIONS,
    ...options,
  };

  const sanitized = markdown
    .replace(/```[\s\S]*?```/g, "")
    .replace(/`[^`]*`/g, "")
    .replace(/[#>*_\-[\]()!]/g, "")
    .trim();

  if (sanitized.length === 0) {
    return 0;
  }

  const approximateWords = sanitized.length / charsPerWord;
  const estimatedMinutes = Math.ceil(approximateWords / wordsPerMinute);
  const clamped = Math.min(maxMinutes, Math.max(minMinutes, estimatedMinutes));

  return clamped;
}

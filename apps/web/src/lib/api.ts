/**
 * API URL utility for cross-origin requests
 * Uses PUBLIC_API_URL environment variable in staging/production
 */
export function getApiUrl(path: string): string {
  const apiUrl = import.meta.env.PUBLIC_API_URL;
  // In staging/production, use the full API URL
  // In development, use relative URLs (same-origin)
  if (apiUrl) {
    return `${apiUrl}${path}`;
  }
  return path;
}

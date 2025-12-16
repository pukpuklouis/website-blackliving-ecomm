import React from "react";

// Define regex at top level to avoid recompilation on each function call
const TRAILING_SLASH_REGEX = /\/$/;

export function useCanonicalUrl(PUBLIC_WEB_URL: string | undefined): string {
  return React.useMemo(() => {
    const envCandidate = [
      PUBLIC_WEB_URL,
      (import.meta.env as Record<string, string | undefined>)?.PUBLIC_WEB_URL,
      (import.meta.env as Record<string, string | undefined>)?.PUBLIC_SITE_URL,
    ].find((value) => typeof value === "string" && value.trim().length > 0);

    if (envCandidate) {
      return String(envCandidate).replace(TRAILING_SLASH_REGEX, "");
    }

    if (typeof window !== "undefined" && window.location.origin) {
      return window.location.origin.replace(TRAILING_SLASH_REGEX, "");
    }

    return "https://blackliving.com";
  }, [PUBLIC_WEB_URL]);
}

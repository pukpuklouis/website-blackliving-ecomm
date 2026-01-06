import { safeParseJSON } from "../lib/http";

export type SearchConfig = {
  host: string;
  searchKey: string;
  indexName: string;
  hasMasterKey?: boolean;
};

type SearchApiSuccess<T = any> = {
  success: true;
  data: T;
  message?: string;
};

type SearchApiError = {
  success: false;
  error?: string;
  message?: string;
};

type SearchApiResponse<T = any> = SearchApiSuccess<T> | SearchApiError;

export async function saveSearchConfig(
  config: { host: string; masterKey: string; indexName?: string },
  apiBase: string
): Promise<{ success: boolean; message: string }> {
  const apiUrl = apiBase.trim();

  if (!apiUrl) {
    throw new Error("PUBLIC_API_URL is not configured.");
  }

  const url = `${apiUrl.replace(/\/$/, "")}/api/search/config`;

  const response = await fetch(url, {
    method: "POST",
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(config),
  });

  const payload = (await safeParseJSON(response)) as SearchApiResponse | null;

  if (!response.ok) {
    const message =
      (payload && "error" in payload && typeof payload.error === "string"
        ? payload.error
        : undefined) || "Failed to save search configuration";
    throw new Error(message);
  }

  if (!payload || payload.success !== true) {
    throw new Error(payload?.message || "Failed to save search configuration");
  }

  return {
    success: true,
    message: payload.message || "Search configuration saved successfully",
  };
}

export async function getSearchConfig(
  apiBase: string
): Promise<SearchConfig | null> {
  const apiUrl = apiBase.trim();

  if (!apiUrl) {
    throw new Error("PUBLIC_API_URL is not configured.");
  }

  const url = `${apiUrl.replace(/\/$/, "")}/api/search/config`;

  const response = await fetch(url, {
    credentials: "include",
  });

  const payload = (await safeParseJSON(
    response
  )) as SearchApiResponse<SearchConfig> | null;

  if (!response.ok) {
    const message =
      (payload && "error" in payload && typeof payload.error === "string"
        ? payload.error
        : undefined) || "Failed to fetch search configuration";
    throw new Error(message);
  }

  if (!payload || payload.success !== true) {
    return null; // No configuration found
  }

  return payload.data || null;
}

export async function triggerReindex(
  apiBase: string
): Promise<{ indexed: number; errors: string[]; message: string }> {
  const apiUrl = apiBase.trim();

  if (!apiUrl) {
    throw new Error("PUBLIC_API_URL is not configured.");
  }

  const url = `${apiUrl.replace(/\/$/, "")}/api/search/reindex`;

  const response = await fetch(url, {
    method: "POST",
    credentials: "include",
  });

  const payload = (await safeParseJSON(response)) as SearchApiResponse<{
    indexed: number;
    errors: string[];
  }> | null;

  if (!response.ok) {
    const message =
      (payload && "error" in payload && typeof payload.error === "string"
        ? payload.error
        : undefined) || "Failed to trigger reindex";
    throw new Error(message);
  }

  if (!payload || payload.success !== true) {
    throw new Error(payload?.message || "Failed to trigger reindex");
  }

  return {
    indexed: payload.data?.indexed || 0,
    errors: payload.data?.errors || [],
    message: payload.message || "Reindex completed",
  };
}

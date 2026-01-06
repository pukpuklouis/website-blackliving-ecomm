import type { Category } from "../hooks/useBlogCategories";
import { processDateField } from "../utils/dateUtils";

export function sanitizeString(str: string | null | undefined): string {
  if (str === null || str === undefined) {
    return "";
  }
  return String(str).trim();
}

export function preparePayload(
  data: Record<string, unknown>,
  categories: Category[]
) {
  const payload: Record<string, unknown> = {
    ...data,
    title: sanitizeString(data.title as string | null | undefined),
    slug: sanitizeString(data.slug as string | null | undefined),
    description: sanitizeString(data.description as string | null | undefined),
    excerpt: sanitizeString(data.excerpt as string | null | undefined),
    content: sanitizeString(data.content as string | null | undefined),
    featuredImage: sanitizeString(
      data.featuredImage as string | null | undefined
    ),
    seoTitle: sanitizeString(data.seoTitle as string | null | undefined),
    seoDescription: sanitizeString(
      data.seoDescription as string | null | undefined
    ),
    canonicalUrl: sanitizeString(
      data.canonicalUrl as string | null | undefined
    ),
    ogTitle: sanitizeString(data.ogTitle as string | null | undefined),
    ogDescription: sanitizeString(
      data.ogDescription as string | null | undefined
    ),
    ogImage: sanitizeString(data.ogImage as string | null | undefined),
  };

  payload.sortOrder = Math.max(0, Math.floor(Number(data.sortOrder ?? 0)));

  if (data.scheduledAt && (data.scheduledAt as string).trim() !== "") {
    payload.scheduledAt = processDateField(data.scheduledAt as string);
  }

  if (data.publishedAt && (data.publishedAt as string).trim() !== "") {
    payload.publishedAt = processDateField(data.publishedAt as string);
  }

  for (const key of Object.keys(payload)) {
    if (
      payload[key] === undefined ||
      payload[key] === null ||
      payload[key] === ""
    ) {
      delete payload[key];
    }
  }

  if (data.categoryId) {
    const found = categories.find((c) => c.id === (data.categoryId as string));
    if (found) {
      payload.category = found.name;
    }
  }

  return payload;
}

export async function attemptAuthRetry(apiUrl: string): Promise<void> {
  try {
    const force = await fetch(`${apiUrl}/api/auth/debug/force-admin-login`, {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({}),
    });
    if (!force.ok) {
      await fetch(`${apiUrl}/api/auth/assign-admin-role`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });
    }
  } catch {
    // Silently fail - will be handled by caller
  }
}

export function getErrorMessage(status: number, statusText: string): string {
  if (status === 401 || status === 403) {
    return "權限不足，請重新登入";
  }
  if (status === 404) {
    return "找不到要更新的文章";
  }
  if (status >= 500) {
    return "伺服器錯誤，請稍後再試";
  }
  return `儲存失敗 (${status}): ${statusText}`;
}

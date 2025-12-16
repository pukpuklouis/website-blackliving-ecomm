import type { Category } from "../hooks/useBlogCategories";

type CategoryFields = {
  id: string;
  name: string;
  slug: string;
};

export function deriveCategoryFields(
  categoryId: unknown,
  category: unknown
): CategoryFields {
  const fallbackId = categoryId ? String(categoryId) : "";

  if (!category) {
    return { id: fallbackId, name: "", slug: "" };
  }

  if (typeof category === "string") {
    const normalized = category.trim();
    return { id: fallbackId, name: normalized, slug: normalized };
  }

  if (typeof category === "object") {
    const categoryObject = category as Partial<Category> & {
      id?: string | number;
      categoryId?: string | number;
      slug?: string;
      name?: string;
    };

    const resolvedId = categoryObject.id ?? categoryObject.categoryId;
    const resolvedName = (
      categoryObject.name ??
      categoryObject.slug ??
      ""
    ).trim();
    const resolvedSlug = (
      categoryObject.slug ??
      categoryObject.name ??
      ""
    ).trim();

    return {
      id: fallbackId || (resolvedId ? String(resolvedId) : ""),
      name: resolvedName,
      slug: resolvedSlug,
    };
  }

  return { id: fallbackId, name: "", slug: "" };
}

export function matchCategoryById(
  derivedCategory: CategoryFields,
  categoryPool: Category[]
): Category | null {
  if (categoryPool.length === 0) {
    return null;
  }

  let matchedCategory: Category | null = null;

  // First try to match by id if available
  if (derivedCategory.id) {
    matchedCategory =
      categoryPool.find((cat) => cat.id === derivedCategory.id) ?? null;
  }

  // Then try by name
  if (!matchedCategory && derivedCategory.name) {
    matchedCategory =
      categoryPool.find((cat) => cat.name === derivedCategory.name) ?? null;
  }

  if (!matchedCategory && derivedCategory.slug) {
    matchedCategory =
      categoryPool.find((cat) => cat.slug === derivedCategory.slug) ?? null;
  }

  if (!matchedCategory) {
    matchedCategory = categoryPool[0];
    console.warn(
      "⚠️ No category match found, using first available category:",
      matchedCategory
    );
  }

  return matchedCategory;
}

import { isPostCategorySlug } from "./post_category";

export const match = (param: string): boolean => {
  if (!param) return false;
  const normalized = param.trim().toLowerCase();
  if (!normalized) return false;

  // Prevent blog category slugs from matching the product route
  if (isPostCategorySlug(normalized)) {
    return false;
  }

  return true;
};

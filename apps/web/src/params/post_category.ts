const KNOWN_BLOG_CATEGORY_SLUGS = new Set(['blog-post', 'customer-reviews', 'simmons-knowledge']);

export function isPostCategorySlug(param: string): boolean {
  if (!param) return false;
  const normalized = param.trim().toLowerCase();
  if (!normalized) return false;

  if (normalized.startsWith('cat_')) {
    if (normalized === 'cat_001') return true;
    if (normalized === 'cat_002') return true;
    if (normalized === 'cat_003') return true;
    return false;
  }

  return KNOWN_BLOG_CATEGORY_SLUGS.has(normalized);
}

export const match = (param: string): boolean => {
  return isPostCategorySlug(param);
};

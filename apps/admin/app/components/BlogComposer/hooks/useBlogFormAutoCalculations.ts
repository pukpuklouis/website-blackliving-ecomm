import { useEffect } from "react";
import type { UseFormGetValues, UseFormSetValue } from "react-hook-form";
import { estimateReadingTimeMinutes } from "../../blogComposerUtils";

import type { BlogPostFormData } from "../schema";

type UseBlogFormAutoCalculationsOptions = {
  watchedTitle: string;
  watchedContent: string;
  watchedSlug: string;
  watchedCategoryId: string;
  isEditing: boolean;
  categories: Array<{ id: string; slug: string }>;
  canonicalBase: string;
  setValue: UseFormSetValue<BlogPostFormData>;
  getValues: UseFormGetValues<BlogPostFormData>;
};

export function useBlogFormAutoCalculations({
  watchedTitle,
  watchedContent,
  watchedSlug,
  watchedCategoryId,
  isEditing,
  categories,
  canonicalBase,
  setValue,
  getValues,
}: UseBlogFormAutoCalculationsOptions) {
  // Auto-generate slug from title
  useEffect(() => {
    if (!watchedTitle || isEditing) {
      return;
    }

    const slug = watchedTitle
      .toLowerCase()
      .replace(/[^a-z0-9\u4e00-\u9fff\s-]/g, "")
      .replace(/\s+/g, "-")
      .replace(/^-+|-+$/g, "");

    const currentSlug = getValues("slug");
    if (currentSlug !== slug) {
      setValue("slug", slug, { shouldDirty: false, shouldTouch: false });
    }
  }, [watchedTitle, isEditing, setValue, getValues]);

  // Compute canonical URL from slug
  useEffect(() => {
    let canonical = "";

    if (watchedSlug) {
      const category = categories.find((c) => c.id === watchedCategoryId);
      const categorySlug = category?.slug || "general";
      canonical = `${canonicalBase}/blog/${categorySlug}/${watchedSlug}`;
    }

    const currentCanonical = getValues("canonicalUrl");
    if (currentCanonical !== canonical) {
      setValue("canonicalUrl", canonical, {
        shouldDirty: false,
        shouldTouch: false,
      });
    }
  }, [
    watchedSlug,
    watchedCategoryId,
    categories,
    canonicalBase,
    setValue,
    getValues,
  ]);

  // Auto-calculate reading time
  useEffect(() => {
    if (!watchedContent) {
      return;
    }

    const normalizedReadingTime = estimateReadingTimeMinutes(watchedContent);
    if (normalizedReadingTime === 0) {
      return;
    }

    const currentReadingTime = getValues("readingTime");
    if (currentReadingTime !== normalizedReadingTime) {
      setValue("readingTime", normalizedReadingTime, {
        shouldDirty: false,
        shouldTouch: false,
      });
    }
  }, [watchedContent, setValue, getValues]);
}

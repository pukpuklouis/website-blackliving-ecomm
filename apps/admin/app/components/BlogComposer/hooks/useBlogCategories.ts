import { useCallback, useEffect, useState } from "react";
import type { UseFormSetValue } from "react-hook-form";
import { toast } from "sonner";
import type { BlogPostFormData, Category } from "../schema";

export function useBlogCategories(
  apiUrl: string,
  isEditing: boolean,
  setValue: UseFormSetValue<BlogPostFormData>
) {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loadingCategories, setLoadingCategories] = useState(true);
  const [refreshingCategories, setRefreshingCategories] = useState(false);

  const fetchCategories = useCallback(async (): Promise<Category[]> => {
    try {
      setLoadingCategories(true);
      const res = await fetch(`${apiUrl}/api/posts/categories`, {
        credentials: "include",
      });
      if (!res.ok) {
        throw new Error("Failed to fetch categories");
      }
      const json = await res.json();
      if (json.success && Array.isArray(json.data)) {
        const list = json.data as Category[];
        setCategories(list);
        if (!isEditing && list.length > 0) {
          setValue("categoryId", list[0].id, { shouldDirty: false });
          setValue("category", list[0].name, { shouldDirty: false });
        }
        return list;
      }
    } catch (err) {
      console.error("Error fetching categories:", err);
      toast.error("載入分類失敗");
    } finally {
      setLoadingCategories(false);
    }
    return [];
  }, [apiUrl, isEditing, setValue]);

  const invalidateCategoriesCache = async () => {
    try {
      setRefreshingCategories(true);
      const res = await fetch(
        `${apiUrl}/api/posts/categories/cache/invalidate`,
        {
          method: "POST",
          credentials: "include",
        }
      );
      if (!res.ok) {
        throw new Error("Failed to invalidate categories cache");
      }
      await fetchCategories();
      toast.success("分類快取已更新");
    } catch (err) {
      console.error("Invalidate categories cache error:", err);
      toast.error("更新分類快取失敗");
    } finally {
      setRefreshingCategories(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  return {
    categories,
    loadingCategories,
    refreshingCategories,
    fetchCategories,
    invalidateCategoriesCache,
  };
}

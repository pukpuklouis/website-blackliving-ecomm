import { useCallback, useEffect, useState } from "react";
import type { UseFormReset, UseFormSetValue } from "react-hook-form";
import { toast } from "sonner";
import type { BlogPostFormData, Category } from "../schema";
import {
  deriveCategoryFields,
  matchCategoryById,
} from "../utils/categoryUtils";
import { normalizeToDatetimeLocal } from "../utils/dateUtils";

export type Post = {
  id: string;
  title: string;
  slug: string;
  description: string;
  excerpt?: string;
  content: string;
  category?: unknown;
  categoryId: string;
  tags: string[];
  status: "draft" | "published" | "scheduled" | "archived";
  featured: boolean;
  allowComments: boolean;
  featuredImage?: string;
  seoTitle?: string;
  seoDescription?: string;
  seoKeywords: string[];
  canonicalUrl?: string;
  ogTitle?: string;
  ogDescription?: string;
  ogImage?: string;
  scheduledAt?: unknown;
  publishedAt?: string;
  readingTime: number;
  sortOrder?: number;
  overlaySettings?: {
    enabled: boolean;
    title?: string;
    placement?: string;
    gradientDirection?: string;
  };
  authorId: string;
  authorName?: string;
  viewCount: number;
  createdAt: string;
  updatedAt: string;
};

type UseBlogPostOptions = {
  apiUrl: string;
  postId: string | null;
  isEditing: boolean;
  categories: Category[];
  reset: UseFormReset<BlogPostFormData>;
  setValue: UseFormSetValue<BlogPostFormData>;
};

export function useBlogPost(options: UseBlogPostOptions) {
  const { apiUrl, postId, isEditing, categories, reset, setValue } = options;
  const [loading, setLoading] = useState(isEditing);

  const fetchPost = useCallback(
    async (id: string, availableCategories?: Category[]) => {
      try {
        setLoading(true);
        const response = await fetch(`${apiUrl}/api/posts/${id}`, {
          credentials: "include",
        });

        if (!response.ok) {
          throw new Error("Failed to fetch post");
        }

        const data = await response.json();
        if (data.success) {
          const post: Post = data.data;
          const derivedCategory = deriveCategoryFields(
            post.categoryId,
            post.category
          );

          reset({
            title: post.title,
            slug: post.slug,
            description: post.description,
            excerpt: post.excerpt,
            content: post.content,
            category: derivedCategory.name,
            categoryId: derivedCategory.id,
            tags: post.tags,
            status: post.status,
            featured: post.featured,
            allowComments: post.allowComments,
            featuredImage: post.featuredImage,
            seoTitle: post.seoTitle,
            seoDescription: post.seoDescription,
            seoKeywords: post.seoKeywords,
            canonicalUrl: post.canonicalUrl,
            ogTitle: post.ogTitle,
            ogDescription: post.ogDescription,
            ogImage: post.ogImage,
            scheduledAt: normalizeToDatetimeLocal(post.scheduledAt),
            publishedAt: normalizeToDatetimeLocal(post.publishedAt),
            readingTime: post.readingTime,
            overlaySettings:
              post.overlaySettings as BlogPostFormData["overlaySettings"],
            sortOrder: post.sortOrder ?? 0,
          });

          const categoryPool = availableCategories ?? categories;
          const matchedCategory = matchCategoryById(
            derivedCategory,
            categoryPool
          );

          if (matchedCategory) {
            setValue("categoryId", matchedCategory.id, { shouldDirty: false });
            setValue("category", matchedCategory.name, { shouldDirty: false });
          }
        }
      } catch (error) {
        console.error("Error fetching post:", error);
        toast.error("載入文章失敗");
      } finally {
        setLoading(false);
      }
    },
    [categories, apiUrl, reset, setValue]
  );

  useEffect(() => {
    if (isEditing && postId) {
      fetchPost(postId, categories);
    }
  }, [isEditing, postId, fetchPost, categories]);

  return {
    loading,
    fetchPost,
  };
}

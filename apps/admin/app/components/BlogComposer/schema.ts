import { z } from "zod";

// Blog post validation schema
export const blogPostSchema = z.object({
  title: z.string().min(1, "文章標題為必填").max(100, "標題不能超過100個字元"),
  slug: z
    .string()
    .min(1, "URL slug 為必填")
    .regex(/^[a-z0-9-]+$/, "URL slug 只能包含小寫字母、數字和連字符"),
  description: z
    .string()
    .min(10, "文章描述至少需要10個字元")
    .max(300, "描述不能超過300個字元"),
  excerpt: z.string().max(200, "摘要不能超過200個字元").optional(),
  content: z.string().min(50, "文章內容至少需要50個字元"),
  // 使用動態分類：從 API 載入，不再使用硬編碼 enum
  category: z.string().optional(),
  categoryId: z.string().min(1, "文章分類為必填"),
  tags: z.array(z.string()).default([]),
  status: z
    .enum(["draft", "published", "scheduled", "archived"])
    .default("draft"),
  featured: z.boolean().default(false),
  allowComments: z.boolean().default(true),
  // Safe null handling - only convert null/undefined, preserve other falsy values
  featuredImage: z.preprocess(
    (val) => (val === null || val === undefined ? "" : String(val)),
    z.string()
  ),
  // SEO Fields - explicit null/undefined handling with validation
  seoTitle: z
    .string()
    .max(60, "SEO標題不能超過60個字元")
    .or(z.literal(""))
    .optional(),
  seoDescription: z
    .string()
    .max(160, "SEO描述不能超過160個字元")
    .or(z.literal(""))
    .optional(),
  seoKeywords: z.array(z.string()).default([]),
  canonicalUrl: z.preprocess(
    (val) => (val === null || val === undefined ? "" : String(val)),
    z.string()
  ),
  // Social Media - explicit null/undefined handling
  ogTitle: z
    .string()
    .max(60, "Open Graph標題不能超過60個字元")
    .or(z.literal(""))
    .optional(),
  ogDescription: z
    .string()
    .max(160, "Open Graph描述不能超過160個字元")
    .or(z.literal(""))
    .optional(),
  ogImage: z.preprocess(
    (val) => (val === null || val === undefined ? "" : String(val)),
    z.string()
  ),
  // Publishing - allow any string or empty
  scheduledAt: z.preprocess(
    (val) => (val === null || val === undefined ? "" : String(val)),
    z.string()
  ),
  // Published date - allow any string or empty
  publishedAt: z.string().or(z.literal("")).optional(),
  readingTime: z.number().min(1).max(60).default(5),
  sortOrder: z
    .preprocess(
      (val) => {
        if (val === null || val === undefined || val === "") {
          return 0;
        }
        if (typeof val === "string") {
          const parsed = Number.parseInt(val, 10);
          return Number.isNaN(parsed) ? val : parsed;
        }
        return val;
      },
      z.number().int().min(0, "排序順序必須是 0 或正整數")
    )
    .default(0),
  // Overlay Settings - Single JSON object as per design.md
  overlaySettings: z
    .object({
      enabled: z.boolean().default(false),
      title: z.string().max(50, "疊加標題不能超過50個字元").optional(),
      placement: z
        .enum([
          "bottom-left",
          "bottom-right",
          "bottom-center",
          "top-left",
          "center",
        ])
        .default("bottom-center"),
      gradientDirection: z
        .enum(["t", "tr", "r", "br", "b", "bl", "l", "tl"])
        .default("t"),
    })
    .optional(),
});

export type BlogPostFormData = z.infer<typeof blogPostSchema>;

export type Category = {
  id: string;
  name: string;
  slug: string;
  description?: string;
};

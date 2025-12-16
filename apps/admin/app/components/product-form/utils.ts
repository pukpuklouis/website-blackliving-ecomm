import type { ProductCategory as ProductCategoryDTO } from "@blackliving/types";
import { type ZodIssue, z } from "zod";
import { extractAssetKey, resolveAssetUrl } from "../../lib/assets";

// Product types based on database schema
export type Product = {
  id: string;
  name: string;
  slug: string;
  description: string;
  category: string;
  productType?: string;
  images: string[];
  variants: Array<{
    id: string;
    name: string;
    price: number;
    sku?: string;
    size?: string;
    firmness?: string;
    color?: string;
    material?: string;
    thickness?: string;
    loft?: string;
    weight?: string;
    style?: string;
    legs?: string;
  }>;
  features: string[];
  featuresMarkdown?: string;
  specifications: Record<string, string>;
  inStock: boolean;
  featured: boolean;
  sortOrder: number;
  seoTitle?: string;
  seoDescription?: string;
  createdAt: Date;
  updatedAt: Date;
};

export type ProductCategoryRecord = ProductCategoryDTO;

// Extended validation schema for accessory products
export const slugRegex = /^[a-z0-9-]+$/;

export const productSchema = z.object({
  name: z.string().min(1, "產品名稱為必填"),
  slug: z
    .string()
    .min(1, "URL slug 為必填")
    .regex(slugRegex, "只能包含小寫字母、數字和連字符"),
  description: z.string().min(10, "產品描述至少需要 10 個字元"),
  category: z
    .string()
    .min(1, "請輸入產品分類 slug")
    .regex(slugRegex, "分類 slug 只能包含小寫字母、數字和連字符"),
  productType: z.string().optional(),
  images: z.array(z.string().url()).min(1, "至少需要一張產品圖片"),
  variants: z
    .array(
      z.object({
        id: z.string().optional(),
        name: z.string().min(1),
        price: z.number().min(0),
        sku: z.string().optional(),
        size: z.string().optional(),
        firmness: z.string().optional(),
        color: z.string().optional(),
        material: z.string().optional(),
        thickness: z.string().optional(),
        loft: z.string().optional(),
        weight: z.string().optional(),
        style: z.string().optional(),
        legs: z.string().optional(),
      })
    )
    .min(1, "至少需要一個商品款式"),
  features: z.array(z.string()).default([]),
  featuresMarkdown: z.string().optional(),
  specifications: z.record(z.string(), z.string()).default({}),
  inStock: z.boolean().default(true),
  featured: z.boolean().default(false),
  sortOrder: z.number().default(0),
  seoTitle: z.string().optional(),
  seoDescription: z.string().optional(),
});

export type ProductFormData = z.infer<typeof productSchema>;

// Utility functions
function normalizeVariantProperty(value: unknown): string | undefined {
  return value ? String(value).trim() : undefined;
}

function normalizeVariantPrice(price: unknown): number {
  if (typeof price === "number") {
    return price;
  }
  return Number(String(price ?? 0)) || 0;
}

function normalizeVariants(variants: unknown[]): Array<{
  id: string;
  name: string;
  price: number;
  sku?: string;
  size?: string;
  firmness?: string;
  color?: string;
  material?: string;
  thickness?: string;
  loft?: string;
  weight?: string;
  style?: string;
  legs?: string;
}> {
  return variants.map((variant: any) => ({
    id: variant?.id || `variant-${Date.now()}-${Math.random()}`,
    name: String(variant?.name ?? "").trim(),
    price: normalizeVariantPrice(variant?.price),
    sku: normalizeVariantProperty(variant?.sku),
    size: normalizeVariantProperty(variant?.size),
    firmness: normalizeVariantProperty(variant?.firmness),
    color: normalizeVariantProperty(variant?.color),
    material: normalizeVariantProperty(variant?.material),
    thickness: normalizeVariantProperty(variant?.thickness),
    loft: normalizeVariantProperty(variant?.loft),
    weight: normalizeVariantProperty(variant?.weight),
    style: normalizeVariantProperty(variant?.style),
    legs: normalizeVariantProperty(variant?.legs),
  }));
}

function normalizeImages(images: any[]): string[] {
  return images
    .map((img) => (typeof img === "string" ? img.trim() : ""))
    .filter(Boolean);
}

function normalizeFeatures(features: any[]): string[] {
  return features
    .map((feature) => (typeof feature === "string" ? feature.trim() : ""))
    .filter(Boolean);
}

function normalizeSpecifications(
  specifications: any,
  specOrder: string[]
): Record<string, string> {
  const rawSpecifications =
    specifications && typeof specifications === "object"
      ? (specifications as Record<string, unknown>)
      : {};

  const specificationEntries = Object.entries(rawSpecifications)
    .map(([key, value]) => {
      const trimmedKey = key.trim();
      const strValue = value == null ? "" : String(value).trim();
      return [trimmedKey, strValue] as [string, string];
    })
    .filter(([key, value]) => key.length > 0 && value.length > 0);

  const orderedKeys = specOrder.length
    ? specOrder.filter((orderKey) =>
        specificationEntries.some(([key]) => key === orderKey)
      )
    : specificationEntries.map(([key]) => key);

  const result: Record<string, string> = {};
  orderedKeys.forEach((key) => {
    const entry = specificationEntries.find(([specKey]) => specKey === key);
    if (entry) {
      result[entry[0]] = entry[1];
    }
  });

  specificationEntries.forEach(([key, value]) => {
    if (!(key in result)) {
      result[key] = value;
    }
  });

  return result;
}

export function normalizeFormData(
  fd: Partial<ProductFormData>,
  specOrder: string[] = []
): ProductFormData {
  const variants = Array.isArray(fd.variants)
    ? normalizeVariants(fd.variants)
    : [];
  const images = Array.isArray(fd.images) ? normalizeImages(fd.images) : [];
  const features = Array.isArray(fd.features)
    ? normalizeFeatures(fd.features)
    : [];
  const specifications = normalizeSpecifications(fd.specifications, specOrder);

  return {
    name: fd.name?.trim() ?? "",
    slug: fd.slug?.trim() ?? "",
    description: fd.description?.trim() ?? "",
    category: typeof fd.category === "string" ? fd.category.trim() : "",
    productType: fd.productType?.trim(),
    images,
    variants,
    features,
    featuresMarkdown: fd.featuresMarkdown?.trim(),
    specifications,
    inStock: fd.inStock ?? true,
    featured: fd.featured ?? false,
    sortOrder:
      typeof fd.sortOrder === "number"
        ? fd.sortOrder
        : Number((fd.sortOrder as unknown as string) ?? 0) || 0,
    seoTitle: fd.seoTitle?.trim() || undefined,
    seoDescription: fd.seoDescription?.trim() || undefined,
  };
}

export type ValidationResult = {
  success: boolean;
  data?: ProductFormData;
  errors?: Record<string, string>;
};

export function validateProductWithFallback(
  data: ProductFormData
): ValidationResult {
  try {
    const result = productSchema.safeParse(data);
    if (result.success) {
      return { success: true, data: result.data };
    }
    return {
      success: false,
      errors: mapZodIssues(result.error.issues),
    };
  } catch (error) {
    if (isZodInternalError(error)) {
      console.warn(
        "Zod validation failed internally, using manual validation fallback.",
        error
      );
      return manualValidateProduct(data);
    }
    throw error;
  }
}

function mapZodIssues(issues: ZodIssue[]): Record<string, string> {
  const mapped: Record<string, string> = {};
  issues.forEach((issue) => {
    const key = issue.path.length > 0 ? issue.path.join(".") : "form";
    mapped[key] = issue.message;
  });
  return mapped;
}

function manualValidateProduct(data: ProductFormData): ValidationResult {
  const errors: Record<string, string> = {};

  if (!data.name || data.name.trim().length === 0) {
    errors.name = "產品名稱為必填";
  }

  const slug = data.slug?.trim() ?? "";
  if (!slug) {
    errors.slug = "URL slug 為必填";
  } else if (!slugRegex.test(slug)) {
    errors.slug = "只能包含小寫字母、數字和連字符";
  }

  if (!data.description || data.description.trim().length < 10) {
    errors.description = "產品描述至少需要 10 個字元";
  }

  if (!(data.category && slugRegex.test(data.category))) {
    errors.category = "請選擇產品分類";
  }

  if (!Array.isArray(data.images) || data.images.length === 0) {
    errors.images = "至少需要一張產品圖片";
  }

  if (!Array.isArray(data.variants) || data.variants.length === 0) {
    errors["variants"] = "至少需要一個商品款式";
  } else {
    data.variants.forEach((variant, index) => {
      if (!variant.name || variant.name.trim().length === 0) {
        errors[`variants.${index}.name`] = "款式名稱為必填";
      }
      if (
        typeof variant.price !== "number" ||
        Number.isNaN(variant.price) ||
        variant.price < 0
      ) {
        errors[`variants.${index}.price`] = "價格需為不小於 0 的數字";
      }
    });
  }

  if (Object.keys(errors).length > 0) {
    return { success: false, errors };
  }

  return { success: true, data };
}

function isZodInternalError(error: unknown): boolean {
  return (
    error instanceof TypeError &&
    typeof error.message === "string" &&
    error.message.includes("_zod")
  );
}

export function sanitizeProduct(
  product: Partial<Product> | Product | null | undefined,
  cdnUrl?: string,
  fallbackBase?: string
): Product {
  const safeProduct = (product ?? {}) as Partial<Product>;

  const images = Array.isArray(safeProduct.images)
    ? safeProduct.images.filter(Boolean).map((image) => {
        const imgString = String(image);
        const key = extractAssetKey(imgString);
        return resolveAssetUrl({ key, url: imgString }, cdnUrl, fallbackBase);
      })
    : [];

  return {
    id: safeProduct.id || "",
    name: safeProduct.name || "",
    slug: safeProduct.slug || "",
    description: safeProduct.description || "",
    category: safeProduct.category || "",
    productType: safeProduct.productType,
    images,
    variants: Array.isArray(safeProduct.variants) ? safeProduct.variants : [],
    features: Array.isArray(safeProduct.features) ? safeProduct.features : [],
    featuresMarkdown: safeProduct.featuresMarkdown,
    specifications: safeProduct.specifications || {},
    inStock: safeProduct.inStock ?? true,
    featured: safeProduct.featured ?? false,
    sortOrder: safeProduct.sortOrder ?? 0,
    seoTitle: safeProduct.seoTitle,
    seoDescription: safeProduct.seoDescription,
    createdAt: safeProduct.createdAt || new Date(),
    updatedAt: safeProduct.updatedAt || new Date(),
  };
}

export function normalizeCategory(
  category: ProductCategoryDTO
): ProductCategoryRecord {
  const features = parseFeatureList((category as any).features);
  const seoKeywords =
    typeof (category as any).seoKeywords === "string"
      ? (category as any).seoKeywords.trim()
      : undefined;
  const stats = category.stats
    ? {
        productCount: Number(category.stats.productCount ?? 0),
        inStockCount: Number(category.stats.inStockCount ?? 0),
      }
    : undefined;

  const urlPathRaw =
    typeof (category as any).urlPath === "string"
      ? (category as any).urlPath.trim()
      : "";
  const ensuredUrlPath = urlPathRaw.startsWith("/")
    ? urlPathRaw
    : urlPathRaw.length > 0
      ? `/${urlPathRaw}`
      : `/${category.slug}`;

  return {
    ...category,
    features,
    seoKeywords,
    urlPath: ensuredUrlPath,
    isActive:
      typeof (category as any).isActive === "boolean"
        ? (category as any).isActive
        : Boolean((category as any).isActive),
    sortOrder: Number((category as any).sortOrder ?? 0),
    createdAt: toIsoString((category as any).createdAt),
    updatedAt: toIsoString((category as any).updatedAt),
    stats,
  };
}

function toIsoString(value: unknown): string {
  if (value instanceof Date) {
    return value.toISOString();
  }
  if (typeof value === "number") {
    return new Date(value).toISOString();
  }
  if (typeof value === "string") {
    const trimmed = value.trim();
    if (trimmed.length === 0) {
      return new Date(0).toISOString();
    }
    const numeric = Number(trimmed);
    if (!Number.isNaN(numeric)) {
      return new Date(numeric).toISOString();
    }
    const parsed = Date.parse(trimmed);
    if (!Number.isNaN(parsed)) {
      return new Date(parsed).toISOString();
    }
    return trimmed;
  }
  return new Date().toISOString();
}

export function parseFeatureList(value: unknown): string[] {
  if (Array.isArray(value)) {
    return value
      .map((item) =>
        typeof item === "string" ? item.trim() : String(item ?? "").trim()
      )
      .filter((item) => item.length > 0);
  }

  if (typeof value === "string") {
    try {
      const parsed = JSON.parse(value);
      if (Array.isArray(parsed)) {
        return parsed
          .map((item) =>
            typeof item === "string" ? item.trim() : String(item ?? "").trim()
          )
          .filter((item) => item.length > 0);
      }
    } catch {
      // treat as delimited string
    }

    return value
      .split(/\r?\n|,/)
      .map((item) => item.trim())
      .filter((item) => item.length > 0);
  }

  return [];
}

export function compareCategories(
  a: ProductCategoryRecord,
  b: ProductCategoryRecord
) {
  const orderDiff = (a.sortOrder ?? 0) - (b.sortOrder ?? 0);
  if (orderDiff !== 0) {
    return orderDiff;
  }
  return (a.title || a.slug).localeCompare(b.title || b.slug, "zh-TW");
}

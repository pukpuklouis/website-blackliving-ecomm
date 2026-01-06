import type { ProductCategory as ProductCategoryDTO } from "@blackliving/types";
import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { useEnvironment } from "../../contexts/EnvironmentContext";
import { reorderList } from "../../lib/array";
import { safeParseJSON } from "../../lib/http";
import {
  generateDefaultVariants,
  getProductTypeOptions,
  getProductTypeTemplate,
  validateProductAgainstTemplate,
} from "../../lib/product-templates";
import { generateBulkSKUs } from "../../lib/sku-generator";
import {
  compareCategories,
  normalizeCategory,
  normalizeFormData,
  sanitizeProduct,
  validateProductWithFallback,
} from "./utils";

// Re-export types from utils
export type { Product, ProductCategoryRecord, ProductFormData } from "./utils";

export function useProductForm({
  productId,
  initialData,
}: {
  productId?: string;
  initialData?: Partial<Product>;
}) {
  const navigate = useNavigate();
  const { PUBLIC_API_URL, PUBLIC_IMAGE_CDN_URL } = useEnvironment();
  const API_BASE = PUBLIC_API_URL;
  const cdnBase = PUBLIC_IMAGE_CDN_URL?.trim();

  const [product, setProduct] = useState<Product | null>(null);
  const [categories, setCategories] = useState<ProductCategoryRecord[]>([]);
  const [categoriesLoading, setCategoriesLoading] = useState(true);
  const [loading, setLoading] = useState(!!productId);
  const [formData, setFormData] = useState<Partial<ProductFormData>>({});
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [featureInput, setFeatureInput] = useState("");
  const [selectedTemplate, setSelectedTemplate] = useState<string>("");

  const fallbackAssetBase = useMemo(
    () => (typeof window !== "undefined" ? window.location.origin : undefined),
    []
  );

  const featureDragIndexRef = useRef<number | null>(null);

  const hasAtLeastOneImage = useMemo(
    () => (formData.images?.length ?? 0) > 0,
    [formData.images]
  );
  const hasAtLeastOneVariant = useMemo(
    () => (formData.variants?.length ?? 0) > 0,
    [formData.variants]
  );
  const isSubmitDisabled =
    isSubmitting || !hasAtLeastOneImage || !hasAtLeastOneVariant;

  const sortedCategories = useMemo(
    () => [...categories].sort(compareCategories),
    [categories]
  );

  const productTypeOptions = useMemo(() => getProductTypeOptions(), []);

  const selectedTemplateData = useMemo(
    () => (selectedTemplate ? getProductTypeTemplate(selectedTemplate) : null),
    [selectedTemplate]
  );

  // Load categories
  useEffect(() => {
    const loadCategories = async () => {
      try {
        setCategoriesLoading(true);
        const response = await fetch(
          `${API_BASE}/api/admin/products/categories`,
          {
            credentials: "include",
          }
        );

        if (response.ok) {
          const result = await response.json();
          const rawCategories = Array.isArray(result.data) ? result.data : [];
          const normalized = rawCategories
            .map((category: ProductCategoryDTO) => normalizeCategory(category))
            .sort(compareCategories);
          setCategories(normalized);
        } else {
          const err = await safeParseJSON(response);
          throw new Error(
            (err as any)?.error ||
              (err as any)?.message ||
              "Failed to load categories"
          );
        }
      } catch (error) {
        console.error("Failed to load categories:", error);
        toast.error("載入產品分類失敗");
        setCategories([]);
      } finally {
        setCategoriesLoading(false);
      }
    };

    loadCategories();
  }, [API_BASE]);

  // Load product data
  useEffect(() => {
    if (!productId) {
      // New product - initialize with defaults
      setFormData({
        category: sortedCategories[0]?.slug ?? "",
        images: [],
        variants: [],
        features: [],
        specifications: {},
        inStock: true,
        featured: false,
        sortOrder: 0,
      });
      setLoading(false);
      return;
    }

    // If initialData is provided from loader, use it instead of making API call
    if (initialData?.id) {
      const sanitizedProduct = sanitizeProduct(
        initialData,
        cdnBase,
        fallbackAssetBase
      );
      setProduct(sanitizedProduct);
      setFormData(sanitizedProduct);
      setSelectedTemplate(sanitizedProduct.productType || "");
      setLoading(false);
      return;
    }

    // Fallback: load product data via API (only if no initialData)
    const loadProduct = async () => {
      try {
        setLoading(true);
        const response = await fetch(
          `${API_BASE}/api/admin/products/${productId}`,
          {
            credentials: "include",
          }
        );

        if (response.ok) {
          const result = await response.json();
          const loadedProduct = sanitizeProduct(
            result.data,
            cdnBase,
            fallbackAssetBase
          );
          setProduct(loadedProduct);
          setFormData(loadedProduct);
          setSelectedTemplate(loadedProduct.productType || "");
        } else {
          const err = await safeParseJSON(response);
          throw new Error(
            (err as any)?.error ||
              (err as any)?.message ||
              "Failed to load product"
          );
        }
      } catch (error) {
        console.error("Failed to load product:", error);
        toast.error("載入產品失敗");
        navigate(-1);
      } finally {
        setLoading(false);
      }
    };

    if (categories.length > 0) {
      loadProduct();
    }
  }, [
    productId,
    API_BASE,
    cdnBase,
    fallbackAssetBase,
    categories,
    initialData,
    initialData?.id,
    navigate,
    sortedCategories,
  ]);

  const handleTemplateChange = (templateId: string) => {
    setSelectedTemplate(templateId);
    setFormData((prev) => {
      const hasVariants = (prev.variants?.length ?? 0) > 0;

      if (!templateId) {
        // Clear template errors when removing template
        setFormErrors((errors) => {
          const newErrors = { ...errors };
          Object.keys(newErrors).forEach((key) => {
            if (key.startsWith("variants.") || key === "productType") {
              delete newErrors[key];
            }
          });
          return newErrors;
        });
        return { ...prev, productType: undefined };
      }

      // Validate existing variants against new template
      if (hasVariants) {
        const templateValidation = validateProductAgainstTemplate(templateId, {
          ...prev,
          productType: templateId,
        });

        if (templateValidation.isValid) {
          // Clear errors if validation passes
          setFormErrors({});
        } else {
          // Show validation errors
          setFormErrors(templateValidation.errors);
          toast.error("現有款式與新模板不相容，請修正必填欄位");
        }

        return { ...prev, productType: templateId };
      }

      // No variants yet, generate default ones
      const defaultVariants = generateDefaultVariants(templateId);
      setFormErrors({});
      return { ...prev, productType: templateId, variants: defaultVariants };
    });
  };

  const handleGenerateSKUs = async () => {
    if (!(selectedTemplate && formData.category)) return;

    try {
      const variants = formData.variants || [];
      if (variants.length === 0) {
        toast.error("請先新增商品款式");
        return;
      }

      const skuResults = await generateBulkSKUs(
        selectedTemplate,
        formData.slug || "temp",
        variants.map((v) => ({
          size: v.size,
          firmness: v.firmness,
          color: v.color,
          material: v.material,
          thickness: v.thickness,
          loft: v.loft,
          weight: v.weight,
          style: v.style,
        }))
      );

      const updatedVariants = variants.map((variant, index) => ({
        ...variant,
        sku: skuResults[index]?.sku || variant.sku,
      }));

      setFormData((prev) => ({ ...prev, variants: updatedVariants }));
      toast.success("SKU 生成完成");
    } catch (error) {
      console.error("SKU generation failed:", error);
      toast.error("SKU 生成失敗");
    }
  };

  const handleSubmit = async () => {
    try {
      setIsSubmitting(true);
      setFormErrors({});

      // Normalize types
      const normalized = normalizeFormData(formData, []);

      // Validate against template if selected
      if (selectedTemplate) {
        const templateValidation = validateProductAgainstTemplate(
          selectedTemplate,
          normalized
        );
        if (!templateValidation.isValid) {
          setFormErrors((prev) => ({ ...prev, ...templateValidation.errors }));
          toast.error("產品不符合模板要求，請檢查必填欄位");
          console.error(
            "Template validation errors:",
            templateValidation.errors
          );
          return;
        }
      }

      const requiredErrors: Record<string, string> = {};
      if (normalized.images.length === 0) {
        requiredErrors.images = "至少需要一張產品圖片";
      }
      if (normalized.variants.length === 0) {
        requiredErrors["variants"] = "至少需要一個商品款式";
      }

      if (Object.keys(requiredErrors).length > 0) {
        setFormErrors(requiredErrors);
        toast.error("請確認表單欄位填寫正確");
        return;
      }

      const validationResult = validateProductWithFallback(normalized);
      if (!validationResult.success) {
        if (validationResult.errors) {
          setFormErrors((prev) => ({ ...prev, ...validationResult.errors }));
        }
        toast.error("請確認表單欄位填寫正確");
        return;
      }

      const validatedData = validationResult.data;

      if (
        validatedData &&
        !categories.some((category) => category.slug === validatedData.category)
      ) {
        setFormErrors((prev) => ({
          ...prev,
          category: "請選擇有效的產品分類",
        }));
        toast.error("請先建立或選擇有效的產品分類");
        return;
      }

      const url = productId
        ? `${API_BASE}/api/admin/products/${productId}`
        : `${API_BASE}/api/admin/products`;
      const method = productId ? "PUT" : "POST";

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(validatedData),
      });

      if (response.ok) {
        await response.json();
        toast.success(productId ? "產品更新成功" : "產品建立成功");
        navigate("/dashboard/products");
      } else {
        const err = await safeParseJSON(response);
        throw new Error(
          (err as any)?.error ||
            (err as any)?.message ||
            "Failed to save product"
        );
      }
    } catch (error) {
      console.error("Save failed:", error);
      toast.error(error instanceof Error ? error.message : "儲存產品失敗");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAddVariant = () => {
    setFormData((prev) => ({
      ...prev,
      variants: [
        ...(prev.variants || []),
        {
          id: `variant-${Date.now()}`,
          name: "",
          price: 0,
          sku: "",
        },
      ],
    }));
  };

  const handleUpdateVariant = (
    index: number,
    field: keyof ProductFormData["variants"][number],
    value: string | number
  ) => {
    setFormData((prev) => {
      const variants = [...(prev.variants || [])];
      const current = { ...(variants[index] || { name: "", price: 0 }) } as any;
      if (field === "price") {
        current.price = Number(value) || 0;
      } else {
        current[field] = value;
      }
      variants[index] = current;
      return { ...prev, variants };
    });
  };

  const handleRemoveVariant = (index: number) => {
    const nextVariants = (formData.variants || []).filter(
      (_, i) => i !== index
    );
    setFormData((prev) => ({
      ...prev,
      variants: nextVariants,
    }));
  };

  const handleAddFeature = () => {
    const val = featureInput.trim();
    if (!val) {
      return;
    }
    setFormData((prev) => ({
      ...prev,
      features: [...(prev.features || []), val],
    }));
    setFeatureInput("");
  };

  const handleRemoveFeature = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      features: (prev.features || []).filter((_, i) => i !== index),
    }));
  };

  const handleProductImagesChange = (images: string[]) => {
    setFormData((prev) => ({ ...prev, images }));
  };

  const handleFeatureDragStart = (index: number) => {
    featureDragIndexRef.current = index;
  };

  const handleFeatureDragEnter = (index: number) => {
    if (
      featureDragIndexRef.current === null ||
      featureDragIndexRef.current === index
    ) {
      return;
    }
    setFormData((prev) => {
      const features = prev.features || [];
      const from = featureDragIndexRef.current;
      if (
        from === null ||
        from < 0 ||
        from >= features.length ||
        index < 0 ||
        index >= features.length
      ) {
        return prev;
      }
      const reordered = reorderList(features, from, index);
      featureDragIndexRef.current = index;
      return { ...prev, features: reordered };
    });
  };

  const handleFeatureDragEnd = () => {
    featureDragIndexRef.current = null;
  };

  return {
    product,
    categories,
    categoriesLoading,
    loading,
    formData,
    setFormData,
    formErrors,
    setFormErrors,
    isSubmitting,
    featureInput,
    setFeatureInput,
    selectedTemplate,
    sortedCategories,
    productTypeOptions,
    selectedTemplateData,
    hasAtLeastOneImage,
    hasAtLeastOneVariant,
    isSubmitDisabled,
    handleTemplateChange,
    handleGenerateSKUs,
    handleSubmit,
    handleAddVariant,
    handleUpdateVariant,
    handleRemoveVariant,
    handleAddFeature,
    handleRemoveFeature,
    handleProductImagesChange,
    handleFeatureDragStart,
    handleFeatureDragEnter,
    handleFeatureDragEnd,
  };
}

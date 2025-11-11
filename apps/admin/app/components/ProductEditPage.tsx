import { useState, useEffect, useMemo, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Button,
  Input,
  Label,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  Badge,
  Separator,
  Textarea,
  Switch,
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@blackliving/ui';
// Tree-shakable Lucide imports
import Plus from '@lucide/react/plus';
import Save from '@lucide/react/save';
import ArrowLeft from '@lucide/react/arrow-left';
import Trash2 from '@lucide/react/trash-2';
import GripVertical from '@lucide/react/grip-vertical';
import Settings from '@lucide/react/settings';
import Package from '@lucide/react/package';
import ImageIcon from '@lucide/react/image';
import List from '@lucide/react/list';
import FileText from '@lucide/react/file-text';
import Search from '@lucide/react/search';
import { z, type ZodIssue } from 'zod';
import { toast } from 'sonner';
import { resolveAssetUrl, extractAssetKey } from '../lib/assets';
import { reorderList } from '../lib/array';
import { safeParseJSON } from '../lib/http';
import { ImageUpload } from './ImageUpload';
import { BlockNoteEditor } from './editor';
import { useEnvironment } from '../contexts/EnvironmentContext';
import type { ProductCategory as ProductCategoryDTO } from '@blackliving/types';
import {
  getProductTypeTemplate,
  getProductTypeOptions,
  generateDefaultVariants,
  validateProductAgainstTemplate,
} from '../lib/product-templates';
import { generateBulkSKUs } from '../lib/sku-generator';

// Product types based on database schema
export interface Product {
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
}

// Extended validation schema for accessory products
export const slugRegex = /^[a-z0-9-]+$/;

export const productSchema = z.object({
  name: z.string().min(1, '產品名稱為必填'),
  slug: z.string().min(1, 'URL slug 為必填').regex(slugRegex, '只能包含小寫字母、數字和連字符'),
  description: z.string().min(10, '產品描述至少需要 10 個字元'),
  category: z
    .string()
    .min(1, '請輸入產品分類 slug')
    .regex(slugRegex, '分類 slug 只能包含小寫字母、數字和連字符'),
  productType: z.string().optional(),
  images: z.array(z.string().url()).min(1, '至少需要一張產品圖片'),
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
      })
    )
    .min(1, '至少需要一個商品款式'),
  features: z.array(z.string()).default([]),
  featuresMarkdown: z.string().optional(),
  specifications: z.record(z.string(), z.string()).default({}),
  inStock: z.boolean().default(true),
  featured: z.boolean().default(false),
  sortOrder: z.number().default(0),
  seoTitle: z.string().optional(),
  seoDescription: z.string().optional(),
});

type ProductFormData = z.infer<typeof productSchema>;

type ProductCategoryRecord = ProductCategoryDTO;

interface ProductEditPageProps {
  productId?: string;
  initialData?: Partial<Product>;
}

export default function ProductEditPage({ productId, initialData }: ProductEditPageProps) {
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
  const [specOrder, setSpecOrder] = useState<string[]>([]);
  const [featureInput, setFeatureInput] = useState('');
  const [selectedTemplate, setSelectedTemplate] = useState<string>('');

  const fallbackAssetBase = useMemo(
    () => (typeof window !== 'undefined' ? window.location.origin : undefined),
    []
  );

  const featureDragIndexRef = useRef<number | null>(null);

  const hasAtLeastOneImage = useMemo(() => (formData.images?.length ?? 0) > 0, [formData.images]);
  const hasAtLeastOneVariant = useMemo(
    () => (formData.variants?.length ?? 0) > 0,
    [formData.variants]
  );
  const isSubmitDisabled = isSubmitting || !hasAtLeastOneImage || !hasAtLeastOneVariant;

  // Specifications section removed - no longer needed

  const categoryLabelMap = useMemo(() => {
    const map: Record<string, string> = {};
    categories.forEach((category) => {
      map[category.slug] = category.title;
    });
    return map;
  }, [categories]);

  const sortedCategories = useMemo(() => {
    return [...categories].sort(compareCategories);
  }, [categories]);

  const productTypeOptions = useMemo(() => getProductTypeOptions(), []);

  const selectedTemplateData = useMemo(() => {
    return selectedTemplate ? getProductTypeTemplate(selectedTemplate) : null;
  }, [selectedTemplate]);

  // Load categories
  useEffect(() => {
    const loadCategories = async () => {
      try {
        setCategoriesLoading(true);
        const response = await fetch(`${API_BASE}/api/admin/products/categories`, {
          credentials: 'include',
        });

        if (response.ok) {
          const result = await response.json();
          const rawCategories = Array.isArray(result.data) ? result.data : [];
          const normalized = rawCategories
            .map((category: ProductCategoryDTO) => normalizeCategory(category))
            .sort(compareCategories);
          setCategories(normalized);
        } else {
          const err = await safeParseJSON(response);
          throw new Error((err as any)?.error || (err as any)?.message || 'Failed to load categories');
        }
      } catch (error) {
        console.error('Failed to load categories:', error);
        toast.error('載入產品分類失敗');
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
        category: sortedCategories[0]?.slug ?? '',
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
    if (initialData) {
      const sanitizedProduct = sanitizeProduct(initialData, cdnBase, fallbackAssetBase);
      setProduct(sanitizedProduct);
      setFormData(sanitizedProduct);
      setSelectedTemplate(sanitizedProduct.productType || '');
      setLoading(false);
      return;
    }

    // Fallback: load product data via API (only if no initialData)
    const loadProduct = async () => {
      try {
        setLoading(true);
        const response = await fetch(`${API_BASE}/api/admin/products/${productId}`, {
          credentials: 'include',
        });

        if (response.ok) {
          const result = await response.json();
          const loadedProduct = sanitizeProduct(result.data, cdnBase, fallbackAssetBase);
          setProduct(loadedProduct);
          setFormData(loadedProduct);
          // Specifications section removed - specOrder no longer needed
          setSelectedTemplate(loadedProduct.productType || '');
        } else {
          const err = await safeParseJSON(response);
          throw new Error((err as any)?.error || (err as any)?.message || 'Failed to load product');
        }
      } catch (error) {
        console.error('Failed to load product:', error);
        toast.error('載入產品失敗');
        navigate(-1);
      } finally {
        setLoading(false);
      }
    };

    if (categories.length > 0) {
      loadProduct();
    }
  }, [productId, API_BASE, cdnBase, fallbackAssetBase, categories, initialData]);

  // Handle template selection
  const handleTemplateChange = (templateId: string) => {
    setSelectedTemplate(templateId);
    setFormData((prev) => {
      const hasVariants = (prev.variants?.length ?? 0) > 0;

      if (!templateId) {
        return { ...prev, productType: undefined };
      }

      if (hasVariants) {
        return { ...prev, productType: templateId };
      }

      const defaultVariants = generateDefaultVariants(templateId);
      return { ...prev, productType: templateId, variants: defaultVariants };
    });
  };

  // Generate SKUs for variants
  const handleGenerateSKUs = async () => {
    if (!selectedTemplate || !formData.category) return;

    try {
      const variants = formData.variants || [];
      if (variants.length === 0) {
        toast.error('請先新增商品款式');
        return;
      }

      const skuResults = await generateBulkSKUs(
        selectedTemplate,
        formData.slug || 'temp',
        variants.map(v => ({
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

      setFormData(prev => ({ ...prev, variants: updatedVariants }));
      toast.success('SKU 生成完成');
    } catch (error) {
      console.error('SKU generation failed:', error);
      toast.error('SKU 生成失敗');
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
        const templateValidation = validateProductAgainstTemplate(selectedTemplate, normalized);
        if (!templateValidation.isValid) {
          setFormErrors(prev => ({ ...prev, ...(templateValidation.errors as any) }));
          toast.error('產品不符合模板要求');
          return;
        }
      }

      const requiredErrors: Record<string, string> = {};
      if (normalized.images.length === 0) {
        requiredErrors.images = '至少需要一張產品圖片';
      }
      if (normalized.variants.length === 0) {
        requiredErrors['variants'] = '至少需要一個商品款式';
      }

      if (Object.keys(requiredErrors).length > 0) {
        setFormErrors(requiredErrors);
        toast.error('請確認表單欄位填寫正確');
        return;
      }

      const validationResult = validateProductWithFallback(normalized);
      if (!validationResult.success) {
        if (validationResult.errors) {
          setFormErrors(prev => ({ ...prev, ...validationResult.errors }));
        }
        toast.error('請確認表單欄位填寫正確');
        return;
      }

      const validatedData = validationResult.data;

      if (validatedData && !categories.some((category) => category.slug === validatedData.category)) {
        setFormErrors(prev => ({ ...prev, category: '請選擇有效的產品分類' }));
        toast.error('請先建立或選擇有效的產品分類');
        return;
      }

      const url = productId
        ? `${API_BASE}/api/admin/products/${productId}`
        : `${API_BASE}/api/admin/products`;
      const method = productId ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(validatedData),
      });

      if (response.ok) {
        const result = await response.json();
        toast.success(productId ? '產品更新成功' : '產品建立成功');
        navigate('/dashboard/products');
      } else {
        const err = await safeParseJSON(response);
        throw new Error((err as any)?.error || (err as any)?.message || 'Failed to save product');
      }
    } catch (error) {
      console.error('Save failed:', error);
      toast.error(error instanceof Error ? error.message : '儲存產品失敗');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAddVariant = () => {
    setFormData((prev) => ({
      ...prev,
      variants: [...(prev.variants || []), {
        id: `variant-${Date.now()}`,
        name: '',
        price: 0,
        sku: '',
      }],
    }));
  };

  const handleUpdateVariant = (
    index: number,
    field: keyof ProductFormData['variants'][number],
    value: string | number
  ) => {
    setFormData((prev) => {
      const variants = [...(prev.variants || [])];
      const current = { ...(variants[index] || { name: '', price: 0 }) } as any;
      if (field === 'price') {
        current.price = Number(value) || 0;
      } else {
        current[field] = value;
      }
      variants[index] = current;
      return { ...prev, variants };
    });
  };

  const handleRemoveVariant = (index: number) => {
    const nextVariants = (formData.variants || []).filter((_, i) => i !== index);
    setFormData((prev) => ({
      ...prev,
      variants: nextVariants,
    }));
  };

  const handleAddFeature = () => {
    const val = featureInput.trim();
    if (!val) return;
    setFormData((prev) => ({ ...prev, features: [...(prev.features || []), val] }));
    setFeatureInput('');
  };

  const handleRemoveFeature = (i: number) => {
    setFormData((prev) => ({
      ...prev,
      features: (prev.features || []).filter((_, idx) => idx !== i),
    }));
  };

  const handleAddSpec = () => {
    // Specifications section removed - no longer needed
  };

  const handleRemoveSpec = (k: string) => {
    // Specifications section removed - no longer needed
  };

  const handleProductImagesChange = (images: string[]) => {
    setFormData((prev) => ({ ...prev, images }));
  };

  const handleFeatureDragStart = (index: number) => {
    featureDragIndexRef.current = index;
  };

  const handleFeatureDragEnter = (index: number) => {
    if (featureDragIndexRef.current === null || featureDragIndexRef.current === index) return;
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

  // Specification drag handlers removed - specifications section removed

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <div className="h-8 w-8 bg-gray-200 rounded animate-pulse" />
          <div className="h-8 w-48 bg-gray-200 rounded animate-pulse" />
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardHeader>
                <div className="h-6 w-32 bg-gray-200 rounded animate-pulse" />
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="h-10 w-full bg-gray-200 rounded animate-pulse" />
                <div className="h-10 w-full bg-gray-200 rounded animate-pulse" />
              </CardContent>
            </Card>
          </div>
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <div className="h-6 w-24 bg-gray-200 rounded animate-pulse" />
              </CardHeader>
              <CardContent>
                <div className="h-20 w-full bg-gray-200 rounded animate-pulse" />
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" onClick={() => navigate(-1)}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            返回
          </Button>
          <div>
            <h1 className="text-3xl font-bold">
              {productId ? '編輯產品' : '新增產品'}
            </h1>
            <p className="text-muted-foreground mt-1">
              {productId ? '更新產品資訊' : '建立新的產品'}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={handleGenerateSKUs} disabled={!selectedTemplate}>
            <Settings className="h-4 w-4 mr-2" />
            生成 SKU
          </Button>
          <Button disabled={isSubmitDisabled} onClick={handleSubmit}>
            <Save className="h-4 w-4 mr-2" />
            {isSubmitting ? '儲存中...' : '儲存'}
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Basic Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Package className="h-5 w-5" />
                基本資訊
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">產品名稱 *</Label>
                  <Input
                    id="name"
                    value={formData.name || ''}
                    onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
                    className={formErrors.name ? 'border-red-500' : ''}
                  />
                  {formErrors.name && (
                    <p className="text-sm text-red-500">{formErrors.name}</p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="slug">URL Slug *</Label>
                  <Input
                    id="slug"
                    value={formData.slug || ''}
                    onChange={(e) => setFormData((prev) => ({ ...prev, slug: e.target.value }))}
                    className={formErrors.slug ? 'border-red-500' : ''}
                  />
                  {formErrors.slug && (
                    <p className="text-sm text-red-500">{formErrors.slug}</p>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">產品描述 *</Label>
                <Textarea
                  id="description"
                  value={formData.description || ''}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, description: e.target.value }))
                  }
                  className={formErrors.description ? 'border-red-500' : ''}
                  rows={4}
                />
                {formErrors.description && (
                  <p className="text-sm text-red-500">{formErrors.description}</p>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="category">產品分類 *</Label>
                  <Select
                    value={formData.category || ''}
                    onValueChange={(value) =>
                      setFormData((prev) => ({
                        ...prev,
                        category: value,
                      }))
                    }
                  >
                    <SelectTrigger className={formErrors.category ? 'border-red-500' : ''}>
                      <SelectValue placeholder="選擇分類" />
                    </SelectTrigger>
                    <SelectContent>
                      {sortedCategories.map((category) => (
                        <SelectItem key={category.slug} value={category.slug}>
                          {category.title}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {formErrors.category && (
                    <p className="text-sm text-red-500">{formErrors.category}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="productType">產品類型</Label>
                  <Select value={selectedTemplate} onValueChange={handleTemplateChange}>
                    <SelectTrigger>
                      <SelectValue placeholder="選擇產品類型" />
                    </SelectTrigger>
                    <SelectContent>
                      {productTypeOptions.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Images */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ImageIcon className="h-5 w-5" />
                產品圖片
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ImageUpload
                value={formData.images || []}
                onChange={handleProductImagesChange}
                folder="products"
                emptyHint={!hasAtLeastOneImage ? '儲存前請至少上傳一張產品圖片。' : undefined}
                error={formErrors.images}
              />
            </CardContent>
          </Card>

          {/* Variants */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <List className="h-5 w-5" />
                商品款式
              </CardTitle>
              <CardDescription>
                定義產品的不同選項組合
                {selectedTemplateData && (
                  <span className="ml-2 text-sm text-blue-600">
                    ({selectedTemplateData.name} 模板)
                  </span>
                )}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-4">
                {(formData.variants || []).map((variant, index) => (
                  <div key={variant.id || index} className="border rounded-lg p-4 space-y-4">
                    <div className="flex items-center justify-between">
                      <h4 className="font-medium">款式 {index + 1}</h4>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleRemoveVariant(index)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div className="space-y-2">
                        <Label>名稱</Label>
                        <Input
                          value={variant.name || ''}
                          onChange={(e) => handleUpdateVariant(index, 'name', e.target.value)}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>價格</Label>
                        <Input
                          type="number"
                          value={variant.price || 0}
                          onChange={(e) => handleUpdateVariant(index, 'price', e.target.value)}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>SKU</Label>
                        <Input
                          value={variant.sku || ''}
                          onChange={(e) => handleUpdateVariant(index, 'sku', e.target.value)}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>尺寸</Label>
                        <Input
                          value={variant.size || ''}
                          onChange={(e) => handleUpdateVariant(index, 'size', e.target.value)}
                        />
                      </div>
                    </div>

                    {/* Additional fields based on template */}
                    {selectedTemplateData && (
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        {selectedTemplateData.variantAxes.map((axis) => (
                          <div key={axis.id} className="space-y-2">
                            <Label>{axis.name}</Label>
                            <Select
                              value={String(variant[axis.type as keyof typeof variant] || '')}
                              onValueChange={(value) => handleUpdateVariant(index, axis.type as any, value)}
                            >
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                {axis.values.map((value) => (
                                  <SelectItem key={value} value={value}>
                                    {value}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>

              <Button variant="outline" onClick={handleAddVariant}>
                <Plus className="h-4 w-4 mr-2" />
                新增款式
              </Button>

              {!hasAtLeastOneVariant && (
                <p className="text-sm text-amber-600">儲存前請至少新增一個商品款式。</p>
              )}
              {formErrors['variants'] && (
                <p className="text-sm text-red-500">{formErrors['variants']}</p>
              )}
            </CardContent>
          </Card>

          {/* Features */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                產品特色
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
            <div className="space-y-2">
                <Label htmlFor="featuresMarkdown-editor">產品特色編輯</Label>
                <div id="featuresMarkdown-editor">
                  <BlockNoteEditor
                    value={formData.featuresMarkdown || ''}
                    onChange={(markdown) =>
                      setFormData((prev) => ({
                        ...prev,
                        featuresMarkdown: markdown,
                      }))
                    }
                    placeholder="編輯產品特色，支援 Markdown 格式..."
                    className="bn-editor-style"
                  />
                </div>
              </div>
              <div className="flex gap-2">
                <Input
                  placeholder="新增特色..."
                  value={featureInput}
                  onChange={(e) => setFeatureInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleAddFeature();
                    }
                  }}
                />
                <Button type="button" onClick={handleAddFeature}>
                  新增
                </Button>
              </div>

              {(formData.features || []).length > 0 && (
                <ul className="space-y-2">
                  {(formData.features || []).map((feature, i) => (
                    <li
                      key={`${feature}-${i}`}
                      className="flex items-center justify-between gap-2 rounded border bg-muted/20 p-2 cursor-move"
                      draggable
                      onDragStart={() => handleFeatureDragStart(i)}
                      onDragEnter={() => handleFeatureDragEnter(i)}
                      onDragOver={(e) => e.preventDefault()}
                      onDragEnd={handleFeatureDragEnd}
                      onDrop={handleFeatureDragEnd}
                    >
                      <span className="flex items-center gap-2 text-sm">
                        <GripVertical className="h-4 w-4 text-muted-foreground" />
                        {feature}
                      </span>
                      <Button variant="outline" size="sm" onClick={() => handleRemoveFeature(i)}>
                        移除
                      </Button>
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>

        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Status & Settings */}
          <Card>
            <CardHeader>
              <CardTitle>狀態設定</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <Label>有庫存</Label>
                  <p className="text-sm text-muted-foreground">產品是否可購買</p>
                </div>
                <Switch
                  checked={formData.inStock ?? true}
                  onCheckedChange={(checked) =>
                    setFormData((prev) => ({ ...prev, inStock: checked }))
                  }
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <Label>精選產品</Label>
                  <p className="text-sm text-muted-foreground">在首頁展示</p>
                </div>
                <Switch
                  checked={formData.featured ?? false}
                  onCheckedChange={(checked) =>
                    setFormData((prev) => ({ ...prev, featured: checked }))
                  }
                />
              </div>

              <div className="space-y-2">
                <Label>排序順序</Label>
                <Input
                  type="number"
                  value={(formData.sortOrder ?? 0).toString()}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, sortOrder: Number(e.target.value) || 0 }))
                  }
                />
              </div>
            </CardContent>
          </Card>

          {/* SEO */}
          <Card>
            <CardHeader>
              <CardTitle>SEO 設定</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>SEO 標題</Label>
                <Input
                  value={formData.seoTitle || ''}
                  onChange={(e) => setFormData((prev) => ({ ...prev, seoTitle: e.target.value }))}
                />
              </div>

              <div className="space-y-2">
                <Label>SEO 描述</Label>
                <Textarea
                  rows={3}
                  value={formData.seoDescription || ''}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, seoDescription: e.target.value }))
                  }
                />
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

// Utility functions (same as in ProductManagement.tsx)
export function normalizeFormData(
  fd: Partial<ProductFormData>,
  specOrder: string[] = []
): ProductFormData {
  const variants = Array.isArray(fd.variants)
    ? fd.variants.map((variant) => ({
        id: variant.id || `variant-${Date.now()}-${Math.random()}`,
        name: (variant?.name ?? '').toString().trim(),
        price:
          typeof variant?.price === 'number'
            ? variant.price
            : Number((variant?.price as unknown as string) ?? 0) || 0,
        sku: variant?.sku ? variant.sku.toString().trim() : undefined,
        size: variant?.size ? variant.size.toString().trim() : undefined,
        firmness: variant?.firmness ? variant.firmness.toString().trim() : undefined,
        color: variant?.color ? variant.color.toString().trim() : undefined,
        material: variant?.material ? variant.material.toString().trim() : undefined,
        thickness: variant?.thickness ? variant.thickness.toString().trim() : undefined,
        loft: variant?.loft ? variant.loft.toString().trim() : undefined,
        weight: variant?.weight ? variant.weight.toString().trim() : undefined,
        style: variant?.style ? variant.style.toString().trim() : undefined,
      }))
    : [];

  const images = Array.isArray(fd.images)
    ? fd.images.map((img) => (typeof img === 'string' ? img.trim() : '')).filter(Boolean)
    : [];

  const features = Array.isArray(fd.features)
    ? fd.features
        .map((feature) => (typeof feature === 'string' ? feature.trim() : ''))
        .filter(Boolean)
    : [];

  const rawSpecifications =
    fd.specifications && typeof fd.specifications === 'object'
      ? (fd.specifications as Record<string, unknown>)
      : {};

  const specificationEntries = Object.entries(rawSpecifications)
    .map(([key, value]) => {
      const trimmedKey = key.trim();
      const strValue =
        typeof value === 'string'
          ? value.trim()
          : value !== undefined && value !== null
            ? String(value).trim()
            : '';
      return [trimmedKey, strValue] as [string, string];
    })
    .filter(([key, value]) => key.length > 0 && value.length > 0);

  const orderedKeys = specOrder.length
    ? specOrder.filter((orderKey) => specificationEntries.some(([key]) => key === orderKey))
    : specificationEntries.map(([key]) => key);

  const specifications: Record<string, string> = {};
  orderedKeys.forEach((key) => {
    const entry = specificationEntries.find(([specKey]) => specKey === key);
    if (entry) {
      specifications[entry[0]] = entry[1];
    }
  });

  specificationEntries.forEach(([key, value]) => {
    if (!(key in specifications)) {
      specifications[key] = value;
    }
  });

  return {
    name: fd.name?.trim() ?? '',
    slug: fd.slug?.trim() ?? '',
    description: fd.description?.trim() ?? '',
    category: typeof fd.category === 'string' ? fd.category.trim() : '',
    productType: fd.productType?.trim(),
    images,
    variants,
    features,
    featuresMarkdown: fd.featuresMarkdown?.trim(),
    specifications,
    inStock: fd.inStock ?? true,
    featured: fd.featured ?? false,
    sortOrder:
      typeof fd.sortOrder === 'number'
        ? fd.sortOrder
        : Number((fd.sortOrder as unknown as string) ?? 0) || 0,
    seoTitle: fd.seoTitle?.trim() || undefined,
    seoDescription: fd.seoDescription?.trim() || undefined,
  };
}

interface ValidationResult {
  success: boolean;
  data?: ProductFormData;
  errors?: Record<string, string>;
}

export function validateProductWithFallback(data: ProductFormData): ValidationResult {
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
      console.warn('Zod validation failed internally, using manual validation fallback.', error);
      return manualValidateProduct(data);
    }
    throw error;
  }
}

function mapZodIssues(issues: ZodIssue[]): Record<string, string> {
  const mapped: Record<string, string> = {};
  issues.forEach((issue) => {
    const key = issue.path.length > 0 ? issue.path.join('.') : 'form';
    mapped[key] = issue.message;
  });
  return mapped;
}

function manualValidateProduct(data: ProductFormData): ValidationResult {
  const errors: Record<string, string> = {};

  if (!data.name || data.name.trim().length === 0) {
    errors.name = '產品名稱為必填';
  }

  const slug = data.slug?.trim() ?? '';
  if (!slug) {
    errors.slug = 'URL slug 為必填';
  } else if (!slugRegex.test(slug)) {
    errors.slug = '只能包含小寫字母、數字和連字符';
  }

  if (!data.description || data.description.trim().length < 10) {
    errors.description = '產品描述至少需要 10 個字元';
  }

  if (!data.category || !slugRegex.test(data.category)) {
    errors.category = '請選擇產品分類';
  }

  if (!Array.isArray(data.images) || data.images.length === 0) {
    errors.images = '至少需要一張產品圖片';
  }

  if (!Array.isArray(data.variants) || data.variants.length === 0) {
    errors['variants'] = '至少需要一個商品款式';
  } else {
    data.variants.forEach((variant, index) => {
      if (!variant.name || variant.name.trim().length === 0) {
        errors[`variants.${index}.name`] = '款式名稱為必填';
      }
      if (typeof variant.price !== 'number' || Number.isNaN(variant.price) || variant.price < 0) {
        errors[`variants.${index}.price`] = '價格需為不小於 0 的數字';
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
    typeof error.message === 'string' &&
    error.message.includes('_zod')
  );
}

export function sanitizeProduct(
  product: Product | null | undefined,
  cdnUrl?: string,
  fallbackBase?: string
): Product {
  const safeProduct = (product ?? {}) as Product;

  const images = Array.isArray(safeProduct.images)
    ? safeProduct.images.filter(Boolean).map((image) => {
        const imgString = String(image);
        const key = extractAssetKey(imgString);
        return resolveAssetUrl({ key, url: imgString }, cdnUrl, fallbackBase);
      })
    : [];

  return {
    ...safeProduct,
    images,
    variants: Array.isArray(safeProduct.variants) ? safeProduct.variants : [],
    features: Array.isArray(safeProduct.features) ? safeProduct.features : [],
    specifications: safeProduct.specifications || {},
  };
}

export function normalizeCategory(category: ProductCategoryDTO): ProductCategoryRecord {
  const features = parseFeatureList((category as any).features);
  const seoKeywords =
    typeof (category as any).seoKeywords === 'string'
      ? (category as any).seoKeywords.trim()
      : undefined;
  const stats = category.stats
    ? {
        productCount: Number(category.stats.productCount ?? 0),
        inStockCount: Number(category.stats.inStockCount ?? 0),
      }
    : undefined;

  const urlPathRaw =
    typeof (category as any).urlPath === 'string' ? (category as any).urlPath.trim() : '';
  const ensuredUrlPath = urlPathRaw.startsWith('/')
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
      typeof (category as any).isActive === 'boolean'
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
  if (typeof value === 'number') {
    return new Date(value).toISOString();
  }
  if (typeof value === 'string') {
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
      .map((item) => (typeof item === 'string' ? item.trim() : String(item ?? '').trim()))
      .filter((item) => item.length > 0);
  }

  if (typeof value === 'string') {
    try {
      const parsed = JSON.parse(value);
      if (Array.isArray(parsed)) {
        return parsed
          .map((item) => (typeof item === 'string' ? item.trim() : String(item ?? '').trim()))
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

export function compareCategories(a: ProductCategoryRecord, b: ProductCategoryRecord) {
  const orderDiff = (a.sortOrder ?? 0) - (b.sortOrder ?? 0);
  if (orderDiff !== 0) {
    return orderDiff;
  }
  return (a.title || a.slug).localeCompare(b.title || b.slug, 'zh-TW');
}

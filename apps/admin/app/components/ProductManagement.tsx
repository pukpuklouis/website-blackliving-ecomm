import { useState, useEffect, useMemo, useRef } from 'react';
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
  Skeleton,
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
import Search from '@lucide/react/search';
import Edit from '@lucide/react/edit';
import Trash2 from '@lucide/react/trash-2';
import Eye from '@lucide/react/eye';
import Filter from '@lucide/react/filter';
import GripVertical from '@lucide/react/grip-vertical';
import {
  useReactTable,
  createColumnHelper,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  flexRender,
  type SortingState,
  type ColumnFiltersState,
} from '@tanstack/react-table';
import { z, type ZodIssue } from 'zod';
import { toast } from 'sonner';
import { resolveAssetUrl, extractAssetKey } from '../lib/assets';
import { reorderList } from '../lib/array';
import { safeParseJSON } from '../lib/http';
import { ImageUpload } from './ImageUpload';
import { useEnvironment } from '../contexts/EnvironmentContext';
import type { ProductCategory as ProductCategoryDTO } from '@blackliving/types';

// Product types based on database schema
export interface Product {
  id: string;
  name: string;
  slug: string;
  description: string;
  category: string;
  images: string[];
  variants: Array<{
    id: string;
    name: string;
    price: number;
    sku?: string;
    size?: string;
    firmness?: string;
  }>;
  features: string[];
  specifications: Record<string, string>;
  inStock: boolean;
  featured: boolean;
  sortOrder: number;
  seoTitle?: string;
  seoDescription?: string;
  createdAt: Date;
  updatedAt: Date;
}

// Validation schema
export const slugRegex = /^[a-z0-9-]+$/;

export const productSchema = z.object({
  name: z.string().min(1, '產品名稱為必填'),
  slug: z.string().min(1, 'URL slug 為必填').regex(slugRegex, '只能包含小寫字母、數字和連字符'),
  description: z.string().min(10, '產品描述至少需要 10 個字元'),
  category: z
    .string()
    .min(1, '請輸入產品分類 slug')
    .regex(slugRegex, '分類 slug 只能包含小寫字母、數字和連字符'),
  images: z.array(z.string().url()).min(1, '至少需要一張產品圖片'),
  variants: z
    .array(
      z.object({
        name: z.string().min(1),
        price: z.number().min(0),
        sku: z.string().optional(),
        size: z.string().optional(),
        firmness: z.string().optional(),
      })
    )
    .min(1, '至少需要一個產品變體'),
  features: z.array(z.string()).default([]),
  specifications: z.record(z.string()).default({}),
  inStock: z.boolean().default(true),
  featured: z.boolean().default(false),
  sortOrder: z.number().default(0),
  seoTitle: z.string().optional(),
  seoDescription: z.string().optional(),
});

type ProductFormData = z.infer<typeof productSchema>;

type ProductCategoryRecord = ProductCategoryDTO;

interface ProductCategoryFormState {
  slug: string;
  title: string;
  description: string;
  series: string;
  brand: string;
  featuresRaw: string;
  seoKeywords: string;
  urlPath: string;
  isActive: boolean;
  sortOrder: number;
}

const initialCategoryForm: ProductCategoryFormState = {
  slug: '',
  title: '',
  description: '',
  series: '',
  brand: '',
  featuresRaw: '',
  seoKeywords: '',
  urlPath: '',
  isActive: true,
  sortOrder: 0,
};

export default function ProductManagement({ initialProducts }: { initialProducts?: Product[] }) {
  const { PUBLIC_API_URL, PUBLIC_IMAGE_CDN_URL } = useEnvironment();
  const API_BASE = PUBLIC_API_URL;
  const cdnBase = PUBLIC_IMAGE_CDN_URL?.trim();
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<ProductCategoryRecord[]>([]);
  const [categoriesLoading, setCategoriesLoading] = useState(true);
  const [loading, setLoading] = useState(true);
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [globalFilter, setGlobalFilter] = useState('');
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [formData, setFormData] = useState<Partial<ProductFormData>>({});
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [deletingProductIds, setDeletingProductIds] = useState<Record<string, boolean>>({});
  const [specOrder, setSpecOrder] = useState<string[]>([]);
  const [categoryDialogOpen, setCategoryDialogOpen] = useState(false);
  const [categoryDialogMode, setCategoryDialogMode] = useState<'create' | 'edit'>('create');
  const [categoryEditingSlug, setCategoryEditingSlug] = useState<string | null>(null);
  const [categoryForm, setCategoryForm] = useState<ProductCategoryFormState>(initialCategoryForm);
  const [categoryFormErrors, setCategoryFormErrors] = useState<Record<string, string>>({});
  const [isCategorySubmitting, setIsCategorySubmitting] = useState(false);
  const [deletingCategorySlug, setDeletingCategorySlug] = useState<string | null>(null);

  const fallbackAssetBase = useMemo(
    () => (typeof window !== 'undefined' ? window.location.origin : undefined),
    []
  );
  const featureDragIndexRef = useRef<number | null>(null);
  const specDragIndexRef = useRef<number | null>(null);

  const hasAtLeastOneImage = useMemo(() => (formData.images?.length ?? 0) > 0, [formData.images]);
  const hasAtLeastOneVariant = useMemo(
    () => (formData.variants?.length ?? 0) > 0,
    [formData.variants]
  );
  const isSubmitDisabled =
    isSubmitting || !hasAtLeastOneImage || !hasAtLeastOneVariant || categories.length === 0;
  const specificationEntries = useMemo(() => {
    const specs = formData.specifications || {};
    if (specOrder.length > 0) {
      return specOrder
        .filter((key) => key in specs)
        .map((key) => [key, specs[key] as string] as [string, string]);
    }
    return Object.entries(specs) as Array<[string, string]>;
  }, [formData.specifications, specOrder]);
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

  const columnHelper = createColumnHelper<Product>();

  const columns = [
    columnHelper.accessor('name', {
      header: '產品名稱',
      cell: (info) => (
        <div className="font-medium">
          {info.getValue()}
          {info.row.original.featured && (
            <Badge variant="secondary" className="ml-2">
              精選
            </Badge>
          )}
        </div>
      ),
    }),
    columnHelper.accessor('category', {
      header: '分類',
      cell: (info) => {
        const slug = info.getValue();
        const label = categoryLabelMap[slug] || slug;
        return <Badge variant="outline">{label}</Badge>;
      },
      filterFn: 'equals',
    }),
    columnHelper.accessor('variants', {
      header: '價格範圍',
      cell: (info) => {
        const variants = info.getValue();
        if (variants.length === 0) return '未設定';
        const prices = variants.map((v) => v.price);
        const min = Math.min(...prices);
        const max = Math.max(...prices);
        return min === max
          ? `NT$${min.toLocaleString()}`
          : `NT$${min.toLocaleString()} - NT$${max.toLocaleString()}`;
      },
    }),
    columnHelper.accessor('inStock', {
      header: '庫存狀態',
      cell: (info) => (
        <Badge
          variant={info.getValue() ? 'secondary' : 'destructive'}
          className={info.getValue() ? 'bg-green-500 text-white hover:bg-green-500/90' : ''}
        >
          {info.getValue() ? '有庫存' : '缺貨'}
        </Badge>
      ),
    }),
    columnHelper.accessor('updatedAt', {
      header: '最後更新',
      cell: (info) => new Date(info.getValue()).toLocaleDateString('zh-TW'),
    }),
    columnHelper.display({
      id: 'actions',
      header: '操作',
      cell: ({ row }) => (
        <div className="flex gap-2">
          <Button variant="ghost" size="sm" onClick={() => handleEdit(row.original)}>
            <Edit className="h-4 w-4" />
          </Button>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="ghost" size="sm" disabled={!!deletingProductIds[row.original.id]}>
                <Trash2 className="h-4 w-4" />
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>確認刪除</AlertDialogTitle>
                <AlertDialogDescription>
                  確定要刪除產品「{row.original.name}」嗎？此操作無法復原。
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>取消</AlertDialogCancel>
                <AlertDialogAction
                  onClick={() => handleDelete(row.original.id)}
                  disabled={!!deletingProductIds[row.original.id]}
                >
                  刪除
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      ),
    }),
  ];

  const table = useReactTable({
    data: products,
    columns,
    state: {
      sorting,
      columnFilters,
      globalFilter,
    },
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onGlobalFilterChange: setGlobalFilter,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
  });

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
        throw new Error(err?.error || err?.message || 'Failed to load categories');
      }
    } catch (error) {
      console.error('Failed to load categories:', error);
      toast.error('載入產品分類失敗');
      setCategories([]);
    } finally {
      setCategoriesLoading(false);
    }
  };

  // Initialize with server data if provided; otherwise fetch
  useEffect(() => {
    if (Array.isArray(initialProducts) && initialProducts.length > 0) {
      const sanitized = initialProducts.map((product) =>
        sanitizeProduct(product, cdnBase, fallbackAssetBase)
      );
      setProducts(sanitized);
      setLoading(false);
      loadCategories();
      return;
    }

    // No initial data or server-side fetch failed; hydrate from API instead
    loadProducts();
    loadCategories();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const categoryColumn = table.getColumn('category');
    if (!categoryColumn) return;
    const currentFilter = categoryColumn.getFilterValue() as string | undefined;
    if (currentFilter && !categories.some((category) => category.slug === currentFilter)) {
      categoryColumn.setFilterValue('');
    }
  }, [categories, table]);

  const loadProducts = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_BASE}/api/products`, { credentials: 'include' });
      if (response.ok) {
        const result = await response.json();
        // /api/products returns { success, data: { products, pagination } }
        if (result.success) {
          const fetchedProducts = Array.isArray(result.data?.products) ? result.data.products : [];
          setProducts(
            fetchedProducts.map((product: Product) =>
              sanitizeProduct(product, cdnBase, fallbackAssetBase)
            )
          );
        } else {
          setProducts([]);
        }
      }
    } catch (error) {
      console.error('Failed to load products:', error);
      toast.error('載入產品失敗');
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = () => {
    if (categories.length === 0) {
      toast.error('請先建立至少一個產品分類');
      return;
    }
    const defaultCategory = categories[0]?.slug ?? '';
    setSelectedProduct(null);
    setFormData({
      category: defaultCategory,
      images: [],
      variants: [],
      features: [],
      specifications: {},
      inStock: true,
      featured: false,
      sortOrder: 0,
    });
    setFormErrors({});
    setSpecOrder([]);
    setFeatureInput('');
    setSpecKey('');
    setSpecVal('');
    setIsCreateDialogOpen(true);
  };

  const handleEdit = (product: Product) => {
    const sanitized = sanitizeProduct(product, cdnBase, fallbackAssetBase);
    setSelectedProduct(sanitized);
    setFormData(sanitized);
    setSpecOrder(Object.keys(sanitized.specifications || {}));
    setFormErrors({});
    setFeatureInput('');
    setSpecKey('');
    setSpecVal('');
    setIsEditDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    try {
      setDeletingProductIds((prev) => ({ ...prev, [id]: true }));
      const response = await fetch(`${API_BASE}/api/admin/products/${id}`, {
        method: 'DELETE',
        credentials: 'include',
      });
      if (response.ok) {
        setProducts((prev) => prev.filter((p) => p.id !== id));
        // Ensure local state matches server truth when caches were stale
        await loadProducts();
        toast.success('產品刪除成功');
      } else {
        const err = await safeParseJSON(response);
        throw new Error(err?.error || err?.message || 'Failed to delete product');
      }
    } catch (error) {
      console.error('Delete failed:', error);
      toast.error(error instanceof Error ? error.message : '刪除產品失敗');
    } finally {
      setDeletingProductIds((prev) => {
        const next = { ...prev };
        delete next[id];
        return next;
      });
    }
  };

  const resetCategoryForm = () => {
    setCategoryForm(initialCategoryForm);
    setCategoryFormErrors({});
  };

  const openCreateCategoryDialog = () => {
    const nextSort = categories.reduce(
      (max, category) => Math.max(max, category.sortOrder ?? 0),
      0
    );
    setCategoryDialogMode('create');
    setCategoryEditingSlug(null);
    setCategoryForm({
      ...initialCategoryForm,
      sortOrder: nextSort + 1,
    });
    setCategoryFormErrors({});
    setCategoryDialogOpen(true);
  };

  const openEditCategoryDialog = (category: ProductCategoryRecord) => {
    setCategoryDialogMode('edit');
    setCategoryEditingSlug(category.slug);
    setCategoryForm({
      slug: category.slug,
      title: category.title,
      description: category.description,
      series: category.series,
      brand: category.brand,
      featuresRaw: category.features.join('\n'),
      seoKeywords: category.seoKeywords ?? '',
      urlPath: category.urlPath ?? '',
      isActive: category.isActive,
      sortOrder: category.sortOrder ?? 0,
    });
    setCategoryFormErrors({});
    setCategoryDialogOpen(true);
  };

  const closeCategoryDialog = () => {
    setCategoryDialogOpen(false);
    setCategoryDialogMode('create');
    setCategoryEditingSlug(null);
    resetCategoryForm();
    setIsCategorySubmitting(false);
  };

  const handleCategoryFieldChange = <T extends keyof ProductCategoryFormState>(
    field: T,
    value: ProductCategoryFormState[T]
  ) => {
    setCategoryForm((prev) => ({ ...prev, [field]: value }));
    setCategoryFormErrors((prev) => {
      if (!prev[field]) return prev;
      const next = { ...prev };
      delete next[field];
      return next;
    });
  };

  const validateCategoryForm = (editingSlug: string | null) => {
    const errors: Record<string, string> = {};
    const slug = categoryForm.slug.trim();
    const title = categoryForm.title.trim();
    const description = categoryForm.description.trim();
    const series = categoryForm.series.trim();
    const brand = categoryForm.brand.trim();
    const urlPath = categoryForm.urlPath.trim();

    if (!slug) {
      errors.slug = '請輸入分類 slug';
    } else if (!slugRegex.test(slug)) {
      errors.slug = 'slug 僅能包含小寫字母、數字與連字符';
    } else if (
      categories.some((category) => category.slug === slug && category.slug !== editingSlug)
    ) {
      errors.slug = '此 slug 已存在';
    }

    if (!title) {
      errors.title = '請輸入分類標題';
    }
    if (!description) {
      errors.description = '請輸入分類描述';
    }
    if (!series) {
      errors.series = '請輸入系列名稱';
    }
    if (!brand) {
      errors.brand = '請輸入品牌名稱';
    }
    if (urlPath && !urlPath.startsWith('/')) {
      errors.urlPath = 'URL Path 需以 / 開頭';
    }

    return errors;
  };

  const handleCategorySubmit = async () => {
    const errors = validateCategoryForm(categoryDialogMode === 'edit' ? categoryEditingSlug : null);
    if (Object.keys(errors).length > 0) {
      setCategoryFormErrors(errors);
      toast.error('請確認分類欄位填寫正確');
      return;
    }

    try {
      setIsCategorySubmitting(true);
      const slug = categoryForm.slug.trim();
      const requestBody = {
        slug,
        title: categoryForm.title.trim(),
        description: categoryForm.description.trim(),
        series: categoryForm.series.trim(),
        brand: categoryForm.brand.trim(),
        features: parseFeatureList(categoryForm.featuresRaw),
        seoKeywords: categoryForm.seoKeywords.trim() || undefined,
        urlPath: categoryForm.urlPath.trim(),
        isActive: categoryForm.isActive,
        sortOrder: Number.isFinite(categoryForm.sortOrder)
          ? categoryForm.sortOrder
          : Number(categoryForm.sortOrder ?? 0) || 0,
      };

      if (!requestBody.urlPath) {
        requestBody.urlPath = `/${slug}`;
      } else if (!requestBody.urlPath.startsWith('/')) {
        requestBody.urlPath = `/${requestBody.urlPath}`;
      }

      if (categoryDialogMode === 'edit' && categoryEditingSlug) {
        const response = await fetch(
          `${API_BASE}/api/admin/products/categories/${categoryEditingSlug}`,
          {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify(requestBody),
          }
        );

        if (response.ok) {
          const result = await response.json();
          const updatedCategory = normalizeCategory(result.data as ProductCategoryDTO);
          const previousSlug = categoryEditingSlug;
          setCategories((prev) => normalizeCategoryInsert(prev, updatedCategory));

          if (previousSlug !== updatedCategory.slug) {
            setProducts((prev) =>
              prev.map((product) =>
                product.category === previousSlug
                  ? { ...product, category: updatedCategory.slug }
                  : product
              )
            );
            const column = table.getColumn('category');
            if ((column?.getFilterValue() as string | undefined) === previousSlug) {
              column?.setFilterValue(updatedCategory.slug);
            }
            setFormData((prev) =>
              prev.category === previousSlug ? { ...prev, category: updatedCategory.slug } : prev
            );
          }

          toast.success('分類更新成功');
          closeCategoryDialog();
        } else {
          const err = await safeParseJSON(response);
          throw new Error(err?.error || err?.message || 'Failed to update category');
        }
      } else {
        const response = await fetch(`${API_BASE}/api/admin/products/categories`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify(requestBody),
        });

        if (response.ok) {
          const result = await response.json();
          const createdCategory = normalizeCategory(result.data as ProductCategoryDTO);
          setCategories((prev) => normalizeCategoryInsert(prev, createdCategory));
          toast.success('分類建立成功');
          closeCategoryDialog();

          // Update product form if no category selected yet
          setFormData((prev) => {
            if (prev.category) {
              return prev;
            }
            return { ...prev, category: createdCategory.slug };
          });
        } else {
          const err = await safeParseJSON(response);
          throw new Error(err?.error || err?.message || 'Failed to create category');
        }
      }
    } catch (error) {
      console.error('Create category failed:', error);
      toast.error(error instanceof Error ? error.message : '建立分類失敗');
    } finally {
      setIsCategorySubmitting(false);
    }
  };

  const handleDeleteCategory = async (slug: string) => {
    try {
      setDeletingCategorySlug(slug);
      const response = await fetch(`${API_BASE}/api/admin/products/categories/${slug}`, {
        method: 'DELETE',
        credentials: 'include',
      });

      if (response.ok) {
        toast.success('分類刪除成功');
        setCategories((prev) => prev.filter((category) => category.slug !== slug));
        if ((table.getColumn('category')?.getFilterValue() as string) === slug) {
          table.getColumn('category')?.setFilterValue('');
        }
        setFormData((prev) => {
          if (prev.category === slug) {
            return { ...prev, category: '' };
          }
          return prev;
        });
      } else {
        const err = await safeParseJSON(response);
        throw new Error(err?.error || err?.message || 'Failed to delete category');
      }
    } catch (error) {
      console.error('Delete category failed:', error);
      toast.error(error instanceof Error ? error.message : '刪除分類失敗');
    } finally {
      setDeletingCategorySlug(null);
    }
  };

  const handleSubmit = async (isEdit: boolean) => {
    try {
      setIsSubmitting(true);
      setFormErrors({});

      // Normalize types (price fields to number) and respect spec ordering
      const normalized = normalizeFormData(formData, specOrder);

      const requiredErrors: Record<string, string> = {};
      if (normalized.images.length === 0) {
        requiredErrors.images = '至少需要一張產品圖片';
      }
      if (normalized.variants.length === 0) {
        requiredErrors['variants'] = '至少需要一個產品變體';
      }

      if (Object.keys(requiredErrors).length > 0) {
        setFormErrors(requiredErrors);
        toast.error('請先新增至少一張圖片與一個產品變體');
        return;
      }

      const validationResult = validateProductWithFallback(normalized);
      if (!validationResult.success) {
        if (validationResult.errors) {
          setFormErrors((prev) => ({ ...prev, ...validationResult.errors }));
        }
        toast.error('請確認表單欄位填寫正確');
        return;
      }

      const validatedData = validationResult.data;

      if (!categories.some((category) => category.slug === validatedData.category)) {
        setFormErrors((prev) => ({ ...prev, category: '請選擇有效的產品分類' }));
        toast.error('請先建立或選擇有效的產品分類');
        return;
      }

      const url = isEdit
        ? `${API_BASE}/api/admin/products/${selectedProduct?.id}`
        : `${API_BASE}/api/admin/products`;
      const method = isEdit ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(validatedData),
      });

      if (response.ok) {
        const result = await response.json();
        const savedProduct = sanitizeProduct(result.data, cdnBase, fallbackAssetBase);

        if (isEdit) {
          setProducts((prev) => prev.map((p) => (p.id === selectedProduct?.id ? savedProduct : p)));
          setIsEditDialogOpen(false);
        } else {
          setProducts((prev) => [...prev, savedProduct]);
          setIsCreateDialogOpen(false);
        }

        toast.success(isEdit ? '產品更新成功' : '產品建立成功');
        setFormData({});
        setFormErrors({});
        setSpecOrder([]);
      } else {
        const err = await safeParseJSON(response);
        throw new Error(err?.error || err?.message || 'Failed to save product');
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
      variants: [...(prev.variants || []), { name: '', price: 0, sku: '', size: '', firmness: '' }],
    }));
    setFormErrors((prev) => {
      if (!prev.variants) return prev;
      const { variants, ...rest } = prev;
      return rest;
    });
  };

  const handleUpdateVariant = (
    index: number,
    field: keyof ProductFormData['variants'][number],
    value: string
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
    setFormErrors((prev) => {
      if (nextVariants.length === 0) {
        return { ...prev, variants: '至少需要一個產品變體' };
      }
      if (!prev.variants) return prev;
      const { variants, ...rest } = prev;
      return rest;
    });
  };

  const [featureInput, setFeatureInput] = useState('');
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

  const [specKey, setSpecKey] = useState('');
  const [specVal, setSpecVal] = useState('');
  const handleAddSpec = () => {
    const k = specKey.trim();
    const v = specVal.trim();
    if (!k || !v) return;
    setFormData((prev) => ({
      ...prev,
      specifications: { ...(prev.specifications || {}), [k]: v },
    }));
    setSpecOrder((prev) => (prev.includes(k) ? prev : [...prev, k]));
    setSpecKey('');
    setSpecVal('');
  };
  const handleRemoveSpec = (k: string) => {
    setFormData((prev) => {
      const next = { ...(prev.specifications || {}) } as Record<string, string>;
      delete next[k];
      return { ...prev, specifications: next };
    });
    setSpecOrder((prev) => prev.filter((key) => key !== k));
  };

  const handleProductImagesChange = (images: string[]) => {
    setFormData((prev) => ({ ...prev, images }));
    setFormErrors((prev) => {
      if (images.length === 0) {
        return { ...prev, images: '至少需要一張產品圖片' };
      }
      if (!prev.images) return prev;
      const { images: _removed, ...rest } = prev;
      return rest;
    });
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

  const handleSpecDragStart = (index: number) => {
    specDragIndexRef.current = index;
  };

  const handleSpecDragEnter = (index: number) => {
    if (specDragIndexRef.current === null || specDragIndexRef.current === index) return;
    setSpecOrder((prev) => {
      const from = specDragIndexRef.current;
      if (from === null || from < 0 || from >= prev.length || index < 0 || index >= prev.length) {
        return prev;
      }
      const reordered = reorderList(prev, from, index);
      specDragIndexRef.current = index;
      return reordered;
    });
  };

  const handleSpecDragEnd = () => {
    specDragIndexRef.current = null;
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <div className="h-7 w-40 bg-transparent" />
          </div>
          <Skeleton className="h-9 w-28" />
        </div>
        <div className="space-y-3">
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-72 w-full" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-foreground">產品管理</h1>
          <p className="text-foreground/60 mt-2">管理席夢思床墊與相關產品</p>
        </div>
        <Button onClick={handleCreate}>
          <Plus className="h-4 w-4 mr-2" />
          新增產品
        </Button>
      </div>

      {/* Category Management */}
      <Card>
        <CardHeader className="gap-4 md:flex md:flex-row md:items-center md:justify-between">
          <div className="space-y-1">
            <CardTitle>產品分類</CardTitle>
            <CardDescription>建立或移除產品分類，供前台與商品維護使用。</CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <Button onClick={openCreateCategoryDialog}>
              <Plus className="h-4 w-4 mr-2" />
              新增分類
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {categoriesLoading ? (
            <div className="space-y-3">
              <Skeleton className="h-20 w-full" />
              <Skeleton className="h-20 w-full" />
            </div>
          ) : categories.length === 0 ? (
            <div className="rounded-md border border-dashed p-6 text-center text-sm text-muted-foreground">
              尚未建立任何產品分類，請先新增分類以供產品使用。
            </div>
          ) : (
            <div className="space-y-4">
              {sortedCategories.map((category) => {
                const productCount = category.stats?.productCount ?? 0;
                const inUse = productCount > 0;
                return (
                  <div
                    key={category.id}
                    className="rounded-lg border p-4 flex flex-col gap-4 md:flex-row md:items-start md:justify-between"
                  >
                    <div className="space-y-3">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="text-lg font-semibold text-foreground">{category.title}</h3>
                        <Badge variant="secondary">{category.slug}</Badge>
                        {!category.isActive && (
                          <Badge variant="outline" className="text-amber-600 border-amber-300">
                            已停用
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground max-w-2xl">
                        {category.description}
                      </p>
                      <div className="flex flex-wrap gap-2 text-sm">
                        <Badge variant="outline">系列：{category.series}</Badge>
                        <Badge variant="outline">品牌：{category.brand}</Badge>
                        <Badge variant="outline">URL：{category.urlPath}</Badge>
                      </div>
                      {category.features.length > 0 && (
                        <div className="flex flex-wrap gap-2">
                          {category.features.map((feature) => (
                            <Badge
                              key={feature}
                              variant="secondary"
                              className="bg-gray-100 text-gray-700"
                            >
                              {feature}
                            </Badge>
                          ))}
                        </div>
                      )}
                      <div className="text-xs text-muted-foreground">
                        產品數：{productCount}（有庫存 {category.stats?.inStockCount ?? 0}）
                      </div>
                    </div>
                    <div className="flex flex-col gap-2 md:items-end">
                      <Button
                        variant="ghost"
                        className="self-start"
                        onClick={() => openEditCategoryDialog(category)}
                      >
                        <Edit className="h-4 w-4 mr-2" />
                        編輯
                      </Button>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button
                            variant="ghost"
                            className="self-start"
                            disabled={inUse || deletingCategorySlug === category.slug}
                          >
                            <Trash2 className="h-4 w-4 mr-2" />
                            刪除
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>確認刪除分類</AlertDialogTitle>
                            <AlertDialogDescription>
                              {inUse
                                ? '此分類仍有產品使用，請先調整產品後再刪除。'
                                : `確定要刪除分類「${category.title}」嗎？此操作無法復原。`}
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>取消</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => handleDeleteCategory(category.slug)}
                              disabled={inUse || deletingCategorySlug === category.slug}
                            >
                              刪除
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog
        open={categoryDialogOpen}
        onOpenChange={(open) => {
          if (!open) {
            closeCategoryDialog();
          }
        }}
      >
        <DialogContent className="max-w-xl">
          <DialogHeader>
            <DialogTitle>
              {categoryDialogMode === 'edit' ? '編輯產品分類' : '新增產品分類'}
            </DialogTitle>
            <DialogDescription>
              {categoryDialogMode === 'edit'
                ? '更新分類資訊，相關產品將同步套用新的屬性。'
                : '設定分類 slug 與顯示資訊，供產品與前台使用。'}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex flex-col gap-2">
                <Label htmlFor="category-slug">分類 Slug *</Label>
                <Input
                  id="category-slug"
                  value={categoryForm.slug}
                  onChange={(e) => handleCategoryFieldChange('slug', e.target.value)}
                  className={categoryFormErrors.slug ? 'border-red-500' : ''}
                  placeholder="例如 simmons-black"
                />
                {categoryFormErrors.slug && (
                  <p className="text-sm text-red-500">{categoryFormErrors.slug}</p>
                )}
              </div>
              <div className="flex flex-col gap-2">
                <Label htmlFor="category-sort">排序</Label>
                <Input
                  id="category-sort"
                  type="number"
                  value={categoryForm.sortOrder.toString()}
                  onChange={(e) =>
                    handleCategoryFieldChange('sortOrder', Number(e.target.value || 0))
                  }
                  min={0}
                />
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex flex-col gap-2">
                <Label htmlFor="category-title">顯示名稱 *</Label>
                <Input
                  id="category-title"
                  value={categoryForm.title}
                  onChange={(e) => handleCategoryFieldChange('title', e.target.value)}
                  className={categoryFormErrors.title ? 'border-red-500' : ''}
                />
                {categoryFormErrors.title && (
                  <p className="text-sm text-red-500">{categoryFormErrors.title}</p>
                )}
              </div>
              <div className="flex flex-col gap-2">
                <Label htmlFor="category-series">系列名稱 *</Label>
                <Input
                  id="category-series"
                  value={categoryForm.series}
                  onChange={(e) => handleCategoryFieldChange('series', e.target.value)}
                  className={categoryFormErrors.series ? 'border-red-500' : ''}
                />
                {categoryFormErrors.series && (
                  <p className="text-sm text-red-500">{categoryFormErrors.series}</p>
                )}
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex flex-col gap-2">
                <Label htmlFor="category-brand">品牌 *</Label>
                <Input
                  id="category-brand"
                  value={categoryForm.brand}
                  onChange={(e) => handleCategoryFieldChange('brand', e.target.value)}
                  className={categoryFormErrors.brand ? 'border-red-500' : ''}
                />
                {categoryFormErrors.brand && (
                  <p className="text-sm text-red-500">{categoryFormErrors.brand}</p>
                )}
              </div>
              <div className="flex flex-col gap-2">
                <Label htmlFor="category-url">URL Path</Label>
                <Input
                  id="category-url"
                  value={categoryForm.urlPath}
                  onChange={(e) => handleCategoryFieldChange('urlPath', e.target.value)}
                  className={categoryFormErrors.urlPath ? 'border-red-500' : ''}
                  placeholder="預設為 /slug"
                />
                {categoryFormErrors.urlPath && (
                  <p className="text-sm text-red-500">{categoryFormErrors.urlPath}</p>
                )}
              </div>
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="category-description">分類描述 *</Label>
              <Textarea
                id="category-description"
                value={categoryForm.description}
                onChange={(e) => handleCategoryFieldChange('description', e.target.value)}
                rows={3}
                className={categoryFormErrors.description ? 'border-red-500' : ''}
              />
              {categoryFormErrors.description && (
                <p className="text-sm text-red-500">{categoryFormErrors.description}</p>
              )}
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="category-features">特色（每行或以逗號分隔）</Label>
              <Textarea
                id="category-features"
                value={categoryForm.featuresRaw}
                onChange={(e) => handleCategoryFieldChange('featuresRaw', e.target.value)}
                rows={3}
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="category-seo">SEO 關鍵字</Label>
              <Input
                id="category-seo"
                value={categoryForm.seoKeywords}
                onChange={(e) => handleCategoryFieldChange('seoKeywords', e.target.value)}
                placeholder="以逗號分隔"
              />
            </div>
            <div className="flex items-center justify-between rounded-md border px-3 py-2">
              <div>
                <Label className="font-medium">啟用分類</Label>
                <p className="text-sm text-muted-foreground">停用後前台不會顯示此分類。</p>
              </div>
              <Switch
                checked={categoryForm.isActive}
                onCheckedChange={(checked) => handleCategoryFieldChange('isActive', checked)}
              />
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="ghost" onClick={closeCategoryDialog}>
              取消
            </Button>
            <Button onClick={handleCategorySubmit} disabled={isCategorySubmitting}>
              {isCategorySubmitting
                ? categoryDialogMode === 'edit'
                  ? '更新中…'
                  : '建立中…'
                : categoryDialogMode === 'edit'
                  ? '更新分類'
                  : '建立分類'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            篩選與搜尋
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="h-4 w-4 absolute left-3 top-3 text-gray-400" />
                <Input
                  placeholder="搜尋產品名稱、描述..."
                  value={globalFilter}
                  onChange={(e) => setGlobalFilter(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Select
              value={(table.getColumn('category')?.getFilterValue() as string) ?? ''}
              onValueChange={(value) =>
                table.getColumn('category')?.setFilterValue(value === 'all' ? '' : value)
              }
            >
              <SelectTrigger
                className="w-48"
                disabled={categoriesLoading || sortedCategories.length === 0}
              >
                <SelectValue placeholder="篩選分類" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">全部分類</SelectItem>
                {sortedCategories.map((category) => (
                  <SelectItem key={category.slug} value={category.slug}>
                    {categoryLabelMap[category.slug] || category.slug}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Products Table */}
      <Card>
        <CardHeader>
          <CardTitle>產品列表</CardTitle>
          <CardDescription>共 {table.getFilteredRowModel().rows.length} 個產品</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <table className="w-full">
              <thead>
                {table.getHeaderGroups().map((headerGroup) => (
                  <tr key={headerGroup.id} className="border-b bg-gray-50/50">
                    {headerGroup.headers.map((header) => (
                      <th key={header.id} className="px-4 py-3 text-left font-medium text-gray-900">
                        {header.isPlaceholder
                          ? null
                          : flexRender(header.column.columnDef.header, header.getContext())}
                      </th>
                    ))}
                  </tr>
                ))}
              </thead>
              <tbody>
                {table.getRowModel().rows.map((row) => (
                  <tr key={row.id} className="border-b hover:bg-gray-50/50">
                    {row.getVisibleCells().map((cell) => (
                      <td key={cell.id} className="px-4 py-3">
                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="flex items-center justify-between px-2 py-4">
            <div className="text-sm text-gray-700">
              顯示{' '}
              {table.getState().pagination.pageIndex * table.getState().pagination.pageSize + 1} 到{' '}
              {Math.min(
                (table.getState().pagination.pageIndex + 1) * table.getState().pagination.pageSize,
                table.getFilteredRowModel().rows.length
              )}{' '}
              項，共 {table.getFilteredRowModel().rows.length} 項
            </div>
            <div className="flex items-center space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => table.previousPage()}
                disabled={!table.getCanPreviousPage()}
              >
                上一頁
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => table.nextPage()}
                disabled={!table.getCanNextPage()}
              >
                下一頁
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Create/Edit Product Dialog */}
      <Dialog
        open={isCreateDialogOpen || isEditDialogOpen}
        onOpenChange={(open) => {
          if (!open) {
            setIsCreateDialogOpen(false);
            setIsEditDialogOpen(false);
            setFormData({});
            setFormErrors({});
          }
        }}
      >
        <DialogContent className="lg:min-w-4xl w-full max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{isEditDialogOpen ? '編輯產品' : '新增產品'}</DialogTitle>
            <DialogDescription>
              填寫產品資訊以{isEditDialogOpen ? '更新' : '建立'}產品。
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6 py-4">
            {/* Basic Information */}
            <div className="space-y-4">
              <h4 className="font-medium">基本資訊</h4>
              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-2">
                  <Label htmlFor="name">產品名稱 *</Label>
                  <Input
                    id="name"
                    value={formData.name || ''}
                    onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
                    className={formErrors.name ? 'border-red-500' : ''}
                  />
                  {formErrors.name && (
                    <p className="text-sm text-red-500 mt-1">{formErrors.name}</p>
                  )}
                </div>
                <div className="flex flex-col gap-2">
                  <Label htmlFor="slug">URL Slug *</Label>
                  <Input
                    id="slug"
                    value={formData.slug || ''}
                    onChange={(e) => setFormData((prev) => ({ ...prev, slug: e.target.value }))}
                    className={formErrors.slug ? 'border-red-500' : ''}
                  />
                  {formErrors.slug && (
                    <p className="text-sm text-red-500 mt-1">{formErrors.slug}</p>
                  )}
                </div>
              </div>

              <div className="flex flex-col gap-2">
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
                  <p className="text-sm text-red-500 mt-1">{formErrors.description}</p>
                )}
              </div>

              <div className="flex flex-col gap-2">
                <Label htmlFor="category">產品分類 *</Label>
                <Select
                  value={formData.category || ''}
                  onValueChange={(value) =>
                    setFormData((prev) => ({
                      ...prev,
                      category: value as ProductFormData['category'],
                    }))
                  }
                >
                  <SelectTrigger
                    className={formErrors.category ? 'border-red-500' : ''}
                    disabled={sortedCategories.length === 0}
                  >
                    <SelectValue
                      placeholder={sortedCategories.length === 0 ? '請先建立分類' : '選擇分類'}
                    />
                  </SelectTrigger>
                  <SelectContent>
                    {sortedCategories.map((category) => (
                      <SelectItem key={category.slug} value={category.slug}>
                        {categoryLabelMap[category.slug] || category.slug}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {formErrors.category && (
                  <p className="text-sm text-red-500 mt-1">{formErrors.category}</p>
                )}
                {!formErrors.category && sortedCategories.length === 0 && (
                  <p className="text-sm text-amber-600 mt-1">請先建立產品分類後再新增產品。</p>
                )}
              </div>
            </div>

            <Separator />

            {/* Status & Settings */}
            <div className="space-y-4">
              <h4 className="font-medium">狀態設定</h4>
              <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-2">
                  <Switch
                    checked={formData.inStock ?? true}
                    onCheckedChange={(checked) =>
                      setFormData((prev) => ({ ...prev, inStock: checked }))
                    }
                  />
                  <Label>有庫存</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Switch
                    checked={formData.featured ?? false}
                    onCheckedChange={(checked) =>
                      setFormData((prev) => ({ ...prev, featured: checked }))
                    }
                  />
                  <Label>精選產品</Label>
                </div>
              </div>
            </div>

            <Separator />

            {/* Image Upload */}
            <ImageUpload
              title="產品圖片"
              value={formData.images || []}
              onChange={handleProductImagesChange}
              folder="products"
              emptyHint={!hasAtLeastOneImage ? '儲存前請至少上傳一張產品圖片。' : undefined}
              error={formErrors.images}
            />

            <Separator />

            {/* Variants */}
            <div className="space-y-4">
              <h4 className="font-medium">產品選項</h4>
              <div className="space-y-6">
                {(formData.variants || []).map((v, i) => (
                  <div key={i} className="grid grid-cols-12 gap-2 items-end">
                    <div className="col-span-3 flex flex-col gap-2">
                      <Label>名稱</Label>
                      <Input
                        value={v?.name || ''}
                        onChange={(e) => handleUpdateVariant(i, 'name', e.target.value)}
                      />
                    </div>
                    <div className="col-span-2 flex flex-col gap-2">
                      <Label>價格</Label>
                      <Input
                        type="number"
                        inputMode="decimal"
                        value={v?.price?.toString() ?? '0'}
                        onChange={(e) => handleUpdateVariant(i, 'price', e.target.value)}
                      />
                    </div>
                    <div className="col-span-2 flex flex-col gap-2">
                      <Label>SKU</Label>
                      <Input
                        value={v?.sku || ''}
                        onChange={(e) => handleUpdateVariant(i, 'sku', e.target.value)}
                      />
                    </div>
                    <div className="col-span-2 flex flex-col gap-2">
                      <Label>尺寸</Label>
                      <Input
                        value={v?.size || ''}
                        onChange={(e) => handleUpdateVariant(i, 'size', e.target.value)}
                      />
                    </div>
                    <div className="col-span-2 flex flex-col gap-2">
                      <Label>硬度</Label>
                      <Input
                        value={v?.firmness || ''}
                        onChange={(e) => handleUpdateVariant(i, 'firmness', e.target.value)}
                      />
                    </div>
                    <div className="col-span-1">
                      <Button variant="outline" onClick={() => handleRemoveVariant(i)}>
                        移除
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
              <Button variant="secondary" onClick={handleAddVariant}>
                新增選項
              </Button>
              {!hasAtLeastOneVariant && (
                <p className="text-sm text-amber-600">儲存前請至少新增一個產品選項。</p>
              )}
              {formErrors['variants'] && (
                <p className="text-sm text-red-500">{formErrors['variants']}</p>
              )}
            </div>

            <Separator />

            {/* Features */}
            <div className="space-y-3">
              <h4 className="font-medium">產品特色</h4>
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
                      aria-label={`重新排序特色 ${i + 1}`}
                    >
                      <span className="flex items-center gap-2 text-sm">
                        <GripVertical className="h-4 w-4 text-muted-foreground" aria-hidden />
                        {feature}
                      </span>
                      <Button variant="outline" size="sm" onClick={() => handleRemoveFeature(i)}>
                        移除
                      </Button>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <Separator />

            {/* Specifications */}
            <div className="space-y-3">
              <h4 className="font-medium">產品規格</h4>
              <div className="grid grid-cols-12 gap-2 items-end">
                <div className="col-span-3 flex flex-col gap-2">
                  <Label>規格名稱</Label>
                  <Input value={specKey} onChange={(e) => setSpecKey(e.target.value)} />
                </div>
                <div className="col-span-6 flex flex-col gap-2">
                  <Label>規格數據</Label>
                  <Input value={specVal} onChange={(e) => setSpecVal(e.target.value)} />
                </div>
                <div className="col-span-2">
                  <Button type="button" onClick={handleAddSpec}>
                    新增
                  </Button>
                </div>
              </div>
              <div className="space-y-2">
                {specificationEntries.length === 0 ? (
                  <p className="text-sm text-muted-foreground">尚未新增規格。</p>
                ) : (
                  <ul className="space-y-2">
                    {specificationEntries.map(([k, v], i) => (
                      <li
                        key={k}
                        className="flex items-start justify-between gap-2 rounded border bg-muted/20 p-3 cursor-move"
                        draggable
                        onDragStart={() => handleSpecDragStart(i)}
                        onDragEnter={() => handleSpecDragEnter(i)}
                        onDragOver={(e) => e.preventDefault()}
                        onDragEnd={handleSpecDragEnd}
                        onDrop={handleSpecDragEnd}
                        aria-label={`重新排序規格 ${k}`}
                      >
                        <div className="flex flex-1 items-start gap-2">
                          <GripVertical
                            className="mt-1 h-4 w-4 text-muted-foreground"
                            aria-hidden
                          />
                          <div>
                            <div className="text-sm font-medium">{k}</div>
                            <div className="text-sm text-muted-foreground">{v}</div>
                          </div>
                        </div>
                        <Button variant="ghost" size="sm" onClick={() => handleRemoveSpec(k)}>
                          移除
                        </Button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>

            <Separator />

            {/* SEO & Sorting */}
            <div className="space-y-4">
              <h4 className="font-medium">SEO 與排序</h4>
              <div className="grid grid-cols-3 gap-4 items-start">
                <div className="flex flex-col gap-2">
                  <Label>排序順序</Label>
                  <Input
                    type="number"
                    inputMode="numeric"
                    value={(formData.sortOrder ?? 0).toString()}
                    onChange={(e) =>
                      setFormData((prev) => ({ ...prev, sortOrder: Number(e.target.value) || 0 }))
                    }
                  />
                </div>
                <div className="col-span-3 flex flex-col gap-2">
                  <Label>SEO 標題</Label>
                  <Input
                    value={formData.seoTitle || ''}
                    onChange={(e) => setFormData((prev) => ({ ...prev, seoTitle: e.target.value }))}
                  />
                </div>
                <div className="col-span-3 flex flex-col gap-2">
                  <Label>SEO 描述</Label>
                  <Textarea
                    rows={3}
                    value={formData.seoDescription || ''}
                    onChange={(e) =>
                      setFormData((prev) => ({ ...prev, seoDescription: e.target.value }))
                    }
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="flex justify-end space-x-2">
            <Button
              variant="outline"
              onClick={() => {
                setIsCreateDialogOpen(false);
                setIsEditDialogOpen(false);
              }}
            >
              取消
            </Button>
            <Button disabled={isSubmitDisabled} onClick={() => handleSubmit(isEditDialogOpen)}>
              {isSubmitting ? (
                <span className="inline-flex items-center gap-2">
                  <span className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
                  處理中...
                </span>
              ) : isEditDialogOpen ? (
                '更新'
              ) : (
                '建立'
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export function normalizeFormData(
  fd: Partial<ProductFormData>,
  specOrder: string[] = []
): ProductFormData {
  const variants = Array.isArray(fd.variants)
    ? fd.variants.map((variant) => ({
        name: (variant?.name ?? '').toString().trim(),
        price:
          typeof variant?.price === 'number'
            ? variant.price
            : Number((variant?.price as unknown as string) ?? 0) || 0,
        sku: variant?.sku ? variant.sku.toString().trim() : undefined,
        size: variant?.size ? variant.size.toString().trim() : undefined,
        firmness: variant?.firmness ? variant.firmness.toString().trim() : undefined,
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
    images,
    variants,
    features,
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
    errors['variants'] = '至少需要一個產品變體';
  } else {
    data.variants.forEach((variant, index) => {
      if (!variant.name || variant.name.trim().length === 0) {
        errors[`variants.${index}.name`] = '變體名稱為必填';
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

export function compareCategories(a: ProductCategoryRecord, b: ProductCategoryRecord) {
  const orderDiff = (a.sortOrder ?? 0) - (b.sortOrder ?? 0);
  if (orderDiff !== 0) {
    return orderDiff;
  }
  return (a.title || a.slug).localeCompare(b.title || b.slug, 'zh-TW');
}

export function normalizeCategoryInsert(
  existing: ProductCategoryRecord[],
  category: ProductCategoryRecord
) {
  const next = existing.filter((item) => item.slug !== category.slug);
  next.push(category);
  return next.sort(compareCategories);
}

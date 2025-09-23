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
  DialogTrigger,
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

// Product types based on database schema
export interface Product {
  id: string;
  name: string;
  slug: string;
  description: string;
  category: 'simmons-black' | 'accessories' | 'us-imports';
  images: string[];
  variants: Array<{
    id: string;
    name: string;
    price: number;
    sku?: string;
    size?: string;
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
  category: z.enum(['simmons-black', 'accessories', 'us-imports'], {
    errorMap: () => ({ message: '請選擇產品分類' }),
  }),
  images: z.array(z.string().url()).min(1, '至少需要一張產品圖片'),
  variants: z
    .array(
      z.object({
        name: z.string().min(1),
        price: z.number().min(0),
        sku: z.string().optional(),
        size: z.string().optional(),
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

const categoryLabels = {
  'simmons-black': '席夢思黑牌',
  accessories: '配件',
  'us-imports': '美國進口',
};

export default function ProductManagement({ initialProducts }: { initialProducts?: Product[] }) {
  const API_BASE = import.meta.env.PUBLIC_API_URL as string;
  const cdnBase = (import.meta.env.PUBLIC_IMAGE_CDN_URL as string | undefined)?.trim();
  const [products, setProducts] = useState<Product[]>([]);
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
  const [specOrder, setSpecOrder] = useState<string[]>([]);

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
  const isSubmitDisabled = isSubmitting || !hasAtLeastOneImage || !hasAtLeastOneVariant;
  const specificationEntries = useMemo(() => {
    const specs = formData.specifications || {};
    if (specOrder.length > 0) {
      return specOrder
        .filter(key => key in specs)
        .map(key => [key, specs[key] as string] as [string, string]);
    }
    return Object.entries(specs) as Array<[string, string]>;
  }, [formData.specifications, specOrder]);

  const columnHelper = createColumnHelper<Product>();

  const columns = [
    columnHelper.accessor('name', {
      header: '產品名稱',
      cell: info => (
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
      cell: info => <Badge variant="outline">{categoryLabels[info.getValue()]}</Badge>,
      filterFn: 'equals',
    }),
    columnHelper.accessor('variants', {
      header: '價格範圍',
      cell: info => {
        const variants = info.getValue();
        if (variants.length === 0) return '未設定';
        const prices = variants.map(v => v.price);
        const min = Math.min(...prices);
        const max = Math.max(...prices);
        return min === max
          ? `NT$${min.toLocaleString()}`
          : `NT$${min.toLocaleString()} - NT$${max.toLocaleString()}`;
      },
    }),
    columnHelper.accessor('inStock', {
      header: '庫存狀態',
      cell: info => (
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
      cell: info => new Date(info.getValue()).toLocaleDateString('zh-TW'),
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
              <Button variant="ghost" size="sm">
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
                <AlertDialogAction onClick={() => handleDelete(row.original.id)}>
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

  // Initialize with server data if provided; otherwise fetch
  useEffect(() => {
    if (initialProducts && initialProducts.length >= 0) {
      const sanitized = initialProducts.map(product =>
        sanitizeProduct(product, cdnBase, fallbackAssetBase)
      );
      setProducts(sanitized);
      setLoading(false);
    } else {
      loadProducts();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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
    setSelectedProduct(null);
    setFormData({
      category: 'simmons-black',
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
      const response = await fetch(`${API_BASE}/api/admin/products/${id}`, {
        method: 'DELETE',
        credentials: 'include',
      });
      if (response.ok) {
        setProducts(prev => prev.filter(p => p.id !== id));
        toast.success('產品刪除成功');
      } else {
        const err = await safeParseJSON(response);
        throw new Error(err?.error || err?.message || 'Failed to delete product');
      }
    } catch (error) {
      console.error('Delete failed:', error);
      toast.error(error instanceof Error ? error.message : '刪除產品失敗');
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
          setFormErrors(prev => ({ ...prev, ...validationResult.errors }));
        }
        toast.error('請確認表單欄位填寫正確');
        return;
      }

      const validatedData = validationResult.data;

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
          setProducts(prev => prev.map(p => (p.id === selectedProduct?.id ? savedProduct : p)));
          setIsEditDialogOpen(false);
        } else {
          setProducts(prev => [...prev, savedProduct]);
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
    setFormData(prev => ({
      ...prev,
      variants: [...(prev.variants || []), { name: '', price: 0, sku: '', size: '' }],
    }));
    setFormErrors(prev => {
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
    setFormData(prev => {
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
    setFormData(prev => ({
      ...prev,
      variants: nextVariants,
    }));
    setFormErrors(prev => {
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
    setFormData(prev => ({ ...prev, features: [...(prev.features || []), val] }));
    setFeatureInput('');
  };
  const handleRemoveFeature = (i: number) => {
    setFormData(prev => ({
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
    setFormData(prev => ({
      ...prev,
      specifications: { ...(prev.specifications || {}), [k]: v },
    }));
    setSpecOrder(prev => (prev.includes(k) ? prev : [...prev, k]));
    setSpecKey('');
    setSpecVal('');
  };
  const handleRemoveSpec = (k: string) => {
    setFormData(prev => {
      const next = { ...(prev.specifications || {}) } as Record<string, string>;
      delete next[k];
      return { ...prev, specifications: next };
    });
    setSpecOrder(prev => prev.filter(key => key !== k));
  };

  const handleProductImagesChange = (images: string[]) => {
    setFormData(prev => ({ ...prev, images }));
    setFormErrors(prev => {
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
    setFormData(prev => {
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
    setSpecOrder(prev => {
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
                  onChange={e => setGlobalFilter(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Select
              value={(table.getColumn('category')?.getFilterValue() as string) ?? ''}
              onValueChange={value =>
                table.getColumn('category')?.setFilterValue(value === 'all' ? '' : value)
              }
            >
              <SelectTrigger className="w-48">
                <SelectValue placeholder="篩選分類" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">全部分類</SelectItem>
                <SelectItem value="simmons-black">席夢思黑牌</SelectItem>
                <SelectItem value="accessories">配件</SelectItem>
                <SelectItem value="us-imports">美國進口</SelectItem>
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
                {table.getHeaderGroups().map(headerGroup => (
                  <tr key={headerGroup.id} className="border-b bg-gray-50/50">
                    {headerGroup.headers.map(header => (
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
                {table.getRowModel().rows.map(row => (
                  <tr key={row.id} className="border-b hover:bg-gray-50/50">
                    {row.getVisibleCells().map(cell => (
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
        onOpenChange={open => {
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
                    onChange={e => setFormData(prev => ({ ...prev, name: e.target.value }))}
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
                    onChange={e => setFormData(prev => ({ ...prev, slug: e.target.value }))}
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
                  onChange={e => setFormData(prev => ({ ...prev, description: e.target.value }))}
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
                  onValueChange={value =>
                    setFormData(prev => ({ ...prev, category: value as any }))
                  }
                >
                  <SelectTrigger className={formErrors.category ? 'border-red-500' : ''}>
                    <SelectValue placeholder="選擇分類" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="simmons-black">席夢思黑牌</SelectItem>
                    <SelectItem value="accessories">配件</SelectItem>
                    <SelectItem value="us-imports">美國進口</SelectItem>
                  </SelectContent>
                </Select>
                {formErrors.category && (
                  <p className="text-sm text-red-500 mt-1">{formErrors.category}</p>
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
                    onCheckedChange={checked =>
                      setFormData(prev => ({ ...prev, inStock: checked }))
                    }
                  />
                  <Label>有庫存</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Switch
                    checked={formData.featured ?? false}
                    onCheckedChange={checked =>
                      setFormData(prev => ({ ...prev, featured: checked }))
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
                        onChange={e => handleUpdateVariant(i, 'name', e.target.value)}
                      />
                    </div>
                    <div className="col-span-3 flex flex-col gap-2">
                      <Label>價格</Label>
                      <Input
                        type="number"
                        inputMode="decimal"
                        value={v?.price?.toString() ?? '0'}
                        onChange={e => handleUpdateVariant(i, 'price', e.target.value)}
                      />
                    </div>
                    <div className="col-span-3 flex flex-col gap-2">
                      <Label>SKU</Label>
                      <Input
                        value={v?.sku || ''}
                        onChange={e => handleUpdateVariant(i, 'sku', e.target.value)}
                      />
                    </div>
                    <div className="col-span-2 flex flex-col gap-2">
                      <Label>尺寸</Label>
                      <Input
                        value={v?.size || ''}
                        onChange={e => handleUpdateVariant(i, 'size', e.target.value)}
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
                  onChange={e => setFeatureInput(e.target.value)}
                  onKeyDown={e => {
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
                      onDragOver={e => e.preventDefault()}
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
                  <Input value={specKey} onChange={e => setSpecKey(e.target.value)} />
                </div>
                <div className="col-span-6 flex flex-col gap-2">
                  <Label>規格數據</Label>
                  <Input value={specVal} onChange={e => setSpecVal(e.target.value)} />
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
                        onDragOver={e => e.preventDefault()}
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
                    onChange={e =>
                      setFormData(prev => ({ ...prev, sortOrder: Number(e.target.value) || 0 }))
                    }
                  />
                </div>
                <div className="col-span-3 flex flex-col gap-2">
                  <Label>SEO 標題</Label>
                  <Input
                    value={formData.seoTitle || ''}
                    onChange={e => setFormData(prev => ({ ...prev, seoTitle: e.target.value }))}
                  />
                </div>
                <div className="col-span-3 flex flex-col gap-2">
                  <Label>SEO 描述</Label>
                  <Textarea
                    rows={3}
                    value={formData.seoDescription || ''}
                    onChange={e =>
                      setFormData(prev => ({ ...prev, seoDescription: e.target.value }))
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
    ? fd.variants.map(variant => ({
        name: (variant?.name ?? '').toString().trim(),
        price:
          typeof variant?.price === 'number'
            ? variant.price
            : Number((variant?.price as unknown as string) ?? 0) || 0,
        sku: variant?.sku ? variant.sku.toString().trim() : undefined,
        size: variant?.size ? variant.size.toString().trim() : undefined,
      }))
    : [];

  const images = Array.isArray(fd.images)
    ? fd.images.map(img => (typeof img === 'string' ? img.trim() : '')).filter(Boolean)
    : [];

  const features = Array.isArray(fd.features)
    ? fd.features
        .map(feature => (typeof feature === 'string' ? feature.trim() : ''))
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
    ? specOrder.filter(orderKey => specificationEntries.some(([key]) => key === orderKey))
    : specificationEntries.map(([key]) => key);

  const specifications: Record<string, string> = {};
  orderedKeys.forEach(key => {
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
    category: (fd.category as ProductFormData['category']) ?? 'simmons-black',
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
  issues.forEach(issue => {
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

  if (!['simmons-black', 'accessories', 'us-imports'].includes(data.category)) {
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
    ? safeProduct.images.filter(Boolean).map(image => {
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

import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router';
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
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from '@blackliving/ui';
// Tree-shakable Lucide imports
import Plus from '@lucide/react/plus';
import Search from '@lucide/react/search';
import Edit from '@lucide/react/edit';
import Trash2 from '@lucide/react/trash-2';
import Filter from '@lucide/react/filter';
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
import { safeParseJSON } from '../lib/http';
import { useEnvironment } from '../contexts/EnvironmentContext';
import { resolveAssetUrl, extractAssetKey } from '../lib/assets';
import type { ProductCategory as ProductCategoryDTO } from '@blackliving/types';
import BatchOperationsToolbar from './BatchOperationsToolbar';
import ProductEditPage from './ProductEditPage';

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
  specifications: z.record(z.string(), z.string()).default({}),
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
  const navigate = useNavigate();
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<ProductCategoryRecord[]>([]);
  const [categoriesLoading, setCategoriesLoading] = useState(true);
  const [loading, setLoading] = useState(true);
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [globalFilter, setGlobalFilter] = useState('');
  const [selectedProducts, setSelectedProducts] = useState<Set<string>>(new Set());
  const [categoryDialogOpen, setCategoryDialogOpen] = useState(false);
  const [categoryDialogMode, setCategoryDialogMode] = useState<'create' | 'edit'>('create');
  const [categoryEditingSlug, setCategoryEditingSlug] = useState<string | null>(null);
  const [categoryForm, setCategoryForm] = useState<ProductCategoryFormState>(initialCategoryForm);
  const [categoryFormErrors, setCategoryFormErrors] = useState<Record<string, string>>({});
  const [isCategorySubmitting, setIsCategorySubmitting] = useState(false);
  const [deletingCategorySlug, setDeletingCategorySlug] = useState<string | null>(null);

  // Form state removed - now using dedicated pages
  const [formData, setFormData] = useState<Partial<ProductFormData>>({});
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [specOrder, setSpecOrder] = useState<string[]>([]);

  const fallbackAssetBase = useMemo(
    () => (typeof window !== 'undefined' ? window.location.origin : undefined),
    []
  );

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
    columnHelper.display({
      id: 'select',
      header: ({ table }) => (
        <input
          type="checkbox"
          checked={table.getIsAllRowsSelected()}
          onChange={table.getToggleAllRowsSelectedHandler()}
          className="rounded border-gray-300"
        />
      ),
      cell: ({ row }) => (
        <input
          type="checkbox"
          checked={row.getIsSelected()}
          onChange={row.getToggleSelectedHandler()}
          className="rounded border-gray-300"
        />
      ),
    }),
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
      rowSelection: Object.fromEntries(
        Array.from(selectedProducts).map(id => [products.findIndex(p => p.id === id), true])
      ),
    },
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onGlobalFilterChange: setGlobalFilter,
    onRowSelectionChange: (updater) => {
      const newSelection = typeof updater === 'function' ? updater(table.getState().rowSelection) : updater;
      const selectedIds = new Set(
        Object.keys(newSelection).filter(key => newSelection[key]).map(key => products[parseInt(key)].id)
      );
      setSelectedProducts(selectedIds);
    },
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
    // Navigate to new product page instead of opening dialog
    navigate('/dashboard/products/new');
  };

  const handleEdit = (product: Product) => {
    // Navigate to edit product page instead of opening dialog
    navigate(`/dashboard/products/${product.id}/edit`);
  };

  const handleDelete = async (id: string) => {
    try {
      const response = await fetch(`${API_BASE}/api/admin/products/${id}`, {
        method: 'DELETE',
        credentials: 'include',
      });
      if (response.ok) {
        setProducts((prev) => prev.filter((p) => p.id !== id));
        toast.success('產品刪除成功');
      } else {
        const err = await safeParseJSON(response);
        throw new Error((err as any)?.error || (err as any)?.message || 'Failed to delete product');
      }
    } catch (error) {
      console.error('Delete failed:', error);
      toast.error(error instanceof Error ? error.message : '刪除產品失敗');
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
          throw new Error((err as any)?.error || (err as any)?.message || 'Failed to update category');
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
          throw new Error((err as any)?.error || (err as any)?.message || 'Failed to create category');
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
        throw new Error((err as any)?.error || (err as any)?.message || 'Failed to delete category');
      }
    } catch (error) {
      console.error('Delete category failed:', error);
      toast.error(error instanceof Error ? error.message : '刪除分類失敗');
    } finally {
      setDeletingCategorySlug(null);
    }
  };

  // Form submission removed - now using dedicated pages

  // Form handlers removed - now using dedicated pages

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

      <Tabs defaultValue="products" className="w-full">
        <TabsList>
          <TabsTrigger value="products">產品列表</TabsTrigger>
          <TabsTrigger value="categories">分類管理</TabsTrigger>
        </TabsList>

        <TabsContent value="products" className="space-y-6 mt-6">
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
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
              <div className="space-y-1">
                <CardTitle>產品列表</CardTitle>
                <CardDescription>共 {table.getFilteredRowModel().rows.length} 個產品</CardDescription>
              </div>
              <BatchOperationsToolbar
                selectedProducts={Array.from(selectedProducts).map(id => products.find(p => p.id === id)!).filter(Boolean)}
                onSelectionChange={(newSelection) => {
                  setSelectedProducts(new Set(newSelection.map((p: any) => p.id)));
                }}
                onProductsUpdate={() => {
                  // Refresh products list
                  loadProducts();
                }}
                totalProducts={products.length}
                variant="compact"
                categories={categories}
              />
            </CardHeader>
            <CardContent>
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    {table.getHeaderGroups().map((headerGroup) => (
                      <TableRow key={headerGroup.id} className="bg-gray-50/50">
                        {headerGroup.headers.map((header) => (
                          <TableHead key={header.id} className="font-medium text-gray-900">
                            {header.isPlaceholder
                              ? null
                              : flexRender(header.column.columnDef.header, header.getContext())}
                          </TableHead>
                        ))}
                      </TableRow>
                    ))}
                  </TableHeader>
                  <TableBody>
                    {table.getRowModel().rows.length > 0 ? (
                      table.getRowModel().rows.map((row) => (
                        <TableRow key={row.id} className="hover:bg-gray-50/50">
                          {row.getVisibleCells().map((cell) => (
                            <TableCell key={cell.id}>
                              {flexRender(cell.column.columnDef.cell, cell.getContext())}
                            </TableCell>
                          ))}
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell colSpan={columns.length} className="h-24 text-center">
                          沒有找到產品
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
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
        </TabsContent>

        <TabsContent value="categories" className="mt-6">
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
        </TabsContent>
      </Tabs>

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

import { useState, useEffect } from 'react';
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
import Upload from '@lucide/react/upload';
import Eye from '@lucide/react/eye';
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
import { z } from 'zod';
import { toast } from 'sonner';

// Product types based on database schema
interface Product {
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
const productSchema = z.object({
  name: z.string().min(1, '產品名稱為必填'),
  slug: z
    .string()
    .min(1, 'URL slug 為必填')
    .regex(/^[a-z0-9-]+$/, '只能包含小寫字母、數字和連字符'),
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

export default function ProductManagement() {
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

  // Load products on component mount
  useEffect(() => {
    loadProducts();
  }, []);

  const loadProducts = async () => {
    try {
      setLoading(true);
      const response = await fetch('http://localhost:8787/api/products');
      if (response.ok) {
        const result = await response.json();
        setProducts(result.success ? result.data.products : []);
      }
    } catch (error) {
      console.error('Failed to load products:', error);
      toast.error('載入產品失敗');
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = () => {
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
    setIsCreateDialogOpen(true);
  };

  const handleEdit = (product: Product) => {
    setSelectedProduct(product);
    setFormData(product);
    setFormErrors({});
    setIsEditDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    try {
      const response = await fetch(`http://localhost:8787/api/products/${id}`, {
        method: 'DELETE',
        credentials: 'include',
      });
      if (response.ok) {
        setProducts(prev => prev.filter(p => p.id !== id));
        toast.success('產品刪除成功');
      } else {
        throw new Error('Failed to delete product');
      }
    } catch (error) {
      console.error('Delete failed:', error);
      toast.error('刪除產品失敗');
    }
  };

  const handleSubmit = async (isEdit: boolean) => {
    try {
      const validatedData = productSchema.parse(formData);

      const url = isEdit
        ? `http://localhost:8787/api/products/${selectedProduct?.id}`
        : 'http://localhost:8787/api/products';
      const method = isEdit ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(validatedData),
      });

      if (response.ok) {
        const result = await response.json();
        const savedProduct = result.data;

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
      } else {
        throw new Error('Failed to save product');
      }
    } catch (error) {
      if (error instanceof z.ZodError) {
        const errors: Record<string, string> = {};
        error.errors.forEach(err => {
          const path = err.path.join('.');
          errors[path] = err.message;
        });
        setFormErrors(errors);
      } else {
        console.error('Save failed:', error);
        toast.error('儲存產品失敗');
      }
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
          <p className="mt-2 text-gray-600">載入中...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">產品管理</h1>
          <p className="text-gray-600 mt-2">管理席夢思床墊與相關產品</p>
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
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
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
                <div>
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
                <div>
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

              <div>
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

              <div>
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

            {/* Image Upload Placeholder */}
            <div className="space-y-4">
              <h4 className="font-medium">產品圖片</h4>
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
                <Upload className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600 mb-2">圖片上傳功能開發中</p>
                <p className="text-sm text-gray-500">將整合 Cloudflare R2 儲存</p>
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
            <Button onClick={() => handleSubmit(isEditDialogOpen)}>
              {isEditDialogOpen ? '更新' : '建立'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

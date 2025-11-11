import { useState, useMemo } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Button,
  Badge,
  Separator,
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
  Checkbox,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Input,
  Label,
} from '@blackliving/ui';
// Tree-shakable Lucide imports
import CheckSquare from '@lucide/react/check-square';
import Square from '@lucide/react/square';
import Archive from '@lucide/react/archive';
import ArchiveRestore from '@lucide/react/archive-restore';
import Trash2 from '@lucide/react/trash-2';
import Edit from '@lucide/react/edit';
import Download from '@lucide/react/download';
import Upload from '@lucide/react/upload';
import Settings from '@lucide/react/settings';
import AlertTriangle from '@lucide/react/alert-triangle';
import { toast } from 'sonner';
import { useEnvironment } from '../contexts/EnvironmentContext';

interface Product {
  id: string;
  name: string;
  slug: string;
  category: string;
  inStock: boolean;
  featured: boolean;
  sortOrder: number;
  updatedAt: Date;
}

interface BatchOperationsToolbarProps {
  selectedProducts: Product[];
  onSelectionChange: (products: Product[]) => void;
  onProductsUpdate: () => void;
  totalProducts: number;
  className?: string;
}

export default function BatchOperationsToolbar({
  selectedProducts,
  onSelectionChange,
  onProductsUpdate,
  totalProducts,
  className,
}: BatchOperationsToolbarProps) {
  const { PUBLIC_API_URL } = useEnvironment();
  const API_BASE = PUBLIC_API_URL;

  const [isProcessing, setIsProcessing] = useState(false);
  const [bulkEditDialogOpen, setBulkEditDialogOpen] = useState(false);
  const [bulkEditValues, setBulkEditValues] = useState({
    category: '',
    inStock: null as boolean | null,
    featured: null as boolean | null,
    sortOrder: '',
  });

  const selectedCount = selectedProducts.length;
  const hasSelection = selectedCount > 0;

  // Bulk operations
  const handleBulkArchive = async (archive: boolean) => {
    if (!hasSelection) return;

    try {
      setIsProcessing(true);
      const response = await fetch(`${API_BASE}/api/admin/products/batch/archive`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          productIds: selectedProducts.map(p => p.id),
          archive,
        }),
      });

      if (response.ok) {
        toast.success(`成功${archive ? '封存' : '取消封存'} ${selectedCount} 個產品`);
        onSelectionChange([]);
        onProductsUpdate();
      } else {
        const err = await response.json();
        throw new Error(err?.error || err?.message || '批量操作失敗');
      }
    } catch (error) {
      console.error('Bulk archive failed:', error);
      toast.error(error instanceof Error ? error.message : '批量操作失敗');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleBulkDelete = async () => {
    if (!hasSelection) return;

    try {
      setIsProcessing(true);
      const response = await fetch(`${API_BASE}/api/admin/products/batch/delete`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          productIds: selectedProducts.map(p => p.id),
        }),
      });

      if (response.ok) {
        toast.success(`成功刪除 ${selectedCount} 個產品`);
        onSelectionChange([]);
        onProductsUpdate();
      } else {
        const err = await response.json();
        throw new Error(err?.error || err?.message || '批量刪除失敗');
      }
    } catch (error) {
      console.error('Bulk delete failed:', error);
      toast.error(error instanceof Error ? error.message : '批量刪除失敗');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleBulkEdit = async () => {
    if (!hasSelection) return;

    try {
      setIsProcessing(true);
      const updates: Record<string, any> = {};

      if (bulkEditValues.category) updates.category = bulkEditValues.category;
      if (bulkEditValues.inStock !== null) updates.inStock = bulkEditValues.inStock;
      if (bulkEditValues.featured !== null) updates.featured = bulkEditValues.featured;
      if (bulkEditValues.sortOrder) updates.sortOrder = Number(bulkEditValues.sortOrder);

      if (Object.keys(updates).length === 0) {
        toast.error('請至少選擇一個要更新的欄位');
        return;
      }

      const response = await fetch(`${API_BASE}/api/admin/products/batch/update`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          productIds: selectedProducts.map(p => p.id),
          updates,
        }),
      });

      if (response.ok) {
        toast.success(`成功更新 ${selectedCount} 個產品`);
        setBulkEditDialogOpen(false);
        setBulkEditValues({
          category: '',
          inStock: null,
          featured: null,
          sortOrder: '',
        });
        onSelectionChange([]);
        onProductsUpdate();
      } else {
        const err = await response.json();
        throw new Error(err?.error || err?.message || '批量更新失敗');
      }
    } catch (error) {
      console.error('Bulk edit failed:', error);
      toast.error(error instanceof Error ? error.message : '批量更新失敗');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleExportCSV = async () => {
    try {
      setIsProcessing(true);
      const productIds = hasSelection ? selectedProducts.map(p => p.id) : null;

      const response = await fetch(`${API_BASE}/api/admin/products/export/csv`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ productIds }),
      });

      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `products-export-${new Date().toISOString().split('T')[0]}.csv`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);

        toast.success('CSV 匯出成功');
      } else {
        const err = await response.json();
        throw new Error(err?.error || err?.message || 'CSV 匯出失敗');
      }
    } catch (error) {
      console.error('CSV export failed:', error);
      toast.error(error instanceof Error ? error.message : 'CSV 匯出失敗');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleImportCSV = async (file: File) => {
    try {
      setIsProcessing(true);
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch(`${API_BASE}/api/admin/products/import/csv`, {
        method: 'POST',
        credentials: 'include',
        body: formData,
      });

      if (response.ok) {
        const result = await response.json();
        toast.success(`成功匯入 ${result.imported} 個產品`);
        onProductsUpdate();
      } else {
        const err = await response.json();
        throw new Error(err?.error || err?.message || 'CSV 匯入失敗');
      }
    } catch (error) {
      console.error('CSV import failed:', error);
      toast.error(error instanceof Error ? error.message : 'CSV 匯入失敗');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (file.type !== 'text/csv' && !file.name.endsWith('.csv')) {
        toast.error('請選擇 CSV 檔案');
        return;
      }
      handleImportCSV(file);
    }
    // Reset input
    event.target.value = '';
  };

  if (!hasSelection && totalProducts === 0) {
    return null;
  }

  return (
    <Card className={className}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <CheckSquare className="h-5 w-5" />
              批量操作
            </CardTitle>
            <CardDescription>
              {hasSelection
                ? `已選取 ${selectedCount} 個產品`
                : `總共 ${totalProducts} 個產品`
              }
            </CardDescription>
          </div>

          {hasSelection && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onSelectionChange([])}
              disabled={isProcessing}
            >
              取消選取
            </Button>
          )}
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Selection Summary */}
        {hasSelection && (
          <div className="flex flex-wrap gap-2 p-3 bg-blue-50 rounded-lg">
            <div className="flex items-center gap-2 text-sm text-blue-700">
              <CheckSquare className="h-4 w-4" />
              <span className="font-medium">已選取產品：</span>
            </div>
            {selectedProducts.slice(0, 3).map((product) => (
              <Badge key={product.id} variant="secondary" className="bg-blue-100 text-blue-800">
                {product.name}
              </Badge>
            ))}
            {selectedCount > 3 && (
              <Badge variant="secondary" className="bg-blue-100 text-blue-800">
                +{selectedCount - 3} 個
              </Badge>
            )}
          </div>
        )}

        <Separator />

        {/* Action Buttons */}
        <div className="flex flex-wrap gap-2">
          {/* Bulk Edit */}
          <AlertDialog open={bulkEditDialogOpen} onOpenChange={setBulkEditDialogOpen}>
            <AlertDialogTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                disabled={!hasSelection || isProcessing}
              >
                <Edit className="h-4 w-4 mr-2" />
                批量編輯
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent className="max-w-md">
              <AlertDialogHeader>
                <AlertDialogTitle>批量編輯產品</AlertDialogTitle>
                <AlertDialogDescription>
                  選擇要更新的欄位，所有選取的產品都會被更新。
                </AlertDialogDescription>
              </AlertDialogHeader>

              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label>分類</Label>
                  <Input
                    placeholder="輸入分類 slug"
                    value={bulkEditValues.category}
                    onChange={(e) => setBulkEditValues(prev => ({ ...prev, category: e.target.value }))}
                  />
                </div>

                <div className="space-y-2">
                  <Label>庫存狀態</Label>
                  <Select
                    value={bulkEditValues.inStock === null ? '' : bulkEditValues.inStock.toString()}
                    onValueChange={(value) => setBulkEditValues(prev => ({
                      ...prev,
                      inStock: value === '' ? null : value === 'true'
                    }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="不變更" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="unchanged">不變更</SelectItem>
                      <SelectItem value="true">有庫存</SelectItem>
                      <SelectItem value="false">缺貨</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>精選產品</Label>
                  <Select
                    value={bulkEditValues.featured === null ? '' : bulkEditValues.featured.toString()}
                    onValueChange={(value) => setBulkEditValues(prev => ({
                      ...prev,
                      featured: value === '' ? null : value === 'true'
                    }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="不變更" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="unchanged">不變更</SelectItem>
                      <SelectItem value="true">是</SelectItem>
                      <SelectItem value="false">否</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>排序順序</Label>
                  <Input
                    type="number"
                    placeholder="輸入數字"
                    value={bulkEditValues.sortOrder}
                    onChange={(e) => setBulkEditValues(prev => ({ ...prev, sortOrder: e.target.value }))}
                  />
                </div>
              </div>

              <AlertDialogFooter>
                <AlertDialogCancel>取消</AlertDialogCancel>
                <AlertDialogAction onClick={handleBulkEdit} disabled={isProcessing}>
                  {isProcessing ? '處理中...' : '更新'}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>

          {/* Archive/Unarchive */}
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleBulkArchive(true)}
            disabled={!hasSelection || isProcessing}
          >
            <Archive className="h-4 w-4 mr-2" />
            封存
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={() => handleBulkArchive(false)}
            disabled={!hasSelection || isProcessing}
          >
            <ArchiveRestore className="h-4 w-4 mr-2" />
            取消封存
          </Button>

          {/* Delete */}
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button
                variant="destructive"
                size="sm"
                disabled={!hasSelection || isProcessing}
              >
                <Trash2 className="h-4 w-4 mr-2" />
                刪除
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle className="flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5 text-red-500" />
                  確認批量刪除
                </AlertDialogTitle>
                <AlertDialogDescription>
                  確定要刪除選取的 {selectedCount} 個產品嗎？此操作無法復原。
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>取消</AlertDialogCancel>
                <AlertDialogAction
                  onClick={handleBulkDelete}
                  disabled={isProcessing}
                  className="bg-red-600 hover:bg-red-700"
                >
                  {isProcessing ? '刪除中...' : '確認刪除'}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>

          <Separator orientation="vertical" className="h-8" />

          {/* Export */}
          <Button
            variant="outline"
            size="sm"
            onClick={handleExportCSV}
            disabled={isProcessing}
          >
            <Download className="h-4 w-4 mr-2" />
            {hasSelection ? '匯出選取' : '匯出全部'}
          </Button>

          {/* Import */}
          <div className="relative">
            <input
              type="file"
              accept=".csv"
              onChange={handleFileUpload}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              disabled={isProcessing}
            />
            <Button
              variant="outline"
              size="sm"
              disabled={isProcessing}
              className="pointer-events-none"
            >
              <Upload className="h-4 w-4 mr-2" />
              匯入 CSV
            </Button>
          </div>
        </div>

        {/* Warnings */}
        {hasSelection && (
          <div className="text-sm text-muted-foreground">
            💡 提示：批量操作會影響所有選取的產品，請謹慎使用。
          </div>
        )}
      </CardContent>
    </Card>
  );
}
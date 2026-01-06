import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
  Badge,
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Input,
  Label,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Separator,
} from "@blackliving/ui";
import AlertTriangle from "@lucide/react/alert-triangle";
// Tree-shakable Lucide imports
import CheckSquare from "@lucide/react/check-square";
import Download from "@lucide/react/download";
import Edit from "@lucide/react/edit";
import Trash2 from "@lucide/react/trash-2";
import Upload from "@lucide/react/upload";
import { useState } from "react";
import { toast } from "sonner";
import { useEnvironment } from "../contexts/EnvironmentContext";

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
  variant?: "card" | "compact";
  categories?: { slug: string; title: string }[];
}

export default function BatchOperationsToolbar({
  selectedProducts,
  onSelectionChange,
  onProductsUpdate,
  totalProducts,
  className,
  variant = "card",
  categories = [],
}: BatchOperationsToolbarProps) {
  const { PUBLIC_API_URL } = useEnvironment();
  const API_BASE = PUBLIC_API_URL;

  const [isProcessing, setIsProcessing] = useState(false);
  const [bulkEditDialogOpen, setBulkEditDialogOpen] = useState(false);
  const [bulkEditValues, setBulkEditValues] = useState({
    category: "",
    inStock: null as boolean | null,
    featured: null as boolean | null,
    sortOrder: "",
  });

  const selectedCount = selectedProducts.length;
  const hasSelection = selectedCount > 0;

  // Bulk operations

  const handleBulkDelete = async () => {
    if (!hasSelection) return;

    try {
      setIsProcessing(true);
      const response = await fetch(
        `${API_BASE}/api/admin/products/batch/delete`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({
            ids: selectedProducts.map((p) => p.id),
          }),
        }
      );

      if (response.ok) {
        toast.success(`成功刪除 ${selectedCount} 個產品`);
        onSelectionChange([]);
        onProductsUpdate();
      } else {
        const err = await response.json();
        throw new Error(err?.error || err?.message || "批量刪除失敗");
      }
    } catch (error) {
      console.error("Bulk delete failed:", error);
      toast.error(error instanceof Error ? error.message : "批量刪除失敗");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleBulkEdit = async () => {
    if (!hasSelection) return;

    try {
      setIsProcessing(true);
      const updates: Record<string, any> = {};

      if (bulkEditValues.category && bulkEditValues.category !== "unchanged")
        updates.category = bulkEditValues.category;
      if (bulkEditValues.inStock !== null)
        updates.inStock = bulkEditValues.inStock;
      if (bulkEditValues.featured !== null)
        updates.featured = bulkEditValues.featured;
      if (bulkEditValues.sortOrder)
        updates.sortOrder = Number(bulkEditValues.sortOrder);

      if (Object.keys(updates).length === 0) {
        toast.error("請至少選擇一個要更新的欄位");
        return;
      }

      const response = await fetch(
        `${API_BASE}/api/admin/products/batch/update`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({
            ids: selectedProducts.map((p) => p.id),
            data: updates,
          }),
        }
      );

      if (response.ok) {
        toast.success(`成功更新 ${selectedCount} 個產品`);
        setBulkEditDialogOpen(false);
        setBulkEditValues({
          category: "",
          inStock: null,
          featured: null,
          sortOrder: "",
        });
        onSelectionChange([]);
        onProductsUpdate();
      } else {
        const err = await response.json();
        throw new Error(err?.error || err?.message || "批量更新失敗");
      }
    } catch (error) {
      console.error("Bulk edit failed:", error);
      toast.error(error instanceof Error ? error.message : "批量更新失敗");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleExportCSV = async () => {
    try {
      setIsProcessing(true);
      const productIds = hasSelection
        ? selectedProducts.map((p) => p.id)
        : null;

      const response = await fetch(
        `${API_BASE}/api/admin/products/export/csv`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({ productIds }),
        }
      );

      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `products-export-${new Date().toISOString().split("T")[0]}.csv`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);

        toast.success("CSV 匯出成功");
      } else {
        const err = await response.json();
        throw new Error(err?.error || err?.message || "CSV 匯出失敗");
      }
    } catch (error) {
      console.error("CSV export failed:", error);
      toast.error(error instanceof Error ? error.message : "CSV 匯出失敗");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleImportCSV = async (file: File) => {
    try {
      setIsProcessing(true);
      const formData = new FormData();
      formData.append("file", file);

      const response = await fetch(
        `${API_BASE}/api/admin/products/import/csv`,
        {
          method: "POST",
          credentials: "include",
          body: formData,
        }
      );

      if (response.ok) {
        const result = await response.json();
        toast.success(`成功匯入 ${result.imported} 個產品`);
        onProductsUpdate();
      } else {
        const err = await response.json();
        throw new Error(err?.error || err?.message || "CSV 匯入失敗");
      }
    } catch (error) {
      console.error("CSV import failed:", error);
      toast.error(error instanceof Error ? error.message : "CSV 匯入失敗");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (file.type !== "text/csv" && !file.name.endsWith(".csv")) {
        toast.error("請選擇 CSV 檔案");
        return;
      }
      handleImportCSV(file);
    }
    // Reset input
    event.target.value = "";
  };

  if (!hasSelection && totalProducts === 0) {
    return null;
  }

  if (variant === "compact") {
    return (
      <div className={`flex items-center gap-2 ${className}`}>
        {hasSelection && (
          <>
            <div className="mr-2 flex items-center gap-2">
              <span className="whitespace-nowrap font-medium text-muted-foreground text-sm">
                已選取 {selectedCount} 項
              </span>
              <Button
                className="h-8 px-2 text-muted-foreground hover:text-foreground"
                disabled={isProcessing}
                onClick={() => onSelectionChange([])}
                size="sm"
                variant="ghost"
              >
                取消
              </Button>
            </div>
            <Separator className="h-6" orientation="vertical" />

            {/* Bulk Edit */}
            <AlertDialog
              onOpenChange={setBulkEditDialogOpen}
              open={bulkEditDialogOpen}
            >
              <AlertDialogTrigger asChild>
                <Button
                  className="h-8"
                  disabled={isProcessing}
                  size="sm"
                  variant="outline"
                >
                  <Edit className="mr-1.5 h-3.5 w-3.5" />
                  編輯
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
                    <Label>分類</Label>
                    <Select
                      onValueChange={(value) =>
                        setBulkEditValues((prev) => ({
                          ...prev,
                          category: value,
                        }))
                      }
                      value={bulkEditValues.category}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="選擇分類" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="unchanged">不變更</SelectItem>
                        {categories.map((category) => (
                          <SelectItem key={category.slug} value={category.slug}>
                            {category.title}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>庫存狀態</Label>
                    <Select
                      onValueChange={(value) =>
                        setBulkEditValues((prev) => ({
                          ...prev,
                          inStock: value === "" ? null : value === "true",
                        }))
                      }
                      value={
                        bulkEditValues.inStock === null
                          ? ""
                          : bulkEditValues.inStock.toString()
                      }
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
                      onValueChange={(value) =>
                        setBulkEditValues((prev) => ({
                          ...prev,
                          featured: value === "" ? null : value === "true",
                        }))
                      }
                      value={
                        bulkEditValues.featured === null
                          ? ""
                          : bulkEditValues.featured.toString()
                      }
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
                      onChange={(e) =>
                        setBulkEditValues((prev) => ({
                          ...prev,
                          sortOrder: e.target.value,
                        }))
                      }
                      placeholder="輸入數字"
                      type="number"
                      value={bulkEditValues.sortOrder}
                    />
                  </div>
                </div>

                <AlertDialogFooter>
                  <AlertDialogCancel>取消</AlertDialogCancel>
                  <AlertDialogAction
                    disabled={isProcessing}
                    onClick={handleBulkEdit}
                  >
                    {isProcessing ? "處理中..." : "更新"}
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>

            {/* Delete */}
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button
                  className="h-8"
                  disabled={isProcessing}
                  size="sm"
                  variant="destructive"
                >
                  <Trash2 className="mr-1.5 h-3.5 w-3.5" />
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
                    className="bg-red-600 hover:bg-red-700"
                    disabled={isProcessing}
                    onClick={handleBulkDelete}
                  >
                    {isProcessing ? "刪除中..." : "確認刪除"}
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>

            <Separator className="h-6" orientation="vertical" />
          </>
        )}

        {/* Export */}
        <Button
          className="h-8"
          disabled={isProcessing}
          onClick={handleExportCSV}
          size="sm"
          variant="outline"
        >
          <Download className="mr-1.5 h-3.5 w-3.5" />
          {hasSelection ? "匯出選取" : "匯出"}
        </Button>

        {/* Import */}
        <div className="relative">
          <input
            accept=".csv"
            className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
            disabled={isProcessing}
            onChange={handleFileUpload}
            type="file"
          />
          <Button
            className="pointer-events-none h-8"
            disabled={isProcessing}
            size="sm"
            variant="outline"
          >
            <Upload className="mr-1.5 h-3.5 w-3.5" />
            匯入
          </Button>
        </div>
      </div>
    );
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
                : `總共 ${totalProducts} 個產品`}
            </CardDescription>
          </div>

          {hasSelection && (
            <Button
              disabled={isProcessing}
              onClick={() => onSelectionChange([])}
              size="sm"
              variant="ghost"
            >
              取消選取
            </Button>
          )}
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Selection Summary */}
        {hasSelection && (
          <div className="flex flex-wrap gap-2 rounded-lg bg-blue-50 p-3">
            <div className="flex items-center gap-2 text-blue-700 text-sm">
              <CheckSquare className="h-4 w-4" />
              <span className="font-medium">已選取產品：</span>
            </div>
            {selectedProducts.slice(0, 3).map((product) => (
              <Badge
                className="bg-blue-100 text-blue-800"
                key={product.id}
                variant="secondary"
              >
                {product.name}
              </Badge>
            ))}
            {selectedCount > 3 && (
              <Badge className="bg-blue-100 text-blue-800" variant="secondary">
                +{selectedCount - 3} 個
              </Badge>
            )}
          </div>
        )}

        <Separator />

        {/* Action Buttons */}
        <div className="flex flex-wrap gap-2">
          {/* Bulk Edit */}
          <AlertDialog
            onOpenChange={setBulkEditDialogOpen}
            open={bulkEditDialogOpen}
          >
            <AlertDialogTrigger asChild>
              <Button
                disabled={!hasSelection || isProcessing}
                size="sm"
                variant="outline"
              >
                <Edit className="mr-2 h-4 w-4" />
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
                  <Label>分類</Label>
                  <Select
                    onValueChange={(value) =>
                      setBulkEditValues((prev) => ({
                        ...prev,
                        category: value,
                      }))
                    }
                    value={bulkEditValues.category}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="選擇分類" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="unchanged">不變更</SelectItem>
                      {categories.map((category) => (
                        <SelectItem key={category.slug} value={category.slug}>
                          {category.title}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>庫存狀態</Label>
                  <Select
                    onValueChange={(value) =>
                      setBulkEditValues((prev) => ({
                        ...prev,
                        inStock: value === "" ? null : value === "true",
                      }))
                    }
                    value={
                      bulkEditValues.inStock === null
                        ? ""
                        : bulkEditValues.inStock.toString()
                    }
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
                    onValueChange={(value) =>
                      setBulkEditValues((prev) => ({
                        ...prev,
                        featured: value === "" ? null : value === "true",
                      }))
                    }
                    value={
                      bulkEditValues.featured === null
                        ? ""
                        : bulkEditValues.featured.toString()
                    }
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
                    onChange={(e) =>
                      setBulkEditValues((prev) => ({
                        ...prev,
                        sortOrder: e.target.value,
                      }))
                    }
                    placeholder="輸入數字"
                    type="number"
                    value={bulkEditValues.sortOrder}
                  />
                </div>
              </div>

              <AlertDialogFooter>
                <AlertDialogCancel>取消</AlertDialogCancel>
                <AlertDialogAction
                  disabled={isProcessing}
                  onClick={handleBulkEdit}
                >
                  {isProcessing ? "處理中..." : "更新"}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>

          {/* Delete */}
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button
                disabled={!hasSelection || isProcessing}
                size="sm"
                variant="destructive"
              >
                <Trash2 className="mr-2 h-4 w-4" />
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
                  className="bg-red-600 hover:bg-red-700"
                  disabled={isProcessing}
                  onClick={handleBulkDelete}
                >
                  {isProcessing ? "刪除中..." : "確認刪除"}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>

          <Separator className="h-8" orientation="vertical" />

          {/* Export */}
          <Button
            disabled={isProcessing}
            onClick={handleExportCSV}
            size="sm"
            variant="outline"
          >
            <Download className="mr-2 h-4 w-4" />
            {hasSelection ? "匯出選取" : "匯出全部"}
          </Button>

          {/* Import */}
          <div className="relative">
            <input
              accept=".csv"
              className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
              disabled={isProcessing}
              onChange={handleFileUpload}
              type="file"
            />
            <Button
              className="pointer-events-none"
              disabled={isProcessing}
              size="sm"
              variant="outline"
            >
              <Upload className="mr-2 h-4 w-4" />
              匯入 CSV
            </Button>
          </div>
        </div>

        {/* Warnings */}
        {hasSelection && (
          <div className="text-muted-foreground text-sm">
            💡 提示：批量操作會影響所有選取的產品，請謹慎使用。
          </div>
        )}
      </CardContent>
    </Card>
  );
}

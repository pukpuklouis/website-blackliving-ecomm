import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Input,
  Label,
  Switch,
  Textarea,
} from "@blackliving/ui";
import type { ProductFormData } from "./useProductForm";

type ProductSidebarProps = {
  formData: Partial<ProductFormData>;
  setFormData: React.Dispatch<React.SetStateAction<Partial<ProductFormData>>>;
};

export function ProductSidebar({ formData, setFormData }: ProductSidebarProps) {
  return (
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
              <p className="text-muted-foreground text-sm">產品是否可購買</p>
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
              <p className="text-muted-foreground text-sm">在首頁展示</p>
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
              onChange={(e) =>
                setFormData((prev) => ({
                  ...prev,
                  sortOrder: Number(e.target.value) || 0,
                }))
              }
              type="number"
              value={(formData.sortOrder ?? 0).toString()}
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
              onChange={(e) =>
                setFormData((prev) => ({
                  ...prev,
                  seoTitle: e.target.value,
                }))
              }
              value={formData.seoTitle || ""}
            />
          </div>

          <div className="space-y-2">
            <Label>SEO 描述</Label>
            <Textarea
              onChange={(e) =>
                setFormData((prev) => ({
                  ...prev,
                  seoDescription: e.target.value,
                }))
              }
              rows={3}
              value={formData.seoDescription || ""}
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

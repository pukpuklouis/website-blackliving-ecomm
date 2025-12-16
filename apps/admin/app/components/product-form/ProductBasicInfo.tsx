import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Input,
  Label,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Textarea,
} from "@blackliving/ui";
import Package from "@lucide/react/package";
import type { ProductCategoryRecord, ProductFormData } from "./useProductForm";

interface ProductBasicInfoProps {
  formData: Partial<ProductFormData>;
  formErrors: Record<string, string>;
  sortedCategories: ProductCategoryRecord[];
  productTypeOptions: { value: string; label: string }[];
  selectedTemplate: string;
  setFormData: React.Dispatch<React.SetStateAction<Partial<ProductFormData>>>;
  handleTemplateChange: (value: string) => void;
}

export function ProductBasicInfo({
  formData,
  formErrors,
  sortedCategories,
  productTypeOptions,
  selectedTemplate,
  setFormData,
  handleTemplateChange,
}: ProductBasicInfoProps) {
  return (
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
              className={formErrors.name ? "border-red-500" : ""}
              id="name"
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, name: e.target.value }))
              }
              value={formData.name || ""}
            />
            {formErrors.name && (
              <p className="text-red-500 text-sm">{formErrors.name}</p>
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="slug">URL Slug *</Label>
            <Input
              className={formErrors.slug ? "border-red-500" : ""}
              id="slug"
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, slug: e.target.value }))
              }
              value={formData.slug || ""}
            />
            {formErrors.slug && (
              <p className="text-red-500 text-sm">{formErrors.slug}</p>
            )}
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="description">產品描述 *</Label>
          <Textarea
            className={formErrors.description ? "border-red-500" : ""}
            id="description"
            onChange={(e) =>
              setFormData((prev) => ({
                ...prev,
                description: e.target.value,
              }))
            }
            rows={4}
            value={formData.description || ""}
          />
          {formErrors.description && (
            <p className="text-red-500 text-sm">{formErrors.description}</p>
          )}
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="category">產品分類 *</Label>
            <Select
              onValueChange={(value) =>
                setFormData((prev) => ({
                  ...prev,
                  category: value,
                }))
              }
              value={formData.category || ""}
            >
              <SelectTrigger
                className={formErrors.category ? "border-red-500" : ""}
              >
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
              <p className="text-red-500 text-sm">{formErrors.category}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="productType">產品類型</Label>
            <Select
              onValueChange={handleTemplateChange}
              value={selectedTemplate}
            >
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
  );
}

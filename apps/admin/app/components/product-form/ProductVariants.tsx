import {
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
} from "@blackliving/ui";
import List from "@lucide/react/list";
import Plus from "@lucide/react/plus";
import Trash2 from "@lucide/react/trash-2";
import type { ProductTypeTemplate } from "../../lib/product-templates";
import type { ProductFormData } from "./useProductForm";

interface ProductVariantsProps {
  variants: ProductFormData["variants"];
  formErrors: Record<string, string>;
  selectedTemplateData: ProductTypeTemplate | null;
  onAddVariant: () => void;
  onRemoveVariant: (index: number) => void;
  onUpdateVariant: (
    index: number,
    field: keyof ProductFormData["variants"][number],
    value: string | number
  ) => void;
  hasAtLeastOneVariant: boolean;
}

export function ProductVariants({
  variants,
  formErrors,
  selectedTemplateData,
  onAddVariant,
  onRemoveVariant,
  onUpdateVariant,
  hasAtLeastOneVariant,
}: ProductVariantsProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <List className="h-5 w-5" />
          商品款式
        </CardTitle>
        <CardDescription>
          定義產品的不同選項組合
          {selectedTemplateData && (
            <span className="ml-2 text-blue-600 text-sm">
              ({selectedTemplateData.name} 模板)
            </span>
          )}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-4">
          {(variants || []).map((variant, index) => (
            <div
              className="space-y-4 rounded-lg border p-4"
              key={variant.id || index}
            >
              <div className="flex items-center justify-between">
                <h4 className="font-medium">款式 {index + 1}</h4>
                <Button
                  onClick={() => onRemoveVariant(index)}
                  size="sm"
                  variant="outline"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>

              <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
                <div className="space-y-2">
                  <Label>名稱</Label>
                  <Input
                    className={
                      formErrors[`variants.${index}.name`]
                        ? "border-red-500"
                        : ""
                    }
                    onChange={(e) =>
                      onUpdateVariant(index, "name", e.target.value)
                    }
                    value={variant.name || ""}
                  />
                  {formErrors[`variants.${index}.name`] && (
                    <p className="text-red-500 text-sm">
                      {formErrors[`variants.${index}.name`]}
                    </p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label>價格</Label>
                  <Input
                    className={
                      formErrors[`variants.${index}.price`]
                        ? "border-red-500"
                        : ""
                    }
                    onChange={(e) =>
                      onUpdateVariant(index, "price", e.target.value)
                    }
                    type="number"
                    value={variant.price || 0}
                  />
                  {formErrors[`variants.${index}.price`] && (
                    <p className="text-red-500 text-sm">
                      {formErrors[`variants.${index}.price`]}
                    </p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label>SKU</Label>
                  <Input
                    onChange={(e) =>
                      onUpdateVariant(index, "sku", e.target.value)
                    }
                    value={variant.sku || ""}
                  />
                </div>
                <div className="space-y-2">
                  <Label>尺寸</Label>
                  <Input
                    onChange={(e) =>
                      onUpdateVariant(index, "size", e.target.value)
                    }
                    value={variant.size || ""}
                  />
                </div>
              </div>

              {/* Additional fields based on template */}
              {selectedTemplateData && (
                <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
                  {selectedTemplateData.variantAxes.map((axis) => (
                    <div className="space-y-2" key={axis.id}>
                      <Label>
                        {axis.name}
                        {axis.required && (
                          <span className="ml-1 text-red-500">*</span>
                        )}
                      </Label>
                      <Select
                        onValueChange={(value) =>
                          onUpdateVariant(index, axis.type as any, value)
                        }
                        value={String(
                          variant[axis.type as keyof typeof variant] || ""
                        )}
                      >
                        <SelectTrigger
                          className={
                            formErrors[`variants.${index}.${axis.type}`]
                              ? "border-red-500"
                              : ""
                          }
                        >
                          <SelectValue placeholder={`選擇${axis.name}`} />
                        </SelectTrigger>
                        <SelectContent>
                          {axis.values.map((value) => (
                            <SelectItem key={value} value={value}>
                              {value}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      {formErrors[`variants.${index}.${axis.type}`] && (
                        <p className="text-red-500 text-sm">
                          {formErrors[`variants.${index}.${axis.type}`]}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>

        <Button onClick={onAddVariant} variant="outline">
          <Plus className="mr-2 h-4 w-4" />
          新增款式
        </Button>

        {!hasAtLeastOneVariant && (
          <p className="text-amber-600 text-sm">
            儲存前請至少新增一個商品款式。
          </p>
        )}
        {formErrors["variants"] && (
          <p className="text-red-500 text-sm">{formErrors["variants"]}</p>
        )}
      </CardContent>
    </Card>
  );
}

import {
  Badge,
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Input,
  Label,
  Separator,
} from "@blackliving/ui";
import AlertTriangle from "@lucide/react/alert-triangle";
import Check from "@lucide/react/check";
import Grid3X3 from "@lucide/react/grid-3x3";
// Tree-shakable Lucide imports
import Plus from "@lucide/react/plus";
import Settings from "@lucide/react/settings";
import X from "@lucide/react/x";
import { useCallback, useMemo, useState } from "react";
import { toast } from "sonner";
import { getProductTypeTemplate } from "../lib/product-templates";
import { generateBulkSKUs } from "../lib/sku-generator";

interface VariantAxis {
  id: string;
  name: string;
  type: string;
  values: string[];
}

interface VariantOption {
  id: string;
  name: string;
  price: number;
  sku?: string;
  attributes: Record<string, string>;
  enabled: boolean;
}

interface VariantMatrixGeneratorProps {
  productType: string;
  productSlug: string;
  categorySlug: string;
  onVariantsGenerated: (variants: VariantOption[]) => void;
  existingVariants?: VariantOption[];
  className?: string;
}

export default function VariantMatrixGenerator({
  productType,
  productSlug,
  categorySlug,
  onVariantsGenerated,
  existingVariants = [],
  className,
}: VariantMatrixGeneratorProps) {
  const [axes, setAxes] = useState<VariantAxis[]>([]);
  const [generatedVariants, setGeneratedVariants] = useState<VariantOption[]>(
    []
  );
  const [selectedVariants, setSelectedVariants] = useState<Set<string>>(
    new Set()
  );
  const [isGenerating, setIsGenerating] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);

  // Load template axes when product type changes
  const templateData = useMemo(
    () => (productType ? getProductTypeTemplate(productType) : null),
    [productType]
  );

  // Initialize axes from template
  useState(() => {
    if (templateData?.variantAxes) {
      const initialAxes = templateData.variantAxes.map((axis: any) => ({
        ...axis,
        values: axis.values.slice(), // Copy values array
      }));
      setAxes(initialAxes);
    }
  });

  // Generate all possible combinations
  const generateCombinations = useCallback(() => {
    if (axes.length === 0) return [];

    // Get all combinations using cartesian product
    const combinations = cartesianProduct(axes.map((axis) => axis.values));

    return combinations.map((combination, index) => {
      const attributes: Record<string, string> = {};
      axes.forEach((axis, axisIndex) => {
        attributes[axis.type] = combination[axisIndex];
      });

      // Generate variant name from attributes
      const name = generateVariantName(attributes, axes);

      return {
        id: `variant-${Date.now()}-${index}`,
        name,
        price: 0,
        sku: "",
        attributes,
        enabled: true,
      };
    });
  }, [axes]);

  // Generate SKUs for selected variants
  const generateSKUs = useCallback(
    async (variants: VariantOption[]) => {
      if (!productType || variants.length === 0) return variants;

      try {
        const skuResults = await generateBulkSKUs(
          productType,
          productSlug,
          variants.map((v) => ({
            size: v.attributes.size,
            firmness: v.attributes.firmness,
            color: v.attributes.color,
            material: v.attributes.material,
            thickness: v.attributes.thickness,
            loft: v.attributes.loft,
            weight: v.attributes.weight,
            style: v.attributes.style,
          }))
        );

        return variants.map((variant, index) => ({
          ...variant,
          sku: skuResults[index]?.sku || variant.sku,
        }));
      } catch (error) {
        console.error("SKU generation failed:", error);
        toast.error("SKU 生成失敗");
        return variants;
      }
    },
    [productType, productSlug]
  );

  // Handle axis value changes
  const handleAxisValueChange = (axisId: string, values: string[]) => {
    setAxes((prev) =>
      prev.map((axis) => (axis.id === axisId ? { ...axis, values } : axis))
    );
  };

  // Add new axis
  const addAxis = () => {
    const newAxis: VariantAxis = {
      id: `axis-${Date.now()}`,
      name: "新屬性",
      type: "custom",
      values: [],
    };
    setAxes((prev) => [...prev, newAxis]);
  };

  // Remove axis
  const removeAxis = (axisId: string) => {
    setAxes((prev) => prev.filter((axis) => axis.id !== axisId));
  };

  // Generate variants
  const handleGenerateVariants = async () => {
    setIsGenerating(true);
    try {
      const combinations = generateCombinations();

      if (combinations.length === 0) {
        toast.error("請至少設定一個屬性軸並添加值");
        return;
      }

      if (combinations.length > 1000) {
        toast.error("生成的變體數量過多（最多 1000 個），請減少屬性值");
        return;
      }

      // Generate SKUs
      const variantsWithSKUs = await generateSKUs(combinations);

      setGeneratedVariants(variantsWithSKUs);
      setSelectedVariants(new Set(variantsWithSKUs.map((v) => v.id)));

      toast.success(`成功生成 ${variantsWithSKUs.length} 個變體`);
    } catch (error) {
      console.error("Variant generation failed:", error);
      toast.error("變體生成失敗");
    } finally {
      setIsGenerating(false);
    }
  };

  // Toggle variant selection
  const toggleVariantSelection = (variantId: string) => {
    setSelectedVariants((prev) => {
      const next = new Set(prev);
      if (next.has(variantId)) {
        next.delete(variantId);
      } else {
        next.add(variantId);
      }
      return next;
    });
  };

  // Select all variants
  const selectAllVariants = () => {
    setSelectedVariants(new Set(generatedVariants.map((v) => v.id)));
  };

  // Deselect all variants
  const deselectAllVariants = () => {
    setSelectedVariants(new Set());
  };

  // Apply selected variants
  const applySelectedVariants = () => {
    const selectedVariantsData = generatedVariants.filter((v) =>
      selectedVariants.has(v.id)
    );
    onVariantsGenerated(selectedVariantsData);
    toast.success(`已應用 ${selectedVariantsData.length} 個變體`);
  };

  // Update variant price
  const updateVariantPrice = (variantId: string, price: number) => {
    setGeneratedVariants((prev) =>
      prev.map((v) => (v.id === variantId ? { ...v, price } : v))
    );
  };

  const totalVariants = generatedVariants.length;
  const selectedCount = selectedVariants.size;

  return (
    <div className={className}>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Grid3X3 className="h-5 w-5" />
            變體矩陣生成器
          </CardTitle>
          <CardDescription>
            基於產品類型模板自動生成變體組合
            {templateData && (
              <span className="ml-2 text-blue-600 text-sm">
                ({templateData.name} 模板)
              </span>
            )}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Template Info */}
          {templateData && (
            <div className="rounded-lg border bg-blue-50 p-4">
              <h4 className="mb-2 font-medium text-blue-900">模板資訊</h4>
              <p className="mb-2 text-blue-700 text-sm">
                {templateData.description}
              </p>
              <div className="flex flex-wrap gap-2">
                {templateData.variantAxes.map((axis: any) => (
                  <Badge
                    className="bg-blue-100 text-blue-800"
                    key={axis.id}
                    variant="secondary"
                  >
                    {axis.name}: {axis.values.length} 個選項
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {/* Axis Configuration */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="font-medium">屬性軸設定</h4>
              <div className="flex items-center gap-2">
                <Button
                  onClick={() => setShowAdvanced(!showAdvanced)}
                  size="sm"
                  variant="outline"
                >
                  <Settings className="mr-2 h-4 w-4" />
                  {showAdvanced ? "隱藏進階" : "顯示進階"}
                </Button>
                <Button onClick={addAxis} size="sm" variant="outline">
                  <Plus className="mr-2 h-4 w-4" />
                  新增屬性軸
                </Button>
              </div>
            </div>

            {axes.map((axis, index) => (
              <div className="space-y-3 rounded-lg border p-4" key={axis.id}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{axis.name}</span>
                    <Badge variant="outline">{axis.type}</Badge>
                  </div>
                  {showAdvanced && (
                    <Button
                      disabled={axes.length <= 1}
                      onClick={() => removeAxis(axis.id)}
                      size="sm"
                      variant="ghost"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  )}
                </div>

                <div className="space-y-2">
                  <Label>屬性值（每行一個）</Label>
                  <textarea
                    className="min-h-[80px] w-full rounded-md border p-2 text-sm"
                    onChange={(e) =>
                      handleAxisValueChange(
                        axis.id,
                        e.target.value.split("\n").filter((v) => v.trim())
                      )
                    }
                    placeholder="輸入屬性值，每行一個..."
                    value={axis.values.join("\n")}
                  />
                  <div className="flex flex-wrap gap-1">
                    {axis.values.map((value, valueIndex) => (
                      <Badge
                        className="text-xs"
                        key={valueIndex}
                        variant="secondary"
                      >
                        {value}
                      </Badge>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>

          <Separator />

          {/* Generation Controls */}
          <div className="flex items-center justify-between">
            <div className="text-muted-foreground text-sm">
              {axes.length > 0 && (
                <span>
                  將生成{" "}
                  {axes.reduce(
                    (acc, axis) => acc * Math.max(axis.values.length, 1),
                    1
                  )}{" "}
                  個變體組合
                </span>
              )}
            </div>
            <Button
              disabled={isGenerating || axes.length === 0}
              onClick={handleGenerateVariants}
            >
              {isGenerating ? "生成中..." : "生成變體"}
            </Button>
          </div>

          {/* Generated Variants */}
          {generatedVariants.length > 0 && (
            <>
              <Separator />

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="font-medium">
                    生成的變體 ({totalVariants} 個)
                  </h4>
                  <div className="flex items-center gap-2">
                    <Button
                      onClick={selectAllVariants}
                      size="sm"
                      variant="outline"
                    >
                      全選
                    </Button>
                    <Button
                      onClick={deselectAllVariants}
                      size="sm"
                      variant="outline"
                    >
                      取消全選
                    </Button>
                    <span className="text-muted-foreground text-sm">
                      已選取 {selectedCount} 個
                    </span>
                  </div>
                </div>

                <div className="max-h-96 space-y-2 overflow-y-auto">
                  {generatedVariants.map((variant) => (
                    <div
                      className={`flex cursor-pointer items-center justify-between rounded-lg border p-3 transition-colors ${
                        selectedVariants.has(variant.id)
                          ? "border-blue-500 bg-blue-50"
                          : "border-gray-200 hover:border-gray-300"
                      }`}
                      key={variant.id}
                      onClick={() => toggleVariantSelection(variant.id)}
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className={`h-4 w-4 rounded border-2 ${
                            selectedVariants.has(variant.id)
                              ? "border-blue-500 bg-blue-500"
                              : "border-gray-300"
                          }`}
                        >
                          {selectedVariants.has(variant.id) && (
                            <Check className="h-3 w-3 text-white" />
                          )}
                        </div>

                        <div className="flex-1">
                          <div className="font-medium">{variant.name}</div>
                          <div className="mt-1 flex flex-wrap gap-1">
                            {Object.entries(variant.attributes).map(
                              ([key, value]) => (
                                <Badge
                                  className="text-xs"
                                  key={key}
                                  variant="outline"
                                >
                                  {key}: {value}
                                </Badge>
                              )
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <Input
                          className="h-8 w-20 text-sm"
                          onChange={(e) =>
                            updateVariantPrice(
                              variant.id,
                              Number(e.target.value) || 0
                            )
                          }
                          onClick={(e) => e.stopPropagation()}
                          placeholder="價格"
                          type="number"
                          value={variant.price || ""}
                        />
                        <Badge className="text-xs" variant="secondary">
                          {variant.sku || "無 SKU"}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="flex items-center justify-between border-t pt-4">
                  <div className="text-muted-foreground text-sm">
                    {selectedCount === 0 && (
                      <span className="flex items-center gap-1 text-amber-600">
                        <AlertTriangle className="h-4 w-4" />
                        請選取要應用的變體
                      </span>
                    )}
                    {selectedCount > 0 && (
                      <span>將應用 {selectedCount} 個變體到產品</span>
                    )}
                  </div>
                  <Button
                    disabled={selectedCount === 0}
                    onClick={applySelectedVariants}
                  >
                    應用選取的變體
                  </Button>
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

// Helper function to generate variant name from attributes
function generateVariantName(
  attributes: Record<string, string>,
  axes: VariantAxis[]
): string {
  const parts: string[] = [];

  axes.forEach((axis) => {
    const value = attributes[axis.type];
    if (value) {
      parts.push(value);
    }
  });

  return parts.join(" - ") || "預設變體";
}

// Cartesian product helper
function cartesianProduct<T>(arrays: T[][]): T[][] {
  return arrays.reduce<T[][]>(
    (acc, curr) => acc.flatMap((a) => curr.map((b) => [...a, b])),
    [[]]
  );
}

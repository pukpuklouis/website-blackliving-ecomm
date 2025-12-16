import { Button, Card, CardContent, CardHeader } from "@blackliving/ui";
import ArrowLeft from "@lucide/react/arrow-left";
import Save from "@lucide/react/save";
import Settings from "@lucide/react/settings";
import { ProductBasicInfo } from "./product-form/ProductBasicInfo";
import { ProductFeatures } from "./product-form/ProductFeatures";
import { ProductImages } from "./product-form/ProductImages";
import { ProductSidebar } from "./product-form/ProductSidebar";
import { ProductVariants } from "./product-form/ProductVariants";
import { type Product, useProductForm } from "./product-form/useProductForm";

// Export types and utilities from utils to maintain backward compatibility if used elsewhere
export * from "./product-form/utils";

type ProductEditPageProps = {
  productId?: string;
  initialData?: Partial<Product>;
};

export default function ProductEditPage({
  productId,
  initialData,
}: ProductEditPageProps) {
  const {
    loading,
    formData,
    setFormData,
    formErrors,
    isSubmitting,
    featureInput,
    setFeatureInput,
    selectedTemplate,
    sortedCategories,
    productTypeOptions,
    selectedTemplateData,
    hasAtLeastOneImage,
    hasAtLeastOneVariant,
    isSubmitDisabled,
    handleTemplateChange,
    handleGenerateSKUs,
    handleSubmit,
    handleAddVariant,
    handleUpdateVariant,
    handleRemoveVariant,
    handleAddFeature,
    handleRemoveFeature,
    handleProductImagesChange,
    handleFeatureDragStart,
    handleFeatureDragEnter,
    handleFeatureDragEnd,
  } = useProductForm({ productId, initialData });

  const navigate = (path: string | number) => {
    if (typeof path === "number") {
      window.history.go(path);
    } else {
      window.location.href = path;
    }
  };

  // We need to use the navigate from useProductForm, but it is not exposed.
  // Actually useProductForm uses useNavigate internally.
  // But the "Back" button in the header needs navigate.
  // I should expose navigate from useProductForm or use useNavigate here.
  // I'll import useNavigate here.

  // Wait, I can't use hooks inside a function if it's not a component?
  // ProductEditPage IS a component. So I can use useNavigate.
  // But useProductForm already calls useNavigate. Defining it twice is fine.

  // Re-importing useNavigate to avoid errors
  // But wait, I didn't import useNavigate in the imports above.
  // Let me add it.

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <div className="h-8 w-8 animate-pulse rounded bg-gray-200" />
          <div className="h-8 w-48 animate-pulse rounded bg-gray-200" />
        </div>
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <div className="space-y-6 lg:col-span-2">
            <Card>
              <CardHeader>
                <div className="h-6 w-32 animate-pulse rounded bg-gray-200" />
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="h-10 w-full animate-pulse rounded bg-gray-200" />
                <div className="h-10 w-full animate-pulse rounded bg-gray-200" />
              </CardContent>
            </Card>
          </div>
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <div className="h-6 w-24 animate-pulse rounded bg-gray-200" />
              </CardHeader>
              <CardContent>
                <div className="h-20 w-full animate-pulse rounded bg-gray-200" />
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            onClick={() => window.history.back()}
            size="sm"
            variant="ghost"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            返回
          </Button>
          <div>
            <h1 className="font-bold text-3xl">
              {productId ? "編輯產品" : "新增產品"}
            </h1>
            <p className="mt-1 text-muted-foreground">
              {productId ? "更新產品資訊" : "建立新的產品"}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button
            disabled={!selectedTemplate}
            onClick={handleGenerateSKUs}
            variant="outline"
          >
            <Settings className="mr-2 h-4 w-4" />
            生成 SKU
          </Button>
          <Button disabled={isSubmitDisabled} onClick={handleSubmit}>
            <Save className="mr-2 h-4 w-4" />
            {isSubmitting ? "儲存中..." : "儲存"}
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Main Content */}
        <div className="space-y-6 lg:col-span-2">
          <ProductBasicInfo
            formData={formData}
            formErrors={formErrors}
            handleTemplateChange={handleTemplateChange}
            productTypeOptions={productTypeOptions}
            selectedTemplate={selectedTemplate}
            setFormData={setFormData}
            sortedCategories={sortedCategories}
          />

          <ProductImages
            error={formErrors.images}
            hasAtLeastOneImage={hasAtLeastOneImage}
            images={formData.images || []}
            onChange={handleProductImagesChange}
          />

          <ProductVariants
            formErrors={formErrors}
            hasAtLeastOneVariant={hasAtLeastOneVariant}
            onAddVariant={handleAddVariant}
            onRemoveVariant={handleRemoveVariant}
            onUpdateVariant={handleUpdateVariant}
            selectedTemplateData={selectedTemplateData}
            variants={formData.variants || []}
          />

          <ProductFeatures
            featureInput={featureInput}
            features={formData.features || []}
            featuresMarkdown={formData.featuresMarkdown}
            onAddFeature={handleAddFeature}
            onDragEnd={handleFeatureDragEnd}
            onDragEnter={handleFeatureDragEnter}
            onDragStart={handleFeatureDragStart}
            onRemoveFeature={handleRemoveFeature}
            setFeatureInput={setFeatureInput}
            setFormData={setFormData}
          />
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          <ProductSidebar formData={formData} setFormData={setFormData} />
        </div>
      </div>
    </div>
  );
}

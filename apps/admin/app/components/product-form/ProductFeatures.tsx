import {
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Input,
  Label,
} from "@blackliving/ui";
import FileText from "@lucide/react/file-text";
import GripVertical from "@lucide/react/grip-vertical";
import BlockNoteEditor from "../editor/block-note-editor";
import type { ProductFormData } from "./useProductForm";

type ProductFeaturesProps = {
  features: string[]; // formData.features
  featuresMarkdown?: string; // formData.featuresMarkdown
  featureInput: string;
  setFeatureInput: (value: string) => void;
  setFormData: React.Dispatch<React.SetStateAction<Partial<ProductFormData>>>;
  onAddFeature: () => void;
  onRemoveFeature: (index: number) => void;
  onDragStart: (index: number) => void;
  onDragEnter: (index: number) => void;
  onDragEnd: () => void;
};

export function ProductFeatures({
  features,
  featuresMarkdown,
  featureInput,
  setFeatureInput,
  setFormData,
  onAddFeature,
  onRemoveFeature,
  onDragStart,
  onDragEnter,
  onDragEnd,
}: ProductFeaturesProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="h-5 w-5" />
          產品特色
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="featuresMarkdown-editor">產品特色編輯</Label>
          <div id="featuresMarkdown-editor">
            <BlockNoteEditor
              className="bn-editor-style"
              onChange={(markdown) =>
                setFormData((prev) => ({
                  ...prev,
                  featuresMarkdown: markdown,
                }))
              }
              placeholder="編輯產品特色，支援 Markdown 格式..."
              value={featuresMarkdown || ""}
            />
          </div>
        </div>
        <div className="flex gap-2">
          <Input
            onChange={(e) => setFeatureInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                onAddFeature();
              }
            }}
            placeholder="新增特色..."
            value={featureInput}
          />
          <Button onClick={onAddFeature} type="button">
            新增
          </Button>
        </div>

        {features.length > 0 && (
          <ul className="space-y-2">
            {features.map((feature, i) => (
              <li
                className="flex cursor-move items-center justify-between gap-2 rounded border bg-muted/20 p-2"
                key={feature}
              >
                <button
                  className="flex cursor-move items-center gap-2 text-sm"
                  draggable
                  onDragEnd={onDragEnd}
                  onDragEnter={() => onDragEnter(i)}
                  onDragOver={(e) => e.preventDefault()}
                  onDragStart={() => onDragStart(i)}
                  onDrop={onDragEnd}
                  type="button"
                >
                  <GripVertical className="h-4 w-4 text-muted-foreground" />
                  {feature}
                </button>
                <Button
                  onClick={() => onRemoveFeature(i)}
                  size="sm"
                  variant="outline"
                >
                  移除
                </Button>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}

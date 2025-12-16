import {
  Badge,
  Button,
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
} from "@blackliving/ui";
import RefreshCcw from "@lucide/react/refresh-ccw";
import TagIcon from "@lucide/react/tag";
import type {
  Control,
  FieldErrors,
  UseFormSetValue,
  UseFormWatch,
} from "react-hook-form";
import { Controller } from "react-hook-form";
import type { BlogPostFormData, Category } from "../schema";

type BlogCategoryTagsProps = {
  control: Control<BlogPostFormData>;
  categories: Category[];
  refreshingCategories: boolean;
  invalidateCategoriesCache: () => void;
  setValue: UseFormSetValue<BlogPostFormData>;
  errors: FieldErrors<BlogPostFormData>;
  tagInput: string;
  setTagInput: (value: string) => void;
  addTag: () => void;
  removeTag: (tag: string) => void;
  watch: UseFormWatch<BlogPostFormData>;
};

export function BlogCategoryTags({
  control,
  categories,
  refreshingCategories,
  invalidateCategoriesCache,
  setValue,
  errors,
  tagInput,
  setTagInput,
  addTag,
  removeTag,
  watch,
}: BlogCategoryTagsProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <TagIcon className="h-5 w-5" />
          分類標籤
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <div className="mb-1 flex items-center justify-between">
            <Label htmlFor="categoryId">文章分類</Label>
            <Button
              disabled={refreshingCategories}
              onClick={invalidateCategoriesCache}
              size="icon"
              title="重新整理分類快取"
              type="button"
              variant="ghost"
            >
              <RefreshCcw
                className={`h-4 w-4 ${refreshingCategories ? "animate-spin" : ""}`}
              />
            </Button>
          </div>
          <Controller
            control={control}
            name="categoryId"
            render={({ field }) => (
              <Select
                onValueChange={(val) => {
                  field.onChange(val);
                  const found = categories.find((c: Category) => c.id === val);
                  if (found) {
                    setValue("category", found.name, {
                      shouldDirty: false,
                    });
                  }
                }}
                value={field.value}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((cat: Category) => (
                    <SelectItem key={cat.id} value={cat.id}>
                      <div>
                        <div className="font-medium">{cat.name}</div>
                        {/*{cat.description ? (
                          <div className="text-xs text-gray-500">{cat.description}</div>
                        ) : null}*/}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          />
          {errors.categoryId ? (
            <p className="mt-1 text-red-600 text-sm">
              {String(errors.categoryId.message)}
            </p>
          ) : null}
        </div>

        <div className="flex flex-col gap-2">
          <Label>文章標籤</Label>
          <div className="mt-1 flex gap-2">
            <Input
              onChange={(e) => setTagInput(e.target.value)}
              onKeyPress={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  addTag();
                }
              }}
              placeholder="新增標籤"
              value={tagInput}
            />
            <Button onClick={addTag} size="sm" type="button">
              新增
            </Button>
          </div>
          <div className="mt-2 flex flex-wrap gap-2">
            {watch("tags")?.map((tag) => (
              <Badge
                className="cursor-pointer"
                key={tag}
                onClick={() => removeTag(tag)}
                variant="secondary"
              >
                {tag} ×
              </Badge>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

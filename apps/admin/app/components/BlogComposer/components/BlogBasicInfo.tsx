import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Input,
  Label,
  Textarea,
} from "@blackliving/ui";
import Copy from "@lucide/react/copy";
import FileText from "@lucide/react/file-text";
import type { Control, FieldErrors, UseFormRegister } from "react-hook-form";
import { Controller } from "react-hook-form";
import { toast } from "sonner";
import { SortOrderField } from "../../SortOrderField";
import type { BlogPostFormData } from "../schema";

type BlogBasicInfoProps = {
  register: UseFormRegister<BlogPostFormData>;
  errors: FieldErrors<BlogPostFormData>;
  control: Control<BlogPostFormData>;
  saving: boolean;
  canonicalPreview: string;
};

export function BlogBasicInfo({
  register,
  errors,
  control,
  saving,
  canonicalPreview,
}: BlogBasicInfoProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="h-5 w-5" />
          基本資訊
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="flex flex-col gap-2">
          <Label htmlFor="title">文章標題 *</Label>
          <Input
            id="title"
            {...register("title")}
            className={`placeholder:text-sm placeholder:opacity-55 ${errors.title ? "border-red-500" : ""}`}
            placeholder="輸入吸引人的文章標題"
          />
          {errors.title?.message ? (
            <p className="mt-1 text-red-600 text-sm">
              {String(errors.title.message)}
            </p>
          ) : null}
        </div>

        <div className="flex flex-col gap-2">
          <Label htmlFor="slug">URL Slug *</Label>
          <Input
            id="slug"
            {...register("slug")}
            className={`placeholder:text-sm placeholder:opacity-55 ${errors.slug ? "border-red-500" : ""}`}
            placeholder="url-friendly-slug"
          />
          {errors.slug?.message ? (
            <p className="mt-1 text-red-600 text-sm">
              {typeof errors.slug.message === "string"
                ? errors.slug.message
                : "An error occurred"}
            </p>
          ) : null}
          {/* Canonical URL Preview (auto-generated) */}
          <div className="mt-1 ml-2 flex items-center justify-between text-foreground/50 text-xs">
            <span className="truncate" title={canonicalPreview}>
              網址: {canonicalPreview || "—"}
            </span>
            {canonicalPreview ? (
              <button
                className="inline-flex items-center gap-1 rounded px-1.5 py-0.5 hover:bg-gray-100"
                onClick={async () => {
                  try {
                    await navigator.clipboard.writeText(canonicalPreview);
                    toast.success("已複製 Canonical URL");
                  } catch {
                    toast.error("複製失敗");
                  }
                }}
                title="複製 Canonical URL"
                type="button"
              >
                <Copy className="h-3.5 w-3.5" />
                複製
              </button>
            ) : null}
          </div>
        </div>

        <div className="flex flex-col gap-2">
          <Label htmlFor="description">文章描述 *</Label>
          <Textarea
            id="description"
            {...register("description")}
            className={errors.description ? "border-red-500" : ""}
            placeholder="簡短描述文章內容，會顯示在文章列表和搜尋結果中"
            rows={3}
          />
          {errors.description?.message ? (
            <p className="mt-1 text-red-600 text-sm">
              {String(errors.description.message)}
            </p>
          ) : null}
        </div>

        <div className="flex flex-col gap-2">
          <Label htmlFor="excerpt">文章摘要</Label>
          <Textarea
            id="excerpt"
            {...register("excerpt")}
            className={"placeholder:text-sm placeholder:opacity-55"}
            placeholder="可選的文章摘要，用於特殊顯示場合"
            rows={2}
          />
        </div>

        <Controller
          control={control}
          name="sortOrder"
          render={({ field }) => (
            <SortOrderField
              disabled={saving}
              error={errors.sortOrder?.message}
              onBlur={field.onBlur}
              onChange={(val: number | string) => field.onChange(val)}
              value={
                typeof field.value === "number"
                  ? field.value
                  : Number(field.value) || 0
              }
            />
          )}
        />
      </CardContent>
    </Card>
  );
}

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Input,
  Label,
} from "@blackliving/ui";
import ImageIcon from "@lucide/react/image";
import type { Control, FieldErrors } from "react-hook-form";
import { Controller } from "react-hook-form";
import { ImageUpload } from "../../ImageUpload";
import type { BlogPostFormData } from "../schema";

type BlogCoverImageProps = {
  control: Control<BlogPostFormData>;
  errors: FieldErrors<BlogPostFormData>;
};

export function BlogCoverImage({ control, errors }: BlogCoverImageProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <ImageIcon className="h-5 w-5" />
          精選圖片
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Controller
          control={control}
          name="featuredImage"
          render={({ field }) => {
            const { value, onChange, onBlur, ref } = field;
            return (
              <div className="space-y-4">
                <ImageUpload
                  emptyHint="上傳後會自動轉換為 WebP，確保載入速度"
                  error={errors.featuredImage?.message as string | undefined}
                  folder="blog-featured"
                  multiple={false}
                  onChange={(images: string[]) => onChange(images[0] ?? "")}
                  value={value ? [value as string] : []}
                />
                <div className="space-y-2">
                  <Label htmlFor="featuredImageInput">圖片 URL</Label>
                  <Input
                    id="featuredImageInput"
                    onBlur={onBlur}
                    onChange={(event) => onChange(event.target.value)}
                    placeholder="圖片 URL 或上傳圖片"
                    ref={ref}
                    value={(value as string) ?? ""}
                  />
                  <p className="text-foreground/30 text-xs">
                    建議尺寸：1200x630px，用於文章列表和社交媒體分享
                  </p>
                </div>
              </div>
            );
          }}
        />
      </CardContent>
    </Card>
  );
}

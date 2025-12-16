import {
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
  Switch,
} from "@blackliving/ui";
import EyeIcon from "@lucide/react/eye";
import type { Control, FieldErrors, UseFormWatch } from "react-hook-form";
import { Controller } from "react-hook-form";
import type { BlogPostFormData } from "../schema";

type BlogOverlaySettingsProps = {
  control: Control<BlogPostFormData>;
  errors: FieldErrors<BlogPostFormData>;
  watch: UseFormWatch<BlogPostFormData>;
};

export function BlogOverlaySettings({
  control,
  errors,
  watch,
}: BlogOverlaySettingsProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <EyeIcon className="h-5 w-5" />
          疊加文字設定
        </CardTitle>
        <CardDescription>
          在圖片上添加文字疊加效果，提升視覺吸引力
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <Label htmlFor="overlayEnabled">啟用疊加文字</Label>
          <Controller
            control={control}
            name="overlaySettings.enabled"
            render={({ field }) => (
              <Switch
                checked={field.value}
                id="overlayEnabled"
                onCheckedChange={field.onChange}
              />
            )}
          />
        </div>

        {watch("overlaySettings.enabled") && (
          <div className="space-y-4 border-t pt-4">
            <div className="flex flex-col gap-2">
              <Label htmlFor="overlayTitle">疊加標題</Label>
              <Controller
                control={control}
                name="overlaySettings.title"
                render={({ field }) => (
                  <Input
                    id="overlayTitle"
                    {...field}
                    className={
                      errors.overlaySettings?.title ? "border-red-500" : ""
                    }
                    placeholder="輸入疊加文字"
                  />
                )}
              />
              <div className="flex items-center justify-between">
                <p className="text-gray-500 text-xs">
                  {watch("overlaySettings.title")?.length || 0}/50 字元
                </p>
                {(watch("overlaySettings.title")?.length || 0) > 50 && (
                  <p className="text-red-600 text-xs">超過字元限制</p>
                )}
              </div>
              {errors.overlaySettings?.title ? (
                <p className="mt-1 text-red-600 text-sm">
                  {errors.overlaySettings.title.message}
                </p>
              ) : null}
            </div>

            <div className="flex flex-col gap-2">
              <Label htmlFor="overlayPlacement">位置設定</Label>
              <Controller
                control={control}
                name="overlaySettings.placement"
                render={({ field }) => (
                  <Select
                    onValueChange={field.onChange}
                    value={field.value || "bottom-center"}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="bottom-left">左下角</SelectItem>
                      <SelectItem value="bottom-right">右下角</SelectItem>
                      <SelectItem value="bottom-center">中下</SelectItem>
                      <SelectItem value="top-left">左上角</SelectItem>
                      <SelectItem value="center">中央</SelectItem>
                    </SelectContent>
                  </Select>
                )}
              />
            </div>

            <div className="flex flex-col gap-2">
              <Label htmlFor="overlayGradientDirection">漸層方向</Label>
              <Controller
                control={control}
                name="overlaySettings.gradientDirection"
                render={({ field }) => (
                  <Select
                    onValueChange={field.onChange}
                    value={field.value || "t"}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="t">上方</SelectItem>
                      <SelectItem value="tr">右上</SelectItem>
                      <SelectItem value="r">右方</SelectItem>
                      <SelectItem value="br">右下</SelectItem>
                      <SelectItem value="b">下方</SelectItem>
                      <SelectItem value="bl">左下</SelectItem>
                      <SelectItem value="l">左方</SelectItem>
                      <SelectItem value="tl">左中</SelectItem>
                    </SelectContent>
                  </Select>
                )}
              />
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

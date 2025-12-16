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
  Switch,
} from "@blackliving/ui";
import CalendarIcon from "@lucide/react/calendar";
import type { Control, UseFormRegister, UseFormWatch } from "react-hook-form";
import { Controller } from "react-hook-form";
import type { BlogPostFormData } from "../schema";

const statusOptions = [
  { value: "draft", label: "草稿", description: "儲存為草稿，不會公開顯示" },
  { value: "published", label: "立即發布", description: "立即發布到網站上" },
  { value: "scheduled", label: "排程發布", description: "設定時間後自動發布" },
];

type BlogPublishingSettingsProps = {
  control: Control<BlogPostFormData>;
  register: UseFormRegister<BlogPostFormData>;
  watch: UseFormWatch<BlogPostFormData>;
};

export function BlogPublishingSettings({
  control,
  register,
  watch,
}: BlogPublishingSettingsProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CalendarIcon className="h-5 w-5" />
          發布設定
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-row justify-between">
          <Label htmlFor="status">發布狀態</Label>
          <Controller
            control={control}
            name="status"
            render={({ field }) => (
              <Select onValueChange={field.onChange} value={field.value}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {statusOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      <div>
                        <div className="font-medium">{option.label}</div>
                        {/*<div className="text-xs text-gray-500">{option.description}</div>*/}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          />
        </div>

        {watch("status") === "scheduled" && (
          <div>
            <Label htmlFor="scheduledAt">排程時間</Label>
            <Input
              id="scheduledAt"
              type="datetime-local"
              {...register("scheduledAt")}
            />
          </div>
        )}

        {watch("status") === "published" && (
          <div>
            <Label htmlFor="publishedAt">發布日期</Label>
            <Input
              id="publishedAt"
              type="datetime-local"
              {...register("publishedAt")}
            />
          </div>
        )}

        <div className="flex items-center justify-between">
          <Label htmlFor="featured">精選文章</Label>
          <Controller
            control={control}
            name="featured"
            render={({ field }) => (
              <Switch
                checked={field.value}
                id="featured"
                onCheckedChange={field.onChange}
              />
            )}
          />
        </div>
      </CardContent>
    </Card>
  );
}

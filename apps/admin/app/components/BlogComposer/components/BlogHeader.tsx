import { Button } from "@blackliving/ui";
import ArrowLeftIcon from "@lucide/react/arrow-left";
import SaveIcon from "@lucide/react/save";
import type {
  SubmitHandler,
  UseFormHandleSubmit,
  UseFormWatch,
} from "react-hook-form";
import type { NavigateFunction } from "react-router-dom";
import type { BlogPostFormData } from "../schema";

type BlogHeaderProps = {
  navigate: NavigateFunction;
  isEditing: boolean;
  saving: boolean;
  loadingCategories: boolean;
  watchedCategoryId: string;
  handleSubmit: UseFormHandleSubmit<BlogPostFormData>;
  onSubmit: SubmitHandler<BlogPostFormData>;
  handlePrimarySubmit: () => void;
  watch: UseFormWatch<BlogPostFormData>;
  primaryActionDisabled: boolean;
};

export function BlogHeader({
  navigate,
  isEditing,
  saving,
  loadingCategories,
  watchedCategoryId,
  handleSubmit,
  onSubmit,
  handlePrimarySubmit,
  watch,
  primaryActionDisabled,
}: BlogHeaderProps) {
  return (
    <div className="flex items-center justify-between">
      <div className="flex flex-col items-center gap-4">
        <Button
          onClick={() => navigate("/dashboard/posts")}
          size="sm"
          variant="ghost"
        >
          <ArrowLeftIcon className="mr-2 h-4 w-4" />
          返回文章列表
        </Button>
        <div>
          <h1 className="font-bold text-2xl text-foreground">
            {isEditing ? "編輯文章" : "新增文章"}
          </h1>
        </div>
      </div>
      <div className="flex items-center gap-2">
        <Button
          className="disabled:cursor-not-allowed disabled:opacity-60"
          disabled={saving || loadingCategories || !watchedCategoryId}
          onClick={() =>
            handleSubmit((d) => onSubmit({ ...d, status: "draft" }))()
          }
          type="button"
          variant="outline"
        >
          <SaveIcon className="mr-2 h-4 w-4" />
          {isEditing ? "更新草稿" : "儲存草稿"}
        </Button>
        <Button
          className="disabled:cursor-not-allowed disabled:opacity-40"
          disabled={primaryActionDisabled}
          onClick={handlePrimarySubmit}
          type="button"
        >
          {saving
            ? "儲存中..."
            : (() => {
                if (isEditing) {
                  return "更新文章";
                }
                if (watch("status") === "published") {
                  return "發布文章";
                }
                return "儲存";
              })()}
        </Button>
      </div>
    </div>
  );
}

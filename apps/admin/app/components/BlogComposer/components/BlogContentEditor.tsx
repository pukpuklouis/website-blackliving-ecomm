import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@blackliving/ui";
import Clock from "@lucide/react/clock";
import PencilLine from "@lucide/react/pencil-line";
import type { Control, FieldErrors } from "react-hook-form";
import { Controller } from "react-hook-form";
import { estimateReadingTimeMinutes } from "../../blogComposerUtils";
import BlockNoteEditor from "../../editor/block-note-editor";
import type { BlogPostFormData } from "../schema";

type BlogContentEditorProps = {
  control: Control<BlogPostFormData>;
  errors: FieldErrors<BlogPostFormData>;
  watchedContent: string;
};

export function BlogContentEditor({
  control,
  errors,
  watchedContent,
}: BlogContentEditorProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <PencilLine className="h-5 w-5" />
          文章內容
        </CardTitle>
        <CardDescription className="text-foreground/40 text-sm" />
      </CardHeader>
      <CardContent>
        <Controller
          control={control}
          name="content"
          render={({ field }) => (
            <BlockNoteEditor
              className={"bn-editor-style"}
              onChange={field.onChange}
              placeholder={"在這裡編寫文章內容..."}
              value={field.value}
            />
          )}
        />
        {errors.content?.message ? (
          <p className="mt-1 text-red-600 text-sm">
            {String(errors.content.message)}
          </p>
        ) : null}
        <div className="mt-2 flex items-center gap-4 text-muted-foreground/70 text-sm">
          <span className="flex items-center gap-1">
            <Clock className="h-4 w-4" />
            預估閱讀時間：
            {watchedContent ? estimateReadingTimeMinutes(watchedContent) : 0}{" "}
            分鐘
          </span>
          <span>
            字數：
            {(watchedContent || "")
              .replace(/```[\s\S]*?```/g, "")
              .replace(/`[^`]*`/g, "")
              .replace(/[#>*_\-[\]()!]/g, "").length || 0}
          </span>
        </div>
      </CardContent>
    </Card>
  );
}

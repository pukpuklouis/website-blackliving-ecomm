import {
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
  Skeleton,
  Textarea,
} from "@blackliving/ui";
import { zodResolver } from "@hookform/resolvers/zod";
import ArrowLeftIcon from "@lucide/react/arrow-left";
import FileText from "@lucide/react/file-text";
import Globe from "@lucide/react/globe";
import ImageIcon from "@lucide/react/image";
import SaveIcon from "@lucide/react/save";
import { useCallback, useEffect, useState } from "react";
import { type SubmitHandler, useForm } from "react-hook-form";
import { useNavigate, useParams } from "react-router-dom";
import { toast } from "sonner";
import { z } from "zod";
import { useApiUrl } from "../contexts/EnvironmentContext";
import BlockNoteEditor from "./editor/block-note-editor";
import { ImageUpload } from "./ImageUpload";

const pageSchema = z.object({
  title: z.string().min(1, "標題為必填").max(100, "標題不能超過100個字元"),
  slug: z
    .string()
    .min(1, "URL slug 為必填")
    .regex(/^[a-z0-9-]+$/, "URL slug 只能包含小寫字母、數字和連字符"),
  content: z.any(), // JSON blocks
  contentMarkdown: z.string().optional(),
  status: z.enum(["draft", "published", "archived"]),
  featuredImage: z.string().optional(),
  seoTitle: z.string().max(60, "SEO標題不能超過60個字元").optional(),
  seoDescription: z.string().max(160, "SEO描述不能超過160個字元").optional(),
  seoKeywords: z.array(z.string()),
  publishedAt: z.string().optional(),
});

type PageFormData = z.infer<typeof pageSchema>;

export default function PageForm() {
  const { pageId } = useParams();
  const navigate = useNavigate();
  const apiUrl = useApiUrl();
  const isEditing = !!pageId;

  const [loading, setLoading] = useState(isEditing);
  const [saving, setSaving] = useState(false);
  const [keywordInput, setKeywordInput] = useState("");

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    getValues,
    reset,
    formState: { errors },
  } = useForm<PageFormData>({
    resolver: zodResolver(pageSchema),
    defaultValues: {
      status: "draft",
      seoKeywords: [],
      content: [], // Initial empty blocks
      contentMarkdown: "",
    },
  });

  const watchedTitle = watch("title");

  // Auto-generate slug
  useEffect(() => {
    if (!watchedTitle || isEditing) {
      return;
    }
    const slug = watchedTitle
      .toLowerCase()
      .replace(/[^a-z0-9\u4e00-\u9fff\s-]/g, "")
      .replace(/\s+/g, "-")
      .replace(/^-+|-+$/g, "");

    const currentSlug = getValues("slug");
    if (currentSlug !== slug) {
      setValue("slug", slug, { shouldDirty: false });
    }
  }, [watchedTitle, isEditing, setValue, getValues]);

  const populateForm = useCallback(
    (page: Record<string, unknown>) => {
      reset({
        title: page.title as string,
        slug: page.slug as string,
        content: page.content,
        contentMarkdown: (page.contentMarkdown as string) || "",
        status: page.status as "draft" | "published" | "archived",
        featuredImage: (page.featuredImage as string) || "",
        seoTitle: (page.seoTitle as string) || "",
        seoDescription: (page.seoDescription as string) || "",
        seoKeywords: (page.seoKeywords as string[]) || [],
        publishedAt: page.publishedAt
          ? new Date(page.publishedAt as string).toISOString().slice(0, 16)
          : "",
      });
    },
    [reset]
  );

  // Fetch page data if editing
  useEffect(() => {
    if (isEditing && pageId) {
      const fetchPage = async () => {
        try {
          setLoading(true);
          const response = await fetch(`${apiUrl}/api/pages/${pageId}`, {
            credentials: "include",
          });
          if (!response.ok) {
            throw new Error("Failed to fetch page");
          }
          const json = await response.json();
          if (json.success) {
            populateForm(json.data);
          }
        } catch (error) {
          console.error("Error fetching page:", error);
          toast.error("載入頁面失敗");
        } finally {
          setLoading(false);
        }
      };
      fetchPage();
    }
  }, [isEditing, pageId, apiUrl, populateForm]);

  const preparePayload = (data: PageFormData) => ({
    ...data,
    publishedAt: data.publishedAt
      ? new Date(data.publishedAt).toISOString()
      : undefined,
    // content is already JSON blocks from onChangeBlocks
  });

  const savePage = async (
    url: string,
    method: string,
    payload: Record<string, unknown>
  ) => {
    const response = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify(payload),
    });

    const json = await response.json();

    if (!response.ok) {
      console.error("Server error:", json);
      throw new Error(json.message || json.error || "Failed to save page");
    }

    return json;
  };

  const onSubmit: SubmitHandler<PageFormData> = async (data) => {
    try {
      setSaving(true);
      const url = isEditing
        ? `${apiUrl}/api/pages/${pageId}`
        : `${apiUrl}/api/pages`;
      const method = isEditing ? "PUT" : "POST";

      const payload = preparePayload(data);
      const json = await savePage(url, method, payload);

      if (json.success) {
        toast.success(isEditing ? "頁面已更新" : "頁面已建立");
        navigate("/dashboard/pages");
      } else {
        toast.error(json.message || "儲存失敗");
      }
    } catch (error) {
      console.error("Error saving page:", error);
      toast.error("儲存頁面失敗");
    } finally {
      setSaving(false);
    }
  };

  const addKeyword = () => {
    const newKeyword = keywordInput.trim();
    if (newKeyword && !getValues("seoKeywords").includes(newKeyword)) {
      const current = getValues("seoKeywords");
      setValue("seoKeywords", [...current, newKeyword], { shouldDirty: true });
      setKeywordInput("");
    }
  };

  const removeKeyword = (kw: string) => {
    const current = getValues("seoKeywords") || [];
    setValue(
      "seoKeywords",
      current.filter((k) => k !== kw),
      { shouldDirty: true }
    );
  };

  if (loading) {
    return (
      <div className="mx-auto max-w-6xl space-y-6">
        <div className="flex items-center justify-between">
          <Skeleton className="h-10 w-32" />
          <Skeleton className="h-10 w-28" />
        </div>
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <div className="space-y-6 lg:col-span-2">
            <Skeleton className="h-[500px] w-full" />
            <Skeleton className="h-[300px] w-full" />
          </div>
          <div className="space-y-6">
            <Skeleton className="h-[200px] w-full" />
            <Skeleton className="h-[200px] w-full" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            onClick={() => navigate("/dashboard/pages")}
            size="sm"
            variant="ghost"
          >
            <ArrowLeftIcon className="mr-2 h-4 w-4" />
            返回列表
          </Button>
          <h1 className="font-bold text-2xl">
            {isEditing ? "編輯頁面" : "新增頁面"}
          </h1>
        </div>
        <Button disabled={saving} onClick={handleSubmit(onSubmit)}>
          <SaveIcon className="mr-2 h-4 w-4" />
          {saving ? "儲存中..." : "儲存頁面"}
        </Button>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                基本資訊
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="title">頁面標題 *</Label>
                <Input
                  id="title"
                  {...register("title")}
                  placeholder="輸入頁面標題"
                />
                {(() => {
                  const message = errors.title?.message;
                  return typeof message === "string" ? (
                    <p className="text-red-500 text-sm">{message}</p>
                  ) : null;
                })()}
              </div>
              <div className="space-y-2">
                <Label htmlFor="slug">網址路徑 (Slug) *</Label>
                <Input
                  id="slug"
                  {...register("slug")}
                  placeholder="page-url-slug"
                />
                {(() => {
                  const message = errors.slug?.message;
                  return typeof message === "string" ? (
                    <p className="text-red-500 text-sm">{message}</p>
                  ) : null;
                })()}
              </div>
              <div className="space-y-2">
                <Label>內容</Label>
                <div className="min-h-[400px] rounded-md border p-4">
                  <BlockNoteEditor
                    initialContent={watch("content")}
                    onChange={(markdown) =>
                      setValue("contentMarkdown", markdown, {
                        shouldDirty: true,
                      })
                    }
                    onChangeBlocks={(blocks) =>
                      setValue("content", blocks, { shouldDirty: true })
                    }
                    value={watch("contentMarkdown")}
                  />
                </div>
                {(() => {
                  const message = errors.content?.message;
                  return typeof message === "string" ? (
                    <p className="text-red-500 text-sm">{message}</p>
                  ) : null;
                })()}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Globe className="h-5 w-5" />
                SEO 設定
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="seoTitle">SEO 標題</Label>
                <Input
                  id="seoTitle"
                  {...register("seoTitle")}
                  placeholder="搜尋引擎顯示的標題"
                />
                <p className="text-muted-foreground text-xs">
                  建議長度不超過 60 字元
                </p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="seoDescription">SEO 描述</Label>
                <Textarea
                  id="seoDescription"
                  {...register("seoDescription")}
                  placeholder="搜尋引擎顯示的描述"
                />
                <p className="text-muted-foreground text-xs">
                  建議長度不超過 160 字元
                </p>
              </div>
              <div className="space-y-2">
                <Label>關鍵字</Label>
                <div className="flex gap-2">
                  <Input
                    onChange={(e) => setKeywordInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        addKeyword();
                      }
                    }}
                    placeholder="輸入關鍵字按 Enter"
                    value={keywordInput}
                  />
                  <Button
                    onClick={addKeyword}
                    type="button"
                    variant="secondary"
                  >
                    新增
                  </Button>
                </div>
                <div className="mt-2 flex flex-wrap gap-2">
                  {watch("seoKeywords").map((kw) => (
                    <div
                      className="flex items-center gap-1 rounded-md bg-secondary px-2 py-1 text-secondary-foreground text-sm"
                      key={kw}
                    >
                      {kw}
                      <button
                        className="hover:text-red-500"
                        onClick={() => removeKeyword(kw)}
                        type="button"
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>發布設定</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label>狀態</Label>
                <Select
                  defaultValue={watch("status")}
                  onValueChange={(val: "draft" | "published" | "archived") =>
                    setValue("status", val)
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="選擇狀態" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="draft">草稿</SelectItem>
                    <SelectItem value="published">已發布</SelectItem>
                    <SelectItem value="archived">已封存</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="publishedAt">發布時間</Label>
                <Input
                  id="publishedAt"
                  type="datetime-local"
                  {...register("publishedAt")}
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ImageIcon className="h-5 w-5" />
                精選圖片
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ImageUpload
                folder="pages"
                multiple={false}
                onChange={(images) =>
                  setValue("featuredImage", images[0] || "", {
                    shouldDirty: true,
                  })
                }
                value={(() => {
                  const img = watch("featuredImage");
                  return img ? [img] : [];
                })()}
              />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

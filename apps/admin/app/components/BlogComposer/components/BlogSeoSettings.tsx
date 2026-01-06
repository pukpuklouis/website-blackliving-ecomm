import {
  Badge,
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Input,
  Label,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
  Textarea,
} from "@blackliving/ui";
import Globe from "@lucide/react/globe";
import type { UseFormRegister, UseFormWatch } from "react-hook-form";
import type { BlogPostFormData } from "../schema";

type BlogSeoSettingsProps = {
  register: UseFormRegister<BlogPostFormData>;
  watch: UseFormWatch<BlogPostFormData>;
  keywordInput: string;
  setKeywordInput: (value: string) => void;
  addKeyword: () => void;
  removeKeyword: (keyword: string) => void;
};

export function BlogSeoSettings({
  register,
  watch,
  keywordInput,
  setKeywordInput,
  addKeyword,
  removeKeyword,
}: BlogSeoSettingsProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Globe className="h-5 w-5" />
          SEO 設定
        </CardTitle>
        <CardDescription>優化搜尋引擎和社交媒體的顯示效果</CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs className="w-full" defaultValue="seo">
          <TabsList>
            <TabsTrigger value="seo">搜尋引擎</TabsTrigger>
            <TabsTrigger value="social">社交媒體</TabsTrigger>
          </TabsList>

          <TabsContent className="mt-4 space-y-4" value="seo">
            <div className="flex flex-col gap-2">
              <Label htmlFor="seoTitle">SEO 標題</Label>
              <Input
                id="seoTitle"
                {...register("seoTitle")}
                className={"placeholder:text-sm placeholder:opacity-45"}
                placeholder="搜尋結果中顯示的標題（建議50-60字元）"
              />
              <p className="mt-1 text-gray-500 text-xs">
                {watch("seoTitle")?.length || 0}/60 字元
              </p>
            </div>

            <div className="flex flex-col gap-2">
              <Label htmlFor="seoDescription">SEO 描述</Label>
              <Textarea
                id="seoDescription"
                {...register("seoDescription")}
                className={"placeholder:text-sm placeholder:opacity-45"}
                placeholder="搜尋結果中顯示的描述（建議120-160字元）"
                rows={3}
              />
              <p className="mt-1 text-gray-500 text-xs">
                {watch("seoDescription")?.length || 0}/160 字元
              </p>
            </div>

            <div className="flex flex-col gap-2">
              <Label>SEO 關鍵字</Label>
              <div className="mt-1 flex gap-2">
                <Input
                  className={"placeholder:text-sm placeholder:opacity-55"}
                  onChange={(e) => setKeywordInput(e.target.value)}
                  onKeyPress={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      addKeyword();
                    }
                  }}
                  placeholder="輸入關鍵字"
                  value={keywordInput}
                />
                <Button onClick={addKeyword} size="sm" type="button">
                  新增
                </Button>
              </div>
              <div className="mt-2 flex flex-wrap gap-2">
                {watch("seoKeywords")?.map((keyword) => (
                  <Badge
                    className="cursor-pointer"
                    key={keyword}
                    onClick={() => removeKeyword(keyword)}
                    variant="secondary"
                  >
                    {keyword} ×
                  </Badge>
                ))}
              </div>
            </div>

            {/* Canonical URL is auto-generated from slug and previewed next to the slug field */}
          </TabsContent>

          <TabsContent className="mt-4 space-y-4" value="social">
            <div className="flex flex-col gap-2">
              <Label htmlFor="ogTitle">Open Graph 標題</Label>
              <Input
                id="ogTitle"
                {...register("ogTitle")}
                placeholder="社交媒體分享時顯示的標題"
              />
            </div>

            <div className="flex flex-col gap-2">
              <Label htmlFor="ogDescription">Open Graph 描述</Label>
              <Textarea
                id="ogDescription"
                {...register("ogDescription")}
                className={"placeholder:text-sm placeholder:opacity-45"}
                placeholder="社交媒體分享時顯示的描述"
                rows={3}
              />
            </div>

            <div>
              <Label htmlFor="ogImage">Open Graph 圖片</Label>
              <Input
                id="ogImage"
                {...register("ogImage")}
                className={"placeholder:text-sm placeholder:opacity-45"}
                placeholder="https://example.com/og-image.jpg"
              />
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}

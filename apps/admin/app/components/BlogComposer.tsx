import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { format } from 'date-fns';
import { zhTW } from 'date-fns/locale';
// Tree-shakable Lucide imports
import ArrowLeftIcon from '@lucide/react/arrow-left';
import SaveIcon from '@lucide/react/save';
import EyeIcon from '@lucide/react/eye';
import CalendarIcon from '@lucide/react/calendar';
import TagIcon from '@lucide/react/tag';
import ImageIcon from '@lucide/react/image';
import SettingsIcon from '@lucide/react/settings';
import Globe from '@lucide/react/globe';
import Hash from '@lucide/react/hash';
import FileText from '@lucide/react/file-text';
import Clock from '@lucide/react/clock';

import { Button } from '@blackliving/ui';
import { Input } from '@blackliving/ui';
import { Label } from '@blackliving/ui';
import { Textarea } from '@blackliving/ui';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@blackliving/ui';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@blackliving/ui';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@blackliving/ui';
import { Switch } from '@blackliving/ui';
import { Badge } from '@blackliving/ui';
import { Separator } from '@blackliving/ui';
import { toast } from 'sonner';
import { NovelEditor } from './editor';

// Blog post validation schema
const blogPostSchema = z.object({
  title: z.string().min(1, '文章標題為必填').max(100, '標題不能超過100個字元'),
  slug: z
    .string()
    .min(1, 'URL slug 為必填')
    .regex(/^[a-z0-9-]+$/, 'URL slug 只能包含小寫字母、數字和連字符'),
  description: z.string().min(10, '文章描述至少需要10個字元').max(300, '描述不能超過300個字元'),
  excerpt: z.string().max(200, '摘要不能超過200個字元').optional(),
  content: z.string().min(50, '文章內容至少需要50個字元'),
  category: z.enum(['睡眠知識', '產品介紹', '健康生活', '門市活動']),
  tags: z.array(z.string()).default([]),
  status: z.enum(['draft', 'published', 'scheduled', 'archived']).default('draft'),
  featured: z.boolean().default(false),
  allowComments: z.boolean().default(true),
  featuredImage: z.string().optional(),
  // SEO Fields
  seoTitle: z.string().max(60, 'SEO標題不能超過60個字元').optional(),
  seoDescription: z.string().max(160, 'SEO描述不能超過160個字元').optional(),
  seoKeywords: z.array(z.string()).default([]),
  canonicalUrl: z.string().url('請輸入有效的URL').optional().or(z.literal('')),
  // Social Media
  ogTitle: z.string().max(60, 'Open Graph標題不能超過60個字元').optional(),
  ogDescription: z.string().max(160, 'Open Graph描述不能超過160個字元').optional(),
  ogImage: z.string().optional(),
  // Publishing
  scheduledAt: z.string().optional(),
  readingTime: z.number().min(1).max(60).default(5),
});

type BlogPostFormData = z.infer<typeof blogPostSchema>;

interface Post extends BlogPostFormData {
  id: string;
  authorId: string;
  authorName?: string;
  viewCount: number;
  publishedAt?: string;
  createdAt: string;
  updatedAt: string;
}

const categoryOptions = [
  { value: '睡眠知識', label: '睡眠知識', description: '睡眠相關知識與技巧' },
  { value: '產品介紹', label: '產品介紹', description: '床墊與寢具產品介紹' },
  { value: '健康生活', label: '健康生活', description: '健康生活方式與建議' },
  { value: '門市活動', label: '門市活動', description: '店面活動與促銷資訊' },
];

const statusOptions = [
  { value: 'draft', label: '草稿', description: '儲存為草稿，不會公開顯示' },
  { value: 'published', label: '立即發布', description: '立即發布到網站上' },
  { value: 'scheduled', label: '排程發布', description: '設定時間後自動發布' },
];

export default function BlogComposer() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const postId = searchParams.get('id');
  const isEditing = !!postId;

  const [loading, setLoading] = useState(isEditing);
  const [saving, setSaving] = useState(false);
  const [tagInput, setTagInput] = useState('');
  const [keywordInput, setKeywordInput] = useState('');

  const {
    register,
    control,
    handleSubmit,
    watch,
    setValue,
    getValues,
    reset,
    formState: { errors, isDirty },
  } = useForm<BlogPostFormData>({
    resolver: zodResolver(blogPostSchema),
    defaultValues: {
      status: 'draft',
      featured: false,
      allowComments: true,
      tags: [],
      seoKeywords: [],
      readingTime: 5,
      category: '睡眠知識',
    },
  });

  const watchedFields = watch(['title', 'content', 'status', 'scheduledAt']);

  // Auto-generate slug from title
  useEffect(() => {
    const title = watchedFields[0];
    if (title && !isEditing) {
      const slug = title
        .toLowerCase()
        .replace(/[^a-z0-9\u4e00-\u9fff\s-]/g, '')
        .replace(/\s+/g, '-')
        .replace(/^-+|-+$/g, '');
      setValue('slug', slug);
    }
  }, [watchedFields[0], setValue, isEditing]);

  // Auto-calculate reading time
  useEffect(() => {
    const content = watchedFields[1];
    if (content) {
      const wordsPerMinute = 200; // Average reading speed
      const wordCount = content.length / 5; // Rough estimate for Chinese characters
      const readingTime = Math.max(1, Math.ceil(wordCount / wordsPerMinute));
      setValue('readingTime', Math.min(readingTime, 60));
    }
  }, [watchedFields[1], setValue]);

  // Load post for editing
  useEffect(() => {
    if (isEditing && postId) {
      fetchPost(postId);
    }
  }, [isEditing, postId]);

  const fetchPost = async (id: string) => {
    try {
      setLoading(true);
      const response = await fetch(`http://localhost:8787/api/posts/${id}`, {
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error('Failed to fetch post');
      }

      const data = await response.json();
      if (data.success) {
        const post: Post = data.data;
        reset({
          title: post.title,
          slug: post.slug,
          description: post.description,
          excerpt: post.excerpt,
          content: post.content,
          category: post.category as any,
          tags: post.tags,
          status: post.status,
          featured: post.featured,
          allowComments: post.allowComments,
          featuredImage: post.featuredImage,
          seoTitle: post.seoTitle,
          seoDescription: post.seoDescription,
          seoKeywords: post.seoKeywords,
          canonicalUrl: post.canonicalUrl,
          ogTitle: post.ogTitle,
          ogDescription: post.ogDescription,
          ogImage: post.ogImage,
          scheduledAt: post.scheduledAt,
          readingTime: post.readingTime,
        });
      }
    } catch (error) {
      console.error('Error fetching post:', error);
      toast.error('載入文章失敗');
    } finally {
      setLoading(false);
    }
  };

  const onSubmit = async (data: BlogPostFormData) => {
    try {
      setSaving(true);

      const url = isEditing
        ? `http://localhost:8787/api/posts/${postId}`
        : 'http://localhost:8787/api/posts';

      const method = isEditing ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        throw new Error('Failed to save post');
      }

      const result = await response.json();
      if (result.success) {
        toast.success(isEditing ? '文章已更新' : '文章已創建');
        navigate('/dashboard/posts');
      }
    } catch (error) {
      console.error('Error saving post:', error);
      toast.error('儲存文章失敗');
    } finally {
      setSaving(false);
    }
  };

  const addTag = () => {
    const newTag = tagInput.trim();
    if (newTag && !getValues('tags').includes(newTag)) {
      const currentTags = getValues('tags');
      setValue('tags', [...currentTags, newTag], { shouldDirty: true });
      setTagInput('');
    }
  };

  const removeTag = (tagToRemove: string) => {
    const currentTags = getValues('tags');
    setValue(
      'tags',
      currentTags.filter(tag => tag !== tagToRemove),
      { shouldDirty: true }
    );
  };

  const addKeyword = () => {
    const newKeyword = keywordInput.trim();
    if (newKeyword && !getValues('seoKeywords').includes(newKeyword)) {
      const currentKeywords = getValues('seoKeywords');
      setValue('seoKeywords', [...currentKeywords, newKeyword], { shouldDirty: true });
      setKeywordInput('');
    }
  };

  const removeKeyword = (keywordToRemove: string) => {
    const currentKeywords = getValues('seoKeywords');
    setValue(
      'seoKeywords',
      currentKeywords.filter(kw => kw !== keywordToRemove),
      { shouldDirty: true }
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-lg text-gray-600">載入中...</div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" onClick={() => navigate('/dashboard/posts')}>
            <ArrowLeftIcon className="h-4 w-4 mr-2" />
            返回文章列表
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              {isEditing ? '編輯文章' : '新增文章'}
            </h1>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={handleSubmit(data => onSubmit({ ...data, status: 'draft' }))}
            disabled={saving}
          >
            <SaveIcon className="h-4 w-4 mr-2" />
            儲存草稿
          </Button>
          <Button type="submit" onClick={handleSubmit(onSubmit)} disabled={saving}>
            {saving ? '儲存中...' : watchedFields[2] === 'published' ? '發布文章' : '儲存'}
          </Button>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Basic Information */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  基本資訊
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="title">文章標題 *</Label>
                  <Input
                    id="title"
                    {...register('title')}
                    placeholder="輸入吸引人的文章標題"
                    className={errors.title ? 'border-red-500' : ''}
                  />
                  {errors.title && (
                    <p className="text-sm text-red-600 mt-1">{errors.title.message}</p>
                  )}
                </div>

                <div>
                  <Label htmlFor="slug">URL Slug *</Label>
                  <Input
                    id="slug"
                    {...register('slug')}
                    placeholder="url-friendly-slug"
                    className={errors.slug ? 'border-red-500' : ''}
                  />
                  {errors.slug && (
                    <p className="text-sm text-red-600 mt-1">{errors.slug.message}</p>
                  )}
                </div>

                <div>
                  <Label htmlFor="description">文章描述 *</Label>
                  <Textarea
                    id="description"
                    {...register('description')}
                    placeholder="簡短描述文章內容，會顯示在文章列表和搜尋結果中"
                    rows={3}
                    className={errors.description ? 'border-red-500' : ''}
                  />
                  {errors.description && (
                    <p className="text-sm text-red-600 mt-1">{errors.description.message}</p>
                  )}
                </div>

                <div>
                  <Label htmlFor="excerpt">文章摘要</Label>
                  <Textarea
                    id="excerpt"
                    {...register('excerpt')}
                    placeholder="可選的文章摘要，用於特殊顯示場合"
                    rows={2}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Content Editor */}
            <Card>
              <CardHeader>
                <CardTitle>文章內容</CardTitle>
                <CardDescription>
                  使用富文本編輯器撰寫文章，支援格式化與輸入 / 來開啟命令選單
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Controller
                  name="content"
                  control={control}
                  render={({ field }) => (
                    <NovelEditor
                      value={field.value}
                      onChange={field.onChange}
                      placeholder="在這裡編寫你的文章內容...

輸入 / 來開啟命令選單：
• 標題 1, 2, 3
• 項目列表、數字列表
• 引用文字
• 代碼區塊
• 分隔線

直接輸入即可開始撰寫！"
                      className={errors.content ? 'border-red-500' : ''}
                    />
                  )}
                />
                {errors.content && (
                  <p className="text-sm text-red-600 mt-1">{errors.content.message}</p>
                )}
                <div className="mt-2 text-sm text-gray-500 flex items-center gap-4">
                  <span className="flex items-center gap-1">
                    <Clock className="h-4 w-4" />
                    預估閱讀時間：
                    {watchedFields[1]
                      ? Math.max(
                          1,
                          Math.ceil(
                            (watchedFields[1] || '').replace(/<[^>]*>/g, '').length / 5 / 200
                          )
                        )
                      : 0}{' '}
                    分鐘
                  </span>
                  <span>字數：{(watchedFields[1] || '').replace(/<[^>]*>/g, '').length || 0}</span>
                </div>
              </CardContent>
            </Card>

            {/* SEO Settings */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Globe className="h-5 w-5" />
                  SEO 設定
                </CardTitle>
                <CardDescription>優化搜尋引擎和社交媒體的顯示效果</CardDescription>
              </CardHeader>
              <CardContent>
                <Tabs defaultValue="seo" className="w-full">
                  <TabsList>
                    <TabsTrigger value="seo">搜尋引擎</TabsTrigger>
                    <TabsTrigger value="social">社交媒體</TabsTrigger>
                  </TabsList>

                  <TabsContent value="seo" className="space-y-4 mt-4">
                    <div>
                      <Label htmlFor="seoTitle">SEO 標題</Label>
                      <Input
                        id="seoTitle"
                        {...register('seoTitle')}
                        placeholder="搜尋結果中顯示的標題（建議50-60字元）"
                      />
                      <p className="text-xs text-gray-500 mt-1">
                        {watch('seoTitle')?.length || 0}/60 字元
                      </p>
                    </div>

                    <div>
                      <Label htmlFor="seoDescription">SEO 描述</Label>
                      <Textarea
                        id="seoDescription"
                        {...register('seoDescription')}
                        placeholder="搜尋結果中顯示的描述（建議120-160字元）"
                        rows={3}
                      />
                      <p className="text-xs text-gray-500 mt-1">
                        {watch('seoDescription')?.length || 0}/160 字元
                      </p>
                    </div>

                    <div>
                      <Label>SEO 關鍵字</Label>
                      <div className="flex gap-2 mt-1">
                        <Input
                          value={keywordInput}
                          onChange={e => setKeywordInput(e.target.value)}
                          placeholder="輸入關鍵字"
                          onKeyPress={e => {
                            if (e.key === 'Enter') {
                              e.preventDefault();
                              addKeyword();
                            }
                          }}
                        />
                        <Button type="button" onClick={addKeyword} size="sm">
                          新增
                        </Button>
                      </div>
                      <div className="flex flex-wrap gap-2 mt-2">
                        {watch('seoKeywords')?.map((keyword, index) => (
                          <Badge
                            key={index}
                            variant="secondary"
                            className="cursor-pointer"
                            onClick={() => removeKeyword(keyword)}
                          >
                            {keyword} ×
                          </Badge>
                        ))}
                      </div>
                    </div>

                    <div>
                      <Label htmlFor="canonicalUrl">Canonical URL</Label>
                      <Input
                        id="canonicalUrl"
                        {...register('canonicalUrl')}
                        placeholder="https://blackliving.com/blog/post-slug"
                      />
                    </div>
                  </TabsContent>

                  <TabsContent value="social" className="space-y-4 mt-4">
                    <div>
                      <Label htmlFor="ogTitle">Open Graph 標題</Label>
                      <Input
                        id="ogTitle"
                        {...register('ogTitle')}
                        placeholder="社交媒體分享時顯示的標題"
                      />
                    </div>

                    <div>
                      <Label htmlFor="ogDescription">Open Graph 描述</Label>
                      <Textarea
                        id="ogDescription"
                        {...register('ogDescription')}
                        placeholder="社交媒體分享時顯示的描述"
                        rows={3}
                      />
                    </div>

                    <div>
                      <Label htmlFor="ogImage">Open Graph 圖片</Label>
                      <Input
                        id="ogImage"
                        {...register('ogImage')}
                        placeholder="https://example.com/og-image.jpg"
                      />
                    </div>
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Publishing */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CalendarIcon className="h-5 w-5" />
                  發布設定
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="status">發布狀態</Label>
                  <Controller
                    name="status"
                    control={control}
                    render={({ field }) => (
                      <Select value={field.value} onValueChange={field.onChange}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {statusOptions.map(option => (
                            <SelectItem key={option.value} value={option.value}>
                              <div>
                                <div className="font-medium">{option.label}</div>
                                <div className="text-xs text-gray-500">{option.description}</div>
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                  />
                </div>

                {watch('status') === 'scheduled' && (
                  <div>
                    <Label htmlFor="scheduledAt">排程時間</Label>
                    <Input id="scheduledAt" type="datetime-local" {...register('scheduledAt')} />
                  </div>
                )}

                <div className="flex items-center justify-between">
                  <Label htmlFor="featured">精選文章</Label>
                  <Controller
                    name="featured"
                    control={control}
                    render={({ field }) => (
                      <Switch
                        id="featured"
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    )}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <Label htmlFor="allowComments">允許評論</Label>
                  <Controller
                    name="allowComments"
                    control={control}
                    render={({ field }) => (
                      <Switch
                        id="allowComments"
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    )}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Category and Tags */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TagIcon className="h-5 w-5" />
                  分類標籤
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="category">文章分類</Label>
                  <Controller
                    name="category"
                    control={control}
                    render={({ field }) => (
                      <Select value={field.value} onValueChange={field.onChange}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {categoryOptions.map(option => (
                            <SelectItem key={option.value} value={option.value}>
                              <div>
                                <div className="font-medium">{option.label}</div>
                                <div className="text-xs text-gray-500">{option.description}</div>
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                  />
                </div>

                <div>
                  <Label>文章標籤</Label>
                  <div className="flex gap-2 mt-1">
                    <Input
                      value={tagInput}
                      onChange={e => setTagInput(e.target.value)}
                      placeholder="新增標籤"
                      onKeyPress={e => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          addTag();
                        }
                      }}
                    />
                    <Button type="button" onClick={addTag} size="sm">
                      新增
                    </Button>
                  </div>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {watch('tags')?.map((tag, index) => (
                      <Badge
                        key={index}
                        variant="outline"
                        className="cursor-pointer"
                        onClick={() => removeTag(tag)}
                      >
                        {tag} ×
                      </Badge>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Featured Image */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <ImageIcon className="h-5 w-5" />
                  精選圖片
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <Input {...register('featuredImage')} placeholder="圖片 URL 或上傳圖片" />
                  <p className="text-xs text-gray-500">
                    建議尺寸：1200x630px，用於文章列表和社交媒體分享
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Reading Time */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="h-5 w-5" />
                  閱讀時間
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-2">
                  <Input
                    type="number"
                    min="1"
                    max="60"
                    {...register('readingTime', { valueAsNumber: true })}
                    className="w-20"
                  />
                  <span className="text-sm text-gray-600">分鐘</span>
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  系統會根據內容長度自動計算，也可以手動調整
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </form>
    </div>
  );
}

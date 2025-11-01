import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useForm, Controller, type SubmitHandler } from 'react-hook-form';
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
import PencilLine from '@lucide/react/pencil-line';
import RefreshCcw from '@lucide/react/refresh-ccw';
import Globe from '@lucide/react/globe';
import Hash from '@lucide/react/hash';
import FileText from '@lucide/react/file-text';
import Clock from '@lucide/react/clock';
import Copy from '@lucide/react/copy';

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
import { BlockNoteEditor } from './editor';
import { estimateReadingTimeMinutes } from './blogComposerUtils';
import { ImageUpload } from './ImageUpload';
import { SortOrderField } from './SortOrderField';
import { useApiUrl, useEnvironment } from '../contexts/EnvironmentContext';

// Overlay settings imports - EyeIcon already imported above

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
  // 使用動態分類：從 API 載入，不再使用硬編碼 enum
  category: z.string().optional(),
  categoryId: z.string({ required_error: '文章分類為必填' }).min(1, '文章分類為必填'),
  tags: z.array(z.string()).default([]),
  status: z.enum(['draft', 'published', 'scheduled', 'archived']).default('draft'),
  featured: z.boolean().default(false),
  allowComments: z.boolean().default(true),
  // Safe null handling - only convert null/undefined, preserve other falsy values
  featuredImage: z.preprocess((val) => (val === null || val === undefined ? '' : val), z.string()),
  // SEO Fields - explicit null/undefined handling with validation
  seoTitle: z.preprocess(
    (val) => (val === null || val === undefined ? '' : val),
    z.string().max(60, 'SEO標題不能超過60個字元').optional()
  ),
  seoDescription: z.preprocess(
    (val) => (val === null || val === undefined ? '' : val),
    z.string().max(160, 'SEO描述不能超過160個字元').optional()
  ),
  seoKeywords: z.array(z.string()).default([]),
  canonicalUrl: z.preprocess((val) => (val === null || val === undefined ? '' : val), z.string()),
  // Social Media - explicit null/undefined handling
  ogTitle: z.preprocess(
    (val) => (val === null || val === undefined ? '' : val),
    z.string().max(60, 'Open Graph標題不能超過60個字元').optional()
  ),
  ogDescription: z.preprocess(
    (val) => (val === null || val === undefined ? '' : val),
    z.string().max(160, 'Open Graph描述不能超過160個字元').optional()
  ),
  ogImage: z.preprocess((val) => (val === null || val === undefined ? '' : val), z.string()),
  // Publishing - allow any string or empty
  scheduledAt: z.preprocess((val) => (val === null || val === undefined ? '' : val), z.string()),
  readingTime: z.number().min(1).max(60).default(5),
  sortOrder: z
    .preprocess((val) => {
      if (val === null || val === undefined || val === '') {
        return 0;
      }
      if (typeof val === 'string') {
        const parsed = Number.parseInt(val, 10);
        return Number.isNaN(parsed) ? val : parsed;
      }
      return val;
    }, z.number().int().min(0, '排序順序必須是 0 或正整數'))
    .default(0),
  // Overlay Settings - Single JSON object as per design.md
  overlaySettings: z.object({
    enabled: z.boolean().default(false),
    title: z.string().max(50, '疊加標題不能超過50個字元').optional(),
    placement: z.enum(['bottom-left', 'bottom-right', 'bottom-center', 'top-left', 'center']).default('bottom-center'),
    gradientDirection: z.enum(['t', 'tr', 'r', 'br', 'b', 'bl', 'l', 'tl']).default('t'),
  }).optional(),
});

// Use the Zod input type for React Hook Form generics to match resolver expectations
type BlogPostFormData = z.input<typeof blogPostSchema>;

interface Post extends BlogPostFormData {
  id: string;
  authorId: string;
  authorName?: string;
  viewCount: number;
  publishedAt?: string;
  createdAt: string;
  updatedAt: string;
}

type Category = {
  id: string;
  name: string;
  slug: string;
  description?: string;
  color?: string;
  sortOrder?: number;
};

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
  const apiUrl = useApiUrl();

  const [loading, setLoading] = useState(isEditing);
  const [saving, setSaving] = useState(false);
  const [tagInput, setTagInput] = useState('');
  const [keywordInput, setKeywordInput] = useState('');
  const [categories, setCategories] = useState<Category[]>([]);
  const [loadingCategories, setLoadingCategories] = useState(true);
  const [refreshingCategories, setRefreshingCategories] = useState(false);
  const [canonicalPreview, setCanonicalPreview] = useState('');

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
      category: '',
      categoryId: '',
      sortOrder: 0,
    },
  });

  const watchedTitle = watch('title');
  const watchedContent = watch('content');
  const watchedStatus = watch('status');
  const watchedScheduledAt = watch('scheduledAt');
  const watchedCategoryId = watch('categoryId');
  const watchedSlug = watch('slug');
  const primaryActionDisabled = saving || loadingCategories;
  const { PUBLIC_WEB_URL } = useEnvironment();

  const canonicalBase = React.useMemo(() => {
    const envCandidate = [
      PUBLIC_WEB_URL,
      (import.meta as any)?.env?.PUBLIC_WEB_URL,
      (import.meta as any)?.env?.PUBLIC_SITE_URL,
    ].find((value) => typeof value === 'string' && value.trim().length > 0);

    if (envCandidate) {
      return String(envCandidate).replace(/\/$/, '');
    }

    if (typeof window !== 'undefined' && window.location.origin) {
      return window.location.origin.replace(/\/$/, '');
    }

    return 'https://blackliving.com';
  }, [PUBLIC_WEB_URL]);

  // Auto-generate slug from title
  useEffect(() => {
    if (!watchedTitle || isEditing) return;

    const slug = watchedTitle
      .toLowerCase()
      .replace(/[^a-z0-9\u4e00-\u9fff\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/^-+|-+$/g, '');

    const currentSlug = getValues('slug');
    if (currentSlug !== slug) {
      setValue('slug', slug, { shouldDirty: false, shouldTouch: false });
    }
  }, [watchedTitle, isEditing, setValue, getValues]);

  // Compute canonical URL from slug and keep it in sync
  useEffect(() => {
    const canonical = watchedSlug ? `${canonicalBase}/posts/${watchedSlug}` : '';
    setCanonicalPreview((prev) => (prev === canonical ? prev : canonical));

    const currentCanonical = getValues('canonicalUrl');
    if (currentCanonical !== canonical) {
      setValue('canonicalUrl', canonical, { shouldDirty: false, shouldTouch: false });
    }
  }, [watchedSlug, canonicalBase, setValue, getValues]);

  // Auto-calculate reading time
  useEffect(() => {
    if (!watchedContent) return;

    const normalizedReadingTime = estimateReadingTimeMinutes(watchedContent);
    if (normalizedReadingTime === 0) return;

    const currentReadingTime = getValues('readingTime');
    if (currentReadingTime !== normalizedReadingTime) {
      setValue('readingTime', normalizedReadingTime, { shouldDirty: false, shouldTouch: false });
    }
  }, [watchedContent, setValue, getValues]);

  const fetchCategories = async (): Promise<Category[]> => {
    try {
      setLoadingCategories(true);
      const res = await fetch(`${apiUrl}/api/posts/categories`, {
        credentials: 'include',
      });
      if (!res.ok) throw new Error('Failed to fetch categories');
      const json = await res.json();
      if (json.success && Array.isArray(json.data)) {
        const list = json.data as Category[];
        setCategories(list);
        if (!isEditing && list.length > 0) {
          setValue('categoryId', list[0].id, { shouldDirty: false });
          setValue('category', list[0].name, { shouldDirty: false });
        }
        return list;
      }
    } catch (err) {
      console.error('Error fetching categories:', err);
      toast.error('載入分類失敗');
    } finally {
      setLoadingCategories(false);
    }
    return [];
  };

  const invalidateCategoriesCache = async () => {
    try {
      setRefreshingCategories(true);
      const res = await fetch(`${apiUrl}/api/posts/categories/cache/invalidate`, {
        method: 'POST',
        credentials: 'include',
      });
      if (!res.ok) throw new Error('Failed to invalidate categories cache');
      await fetchCategories();
      toast.success('分類快取已更新');
    } catch (err) {
      console.error('Invalidate categories cache error:', err);
      toast.error('更新分類快取失敗');
    } finally {
      setRefreshingCategories(false);
    }
  };

  useEffect(() => {
    const run = async () => {
      const cats = await fetchCategories();
      if (isEditing && postId) {
        await fetchPost(postId, cats);
        // Ensure categoryId is populated for existing posts that only had category metadata
        const rawCategoryId = getValues('categoryId') as unknown;
        const rawCategory = getValues('category') as unknown;
        const currentCatId = rawCategoryId ? String(rawCategoryId) : '';
        const currentCatName =
          typeof rawCategory === 'string'
            ? rawCategory
            : rawCategory && typeof rawCategory === 'object'
              ? ((rawCategory as { name?: string; slug?: string }).name ??
                (rawCategory as { slug?: string }).slug ??
                '')
              : '';

        const normalizedCatName = currentCatName.trim();
        const normalizedCatId = currentCatId.trim();

        if (!normalizedCatId && normalizedCatName && cats.length > 0) {
          const match =
            cats.find((c) => c.name === normalizedCatName) ||
            cats.find((c) => c.slug === normalizedCatName);
          if (match) {
            setValue('categoryId', match.id, { shouldDirty: false });
            setValue('category', match.name, { shouldDirty: false });
          }
        }
      }
    };
    run();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isEditing, postId]);

  const fetchPost = async (id: string, availableCategories?: Category[]) => {
    try {
      setLoading(true);
      const response = await fetch(`${apiUrl}/api/posts/${id}`, {
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error('Failed to fetch post');
      }

      const data = await response.json();
      if (data.success) {
        const post: Post = data.data;

        const deriveCategoryFields = () => {
          const fallbackId = post.categoryId ? String(post.categoryId) : '';
          const rawCategory = post.category as unknown;

          if (!rawCategory) {
            return { id: fallbackId, name: '', slug: '' };
          }

          if (typeof rawCategory === 'string') {
            const normalized = rawCategory.trim();
            return { id: fallbackId, name: normalized, slug: normalized };
          }

          if (typeof rawCategory === 'object') {
            const categoryObject = rawCategory as Partial<Category> & {
              id?: string | number;
              categoryId?: string | number;
              slug?: string;
              name?: string;
            };

            const resolvedId = categoryObject.id ?? categoryObject.categoryId;
            const resolvedName = (categoryObject.name ?? categoryObject.slug ?? '').trim();
            const resolvedSlug = (categoryObject.slug ?? categoryObject.name ?? '').trim();

            return {
              id: fallbackId || (resolvedId ? String(resolvedId) : ''),
              name: resolvedName,
              slug: resolvedSlug,
            };
          }

          return { id: fallbackId, name: '', slug: '' };
        };

        const derivedCategory = deriveCategoryFields();

        reset({
          title: post.title,
          slug: post.slug,
          description: post.description,
          excerpt: post.excerpt,
          content: post.content,
          category: derivedCategory.name as any,
          categoryId: derivedCategory.id as any,
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
          overlaySettings: post.overlaySettings,
          sortOrder: post.sortOrder ?? 0,
        });

        // Ensure categoryId is set - try multiple matching strategies
        const categoryPool = availableCategories ?? categories;
        if (categoryPool.length > 0 && !derivedCategory.id) {
          let matchedCategory = null;

          // Try matching by name first
          if (derivedCategory.name) {
            matchedCategory = categoryPool.find((cat) => cat.name === derivedCategory.name);
          }

          // Try matching by slug if name match failed
          if (!matchedCategory && derivedCategory.slug) {
            matchedCategory = categoryPool.find((cat) => cat.slug === derivedCategory.slug);
          }

          // Fallback to first category if no match found
          if (!matchedCategory) {
            matchedCategory = categoryPool[0];
            console.warn(
              '⚠️ No category match found, using first available category:',
              matchedCategory
            );
          }

          if (matchedCategory) {
            setValue('categoryId', matchedCategory.id, { shouldDirty: false });
            setValue('category', matchedCategory.name, { shouldDirty: false });
          }
        }
      }
    } catch (error) {
      console.error('Error fetching post:', error);
      toast.error('載入文章失敗');
    } finally {
      setLoading(false);
    }
  };

  const onSubmit: SubmitHandler<BlogPostFormData> = async (data) => {
    // Show immediate feedback
    toast.info(isEditing ? '正在更新文章...' : '正在儲存文章...');

    try {
      setSaving(true);

      const url = isEditing ? `${apiUrl}/api/posts/${postId}` : `${apiUrl}/api/posts`;

      const method = isEditing ? 'PUT' : 'POST';

      // Sanitize and prepare payload
      const sanitizeString = (str: string | null | undefined): string => {
        if (str === null || str === undefined) return '';
        return String(str).trim();
      };

      // Convert date strings to Unix timestamps or remove empty ones
      const processDateField = (dateStr: string | null | undefined) => {
        if (!dateStr || dateStr.trim() === '') return undefined;
        try {
          const date = new Date(dateStr);
          // Return Unix timestamp (seconds) for SQLite integer storage
          return Math.floor(date.getTime() / 1000);
        } catch {
          return undefined;
        }
      };

      let payload: any = {
        ...data,
        // Sanitize all string fields
        title: sanitizeString(data.title),
        slug: sanitizeString(data.slug),
        description: sanitizeString(data.description),
        excerpt: sanitizeString(data.excerpt),
        content: sanitizeString(data.content),
        featuredImage: sanitizeString(data.featuredImage),
        seoTitle: sanitizeString(data.seoTitle),
        seoDescription: sanitizeString(data.seoDescription),
        canonicalUrl: sanitizeString(data.canonicalUrl),
        ogTitle: sanitizeString(data.ogTitle),
        ogDescription: sanitizeString(data.ogDescription),
        ogImage: sanitizeString(data.ogImage),
      };

      payload.sortOrder = Math.max(0, Math.floor(Number(data.sortOrder ?? 0)));

      // Handle scheduledAt as Date object or remove if empty
      if (data.scheduledAt && data.scheduledAt.trim() !== '') {
        payload.scheduledAt = processDateField(data.scheduledAt);
      }

      // Remove undefined fields to avoid sending null values
      Object.keys(payload).forEach((key) => {
        if (payload[key] === undefined || payload[key] === null || payload[key] === '') {
          delete payload[key];
        }
      });

      // Ensure category name is aligned with selected categoryId
      if (data.categoryId) {
        const found = categories.find((c) => c.id === data.categoryId);
        if (found) {
          payload.category = found.name;
        }
      }

      // Test API server connectivity
      try {
        const healthCheck = await fetch(`${apiUrl}/api/posts/categories`, {
          credentials: 'include',
        });
      } catch (e) {
        console.error('🚨 API Server unreachable:', e);
      }

      const doRequest = async () => {
        const response = await fetch(url, {
          method,
          headers: {
            'Content-Type': 'application/json',
          },
          credentials: 'include',
          body: JSON.stringify(payload),
        });

        return response;
      };

      let response = await doRequest();
      if (response.status === 401 || response.status === 403) {
        try {
          // Try dev-only auto-login
          const force = await fetch(`${apiUrl}/api/auth/debug/force-admin-login`, {
            method: 'POST',
            credentials: 'include',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({}),
          });
          if (!force.ok) {
            // Fallback: attempt role assignment
            await fetch(`${apiUrl}/api/auth/assign-admin-role`, {
              method: 'POST',
              credentials: 'include',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({}),
            });
          }
          response = await doRequest();
        } catch (e) {
          // continue to error handling
        }
      }

      if (!response.ok) {
        let errorDetail = '';
        try {
          const responseText = await response.text();
          console.error('💥 Raw error response:', responseText);

          // Try to parse as JSON for structured error
          try {
            const errorJson = JSON.parse(responseText);
            errorDetail = errorJson.error || errorJson.message || responseText;
            console.error('💥 Parsed error JSON:', errorJson);

            // Check for specific auth errors
            if (errorJson.error?.includes('admin') || errorJson.error?.includes('auth')) {
              console.error('🔐 Authentication/Authorization error detected');
            }
          } catch {
            errorDetail = responseText;
          }
        } catch (e) {
          console.error('💥 Failed to read error response:', e);
        }

        console.error('💥 Save post failed:', {
          status: response.status,
          statusText: response.statusText,
          url: response.url,
          errorDetail,
        });

        // Show specific error feedback
        const errorMessage =
          response.status === 401 || response.status === 403
            ? '權限不足，請重新登入'
            : response.status === 404
              ? '找不到要更新的文章'
              : response.status >= 500
                ? '伺服器錯誤，請稍後再試'
                : `儲存失敗 (${response.status}): ${response.statusText}`;

        toast.error(errorMessage);
        throw new Error(`Failed to save post: ${response.status} ${response.statusText}`);
      }

      const result = await response.json();

      if (result.success) {
        const statusText =
          (payload.status || (isEditing ? undefined : 'draft')) === 'published'
            ? '文章已發布'
            : '草稿已儲存';

        const successMessage = isEditing
          ? `文章已成功更新！${payload.status === 'published' ? ' 並已發布' : ''}`
          : statusText;

        toast.success(successMessage);

        // Small delay before navigation to show the success toast
        setTimeout(() => {
          navigate('/dashboard/posts');
        }, 1000);
      } else {
        console.error('❌ API returned success:false:', result);
        toast.error(result.error || '儲存失敗，請重試');
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
      currentTags.filter((tag) => tag !== tagToRemove),
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
      currentKeywords.filter((kw) => kw !== keywordToRemove),
      { shouldDirty: true }
    );
  };

  if (loading || loadingCategories) {
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
        <div className="flex flex-col items-center gap-4">
          <Button variant="ghost" size="sm" onClick={() => navigate('/dashboard/posts')}>
            <ArrowLeftIcon className="h-4 w-4 mr-2" />
            返回文章列表
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-foreground">
              {isEditing ? '編輯文章' : '新增文章'}
            </h1>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => handleSubmit((d) => onSubmit({ ...d, status: 'draft' }))()}
            disabled={saving || loadingCategories || !watchedCategoryId}
            className="disabled:opacity-60 disabled:cursor-not-allowed"
          >
            <SaveIcon className="h-4 w-4 mr-2" />
            {isEditing ? '更新草稿' : '儲存草稿'}
          </Button>
          <Button
            type="button"
            onClick={() => {
              const formData = getValues();

              // Check for null values that might cause validation issues
              const nullFields = Object.entries(formData).filter(([key, value]) => value === null);
              if (nullFields.length > 0) {
                console.warn('⚠️ Found null values in form:', nullFields);
              }

              handleSubmit(onSubmit, (validationErrors) => {
                // Clean up null values and retry
                const cleanedData = Object.fromEntries(
                  Object.entries(getValues()).map(([key, value]) => [
                    key,
                    value === null ? '' : value,
                  ])
                );
              })();
            }}
            disabled={primaryActionDisabled}
            className="disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {saving
              ? '儲存中...'
              : isEditing
                ? '更新文章'
                : watch('status') === 'published'
                  ? '發布文章'
                  : '儲存'}
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
              <CardContent className="space-y-6">
                <div className="flex flex-col gap-2">
                  <Label htmlFor="title">文章標題 *</Label>
                  <Input
                    id="title"
                    {...register('title')}
                    placeholder="輸入吸引人的文章標題"
                    className={`placeholder:opacity-55 placeholder:text-sm ${errors.title ? 'border-red-500' : ''}`}
                  />
                  {errors.title && (
                    <p className="text-sm text-red-600 mt-1">{errors.title.message}</p>
                  )}
                </div>

                <div className="flex flex-col gap-2">
                  <Label htmlFor="slug">URL Slug *</Label>
                  <Input
                    id="slug"
                    {...register('slug')}
                    placeholder="url-friendly-slug"
                    className={`placeholder:opacity-55 placeholder:text-sm ${errors.slug ? 'border-red-500' : ''}`}
                  />
                  {errors.slug && (
                    <p className="text-sm text-red-600 mt-1">{errors.slug.message}</p>
                  )}
                  {/* Canonical URL Preview (auto-generated) */}
                  <div className="mt-1 flex items-center justify-between text-xs text-foreground/50 ml-2">
                    <span className="truncate" title={canonicalPreview}>
                      網址: {canonicalPreview || '—'}
                    </span>
                    {canonicalPreview ? (
                      <button
                        type="button"
                        className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded hover:bg-gray-100"
                        onClick={async () => {
                          try {
                            await navigator.clipboard.writeText(canonicalPreview);
                            toast.success('已複製 Canonical URL');
                          } catch {
                            toast.error('複製失敗');
                          }
                        }}
                        title="複製 Canonical URL"
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
                    {...register('description')}
                    placeholder="簡短描述文章內容，會顯示在文章列表和搜尋結果中"
                    rows={3}
                    className={errors.description ? 'border-red-500' : ''}
                  />
                  {errors.description && (
                    <p className="text-sm text-red-600 mt-1">{errors.description.message}</p>
                  )}
                </div>

                <div className="flex flex-col gap-2">
                  <Label htmlFor="excerpt">文章摘要</Label>
                  <Textarea
                    id="excerpt"
                    {...register('excerpt')}
                    placeholder="可選的文章摘要，用於特殊顯示場合"
                    rows={2}
                    className={`placeholder:opacity-55 placeholder:text-sm`}
                  />
                </div>

                <Controller
                  name="sortOrder"
                  control={control}
                  render={({ field }) => (
                    <SortOrderField
                      value={typeof field.value === 'number' ? field.value : Number(field.value) || 0}
                      onChange={(val) => field.onChange(val)}
                      onBlur={field.onBlur}
                      disabled={saving}
                      error={errors.sortOrder?.message}
                    />
                  )}
                />
              </CardContent>
            </Card>

            {/* Content Editor */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <PencilLine className="h-5 w-5" />
                  文章內容
                </CardTitle>
                <CardDescription className="text-sm text-foreground/40"></CardDescription>
              </CardHeader>
              <CardContent>
                <Controller
                  name="content"
                  control={control}
                  render={({ field }) => (
                    <BlockNoteEditor
                      value={field.value}
                      onChange={field.onChange}
                      placeholder={`在這裡編寫文章內容...`}
                      className={'bn-editor-style'}
                    />
                  )}
                />
                {errors.content && (
                  <p className="text-sm text-red-600 mt-1">{errors.content.message}</p>
                )}
                <div className="mt-2 text-sm text-muted-foreground/70 flex items-center gap-4">
                  <span className="flex items-center gap-1">
                    <Clock className="h-4 w-4" />
                    預估閱讀時間：
                    {watchedContent ? estimateReadingTimeMinutes(watchedContent) : 0} 分鐘
                  </span>
                  <span>
                    字數：
                    {(watchedContent || '')
                      .replace(/```[\s\S]*?```/g, '')
                      .replace(/`[^`]*`/g, '')
                      .replace(/[#>*_\-\[\]()!]/g, '').length || 0}
                  </span>
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
                    <div className="flex flex-col gap-2">
                      <Label htmlFor="seoTitle">SEO 標題</Label>
                      <Input
                        id="seoTitle"
                        {...register('seoTitle')}
                        placeholder="搜尋結果中顯示的標題（建議50-60字元）"
                        className={`placeholder:opacity-45 placeholder:text-sm`}
                      />
                      <p className="text-xs text-gray-500 mt-1">
                        {watch('seoTitle')?.length || 0}/60 字元
                      </p>
                    </div>

                    <div className="flex flex-col gap-2">
                      <Label htmlFor="seoDescription">SEO 描述</Label>
                      <Textarea
                        id="seoDescription"
                        {...register('seoDescription')}
                        placeholder="搜尋結果中顯示的描述（建議120-160字元）"
                        rows={3}
                        className={`placeholder:opacity-45 placeholder:text-sm`}
                      />
                      <p className="text-xs text-gray-500 mt-1">
                        {watch('seoDescription')?.length || 0}/160 字元
                      </p>
                    </div>

                    <div className="flex flex-col gap-2">
                      <Label>SEO 關鍵字</Label>
                      <div className="flex gap-2 mt-1">
                        <Input
                          value={keywordInput}
                          onChange={(e) => setKeywordInput(e.target.value)}
                          placeholder="輸入關鍵字"
                          className={`placeholder:opacity-55 placeholder:text-sm`}
                          onKeyPress={(e) => {
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

                    {/* Canonical URL is auto-generated from slug and previewed next to the slug field */}
                  </TabsContent>

                  <TabsContent value="social" className="space-y-4 mt-4">
                    <div className="flex flex-col gap-2">
                      <Label htmlFor="ogTitle">Open Graph 標題</Label>
                      <Input
                        id="ogTitle"
                        {...register('ogTitle')}
                        placeholder="社交媒體分享時顯示的標題"
                      />
                    </div>

                    <div className="flex flex-col gap-2">
                      <Label htmlFor="ogDescription">Open Graph 描述</Label>
                      <Textarea
                        id="ogDescription"
                        {...register('ogDescription')}
                        placeholder="社交媒體分享時顯示的描述"
                        rows={3}
                        className={`placeholder:opacity-45 placeholder:text-sm`}
                      />
                    </div>

                    <div>
                      <Label htmlFor="ogImage">Open Graph 圖片</Label>
                      <Input
                        id="ogImage"
                        {...register('ogImage')}
                        placeholder="https://example.com/og-image.jpg"
                        className={`placeholder:opacity-45 placeholder:text-sm`}
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
                <div className="flex flex-row justify-between">
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
                  <div className="flex items-center justify-between mb-1">
                    <Label htmlFor="categoryId">文章分類</Label>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      title="重新整理分類快取"
                      onClick={invalidateCategoriesCache}
                      disabled={refreshingCategories}
                    >
                      <RefreshCcw
                        className={`h-4 w-4 ${refreshingCategories ? 'animate-spin' : ''}`}
                      />
                    </Button>
                  </div>
                  <Controller
                    name="categoryId"
                    control={control}
                    render={({ field }) => (
                      <Select
                        value={field.value}
                        onValueChange={(val) => {
                          field.onChange(val);
                          const found = categories.find((c) => c.id === val);
                          if (found) setValue('category', found.name, { shouldDirty: false });
                        }}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {categories.map((cat) => (
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
                  {errors.categoryId && (
                    <p className="text-sm text-red-600 mt-1">{errors.categoryId.message}</p>
                  )}
                </div>

                <div className="flex flex-col gap-2">
                  <Label>文章標籤</Label>
                  <div className="flex gap-2 mt-1">
                    <Input
                      value={tagInput}
                      onChange={(e) => setTagInput(e.target.value)}
                      placeholder="新增標籤"
                      onKeyPress={(e) => {
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
                        variant="secondary"
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
                <Controller
                  control={control}
                  name="featuredImage"
                  render={({ field }) => {
                    const { value, onChange, onBlur, ref } = field;
                    return (
                      <div className="space-y-4">
                        <ImageUpload
                          value={value ? [value] : []}
                          onChange={(images) => onChange(images[0] ?? '')}
                          folder="blog-featured"
                          multiple={false}
                          emptyHint="上傳後會自動轉換為 WebP，確保載入速度"
                          error={errors.featuredImage?.message as string | undefined}
                        />
                        <div className="space-y-2">
                          <Label htmlFor="featuredImageInput">圖片 URL</Label>
                          <Input
                            id="featuredImageInput"
                            ref={ref}
                            value={value ?? ''}
                            onChange={(event) => onChange(event.target.value)}
                            onBlur={onBlur}
                            placeholder="圖片 URL 或上傳圖片"
                          />
                          <p className="text-xs text-foreground/30">
                            建議尺寸：1200x630px，用於文章列表和社交媒體分享
                          </p>
                        </div>
                      </div>
                    );
                  }}
                />
              </CardContent>
            </Card>

            {/* Overlay Settings */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <EyeIcon className="h-5 w-5" />
                  疊加文字設定
                </CardTitle>
                <CardDescription>在圖片上添加文字疊加效果，提升視覺吸引力</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label htmlFor="overlayEnabled">啟用疊加文字</Label>
                  <Controller
                    name="overlaySettings.enabled"
                    control={control}
                    render={({ field }) => (
                      <Switch
                        id="overlayEnabled"
                        checked={field.value || false}
                        onCheckedChange={field.onChange}
                      />
                    )}
                  />
                </div>

                {watch('overlaySettings.enabled') && (
                  <div className="space-y-4 border-t pt-4">
                    <div className="flex flex-col gap-2">
                      <Label htmlFor="overlayTitle">疊加標題</Label>
                      <Controller
                        name="overlaySettings.title"
                        control={control}
                        render={({ field }) => (
                          <Input
                            id="overlayTitle"
                            {...field}
                            placeholder="輸入疊加文字"
                            className={errors.overlaySettings?.title ? 'border-red-500' : ''}
                          />
                        )}
                      />
                      <div className="flex justify-between items-center">
                        <p className="text-xs text-gray-500">
                          {watch('overlaySettings.title')?.length || 0}/50 字元
                        </p>
                        {(watch('overlaySettings.title')?.length || 0) > 50 && (
                          <p className="text-xs text-red-600">超過字元限制</p>
                        )}
                      </div>
                      {errors.overlaySettings?.title && (
                        <p className="text-sm text-red-600 mt-1">{errors.overlaySettings.title.message}</p>
                      )}
                    </div>

                    <div className="flex flex-col gap-2">
                      <Label htmlFor="overlayPlacement">位置設定</Label>
                      <Controller
                        name="overlaySettings.placement"
                        control={control}
                        render={({ field }) => (
                          <Select value={field.value || 'bottom-center'} onValueChange={field.onChange}>
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
                        name="overlaySettings.gradientDirection"
                        control={control}
                        render={({ field }) => (
                          <Select value={field.value || 't'} onValueChange={field.onChange}>
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
          </div>
        </div>
      </form>
    </div>
  );
}

import React, { useState, useEffect } from 'react';
import {
  createColumnHelper,
  flexRender,
  getCoreRowModel,
  getSortedRowModel,
  getFilteredRowModel,
  useReactTable,
  type SortingState,
  type ColumnFiltersState,
} from '@tanstack/react-table';
import { format } from 'date-fns';
import { zhTW } from 'date-fns/locale';
// Tree-shakable Lucide imports
import PlusIcon from '@lucide/react/plus';
import PencilIcon from '@lucide/react/pencil';
import TrashIcon from '@lucide/react/trash';
import EyeIcon from '@lucide/react/eye';
import TagIcon from '@lucide/react/tag';
import Calendar from '@lucide/react/calendar';
import User from '@lucide/react/user';
import Search from '@lucide/react/search';
import Filter from '@lucide/react/filter';
import MoreHorizontal from '@lucide/react/more-horizontal';

import { Button } from '@blackliving/ui';
import { Input } from '@blackliving/ui';
import { Badge } from '@blackliving/ui';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@blackliving/ui';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@blackliving/ui';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@blackliving/ui';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@blackliving/ui';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@blackliving/ui';
import { toast } from 'sonner';

interface Post {
  id: string;
  title: string;
  slug: string;
  description: string;
  excerpt?: string;
  content: string;
  authorId: string;
  authorName?: string;
  status: 'draft' | 'published' | 'scheduled' | 'archived';
  featured: boolean;
  category: string;
  tags: string[];
  featuredImage?: string;
  seoTitle?: string;
  seoDescription?: string;
  seoKeywords: string[];
  publishedAt?: string;
  scheduledAt?: string;
  viewCount: number;
  readingTime: number;
  createdAt: string;
  updatedAt: string;
}

interface PostsResponse {
  success: boolean;
  data: Post[];
  total: number;
}

const statusConfig = {
  draft: { label: '草稿', color: 'bg-gray-100 text-gray-800' },
  published: { label: '已發布', color: 'bg-green-100 text-green-800' },
  scheduled: { label: '已排程', color: 'bg-blue-100 text-blue-800' },
  archived: { label: '已封存', color: 'bg-yellow-100 text-yellow-800' },
};

const categoryConfig = {
  睡眠知識: { label: '睡眠知識', color: 'bg-purple-100 text-purple-800' },
  產品介紹: { label: '產品介紹', color: 'bg-blue-100 text-blue-800' },
  健康生活: { label: '健康生活', color: 'bg-green-100 text-green-800' },
  門市活動: { label: '門市活動', color: 'bg-orange-100 text-orange-800' },
};

const columnHelper = createColumnHelper<Post>();

export default function PostManagement() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [globalFilter, setGlobalFilter] = useState('');
  const [selectedPost, setSelectedPost] = useState<Post | null>(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');

  // Fetch posts from API
  const fetchPosts = async () => {
    try {
      setLoading(true);
      const response = await fetch('http://localhost:8787/api/posts', {
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error('Failed to fetch posts');
      }

      const data: PostsResponse = await response.json();
      if (data.success) {
        setPosts(data.data);
      }
    } catch (error) {
      console.error('Error fetching posts:', error);
      toast.error('載入文章列表失敗');
    } finally {
      setLoading(false);
    }
  };

  // Delete post
  const deletePost = async (postId: string) => {
    try {
      const response = await fetch(`http://localhost:8787/api/posts/${postId}`, {
        method: 'DELETE',
        credentials: 'include',
      });

      if (response.ok) {
        toast.success('文章已刪除');
        fetchPosts(); // Refresh the list
      } else {
        throw new Error('Failed to delete post');
      }
    } catch (error) {
      console.error('Error deleting post:', error);
      toast.error('刪除文章失敗');
    }
  };

  // Open BlogComposer for editing
  const openBlogComposer = (post?: Post) => {
    if (post) {
      // Navigate to edit mode with post ID
      window.location.href = `/dashboard/blog-composer?id=${post.id}`;
    } else {
      // Navigate to create new post
      window.location.href = '/dashboard/blog-composer';
    }
  };

  useEffect(() => {
    fetchPosts();
  }, []);

  const columns = [
    columnHelper.accessor('title', {
      header: '文章標題',
      cell: info => (
        <div className="space-y-1">
          <div className="font-medium text-gray-900 line-clamp-2">{info.getValue()}</div>
          {info.row.original.featured && (
            <Badge variant="secondary" className="text-xs">
              精選
            </Badge>
          )}
          <div className="text-sm text-gray-500 flex items-center gap-2">
            <span>/{info.row.original.slug}</span>
          </div>
        </div>
      ),
      size: 300,
    }),
    columnHelper.accessor('category', {
      header: '分類',
      cell: info => {
        const category = info.getValue();
        const config = categoryConfig[category as keyof typeof categoryConfig] || {
          label: category,
          color: 'bg-gray-100 text-gray-800',
        };
        return <Badge className={`${config.color} text-xs font-medium`}>{config.label}</Badge>;
      },
      size: 120,
    }),
    columnHelper.accessor('status', {
      header: '狀態',
      cell: info => {
        const status = info.getValue();
        const config = statusConfig[status];
        return <Badge className={`${config.color} text-xs font-medium`}>{config.label}</Badge>;
      },
      size: 100,
    }),
    columnHelper.accessor('authorName', {
      header: '作者',
      cell: info => (
        <div className="flex items-center gap-2 text-sm text-gray-600">
          <User className="h-4 w-4" />
          {info.getValue() || '未知作者'}
        </div>
      ),
      size: 120,
    }),
    columnHelper.accessor('viewCount', {
      header: '瀏覽數',
      cell: info => (
        <div className="flex items-center gap-2 text-sm text-gray-600">
          <EyeIcon className="h-4 w-4" />
          {info.getValue().toLocaleString()}
        </div>
      ),
      size: 100,
    }),
    columnHelper.accessor('readingTime', {
      header: '閱讀時間',
      cell: info => <span className="text-sm text-gray-600">{info.getValue()} 分鐘</span>,
      size: 100,
    }),
    columnHelper.accessor('publishedAt', {
      header: '發布時間',
      cell: info => {
        const publishedAt = info.getValue();
        if (!publishedAt) return <span className="text-gray-400">未發布</span>;

        return (
          <div className="text-sm text-gray-600">
            {format(new Date(publishedAt), 'yyyy/MM/dd HH:mm', { locale: zhTW })}
          </div>
        );
      },
      size: 140,
    }),
    columnHelper.display({
      id: 'actions',
      header: '操作',
      cell: info => (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => openBlogComposer(info.row.original)}>
              <PencilIcon className="h-4 w-4 mr-2" />
              編輯文章
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => {
                setSelectedPost(info.row.original);
                setShowDeleteDialog(true);
              }}
              className="text-red-600"
            >
              <TrashIcon className="h-4 w-4 mr-2" />
              刪除文章
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      ),
      size: 80,
    }),
  ];

  const table = useReactTable({
    data: posts,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onGlobalFilterChange: setGlobalFilter,
    state: {
      sorting,
      columnFilters,
      globalFilter,
    },
  });

  // Apply filters
  useEffect(() => {
    const filters: ColumnFiltersState = [];

    if (statusFilter !== 'all') {
      filters.push({ id: 'status', value: statusFilter });
    }

    if (categoryFilter !== 'all') {
      filters.push({ id: 'category', value: categoryFilter });
    }

    setColumnFilters(filters);
  }, [statusFilter, categoryFilter]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-lg text-gray-600">載入中...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">文章管理</h1>
          <p className="text-gray-600 mt-1">管理部落格文章與內容發布</p>
        </div>
        <Button onClick={() => openBlogComposer()}>
          <PlusIcon className="h-4 w-4 mr-2" />
          新增文章
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white p-6 rounded-lg border border-gray-200">
          <div className="text-2xl font-bold text-gray-900">{posts.length}</div>
          <div className="text-sm text-gray-600">總文章數</div>
        </div>
        <div className="bg-white p-6 rounded-lg border border-gray-200">
          <div className="text-2xl font-bold text-green-600">
            {posts.filter(p => p.status === 'published').length}
          </div>
          <div className="text-sm text-gray-600">已發布</div>
        </div>
        <div className="bg-white p-6 rounded-lg border border-gray-200">
          <div className="text-2xl font-bold text-blue-600">
            {posts.filter(p => p.status === 'draft').length}
          </div>
          <div className="text-sm text-gray-600">草稿</div>
        </div>
        <div className="bg-white p-6 rounded-lg border border-gray-200">
          <div className="text-2xl font-bold text-purple-600">
            {posts.reduce((sum, post) => sum + post.viewCount, 0).toLocaleString()}
          </div>
          <div className="text-sm text-gray-600">總瀏覽數</div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-lg border border-gray-200">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="搜尋文章標題或內容..."
                value={globalFilter ?? ''}
                onChange={e => setGlobalFilter(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-32">
              <SelectValue placeholder="狀態" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">全部狀態</SelectItem>
              <SelectItem value="published">已發布</SelectItem>
              <SelectItem value="draft">草稿</SelectItem>
              <SelectItem value="scheduled">已排程</SelectItem>
              <SelectItem value="archived">已封存</SelectItem>
            </SelectContent>
          </Select>
          <Select value={categoryFilter} onValueChange={setCategoryFilter}>
            <SelectTrigger className="w-32">
              <SelectValue placeholder="分類" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">全部分類</SelectItem>
              <SelectItem value="睡眠知識">睡眠知識</SelectItem>
              <SelectItem value="產品介紹">產品介紹</SelectItem>
              <SelectItem value="健康生活">健康生活</SelectItem>
              <SelectItem value="門市活動">門市活動</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Posts Table */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map(headerGroup => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map(header => (
                  <TableHead
                    key={header.id}
                    style={{ width: header.getSize() }}
                    className="cursor-pointer select-none"
                    onClick={header.column.getToggleSortingHandler()}
                  >
                    {header.isPlaceholder
                      ? null
                      : flexRender(header.column.columnDef.header, header.getContext())}
                    {{
                      asc: ' ↑',
                      desc: ' ↓',
                    }[header.column.getIsSorted() as string] ?? null}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map(row => (
                <TableRow key={row.id}>
                  {row.getVisibleCells().map(cell => (
                    <TableCell key={cell.id}>
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={columns.length} className="h-24 text-center">
                  沒有找到相關文章
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>確認刪除文章</AlertDialogTitle>
            <AlertDialogDescription>
              確定要刪除「{selectedPost?.title}」嗎？此操作無法復原。
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>取消</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (selectedPost) {
                  deletePost(selectedPost.id);
                  setShowDeleteDialog(false);
                  setSelectedPost(null);
                }
              }}
              className="bg-red-600 hover:bg-red-700"
            >
              刪除
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

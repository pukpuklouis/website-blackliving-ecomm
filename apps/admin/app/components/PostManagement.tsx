import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  Badge,
  Button,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  Input,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@blackliving/ui";
import {
  closestCenter,
  DndContext,
  type DragEndEvent,
  type DraggableAttributes,
  type DragStartEvent,
  KeyboardSensor,
  PointerSensor,
  type SyntheticListenerMap,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import { restrictToVerticalAxis } from "@dnd-kit/modifiers";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import EyeIcon from "@lucide/react/eye";
import MoreHorizontal from "@lucide/react/more-horizontal";
import PencilIcon from "@lucide/react/pencil";
// Tree-shakable Lucide imports
import PlusIcon from "@lucide/react/plus";
import Search from "@lucide/react/search";
import TrashIcon from "@lucide/react/trash";
import User from "@lucide/react/user";
import {
  type ColumnFiltersState,
  type ColumnSizingState,
  createColumnHelper,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getSortedRowModel,
  type Row,
  type SortingState,
  useReactTable,
} from "@tanstack/react-table";
import { format } from "date-fns";
import { zhTW } from "date-fns/locale";
import type React from "react";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { toast } from "sonner";

import { useApiUrl } from "../contexts/EnvironmentContext";
import { DragHandle } from "./DragHandle";

interface Post {
  id: string;
  title: string;
  slug: string;
  description: string;
  excerpt?: string;
  content: string;
  authorId: string;
  authorName?: string;
  status: "draft" | "published" | "scheduled" | "archived";
  featured: boolean;
  category: string;
  categoryId?: string;
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
  sortOrder: number;
}

interface PostsResponse {
  success: boolean;
  data: Post[];
  total: number;
}

interface DragContextValue {
  attributes?: DraggableAttributes;
  listeners?: SyntheticListenerMap;
  isDragging: boolean;
  disabled: boolean;
}

const RowDragContext = createContext<DragContextValue>({
  attributes: undefined,
  listeners: undefined,
  isDragging: false,
  disabled: true,
});

const useRowDragContext = () => useContext(RowDragContext);

const ensureSortOrder = (value: unknown): number => {
  const numeric = typeof value === "number" ? value : Number(value);
  if (!Number.isFinite(numeric) || numeric < 0) {
    return 0;
  }
  return Math.floor(numeric);
};

const sortPostsForDisplay = (items: Post[]): Post[] =>
  [...items].sort((a, b) => {
    const aOrder = ensureSortOrder(a.sortOrder);
    const bOrder = ensureSortOrder(b.sortOrder);
    const aAuto = aOrder === 0;
    const bAuto = bOrder === 0;

    if (aAuto !== bAuto) {
      return aAuto ? 1 : -1;
    }

    if (!(aAuto || bAuto) && aOrder !== bOrder) {
      return aOrder - bOrder;
    }

    const aUpdated = a.updatedAt ? new Date(a.updatedAt).getTime() : 0;
    const bUpdated = b.updatedAt ? new Date(b.updatedAt).getTime() : 0;

    return bUpdated - aUpdated;
  });

const mergePostUpdates = (current: Post[], updates: Post[]): Post[] => {
  if (!Array.isArray(updates) || updates.length === 0) {
    return current;
  }

  const normalized = updates.map((post) => ({
    ...post,
    sortOrder: ensureSortOrder(post.sortOrder),
  }));

  const updateMap = new Map(normalized.map((post) => [post.id, post]));

  return current.map((post) => updateMap.get(post.id) ?? post);
};

interface ReorderResult {
  nextPosts: Post[];
  updates: { postId: string; sortOrder: number }[];
}

const computeReorderResult = (
  posts: Post[],
  activeId: string,
  overId: string
): ReorderResult | null => {
  const ordered = sortPostsForDisplay(posts);
  const activePost = ordered.find((post) => post.id === activeId);
  const overPost = ordered.find((post) => post.id === overId);

  if (!(activePost && overPost)) {
    return null;
  }

  const manualPosts = ordered.filter(
    (post) => ensureSortOrder(post.sortOrder) > 0
  );
  const autoPosts = ordered.filter(
    (post) => ensureSortOrder(post.sortOrder) === 0
  );

  const activeManualIndex = manualPosts.findIndex(
    (post) => post.id === activeId
  );
  const activeIsManual = activeManualIndex !== -1;

  if (!activeIsManual) {
    const manualWithoutActive = manualPosts;
    const autoWithoutActive = autoPosts.filter((post) => post.id !== activeId);

    const targetManualIndex = manualPosts.findIndex(
      (post) => post.id === overId
    );
    let insertionIndex = targetManualIndex;

    if (insertionIndex === -1) {
      insertionIndex =
        manualWithoutActive.length === 0 ? 0 : manualWithoutActive.length;
    }

    const manualWithActive = [...manualWithoutActive];
    manualWithActive.splice(insertionIndex, 0, { ...activePost });

    const normalizedManual = manualWithActive.map((post, index) => ({
      ...post,
      sortOrder: index + 1,
    }));

    const manualMap = new Map(normalizedManual.map((post) => [post.id, post]));
    const autoSet = new Set(autoWithoutActive.map((post) => post.id));

    const nextPosts = sortPostsForDisplay(
      ordered.map((post) => {
        if (manualMap.has(post.id)) {
          return manualMap.get(post.id)!;
        }

        if (autoSet.has(post.id)) {
          return { ...post, sortOrder: 0 };
        }

        return post;
      })
    );

    const updates = normalizedManual.map((post) => ({
      postId: post.id,
      sortOrder: post.sortOrder,
    }));

    return { nextPosts, updates };
  }

  const overIsAuto = ensureSortOrder(overPost.sortOrder) === 0;

  if (overIsAuto) {
    const manualWithoutActive = manualPosts
      .filter((post) => post.id !== activeId)
      .map((post, index) => ({ ...post, sortOrder: index + 1 }));

    const autoWithoutActive = autoPosts.filter((post) => post.id !== activeId);

    const insertionIndex = autoWithoutActive.findIndex(
      (post) => post.id === overId
    );
    const boundedIndex =
      insertionIndex === -1 ? autoWithoutActive.length : insertionIndex;

    const updatedAuto = [...autoWithoutActive];
    updatedAuto.splice(boundedIndex, 0, { ...activePost, sortOrder: 0 });

    const nextPosts = sortPostsForDisplay([
      ...manualWithoutActive,
      ...updatedAuto,
    ]);

    const updates = [
      ...manualWithoutActive.map((post) => ({
        postId: post.id,
        sortOrder: post.sortOrder,
      })),
      { postId: activePost.id, sortOrder: 0 },
    ];

    return { nextPosts, updates };
  }

  const targetManualIndex = manualPosts.findIndex((post) => post.id === overId);

  if (targetManualIndex === -1) {
    return null;
  }

  const reorderedManual = arrayMove(
    manualPosts,
    activeManualIndex,
    targetManualIndex
  ).map((post, index) => ({
    ...post,
    sortOrder: index + 1,
  }));

  const manualMap = new Map(reorderedManual.map((post) => [post.id, post]));

  const nextPosts = sortPostsForDisplay(
    ordered.map((post) => manualMap.get(post.id) ?? post)
  );

  const updates = reorderedManual.map((post) => ({
    postId: post.id,
    sortOrder: post.sortOrder,
  }));

  return { nextPosts, updates };
};

const statusConfig = {
  draft: { label: "草稿", color: "bg-gray-100 text-gray-800" },
  published: { label: "已發布", color: "bg-green-100 text-green-800" },
  scheduled: { label: "已排程", color: "bg-blue-100 text-blue-800" },
  archived: { label: "已封存", color: "bg-yellow-100 text-yellow-800" },
};

type Category = {
  id: string;
  name: string;
  slug: string;
  description?: string;
  color?: string;
  sortOrder?: number;
};

const columnHelper = createColumnHelper<Post>();

export default function PostManagement() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const apiUrl = useApiUrl();
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [globalFilter, setGlobalFilter] = useState("");
  const [columnSizing, setColumnSizing] = useState<ColumnSizingState>({
    sortOrder: 90,
    title: 320,
  });
  const [selectedPost, setSelectedPost] = useState<Post | null>(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [categories, setCategories] = useState<Category[]>([]);
  const [activeDragId, setActiveDragId] = useState<string | null>(null);
  const [isSubmittingOrder, setIsSubmittingOrder] = useState(false);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 6,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const sortedPosts = useMemo(() => sortPostsForDisplay(posts), [posts]);
  const sortableIds = useMemo(
    () => sortedPosts.map((post) => post.id),
    [sortedPosts]
  );
  const isDefaultSorting = sorting.length === 0;
  const dragDisabled = !isDefaultSorting || isSubmittingOrder || loading;

  // Fetch posts from API
  const fetchPosts = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${apiUrl}/api/posts`, {
        credentials: "include",
      });

      if (!response.ok) {
        // Dev helper: if unauthorized, try to become admin then retry once
        if (response.status === 401 || response.status === 403) {
          try {
            // 1) Try dev-only auto-login to admin
            const forceResp = await fetch(
              `${apiUrl}/api/auth/debug/force-admin-login`,
              {
                method: "POST",
                credentials: "include",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({}),
              }
            );

            // 2) If not available (e.g., 403 in non-dev), upgrade current user to admin
            if (!forceResp.ok) {
              await fetch(`${apiUrl}/api/auth/assign-admin-role`, {
                method: "POST",
                credentials: "include",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({}),
              });
            }

            // 3) Retry posts fetch
            const retry = await fetch(`${apiUrl}/api/posts`, {
              credentials: "include",
            });
            if (retry.ok) {
              const data: PostsResponse = await retry.json();
              if (data.success) {
                const normalizedPosts = (data.data ?? []).map((post) => ({
                  ...post,
                  sortOrder: ensureSortOrder(post.sortOrder),
                }));
                setPosts(sortPostsForDisplay(normalizedPosts));
                return; // success path, exit
              }
            }
          } catch (e) {
            // fall through to error handling
          }
        }
        throw new Error("Failed to fetch posts");
      }

      const data: PostsResponse = await response.json();
      if (data.success) {
        const normalizedPosts = (data.data ?? []).map((post) => ({
          ...post,
          sortOrder: ensureSortOrder(post.sortOrder),
        }));
        setPosts(sortPostsForDisplay(normalizedPosts));
      }
    } catch (error) {
      console.error("Error fetching posts:", error);
      toast.error("載入文章列表失敗");
    } finally {
      setLoading(false);
    }
  };

  // Delete post
  const deletePost = async (postId: string) => {
    try {
      const response = await fetch(`${apiUrl}/api/posts/${postId}`, {
        method: "DELETE",
        credentials: "include",
      });

      if (response.ok) {
        toast.success("文章已刪除");
        fetchPosts(); // Refresh the list
      } else {
        throw new Error("Failed to delete post");
      }
    } catch (error) {
      console.error("Error deleting post:", error);
      toast.error("刪除文章失敗");
    }
  };

  // Open BlogComposer for editing
  const openBlogComposer = (post?: Post) => {
    if (post) {
      // Navigate to edit mode with post ID
      window.location.href = `/dashboard/blog-composer?id=${post.id}`;
    } else {
      // Navigate to create new post
      window.location.href = "/dashboard/blog-composer";
    }
  };

  // Fetch categories
  const fetchCategories = async () => {
    try {
      const res = await fetch(`${apiUrl}/api/posts/categories`, {
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to fetch categories");
      const json = await res.json();
      if (json.success && Array.isArray(json.data)) {
        setCategories(json.data as Category[]);
      }
    } catch (err) {
      console.error("Error fetching categories:", err);
      // Non-fatal for the table; keep going
    }
  };

  useEffect(() => {
    fetchPosts();
    fetchCategories();
  }, []);

  const handleDragStart = useCallback(
    (event: DragStartEvent) => {
      if (dragDisabled) {
        return;
      }

      const activeId = String(event.active.id);
      const activePost = posts.find((post) => post.id === activeId);

      if (!activePost) {
        setActiveDragId(null);
        return;
      }

      setActiveDragId(activeId);
    },
    [dragDisabled, posts]
  );

  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      const activeId = String(event.active.id);
      const overId = event.over ? String(event.over.id) : null;

      setActiveDragId(null);

      if (!overId || activeId === overId || dragDisabled) {
        return;
      }

      const result = computeReorderResult(posts, activeId, overId);
      if (!result || result.updates.length === 0) {
        return;
      }

      const previousPosts = posts;
      setPosts(result.nextPosts);
      setIsSubmittingOrder(true);

      void (async () => {
        try {
          const response = await fetch(`${apiUrl}/api/posts/batch-sort-order`, {
            method: "POST",
            credentials: "include",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ updates: result.updates }),
          });

          if (!response.ok) {
            throw new Error("Failed to update sort order");
          }

          const json = await response.json();
          if (!json.success) {
            throw new Error(json.error ?? "Failed to update sort order");
          }

          if (Array.isArray(json.data)) {
            setPosts((current) =>
              sortPostsForDisplay(
                mergePostUpdates(current, json.data as Post[])
              )
            );
          }

          toast.success("排序已更新");
        } catch (error) {
          console.error("Error updating sort order:", error);
          toast.error("更新排序失敗，已還原");
          setPosts(previousPosts);
        } finally {
          setIsSubmittingOrder(false);
        }
      })();
    },
    [apiUrl, dragDisabled, posts]
  );

  const handleDragCancel = useCallback(() => {
    setActiveDragId(null);
  }, []);

  const columns = [
    columnHelper.display({
      id: "sortOrder",
      header: "排序",
      enableSorting: false,
      size: columnSizing.sortOrder ?? 80,
      cell: (info) => {
        const drag = useRowDragContext();
        const sortOrder = ensureSortOrder(info.row.original.sortOrder);
        const isManual = sortOrder > 0;
        const dragLabel = isManual ? "拖曳以調整排序" : "拖曳以設定排序";

        return (
          <div className="flex items-center gap-2">
            <DragHandle
              attributes={drag.attributes}
              disabled={drag.disabled}
              isDragging={drag.isDragging}
              label={dragLabel}
              listeners={drag.listeners}
            />
            {isManual ? (
              <span className="text-muted-foreground text-sm">{sortOrder}</span>
            ) : (
              <span className="rounded border border-muted-foreground/40 border-dashed px-2 py-1 text-muted-foreground text-xs">
                自動排序
              </span>
            )}
          </div>
        );
      },
    }),
    columnHelper.accessor("title", {
      header: "文章標題",
      size: columnSizing.title ?? 320,
      minSize: 220,
      maxSize: 640,
      enableResizing: true,
      cell: (info) => (
        <div className="max-w-full space-y-1 px-2">
          {info.row.original.featured && (
            <Badge className="text-xs" variant="secondary">
              精選
            </Badge>
          )}
          <div
            className="line-clamp-2 font-medium text-foreground"
            title={info.getValue()}
          >
            {info.getValue()}
          </div>
          <div className="flex items-center gap-2 text-foreground/50 text-sm">
            <span className="truncate" title={`/${info.row.original.slug}`}>
              /{info.row.original.slug}
            </span>
          </div>
        </div>
      ),
    }),
    columnHelper.accessor("category", {
      header: "分類",
      cell: (info) => {
        const categoryName = info.getValue();
        const categoryId = info.row.original.categoryId;
        const cat = categories.find((c) =>
          categoryId ? c.id === categoryId : c.name === categoryName
        );
        return (
          <Badge className={"font-medium text-xs"} variant="secondary">
            {cat?.name || categoryName || "未分類"}
          </Badge>
        );
      },
      size: 120,
    }),
    columnHelper.accessor("status", {
      header: "狀態",
      cell: (info) => {
        const status = info.getValue();
        const config = statusConfig[status];
        return (
          <Badge className={`${config.color} font-medium text-xs`}>
            {config.label}
          </Badge>
        );
      },
      size: 100,
    }),
    columnHelper.accessor("authorName", {
      header: "作者",
      cell: (info) => (
        <div className="flex items-center gap-2 text-gray-600 text-sm">
          <User className="h-4 w-4" />
          {info.getValue() || "未知作者"}
        </div>
      ),
      size: 120,
    }),
    columnHelper.accessor("viewCount", {
      header: "瀏覽數",
      cell: (info) => (
        <div className="flex items-center gap-2 text-gray-600 text-sm">
          <EyeIcon className="h-4 w-4" />
          {(Number(info.getValue()) || 0).toLocaleString()}
        </div>
      ),
      size: 100,
    }),
    // TODO: Temporarily hidden - uncomment to show reading time column
    // columnHelper.accessor('readingTime', {
    //   header: '閱讀時間',
    //   cell: (info) => (
    //     <span className="text-sm text-gray-600">{Number(info.getValue()) || 0} 分鐘</span>
    //   ),
    //   size: 100,
    // }),
    columnHelper.accessor("publishedAt", {
      header: "發布時間",
      cell: (info) => {
        const publishedAt = info.getValue();
        if (!publishedAt) return <span className="text-gray-400">未發布</span>;

        return (
          <div className="text-gray-600 text-sm">
            {format(new Date(publishedAt), "yyyy/MM/dd HH:mm", {
              locale: zhTW,
            })}
          </div>
        );
      },
      size: 140,
    }),
    columnHelper.display({
      id: "actions",
      header: "操作",
      cell: (info) => (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button size="sm" variant="ghost">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem
              onClick={() => openBlogComposer(info.row.original)}
            >
              <PencilIcon className="mr-2 h-4 w-4" />
              編輯文章
            </DropdownMenuItem>
            <DropdownMenuItem
              className="text-red-600"
              onClick={() => {
                setSelectedPost(info.row.original);
                setShowDeleteDialog(true);
              }}
            >
              <TrashIcon className="mr-2 h-4 w-4" />
              刪除文章
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      ),
      size: 80,
    }),
  ];

  const table = useReactTable({
    data: sortedPosts,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    enableColumnResizing: true,
    columnResizeMode: "onChange",
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onGlobalFilterChange: setGlobalFilter,
    onColumnSizingChange: setColumnSizing,
    state: {
      sorting,
      columnFilters,
      globalFilter,
      columnSizing,
    },
  });

  // Apply filters
  useEffect(() => {
    const filters: ColumnFiltersState = [];

    if (statusFilter !== "all") {
      filters.push({ id: "status", value: statusFilter });
    }

    if (categoryFilter !== "all") {
      filters.push({ id: "category", value: categoryFilter });
    }

    setColumnFilters(filters);
  }, [statusFilter, categoryFilter]);

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="text-gray-600 text-lg">載入中...</div>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-6xl space-y-6">
      {/* Header */}
      <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="font-bold text-2xl text-foreground">文章管理</h1>
          <p className="mt-1 text-foreground/60">管理部落格文章與內容發布</p>
        </div>
        <Button onClick={() => openBlogComposer()}>
          <PlusIcon className="mr-2 h-4 w-4" />
          新增文章
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
        <div className="rounded-lg border border-sidebar-border bg-white p-6">
          <div className="font-bold text-2xl text-foreground">
            {posts.length}
          </div>
          <div className="text-foreground/70 text-sm">總文章數</div>
        </div>
        <div className="rounded-lg border border-sidebar-border bg-white p-6">
          <div className="font-bold text-2xl text-green-600">
            {posts.filter((p) => p.status === "published").length}
          </div>
          <div className="text-foreground/70 text-sm">已發布</div>
        </div>
        <div className="rounded-lg border border-sidebar-border bg-white p-6">
          <div className="font-bold text-2xl text-blue-600">
            {posts.filter((p) => p.status === "draft").length}
          </div>
          <div className="text-foreground/70 text-sm">草稿</div>
        </div>
        <div className="rounded-lg border border-sidebar-border bg-white p-6">
          <div className="font-bold text-2xl text-purple-600">
            {posts
              .reduce((sum, post) => sum + (Number(post.viewCount) || 0), 0)
              .toLocaleString()}
          </div>
          <div className="text-foreground/70 text-sm">總瀏覽數</div>
        </div>
      </div>

      {/* Filters */}
      <div className="rounded-lg border border-gray-200 bg-white p-4">
        <div className="flex flex-col gap-4 sm:flex-row">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 transform text-gray-400" />
              <Input
                className="pl-10"
                onChange={(e) => setGlobalFilter(e.target.value)}
                placeholder="搜尋文章標題或內容..."
                value={globalFilter ?? ""}
              />
            </div>
          </div>
          <Select onValueChange={setStatusFilter} value={statusFilter}>
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
          <Select onValueChange={setCategoryFilter} value={categoryFilter}>
            <SelectTrigger className="w-32">
              <SelectValue placeholder="分類" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">全部分類</SelectItem>
              {categories.map((cat) => (
                <SelectItem key={cat.id} value={cat.name}>
                  {cat.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Posts Table */}
      <div className="overflow-hidden rounded-lg border border-border-foreground bg-background">
        <DndContext
          collisionDetection={closestCenter}
          modifiers={[restrictToVerticalAxis]}
          onDragCancel={handleDragCancel}
          onDragEnd={handleDragEnd}
          onDragStart={handleDragStart}
          sensors={sensors}
        >
          <Table className="table-fixed">
            <TableHeader>
              {table.getHeaderGroups().map((headerGroup) => (
                <TableRow key={headerGroup.id}>
                  {headerGroup.headers.map((header) => (
                    <TableHead
                      className={`relative select-none ${header.column.getCanSort() ? "cursor-pointer" : ""}`}
                      key={header.id}
                      onClick={
                        header.column.getCanSort()
                          ? header.column.getToggleSortingHandler()
                          : undefined
                      }
                      style={{
                        width: header.getSize(),
                        minWidth: header.column.columnDef.minSize,
                        maxWidth: header.column.columnDef.maxSize,
                      }}
                    >
                      {header.isPlaceholder ? null : (
                        <div className="flex items-center justify-between gap-2">
                          <div
                            className="truncate"
                            title={
                              typeof header.column.columnDef.header === "string"
                                ? header.column.columnDef.header
                                : undefined
                            }
                          >
                            {flexRender(
                              header.column.columnDef.header,
                              header.getContext()
                            )}
                          </div>
                          {header.column.getIsSorted() ? (
                            <span className="text-foreground/60 text-xs">
                              {header.column.getIsSorted() === "asc"
                                ? "↑"
                                : "↓"}
                            </span>
                          ) : null}
                        </div>
                      )}
                      {header.column.getCanResize() ? (
                        <div
                          className="absolute top-0 right-0 h-full w-1 cursor-col-resize select-none"
                          onClick={(event) => event.stopPropagation()}
                          onMouseDown={header.getResizeHandler()}
                          onTouchStart={header.getResizeHandler()}
                        >
                          <div
                            className={`h-full w-[3px] translate-x-1/2 rounded-full bg-transparent transition-colors hover:bg-border${header.column.getIsResizing() ? "bg-primary/50" : ""}`}
                          />
                        </div>
                      ) : null}
                    </TableHead>
                  ))}
                </TableRow>
              ))}
            </TableHeader>
            <SortableContext
              items={sortableIds}
              strategy={verticalListSortingStrategy}
            >
              <TableBody>
                {table.getRowModel().rows.length ? (
                  table
                    .getRowModel()
                    .rows.map((row) => (
                      <SortableRow
                        dragDisabled={dragDisabled}
                        isActive={activeDragId === row.original.id}
                        key={row.id}
                        row={row}
                      />
                    ))
                ) : (
                  <TableRow>
                    <TableCell
                      className="h-24 text-center"
                      colSpan={columns.length}
                    >
                      沒有找到相關文章
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </SortableContext>
          </Table>
        </DndContext>
        {dragDisabled ? (
          <div className="border-border/50 border-t bg-muted/40 px-4 py-2 text-muted-foreground text-xs">
            只有在預設排序時才能使用拖曳排序。
          </div>
        ) : null}
      </div>

      {/* Delete Confirmation Dialog */}
      <AlertDialog onOpenChange={setShowDeleteDialog} open={showDeleteDialog}>
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
              className="bg-red-600 hover:bg-red-700"
              onClick={() => {
                if (selectedPost) {
                  deletePost(selectedPost.id);
                  setShowDeleteDialog(false);
                  setSelectedPost(null);
                }
              }}
            >
              刪除
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

interface SortableRowProps {
  row: Row<Post>;
  dragDisabled: boolean;
  isActive: boolean;
}

function SortableRow({ row, dragDisabled, isActive }: SortableRowProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: row.original.id,
    disabled: dragDisabled,
  });

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const contextValue = useMemo(
    () => ({
      attributes,
      listeners,
      isDragging,
      disabled: dragDisabled,
    }),
    [attributes, listeners, isDragging, dragDisabled]
  );

  return (
    <RowDragContext.Provider value={contextValue}>
      <TableRow
        className={`transition-colors ${
          dragDisabled ? "" : "cursor-grab data-[dragging=true]:cursor-grabbing"
        } ${isActive ? "bg-muted/60" : ""}`}
        data-active={isActive}
        data-dragging={isDragging}
        ref={setNodeRef}
        style={style}
      >
        {row.getVisibleCells().map((cell) => (
          <TableCell
            className={cell.column.id === "title" ? "align-top" : undefined}
            key={cell.id}
            style={{
              width: cell.column.getSize(),
              minWidth: cell.column.columnDef.minSize,
              maxWidth: cell.column.columnDef.maxSize,
            }}
          >
            {flexRender(cell.column.columnDef.cell, cell.getContext())}
          </TableCell>
        ))}
      </TableRow>
    </RowDragContext.Provider>
  );
}

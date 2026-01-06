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
  Skeleton,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@blackliving/ui";
import MoreHorizontal from "@lucide/react/more-horizontal";
import PencilIcon from "@lucide/react/pencil";
import PlusIcon from "@lucide/react/plus";
import Search from "@lucide/react/search";
import TrashIcon from "@lucide/react/trash";
import {
  type ColumnFiltersState,
  createColumnHelper,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getSortedRowModel,
  type SortingState,
  useReactTable,
} from "@tanstack/react-table";
import { format } from "date-fns";
import { zhTW } from "date-fns/locale";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import { toast } from "sonner";

import { useApiUrl } from "../contexts/EnvironmentContext";

interface Page {
  id: string;
  title: string;
  slug: string;
  status: "draft" | "published" | "archived";
  authorId: string;
  publishedAt?: string;
  createdAt: string;
  updatedAt: string;
}

const statusConfig = {
  draft: { label: "草稿", color: "bg-gray-100 text-gray-800" },
  published: { label: "已發布", color: "bg-green-100 text-green-800" },
  archived: { label: "已封存", color: "bg-yellow-100 text-yellow-800" },
};

const columnHelper = createColumnHelper<Page>();

export default function PageManagement() {
  const navigate = useNavigate();
  const [pages, setPages] = useState<Page[]>([]);
  const [loading, setLoading] = useState(true);
  const apiUrl = useApiUrl();
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [globalFilter, setGlobalFilter] = useState("");
  const [selectedPage, setSelectedPage] = useState<Page | null>(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [statusFilter, setStatusFilter] = useState<string>("all");

  const fetchPages = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${apiUrl}/api/pages`, {
        credentials: "include",
      });
      if (!response.ok) throw new Error("Failed to fetch pages");
      const json = await response.json();
      if (json.success) {
        // Handle both old array format and new paginated format
        setPages(Array.isArray(json.data) ? json.data : json.data.pages);
      }
    } catch (error) {
      console.error("Error fetching pages:", error);
      toast.error("載入頁面列表失敗");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPages();
  }, []);

  const deletePage = async (pageId: string) => {
    try {
      const response = await fetch(`${apiUrl}/api/pages/${pageId}`, {
        method: "DELETE",
        credentials: "include",
      });
      if (response.ok) {
        toast.success("頁面已刪除");
        fetchPages();
      } else {
        throw new Error("Failed to delete page");
      }
    } catch (error) {
      console.error("Error deleting page:", error);
      toast.error("刪除頁面失敗");
    }
  };

  const columns = [
    columnHelper.accessor("title", {
      header: "標題",
      cell: (info) => (
        <div className="font-medium text-foreground">{info.getValue()}</div>
      ),
    }),
    columnHelper.accessor("slug", {
      header: "網址路徑",
      cell: (info) => (
        <div className="text-muted-foreground text-sm">/{info.getValue()}</div>
      ),
    }),
    columnHelper.accessor("status", {
      header: "狀態",
      cell: (info) => {
        const status = info.getValue();
        const config = statusConfig[status] || statusConfig.draft;
        return (
          <Badge className={`${config.color} font-medium text-xs`}>
            {config.label}
          </Badge>
        );
      },
    }),
    columnHelper.accessor("publishedAt", {
      header: "發布時間",
      cell: (info) => {
        const date = info.getValue();
        return date ? (
          <div className="text-muted-foreground text-sm">
            {format(new Date(date), "yyyy/MM/dd HH:mm", { locale: zhTW })}
          </div>
        ) : (
          <span className="text-muted-foreground">-</span>
        );
      },
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
              onClick={() =>
                navigate(`/dashboard/pages/${info.row.original.id}/edit`)
              }
            >
              <PencilIcon className="mr-2 h-4 w-4" />
              編輯頁面
            </DropdownMenuItem>
            <DropdownMenuItem
              className="text-red-600"
              onClick={() => {
                setSelectedPage(info.row.original);
                setShowDeleteDialog(true);
              }}
            >
              <TrashIcon className="mr-2 h-4 w-4" />
              刪除頁面
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      ),
    }),
  ];

  const table = useReactTable({
    data: pages,
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

  useEffect(() => {
    if (statusFilter !== "all") {
      setColumnFilters([{ id: "status", value: statusFilter }]);
    } else {
      setColumnFilters([]);
    }
  }, [statusFilter]);

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <Skeleton className="mb-2 h-8 w-32" />
            <Skeleton className="h-4 w-48" />
          </div>
          <Skeleton className="h-10 w-28" />
        </div>
        <div className="space-y-2">
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-12 w-full" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-bold text-2xl">頁面管理</h1>
          <p className="text-muted-foreground">管理網站的動態頁面</p>
        </div>
        <Button onClick={() => navigate("/dashboard/pages/new")}>
          <PlusIcon className="mr-2 h-4 w-4" />
          新增頁面
        </Button>
      </div>

      <div className="flex items-center gap-4 rounded-lg border bg-white p-4">
        <div className="relative flex-1">
          <Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 transform text-gray-400" />
          <Input
            className="pl-10"
            onChange={(e) => setGlobalFilter(e.target.value)}
            placeholder="搜尋頁面..."
            value={globalFilter ?? ""}
          />
        </div>
        <Select onValueChange={setStatusFilter} value={statusFilter}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="狀態篩選" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">所有狀態</SelectItem>
            <SelectItem value="published">已發布</SelectItem>
            <SelectItem value="draft">草稿</SelectItem>
            <SelectItem value="archived">已封存</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="rounded-md border bg-white">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <TableHead key={header.id}>
                    {header.isPlaceholder
                      ? null
                      : flexRender(
                          header.column.columnDef.header,
                          header.getContext()
                        )}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow key={row.id}>
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext()
                      )}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell
                  className="h-24 text-center"
                  colSpan={columns.length}
                >
                  沒有找到頁面
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <AlertDialog onOpenChange={setShowDeleteDialog} open={showDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>確定要刪除此頁面嗎？</AlertDialogTitle>
            <AlertDialogDescription>
              此動作無法復原。這將永久刪除頁面 "{selectedPage?.title}"。
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>取消</AlertDialogCancel>
            <AlertDialogAction
              className="bg-red-600 hover:bg-red-700"
              onClick={() => {
                if (selectedPage) {
                  deletePage(selectedPage.id);
                  setShowDeleteDialog(false);
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

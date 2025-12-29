import {
  Badge,
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  Input,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@blackliving/ui";
import Calendar from "@lucide/react/calendar";
import Eye from "@lucide/react/eye";
import Filter from "@lucide/react/filter";
import Mail from "@lucide/react/mail";
import Phone from "@lucide/react/phone";
import Search from "@lucide/react/search";
import {
  type ColumnFiltersState,
  createColumnHelper,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  type SortingState,
  useReactTable,
} from "@tanstack/react-table";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { useApiUrl } from "../../contexts/EnvironmentContext";

interface BusinessCooperationRequest {
  id: string;
  name: string;
  email: string;
  phone: string;
  subject: string;
  content: string;
  status: "new" | "replied" | "closed";
  createdAt: string;
}

const statusLabels = {
  new: "新進",
  replied: "已回覆",
  closed: "已結案",
};

const statusColors = {
  new: "bg-blue-500",
  replied: "bg-green-500",
  closed: "bg-gray-500",
};

export default function BusinessCooperationPage() {
  const apiUrl = useApiUrl();
  const [requests, setRequests] = useState<BusinessCooperationRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [globalFilter, setGlobalFilter] = useState("");
  const [selectedRequest, setSelectedRequest] =
    useState<BusinessCooperationRequest | null>(null);
  const [isDetailDialogOpen, setIsDetailDialogOpen] = useState(false);

  const columnHelper = createColumnHelper<BusinessCooperationRequest>();

  const columns = [
    columnHelper.accessor("name", {
      header: "姓名",
      cell: (info) => <div className="font-medium">{info.getValue()}</div>,
    }),
    columnHelper.accessor("subject", {
      header: "主旨",
      cell: (info) => (
        <div className="max-w-[200px] truncate">{info.getValue()}</div>
      ),
    }),
    columnHelper.accessor("email", {
      header: "聯絡方式",
      cell: (info) => {
        const request = info.row.original;
        return (
          <div className="text-gray-600 text-sm">
            <div className="flex items-center gap-1">
              <Mail className="h-3 w-3" />
              {request.email}
            </div>
            <div className="flex items-center gap-1">
              <Phone className="h-3 w-3" />
              {request.phone}
            </div>
          </div>
        );
      },
    }),
    columnHelper.accessor("status", {
      header: "狀態",
      cell: (info) => (
        <Badge className={`text-white ${statusColors[info.getValue()]}`}>
          {statusLabels[info.getValue()]}
        </Badge>
      ),
      filterFn: "equals",
    }),
    columnHelper.accessor("createdAt", {
      header: "建立時間",
      cell: (info) => (
        <div className="flex items-center gap-1 text-gray-600 text-sm">
          <Calendar className="h-3 w-3" />
          {new Date(info.getValue()).toLocaleDateString("zh-TW")}
        </div>
      ),
    }),
    columnHelper.display({
      id: "actions",
      header: "操作",
      cell: ({ row }) => (
        <Button
          onClick={() => handleViewDetails(row.original)}
          size="sm"
          title="查看詳情"
          variant="ghost"
        >
          <Eye className="h-4 w-4" />
        </Button>
      ),
    }),
  ];

  const table = useReactTable({
    data: requests,
    columns,
    state: {
      sorting,
      columnFilters,
      globalFilter,
    },
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onGlobalFilterChange: setGlobalFilter,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
  });

  useEffect(() => {
    loadRequests();
  }, []);

  const loadRequests = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${apiUrl}/api/business-cooperation`);
      if (response.ok) {
        const result = await response.json();
        setRequests(result.success ? result.data.requests : []);
      }
    } catch (error) {
      console.error("Failed to load requests:", error);
      toast.error("載入列表失敗");
    } finally {
      setLoading(false);
    }
  };

  const handleViewDetails = (request: BusinessCooperationRequest) => {
    setSelectedRequest(request);
    setIsDetailDialogOpen(true);
  };

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="text-center">
          <div className="mx-auto h-8 w-8 animate-spin rounded-full border-gray-900 border-b-2" />
          <p className="mt-2 text-gray-600">載入中...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-bold text-3xl text-gray-900">異業合作</h1>
        <p className="mt-2 text-gray-600">管理異業合作申請與洽談</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            篩選與搜尋
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute top-3 left-3 h-4 w-4 text-gray-400" />
                <Input
                  className="pl-10"
                  onChange={(e) => setGlobalFilter(e.target.value)}
                  placeholder="搜尋姓名、Email、主旨..."
                  value={globalFilter}
                />
              </div>
            </div>
            <Select
              onValueChange={(value) =>
                table
                  .getColumn("status")
                  ?.setFilterValue(value === "all" ? "" : value)
              }
              value={
                (table.getColumn("status")?.getFilterValue() as string) ?? ""
              }
            >
              <SelectTrigger className="w-48">
                <SelectValue placeholder="篩選狀態" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">全部狀態</SelectItem>
                <SelectItem value="new">新進</SelectItem>
                <SelectItem value="replied">已回覆</SelectItem>
                <SelectItem value="closed">已結案</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>申請列表</CardTitle>
          <CardDescription>
            共 {table.getFilteredRowModel().rows.length} 筆申請
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <table className="w-full">
              <thead>
                {table.getHeaderGroups().map((headerGroup) => (
                  <tr className="border-b bg-gray-50/50" key={headerGroup.id}>
                    {headerGroup.headers.map((header) => (
                      <th
                        className="px-4 py-3 text-left font-medium text-gray-900"
                        key={header.id}
                      >
                        {header.isPlaceholder
                          ? null
                          : flexRender(
                              header.column.columnDef.header,
                              header.getContext()
                            )}
                      </th>
                    ))}
                  </tr>
                ))}
              </thead>
              <tbody>
                {table.getRowModel().rows.map((row) => (
                  <tr className="border-b hover:bg-gray-50/50" key={row.id}>
                    {row.getVisibleCells().map((cell) => (
                      <td className="px-4 py-3" key={cell.id}>
                        {flexRender(
                          cell.column.columnDef.cell,
                          cell.getContext()
                        )}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="flex items-center justify-between px-2 py-4">
            <div className="text-gray-700 text-sm">
              顯示{" "}
              {table.getState().pagination.pageIndex *
                table.getState().pagination.pageSize +
                1}{" "}
              到{" "}
              {Math.min(
                (table.getState().pagination.pageIndex + 1) *
                  table.getState().pagination.pageSize,
                table.getFilteredRowModel().rows.length
              )}{" "}
              項，共 {table.getFilteredRowModel().rows.length} 項
            </div>
            <div className="flex items-center space-x-2">
              <Button
                disabled={!table.getCanPreviousPage()}
                onClick={() => table.previousPage()}
                size="sm"
                variant="outline"
              >
                上一頁
              </Button>
              <Button
                disabled={!table.getCanNextPage()}
                onClick={() => table.nextPage()}
                size="sm"
                variant="outline"
              >
                下一頁
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <Dialog onOpenChange={setIsDetailDialogOpen} open={isDetailDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>合作申請詳情</DialogTitle>
            <DialogDescription>
              {selectedRequest?.name} - {selectedRequest?.subject}
            </DialogDescription>
          </DialogHeader>

          {selectedRequest && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h4 className="mb-1 font-medium text-gray-500 text-sm">
                    申請人
                  </h4>
                  <p>{selectedRequest.name}</p>
                </div>
                <div>
                  <h4 className="mb-1 font-medium text-gray-500 text-sm">
                    狀態
                  </h4>
                  <Badge
                    className={`text-white ${statusColors[selectedRequest.status]}`}
                  >
                    {statusLabels[selectedRequest.status]}
                  </Badge>
                </div>
                <div>
                  <h4 className="mb-1 font-medium text-gray-500 text-sm">
                    Email
                  </h4>
                  <p>{selectedRequest.email}</p>
                </div>
                <div>
                  <h4 className="mb-1 font-medium text-gray-500 text-sm">
                    電話
                  </h4>
                  <p>{selectedRequest.phone}</p>
                </div>
                <div>
                  <h4 className="mb-1 font-medium text-gray-500 text-sm">
                    建立時間
                  </h4>
                  <p>
                    {new Date(selectedRequest.createdAt).toLocaleString(
                      "zh-TW"
                    )}
                  </p>
                </div>
              </div>

              <div>
                <h4 className="mb-2 font-medium text-gray-500 text-sm">內容</h4>
                <div className="whitespace-pre-wrap rounded-lg bg-gray-50 p-4">
                  {selectedRequest.content}
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

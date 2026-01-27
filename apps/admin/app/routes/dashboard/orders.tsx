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
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  Input,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@blackliving/ui";
import CheckCircle from "@lucide/react/check-circle";
import Clock from "@lucide/react/clock";
import DollarSign from "@lucide/react/dollar-sign";
import Eye from "@lucide/react/eye";
import Filter from "@lucide/react/filter";
import MoreHorizontal from "@lucide/react/more-horizontal";
import Package from "@lucide/react/package";
// Tree-shakable Lucide imports
import Search from "@lucide/react/search";
import Trash2 from "@lucide/react/trash-2";
import Truck from "@lucide/react/truck";
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
import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router";
import { toast } from "sonner";
import { useApiUrl } from "../../contexts/EnvironmentContext";
import {
  type Order,
  paymentMethodLabels,
  paymentStatusLabels,
  statusColors,
  statusLabels,
} from "./order-details-dialog";

export default function OrdersPage() {
  const apiUrl = useApiUrl();
  const navigate = useNavigate();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [globalFilter, setGlobalFilter] = useState("");
  const [orderToDelete, setOrderToDelete] = useState<Order | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

  const columnHelper = createColumnHelper<Order>();

  const columns = [
    columnHelper.accessor("orderNumber", {
      header: "訂單編號",
      cell: (info) => (
        <div className="font-medium font-mono text-sm">{info.getValue()}</div>
      ),
    }),
    columnHelper.accessor(
      (row) =>
        `${row.customerInfo.name} ${row.customerInfo.email} ${row.customerInfo.phone}`,
      {
        id: "customerInfo",
        header: "客戶資訊",
        cell: (info) => {
          const customer = info.row.original.customerInfo;
          return (
            <div>
              <div className="font-medium">{customer.name}</div>
              <div className="text-gray-600 text-sm">{customer.email}</div>
              <div className="text-gray-600 text-sm">{customer.phone}</div>
            </div>
          );
        },
      }
    ),
    columnHelper.accessor("totalAmount", {
      header: "總金額",
      cell: (info) => (
        <div className="font-medium">NT${info.getValue().toLocaleString()}</div>
      ),
    }),
    columnHelper.accessor("paymentMethod", {
      header: "付款方式",
      cell: (info) => (
        <Badge variant="outline">{paymentMethodLabels[info.getValue()]}</Badge>
      ),
    }),
    columnHelper.accessor("status", {
      header: "訂單狀態",
      cell: (info) => (
        <Badge className={`text-white ${statusColors[info.getValue()]}`}>
          {statusLabels[info.getValue()]}
        </Badge>
      ),
      filterFn: "equals",
    }),
    columnHelper.accessor("paymentStatus", {
      header: "付款狀態",
      cell: (info) => (
        <Badge
          className={
            info.getValue() === "paid"
              ? "bg-green-500 text-white hover:bg-green-500/90"
              : ""
          }
          variant={info.getValue() === "paid" ? "default" : "secondary"}
        >
          {paymentStatusLabels[info.getValue()]}
        </Badge>
      ),
    }),
    columnHelper.accessor("createdAt", {
      header: "建立時間",
      cell: (info) =>
        new Date(info.getValue()).toLocaleDateString("zh-TW", {
          year: "numeric",
          month: "2-digit",
          day: "2-digit",
          hour: "2-digit",
          minute: "2-digit",
        }),
    }),
    columnHelper.display({
      id: "actions",
      header: "操作",
      cell: ({ row }) => (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button size="icon" variant="ghost">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-40">
            <DropdownMenuItem
              onClick={() => navigate(`/dashboard/orders/${row.original.id}`)}
            >
              <Eye className="mr-2 h-4 w-4" />
              查看詳情
            </DropdownMenuItem>
            {row.original.status === "paid" && (
              <DropdownMenuItem
                onClick={() =>
                  handleUpdateStatus(row.original.id, "processing")
                }
              >
                <Package className="mr-2 h-4 w-4" />
                標記為處理中
              </DropdownMenuItem>
            )}
            {row.original.status === "processing" && (
              <DropdownMenuItem
                onClick={() => handleUpdateStatus(row.original.id, "shipped")}
              >
                <Truck className="mr-2 h-4 w-4" />
                標記為已出貨
              </DropdownMenuItem>
            )}
            <DropdownMenuSeparator />
            <DropdownMenuItem
              className="text-red-600 focus:bg-red-50 focus:text-red-700"
              onClick={() => handleOpenDeleteDialog(row.original)}
            >
              <Trash2 className="mr-2 h-4 w-4" />
              刪除訂單
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      ),
    }),
  ];

  const table = useReactTable({
    data: orders,
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

  const loadOrders = useCallback(async () => {
    try {
      setLoading(true);
      const response = await fetch(`${apiUrl}/api/orders`, {
        credentials: "include",
      });
      if (response.ok) {
        const result = await response.json();
        setOrders(result.success ? result.data.orders : []);
      }
    } catch (error) {
      console.error("Failed to load orders:", error);
      toast.error("載入訂單失敗");
    } finally {
      setLoading(false);
    }
  }, [apiUrl]);

  useEffect(() => {
    loadOrders();
  }, [loadOrders]);

  const handleUpdateStatus = async (
    orderId: string,
    newStatus: Order["status"]
  ) => {
    try {
      const response = await fetch(`${apiUrl}/api/orders/${orderId}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ status: newStatus }),
      });

      if (response.ok) {
        setOrders((prev) =>
          prev.map((order) =>
            order.id === orderId
              ? { ...order, status: newStatus, updatedAt: new Date() }
              : order
          )
        );
        toast.success("訂單狀態更新成功");
      } else {
        throw new Error("Failed to update order status");
      }
    } catch (error) {
      console.error("Update status failed:", error);
      toast.error("更新訂單狀態失敗");
    }
  };

  const handleOpenDeleteDialog = (order: Order) => {
    setOrderToDelete(order);
    setIsDeleteDialogOpen(true);
  };

  const handleDeleteOrder = async () => {
    if (!orderToDelete) {
      return;
    }

    try {
      const response = await fetch(`${apiUrl}/api/orders/${orderToDelete.id}`, {
        method: "DELETE",
        credentials: "include",
      });

      if (response.ok) {
        setOrders((prev) => prev.filter((o) => o.id !== orderToDelete.id));
        toast.success("訂單已刪除");
        setIsDeleteDialogOpen(false);
        setOrderToDelete(null);
      } else {
        throw new Error("Failed to delete order");
      }
    } catch (error) {
      console.error("Delete order failed:", error);
      toast.error("刪除訂單失敗");
    }
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
      {/* Header */}
      <div>
        <h1 className="font-bold text-3xl text-gray-900">訂單管理</h1>
        <p className="mt-2 text-gray-600">處理客戶訂單與出貨狀態</p>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center">
              <Clock className="h-8 w-8 text-yellow-500" />
              <div className="ml-4">
                <p className="font-medium text-gray-600 text-sm">待付款</p>
                <p className="font-bold text-2xl">
                  {orders.filter((o) => o.status === "pending_payment").length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center">
              <DollarSign className="h-8 w-8 text-blue-500" />
              <div className="ml-4">
                <p className="font-medium text-gray-600 text-sm">已付款</p>
                <p className="font-bold text-2xl">
                  {orders.filter((o) => o.status === "paid").length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center">
              <Truck className="h-8 w-8 text-orange-500" />
              <div className="ml-4">
                <p className="font-medium text-gray-600 text-sm">配送中</p>
                <p className="font-bold text-2xl">
                  {orders.filter((o) => o.status === "shipped").length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center">
              <CheckCircle className="h-8 w-8 text-green-500" />
              <div className="ml-4">
                <p className="font-medium text-gray-600 text-sm">已完成</p>
                <p className="font-bold text-2xl">
                  {orders.filter((o) => o.status === "delivered").length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
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
                  placeholder="搜尋訂單編號、客戶姓名、電話..."
                  value={globalFilter}
                />
              </div>
            </div>
            <Select
              onValueChange={(value) => {
                table
                  .getColumn("status")
                  ?.setFilterValue(value === "all" ? "" : value);
              }}
              value={
                (table.getColumn("status")?.getFilterValue() as string) ?? ""
              }
            >
              <SelectTrigger className="w-48">
                <SelectValue placeholder="篩選狀態" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">全部狀態</SelectItem>
                <SelectItem value="pending_payment">待付款</SelectItem>
                <SelectItem value="paid">已付款</SelectItem>
                <SelectItem value="processing">處理中</SelectItem>
                <SelectItem value="shipped">配送中</SelectItem>
                <SelectItem value="delivered">已完成</SelectItem>
                <SelectItem value="cancelled">已取消</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Orders Table */}
      <Card>
        <CardHeader>
          <CardTitle>訂單列表</CardTitle>
          <CardDescription>
            共 {table.getFilteredRowModel().rows.length} 筆訂單
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

          {/* Pagination */}
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

      {/* Delete Confirmation Dialog */}
      <AlertDialog
        onOpenChange={setIsDeleteDialogOpen}
        open={isDeleteDialogOpen}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>確認刪除訂單</AlertDialogTitle>
            <AlertDialogDescription>
              確定要刪除訂單 {orderToDelete?.orderNumber} 嗎？此操作無法復原。
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>取消</AlertDialogCancel>
            <AlertDialogAction
              className="bg-red-600 hover:bg-red-700"
              onClick={handleDeleteOrder}
            >
              確認刪除
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

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
import DollarSign from "@lucide/react/dollar-sign";
import Edit from "@lucide/react/edit";
import Eye from "@lucide/react/eye";
import Filter from "@lucide/react/filter";
import Mail from "@lucide/react/mail";
import MoreHorizontal from "@lucide/react/more-horizontal";
import Package from "@lucide/react/package";
import Phone from "@lucide/react/phone";
import Plus from "@lucide/react/plus";
// Tree-shakable Lucide imports
import Search from "@lucide/react/search";
import Star from "@lucide/react/star";
import Tag from "@lucide/react/tag";
import Trash2 from "@lucide/react/trash-2";
import Users from "@lucide/react/users";
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
import { toast } from "sonner";
import { useApiUrl } from "../../contexts/EnvironmentContext";
import { CustomerEditDialog } from "./customer-edit-dialog";
import { CustomerProfileDialog } from "./customer-profile-dialog";
import {
  type CustomerInteraction,
  type CustomerProfile,
  churnRiskColors,
  churnRiskLabels,
  segmentColors,
  segmentLabels,
} from "./customer-types";

// Types and constants imported from ./customer-types

export default function CustomersPage() {
  const apiUrl = useApiUrl();
  const [customers, setCustomers] = useState<CustomerProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [globalFilter, setGlobalFilter] = useState("");
  const [selectedCustomer, setSelectedCustomer] =
    useState<CustomerProfile | null>(null);
  const [isDetailDialogOpen, setIsDetailDialogOpen] = useState(false);
  const [customerInteractions, setCustomerInteractions] = useState<
    CustomerInteraction[]
  >([]);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editDialogInitialTab, setEditDialogInitialTab] = useState("basic");
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  const columnHelper = createColumnHelper<CustomerProfile>();

  const columns = [
    columnHelper.accessor("customerNumber", {
      header: "客戶編號",
      cell: (info) => (
        <div className="font-medium font-mono text-sm">{info.getValue()}</div>
      ),
    }),
    columnHelper.accessor("name", {
      header: "客戶資訊",
      cell: (info) => {
        const customer = info.row.original;
        return (
          <div>
            <div className="font-medium">{info.getValue()}</div>
            <div className="flex items-center gap-1 text-gray-600 text-sm">
              <Mail className="h-3 w-3" />
              {customer.email}
            </div>
            <div className="flex items-center gap-1 text-gray-600 text-sm">
              <Phone className="h-3 w-3" />
              {customer.phone}
            </div>
          </div>
        );
      },
    }),
    columnHelper.accessor("segment", {
      header: "客戶分級",
      cell: (info) => (
        <Badge className={`text-white ${segmentColors[info.getValue()]}`}>
          {segmentLabels[info.getValue()]}
        </Badge>
      ),
      filterFn: "equals",
    }),
    columnHelper.accessor("tags", {
      header: "標籤",
      cell: (info) => {
        const tags = info.getValue();
        return (
          <div className="flex max-w-32 flex-wrap gap-1">
            {tags.slice(0, 2).map((tag) => (
              <Badge
                className="text-xs"
                key={tag.id}
                style={{ borderColor: tag.color, color: tag.color }}
                variant="outline"
              >
                {tag.name}
              </Badge>
            ))}
            {tags.length > 2 && (
              <Badge className="text-xs" variant="outline">
                +{tags.length - 2}
              </Badge>
            )}
          </div>
        );
      },
    }),
    columnHelper.accessor("totalSpent", {
      header: "總消費",
      cell: (info) => (
        <div className="text-right">
          <div className="font-medium">
            NT${(info.getValue() || 0).toLocaleString()}
          </div>
          <div className="text-gray-500 text-xs">
            {info.row.original.orderCount || 0} 筆訂單
          </div>
        </div>
      ),
    }),
    columnHelper.accessor("avgOrderValue", {
      header: "平均客單價",
      cell: (info) => (
        <div className="text-right font-medium">
          NT${(info.getValue() || 0).toLocaleString()}
        </div>
      ),
    }),
    columnHelper.accessor("lastPurchaseAt", {
      header: "最後購買",
      cell: (info) => {
        const date = info.getValue();
        return date ? (
          <div className="text-sm">
            {new Date(date).toLocaleDateString("zh-TW")}
          </div>
        ) : (
          <span className="text-gray-400">未購買</span>
        );
      },
    }),
    columnHelper.accessor("churnRisk", {
      header: "流失風險",
      cell: (info) => (
        <Badge className={`text-white ${churnRiskColors[info.getValue()]}`}>
          {churnRiskLabels[info.getValue()]}
        </Badge>
      ),
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
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => handleViewDetails(row.original)}>
              <Eye className="mr-2 h-4 w-4" />
              查看詳情
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => handleEdit(row.original)}>
              <Edit className="mr-2 h-4 w-4" />
              編輯客戶
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => handleManageTags(row.original)}>
              <Tag className="mr-2 h-4 w-4" />
              管理標籤
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              className="text-red-600 focus:text-red-600"
              onClick={() => setDeleteConfirmId(row.original.id)}
            >
              <Trash2 className="mr-2 h-4 w-4" />
              刪除客戶
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      ),
    }),
  ];

  const table = useReactTable({
    data: customers,
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

  const loadCustomers = useCallback(async () => {
    try {
      setLoading(true);
      const response = await fetch(`${apiUrl}/api/customers`, {
        credentials: "include",
      });
      if (response.ok) {
        const result = await response.json();
        setCustomers(result.success ? result.data.customers : []);
      }
    } catch (error) {
      console.error("Failed to load customers:", error);
      toast.error("載入客戶資料失敗");
    } finally {
      setLoading(false);
    }
  }, [apiUrl]);

  useEffect(() => {
    loadCustomers();
  }, [loadCustomers]);

  const loadCustomerInteractions = async (customerId: string) => {
    try {
      const response = await fetch(
        `${apiUrl}/api/customers/${customerId}/interactions`,
        {
          credentials: "include",
        }
      );
      if (response.ok) {
        const result = await response.json();
        setCustomerInteractions(result.success ? result.data.interactions : []);
      }
    } catch (error) {
      console.error("Failed to load customer interactions:", error);
    }
  };

  const handleViewDetails = (customer: CustomerProfile) => {
    setSelectedCustomer(customer);
    loadCustomerInteractions(customer.id);
    setIsDetailDialogOpen(true);
  };

  const handleEdit = (customer: CustomerProfile) => {
    setSelectedCustomer(customer);
    setEditDialogInitialTab("basic");
    setIsEditDialogOpen(true);
  };

  const handleManageTags = (customer: CustomerProfile) => {
    setSelectedCustomer(customer);
    setEditDialogInitialTab("tags");
    setIsEditDialogOpen(true);
  };

  const handleEditDialogSave = () => {
    loadCustomers();
  };

  const handleDeleteCustomer = async (customerId: string) => {
    try {
      const response = await fetch(`${apiUrl}/api/customers/${customerId}`, {
        method: "DELETE",
        credentials: "include",
      });
      if (response.ok) {
        toast.success("客戶已刪除");
        setDeleteConfirmId(null);
        loadCustomers();
      } else {
        toast.error("刪除失敗");
      }
    } catch (error) {
      console.error("Failed to delete customer:", error);
      toast.error("刪除失敗");
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
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-bold text-3xl text-gray-900">客戶管理</h1>
          <p className="mt-2 text-gray-600">管理客戶資料與購買記錄</p>
        </div>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          新增客戶
        </Button>
      </div>

      {/* Analytics Cards */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center">
              <Users className="h-8 w-8 text-blue-500" />
              <div className="ml-4">
                <p className="font-medium text-gray-600 text-sm">總客戶數</p>
                <p className="font-bold text-2xl">{customers.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center">
              <Star className="h-8 w-8 text-purple-500" />
              <div className="ml-4">
                <p className="font-medium text-gray-600 text-sm">VIP客戶</p>
                <p className="font-bold text-2xl">
                  {customers.filter((c) => c.segment === "vip").length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center">
              <DollarSign className="h-8 w-8 text-green-500" />
              <div className="ml-4">
                <p className="font-medium text-gray-600 text-sm">平均客單價</p>
                <p className="font-bold text-2xl">
                  NT$
                  {customers.length > 0
                    ? Math.round(
                        customers.reduce(
                          (sum, c) => sum + (c.avgOrderValue || 0),
                          0
                        ) / customers.length
                      ).toLocaleString()
                    : 0}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center">
              <Package className="h-8 w-8 text-orange-500" />
              <div className="ml-4">
                <p className="font-medium text-gray-600 text-sm">回購客戶</p>
                <p className="font-bold text-2xl">
                  {customers.filter((c) => c.orderCount > 1).length}
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
                  placeholder="搜尋客戶編號、姓名、電話、Email..."
                  value={globalFilter}
                />
              </div>
            </div>
            <Select
              onValueChange={(value) =>
                table
                  .getColumn("segment")
                  ?.setFilterValue(value === "all" ? "" : value)
              }
              value={
                (table.getColumn("segment")?.getFilterValue() as string) ?? ""
              }
            >
              <SelectTrigger className="w-48">
                <SelectValue placeholder="篩選客戶分級" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">全部分級</SelectItem>
                <SelectItem value="new">新客戶</SelectItem>
                <SelectItem value="regular">一般客戶</SelectItem>
                <SelectItem value="vip">VIP客戶</SelectItem>
                <SelectItem value="inactive">非活躍客戶</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Customers Table */}
      <Card>
        <CardHeader>
          <CardTitle>客戶列表</CardTitle>
          <CardDescription>
            共 {table.getFilteredRowModel().rows.length} 位客戶
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

      {/* Customer Details Dialog */}
      <CustomerProfileDialog
        customer={selectedCustomer}
        interactions={customerInteractions}
        onEdit={handleEdit}
        onOpenChange={setIsDetailDialogOpen}
        open={isDetailDialogOpen}
      />

      {/* Customer Edit Dialog */}
      <CustomerEditDialog
        customer={selectedCustomer}
        initialTab={editDialogInitialTab}
        onOpenChange={setIsEditDialogOpen}
        onSave={handleEditDialogSave}
        open={isEditDialogOpen}
      />

      {/* Delete Confirmation Dialog */}
      <AlertDialog
        onOpenChange={(open) => {
          if (!open) {
            setDeleteConfirmId(null);
          }
        }}
        open={deleteConfirmId !== null}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>確認刪除客戶</AlertDialogTitle>
            <AlertDialogDescription>
              此操作無法復原。刪除後，該客戶的所有資料、標籤和互動記錄都將被永久刪除。
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>取消</AlertDialogCancel>
            <AlertDialogAction
              className="bg-red-600 hover:bg-red-700"
              onClick={() => {
                if (deleteConfirmId) {
                  handleDeleteCustomer(deleteConfirmId);
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

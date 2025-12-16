import {
  Badge,
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@blackliving/ui";
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
import {
  Calendar,
  CheckCircle,
  Clock,
  Edit,
  Eye,
  MapPin,
  Phone,
  User,
} from "lucide-react";
import { useState } from "react";
import type { Appointment } from "../../routes/dashboard/types";
import {
  purposeLabels,
  statusColors,
  statusLabels,
  storeLabels,
  timeLabels,
} from "../../routes/dashboard/types";

type AppointmentsTableProps = {
  appointments: Appointment[];
  onViewDetails: (appointment: Appointment) => void;
  onEdit: (appointment: Appointment) => void;
  onUpdateStatus: (
    appointmentId: string,
    newStatus: Appointment["status"]
  ) => void;
};

export function AppointmentsTable({
  appointments,
  onViewDetails,
  onEdit,
  onUpdateStatus,
}: AppointmentsTableProps) {
  const columnHelper = createColumnHelper<Appointment>();

  const columns = [
    columnHelper.accessor("appointmentNumber", {
      header: "預約編號",
      cell: (info) => (
        <div className="font-medium font-mono text-sm">{info.getValue()}</div>
      ),
    }),
    columnHelper.accessor("customerInfo", {
      header: "客戶資訊",
      cell: (info) => {
        const customer = info.getValue() || {};
        return (
          <div>
            <div className="flex items-center gap-1 font-medium">
              <User className="h-3 w-3" />
              {customer?.name || "未知客戶"}
            </div>
            <div className="flex items-center gap-1 text-gray-600 text-sm">
              <Phone className="h-3 w-3" />
              {customer?.phone || "無電話"}
            </div>
            {typeof customer?.email === "string" && (
              <div className="text-gray-600 text-sm">{customer.email}</div>
            )}
          </div>
        );
      },
    }),
    columnHelper.accessor("storeLocation", {
      header: "門市",
      cell: (info) => (
        <Badge className="flex w-fit items-center gap-1" variant="outline">
          <MapPin className="h-3 w-3" />
          {storeLabels[info.getValue()]}
        </Badge>
      ),
      filterFn: "equals",
    }),
    columnHelper.accessor("preferredDate", {
      header: "預約日期",
      cell: (info) => {
        const appointment = info.row.original;
        const dateValue = info.getValue();
        const isValidDate =
          dateValue && !Number.isNaN(new Date(dateValue).getTime());

        if (!isValidDate) {
          return (
            <div className="flex items-center gap-1 font-medium text-amber-600 text-sm">
              <Calendar className="h-3 w-3" />
              待協調
            </div>
          );
        }

        return (
          <div>
            <div className="flex items-center gap-1 font-medium">
              <Calendar className="h-3 w-3" />
              {new Date(dateValue).toLocaleDateString("zh-TW")}
            </div>
            <div className="flex items-center gap-1 text-gray-600 text-sm">
              <Clock className="h-3 w-3" />
              {timeLabels[appointment.preferredTime]}
            </div>
          </div>
        );
      },
    }),
    columnHelper.accessor("visitPurpose", {
      header: "目的",
      cell: (info) => (
        <Badge variant="secondary">{purposeLabels[info.getValue()]}</Badge>
      ),
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
    columnHelper.accessor("staffAssigned", {
      header: "服務人員",
      cell: (info) =>
        info.getValue() || <span className="text-gray-400">未指派</span>,
    }),
    columnHelper.accessor("createdAt", {
      header: "建立時間",
      cell: (info) =>
        new Date(info.getValue()).toLocaleDateString("zh-TW", {
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
        <div className="flex gap-2">
          <Button
            onClick={() => onViewDetails(row.original)}
            size="sm"
            title="查看詳情"
            variant="ghost"
          >
            <Eye className="h-4 w-4" />
          </Button>
          <Button
            onClick={() => onEdit(row.original)}
            size="sm"
            title="編輯預約"
            variant="ghost"
          >
            <Edit className="h-4 w-4" />
          </Button>
          {row.original.status === "pending" && (
            <Button
              onClick={() => onUpdateStatus(row.original.id, "confirmed")}
              size="sm"
              title="確認預約"
              variant="ghost"
            >
              <CheckCircle className="h-4 w-4" />
            </Button>
          )}
          {row.original.status === "confirmed" &&
            new Date(row.original.preferredDate) <= new Date() && (
              <Button
                onClick={() => onUpdateStatus(row.original.id, "completed")}
                size="sm"
                title="標記完成"
                variant="ghost"
              >
                <CheckCircle className="h-4 w-4" />
              </Button>
            )}
        </div>
      ),
    }),
  ];

  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [globalFilter, setGlobalFilter] = useState("");

  const table = useReactTable({
    data: appointments,
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

  return (
    <Card>
      <CardHeader>
        <CardTitle>預約列表</CardTitle>
        <CardDescription>
          共 {table.getFilteredRowModel().rows.length} 筆預約
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
  );
}

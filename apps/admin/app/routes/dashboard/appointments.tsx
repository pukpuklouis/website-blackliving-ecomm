import { Badge, Button } from "@blackliving/ui";
import {
  type ColumnFiltersState,
  createColumnHelper,
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
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { AppointmentDetailsDialog } from "../../components/appointment/AppointmentDetailsDialog";
import { AppointmentEditDialog } from "../../components/appointment/AppointmentEditDialog";
import { AppointmentFilters } from "../../components/appointment/AppointmentFilters";
import { AppointmentStatsCards } from "../../components/appointment/AppointmentStatsCards";
import { AppointmentsTable } from "../../components/appointment/AppointmentsTable";
import { useEnvironment } from "../../contexts/EnvironmentContext";
import type { Appointment } from "./types";
import {
  purposeLabels,
  statusColors,
  statusLabels,
  storeLabels,
  timeLabels,
} from "./types";

export default function AppointmentsPage() {
  const { PUBLIC_API_URL } = useEnvironment();
  const apiUrl = PUBLIC_API_URL;

  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [globalFilter, setGlobalFilter] = useState("");
  const [selectedAppointment, setSelectedAppointment] =
    useState<Appointment | null>(null);
  const [isDetailDialogOpen, setIsDetailDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editFormData, setEditFormData] = useState<Partial<Appointment>>({});

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
            {typeof customer?.email === "string" && customer.email && (
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
            onClick={() => handleViewDetails(row.original)}
            size="sm"
            title="查看詳情"
            variant="ghost"
          >
            <Eye className="h-4 w-4" />
          </Button>
          <Button
            onClick={() => handleEdit(row.original)}
            size="sm"
            title="編輯預約"
            variant="ghost"
          >
            <Edit className="h-4 w-4" />
          </Button>
          {row.original.status === "pending" && (
            <Button
              onClick={() => handleUpdateStatus(row.original.id, "confirmed")}
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
                onClick={() => handleUpdateStatus(row.original.id, "completed")}
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

  const loadAppointments = useCallback(async () => {
    try {
      setLoading(true);
      const response = await fetch(`${apiUrl}/api/appointments`, {
        credentials: "include",
      });

      if (response.ok) {
        const result = await response.json();
        setAppointments(result.success ? result.data.appointments : []);
      }
    } catch (error) {
      console.error("Failed to load appointments:", error);
      toast.error("載入預約失敗");
    } finally {
      setLoading(false);
    }
  }, [apiUrl]);

  useEffect(() => {
    loadAppointments();
  }, [loadAppointments]);

  const handleViewDetails = (appointment: Appointment) => {
    setSelectedAppointment(appointment);
    setIsDetailDialogOpen(true);
  };

  const handleEdit = (appointment: Appointment) => {
    setSelectedAppointment(appointment);
    setEditFormData({
      ...appointment,
      customerInfo: appointment.customerInfo || {
        name: "",
        phone: "",
        email: "",
      },
    });
    setIsEditDialogOpen(true);
  };

  const handleUpdateStatus = async (
    appointmentId: string,
    newStatus: Appointment["status"]
  ) => {
    try {
      const response = await fetch(
        `${apiUrl}/api/appointments/${appointmentId}/status`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({ status: newStatus }),
        }
      );

      if (response.ok) {
        setAppointments((prev) =>
          prev.map((appointment) =>
            appointment.id === appointmentId
              ? { ...appointment, status: newStatus, updatedAt: new Date() }
              : appointment
          )
        );
        toast.success("預約狀態更新成功");
      } else {
        throw new Error("Failed to update appointment status");
      }
    } catch (error) {
      console.error("Update status failed:", error);
      toast.error("更新預約狀態失敗");
    }
  };

  const handleConfirmAppointment = async (
    appointmentId: string,
    confirmedDateTime: string
  ) => {
    try {
      const response = await fetch(
        `${apiUrl}/api/appointments/${appointmentId}/confirm`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({
            status: "confirmed",
            confirmedDateTime: new Date(confirmedDateTime).toISOString(),
          }),
        }
      );

      if (response.ok) {
        await loadAppointments();
        toast.success("預約確認成功");
      } else {
        throw new Error("Failed to confirm appointment");
      }
    } catch (error) {
      console.error("Confirm appointment failed:", error);
      toast.error("確認預約失敗");
    }
  };

  const handleSaveEdit = async () => {
    if (!selectedAppointment) {
      return;
    }

    try {
      // Clean up data before sending
      const payload = {
        ...editFormData,
        customerInfo: editFormData.customerInfo
          ? {
              name: editFormData.customerInfo.name,
              phone: editFormData.customerInfo.phone,
              email: editFormData.customerInfo.email,
            }
          : undefined,
      };

      const response = await fetch(
        `${apiUrl}/api/appointments/${selectedAppointment.id}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify(payload),
        }
      );

      if (response.ok) {
        toast.success("預約資訊更新成功");
        setIsEditDialogOpen(false);
        loadAppointments();
      } else {
        throw new Error("Failed to update appointment");
      }
    } catch (error) {
      console.error("Update appointment failed:", error);
      toast.error("更新預約失敗");
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
        <h1 className="font-bold text-3xl text-gray-900">預約管理</h1>
        <p className="mt-2 text-gray-600">管理試躺預約與門市參觀</p>
      </div>

      <AppointmentStatsCards appointments={appointments} />

      <AppointmentFilters
        globalFilter={globalFilter}
        setGlobalFilter={setGlobalFilter}
        table={table}
      />

      <AppointmentsTable
        appointments={appointments}
        onEdit={handleEdit}
        onUpdateStatus={handleUpdateStatus}
        onViewDetails={handleViewDetails}
      />

      <AppointmentDetailsDialog
        appointment={selectedAppointment}
        isOpen={isDetailDialogOpen}
        onConfirmAppointment={handleConfirmAppointment}
        onOpenChange={setIsDetailDialogOpen}
      />

      <AppointmentEditDialog
        appointment={selectedAppointment}
        editFormData={editFormData}
        isOpen={isEditDialogOpen}
        onOpenChange={setIsEditDialogOpen}
        onSave={handleSaveEdit}
        setEditFormData={setEditFormData}
      />
    </div>
  );
}

import {
  Button,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@blackliving/ui";
import { useEffect, useState } from "react";
import { useAuthStore } from "../../stores/authStore";

type Appointment = {
  id: string;
  appointmentNumber: string;
  customerInfo: {
    name: string;
    phone: string;
    email: string;
  };
  preferredDate: string;
  preferredTime: string;
  status: "pending" | "confirmed" | "completed" | "cancelled" | "no_show";
  storeLocation: string;
  createdAt: string;
};

const statusLabels = {
  pending: "待確認",
  confirmed: "已確認",
  completed: "已完成",
  cancelled: "已取消",
  no_show: "未到場",
};

const statusColors = {
  pending: "bg-yellow-100 text-yellow-800",
  confirmed: "bg-blue-100 text-blue-800",
  completed: "bg-green-100 text-green-800",
  cancelled: "bg-gray-100 text-gray-800",
  no_show: "bg-red-100 text-red-800",
};

const timeLabels: Record<string, string> = {
  morning: "上午 (10:00-12:00)",
  afternoon: "下午 (14:00-17:00)",
  evening: "晚上 (18:00-21:00)",
};

const storeLabels: Record<string, string> = {
  zhonghe: "中和門市",
  zhongli: "中壢門市",
};

const API_BASE = import.meta.env.PUBLIC_API_URL || "http://localhost:8787";

const getAuthHeaders = async (
  ensureFreshAccessToken: () => Promise<string | null>
): Promise<HeadersInit> => {
  const headers: HeadersInit = {};
  try {
    const token = await ensureFreshAccessToken();
    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }
  } catch {
    // Ignore token error, proceed to try cookie auth
  }
  return headers;
};

const fetchAppointments = async (
  headers: HeadersInit
): Promise<Appointment[]> => {
  const response = await fetch(`${API_BASE}/api/reservations/my`, {
    headers,
    credentials: "include",
  });

  if (response.ok) {
    const result = await response.json();
    return result.data;
  }
  if (response.status === 401) {
    throw new Error("請先登入");
  }
  throw new Error("無法載入預約列表");
};

// Status filter options
type StatusFilter =
  | "all"
  | "pending"
  | "confirmed"
  | "completed"
  | "cancelled"
  | "no_show";

const filterOptions: { value: StatusFilter; label: string }[] = [
  { value: "all", label: "全部" },
  { value: "pending", label: "待確認" },
  { value: "confirmed", label: "已確認" },
  { value: "completed", label: "已完成" },
  { value: "cancelled", label: "已取消" },
];

export default function MyAppointments() {
  const { ensureFreshAccessToken } = useAuthStore();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [cancellingId, setCancellingId] = useState<string | null>(null);

  // Filter and sort state
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [sortNewestFirst, setSortNewestFirst] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        const headers = await getAuthHeaders(ensureFreshAccessToken);
        const data = await fetchAppointments(headers);
        setAppointments(data);
      } catch (err) {
        if (err instanceof Error) {
          setError(err.message);
        } else {
          setError("載入失敗，請稍後再試");
        }
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [ensureFreshAccessToken]);

  const cancelAppointment = async (
    id: string,
    headers: HeadersInit
  ): Promise<void> => {
    const response = await fetch(`${API_BASE}/api/reservations/${id}/cancel`, {
      method: "PATCH",
      headers,
      credentials: "include",
    });

    if (!response.ok) {
      throw new Error("取消失敗，請稍後再試");
    }
  };

  const handleCancel = async (id: string) => {
    try {
      setCancellingId(id);
      const headers = await getAuthHeaders(ensureFreshAccessToken);
      await cancelAppointment(id, headers);

      // Reload appointments to get updated status
      const data = await fetchAppointments(headers);
      setAppointments(data);
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("取消時發生錯誤");
      }
    } finally {
      setCancellingId(null);
    }
  };

  // Filter and sort appointments
  const filteredAppointments = appointments
    .filter((apt) => statusFilter === "all" || apt.status === statusFilter)
    .sort((a, b) => {
      const dateA = new Date(a.createdAt).getTime();
      const dateB = new Date(b.createdAt).getTime();
      return sortNewestFirst ? dateB - dateA : dateA - dateB;
    });

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-gray-300 border-t-gray-800" />
        <span className="ml-3 text-gray-500">載入中...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-lg border border-red-200 bg-red-50 p-6 text-center">
        <p className="text-red-600">{error}</p>
        <Button
          className="mt-4"
          onClick={() => window.location.reload()}
          size="sm"
          variant="outline"
        >
          重新載入
        </Button>
      </div>
    );
  }

  // Empty state for no appointments at all
  if (appointments.length === 0) {
    return (
      <div className="rounded-lg border border-gray-300 border-dashed bg-gray-50 py-16 text-center">
        <svg
          aria-hidden="true"
          className="mx-auto mb-4 h-12 w-12 text-gray-400"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.5}
          />
        </svg>
        <p className="mb-2 font-medium text-gray-700">目前沒有預約記錄</p>
        <p className="mb-6 text-gray-500 text-sm">
          立即預約，體驗頂級席夢思床墊
        </p>
        <Button
          onClick={() => {
            window.location.href = "/appointment";
          }}
        >
          立即預約體驗
        </Button>
      </div>
    );
  }

  return (
    <div className="max-w-full space-y-4 overflow-hidden">
      {/* Header with Title and Sort */}
      <div className="flex items-center justify-between">
        <h2 className="font-bold text-xl">我的預約</h2>
        <button
          className="flex items-center gap-1 text-gray-500 text-sm hover:text-gray-700"
          onClick={() => setSortNewestFirst(!sortNewestFirst)}
          type="button"
        >
          <svg
            className="h-4 w-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
            />
          </svg>
          {sortNewestFirst ? "最新優先" : "最舊優先"}
        </button>
      </div>

      {/* Filter and Sort Controls */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        {/* Mobile Filter - Select */}
        <div className="w-full sm:hidden">
          <Select
            value={statusFilter}
            onValueChange={(val) => setStatusFilter(val as StatusFilter)}
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder="篩選狀態" />
            </SelectTrigger>
            <SelectContent>
              {filterOptions.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Desktop Filter - Pills */}
        <div className="hidden sm:flex flex-wrap gap-2">
          {filterOptions.map((option) => (
            <button
              key={option.value}
              onClick={() => setStatusFilter(option.value)}
              className={`rounded-full px-4 py-1.5 text-sm transition-colors ${
                statusFilter === option.value
                  ? "bg-slate-900 text-white"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
            >
              {option.label}
            </button>
          ))}
        </div>

        {/* Sort Button - cleaned up */}
        <button
          className="hidden sm:flex items-center gap-1 text-slate-500 text-sm hover:text-slate-700"
          onClick={() => setSortNewestFirst(!sortNewestFirst)}
          type="button"
        >
          <svg
            className="h-4 w-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4"
            />
          </svg>
          {sortNewestFirst ? "最新優先" : "最舊優先"}
        </button>
      </div>

      {/* Empty state for filtered results */}
      {filteredAppointments.length === 0 ? (
        <div className="rounded-lg bg-gray-50 py-8 text-center">
          <p className="text-gray-500">沒有符合條件的預約</p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredAppointments.map((apt) => (
            <div
              className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm transition-shadow hover:shadow-md sm:p-6"
              key={apt.id}
            >
              <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <div className="mb-2 flex items-center gap-3">
                    <span className="font-mono text-slate-500 text-sm">
                      {apt.appointmentNumber}
                    </span>
                    <span
                      className={`rounded-full px-2 py-0.5 font-medium text-xs ${
                        statusColors[apt.status]
                      }`}
                    >
                      {statusLabels[apt.status]}
                    </span>
                  </div>
                  <h3 className="font-medium text-lg text-slate-900">
                    {storeLabels[apt.storeLocation] || apt.storeLocation}
                  </h3>
                </div>
                {(apt.status === "pending" || apt.status === "confirmed") && (
                  <Button
                    className="border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700"
                    disabled={cancellingId === apt.id}
                    onClick={() => handleCancel(apt.id)}
                    size="sm"
                    variant="outline"
                  >
                    {cancellingId === apt.id ? "取消中..." : "取消預約"}
                  </Button>
                )}
              </div>

              <div className="grid grid-cols-1 gap-4 text-sm md:grid-cols-2">
                <div>
                  <p className="mb-1 text-gray-500">預約時間</p>
                  <p>
                    {Date.parse(apt.preferredDate)
                      ? new Date(apt.preferredDate).toLocaleDateString("zh-TW")
                      : apt.preferredDate}
                    <span className="mx-2">|</span>
                    {timeLabels[apt.preferredTime] || apt.preferredTime}
                  </p>
                </div>
                <div>
                  <p className="mb-1 text-gray-500">建立時間</p>
                  <p>{new Date(apt.createdAt).toLocaleString("zh-TW")}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

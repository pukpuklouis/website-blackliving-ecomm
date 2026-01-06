import { Button } from "@blackliving/ui";
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

export default function MyAppointments() {
  const { ensureFreshAccessToken } = useAuthStore();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [cancellingId, setCancellingId] = useState<string | null>(null);

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

  if (loading) {
    return <div className="py-8 text-center text-gray-500">載入中...</div>;
  }

  if (error) {
    return <div className="py-8 text-center text-red-500">{error}</div>;
  }

  if (appointments.length === 0) {
    return (
      <div className="rounded-lg bg-gray-50 py-12 text-center">
        <p className="mb-4 text-gray-500">目前沒有預約記錄</p>
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
    <div className="space-y-4">
      <h2 className="mb-6 font-bold text-xl">我的預約</h2>
      {appointments.map((apt) => (
        <div
          className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm"
          key={apt.id}
        >
          <div className="mb-4 flex items-start justify-between">
            <div>
              <div className="mb-2 flex items-center gap-3">
                <span className="font-mono text-gray-500 text-sm">
                  {apt.appointmentNumber}
                </span>
                <span
                  className={`rounded-full px-2 py-1 font-medium text-xs ${
                    statusColors[apt.status]
                  }`}
                >
                  {statusLabels[apt.status]}
                </span>
              </div>
              <h3 className="font-medium text-lg">
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
  );
}

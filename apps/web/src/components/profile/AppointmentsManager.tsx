/**
 * AppointmentsManager Component
 * Displays and manages user appointments with booking functionality
 */

import {
  Alert,
  AlertDescription,
  Badge,
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@blackliving/ui";
import {
  Calendar,
  Clock,
  Loader2,
  MapPin,
  Phone,
  Plus,
  RefreshCcw,
  User,
  X,
} from "lucide-react";
import { useEffect, useState } from "react";

interface Appointment {
  id: string;
  customerInfo: {
    name: string;
    phone: string;
    email?: string;
  };
  storeLocation: "中和" | "中壢";
  preferredDate: string;
  preferredTime: "上午" | "下午" | "晚上";
  confirmedDateTime?: string;
  productInterest?: string[];
  status: "pending" | "confirmed" | "completed" | "cancelled";
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

interface AppointmentsManagerProps {
  className?: string;
  onSuccess?: (message: string) => void;
  onError?: (error: string) => void;
}

const statusConfig = {
  pending: {
    label: "待確認",
    color: "bg-yellow-100 text-yellow-800 border-yellow-200",
  },
  confirmed: {
    label: "已確認",
    color: "bg-blue-100 text-blue-800 border-blue-200",
  },
  completed: {
    label: "已完成",
    color: "bg-green-100 text-green-800 border-green-200",
  },
  cancelled: {
    label: "已取消",
    color: "bg-red-100 text-red-800 border-red-200",
  },
};

const timeSlots = {
  上午: "09:00 - 12:00",
  下午: "14:00 - 17:00",
  晚上: "19:00 - 21:00",
};

function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString("zh-TW", {
    year: "numeric",
    month: "long",
    day: "numeric",
    weekday: "long",
  });
}

export function AppointmentsManager({
  className,
  onSuccess,
  onError,
}: AppointmentsManagerProps) {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  // Load appointments
  const loadAppointments = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/appointments/my", {
        method: "GET",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();

      if (result.success && result.data) {
        setAppointments(result.data);
      } else {
        throw new Error(result.error || "Failed to load appointments");
      }
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Failed to load appointments";
      setError(errorMessage);
      onError?.(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  // Cancel appointment
  const cancelAppointment = async (appointmentId: string) => {
    if (!confirm("確定要取消這個預約嗎？")) {
      return;
    }

    setActionLoading(appointmentId);

    try {
      const response = await fetch(
        `/api/appointments/${appointmentId}/cancel`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();

      if (result.success) {
        // Update local state
        setAppointments((prev) =>
          prev.map((apt) =>
            apt.id === appointmentId
              ? { ...apt, status: "cancelled" as const }
              : apt
          )
        );
        onSuccess?.(result.message || "預約已取消");
      } else {
        throw new Error(result.error || "Failed to cancel appointment");
      }
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Failed to cancel appointment";
      onError?.(errorMessage);
    } finally {
      setActionLoading(null);
    }
  };

  // Reschedule appointment
  const rescheduleAppointment = async (appointmentId: string) => {
    // For now, redirect to booking page with appointment ID
    window.location.href = `/appointment?reschedule=${appointmentId}`;
  };

  // Load appointments on mount
  useEffect(() => {
    loadAppointments();
  }, []);

  if (loading) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle>預約記錄</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin" />
            <span className="ml-2">載入中...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle>預約記錄</CardTitle>
        </CardHeader>
        <CardContent>
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
          <Button className="mt-4" onClick={loadAppointments} variant="outline">
            <RefreshCcw className="mr-2 h-4 w-4" />
            重新載入
          </Button>
        </CardContent>
      </Card>
    );
  }

  const isEmpty = appointments.length === 0;

  return (
    <Card className={className}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0">
        <CardTitle>預約記錄</CardTitle>
        <div className="flex space-x-2">
          <Button onClick={loadAppointments} size="sm" variant="outline">
            <RefreshCcw className="h-4 w-4" />
          </Button>
          <Button asChild size="sm">
            <a href="/appointment">
              <Plus className="mr-2 h-4 w-4" />
              新預約
            </a>
          </Button>
        </div>
      </CardHeader>

      <CardContent>
        {isEmpty ? (
          <div className="py-8 text-center">
            <Calendar className="mx-auto mb-4 h-12 w-12 text-gray-400" />
            <p className="mb-2 text-gray-600">尚無預約記錄</p>
            <p className="mb-4 text-gray-500 text-sm">
              立即預約免費到府試躺服務
            </p>
            <Button asChild>
              <a href="/appointment">立即預約</a>
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            {appointments.map((appointment) => (
              <Card className="relative" key={appointment.id}>
                <CardContent className="pt-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="mb-3 flex items-center gap-2">
                        <Badge
                          className={statusConfig[appointment.status].color}
                        >
                          {statusConfig[appointment.status].label}
                        </Badge>
                        <span className="text-gray-500 text-sm">
                          預約編號: {appointment.id.slice(-8)}
                        </span>
                      </div>

                      <div className="mb-3 grid grid-cols-1 gap-4 md:grid-cols-2">
                        <div className="space-y-2">
                          <div className="flex items-center text-sm">
                            <User className="mr-2 h-4 w-4 text-gray-500" />
                            <span>{appointment.customerInfo.name}</span>
                          </div>
                          <div className="flex items-center text-sm">
                            <Phone className="mr-2 h-4 w-4 text-gray-500" />
                            <span>{appointment.customerInfo.phone}</span>
                          </div>
                          <div className="flex items-center text-sm">
                            <MapPin className="mr-2 h-4 w-4 text-gray-500" />
                            <span>{appointment.storeLocation}門市</span>
                          </div>
                        </div>

                        <div className="space-y-2">
                          <div className="flex items-center text-sm">
                            <Calendar className="mr-2 h-4 w-4 text-gray-500" />
                            <span>{formatDate(appointment.preferredDate)}</span>
                          </div>
                          <div className="flex items-center text-sm">
                            <Clock className="mr-2 h-4 w-4 text-gray-500" />
                            <span>
                              {appointment.preferredTime} (
                              {timeSlots[appointment.preferredTime]})
                            </span>
                          </div>
                          {appointment.confirmedDateTime && (
                            <div className="font-medium text-blue-600 text-sm">
                              ✓ 已確認時間:{" "}
                              {new Date(
                                appointment.confirmedDateTime
                              ).toLocaleString("zh-TW")}
                            </div>
                          )}
                        </div>
                      </div>

                      {appointment.productInterest &&
                        appointment.productInterest.length > 0 && (
                          <div className="mb-3">
                            <p className="mb-1 text-gray-600 text-sm">
                              興趣產品:
                            </p>
                            <div className="flex flex-wrap gap-1">
                              {appointment.productInterest.map(
                                (product, index) => (
                                  <Badge
                                    className="text-xs"
                                    key={index}
                                    variant="outline"
                                  >
                                    {product}
                                  </Badge>
                                )
                              )}
                            </div>
                          </div>
                        )}

                      {appointment.notes && (
                        <div className="mb-3">
                          <p className="mb-1 text-gray-600 text-sm">備註:</p>
                          <p className="rounded bg-gray-50 p-2 text-gray-700 text-sm">
                            {appointment.notes}
                          </p>
                        </div>
                      )}

                      <p className="text-gray-500 text-xs">
                        建立時間:{" "}
                        {new Date(appointment.createdAt).toLocaleString(
                          "zh-TW"
                        )}
                      </p>
                    </div>

                    <div className="ml-4 flex flex-col space-y-2">
                      {appointment.status === "pending" && (
                        <>
                          <Button
                            className="text-blue-600"
                            onClick={() =>
                              rescheduleAppointment(appointment.id)
                            }
                            size="sm"
                            variant="outline"
                          >
                            <RefreshCcw className="mr-1 h-3 w-3" />
                            改期
                          </Button>
                          <Button
                            className="text-red-600"
                            disabled={actionLoading === appointment.id}
                            onClick={() => cancelAppointment(appointment.id)}
                            size="sm"
                            variant="outline"
                          >
                            {actionLoading === appointment.id ? (
                              <Loader2 className="h-3 w-3 animate-spin" />
                            ) : (
                              <X className="mr-1 h-3 w-3" />
                            )}
                            取消
                          </Button>
                        </>
                      )}

                      {appointment.status === "confirmed" && (
                        <Button
                          className="text-blue-600"
                          onClick={() => rescheduleAppointment(appointment.id)}
                          size="sm"
                          variant="outline"
                        >
                          <RefreshCcw className="mr-1 h-3 w-3" />
                          改期
                        </Button>
                      )}

                      {appointment.status === "completed" && (
                        <Button
                          asChild
                          className="text-green-600"
                          size="sm"
                          variant="outline"
                        >
                          <a href="/appointment">
                            <Plus className="mr-1 h-3 w-3" />
                            再預約
                          </a>
                        </Button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Contact Info */}
        <div className="mt-6 rounded-lg border border-blue-200 bg-blue-50 p-4">
          <div className="flex items-start space-x-3">
            <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-blue-500">
              <Phone className="h-4 w-4 text-white" />
            </div>
            <div>
              <h4 className="mb-1 font-medium text-blue-900">需要協助？</h4>
              <p className="mb-2 text-blue-800 text-sm">
                如需修改預約時間或有任何問題，請聯繫我們：
              </p>
              <div className="space-y-1">
                <p className="text-blue-700 text-sm">
                  📞 中和門市：(02) 2234-5678
                </p>
                <p className="text-blue-700 text-sm">
                  📞 中壢門市：(03) 4567-890
                </p>
                <p className="text-blue-700 text-sm">💬 Line@：@blackliving</p>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

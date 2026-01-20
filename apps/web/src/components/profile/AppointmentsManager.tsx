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

type Appointment = {
  id: string;
  customerInfo: {
    name: string;
    phone: string;
    email?: string;
  };
  storeLocation: "中和" | "中壢";
  preferredDate: string;
  preferredTime: "上午" | "下午";
  confirmedDateTime?: string;
  productInterest?: string[];
  status: "pending" | "confirmed" | "completed" | "cancelled";
  notes?: string;
  createdAt: string;
  updatedAt: string;
};

type AppointmentsManagerProps = {
  className?: string;
  onSuccess?: (message: string) => void;
  onError?: (error: string) => void;
};

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
};

function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString("zh-TW", {
    year: "numeric",
    month: "long",
    day: "numeric",
    weekday: "long",
  });
}

type AppointmentActionsProps = {
  appointment: Appointment;
  pendingCancelId: string | null;
  actionLoading: string | null;
  onReschedule: (id: string) => void;
  onRequestCancel: (id: string) => void;
  onConfirmCancel: (id: string) => void;
  onCancelRequest: () => void;
};

function AppointmentActions({
  appointment,
  pendingCancelId,
  actionLoading,
  onReschedule,
  onRequestCancel,
  onConfirmCancel,
  onCancelRequest,
}: AppointmentActionsProps) {
  if (appointment.status === "pending") {
    return (
      <>
        <Button
          className="text-blue-600"
          onClick={() => onReschedule(appointment.id)}
          size="sm"
          variant="outline"
        >
          <RefreshCcw className="mr-1 h-3 w-3" />
          改期
        </Button>
        {pendingCancelId === appointment.id ? (
          <div className="flex flex-col gap-1">
            <p className="text-red-600 text-xs">確定取消？</p>
            <div className="flex gap-1">
              <Button
                className="text-red-600"
                disabled={actionLoading === appointment.id}
                onClick={() => onConfirmCancel(appointment.id)}
                size="sm"
                variant="outline"
              >
                {actionLoading === appointment.id ? (
                  <Loader2 className="h-3 w-3 animate-spin" />
                ) : (
                  "確定"
                )}
              </Button>
              <Button onClick={onCancelRequest} size="sm" variant="ghost">
                取消
              </Button>
            </div>
          </div>
        ) : (
          <Button
            className="text-red-600"
            onClick={() => onRequestCancel(appointment.id)}
            size="sm"
            variant="outline"
          >
            <X className="mr-1 h-3 w-3" />
            取消
          </Button>
        )}
      </>
    );
  }

  if (appointment.status === "confirmed") {
    return (
      <Button
        className="text-blue-600"
        onClick={() => onReschedule(appointment.id)}
        size="sm"
        variant="outline"
      >
        <RefreshCcw className="mr-1 h-3 w-3" />
        改期
      </Button>
    );
  }

  if (appointment.status === "completed") {
    return (
      <Button asChild className="text-green-600" size="sm" variant="outline">
        <a href="/appointment">
          <Plus className="mr-1 h-3 w-3" />
          再預約
        </a>
      </Button>
    );
  }

  return null;
}

type AppointmentCardProps = {
  appointment: Appointment;
  pendingCancelId: string | null;
  actionLoading: string | null;
  onReschedule: (id: string) => void;
  onRequestCancel: (id: string) => void;
  onConfirmCancel: (id: string) => void;
  onCancelRequest: () => void;
};

function AppointmentCard({
  appointment,
  pendingCancelId,
  actionLoading,
  onReschedule,
  onRequestCancel,
  onConfirmCancel,
  onCancelRequest,
}: AppointmentCardProps) {
  return (
    <Card className="relative">
      <CardContent className="pt-4">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="mb-3 flex items-center gap-2">
              <Badge className={statusConfig[appointment.status].color}>
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
                {appointment.confirmedDateTime ? (
                  <div className="font-medium text-blue-600 text-sm">
                    ✓ 已確認時間:{" "}
                    {new Date(appointment.confirmedDateTime).toLocaleString(
                      "zh-TW"
                    )}
                  </div>
                ) : null}
              </div>
            </div>

            {appointment.productInterest
              ? appointment.productInterest.length > 0 && (
                  <div className="mb-3">
                    <p className="mb-1 text-gray-600 text-sm">興趣產品:</p>
                    <div className="flex flex-wrap gap-1">
                      {appointment.productInterest.map((product) => (
                        <Badge
                          className="text-xs"
                          key={product}
                          variant="outline"
                        >
                          {product}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )
              : null}

            {appointment.notes ? (
              <div className="mb-3">
                <p className="mb-1 text-gray-600 text-sm">備註:</p>
                <p className="rounded bg-gray-50 p-2 text-gray-700 text-sm">
                  {appointment.notes}
                </p>
              </div>
            ) : null}

            <p className="text-gray-500 text-xs">
              建立時間:{" "}
              {new Date(appointment.createdAt).toLocaleString("zh-TW")}
            </p>
          </div>

          <div className="ml-4 flex flex-col space-y-2">
            <AppointmentActions
              actionLoading={actionLoading}
              appointment={appointment}
              onCancelRequest={onCancelRequest}
              onConfirmCancel={onConfirmCancel}
              onRequestCancel={onRequestCancel}
              onReschedule={onReschedule}
              pendingCancelId={pendingCancelId}
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
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
  const [pendingCancelId, setPendingCancelId] = useState<string | null>(null);

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

  // Request cancel confirmation
  const requestCancelConfirmation = (appointmentId: string) => {
    setPendingCancelId(appointmentId);
  };

  // Cancel appointment (called after confirmation)
  const cancelAppointment = async (appointmentId: string) => {
    setPendingCancelId(null);
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
  const rescheduleAppointment = (appointmentId: string) => {
    // For now, redirect to booking page with appointment ID
    window.location.href = `/appointment?reschedule=${appointmentId}`;
  };

  // Load appointments on mount
  // biome-ignore lint/correctness/useExhaustiveDependencies: loadAppointments is stable, only run on mount
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
              <AppointmentCard
                actionLoading={actionLoading}
                appointment={appointment}
                key={appointment.id}
                onCancelRequest={() => setPendingCancelId(null)}
                onConfirmCancel={cancelAppointment}
                onRequestCancel={requestCancelConfirmation}
                onReschedule={rescheduleAppointment}
                pendingCancelId={pendingCancelId}
              />
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
                <p className="text-blue-700 text-sm">中和門市</p>
                <p className="text-blue-700 text-sm">中壢門市</p>
                <p className="text-blue-700 text-sm">💬 Line@：@blackking</p>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

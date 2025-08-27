/**
 * AppointmentsManager Component
 * Displays and manages user appointments with booking functionality
 */

import React, { useState, useEffect } from 'react';
import { Button } from '@blackliving/ui';
import { Card, CardContent, CardHeader, CardTitle } from '@blackliving/ui';
import { Badge } from '@blackliving/ui';
import { Alert, AlertDescription } from '@blackliving/ui';
import { 
  Calendar,
  Clock,
  MapPin,
  Phone,
  User,
  RefreshCcw,
  X,
  Plus,
  Loader2
} from 'lucide-react';

interface Appointment {
  id: string;
  customerInfo: {
    name: string;
    phone: string;
    email?: string;
  };
  storeLocation: '中和' | '中壢';
  preferredDate: string;
  preferredTime: '上午' | '下午' | '晚上';
  confirmedDateTime?: string;
  productInterest?: string[];
  status: 'pending' | 'confirmed' | 'completed' | 'cancelled';
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
  pending: { label: '待確認', color: 'bg-yellow-100 text-yellow-800 border-yellow-200' },
  confirmed: { label: '已確認', color: 'bg-blue-100 text-blue-800 border-blue-200' },
  completed: { label: '已完成', color: 'bg-green-100 text-green-800 border-green-200' },
  cancelled: { label: '已取消', color: 'bg-red-100 text-red-800 border-red-200' }
};

const timeSlots = {
  '上午': '09:00 - 12:00',
  '下午': '14:00 - 17:00', 
  '晚上': '19:00 - 21:00'
};

function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString('zh-TW', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    weekday: 'long'
  });
}

export function AppointmentsManager({ className, onSuccess, onError }: AppointmentsManagerProps) {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  // Load appointments
  const loadAppointments = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch('/api/appointments/my', {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include'
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      
      if (result.success && result.data) {
        setAppointments(result.data);
      } else {
        throw new Error(result.error || 'Failed to load appointments');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load appointments';
      setError(errorMessage);
      onError?.(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  // Cancel appointment
  const cancelAppointment = async (appointmentId: string) => {
    if (!confirm('確定要取消這個預約嗎？')) {
      return;
    }

    setActionLoading(appointmentId);
    
    try {
      const response = await fetch(`/api/appointments/${appointmentId}/cancel`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include'
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      
      if (result.success) {
        // Update local state
        setAppointments(prev => 
          prev.map(apt => 
            apt.id === appointmentId 
              ? { ...apt, status: 'cancelled' as const }
              : apt
          )
        );
        onSuccess?.(result.message || '預約已取消');
      } else {
        throw new Error(result.error || 'Failed to cancel appointment');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to cancel appointment';
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
          <Button onClick={loadAppointments} className="mt-4" variant="outline">
            <RefreshCcw className="h-4 w-4 mr-2" />
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
          <Button variant="outline" size="sm" onClick={loadAppointments}>
            <RefreshCcw className="h-4 w-4" />
          </Button>
          <Button asChild size="sm">
            <a href="/appointment">
              <Plus className="h-4 w-4 mr-2" />
              新預約
            </a>
          </Button>
        </div>
      </CardHeader>
      
      <CardContent>
        {isEmpty ? (
          <div className="text-center py-8">
            <Calendar className="h-12 w-12 mx-auto text-gray-400 mb-4" />
            <p className="text-gray-600 mb-2">尚無預約記錄</p>
            <p className="text-sm text-gray-500 mb-4">立即預約免費到府試躺服務</p>
            <Button asChild>
              <a href="/appointment">
                立即預約
              </a>
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            {appointments.map((appointment) => (
              <Card key={appointment.id} className="relative">
                <CardContent className="pt-4">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-3">
                        <Badge className={statusConfig[appointment.status].color}>
                          {statusConfig[appointment.status].label}
                        </Badge>
                        <span className="text-sm text-gray-500">
                          預約編號: {appointment.id.slice(-8)}
                        </span>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-3">
                        <div className="space-y-2">
                          <div className="flex items-center text-sm">
                            <User className="h-4 w-4 mr-2 text-gray-500" />
                            <span>{appointment.customerInfo.name}</span>
                          </div>
                          <div className="flex items-center text-sm">
                            <Phone className="h-4 w-4 mr-2 text-gray-500" />
                            <span>{appointment.customerInfo.phone}</span>
                          </div>
                          <div className="flex items-center text-sm">
                            <MapPin className="h-4 w-4 mr-2 text-gray-500" />
                            <span>{appointment.storeLocation}門市</span>
                          </div>
                        </div>
                        
                        <div className="space-y-2">
                          <div className="flex items-center text-sm">
                            <Calendar className="h-4 w-4 mr-2 text-gray-500" />
                            <span>{formatDate(appointment.preferredDate)}</span>
                          </div>
                          <div className="flex items-center text-sm">
                            <Clock className="h-4 w-4 mr-2 text-gray-500" />
                            <span>{appointment.preferredTime} ({timeSlots[appointment.preferredTime]})</span>
                          </div>
                          {appointment.confirmedDateTime && (
                            <div className="text-sm font-medium text-blue-600">
                              ✓ 已確認時間: {new Date(appointment.confirmedDateTime).toLocaleString('zh-TW')}
                            </div>
                          )}
                        </div>
                      </div>
                      
                      {appointment.productInterest && appointment.productInterest.length > 0 && (
                        <div className="mb-3">
                          <p className="text-sm text-gray-600 mb-1">興趣產品:</p>
                          <div className="flex flex-wrap gap-1">
                            {appointment.productInterest.map((product, index) => (
                              <Badge key={index} variant="outline" className="text-xs">
                                {product}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      )}
                      
                      {appointment.notes && (
                        <div className="mb-3">
                          <p className="text-sm text-gray-600 mb-1">備註:</p>
                          <p className="text-sm text-gray-700 bg-gray-50 p-2 rounded">
                            {appointment.notes}
                          </p>
                        </div>
                      )}
                      
                      <p className="text-xs text-gray-500">
                        建立時間: {new Date(appointment.createdAt).toLocaleString('zh-TW')}
                      </p>
                    </div>
                    
                    <div className="flex flex-col space-y-2 ml-4">
                      {appointment.status === 'pending' && (
                        <>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => rescheduleAppointment(appointment.id)}
                            className="text-blue-600"
                          >
                            <RefreshCcw className="h-3 w-3 mr-1" />
                            改期
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => cancelAppointment(appointment.id)}
                            disabled={actionLoading === appointment.id}
                            className="text-red-600"
                          >
                            {actionLoading === appointment.id ? (
                              <Loader2 className="h-3 w-3 animate-spin" />
                            ) : (
                              <X className="h-3 w-3 mr-1" />
                            )}
                            取消
                          </Button>
                        </>
                      )}
                      
                      {appointment.status === 'confirmed' && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => rescheduleAppointment(appointment.id)}
                          className="text-blue-600"
                        >
                          <RefreshCcw className="h-3 w-3 mr-1" />
                          改期
                        </Button>
                      )}
                      
                      {appointment.status === 'completed' && (
                        <Button
                          asChild
                          variant="outline"
                          size="sm"
                          className="text-green-600"
                        >
                          <a href="/appointment">
                            <Plus className="h-3 w-3 mr-1" />
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
        <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
          <div className="flex items-start space-x-3">
            <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center flex-shrink-0">
              <Phone className="w-4 h-4 text-white" />
            </div>
            <div>
              <h4 className="font-medium text-blue-900 mb-1">需要協助？</h4>
              <p className="text-sm text-blue-800 mb-2">
                如需修改預約時間或有任何問題，請聯繫我們：
              </p>
              <div className="space-y-1">
                <p className="text-sm text-blue-700">📞 中和門市：(02) 2234-5678</p>
                <p className="text-sm text-blue-700">📞 中壢門市：(03) 4567-890</p>
                <p className="text-sm text-blue-700">💬 Line@：@blackliving</p>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
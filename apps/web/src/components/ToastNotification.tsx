import { cn } from "@blackliving/ui";
import { AlertCircle, AlertTriangle, CheckCircle, Info, X } from "lucide-react";
import type { FC } from "react";
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";

interface ToastProps {
  id: string;
  type: "success" | "error" | "warning" | "info";
  title: string;
  message?: string;
  duration?: number;
  onClose: (id: string) => void;
}

const Toast: FC<ToastProps> = ({
  id,
  type,
  title,
  message,
  duration = 5000,
  onClose,
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const [isLeaving, setIsLeaving] = useState(false);

  useEffect(() => {
    // Animate in
    setIsVisible(true);

    // Auto close
    const timer = setTimeout(() => {
      setIsLeaving(true);
      setTimeout(() => onClose(id), 300);
    }, duration);

    return () => clearTimeout(timer);
  }, [id, duration, onClose]);

  const handleClose = () => {
    setIsLeaving(true);
    setTimeout(() => onClose(id), 300);
  };

  const icons = {
    success: CheckCircle,
    error: AlertCircle,
    warning: AlertTriangle,
    info: Info,
  };

  const styles = {
    success: "bg-green-50 border-green-200 text-green-800",
    error: "bg-red-50 border-red-200 text-red-800",
    warning: "bg-yellow-50 border-yellow-200 text-yellow-800",
    info: "bg-blue-50 border-blue-200 text-blue-800",
  };

  const iconStyles = {
    success: "text-green-600",
    error: "text-red-600",
    warning: "text-yellow-600",
    info: "text-blue-600",
  };

  const Icon = icons[type];

  return (
    <div
      className={cn(
        "fixed top-4 right-4 z-50 mx-auto w-96 max-w-sm",
        "rounded-lg border shadow-lg backdrop-blur-sm",
        "transition-all duration-300 ease-out",
        styles[type],
        {
          "translate-x-0 opacity-100": isVisible && !isLeaving,
          "translate-x-full opacity-0": !isVisible || isLeaving,
        }
      )}
    >
      <div className="p-4">
        <div className="flex items-start">
          <div className="flex-shrink-0">
            <Icon className={cn("h-5 w-5", iconStyles[type])} />
          </div>
          <div className="ml-3 w-0 flex-1">
            <div className="font-medium text-sm">{title}</div>
            {message && (
              <div className="mt-1 text-sm opacity-90">{message}</div>
            )}
          </div>
          <div className="ml-4 flex flex-shrink-0">
            <button
              className="inline-flex text-gray-400 transition-colors hover:text-gray-500 focus:text-gray-500 focus:outline-none"
              onClick={handleClose}
              type="button"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

interface ToastNotification {
  id: string;
  type: "success" | "error" | "warning" | "info";
  title: string;
  message?: string;
  duration?: number;
}

interface ToastContextType {
  toasts: ToastNotification[];
  addToast: (toast: Omit<ToastNotification, "id">) => void;
  removeToast: (id: string) => void;
}

// Simple toast manager using React state
export const useToast = () => {
  const [toasts, setToasts] = useState<ToastNotification[]>([]);

  const addToast = (toast: Omit<ToastNotification, "id">) => {
    const id = Math.random().toString(36).slice(2);
    const newToast = { ...toast, id };
    setToasts((prev) => [...prev, newToast]);
  };

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  };

  return { toasts, addToast, removeToast };
};

interface ToastContainerProps {
  toasts: ToastNotification[];
  onRemoveToast: (id: string) => void;
}

export const ToastContainer: FC<ToastContainerProps> = ({
  toasts,
  onRemoveToast,
}) => {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted || typeof window === "undefined") {
    return null;
  }

  return createPortal(
    <div className="pointer-events-none fixed top-0 right-0 z-50 p-4">
      <div className="pointer-events-auto space-y-2">
        {toasts.map((toast) => (
          <Toast
            duration={toast.duration}
            id={toast.id}
            key={toast.id}
            message={toast.message}
            onClose={onRemoveToast}
            title={toast.title}
            type={toast.type}
          />
        ))}
      </div>
    </div>,
    document.body
  );
};

export default Toast;

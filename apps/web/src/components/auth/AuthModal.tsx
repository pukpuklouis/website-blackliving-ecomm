import { useEffect, useState } from "react";
import LoginForm from "./LoginForm";
import RegisterForm from "./RegisterForm";

type AuthModalProps = {
  open: boolean;
  onClose: () => void;
  onAuthenticated?: () => void;
  initialTab?: "login" | "register";
  defaultEmail?: string;
};

export default function AuthModal({
  open,
  onClose,
  onAuthenticated,
  initialTab = "login",
  defaultEmail,
}: AuthModalProps) {
  const [activeTab, setActiveTab] = useState<"login" | "register">(initialTab);

  useEffect(() => {
    if (open) {
      setActiveTab(initialTab);
    } else {
      // Reset to login tab when closed
      setActiveTab("login");
    }
  }, [open, initialTab]);

  if (!open) {
    return null;
  }

  const handleSuccess = () => {
    onAuthenticated?.();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4 backdrop-blur-sm">
      <div className="relative w-full max-w-md rounded-2xl bg-white p-8 shadow-2xl">
        <button
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
          onClick={onClose}
          type="button"
        >
          <svg
            aria-hidden="true"
            aria-label="Close modal"
            className="h-6 w-6"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              d="M6 18L18 6M6 6l12 12"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
            />
          </svg>
        </button>

        <div className="mb-6">
          <div className="flex space-x-4 border-gray-200 border-b">
            <button
              className={`pb-2 font-medium text-lg transition-colors ${
                activeTab === "login"
                  ? "border-black border-b-2 text-black"
                  : "text-gray-500 hover:text-gray-700"
              }`}
              onClick={() => setActiveTab("login")}
              type="button"
            >
              登入
            </button>
            <button
              className={`pb-2 font-medium text-lg transition-colors ${
                activeTab === "register"
                  ? "border-black border-b-2 text-black"
                  : "text-gray-500 hover:text-gray-700"
              }`}
              onClick={() => setActiveTab("register")}
              type="button"
            >
              註冊
            </button>
          </div>
        </div>

        {activeTab === "login" ? (
          <LoginForm defaultEmail={defaultEmail} onSuccess={handleSuccess} />
        ) : (
          <RegisterForm defaultEmail={defaultEmail} onSuccess={handleSuccess} />
        )}
      </div>
    </div>
  );
}

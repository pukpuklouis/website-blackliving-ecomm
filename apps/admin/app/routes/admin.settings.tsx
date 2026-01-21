import { type FormEvent, useState } from "react";
import { useNavigate } from "react-router";
import { useAuth } from "../contexts/AuthContext";

type FormState = {
  confirmPassword: string;
  currentPassword: string;
  email: string;
  name: string;
  newPassword: string;
};

export function AdminSettingsRoute() {
  const { changePassword, logout, updateProfile, user } = useAuth();
  const navigate = useNavigate();
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [message, setMessage] = useState<{
    text: string;
    type: "error" | "success";
  } | null>(null);

  const [formData, setFormData] = useState<FormState>({
    confirmPassword: "",
    currentPassword: "",
    email: user?.email ?? "",
    name: user?.name ?? "",
    newPassword: "",
  });

  const handleProfileUpdate = async (e: FormEvent) => {
    e.preventDefault();

    const result = await updateProfile({
      email: formData.email,
      name: formData.name,
    });

    if (result.error) {
      const userMessage = getUserFriendlyErrorMessage(result.error);
      setMessage({ text: userMessage, type: "error" });
      return;
    }

    if (!result.error) {
      setMessage({ text: "個人資料已更新", type: "success" });
      setIsEditing(false);
    }
  };

  const handlePasswordChange = async (e: FormEvent) => {
    e.preventDefault();

    if (formData.newPassword !== formData.confirmPassword) {
      setMessage({ text: "新密碼不一致", type: "error" });
      return;
    }

    const result = await changePassword({
      currentPassword: formData.currentPassword,
      newPassword: formData.newPassword,
    });

    if (result.error) {
      const userMessage = getPasswordErrorMessage(result.error);
      setMessage({ text: userMessage, type: "error" });
      return;
    }

    setMessage({
      text: "密碼已更改，即將重新登入...",
      type: "success",
    });

    setTimeout(async () => {
      await logout();
      navigate("/admin/login");
    }, 2000);
  };

  function getUserFriendlyErrorMessage(error: {
    message?: string;
    status: number;
  }): string {
    switch (error.status) {
      case 409:
        return "此電子郵箱已被使用";
      case 400:
        return "請檢查輸入的資料格式";
      case 401:
        return "未授權的操作";
      default:
        return error.message ?? "更新失敗，請重試";
    }
  }

  function getPasswordErrorMessage(error: {
    message?: string;
    status: number;
  }): string {
    switch (error.status) {
      case 401:
        return "目前密碼錯誤";
      case 400:
        return "密碼強度不足，請使用更強的密碼";
      default:
        return error.message ?? "密碼更改失敗，請重試";
    }
  }

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="mx-auto max-w-2xl">
        <h1 className="mb-6 font-bold text-2xl text-gray-900">帳戶設定</h1>

        {/* Alert Messages */}
        {message ? (
          <div
            className={`mb-4 rounded-md p-4 ${
              message.type === "success"
                ? "bg-green-100 text-green-800"
                : "bg-red-100 text-red-800"
            }`}
          >
            {message.text}
          </div>
        ) : null}

        {/* Profile Section */}
        <div className="mb-6 rounded-lg bg-white p-6 shadow-md">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-semibold text-gray-900 text-lg">個人資料</h2>
            {!isEditing && (
              <button
                className="rounded-md bg-blue-600 px-4 py-2 text-white hover:bg-blue-700"
                onClick={() => setIsEditing(true)}
                type="button"
              >
                編輯
              </button>
            )}
          </div>

          {isEditing ? (
            <form className="space-y-4" onSubmit={handleProfileUpdate}>
              <div>
                <label
                  className="mb-1 block font-medium text-gray-700 text-sm"
                  htmlFor="name"
                >
                  管理員名稱
                </label>
                <input
                  className="w-full rounded-md border border-gray-300 px-3 py-2 focus:border-transparent focus:ring-2 focus:ring-blue-500"
                  id="name"
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, name: e.target.value }))
                  }
                  required
                  type="text"
                  value={formData.name}
                />
              </div>
              <div>
                <label
                  className="mb-1 block font-medium text-gray-700 text-sm"
                  htmlFor="email"
                >
                  電子郵箱
                </label>
                <input
                  className="w-full rounded-md border border-gray-300 px-3 py-2 focus:border-transparent focus:ring-2 focus:ring-blue-500"
                  id="email"
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, email: e.target.value }))
                  }
                  required
                  type="email"
                  value={formData.email}
                />
              </div>
              <div className="flex gap-2">
                <button
                  className="flex-1 rounded-md bg-blue-600 px-4 py-2 text-white hover:bg-blue-700"
                  type="submit"
                >
                  儲存
                </button>
                <button
                  className="rounded-md bg-gray-200 px-4 py-2 text-gray-800 hover:bg-gray-300"
                  onClick={() => setIsEditing(false)}
                  type="button"
                >
                  取消
                </button>
              </div>
            </form>
          ) : (
            <div className="space-y-3">
              <div>
                <span className="block font-medium text-gray-700 text-sm">
                  電子郵箱
                </span>
                <p className="text-gray-900">{user.email}</p>
              </div>
              <div>
                <span className="block font-medium text-gray-700 text-sm">
                  管理員名稱
                </span>
                <p className="text-gray-900">
                  {user.name ?? user.email?.split("@")[0]}
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Password Change Section */}
        <div className="rounded-lg bg-white p-6 shadow-md">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-semibold text-gray-900 text-lg">更改密碼</h2>
            {!isChangingPassword && (
              <button
                className="rounded-md bg-blue-600 px-4 py-2 text-white hover:bg-blue-700"
                onClick={() => setIsChangingPassword(true)}
                type="button"
              >
                更改密碼
              </button>
            )}
          </div>

          {isChangingPassword ? (
            <form className="space-y-4" onSubmit={handlePasswordChange}>
              <div>
                <label
                  className="mb-1 block font-medium text-gray-700 text-sm"
                  htmlFor="currentPassword"
                >
                  目前密碼
                </label>
                <input
                  className="w-full rounded-md border border-gray-300 px-3 py-2 focus:border-transparent focus:ring-2 focus:ring-blue-500"
                  id="currentPassword"
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      currentPassword: e.target.value,
                    }))
                  }
                  required
                  type="password"
                  value={formData.currentPassword}
                />
              </div>
              <div>
                <label
                  className="mb-1 block font-medium text-gray-700 text-sm"
                  htmlFor="newPassword"
                >
                  新密碼
                </label>
                <input
                  className="w-full rounded-md border border-gray-300 px-3 py-2 focus:border-transparent focus:ring-2 focus:ring-blue-500"
                  id="newPassword"
                  minLength={8}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      newPassword: e.target.value,
                    }))
                  }
                  required
                  type="password"
                  value={formData.newPassword}
                />
              </div>
              <div>
                <label
                  className="mb-1 block font-medium text-gray-700 text-sm"
                  htmlFor="confirmPassword"
                >
                  確認新密碼
                </label>
                <input
                  className="w-full rounded-md border border-gray-300 px-3 py-2 focus:border-transparent focus:ring-2 focus:ring-blue-500"
                  id="confirmPassword"
                  minLength={8}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      confirmPassword: e.target.value,
                    }))
                  }
                  required
                  type="password"
                  value={formData.confirmPassword}
                />
              </div>
              <div className="flex gap-2">
                <button
                  className="flex-1 rounded-md bg-blue-600 px-4 py-2 text-white hover:bg-blue-700"
                  type="submit"
                >
                  更改
                </button>
                <button
                  className="rounded-md bg-gray-200 px-4 py-2 text-gray-800 hover:bg-gray-300"
                  onClick={() => setIsChangingPassword(false)}
                  type="button"
                >
                  取消
                </button>
              </div>
            </form>
          ) : (
            <p className="text-gray-600 text-sm">
              定期更改密碼以保護您的帳戶安全
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

export default AdminSettingsRoute;

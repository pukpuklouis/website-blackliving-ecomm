import {
  Alert,
  AlertDescription,
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Input,
  Label,
} from "@blackliving/ui";
import { type FormEvent, useState } from "react";
import { useNavigate } from "react-router";
import { useAuth } from "../../contexts/AuthContext";

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
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="font-semibold text-2xl text-gray-900">帳戶設定</h1>
      </div>

      {message && (
        <Alert variant={message.type === "error" ? "destructive" : "default"}>
          <AlertDescription>{message.text}</AlertDescription>
        </Alert>
      )}

      <Card>
        <CardHeader className="flex flex-row items-start justify-between space-y-0">
          <div className="space-y-1">
            <CardTitle>個人資料</CardTitle>
            <CardDescription>更新管理員名稱與電子郵箱</CardDescription>
          </div>
          {!isEditing && (
            <Button onClick={() => setIsEditing(true)} size="sm" type="button">
              編輯
            </Button>
          )}
        </CardHeader>
        <CardContent className="space-y-4">
          {isEditing ? (
            <form className="space-y-4" onSubmit={handleProfileUpdate}>
              <div className="space-y-2">
                <Label htmlFor="name">管理員名稱</Label>
                <Input
                  id="name"
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, name: e.target.value }))
                  }
                  required
                  type="text"
                  value={formData.name}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">電子郵箱</Label>
                <Input
                  id="email"
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, email: e.target.value }))
                  }
                  required
                  type="email"
                  value={formData.email}
                />
              </div>
              <div className="flex flex-col gap-2 sm:flex-row sm:justify-end">
                <Button type="submit">儲存</Button>
                <Button
                  onClick={() => setIsEditing(false)}
                  type="button"
                  variant="outline"
                >
                  取消
                </Button>
              </div>
            </form>
          ) : (
            <div className="space-y-4">
              <div className="space-y-1">
                <p className="text-muted-foreground text-sm">電子郵箱</p>
                <p className="text-sm font-medium">{user.email}</p>
              </div>
              <div className="space-y-1">
                <p className="text-muted-foreground text-sm">管理員名稱</p>
                <p className="text-sm font-medium">
                  {user.name ?? user.email?.split("@")[0]}
                </p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-start justify-between space-y-0">
          <div className="space-y-1">
            <CardTitle>更改密碼</CardTitle>
            <CardDescription>定期更新密碼以保護帳戶安全</CardDescription>
          </div>
          {!isChangingPassword && (
            <Button
              onClick={() => setIsChangingPassword(true)}
              size="sm"
              type="button"
            >
              更改密碼
            </Button>
          )}
        </CardHeader>
        <CardContent className="space-y-4">
          {isChangingPassword ? (
            <form className="space-y-4" onSubmit={handlePasswordChange}>
              <div className="space-y-2">
                <Label htmlFor="currentPassword">目前密碼</Label>
                <Input
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
              <div className="space-y-2">
                <Label htmlFor="newPassword">新密碼</Label>
                <Input
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
              <div className="space-y-2">
                <Label htmlFor="confirmPassword">確認新密碼</Label>
                <Input
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
              <div className="flex flex-col gap-2 sm:flex-row sm:justify-end">
                <Button type="submit">更改</Button>
                <Button
                  onClick={() => setIsChangingPassword(false)}
                  type="button"
                  variant="outline"
                >
                  取消
                </Button>
              </div>
            </form>
          ) : (
            <p className="text-muted-foreground text-sm">
              定期更改密碼以保護您的帳戶安全
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

export default AdminSettingsRoute;

import {
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Input,
  Label,
  Separator,
} from "@blackliving/ui";
import { Save, Send, Settings } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { useEnvironment } from "../contexts/EnvironmentContext";

interface LineSettingsData {
  channelAccessToken: string;
  adminUserId: string;
}

export default function LineSettings() {
  const { PUBLIC_API_URL } = useEnvironment();
  const API_BASE = PUBLIC_API_URL;

  const [settings, setSettings] = useState<LineSettingsData>({
    channelAccessToken: "",
    adminUserId: "",
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      setLoading(true);
      const response = await fetch(
        `${API_BASE}/api/settings/line_notification`,
        {
          credentials: "include",
        }
      );
      if (response.ok) {
        const result = await response.json();
        setSettings(
          result.data || {
            channelAccessToken: "",
            adminUserId: "",
          }
        );
      } else if (response.status === 404) {
        // Not configured yet
        setSettings({
          channelAccessToken: "",
          adminUserId: "",
        });
      }
    } catch (error) {
      console.error("Failed to load LINE settings:", error);
      toast.error("載入 LINE 設定失敗");
    } finally {
      setLoading(false);
    }
  };

  const saveSettings = async () => {
    try {
      setSaving(true);
      const response = await fetch(
        `${API_BASE}/api/settings/line_notification`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify(settings),
        }
      );

      if (response.ok) {
        toast.success("LINE 設定已儲存");
      } else {
        const data = await response.json();
        throw new Error(data.message || "Failed to save settings");
      }
    } catch (error: any) {
      console.error("Failed to save LINE settings:", error);
      toast.error(error.message || "儲存 LINE 設定失敗");
    } finally {
      setSaving(false);
    }
  };

  const testConnection = async () => {
    try {
      setTesting(true);
      // First save the current settings to ensure backend uses the latest
      await saveSettings();

      const response = await fetch(`${API_BASE}/api/settings/line/test`, {
        method: "POST",
        credentials: "include",
      });

      const data = await response.json();

      if (response.ok && data.success) {
        toast.success("測試訊息發送成功");
      } else {
        // Combine main message with detailed error if available
        const errorMessage = data.error?.message
          ? `${data.message}: ${data.error.message}`
          : data.message || "Test failed";
        throw new Error(errorMessage);
      }
    } catch (error: any) {
      console.error("Failed to send test message:", error);
      toast.error(error.message || "測試訊息發送失敗，請檢查設定是否正確");
    } finally {
      setTesting(false);
    }
  };

  if (loading) {
    return <div className="p-8 text-center">載入中...</div>;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Settings className="h-5 w-5" />
          LINE 通知設定
        </CardTitle>
        <CardDescription>
          設定 LINE Messaging API 憑證以啟用預約通知功能
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="channelAccessToken">Channel Access Token</Label>
            <Input
              id="channelAccessToken"
              onChange={(e) =>
                setSettings((prev) => ({
                  ...prev,
                  channelAccessToken: e.target.value,
                }))
              }
              placeholder="輸入 Channel Access Token"
              type="password"
              value={settings.channelAccessToken}
            />
            <p className="text-muted-foreground text-sm">
              請從 LINE Developers Console 獲取長效存取權杖 (Long-lived Access
              Token)
            </p>
          </div>
          <div className="space-y-2">
            <Label htmlFor="adminUserId">Admin User ID</Label>
            <Input
              id="adminUserId"
              onChange={(e) =>
                setSettings((prev) => ({
                  ...prev,
                  adminUserId: e.target.value,
                }))
              }
              placeholder="輸入接收通知的 User ID"
              value={settings.adminUserId}
            />
            <p className="text-muted-foreground text-sm">
              這是用於接收管理通知的 LINE User ID (非一般 ID)
            </p>
          </div>
        </div>

        <Separator />

        <div className="flex items-center justify-between">
          <Button
            disabled={
              testing ||
              saving ||
              !settings.channelAccessToken ||
              !settings.adminUserId
            }
            onClick={testConnection}
            variant="outline"
          >
            <Send className="mr-2 h-4 w-4" />
            {testing ? "發送中..." : "發送測試訊息"}
          </Button>

          <Button disabled={saving} onClick={saveSettings}>
            <Save className="mr-2 h-4 w-4" />
            {saving ? "儲存中..." : "儲存設定"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

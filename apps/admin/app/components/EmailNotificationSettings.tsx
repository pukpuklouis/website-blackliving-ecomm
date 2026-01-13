import {
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Checkbox,
  Input,
  Label,
  Separator,
} from "@blackliving/ui";
import { Mail, Save, Send, Settings } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { useEnvironment } from "../contexts/EnvironmentContext";

type NotificationSettingsData = {
  adminEmails: string[];
  customerServiceEmail: string;
  enableNewOrderAdmin: boolean;
  enablePaymentConfirmAdmin: boolean;
  enableAppointmentAdmin: boolean;
  enableBankTransferCustomer: boolean;
  enableOrderShippedCustomer: boolean;
  enableAppointmentCustomer: boolean;
  senderName: string;
  replyToEmail: string;
};

type BankAccountData = {
  bankName: string;
  bankCode: string;
  branchName: string;
  branchCode: string;
  accountNumber: string;
  accountHolder: string;
  notes: string;
};

export default function EmailNotificationSettings() {
  const { PUBLIC_API_URL } = useEnvironment();
  const API_BASE = PUBLIC_API_URL;

  const [settings, setSettings] = useState<NotificationSettingsData>({
    adminEmails: [],
    customerServiceEmail: "",
    enableNewOrderAdmin: true,
    enablePaymentConfirmAdmin: true,
    enableAppointmentAdmin: true,
    enableBankTransferCustomer: true,
    enableOrderShippedCustomer: true,
    enableAppointmentCustomer: true,
    senderName: "Black Living 黑哥居家",
    replyToEmail: "service@blackliving.tw",
  });

  const [bankAccount, setBankAccount] = useState<BankAccountData>({
    bankName: "",
    bankCode: "",
    branchName: "",
    branchCode: "",
    accountNumber: "",
    accountHolder: "",
    notes: "",
  });

  const [adminEmailsInput, setAdminEmailsInput] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);

  useEffect(() => {
    const loadSettings = async () => {
      try {
        setLoading(true);

        // Load notification settings
        const notifResponse = await fetch(
          `${API_BASE}/api/admin/settings/notifications`,
          { credentials: "include" }
        );
        if (notifResponse.ok) {
          const result = await notifResponse.json();
          if (result.data) {
            setSettings(result.data);
            setAdminEmailsInput((result.data.adminEmails || []).join(", "));
          }
        }

        // Load bank account info
        const bankResponse = await fetch(
          `${API_BASE}/api/admin/settings/notifications/bank-info`,
          { credentials: "include" }
        );
        if (bankResponse.ok) {
          const result = await bankResponse.json();
          if (result.data?.[0]) {
            setBankAccount(result.data[0]);
          }
        }
      } catch (error) {
        console.error("Failed to load settings:", error);
        toast.error("載入設定失敗");
      } finally {
        setLoading(false);
      }
    };

    loadSettings();
  }, [API_BASE]);

  const saveNotificationSettings = async () => {
    try {
      setSaving(true);
      const emails = adminEmailsInput
        .split(",")
        .map((e) => e.trim())
        .filter(Boolean);

      const response = await fetch(
        `${API_BASE}/api/admin/settings/notifications`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({
            ...settings,
            adminEmails: emails,
          }),
        }
      );

      if (response.ok) {
        toast.success("Email 通知設定已儲存");
      } else {
        const data = await response.json();
        throw new Error(data.message || "儲存失敗");
      }
    } catch (error: unknown) {
      console.error("Failed to save notification settings:", error);
      toast.error(
        (error instanceof Error ? error.message : null) ||
          "儲存 Email 通知設定失敗"
      );
    } finally {
      setSaving(false);
    }
  };

  const saveBankAccount = async () => {
    try {
      setSaving(true);
      const response = await fetch(
        `${API_BASE}/api/admin/settings/notifications/bank-info`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify(bankAccount),
        }
      );

      if (response.ok) {
        toast.success("銀行帳戶資訊已儲存");
      } else {
        const data = await response.json();
        throw new Error(data.message || "儲存失敗");
      }
    } catch (error: unknown) {
      console.error("Failed to save bank account:", error);
      toast.error(
        (error instanceof Error ? error.message : null) ||
          "儲存銀行帳戶資訊失敗"
      );
    } finally {
      setSaving(false);
    }
  };

  const sendTestEmail = async () => {
    try {
      setTesting(true);
      const response = await fetch(
        `${API_BASE}/api/admin/settings/notifications/test`,
        {
          method: "POST",
          credentials: "include",
        }
      );

      const data = await response.json();
      if (response.ok && data.success) {
        toast.success(data.message || "測試郵件已發送");
      } else {
        throw new Error(data.message || "發送失敗");
      }
    } catch (error: unknown) {
      console.error("Failed to send test email:", error);
      toast.error(
        (error instanceof Error ? error.message : null) || "測試郵件發送失敗"
      );
    } finally {
      setTesting(false);
    }
  };

  if (loading) {
    return <div className="p-8 text-center">載入中...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Notification Recipients */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Mail className="h-5 w-5" />
            Email 通知設定
          </CardTitle>
          <CardDescription>設定訂單和預約通知的收件人和偏好</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="adminEmails">管理員通知信箱</Label>
              <Input
                id="adminEmails"
                onChange={(e) => setAdminEmailsInput(e.target.value)}
                placeholder="admin1@example.com, admin2@example.com"
                value={adminEmailsInput}
              />
              <p className="text-muted-foreground text-sm">
                多個信箱請用逗號分隔
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="senderName">寄件者名稱</Label>
              <Input
                id="senderName"
                onChange={(e) =>
                  setSettings((prev) => ({
                    ...prev,
                    senderName: e.target.value,
                  }))
                }
                placeholder="Black Living 黑哥居家"
                value={settings.senderName}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="replyToEmail">回覆地址</Label>
              <Input
                id="replyToEmail"
                onChange={(e) =>
                  setSettings((prev) => ({
                    ...prev,
                    replyToEmail: e.target.value,
                  }))
                }
                placeholder="service@blackliving.tw"
                type="email"
                value={settings.replyToEmail}
              />
            </div>
          </div>

          <Separator />

          <div className="space-y-4">
            <h4 className="font-medium">管理員通知</h4>
            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <Checkbox
                  checked={settings.enableNewOrderAdmin}
                  id="enableNewOrderAdmin"
                  onCheckedChange={(checked) =>
                    setSettings((prev) => ({
                      ...prev,
                      enableNewOrderAdmin: !!checked,
                    }))
                  }
                />
                <Label htmlFor="enableNewOrderAdmin">新訂單通知</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  checked={settings.enablePaymentConfirmAdmin}
                  id="enablePaymentConfirmAdmin"
                  onCheckedChange={(checked) =>
                    setSettings((prev) => ({
                      ...prev,
                      enablePaymentConfirmAdmin: !!checked,
                    }))
                  }
                />
                <Label htmlFor="enablePaymentConfirmAdmin">付款確認通知</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  checked={settings.enableAppointmentAdmin}
                  id="enableAppointmentAdmin"
                  onCheckedChange={(checked) =>
                    setSettings((prev) => ({
                      ...prev,
                      enableAppointmentAdmin: !!checked,
                    }))
                  }
                />
                <Label htmlFor="enableAppointmentAdmin">新預約通知</Label>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <h4 className="font-medium">客戶通知</h4>
            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <Checkbox
                  checked={settings.enableBankTransferCustomer}
                  id="enableBankTransferCustomer"
                  onCheckedChange={(checked) =>
                    setSettings((prev) => ({
                      ...prev,
                      enableBankTransferCustomer: !!checked,
                    }))
                  }
                />
                <Label htmlFor="enableBankTransferCustomer">
                  銀行轉帳確認信
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  checked={settings.enableOrderShippedCustomer}
                  id="enableOrderShippedCustomer"
                  onCheckedChange={(checked) =>
                    setSettings((prev) => ({
                      ...prev,
                      enableOrderShippedCustomer: !!checked,
                    }))
                  }
                />
                <Label htmlFor="enableOrderShippedCustomer">出貨通知</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  checked={settings.enableAppointmentCustomer}
                  id="enableAppointmentCustomer"
                  onCheckedChange={(checked) =>
                    setSettings((prev) => ({
                      ...prev,
                      enableAppointmentCustomer: !!checked,
                    }))
                  }
                />
                <Label htmlFor="enableAppointmentCustomer">預約確認信</Label>
              </div>
            </div>
          </div>

          <Separator />

          <div className="flex items-center justify-between">
            <Button
              disabled={testing || saving || !adminEmailsInput.trim()}
              onClick={sendTestEmail}
              variant="outline"
            >
              <Send className="mr-2 h-4 w-4" />
              {testing ? "發送中..." : "發送測試郵件"}
            </Button>

            <Button disabled={saving} onClick={saveNotificationSettings}>
              <Save className="mr-2 h-4 w-4" />
              {saving ? "儲存中..." : "儲存設定"}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Bank Account Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            銀行帳戶資訊
          </CardTitle>
          <CardDescription>
            設定銀行轉帳資訊，將顯示在訂單確認信中
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="bankName">銀行名稱 *</Label>
              <Input
                id="bankName"
                onChange={(e) =>
                  setBankAccount((prev) => ({
                    ...prev,
                    bankName: e.target.value,
                  }))
                }
                placeholder="例：台新國際商業銀行"
                value={bankAccount.bankName}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="bankCode">銀行代碼</Label>
              <Input
                id="bankCode"
                onChange={(e) =>
                  setBankAccount((prev) => ({
                    ...prev,
                    bankCode: e.target.value,
                  }))
                }
                placeholder="例：812"
                value={bankAccount.bankCode}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="branchName">分行名稱</Label>
              <Input
                id="branchName"
                onChange={(e) =>
                  setBankAccount((prev) => ({
                    ...prev,
                    branchName: e.target.value,
                  }))
                }
                placeholder="例：中山分行"
                value={bankAccount.branchName}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="branchCode">分行代碼</Label>
              <Input
                id="branchCode"
                onChange={(e) =>
                  setBankAccount((prev) => ({
                    ...prev,
                    branchCode: e.target.value,
                  }))
                }
                placeholder="例：0210"
                value={bankAccount.branchCode}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="accountNumber">帳號 *</Label>
              <Input
                id="accountNumber"
                onChange={(e) =>
                  setBankAccount((prev) => ({
                    ...prev,
                    accountNumber: e.target.value,
                  }))
                }
                placeholder="輸入銀行帳號"
                value={bankAccount.accountNumber}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="accountHolder">戶名 *</Label>
              <Input
                id="accountHolder"
                onChange={(e) =>
                  setBankAccount((prev) => ({
                    ...prev,
                    accountHolder: e.target.value,
                  }))
                }
                placeholder="輸入帳戶戶名"
                value={bankAccount.accountHolder}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">備註</Label>
            <Input
              id="notes"
              onChange={(e) =>
                setBankAccount((prev) => ({ ...prev, notes: e.target.value }))
              }
              placeholder="例：匯款時請在備註填寫訂單編號"
              value={bankAccount.notes}
            />
          </div>

          <Separator />

          <div className="flex justify-end">
            <Button
              disabled={
                saving ||
                !bankAccount.bankName ||
                !bankAccount.accountNumber ||
                !bankAccount.accountHolder
              }
              onClick={saveBankAccount}
            >
              <Save className="mr-2 h-4 w-4" />
              {saving ? "儲存中..." : "儲存銀行資訊"}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

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
  Switch,
} from "@blackliving/ui";
import { CreditCard, Loader2, Save, TestTube2 } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { useApiUrl } from "../contexts/EnvironmentContext";

type GomypayConfig = {
  hasConfig: boolean;
  customerId: string;
  hasStrCheck?: boolean;
  isTestMode: boolean;
  returnUrl: string;
  callbackUrl: string;
  enableApplePay: boolean;
  enableGooglePay: boolean;
  enableVirtualAccount: boolean;
};

type TestResult = {
  success: boolean;
  message: string;
  environment?: string;
};

export default function GomypaySettings() {
  const apiUrl = useApiUrl();
  const [config, setConfig] = useState<GomypayConfig>({
    hasConfig: false,
    customerId: "",
    isTestMode: true,
    returnUrl: "",
    callbackUrl: "",
    enableApplePay: false,
    enableGooglePay: false,
    enableVirtualAccount: false,
  });
  const [strCheck, setStrCheck] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState<TestResult | null>(null);

  // Load existing configuration on mount
  useEffect(() => {
    const parseConfigResponse = (
      data: Record<string, unknown>
    ): GomypayConfig => ({
      hasConfig: Boolean(data.hasConfig),
      customerId: String(data.customerId || ""),
      hasStrCheck: Boolean(data.hasStrCheck),
      isTestMode: data.isTestMode !== false,
      returnUrl: String(data.returnUrl || ""),
      callbackUrl: String(data.callbackUrl || ""),
      enableApplePay: Boolean(data.enableApplePay),
      enableGooglePay: Boolean(data.enableGooglePay),
      enableVirtualAccount: Boolean(data.enableVirtualAccount),
    });

    const loadConfig = async () => {
      try {
        const response = await fetch(`${apiUrl}/api/payment/config`, {
          credentials: "include",
        });
        if (response.ok) {
          const result = await response.json();
          if (result.success && result.data) {
            setConfig(parseConfigResponse(result.data));
          }
        }
      } catch (error) {
        console.error("Failed to load GOMYPAY config:", error);
      }
    };

    loadConfig();
  }, [apiUrl]);

  const validateSaveConfig = (): string | null => {
    if (!config.customerId) {
      return "請輸入商店代號";
    }
    const needsStrCheck = !(strCheck || config.hasStrCheck);
    if (needsStrCheck) {
      return "請輸入交易驗證密碼";
    }
    const strCheckInvalid = strCheck.length > 0 && strCheck.length !== 32;
    if (strCheckInvalid) {
      return "交易驗證密碼必須為 32 字元";
    }
    return null;
  };

  const handleSaveConfig = async () => {
    const validationError = validateSaveConfig();
    if (validationError) {
      toast.error(validationError);
      return;
    }

    setIsLoading(true);
    setTestResult(null);

    try {
      const response = await fetch(`${apiUrl}/api/payment/config`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          customerId: config.customerId,
          strCheck: strCheck || undefined,
          isTestMode: config.isTestMode,
          returnUrl: config.returnUrl || undefined,
          callbackUrl: config.callbackUrl || undefined,
          enableApplePay: config.enableApplePay,
          enableGooglePay: config.enableGooglePay,
          enableVirtualAccount: config.enableVirtualAccount,
        }),
      });

      const result = await response.json();

      if (result.success) {
        toast.success("GOMYPAY 設定已儲存");
        setStrCheck("");
        setConfig((prev) => ({ ...prev, hasStrCheck: true, hasConfig: true }));
      } else {
        toast.error(result.error || "儲存失敗");
      }
    } catch (error) {
      console.error("Failed to save GOMYPAY config:", error);
      toast.error("儲存失敗，請稍後再試");
    } finally {
      setIsLoading(false);
    }
  };

  const handleTestConnection = async () => {
    if (!config.hasConfig) {
      toast.error("請先儲存設定");
      return;
    }

    setIsTesting(true);
    setTestResult(null);

    try {
      const response = await fetch(`${apiUrl}/api/payment/test-connection`, {
        method: "POST",
        credentials: "include",
      });

      const result = await response.json();
      setTestResult(result);

      if (result.success) {
        toast.success(result.message);
      } else {
        toast.error(result.message);
      }
    } catch (error) {
      console.error("Failed to test GOMYPAY connection:", error);
      toast.error("連線測試失敗");
    } finally {
      setIsTesting(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <CreditCard className="h-5 w-5" />
          <CardTitle>GOMYPAY 金流設定</CardTitle>
        </div>
        <CardDescription>
          配置 GOMYPAY 金流串接參數，啟用線上信用卡及行動支付功能
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Test Mode Toggle */}
        <div className="flex items-center justify-between rounded-lg border bg-gray-50 p-4">
          <div className="space-y-0.5">
            <Label className="font-medium text-base">測試模式</Label>
            <p className="text-muted-foreground text-sm">
              啟用測試模式將使用 GOMYPAY 測試環境，不會產生實際交易
            </p>
          </div>
          <Switch
            checked={config.isTestMode}
            onCheckedChange={(checked) =>
              setConfig((prev) => ({ ...prev, isTestMode: checked }))
            }
          />
        </div>

        {/* Credentials */}
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="customer-id">商店代號 (CustomerId)</Label>
            <Input
              id="customer-id"
              onChange={(e) =>
                setConfig((prev) => ({ ...prev, customerId: e.target.value }))
              }
              placeholder="統一編號或 32 碼加密代號"
              value={config.customerId}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="str-check">交易驗證密碼 (Str_Check)</Label>
            <Input
              id="str-check"
              onChange={(e) => setStrCheck(e.target.value)}
              placeholder={
                config.hasStrCheck
                  ? "已設定 (若需修改請輸入新的密碼)"
                  : "32 字元驗證密碼"
              }
              type="password"
              value={strCheck}
            />
            {config.hasStrCheck ? (
              <p className="text-green-600 text-sm">✓ 目前已設定驗證密碼</p>
            ) : null}
          </div>
        </div>

        {/* URLs */}
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="return-url">付款完成返回網址 (Return URL)</Label>
            <Input
              id="return-url"
              onChange={(e) =>
                setConfig((prev) => ({ ...prev, returnUrl: e.target.value }))
              }
              placeholder="https://yoursite.com/checkout/payment-callback"
              type="url"
              value={config.returnUrl}
            />
            <p className="text-muted-foreground text-xs">
              付款完成後，GOMYPAY 會將客戶導回此網址
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="callback-url">背景對帳網址 (Callback URL)</Label>
            <Input
              id="callback-url"
              onChange={(e) =>
                setConfig((prev) => ({ ...prev, callbackUrl: e.target.value }))
              }
              placeholder="https://yoursite.com/api/payment/webhook"
              type="url"
              value={config.callbackUrl}
            />
            <p className="text-muted-foreground text-xs">
              GOMYPAY 會在付款成功後發送通知到此網址進行對帳
            </p>
          </div>
        </div>

        {/* Payment Method Toggles */}
        <div className="space-y-4">
          <h3 className="font-medium text-sm">可用付款方式</h3>
          <div className="space-y-3">
            <div className="flex items-center justify-between rounded-lg border p-3">
              <div className="space-y-0.5">
                <Label className="text-sm">Apple Pay</Label>
                <p className="text-muted-foreground text-xs">
                  啟用後結帳頁面將顯示 Apple Pay 選項
                </p>
              </div>
              <Switch
                checked={config.enableApplePay}
                onCheckedChange={(checked) =>
                  setConfig((prev) => ({ ...prev, enableApplePay: checked }))
                }
              />
            </div>
            <div className="flex items-center justify-between rounded-lg border p-3">
              <div className="space-y-0.5">
                <Label className="text-sm">Google Pay</Label>
                <p className="text-muted-foreground text-xs">
                  啟用後結帳頁面將顯示 Google Pay 選項
                </p>
              </div>
              <Switch
                checked={config.enableGooglePay}
                onCheckedChange={(checked) =>
                  setConfig((prev) => ({ ...prev, enableGooglePay: checked }))
                }
              />
            </div>
            <div className="flex items-center justify-between rounded-lg border p-3">
              <div className="space-y-0.5">
                <Label className="text-sm">虛擬帳號付款</Label>
                <p className="text-muted-foreground text-xs">
                  啟用後結帳頁面將顯示虛擬帳號選項
                </p>
              </div>
              <Switch
                checked={config.enableVirtualAccount}
                onCheckedChange={(checked) =>
                  setConfig((prev) => ({
                    ...prev,
                    enableVirtualAccount: checked,
                  }))
                }
              />
            </div>
          </div>
        </div>

        {/* Test Result */}
        {testResult ? (
          <Alert variant={testResult.success ? "default" : "destructive"}>
            <AlertDescription>
              <div className="flex items-center justify-between">
                <span>{testResult.message}</span>
                {testResult.environment ? (
                  <span className="rounded bg-gray-100 px-2 py-1 text-xs">
                    {testResult.environment}
                  </span>
                ) : null}
              </div>
            </AlertDescription>
          </Alert>
        ) : null}

        {/* Actions */}
        <div className="flex gap-3">
          <Button
            className="flex items-center gap-2"
            disabled={isLoading}
            onClick={handleSaveConfig}
          >
            {isLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Save className="h-4 w-4" />
            )}
            {isLoading ? "儲存中..." : "儲存設定"}
          </Button>

          <Button
            className="flex items-center gap-2"
            disabled={isTesting || !config.hasConfig}
            onClick={handleTestConnection}
            variant="outline"
          >
            {isTesting ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <TestTube2 className="h-4 w-4" />
            )}
            {isTesting ? "測試中..." : "測試連線"}
          </Button>
        </div>

        {/* Help Text */}
        <div className="rounded-lg border bg-blue-50 p-4 text-sm">
          <h4 className="mb-2 font-semibold text-blue-900">設定說明</h4>
          <ul className="list-inside list-disc space-y-1 text-blue-700">
            <li>商店代號及驗證密碼請向 GOMYPAY 客服索取</li>
            <li>測試模式下的交易不會產生實際扣款</li>
            <li>正式上線前請務必關閉測試模式並測試完整付款流程</li>
            <li>GOMYPAY 客服電話: 02-24286860，Email: customer@gomypay.asia</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
}

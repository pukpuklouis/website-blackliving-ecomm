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
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@blackliving/ui";
import {
  Loader2,
  MessageSquare,
  RefreshCw,
  Save,
  Search,
  Settings,
  Truck,
} from "lucide-react";
import { useEffect, useState } from "react";
import LineSettings from "../../components/LineSettings";
import LogisticSettings from "../../components/LogisticSettings";
import { useEnvironment } from "../../contexts/EnvironmentContext";
import {
  getSearchConfig,
  saveSearchConfig,
  triggerReindex,
} from "../../services/searchService";

export default function SettingsPage() {
  const { PUBLIC_API_URL } = useEnvironment();
  const [searchConfig, setSearchConfig] = useState({
    host: "",
    masterKey: "",
    indexName: "blackliving_content",
    hasMasterKey: false,
  });
  const [isLoading, setIsLoading] = useState(false);
  const [isReindexing, setIsReindexing] = useState(false);
  const [message, setMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);
  const [reindexResult, setReindexResult] = useState<{
    indexed: number;
    errors: string[];
  } | null>(null);

  // Load existing configuration on mount
  useEffect(() => {
    const loadConfig = async () => {
      try {
        const config = await getSearchConfig(PUBLIC_API_URL);
        if (config) {
          setSearchConfig({
            host: config.host,
            masterKey: "", // Don't show master key for security
            indexName: config.indexName,
            hasMasterKey: config.hasMasterKey,
          });
        }
      } catch (error) {
        console.error("Failed to load search config:", error);
      }
    };

    loadConfig();
  }, []);

  const handleSaveConfig = async () => {
    if (
      !searchConfig.host ||
      !(searchConfig.masterKey || searchConfig.hasMasterKey)
    ) {
      setMessage({
        type: "error",
        text: "Host URL and Master Key are required",
      });
      return;
    }

    setIsLoading(true);
    setMessage(null);

    try {
      const result = await saveSearchConfig(searchConfig, PUBLIC_API_URL);
      setMessage({ type: "success", text: result.message });

      // Clear master key from form for security and update hasMasterKey
      setSearchConfig((prev) => ({
        ...prev,
        masterKey: "",
        hasMasterKey: true,
      }));
    } catch (error) {
      setMessage({
        type: "error",
        text:
          error instanceof Error
            ? error.message
            : "Failed to save configuration",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleReindex = async () => {
    setIsReindexing(true);
    setMessage(null);
    setReindexResult(null);

    try {
      const result = await triggerReindex(PUBLIC_API_URL);
      setReindexResult(result);
      setMessage({ type: "success", text: result.message });
    } catch (error) {
      setMessage({
        type: "error",
        text:
          error instanceof Error ? error.message : "Failed to trigger reindex",
      });
    } finally {
      setIsReindexing(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="font-bold text-3xl tracking-tight">系統設定</h2>
      </div>

      <Tabs className="space-y-6" defaultValue="search">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger className="flex items-center gap-2" value="search">
            <Search className="h-4 w-4" />
            搜尋引擎
          </TabsTrigger>
          <TabsTrigger className="flex items-center gap-2" value="logistic">
            <Truck className="h-4 w-4" />
            物流設定
          </TabsTrigger>
          <TabsTrigger
            className="flex items-center gap-2"
            value="line-notification"
          >
            <MessageSquare className="h-4 w-4" />
            LINE 通知
          </TabsTrigger>
          <TabsTrigger
            className="flex items-center gap-2"
            disabled
            value="other"
          >
            <Settings className="h-4 w-4" />
            其他設定
          </TabsTrigger>
        </TabsList>

        {/* Search Configuration Tab */}
        <TabsContent className="space-y-6" value="search">
          <Card>
            <CardHeader>
              <CardTitle>搜尋設定</CardTitle>
              <CardDescription>配置 MeiliSearch 搜尋引擎設定</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {message && (
                <Alert
                  variant={message.type === "error" ? "destructive" : "default"}
                >
                  <AlertDescription>{message.text}</AlertDescription>
                </Alert>
              )}

              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="search-host">MeiliSearch Host URL</Label>
                  <Input
                    id="search-host"
                    onChange={(e) =>
                      setSearchConfig((prev) => ({
                        ...prev,
                        host: e.target.value,
                      }))
                    }
                    placeholder="https://meilisearch.anlstudio.cc"
                    type="url"
                    value={searchConfig.host}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="search-index">Index Name</Label>
                  <Input
                    id="search-index"
                    onChange={(e) =>
                      setSearchConfig((prev) => ({
                        ...prev,
                        indexName: e.target.value,
                      }))
                    }
                    placeholder="blackliving_content"
                    value={searchConfig.indexName}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="search-key">Master Key (主金鑰)</Label>
                <Input
                  id="search-key"
                  onChange={(e) =>
                    setSearchConfig((prev) => ({
                      ...prev,
                      masterKey: e.target.value,
                    }))
                  }
                  placeholder={
                    searchConfig.hasMasterKey
                      ? "已設定 (若需修改請輸入新的金鑰)"
                      : "請輸入 Master Key"
                  }
                  type="password"
                  value={searchConfig.masterKey}
                />
                <p className="text-gray-500 text-sm">
                  Master Key
                  用於配置和索引內容。為了安全起見，儲存後不會顯示完整金鑰。
                  {searchConfig.hasMasterKey && (
                    <span className="ml-2 text-green-600">
                      ✓ 目前已設定金鑰
                    </span>
                  )}
                </p>
              </div>

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
                  disabled={isReindexing}
                  onClick={handleReindex}
                  variant="outline"
                >
                  {isReindexing ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <RefreshCw className="h-4 w-4" />
                  )}
                  {isReindexing ? "重新索引中..." : "重新索引全部內容"}
                </Button>
              </div>

              {reindexResult && (
                <div className="rounded-lg border bg-blue-50 p-4">
                  <h4 className="font-semibold text-blue-900">重新索引結果</h4>
                  <p className="mt-1 text-blue-700 text-sm">
                    已索引 {reindexResult.indexed} 個文件
                    {reindexResult.errors.length > 0 && (
                      <span className="ml-2 text-red-600">
                        ({reindexResult.errors.length} 個錯誤)
                      </span>
                    )}
                  </p>
                  {reindexResult.errors.length > 0 && (
                    <details className="mt-2">
                      <summary className="cursor-pointer text-red-600 text-sm">
                        查看錯誤
                      </summary>
                      <ul className="mt-1 list-inside list-disc text-red-600 text-xs">
                        {reindexResult.errors.map((error, index) => (
                          <li key={index}>{error}</li>
                        ))}
                      </ul>
                    </details>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Logistics Settings Tab */}
        <TabsContent className="space-y-6" value="logistic">
          <LogisticSettings />
        </TabsContent>

        {/* Line Notification Settings Tab */}
        <TabsContent className="space-y-6" value="line-notification">
          <LineSettings />
        </TabsContent>

        {/* System Settings Tab */}
        <TabsContent className="space-y-6" value="system">
          <Card>
            <CardHeader>
              <CardTitle>系統設定</CardTitle>
              <CardDescription>管理系統基本配置與權限設定</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="rounded-lg border bg-gray-50 p-4">
                  <h3 className="font-semibold">使用者權限管理</h3>
                  <p className="mt-1 text-gray-600 text-sm">
                    管理員帳號權限設定與角色分配
                  </p>
                  <p className="mt-2 text-gray-500 text-xs">即將開發的功能</p>
                </div>
                <div className="rounded-lg border bg-gray-50 p-4">
                  <h3 className="font-semibold">網站基本設定</h3>
                  <p className="mt-1 text-gray-600 text-sm">
                    網站標題、聯絡資訊、營業時間設定
                  </p>
                  <p className="mt-2 text-gray-500 text-xs">即將開發的功能</p>
                </div>
                <div className="rounded-lg border bg-gray-50 p-4">
                  <h3 className="font-semibold">支付與物流設定</h3>
                  <p className="mt-1 text-gray-600 text-sm">
                    配置銀行帳戶資訊與配送選項
                  </p>
                  <p className="mt-2 text-gray-500 text-xs">即將開發的功能</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Analytics Tab */}
        <TabsContent className="space-y-6" value="analytics">
          <Card>
            <CardHeader>
              <CardTitle>搜尋分析</CardTitle>
              <CardDescription>查看搜尋使用統計與效能指標</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="rounded-lg border bg-blue-50 p-4">
                  <h3 className="font-semibold text-blue-900">搜尋統計</h3>
                  <p className="mt-1 text-blue-700 text-sm">
                    即將提供搜尋查詢數量、點擊率等統計資料
                  </p>
                </div>
                <div className="rounded-lg border bg-green-50 p-4">
                  <h3 className="font-semibold text-green-900">效能指標</h3>
                  <p className="mt-1 text-green-700 text-sm">
                    搜尋回應時間、索引大小等效能指標
                  </p>
                </div>
                <div className="rounded-lg border bg-purple-50 p-4">
                  <h3 className="font-semibold text-purple-900">熱門搜尋</h3>
                  <p className="mt-1 text-purple-700 text-sm">
                    最常搜尋的關鍵字與趨勢分析
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

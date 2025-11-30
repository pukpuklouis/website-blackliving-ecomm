import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@blackliving/ui';
import { Button } from '@blackliving/ui';
import { Input } from '@blackliving/ui';
import { Label } from '@blackliving/ui';
import { Alert, AlertDescription } from '@blackliving/ui';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@blackliving/ui';
import { Loader2, RefreshCw, Save, Search, Settings, BarChart3, Truck } from 'lucide-react';
import { saveSearchConfig, getSearchConfig, triggerReindex, type SearchConfig } from '../../services/searchService';
import LogisticSettings from '../../components/LogisticSettings';

export default function SettingsPage() {
  console.log('SettingsPage mounted');
  const [searchConfig, setSearchConfig] = useState({
    host: '',
    masterKey: '',
    indexName: 'blackliving_content',
    hasMasterKey: false,
  });
  const [isLoading, setIsLoading] = useState(false);
  const [isReindexing, setIsReindexing] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [reindexResult, setReindexResult] = useState<{ indexed: number; errors: string[] } | null>(null);

  // Load existing configuration on mount
  useEffect(() => {
    const loadConfig = async () => {
      try {
        const config = await getSearchConfig();
        if (config) {
          setSearchConfig({
            host: config.host,
            masterKey: '', // Don't show master key for security
            indexName: config.indexName,
            hasMasterKey: config.hasMasterKey || false,
          });
        }
      } catch (error) {
        console.error('Failed to load search config:', error);
      }
    };

    loadConfig();
  }, []);

  const handleSaveConfig = async () => {
    if (!searchConfig.host || (!searchConfig.masterKey && !searchConfig.hasMasterKey)) {
      setMessage({ type: 'error', text: 'Host URL and Master Key are required' });
      return;
    }

    setIsLoading(true);
    setMessage(null);

    try {
      const result = await saveSearchConfig(searchConfig);
      setMessage({ type: 'success', text: result.message });

      // Clear master key from form for security and update hasMasterKey
      setSearchConfig(prev => ({ ...prev, masterKey: '', hasMasterKey: true }));
    } catch (error) {
      setMessage({
        type: 'error',
        text: error instanceof Error ? error.message : 'Failed to save configuration'
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
      const result = await triggerReindex();
      setReindexResult(result);
      setMessage({ type: 'success', text: result.message });
    } catch (error) {
      setMessage({
        type: 'error',
        text: error instanceof Error ? error.message : 'Failed to trigger reindex'
      });
    } finally {
      setIsReindexing(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">系統設定</h1>
        <p className="text-gray-600 mt-2">管理系統配置與權限設定</p>
      </div>

      <Tabs defaultValue="search" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="search" className="flex items-center gap-2">
            <Search className="h-4 w-4" />
            搜尋設定
          </TabsTrigger>
          <TabsTrigger value="logistics" className="flex items-center gap-2">
            <Truck className="h-4 w-4" />
            物流設定
          </TabsTrigger>
          <TabsTrigger value="system" className="flex items-center gap-2">
            <Settings className="h-4 w-4" />
            系統設定
          </TabsTrigger>
          <TabsTrigger value="analytics" className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4" />
            分析
          </TabsTrigger>
        </TabsList>

        {/* Search Configuration Tab */}
        <TabsContent value="search" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>搜尋設定</CardTitle>
              <CardDescription>配置 MeiliSearch 搜尋引擎設定</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {message && (
                <Alert variant={message.type === 'error' ? 'destructive' : 'default'}>
                  <AlertDescription>{message.text}</AlertDescription>
                </Alert>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="search-host">MeiliSearch Host URL</Label>
                  <Input
                    id="search-host"
                    type="url"
                    placeholder="https://meilisearch.anlstudio.cc"
                    value={searchConfig.host}
                    onChange={(e) => setSearchConfig(prev => ({ ...prev, host: e.target.value }))}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="search-index">Index Name</Label>
                  <Input
                    id="search-index"
                    placeholder="blackliving_content"
                    value={searchConfig.indexName}
                    onChange={(e) => setSearchConfig(prev => ({ ...prev, indexName: e.target.value }))}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="search-key">Master Key (主金鑰)</Label>
                <Input
                  id="search-key"
                  type="password"
                  placeholder={searchConfig.hasMasterKey ? "已設定 (若需修改請輸入新的金鑰)" : "請輸入 Master Key"}
                  value={searchConfig.masterKey}
                  onChange={(e) => setSearchConfig(prev => ({ ...prev, masterKey: e.target.value }))}
                />
                <p className="text-sm text-gray-500">
                  Master Key 用於配置和索引內容。為了安全起見，儲存後不會顯示完整金鑰。
                  {searchConfig.hasMasterKey && (
                    <span className="text-green-600 ml-2">✓ 目前已設定金鑰</span>
                  )}
                </p>
              </div>

              <div className="flex gap-3">
                <Button
                  onClick={handleSaveConfig}
                  disabled={isLoading}
                  className="flex items-center gap-2"
                >
                  {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                  {isLoading ? '儲存中...' : '儲存設定'}
                </Button>

                <Button
                  variant="outline"
                  onClick={handleReindex}
                  disabled={isReindexing}
                  className="flex items-center gap-2"
                >
                  {isReindexing ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
                  {isReindexing ? '重新索引中...' : '重新索引全部內容'}
                </Button>
              </div>

              {
                reindexResult && (
                  <div className="p-4 border rounded-lg bg-blue-50">
                    <h4 className="font-semibold text-blue-900">重新索引結果</h4>
                    <p className="text-sm text-blue-700 mt-1">
                      已索引 {reindexResult.indexed} 個文件
                      {reindexResult.errors.length > 0 && (
                        <span className="text-red-600 ml-2">
                          ({reindexResult.errors.length} 個錯誤)
                        </span>
                      )}
                    </p>
                    {reindexResult.errors.length > 0 && (
                      <details className="mt-2">
                        <summary className="text-sm text-red-600 cursor-pointer">查看錯誤</summary>
                        <ul className="text-xs text-red-600 mt-1 list-disc list-inside">
                          {reindexResult.errors.map((error, index) => (
                            <li key={index}>{error}</li>
                          ))}
                        </ul>
                      </details>
                    )}
                  </div>
                )
              }
            </CardContent >
          </Card >
        </TabsContent>

        {/* Logistics Settings Tab */}
        <TabsContent value="logistics" className="space-y-6">
          <LogisticSettings />
        </TabsContent>

        {/* System Settings Tab */}
        < TabsContent value="system" className="space-y-6" >
          <Card>
            <CardHeader>
              <CardTitle>系統設定</CardTitle>
              <CardDescription>管理系統基本配置與權限設定</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="p-4 border rounded-lg bg-gray-50">
                  <h3 className="font-semibold">使用者權限管理</h3>
                  <p className="text-sm text-gray-600 mt-1">管理員帳號權限設定與角色分配</p>
                  <p className="text-xs text-gray-500 mt-2">即將開發的功能</p>
                </div>
                <div className="p-4 border rounded-lg bg-gray-50">
                  <h3 className="font-semibold">網站基本設定</h3>
                  <p className="text-sm text-gray-600 mt-1">網站標題、聯絡資訊、營業時間設定</p>
                  <p className="text-xs text-gray-500 mt-2">即將開發的功能</p>
                </div>
                <div className="p-4 border rounded-lg bg-gray-50">
                  <h3 className="font-semibold">支付與物流設定</h3>
                  <p className="text-sm text-gray-600 mt-1">配置銀行帳戶資訊與配送選項</p>
                  <p className="text-xs text-gray-500 mt-2">即將開發的功能</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent >

        {/* Analytics Tab */}
        < TabsContent value="analytics" className="space-y-6" >
          <Card>
            <CardHeader>
              <CardTitle>搜尋分析</CardTitle>
              <CardDescription>查看搜尋使用統計與效能指標</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="p-4 border rounded-lg bg-blue-50">
                  <h3 className="font-semibold text-blue-900">搜尋統計</h3>
                  <p className="text-sm text-blue-700 mt-1">即將提供搜尋查詢數量、點擊率等統計資料</p>
                </div>
                <div className="p-4 border rounded-lg bg-green-50">
                  <h3 className="font-semibold text-green-900">效能指標</h3>
                  <p className="text-sm text-green-700 mt-1">搜尋回應時間、索引大小等效能指標</p>
                </div>
                <div className="p-4 border rounded-lg bg-purple-50">
                  <h3 className="font-semibold text-purple-900">熱門搜尋</h3>
                  <p className="text-sm text-purple-700 mt-1">最常搜尋的關鍵字與趨勢分析</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent >
      </Tabs >
    </div >
  );
}

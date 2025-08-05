import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@blackliving/ui';

export default function SettingsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">系統設定</h1>
        <p className="text-gray-600 mt-2">管理系統配置與權限設定</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>系統設定功能</CardTitle>
          <CardDescription>即將開發的功能</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="p-4 border rounded-lg bg-gray-50">
              <h3 className="font-semibold">使用者權限管理</h3>
              <p className="text-sm text-gray-600 mt-1">管理員帳號權限設定與角色分配</p>
            </div>
            <div className="p-4 border rounded-lg bg-gray-50">
              <h3 className="font-semibold">網站基本設定</h3>
              <p className="text-sm text-gray-600 mt-1">網站標題、聯絡資訊、營業時間設定</p>
            </div>
            <div className="p-4 border rounded-lg bg-gray-50">
              <h3 className="font-semibold">支付與物流設定</h3>
              <p className="text-sm text-gray-600 mt-1">配置銀行帳戶資訊與配送選項</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

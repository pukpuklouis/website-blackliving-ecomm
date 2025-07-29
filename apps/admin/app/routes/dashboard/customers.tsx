import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@blackliving/ui';

export default function CustomersPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">客戶管理</h1>
        <p className="text-gray-600 mt-2">管理客戶資料與購買記錄</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>客戶管理功能</CardTitle>
          <CardDescription>即將開發的功能</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="p-4 border rounded-lg bg-gray-50">
              <h3 className="font-semibold">客戶資料庫</h3>
              <p className="text-sm text-gray-600 mt-1">完整的客戶資料管理，包含聯絡資訊與購買歷史</p>
            </div>
            <div className="p-4 border rounded-lg bg-gray-50">
              <h3 className="font-semibold">購買行為分析</h3>
              <p className="text-sm text-gray-600 mt-1">分析客戶偏好產品、購買頻率與客單價</p>
            </div>
            <div className="p-4 border rounded-lg bg-gray-50">
              <h3 className="font-semibold">客戶標籤系統</h3>
              <p className="text-sm text-gray-600 mt-1">VIP客戶、潛在客戶、回購客戶分類管理</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
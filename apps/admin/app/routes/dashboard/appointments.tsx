import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@blackliving/ui';

export default function AppointmentsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">預約管理</h1>
        <p className="text-gray-600 mt-2">管理試躺預約與門市參觀</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>預約管理功能</CardTitle>
          <CardDescription>即將開發的功能</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="p-4 border rounded-lg bg-gray-50">
              <h3 className="font-semibold">預約列表管理</h3>
              <p className="text-sm text-gray-600 mt-1">查看所有試躺預約，包含中和與中壢門市</p>
            </div>
            <div className="p-4 border rounded-lg bg-gray-50">
              <h3 className="font-semibold">預約狀態更新</h3>
              <p className="text-sm text-gray-600 mt-1">更新預約狀態：待確認、已確認、已完成、已取消</p>
            </div>
            <div className="p-4 border rounded-lg bg-gray-50">
              <h3 className="font-semibold">預約行事曆</h3>
              <p className="text-sm text-gray-600 mt-1">日曆檢視預約排程，避免時間衝突</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
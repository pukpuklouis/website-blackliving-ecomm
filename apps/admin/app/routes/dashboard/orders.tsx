import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@blackliving/ui';

export default function OrdersPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">訂單管理</h1>
        <p className="text-gray-600 mt-2">處理客戶訂單與出貨狀態</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>訂單管理功能</CardTitle>
          <CardDescription>即將開發的功能</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="p-4 border rounded-lg bg-gray-50">
              <h3 className="font-semibold">OrderManagement.tsx</h3>
              <p className="text-sm text-gray-600 mt-1">查看訂單詳情並更新出貨狀態</p>
            </div>
            <div className="p-4 border rounded-lg bg-gray-50">
              <h3 className="font-semibold">訂單狀態追蹤</h3>
              <p className="text-sm text-gray-600 mt-1">待付款、已付款、配送中、已完成</p>
            </div>
            <div className="p-4 border rounded-lg bg-gray-50">
              <h3 className="font-semibold">匯款確認</h3>
              <p className="text-sm text-gray-600 mt-1">公司帳戶匯款驗證流程</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
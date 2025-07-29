import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@blackliving/ui';

export default function ProductsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">產品管理</h1>
        <p className="text-gray-600 mt-2">管理席夢思床墊與相關產品</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>產品管理功能</CardTitle>
          <CardDescription>即將開發的功能</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="p-4 border rounded-lg bg-gray-50">
              <h3 className="font-semibold">ProductManagement.tsx</h3>
              <p className="text-sm text-gray-600 mt-1">完整的產品 CRUD 操作介面</p>
            </div>
            <div className="p-4 border rounded-lg bg-gray-50">
              <h3 className="font-semibold">產品列表與搜尋</h3>
              <p className="text-sm text-gray-600 mt-1">使用 TanStack Table 顯示產品數據</p>
            </div>
            <div className="p-4 border rounded-lg bg-gray-50">
              <h3 className="font-semibold">圖片上傳</h3>
              <p className="text-sm text-gray-600 mt-1">整合 Cloudflare R2 儲存產品圖片</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@blackliving/ui';

export default function PostsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">文章管理</h1>
        <p className="text-gray-600 mt-2">管理好文分享與部落格內容</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>內容管理功能</CardTitle>
          <CardDescription>即將開發的功能</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="p-4 border rounded-lg bg-gray-50">
              <h3 className="font-semibold">PostManagement.tsx</h3>
              <p className="text-sm text-gray-600 mt-1">用 table 管理發文, CRUD 操作介面</p>
            </div>
            <div className="p-4 border rounded-lg bg-gray-50">
              <h3 className="font-semibold">文章列表</h3>
              <p className="text-sm text-gray-600 mt-1">使用 TanStack Table 顯示文章數據</p>
            </div>
            <div className="p-4 border rounded-lg bg-gray-50">
              <h3 className="font-semibold">SEO 優化</h3>
              <p className="text-sm text-gray-600 mt-1">設定標題、描述、關鍵字</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
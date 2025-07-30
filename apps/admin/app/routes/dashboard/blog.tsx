import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@blackliving/ui';

export default function BlogPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">部落格編輯aaa</h1>
        <p className="text-gray-600 mt-2">使用 Novel.sh 編輯器快速編輯發文</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>部落格編輯功能</CardTitle>
          <CardDescription>即將開發的功能</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="p-4 border rounded-lg bg-gray-50">
              <h3 className="font-semibold">BlogComposer.tsx</h3>
              <p className="text-sm text-gray-600 mt-1">Novel.sh Markdown 編輯器，快速編輯發文</p>
            </div>
            <div className="p-4 border rounded-lg bg-gray-50">
              <h3 className="font-semiberal">Notion-like 編輯體驗</h3>
              <p className="text-sm text-gray-600 mt-1">豐富的編輯功能與格式設定</p>
            </div>
            <div className="p-4 border rounded-lg bg-gray-50">
              <h3 className="font-semibold">即時預覽</h3>
              <p className="text-sm text-gray-600 mt-1">邊寫邊看，所見即所得</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

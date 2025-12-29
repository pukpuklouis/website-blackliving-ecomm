import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@blackliving/ui";

export default function AnalyticsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-bold text-3xl text-gray-900">分析報表</h1>
        <p className="mt-2 text-gray-600">深入分析銷售數據與營運績效</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>分析報表功能</CardTitle>
          <CardDescription>即將開發的功能</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="rounded-lg border bg-gray-50 p-4">
              <h3 className="font-semibold">銷售趨勢分析</h3>
              <p className="mt-1 text-gray-600 text-sm">
                月度、季度、年度銷售表現與趨勢預測
              </p>
            </div>
            <div className="rounded-lg border bg-gray-50 p-4">
              <h3 className="font-semibold">產品銷售排行</h3>
              <p className="mt-1 text-gray-600 text-sm">
                熱銷產品分析，幫助庫存與採購決策
              </p>
            </div>
            <div className="rounded-lg border bg-gray-50 p-4">
              <h3 className="font-semibold">門市績效比較</h3>
              <p className="mt-1 text-gray-600 text-sm">
                中和與中壢門市營運數據對比分析
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@blackliving/ui';
import { Badge } from '@blackliving/ui';
import { SimpleChart } from '@blackliving/ui';
import { ArrowUpRight, BarChart3, Lock, PlusCircle } from 'lucide-react';

// Mock data for dashboard
const salesData = [
  { month: '1月', sales: 450000, orders: 42 },
  { month: '2月', sales: 380000, orders: 35 },
  { month: '3月', sales: 520000, orders: 48 },
  { month: '4月', sales: 680000, orders: 62 },
  { month: '5月', sales: 750000, orders: 71 },
  { month: '6月', sales: 890000, orders: 85 },
];

const recentOrders = [
  {
    id: 'ORD-001',
    customer: '王小明',
    product: 'Simmons S4 特大雙人床墊',
    amount: 125000,
    status: '已付款',
  },
  {
    id: 'ORD-002',
    customer: '李美麗',
    product: 'Simmons S3 雙人床墊',
    amount: 95000,
    status: '待付款',
  },
  {
    id: 'ORD-003',
    customer: '張大華',
    product: 'Simmons L-Class 加大雙人',
    amount: 168000,
    status: '配送中',
  },
  {
    id: 'ORD-004',
    customer: '陳淑芬',
    product: 'Simmons S2 單人床墊',
    amount: 68000,
    status: '已完成',
  },
];

const getStatusColor = (status: string) => {
  switch (status) {
    case '已付款':
      return 'bg-green-100 text-green-800';
    case '待付款':
      return 'bg-yellow-100 text-yellow-800';
    case '配送中':
      return 'bg-blue-100 text-blue-800';
    case '已完成':
      return 'bg-gray-100 text-gray-800';
    default:
      return 'bg-gray-100 text-gray-800';
  }
};

export default function Dashboard() {
  const totalSales = salesData.reduce((sum, month) => sum + month.sales, 0);
  const totalOrders = salesData.reduce((sum, month) => sum + month.orders, 0);
  const avgOrderValue = Math.round(totalSales / totalOrders);

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <h1 className="text-2xl font-semibold text-gray-900">總覽</h1>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">總銷售額</CardTitle>
            <PlusCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">NT$ {totalSales.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">比上月成長 +8.2%</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">總訂單數</CardTitle>
            <Lock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalOrders}</div>
            <p className="text-xs text-muted-foreground">比上月成長 +12.5%</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">平均客單價</CardTitle>
            <ArrowUpRight className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">NT$ {avgOrderValue.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">比上月下降 -2.1%</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">轉換率</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">3.2%</div>
            <p className="text-xs text-muted-foreground">比上月成長 +0.4%</p>
          </CardContent>
        </Card>
      </div>

      {/* Charts and Recent Orders */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Sales Chart */}
        <Card>
          <CardHeader>
            <CardTitle>月度銷售表現</CardTitle>
            <CardDescription>過去六個月的銷售表現</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-80">
              <SimpleChart data={salesData} />
            </div>
          </CardContent>
        </Card>

        {/* Recent Orders */}
        <Card>
          <CardHeader>
            <CardTitle>最近訂單</CardTitle>
            <CardDescription>最新的訂單狀態</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentOrders.map(order => (
                <div
                  key={order.id}
                  className="flex items-center justify-between p-4 border rounded-lg"
                >
                  <div className="space-y-1">
                    <p className="text-sm font-medium">
                      {order.id} - {order.customer}
                    </p>
                    <p className="text-sm text-muted-foreground">{order.product}</p>
                    <p className="text-sm font-semibold">NT$ {order.amount.toLocaleString()}</p>
                  </div>
                  <Badge className={getStatusColor(order.status)}>{order.status}</Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

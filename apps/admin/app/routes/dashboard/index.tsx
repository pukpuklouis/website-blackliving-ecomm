import {
  Badge,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  SimpleChart,
} from "@blackliving/ui";
// Tree-shakable Lucide imports
import ArrowUpRight from "@lucide/react/arrow-up-right";
import BarChart3 from "@lucide/react/bar-chart-3";
import Lock from "@lucide/react/lock";
import PlusCircle from "@lucide/react/plus-circle";

// Mock data for dashboard
const salesData = [
  { month: "1月", sales: 450_000, orders: 42 },
  { month: "2月", sales: 380_000, orders: 35 },
  { month: "3月", sales: 520_000, orders: 48 },
  { month: "4月", sales: 680_000, orders: 62 },
  { month: "5月", sales: 750_000, orders: 71 },
  { month: "6月", sales: 890_000, orders: 85 },
];

const recentOrders = [
  {
    id: "ORD-001",
    customer: "王小明",
    product: "Simmons S4 特大雙人床墊",
    amount: 125_000,
    status: "已付款",
  },
  {
    id: "ORD-002",
    customer: "李美麗",
    product: "Simmons S3 雙人床墊",
    amount: 95_000,
    status: "待付款",
  },
  {
    id: "ORD-003",
    customer: "張大華",
    product: "Simmons L-Class 加大雙人",
    amount: 168_000,
    status: "配送中",
  },
  {
    id: "ORD-004",
    customer: "陳淑芬",
    product: "Simmons S2 單人床墊",
    amount: 68_000,
    status: "已完成",
  },
];

const getStatusColor = (status: string) => {
  switch (status) {
    case "已付款":
      return "bg-green-100 text-green-800";
    case "待付款":
      return "bg-yellow-100 text-yellow-800";
    case "配送中":
      return "bg-blue-100 text-blue-800";
    case "已完成":
      return "bg-gray-100 text-gray-800";
    default:
      return "bg-gray-100 text-gray-800";
  }
};

export default function Dashboard() {
  const totalSales = salesData.reduce((sum, month) => sum + month.sales, 0);
  const totalOrders = salesData.reduce((sum, month) => sum + month.orders, 0);
  const avgOrderValue = Math.round(totalSales / totalOrders);

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <h1 className="font-semibold text-2xl text-gray-900">總覽</h1>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="font-medium text-sm">總銷售額</CardTitle>
            <PlusCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="font-bold text-2xl">
              NT$ {totalSales.toLocaleString()}
            </div>
            <p className="text-muted-foreground text-xs">比上月成長 +8.2%</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="font-medium text-sm">總訂單數</CardTitle>
            <Lock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="font-bold text-2xl">{totalOrders}</div>
            <p className="text-muted-foreground text-xs">比上月成長 +12.5%</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="font-medium text-sm">平均客單價</CardTitle>
            <ArrowUpRight className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="font-bold text-2xl">
              NT$ {avgOrderValue.toLocaleString()}
            </div>
            <p className="text-muted-foreground text-xs">比上月下降 -2.1%</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="font-medium text-sm">轉換率</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="font-bold text-2xl">3.2%</div>
            <p className="text-muted-foreground text-xs">比上月成長 +0.4%</p>
          </CardContent>
        </Card>
      </div>

      {/* Charts and Recent Orders */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
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
              {recentOrders.map((order) => (
                <div
                  className="flex items-center justify-between rounded-lg border p-4"
                  key={order.id}
                >
                  <div className="space-y-1">
                    <p className="font-medium text-sm">
                      {order.id} - {order.customer}
                    </p>
                    <p className="text-muted-foreground text-sm">
                      {order.product}
                    </p>
                    <p className="font-semibold text-sm">
                      NT$ {order.amount.toLocaleString()}
                    </p>
                  </div>
                  <Badge className={getStatusColor(order.status)}>
                    {order.status}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

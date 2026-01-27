import type { DashboardStats, SalesAnalytics } from "@blackliving/types";
import {
  Badge,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  SimpleChart,
  Skeleton,
} from "@blackliving/ui";
import ArrowDownRight from "@lucide/react/arrow-down-right";
import Banknote from "@lucide/react/banknote";
import ShoppingBag from "@lucide/react/shopping-bag";
import Tag from "@lucide/react/tag";
import TrendingUp from "@lucide/react/trending-up";
import { useCallback, useEffect, useState } from "react";
import { useApiUrl } from "../../contexts/EnvironmentContext";
import { statusColors, statusLabels } from "./order-types";

const getStatusColor = (status: string) =>
  statusColors[status as keyof typeof statusColors] || "bg-gray-100";

export default function Dashboard() {
  const apiUrl = useApiUrl();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [analytics, setAnalytics] = useState<SalesAnalytics | null>(null);
  const [loading, setLoading] = useState(true);

  const loadDashboardData = useCallback(async () => {
    try {
      setLoading(true);

      const [statsResponse, analyticsResponse] = await Promise.all([
        fetch(`${apiUrl}/api/admin/dashboard/stats`, {
          credentials: "include",
        }),
        fetch(`${apiUrl}/api/admin/dashboard/analytics`, {
          credentials: "include",
        }),
      ]);

      if (statsResponse.ok) {
        const statsResult = await statsResponse.json();
        if (statsResult.success) {
          setStats(statsResult.data);
        }
      }

      if (analyticsResponse.ok) {
        const analyticsResult = await analyticsResponse.json();
        if (analyticsResult.success) {
          setAnalytics(analyticsResult.data);
        }
      }
    } catch (error) {
      console.error("Failed to load dashboard data:", error);
    } finally {
      setLoading(false);
    }
  }, [apiUrl]);

  useEffect(() => {
    loadDashboardData();
  }, [loadDashboardData]);

  const formatGrowth = (growth: number | null | undefined) => {
    if (growth === null || growth === undefined) {
      return null;
    }
    const isPositive = growth >= 0;
    const Icon = isPositive ? TrendingUp : ArrowDownRight;
    const colorClass = isPositive
      ? "text-emerald-600 bg-emerald-50"
      : "text-rose-600 bg-rose-50";

    return (
      <Badge
        className={`flex items-center gap-1 border-none px-1.5 py-0 font-medium ${colorClass}`}
        variant="secondary"
      >
        <Icon className="h-3 w-3" />
        {isPositive ? "+" : ""}
        {growth}%
      </Badge>
    );
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <h1 className="font-semibold text-2xl text-gray-900">總覽</h1>
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <Card key={i}>
              <CardHeader className="pb-2">
                <Skeleton className="h-4 w-20" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-8 w-32" />
                <Skeleton className="mt-2 h-3 w-24" />
              </CardContent>
            </Card>
          ))}
        </div>
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <Skeleton className="h-6 w-32" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-80 w-full" />
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <Skeleton className="h-6 w-24" />
            </CardHeader>
            <CardContent className="space-y-4">
              {[1, 2, 3, 4].map((i) => (
                <Skeleton className="h-20 w-full" key={i} />
              ))}
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  const totalSales = analytics?.totalSales ?? 0;
  const totalOrders = analytics?.ordersCount ?? stats?.totalOrders ?? 0;
  const avgOrderValue = analytics?.averageOrderValue ?? 0;
  const salesByMonth = analytics?.salesByMonth ?? [];

  // Get current month's data (last item in salesByMonth)
  const currentMonthSales = salesByMonth.at(-1)?.sales ?? 0;

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <h1 className="font-semibold text-2xl text-gray-900">總覽</h1>

      {/* Stats Cards - 4 cards */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
        {/* This Month Sales - with MoM comparison */}

        <Card className="overflow-hidden border-none shadow-sm ring-1 ring-gray-100">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="font-medium text-gray-500 text-sm">
              總銷售額
            </CardTitle>
            <div className="rounded-full bg-blue-50 p-2">
              <Banknote className="h-4 w-4 text-blue-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="font-bold text-2xl text-gray-900 tracking-tight">
              NT$ {totalSales.toLocaleString()}
            </div>
            <div className="mt-1.5 font-normal text-gray-400 text-xs">
              累積統計
            </div>
          </CardContent>
        </Card>

        <Card className="overflow-hidden border-none shadow-sm ring-1 ring-gray-100">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="font-medium text-gray-500 text-sm">
              本月銷售
            </CardTitle>
            <div className="rounded-full bg-violet-50 p-2">
              <TrendingUp className="h-4 w-4 text-violet-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="font-bold text-2xl text-gray-900 tracking-tight">
              NT$ {currentMonthSales.toLocaleString()}
            </div>
            <div className="mt-1.5 flex items-center gap-2 font-medium text-muted-foreground text-xs">
              {analytics?.salesGrowth !== null &&
              analytics?.salesGrowth !== undefined ? (
                <>比上月 {formatGrowth(analytics.salesGrowth)}</>
              ) : (
                <span className="font-normal text-gray-400 italic">
                  尚無上月資料
                </span>
              )}
            </div>
          </CardContent>
        </Card>

        <Card className="overflow-hidden border-none shadow-sm ring-1 ring-gray-100">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="font-medium text-gray-500 text-sm">
              總訂單數
            </CardTitle>
            <div className="rounded-full bg-orange-50 p-2">
              <ShoppingBag className="h-4 w-4 text-orange-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="font-bold text-2xl text-gray-900 tracking-tight">
              {totalOrders}
            </div>
            <div className="mt-1.5 font-normal text-gray-400 text-xs">
              累積統計
            </div>
          </CardContent>
        </Card>

        <Card className="overflow-hidden border-none shadow-sm ring-1 ring-gray-100">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="font-medium text-gray-500 text-sm">
              平均客單價
            </CardTitle>
            <div className="rounded-full bg-emerald-50 p-2">
              <Tag className="h-4 w-4 text-emerald-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="font-bold text-2xl text-gray-900 tracking-tight">
              NT$ {avgOrderValue.toLocaleString()}
            </div>
            <div className="mt-1.5 font-normal text-gray-400 text-xs">
              依據已完成訂單計算
            </div>
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
              {salesByMonth.length > 0 ? (
                <SimpleChart data={salesByMonth} />
              ) : (
                <div className="flex h-full flex-col items-center justify-center space-y-2 rounded-xl border border-dashed bg-gray-50/50 text-muted-foreground">
                  <TrendingUp className="h-10 w-10 opacity-20" />
                  <p className="font-medium text-sm">尚無銷售趨勢資料</p>
                  <p className="text-xs">當有完成或處理中的訂單時將自動顯示</p>
                </div>
              )}
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
              {stats?.recentOrders && stats.recentOrders.length > 0 ? (
                stats.recentOrders.map((order) => (
                  <div
                    className="flex items-center justify-between rounded-lg border p-4"
                    key={order.id}
                  >
                    <div className="space-y-1">
                      <p className="font-medium text-sm">
                        {order.customerInfo?.name ?? "未知客戶"}
                      </p>
                      <p className="text-muted-foreground text-sm">
                        {order.customerInfo?.email ?? ""}
                      </p>
                      <p className="font-semibold text-sm">
                        NT$ {order.totalAmount.toLocaleString()}
                      </p>
                    </div>
                    <Badge
                      className={`text-white ${getStatusColor(order.status)}`}
                    >
                      {statusLabels[
                        order.status as keyof typeof statusLabels
                      ] ?? order.status}
                    </Badge>
                  </div>
                ))
              ) : (
                <div className="flex h-40 items-center justify-center text-gray-500">
                  尚無訂單資料
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

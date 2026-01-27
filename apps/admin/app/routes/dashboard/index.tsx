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
// Tree-shakable Lucide imports
import ArrowUpRight from "@lucide/react/arrow-up-right";
import BarChart3 from "@lucide/react/bar-chart-3";
import PlusCircle from "@lucide/react/plus-circle";
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
    const Icon = isPositive ? ArrowUpRight : ArrowDownRight;
    const colorClass = isPositive ? "text-green-600" : "text-red-600";
    return (
      <span className={`flex items-center gap-1 ${colorClass}`}>
        <Icon className="h-3 w-3" />
        {isPositive ? "+" : ""}
        {growth}%
      </span>
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

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <h1 className="font-semibold text-2xl text-gray-900">總覽</h1>

      {/* Stats Cards - 3 cards since conversion rate is hidden */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="font-medium text-sm">總銷售額</CardTitle>
            <PlusCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="font-bold text-2xl">
              NT$ {totalSales.toLocaleString()}
            </div>
            <p className="flex items-center gap-2 text-muted-foreground text-xs">
              {analytics?.salesGrowth !== null &&
              analytics?.salesGrowth !== undefined ? (
                <>比上月 {formatGrowth(analytics.salesGrowth)}</>
              ) : (
                "尚無上月資料比較"
              )}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="font-medium text-sm">總訂單數</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="font-bold text-2xl">{totalOrders}</div>
            <p className="flex items-center gap-2 text-muted-foreground text-xs">
              {analytics?.ordersGrowth !== null &&
              analytics?.ordersGrowth !== undefined ? (
                <>比上月 {formatGrowth(analytics.ordersGrowth)}</>
              ) : (
                "尚無上月資料比較"
              )}
            </p>
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
            <p className="text-muted-foreground text-xs">依據已完成訂單計算</p>
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
                <div className="flex h-full items-center justify-center text-gray-500">
                  尚無銷售資料
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

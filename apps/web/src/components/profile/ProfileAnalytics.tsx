/**
 * ProfileAnalytics Component
 * Displays user analytics and purchase history in a clean interface
 */

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@blackliving/ui';
import { Badge } from '@blackliving/ui';
import { Separator } from '@blackliving/ui';
import { 
  Loader2, 
  ShoppingBag, 
  CreditCard, 
  TrendingUp, 
  Calendar,
  Star,
  Trophy
} from 'lucide-react';
import { useProfile } from '../../hooks/use-profile';

interface ProfileAnalyticsProps {
  className?: string;
}

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('zh-TW', {
    style: 'currency',
    currency: 'TWD',
    minimumFractionDigits: 0
  }).format(amount);
}

function formatDate(date: Date): string {
  return new Intl.DateTimeFormat('zh-TW', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  }).format(date);
}

function getSegmentBadge(segment: string | null) {
  const segmentConfig = {
    new: { label: '新客戶', variant: 'secondary' as const, icon: Star },
    customer: { label: '一般客戶', variant: 'default' as const, icon: ShoppingBag },
    regular: { label: '常客', variant: 'default' as const, icon: TrendingUp },
    vip: { label: 'VIP客戶', variant: 'default' as const, icon: Trophy },
    inactive: { label: '休眠客戶', variant: 'outline' as const, icon: Calendar }
  };
  
  const config = segmentConfig[segment as keyof typeof segmentConfig] || segmentConfig.new;
  const Icon = config.icon;
  
  return (
    <Badge variant={config.variant} className="flex items-center gap-1">
      <Icon className="h-3 w-3" />
      {config.label}
    </Badge>
  );
}

function getChurnRiskColor(churnRisk: string | null) {
  switch (churnRisk) {
    case 'low': return 'text-green-600';
    case 'medium': return 'text-yellow-600';
    case 'high': return 'text-red-600';
    default: return 'text-gray-600';
  }
}

export function ProfileAnalytics({ className }: ProfileAnalyticsProps) {
  const { fullProfile, analytics, loading, error, loadFullProfile, loadAnalytics } = useProfile();

  // Load full profile and analytics on mount
  React.useEffect(() => {
    loadFullProfile();
    loadAnalytics();
  }, [loadFullProfile, loadAnalytics]);

  if (loading) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle>購買分析</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin" />
            <span className="ml-2">載入中...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle>購買分析</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <p className="text-red-600">{error}</p>
            <button 
              onClick={() => { loadFullProfile(); loadAnalytics(); }}
              className="mt-2 text-sm text-blue-600 hover:underline"
            >
              重新載入
            </button>
          </div>
        </CardContent>
      </Card>
    );
  }

  const customerProfile = fullProfile?.customerProfile;
  const hasData = customerProfile || analytics;

  if (!hasData) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle>購買分析</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <ShoppingBag className="h-12 w-12 mx-auto text-gray-400 mb-4" />
            <p className="text-gray-600">尚無購買記錄</p>
            <p className="text-sm text-gray-500 mt-1">完成首次購買後即可查看分析資料</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const totalSpent = customerProfile?.totalSpent || analytics?.totalSpent || 0;
  const orderCount = customerProfile?.orderCount || analytics?.orderCount || 0;
  const avgOrderValue = customerProfile?.avgOrderValue || analytics?.avgOrderValue || 0;
  const segment = customerProfile?.segment;
  const churnRisk = customerProfile?.churnRisk;
  const lifetimeValue = customerProfile?.lifetimeValue || 0;
  const lastPurchaseAt = customerProfile?.lastContactAt || analytics?.lastPurchaseAt;
  const firstPurchaseAt = analytics?.firstPurchaseAt;

  return (
    <Card className={className}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle>購買分析</CardTitle>
        {segment && getSegmentBadge(segment)}
      </CardHeader>
      
      <CardContent className="space-y-6">
        {/* Key Metrics */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center">
            <div className="flex items-center justify-center w-10 h-10 mx-auto mb-2 bg-blue-100 rounded-lg">
              <CreditCard className="h-5 w-5 text-blue-600" />
            </div>
            <p className="text-2xl font-bold text-blue-600">{formatCurrency(totalSpent)}</p>
            <p className="text-sm text-gray-600">累計消費</p>
          </div>
          
          <div className="text-center">
            <div className="flex items-center justify-center w-10 h-10 mx-auto mb-2 bg-green-100 rounded-lg">
              <ShoppingBag className="h-5 w-5 text-green-600" />
            </div>
            <p className="text-2xl font-bold text-green-600">{orderCount}</p>
            <p className="text-sm text-gray-600">訂單數量</p>
          </div>
          
          <div className="text-center">
            <div className="flex items-center justify-center w-10 h-10 mx-auto mb-2 bg-purple-100 rounded-lg">
              <TrendingUp className="h-5 w-5 text-purple-600" />
            </div>
            <p className="text-2xl font-bold text-purple-600">{formatCurrency(avgOrderValue)}</p>
            <p className="text-sm text-gray-600">平均客單價</p>
          </div>
          
          <div className="text-center">
            <div className="flex items-center justify-center w-10 h-10 mx-auto mb-2 bg-amber-100 rounded-lg">
              <Trophy className="h-5 w-5 text-amber-600" />
            </div>
            <p className="text-2xl font-bold text-amber-600">{formatCurrency(lifetimeValue)}</p>
            <p className="text-sm text-gray-600">終身價值</p>
          </div>
        </div>

        <Separator />

        {/* Customer Status */}
        <div className="space-y-3">
          <h4 className="font-medium">客戶狀態</h4>
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600">客戶分群</span>
            {getSegmentBadge(segment)}
          </div>
          
          {churnRisk && (
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">流失風險</span>
              <span className={`text-sm font-medium ${getChurnRiskColor(churnRisk)}`}>
                {churnRisk === 'low' ? '低風險' : 
                 churnRisk === 'medium' ? '中等風險' : '高風險'}
              </span>
            </div>
          )}
        </div>

        <Separator />

        {/* Purchase Timeline */}
        <div className="space-y-3">
          <h4 className="font-medium">購買時間軸</h4>
          
          {firstPurchaseAt && (
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">首次購買</span>
              <span className="text-sm font-medium">{formatDate(firstPurchaseAt)}</span>
            </div>
          )}
          
          {lastPurchaseAt && (
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">最後購買</span>
              <span className="text-sm font-medium">{formatDate(lastPurchaseAt)}</span>
            </div>
          )}
          
          {firstPurchaseAt && lastPurchaseAt && firstPurchaseAt !== lastPurchaseAt && (
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">購買期間</span>
              <span className="text-sm font-medium">
                {Math.ceil(
                  (lastPurchaseAt.getTime() - firstPurchaseAt.getTime()) / 
                  (1000 * 60 * 60 * 24)
                )} 天
              </span>
            </div>
          )}
        </div>

        {/* Additional Insights */}
        {orderCount > 0 && (
          <>
            <Separator />
            <div className="space-y-3">
              <h4 className="font-medium">購買洞察</h4>
              
              <div className="bg-gray-50 rounded-lg p-3 space-y-2">
                {orderCount === 1 && (
                  <p className="text-sm text-gray-700">
                    ✨ 感謝您的首次購買！期待為您提供更多優質產品。
                  </p>
                )}
                
                {orderCount >= 3 && orderCount < 5 && (
                  <p className="text-sm text-gray-700">
                    🌟 您已經是我們的忠實客戶了！感謝您的支持。
                  </p>
                )}
                
                {orderCount >= 5 && (
                  <p className="text-sm text-gray-700">
                    👑 感謝您長期以來的支持！您是我們最珍貴的客戶之一。
                  </p>
                )}
                
                {avgOrderValue > 50000 && (
                  <p className="text-sm text-gray-700">
                    💎 您偏好高品質產品，我們會為您推薦最適合的頂級商品。
                  </p>
                )}
              </div>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
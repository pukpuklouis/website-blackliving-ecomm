import {
  Avatar,
  AvatarFallback,
  Badge,
  Button,
  Card,
  CardContent,
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@blackliving/ui";
import Calendar from "@lucide/react/calendar";
import Edit from "@lucide/react/edit";
import ShoppingBag from "@lucide/react/shopping-bag";
import ShoppingCart from "@lucide/react/shopping-cart";
import Star from "@lucide/react/star";
import TrendingUp from "@lucide/react/trending-up";
import {
  type CustomerInteraction,
  type CustomerProfile,
  churnRiskLabels,
} from "./customer-types";

type CustomerProfileDialogProps = {
  customer: CustomerProfile | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  interactions: CustomerInteraction[];
  onEdit: (customer: CustomerProfile) => void;
};

const CHURN_RISK_STAR_COUNT: Record<"low" | "medium" | "high", number> = {
  low: 5,
  medium: 3,
  high: 1,
};

/** Render churn risk as star rating (5 stars = low risk, 3 = medium, 1 = high) */
function ChurnRiskStars({ risk }: { risk: "low" | "medium" | "high" }) {
  const starCount = CHURN_RISK_STAR_COUNT[risk];
  return (
    <div className="flex gap-0.5">
      {Array.from({ length: 5 }).map((_, i) => (
        <Star
          className={`h-5 w-5 ${i < starCount ? "fill-emerald-500 text-emerald-500" : "text-gray-300"}`}
          key={`star-${i.toString()}`}
        />
      ))}
    </div>
  );
}

/** Get initials from customer name */
function getInitials(name: string): string {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

/** Format relative time for interactions */
function formatRelativeTime(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - new Date(date).getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays === 0) {
    return "今天";
  }
  if (diffDays === 1) {
    return "昨天";
  }
  if (diffDays < 7) {
    return `${diffDays.toString()} 天前`;
  }
  if (diffDays < 30) {
    return `${Math.floor(diffDays / 7).toString()} 週前`;
  }
  return new Date(date).toLocaleDateString("zh-TW");
}

export function CustomerProfileDialog({
  customer,
  open,
  onOpenChange,
  interactions,
  onEdit,
}: CustomerProfileDialogProps) {
  if (!customer) {
    return null;
  }

  const latestInteraction = interactions[0];

  return (
    <Dialog onOpenChange={onOpenChange} open={open}>
      <DialogContent className="max-h-[90vh] w-full max-w-6xl overflow-y-auto sm:max-w-6xl">
        <DialogHeader>
          <DialogTitle>客戶資料</DialogTitle>
        </DialogHeader>

        <Tabs className="w-full" defaultValue="profile">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="profile">基本資料</TabsTrigger>
            <TabsTrigger value="purchases">購買記錄</TabsTrigger>
            <TabsTrigger value="interactions">互動歷史</TabsTrigger>
            <TabsTrigger value="analytics">行為分析</TabsTrigger>
          </TabsList>

          {/* Profile Tab - New Card Layout */}
          <TabsContent className="mt-4 space-y-4" value="profile">
            {/* Top Row: Hero + Identity + Metrics */}
            <div className="grid grid-cols-3 gap-4">
              {/* Hero Card - Left */}
              <Card className="border-0 bg-gray-50">
                <CardContent className="flex h-full flex-col p-6">
                  {/* Status Badge */}
                  <Badge className="mb-4 w-fit bg-emerald-100 text-emerald-700">
                    <span className="mr-1.5 inline-block h-2 w-2 rounded-full bg-emerald-500" />
                    活躍客戶
                  </Badge>

                  {/* Total Spend */}
                  <div className="mb-1 font-bold text-4xl tracking-tight">
                    NT${(customer.totalSpent || 0).toLocaleString()}
                  </div>
                  <div className="mb-6 text-gray-500 text-sm">總消費金額</div>

                  {/* Edit Button */}
                  <Button
                    className="mb-6 w-full"
                    onClick={() => onEdit(customer)}
                  >
                    <Edit className="mr-2 h-4 w-4" />
                    編輯資料
                  </Button>

                  {/* Bottom Metrics */}
                  <div className="mt-auto grid grid-cols-2 gap-4 border-gray-200 border-t pt-4">
                    <div className="flex items-center gap-2">
                      <ShoppingCart className="h-5 w-5 text-gray-400" />
                      <div>
                        <div className="text-gray-500 text-xs">訂單數量</div>
                        <div className="font-semibold text-lg">
                          {customer.orderCount}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <TrendingUp className="h-5 w-5 text-gray-400" />
                      <div>
                        <div className="text-gray-500 text-xs">平均客單價</div>
                        <div className="font-semibold text-lg">
                          NT${(customer.avgOrderValue || 0).toLocaleString()}
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Identity Card - Center */}
              <Card className="border-2">
                <CardContent className="flex h-full flex-col items-center justify-center p-6 text-center">
                  <Avatar className="mb-4 h-20 w-20">
                    <AvatarFallback className="bg-gray-200 font-semibold text-gray-600 text-xl">
                      {getInitials(customer.name)}
                    </AvatarFallback>
                  </Avatar>
                  <h2 className="mb-1 font-bold text-xl">{customer.name}</h2>
                  <p className="text-gray-500 text-sm">
                    客戶編號：#{customer.customerNumber}
                  </p>
                </CardContent>
              </Card>

              {/* Metric Grid - Right */}
              <div className="flex flex-col gap-4">
                {/* Churn Risk Card */}
                <Card className="border-2">
                  <CardContent className="p-4 text-center">
                    <div className="mb-2 text-gray-500 text-sm">流失風險</div>
                    <div className="mb-2 flex justify-center">
                      <ChurnRiskStars risk={customer.churnRisk} />
                    </div>
                    <div className="font-medium text-sm">
                      {churnRiskLabels[customer.churnRisk]}
                    </div>
                  </CardContent>
                </Card>

                {/* Recent Interaction Card */}
                <Card className="flex-1 border-2">
                  <CardContent className="p-4">
                    <div className="mb-2 text-gray-500 text-sm">最近互動</div>
                    {latestInteraction ? (
                      <>
                        <p className="text-sm">
                          {latestInteraction.title}
                          {latestInteraction.description
                            ? ` - ${latestInteraction.description}`
                            : ""}
                        </p>
                        <p className="mt-1 text-gray-400 text-xs">
                          {formatRelativeTime(latestInteraction.createdAt)}
                        </p>
                      </>
                    ) : (
                      <p className="text-gray-400 text-sm">暫無互動記錄</p>
                    )}
                  </CardContent>
                </Card>
              </div>
            </div>

            {/* Bottom Row: Customer Tags */}
            <Card className="border-2">
              <CardContent className="p-6">
                <div className="mb-1 text-gray-500 text-sm">客戶標籤</div>
                <h3 className="mb-4 font-bold text-2xl">客戶標籤</h3>
                <div className="flex flex-wrap gap-2">
                  {customer.tags.length > 0 ? (
                    customer.tags.map((tag) => (
                      <Badge
                        className="px-4 py-1.5 text-sm text-white"
                        key={tag.id}
                        style={{ backgroundColor: tag.color }}
                      >
                        {tag.name}
                      </Badge>
                    ))
                  ) : (
                    <span className="text-gray-400 text-sm">暫無標籤</span>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Purchases Tab */}
          <TabsContent className="space-y-4" value="purchases">
            <div className="py-8 text-center text-gray-500">
              <ShoppingBag className="mx-auto mb-4 h-12 w-12 opacity-50" />
              <p>購買記錄功能開發中</p>
              <p className="text-sm">將顯示完整的訂單歷史與產品偏好</p>
            </div>
          </TabsContent>

          {/* Interactions Tab */}
          <TabsContent className="space-y-4" value="interactions">
            <div className="space-y-4">
              {interactions.length > 0 ? (
                interactions.map((interaction) => (
                  <div className="rounded-lg border p-4" key={interaction.id}>
                    <div className="flex items-start justify-between">
                      <div>
                        <h5 className="font-medium">{interaction.title}</h5>
                        <p className="text-gray-600 text-sm capitalize">
                          {interaction.type}
                        </p>
                        {interaction.description ? (
                          <p className="mt-1 text-sm">
                            {interaction.description}
                          </p>
                        ) : null}
                      </div>
                      <div className="text-gray-500 text-sm">
                        {new Date(interaction.createdAt).toLocaleDateString(
                          "zh-TW"
                        )}
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="py-8 text-center text-gray-500">
                  <Calendar className="mx-auto mb-4 h-12 w-12 opacity-50" />
                  <p>暫無互動記錄</p>
                </div>
              )}
            </div>
          </TabsContent>

          {/* Analytics Tab */}
          <TabsContent className="space-y-4" value="analytics">
            <div className="py-8 text-center text-gray-500">
              <TrendingUp className="mx-auto mb-4 h-12 w-12 opacity-50" />
              <p>行為分析功能開發中</p>
              <p className="text-sm">將提供購買趨勢、產品偏好等深度分析</p>
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}

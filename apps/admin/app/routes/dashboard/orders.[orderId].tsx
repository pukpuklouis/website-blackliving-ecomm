import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  Badge,
  Button,
  Card,
  CardContent,
  Separator,
  Textarea,
} from "@blackliving/ui";
import ArrowLeft from "@lucide/react/arrow-left";
import Copy from "@lucide/react/copy";
import CreditCard from "@lucide/react/credit-card";
import ExternalLink from "@lucide/react/external-link";
import History from "@lucide/react/history";
import Link2 from "@lucide/react/link-2";
import Mail from "@lucide/react/mail";
import MapPin from "@lucide/react/map-pin";
import NotebookPen from "@lucide/react/notebook-pen";
import Package from "@lucide/react/package";
import Phone from "@lucide/react/phone";
import Printer from "@lucide/react/printer";
import Send from "@lucide/react/send";
import ShoppingBag from "@lucide/react/shopping-bag";
import Truck from "@lucide/react/truck";
import User from "@lucide/react/user";
import { useCallback, useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router";
import { toast } from "sonner";
import { useApiUrl } from "../../contexts/EnvironmentContext";
import {
  type Order,
  paymentMethodLabels,
  paymentStatusLabels,
  statusLabels,
} from "./order-details-dialog";

// Helper to copy text to clipboard
function copyToClipboard(text: string, successMessage = "已複製到剪貼簿") {
  navigator.clipboard.writeText(text).then(() => {
    toast.success(successMessage);
  });
}

// Status indicator component
function StatusIndicator({
  label,
  value,
  color,
  badge,
}: {
  label: string;
  value: string;
  color: "blue" | "red" | "green" | "muted" | "orange";
  badge?: string;
}) {
  const colorClasses = {
    blue: "text-blue-600",
    red: "text-red-600",
    green: "text-green-600",
    orange: "text-orange-600",
    muted: "text-stone-500",
  };

  const dotColors = {
    blue: "bg-blue-500",
    red: "bg-red-500",
    green: "bg-green-500",
    orange: "bg-orange-500",
    muted: "bg-stone-400",
  };

  return (
    <div className="flex flex-col whitespace-nowrap">
      <span className="mb-0.5 font-bold text-[11px] text-stone-500 uppercase tracking-wider">
        {label}
      </span>
      <div className="flex items-center gap-2">
        <span
          aria-hidden="true"
          className={`h-2.5 w-2.5 rounded-full ${dotColors[color]}`}
        />
        <span className={`font-bold text-base ${colorClasses[color]}`}>
          {value}
        </span>
        {badge ? (
          <span className="rounded-full border border-stone-200 bg-stone-100 px-2 py-0.5 text-stone-500 text-xs">
            {badge}
          </span>
        ) : null}
      </div>
    </div>
  );
}

// Get next step action based on order state
function getNextStepAction(order: Order): {
  label: string;
  description: string;
  action: string;
} | null {
  if (order.paymentStatus === "unpaid") {
    return {
      label: "發送付款提醒",
      description: "需完成付款",
      action: "payment_reminder",
    };
  }
  if (order.status === "paid") {
    return {
      label: "標記處理中",
      description: "開始處理訂單",
      action: "mark_processing",
    };
  }
  if (order.status === "processing") {
    return {
      label: "建立物流單",
      description: "準備出貨",
      action: "create_shipment",
    };
  }
  if (order.status === "shipped") {
    return {
      label: "標記已送達",
      description: "確認送達",
      action: "mark_delivered",
    };
  }
  return null;
}

// Header component
function OrderHeader({ order, onBack }: { order: Order; onBack: () => void }) {
  const fullAddress = order.shippingAddress
    ? `${order.shippingAddress.postalCode} ${order.shippingAddress.city}${order.shippingAddress.district} ${order.shippingAddress.address}`
    : "";

  return (
    <header className="sticky top-0 z-50 border-stone-200 border-b bg-white shadow-sm">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <div className="flex items-center gap-4">
          <Button
            className="rounded-full"
            onClick={onBack}
            size="icon"
            variant="ghost"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="flex items-center gap-2 font-bold text-primary text-xl">
              訂單詳情 - {order.orderNumber}
              <Badge className="font-medium" variant="outline">
                官方網站
              </Badge>
            </h1>
            <p className="mt-0.5 text-stone-500 text-xs">
              下單時間: {new Date(order.createdAt).toLocaleString("zh-TW")}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button
            onClick={() => copyToClipboard(fullAddress, "地址已複製")}
            size="sm"
            variant="secondary"
          >
            <Copy className="mr-1.5 h-4 w-4" />
            複製地址
          </Button>
          <Button onClick={() => window.print()} size="sm" variant="secondary">
            <Printer className="mr-1.5 h-4 w-4" />
            列印
          </Button>
          <Button
            onClick={() => {
              if (order.customerInfo.phone) {
                window.location.href = `tel:${order.customerInfo.phone}`;
              }
            }}
            size="sm"
          >
            <Phone className="mr-1.5 h-4 w-4" />
            聯絡顧客
          </Button>
        </div>
      </div>
    </header>
  );
}

// Status bar component
function StatusBar({
  order,
  onAction,
}: {
  order: Order;
  onAction: (action: string) => void;
}) {
  const nextStep = getNextStepAction(order);

  // Determine status colors
  const orderStatusColor = (() => {
    if (order.status === "delivered") {
      return "green";
    }
    if (order.status === "cancelled") {
      return "muted";
    }
    return "blue";
  })();
  const paymentColor = order.paymentStatus === "paid" ? "green" : "red";
  const shippingColor =
    order.status === "shipped" || order.status === "delivered"
      ? "green"
      : "muted";
  const shippingLabel = (() => {
    if (order.status === "shipped") {
      return "配送中";
    }
    if (order.status === "delivered") {
      return "已送達";
    }
    return "未出貨";
  })();

  return (
    <div className="sticky top-16 z-40 border-stone-200 border-b bg-white/95 shadow-sm backdrop-blur transition-all">
      <div className="mx-auto max-w-7xl px-4 py-3 sm:px-6 lg:px-8">
        <div className="flex flex-col items-center justify-between gap-4 xl:flex-row">
          {/* Status indicators */}
          <div className="no-scrollbar flex w-full items-center gap-8 overflow-x-auto xl:w-auto">
            <StatusIndicator
              color={orderStatusColor}
              label="訂單狀態"
              value={statusLabels[order.status]}
            />
            <Separator className="h-8" orientation="vertical" />
            <StatusIndicator
              badge={`${paymentMethodLabels[order.paymentMethod]} / ${order.paymentStatus === "paid" ? "已完成" : "尚未完成"}`}
              color={paymentColor}
              label="付款狀態"
              value={paymentStatusLabels[order.paymentStatus]}
            />
            <Separator className="h-8" orientation="vertical" />
            <StatusIndicator
              color={shippingColor}
              label="出貨狀態"
              value={shippingLabel}
            />
          </div>

          {/* Next step action */}
          <div className="flex w-full items-center justify-between gap-6 xl:w-auto xl:justify-end">
            {nextStep ? (
              <div className="flex items-center gap-3 rounded-lg border border-primary/20 bg-primary/5 p-2 pr-3">
                <div className="flex flex-col border-primary/20 border-r px-2">
                  <span className="font-bold text-[10px] text-primary uppercase tracking-wider">
                    下一步
                  </span>
                  <span className="font-medium text-stone-700 text-xs">
                    {nextStep.description}
                  </span>
                </div>
                <Button
                  className="whitespace-nowrap"
                  onClick={() => onAction(nextStep.action)}
                  size="sm"
                >
                  {nextStep.label}
                </Button>
                <Button
                  className="text-primary hover:bg-primary/10"
                  size="icon"
                  title="複製付款連結"
                  variant="ghost"
                >
                  <Link2 className="h-4 w-4" />
                </Button>
              </div>
            ) : null}

            <div className="hidden flex-col items-end sm:flex">
              <span className="text-stone-500 text-xs">
                共 {order.items.length} 件商品
              </span>
              <span className="font-bold text-stone-800 text-xl">
                NT${order.totalAmount.toLocaleString()}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Customer & Shipping Card
function CustomerShippingCard({ order }: { order: Order }) {
  const fullAddress = order.shippingAddress
    ? `${order.shippingAddress.postalCode} ${order.shippingAddress.city}${order.shippingAddress.district} ${order.shippingAddress.address}`
    : "";

  const openMap = () => {
    if (fullAddress) {
      window.open(
        `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(fullAddress)}`,
        "_blank",
        "noopener"
      );
    }
  };

  return (
    <Card>
      <CardContent className="p-5">
        <h2 className="mb-4 flex items-center gap-2 font-bold text-base text-primary">
          <User className="h-4 w-4" />
          客戶資訊與配送
        </h2>
        <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
          {/* Customer info */}
          <div className="space-y-4">
            <h3 className="border-stone-100 border-b pb-1 font-bold text-stone-500 text-xs uppercase tracking-wider">
              基本資料
            </h3>
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 font-bold text-lg text-primary">
                {order.customerInfo.name.charAt(0).toUpperCase()}
              </div>
              <div>
                <p className="font-bold text-stone-800">
                  {order.customerInfo.name}
                </p>
                <p className="text-stone-500 text-xs">會員等級: 一般會員</p>
              </div>
            </div>

            {/* Email row */}
            <div className="group -mx-2 flex items-center justify-between rounded px-2 py-1 transition-colors hover:bg-stone-50">
              <div className="flex items-center gap-2 overflow-hidden">
                <Mail className="h-4 w-4 text-stone-400" />
                <span className="truncate text-sm text-stone-600">
                  {order.customerInfo.email}
                </span>
              </div>
              <div className="flex items-center gap-1 opacity-100 transition-opacity sm:opacity-0 sm:group-hover:opacity-100">
                <Button
                  className="h-7 w-7"
                  onClick={() => {
                    window.location.href = `mailto:${order.customerInfo.email}`;
                  }}
                  size="icon"
                  title="寄信"
                  variant="ghost"
                >
                  <Send className="h-3.5 w-3.5" />
                </Button>
                <Button
                  className="h-7 w-7"
                  onClick={() =>
                    copyToClipboard(order.customerInfo.email, "Email 已複製")
                  }
                  size="icon"
                  title="複製 Email"
                  variant="ghost"
                >
                  <Copy className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>

            {/* Phone row */}
            <div className="group -mx-2 flex items-center justify-between rounded px-2 py-1 transition-colors hover:bg-stone-50">
              <div className="flex items-center gap-2">
                <Phone className="h-4 w-4 text-stone-400" />
                <span className="text-sm text-stone-600">
                  {order.customerInfo.phone}
                </span>
              </div>
              <div className="flex items-center gap-1 opacity-100 transition-opacity sm:opacity-0 sm:group-hover:opacity-100">
                <Button
                  className="h-7 w-7"
                  onClick={() => {
                    window.location.href = `tel:${order.customerInfo.phone}`;
                  }}
                  size="icon"
                  title="撥打"
                  variant="ghost"
                >
                  <ExternalLink className="h-3.5 w-3.5" />
                </Button>
                <Button
                  className="h-7 w-7"
                  onClick={() =>
                    copyToClipboard(order.customerInfo.phone, "電話已複製")
                  }
                  size="icon"
                  title="複製電話"
                  variant="ghost"
                >
                  <Copy className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>
          </div>

          {/* Shipping address */}
          <div className="space-y-4">
            <h3 className="border-stone-100 border-b pb-1 font-bold text-stone-500 text-xs uppercase tracking-wider">
              配送地址
            </h3>
            {order.shippingAddress ? (
              <div className="group relative rounded-lg border border-stone-200 bg-stone-50 p-3">
                <div className="flex items-start gap-2">
                  <MapPin className="mt-0.5 h-4 w-4 text-primary" />
                  <div className="flex-1">
                    <p className="font-medium text-sm text-stone-800 leading-relaxed">
                      {order.shippingAddress.city}
                      {order.shippingAddress.district}{" "}
                      {order.shippingAddress.address}
                    </p>
                    <p className="mt-1 text-stone-500 text-xs">
                      收件人: {order.shippingAddress.name} |{" "}
                      {order.shippingAddress.phone}
                    </p>
                  </div>
                </div>
                <div className="mt-3 flex justify-end gap-2">
                  <Button onClick={openMap} size="sm" variant="outline">
                    <MapPin className="mr-1 h-3 w-3" />
                    開地圖
                  </Button>
                  <Button
                    onClick={() => {
                      const text = `${order.shippingAddress?.name}\n${order.shippingAddress?.phone}\n${fullAddress}`;
                      copyToClipboard(text, "地址已複製");
                    }}
                    size="sm"
                    variant="outline"
                  >
                    <Copy className="mr-1 h-3 w-3" />
                    複製整段
                  </Button>
                </div>
              </div>
            ) : (
              <p className="text-sm text-stone-500">尚未設定配送地址</p>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// Order items card
function OrderItemsCard({ order }: { order: Order }) {
  return (
    <Card className="overflow-hidden">
      <div className="flex items-center justify-between border-stone-100 border-b bg-stone-50/50 p-4">
        <h2 className="flex items-center gap-2 font-bold text-base text-primary">
          <ShoppingBag className="h-4 w-4" />
          訂單商品
        </h2>
        <span className="rounded border border-stone-200 bg-white px-2 py-1 text-stone-500 text-xs">
          共 {order.items.length} 項商品
        </span>
      </div>
      <CardContent className="p-0">
        <div className="divide-y divide-stone-100">
          {order.items.map((item) => (
            <div
              className="flex items-center gap-4 p-4 transition-colors hover:bg-stone-50"
              key={`${item.productId}-${item.variantId ?? "default"}`}
            >
              <div className="flex h-16 w-16 flex-shrink-0 items-center justify-center rounded-md border border-stone-200 bg-stone-100 text-stone-300">
                <Package className="h-8 w-8" />
              </div>
              <div className="min-w-0 flex-1">
                <h4 className="truncate font-bold text-sm text-stone-800">
                  {item.name}
                </h4>
                {item.size ? (
                  <p className="mt-1 font-mono text-stone-500 text-xs">
                    規格: {item.size}
                  </p>
                ) : null}
              </div>
              <div className="text-right">
                <div className="font-bold text-sm text-stone-800">
                  NT${(item.price * item.quantity).toLocaleString()}
                </div>
                <div className="mt-0.5 text-stone-500 text-xs">
                  x {item.quantity}
                </div>
              </div>
            </div>
          ))}
        </div>
        <div className="border-stone-100 border-t bg-stone-50 p-4">
          <div className="ml-auto flex max-w-xs flex-col gap-2">
            <div className="flex justify-between text-sm text-stone-600">
              <span>小計</span>
              <span>NT${order.subtotalAmount.toLocaleString()}</span>
            </div>
            <div className="flex justify-between text-sm text-stone-600">
              <span>運費</span>
              <span>NT${order.shippingFee.toLocaleString()}</span>
            </div>
            <Separator className="my-1" />
            <div className="flex justify-between font-bold text-lg text-primary">
              <span>總計</span>
              <span>NT${order.totalAmount.toLocaleString()}</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// Order history timeline
function OrderHistoryCard({ order }: { order: Order }) {
  const events = [
    {
      title: "訂單建立",
      description: `顧客 ${order.customerInfo.name} 提交了訂單`,
      date: order.createdAt,
    },
  ];

  if (order.paymentVerifiedAt) {
    events.push({
      title: "付款確認",
      description: "訂單已確認付款",
      date: order.paymentVerifiedAt,
    });
  }

  if (order.shippedAt) {
    events.push({
      title: "已出貨",
      description: `物流編號: ${order.trackingNumber ?? "無"}`,
      date: order.shippedAt,
    });
  }

  if (order.deliveredAt) {
    events.push({
      title: "已送達",
      description: "訂單已完成配送",
      date: order.deliveredAt,
    });
  }

  return (
    <Card>
      <CardContent className="p-5">
        <h2 className="mb-4 flex items-center gap-2 font-bold text-base text-primary">
          <History className="h-4 w-4" />
          訂單歷程
        </h2>
        <div className="relative ml-2.5 space-y-6 border-stone-200 border-l-2 pl-5">
          {events.map((event, index) => (
            <div className="relative" key={event.title}>
              <span
                className={`-left-[27px] absolute top-1 h-3.5 w-3.5 rounded-full border-2 border-white shadow-sm ${
                  index === 0 ? "bg-primary" : "bg-stone-300"
                }`}
              />
              <div className="flex flex-col justify-between gap-1 sm:flex-row sm:items-start">
                <div>
                  <p className="font-bold text-sm text-stone-800">
                    {event.title}
                  </p>
                  <p className="mt-0.5 text-stone-500 text-xs">
                    {event.description}
                  </p>
                </div>
                <span className="font-mono text-stone-400 text-xs">
                  {new Date(event.date).toLocaleString("zh-TW", {
                    month: "2-digit",
                    day: "2-digit",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </span>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

// Payment info sidebar card
function PaymentInfoCard({
  order,
  onConfirmPayment,
  onSendReminder,
}: {
  order: Order;
  onConfirmPayment: () => void;
  onSendReminder: () => void;
}) {
  const [showConfirm, setShowConfirm] = useState(false);

  return (
    <>
      <Card>
        <CardContent className="p-5">
          <div className="mb-4 flex items-center justify-between border-stone-100 border-b pb-3">
            <h2 className="flex items-center gap-2 font-bold text-primary">
              <CreditCard className="h-4 w-4" />
              付款資訊
            </h2>
          </div>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-stone-500">付款方式</span>
              <div className="flex items-center gap-1">
                <CreditCard className="h-4 w-4 text-stone-400" />
                <span className="font-medium text-sm text-stone-800">
                  {paymentMethodLabels[order.paymentMethod]}
                </span>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-stone-500">付款狀態</span>
              <span
                className={`font-bold text-sm ${
                  order.paymentStatus === "paid"
                    ? "text-green-600"
                    : "text-red-600"
                }`}
              >
                {paymentStatusLabels[order.paymentStatus]}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-stone-500">交易金額</span>
              <span className="font-medium text-sm text-stone-800">
                NT${order.totalAmount.toLocaleString()}
              </span>
            </div>
          </div>
          <div className="mt-6 flex flex-col gap-2.5">
            {order.paymentStatus === "unpaid" ? (
              <>
                <Button className="w-full" onClick={onSendReminder}>
                  <Send className="mr-1.5 h-4 w-4" />
                  發送付款提醒
                </Button>
                <Button className="w-full" variant="outline">
                  檢視交易紀錄
                </Button>
                <Button
                  className="w-full text-red-600 hover:bg-red-50 hover:text-red-700"
                  onClick={() => setShowConfirm(true)}
                  variant="ghost"
                >
                  手動標記已付款 (需要確認)
                </Button>
              </>
            ) : (
              <Button className="w-full" variant="outline">
                檢視交易紀錄
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      <AlertDialog onOpenChange={setShowConfirm} open={showConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>確認付款</AlertDialogTitle>
            <AlertDialogDescription>
              確定已收到客戶的付款嗎？此操作會將訂單狀態更新為「已付款」。
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>取消</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                onConfirmPayment();
                setShowConfirm(false);
              }}
            >
              確認付款
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

// Shipping info sidebar card
function ShippingInfoCard({
  order,
  onCreateShipment,
}: {
  order: Order;
  onCreateShipment: () => void;
}) {
  const canCreateShipment = order.paymentStatus === "paid";

  return (
    <Card>
      <CardContent className="p-5">
        <div className="mb-4 flex items-center justify-between border-stone-100 border-b pb-3">
          <h2 className="flex items-center gap-2 font-bold text-primary">
            <Truck className="h-4 w-4" />
            物流資訊
          </h2>
        </div>

        {order.trackingNumber ? (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-stone-500">物流公司</span>
              <span className="font-medium text-sm text-stone-800">
                {order.shippingCompany ?? "-"}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-stone-500">追蹤編號</span>
              <span className="font-medium font-mono text-sm text-stone-800">
                {order.trackingNumber}
              </span>
            </div>
            {order.shippedAt ? (
              <div className="flex items-center justify-between">
                <span className="text-sm text-stone-500">出貨時間</span>
                <span className="font-medium text-sm text-stone-800">
                  {new Date(order.shippedAt).toLocaleString("zh-TW")}
                </span>
              </div>
            ) : null}
          </div>
        ) : (
          <div className="rounded-lg border-2 border-stone-200 border-dashed bg-stone-50 p-5 text-center">
            <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-stone-100">
              <Package className="h-6 w-6 text-stone-400" />
            </div>
            <p className="mb-1 font-bold text-sm text-stone-800">
              尚未建立物流單
            </p>
            {canCreateShipment ? null : (
              <p className="mb-4 flex items-center justify-center gap-1 text-red-500 text-xs">
                需先完成付款
              </p>
            )}
            <Button
              className="mb-3 w-full"
              disabled={!canCreateShipment}
              onClick={onCreateShipment}
              variant={canCreateShipment ? "default" : "secondary"}
            >
              建立物流單
            </Button>
            {canCreateShipment ? null : (
              <button
                className="flex w-full items-center justify-center gap-1 text-primary text-xs hover:underline"
                type="button"
              >
                <Send className="h-3 w-3" />
                立即發送付款提醒
              </button>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// Notes sidebar card
function NotesCard({
  order,
  onSaveNotes,
}: {
  order: Order;
  onSaveNotes: (notes: string) => void;
}) {
  const [notes, setNotes] = useState(order.adminNotes ?? "");
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    try {
      await onSaveNotes(notes);
      toast.success("備註已儲存");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Card>
      <CardContent className="p-5">
        <h2 className="mb-3 flex items-center gap-2 font-bold text-primary">
          <NotebookPen className="h-4 w-4" />
          備註
        </h2>
        <Textarea
          className="bg-stone-50"
          onChange={(e) => setNotes(e.target.value)}
          placeholder="新增內部備註..."
          rows={3}
          value={notes}
        />
        <div className="mt-2 flex justify-end">
          <Button disabled={saving} onClick={handleSave} size="sm">
            {saving ? "儲存中..." : "儲存"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

// Main page component
export default function OrderDetailPage() {
  const { orderId } = useParams();
  const navigate = useNavigate();
  const apiUrl = useApiUrl();
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);

  const loadOrder = useCallback(async () => {
    if (!orderId) {
      return;
    }

    try {
      setLoading(true);
      const response = await fetch(`${apiUrl}/api/orders/${orderId}`, {
        credentials: "include",
      });
      if (response.ok) {
        const result = await response.json();
        if (result.success) {
          setOrder(result.data);
        }
      }
    } catch (_error) {
      toast.error("載入訂單失敗");
    } finally {
      setLoading(false);
    }
  }, [orderId, apiUrl]);

  useEffect(() => {
    loadOrder();
  }, [loadOrder]);

  const handleBack = () => {
    navigate("/dashboard/orders");
  };

  const handleAction = async (action: string) => {
    if (!order) {
      return;
    }

    try {
      switch (action) {
        case "payment_reminder":
          toast.success("付款提醒已發送");
          break;
        case "mark_processing": {
          const response = await fetch(
            `${apiUrl}/api/orders/${order.id}/status`,
            {
              method: "PATCH",
              headers: { "Content-Type": "application/json" },
              credentials: "include",
              body: JSON.stringify({ status: "processing" }),
            }
          );
          if (response.ok) {
            await loadOrder();
            toast.success("訂單狀態已更新");
          }
          break;
        }
        case "create_shipment":
          // TODO: Open shipping dialog
          toast.info("建立物流單功能開發中");
          break;
        case "mark_delivered": {
          const response = await fetch(
            `${apiUrl}/api/orders/${order.id}/status`,
            {
              method: "PATCH",
              headers: { "Content-Type": "application/json" },
              credentials: "include",
              body: JSON.stringify({ status: "delivered" }),
            }
          );
          if (response.ok) {
            await loadOrder();
            toast.success("訂單已標記為送達");
          }
          break;
        }
        default:
          break;
      }
    } catch {
      toast.error("操作失敗");
    }
  };

  const handleConfirmPayment = async () => {
    if (!order) {
      return;
    }

    try {
      const response = await fetch(
        `${apiUrl}/api/orders/${order.id}/confirm-payment`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({
            paymentStatus: "paid",
            status: "paid",
            paymentVerifiedAt: new Date(),
            paymentVerifiedBy: "admin",
          }),
        }
      );

      if (response.ok) {
        await loadOrder();
        toast.success("付款確認成功");
      }
    } catch {
      toast.error("確認付款失敗");
    }
  };

  const handleSendReminder = () => {
    toast.success("付款提醒已發送");
  };

  const handleCreateShipment = () => {
    toast.info("建立物流單功能開發中");
  };

  const handleSaveNotes = async (notes: string) => {
    if (!order) {
      return;
    }

    try {
      const response = await fetch(`${apiUrl}/api/orders/${order.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ adminNotes: notes }),
      });

      if (!response.ok) {
        throw new Error("Failed to save notes");
      }
    } catch {
      throw new Error("Failed to save notes");
    }
  };

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="text-center">
          <div className="mx-auto h-8 w-8 animate-spin rounded-full border-stone-900 border-b-2" />
          <p className="mt-2 text-stone-600">載入中...</p>
        </div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="flex h-64 flex-col items-center justify-center">
        <p className="text-stone-600">找不到訂單</p>
        <Button className="mt-4" onClick={handleBack} variant="outline">
          返回訂單列表
        </Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-stone-50 pb-12">
      <OrderHeader onBack={handleBack} order={order} />
      <StatusBar onAction={handleAction} order={order} />

      <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          {/* Main content - 2 columns */}
          <div className="space-y-6 lg:col-span-2">
            <CustomerShippingCard order={order} />
            <OrderItemsCard order={order} />
            <OrderHistoryCard order={order} />
          </div>

          {/* Sidebar - 1 column */}
          <div className="space-y-6 lg:col-span-1">
            <PaymentInfoCard
              onConfirmPayment={handleConfirmPayment}
              onSendReminder={handleSendReminder}
              order={order}
            />
            <ShippingInfoCard
              onCreateShipment={handleCreateShipment}
              order={order}
            />
            <NotesCard onSaveNotes={handleSaveNotes} order={order} />
          </div>
        </div>
      </main>
    </div>
  );
}

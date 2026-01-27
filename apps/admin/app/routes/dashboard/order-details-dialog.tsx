import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
  Badge,
  Button,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@blackliving/ui";

type OrderItem = {
  productId: string;
  variantId?: string;
  quantity: number;
  price: number;
  name: string;
  size?: string;
};

type CustomerInfo = {
  name: string;
  email: string;
  phone: string;
};

type ShippingAddress = {
  name: string;
  phone: string;
  address: string;
  city: string;
  district: string;
  postalCode: string;
};

type Order = {
  id: string;
  orderNumber: string;
  userId?: string;
  customerInfo: CustomerInfo;
  items: OrderItem[];
  subtotalAmount: number;
  shippingFee: number;
  totalAmount: number;
  paymentMethod: "bank_transfer" | "credit_card" | "cash_on_delivery";
  status:
    | "pending_payment"
    | "paid"
    | "processing"
    | "shipped"
    | "delivered"
    | "cancelled";
  paymentStatus: "unpaid" | "paid" | "refunded";
  paymentProof?: string;
  paymentVerifiedAt?: Date;
  paymentVerifiedBy?: string;
  notes: string;
  adminNotes: string;
  shippingAddress?: ShippingAddress;
  trackingNumber?: string;
  shippingCompany?: string;
  shippedAt?: Date;
  deliveredAt?: Date;
  createdAt: Date;
  updatedAt: Date;
  lastReminderSentAt?: Date;
};

export const statusLabels = {
  pending_payment: "待付款",
  paid: "已付款",
  processing: "處理中",
  shipped: "配送中",
  delivered: "已完成",
  cancelled: "已取消",
};

export const statusColors = {
  pending_payment: "bg-yellow-500",
  paid: "bg-blue-500",
  processing: "bg-purple-500",
  shipped: "bg-orange-500",
  delivered: "bg-green-500",
  cancelled: "bg-gray-500",
};

export const paymentStatusLabels = {
  unpaid: "未付款",
  paid: "已付款",
  refunded: "已退款",
};

export const paymentMethodLabels = {
  bank_transfer: "銀行轉帳",
  credit_card: "信用卡",
  cash_on_delivery: "貨到付款",
};

type OrderDetailsDialogProps = {
  selectedOrder: Order | null;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirmPayment: (orderId: string) => void;
};

function OrderDetailsTab({ order }: { order: Order }) {
  return (
    <TabsContent className="space-y-4" value="details">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <h4 className="mb-2 font-medium">客戶資訊</h4>
          <div className="space-y-1 text-sm">
            <p>
              <span className="text-gray-600">姓名：</span>
              {order.customerInfo.name}
            </p>
            <p>
              <span className="text-gray-600">電話：</span>
              {order.customerInfo.phone}
            </p>
            <p>
              <span className="text-gray-600">Email：</span>
              {order.customerInfo.email}
            </p>
          </div>
        </div>
        <div>
          <h4 className="mb-2 font-medium">訂單狀態</h4>
          <div className="space-y-2">
            <Badge className={`text-white ${statusColors[order.status]}`}>
              {statusLabels[order.status]}
            </Badge>
            <Badge
              className={
                order.paymentStatus === "paid" ? "bg-green-500 text-white" : ""
              }
              variant={order.paymentStatus === "paid" ? "default" : "secondary"}
            >
              {paymentStatusLabels[order.paymentStatus]}
            </Badge>
          </div>
        </div>
      </div>

      <div>
        <h4 className="mb-2 font-medium">訂單商品</h4>
        <div className="rounded-lg border">
          {order.items.map((item) => (
            <div
              className="flex items-center justify-between border-b p-3 last:border-b-0"
              key={`${item.productId}-${item.variantId ?? "default"}`}
            >
              <div>
                <p className="font-medium">{item.name}</p>
                {item.size ? (
                  <p className="text-gray-600 text-sm">規格：{item.size}</p>
                ) : null}
                <p className="text-gray-600 text-sm">數量：{item.quantity}</p>
              </div>
              <p className="font-medium">
                NT${(item.price * item.quantity).toLocaleString()}
              </p>
            </div>
          ))}
          <div className="bg-gray-50 p-3">
            <div className="flex justify-between text-sm">
              <span>小計</span>
              <span>NT${order.subtotalAmount.toLocaleString()}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span>運費</span>
              <span>NT${order.shippingFee.toLocaleString()}</span>
            </div>
            <div className="mt-2 flex justify-between border-t pt-2 font-medium text-lg">
              <span>總計</span>
              <span>NT${order.totalAmount.toLocaleString()}</span>
            </div>
          </div>
        </div>
      </div>

      {order.notes ? (
        <div>
          <h4 className="mb-2 font-medium">客戶備註</h4>
          <p className="rounded-lg bg-gray-50 p-3 text-gray-600 text-sm">
            {order.notes}
          </p>
        </div>
      ) : null}

      {order.adminNotes ? (
        <div>
          <h4 className="mb-2 font-medium">管理員備註</h4>
          <p className="rounded-lg bg-blue-50 p-3 text-gray-600 text-sm">
            {order.adminNotes}
          </p>
        </div>
      ) : null}
    </TabsContent>
  );
}

function PaymentTab({
  order,
  onConfirmPayment,
}: {
  order: Order;
  onConfirmPayment: (orderId: string) => void;
}) {
  return (
    <TabsContent className="space-y-4" value="payment">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <h4 className="mb-2 font-medium">付款方式</h4>
          <Badge variant="outline">
            {paymentMethodLabels[order.paymentMethod]}
          </Badge>
        </div>
        <div>
          <h4 className="mb-2 font-medium">付款狀態</h4>
          <Badge
            className={
              order.paymentStatus === "paid" ? "bg-green-500 text-white" : ""
            }
            variant={order.paymentStatus === "paid" ? "default" : "secondary"}
          >
            {paymentStatusLabels[order.paymentStatus]}
          </Badge>
        </div>
      </div>

      {order.paymentProof ? (
        <div>
          <h4 className="mb-2 font-medium">付款證明</h4>
          <div className="rounded-lg border p-4">
            <img
              alt="付款證明"
              className="h-auto max-h-64 max-w-full rounded"
              height={256}
              src={order.paymentProof}
              width={256}
            />
          </div>
        </div>
      ) : null}

      {order.paymentStatus === "unpaid" &&
        order.paymentMethod === "bank_transfer" && (
          <div className="flex justify-end">
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button>確認收到付款</Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>確認付款</AlertDialogTitle>
                  <AlertDialogDescription>
                    確定已收到客戶的銀行轉帳付款嗎？此操作會將訂單狀態更新為「已付款」。
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>取消</AlertDialogCancel>
                  <AlertDialogAction onClick={() => onConfirmPayment(order.id)}>
                    確認付款
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        )}
    </TabsContent>
  );
}

function ShippingTab({ order }: { order: Order }) {
  return (
    <TabsContent className="space-y-4" value="shipping">
      {order.shippingAddress ? (
        <div>
          <h4 className="mb-2 font-medium">配送地址</h4>
          <div className="rounded-lg bg-gray-50 p-3 text-sm">
            <p>
              <span className="text-gray-600">收件人：</span>
              {order.shippingAddress.name}
            </p>
            <p>
              <span className="text-gray-600">電話：</span>
              {order.shippingAddress.phone}
            </p>
            <p>
              <span className="text-gray-600">地址：</span>
              {order.shippingAddress.postalCode} {order.shippingAddress.city}
              {order.shippingAddress.district} {order.shippingAddress.address}
            </p>
          </div>
        </div>
      ) : null}

      <div className="grid grid-cols-2 gap-4">
        <div>
          <h4 className="mb-2 font-medium">物流公司</h4>
          <p className="text-sm">{order.shippingCompany || "尚未設定"}</p>
        </div>
        <div>
          <h4 className="mb-2 font-medium">追蹤號碼</h4>
          <p className="font-mono text-sm">
            {order.trackingNumber || "尚未設定"}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <h4 className="mb-2 font-medium">出貨時間</h4>
          <p className="text-sm">
            {order.shippedAt
              ? new Date(order.shippedAt).toLocaleString("zh-TW")
              : "尚未出貨"}
          </p>
        </div>
        <div>
          <h4 className="mb-2 font-medium">送達時間</h4>
          <p className="text-sm">
            {order.deliveredAt
              ? new Date(order.deliveredAt).toLocaleString("zh-TW")
              : "尚未送達"}
          </p>
        </div>
      </div>
    </TabsContent>
  );
}

export function OrderDetailsDialog({
  selectedOrder,
  isOpen,
  onOpenChange,
  onConfirmPayment,
}: OrderDetailsDialogProps) {
  return (
    <Dialog onOpenChange={onOpenChange} open={isOpen}>
      <DialogContent className="max-h-[90vh] max-w-4xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>訂單詳情 - {selectedOrder?.orderNumber}</DialogTitle>
          <DialogDescription>查看完整的訂單資訊與處理狀態</DialogDescription>
        </DialogHeader>

        {selectedOrder ? (
          <Tabs className="w-full" defaultValue="details">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="details">訂單資訊</TabsTrigger>
              <TabsTrigger value="payment">付款資訊</TabsTrigger>
              <TabsTrigger value="shipping">物流資訊</TabsTrigger>
            </TabsList>

            <OrderDetailsTab order={selectedOrder} />
            <PaymentTab
              onConfirmPayment={onConfirmPayment}
              order={selectedOrder}
            />
            <ShippingTab order={selectedOrder} />
          </Tabs>
        ) : null}
      </DialogContent>
    </Dialog>
  );
}

export type { Order };

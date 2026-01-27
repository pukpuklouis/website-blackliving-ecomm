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

export type { CustomerInfo, Order, OrderItem, ShippingAddress };

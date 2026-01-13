import { Section, Text } from "@react-email/components";
import { brandColors } from "../../components/BrandHeader";
import { EmailLayout } from "../../components/EmailLayout";

type OrderItem = {
  name: string;
  quantity: number;
  price: number;
  size?: string;
};

type AdminNewOrderProps = {
  orderId: string;
  orderNumber: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  orderItems: OrderItem[];
  subtotal: number;
  shipping: number;
  total: number;
  paymentMethod: string;
  shippingAddress: {
    name: string;
    phone: string;
    address: string;
    city: string;
    district: string;
  };
  notes?: string;
  orderDate: string;
  logoUrl?: string;
};

const styles = {
  header: {
    color: "#1a1a1a",
    fontSize: "20px",
    fontFamily: "'Noto Sans TC', 'Microsoft JhengHei', sans-serif",
    fontWeight: 700,
    margin: "0 0 16px 0",
  },
  alertBox: {
    backgroundColor: "#fef3c7",
    border: "1px solid #f59e0b",
    borderRadius: "8px",
    padding: "16px",
    margin: "16px 0",
  },
  alertText: {
    color: "#92400e",
    fontSize: "14px",
    fontFamily: "'Noto Sans TC', 'Microsoft JhengHei', sans-serif",
    fontWeight: 600,
    margin: 0,
  },
  sectionTitle: {
    color: "#1a1a1a",
    fontSize: "16px",
    fontFamily: "'Crimson Text', Georgia, serif",
    fontWeight: 600,
    margin: "24px 0 12px 0",
    borderBottom: `2px solid ${brandColors.gold}`,
    paddingBottom: "8px",
  },
  infoBox: {
    backgroundColor: "#f9fafb",
    borderRadius: "8px",
    padding: "16px",
    margin: "12px 0",
  },
  infoRow: {
    color: "#333333",
    fontSize: "14px",
    fontFamily: "'Noto Sans TC', 'Microsoft JhengHei', sans-serif",
    margin: "6px 0",
  },
  itemsTable: {
    width: "100%",
    borderCollapse: "collapse" as const,
    margin: "12px 0",
  },
  itemRow: {
    borderBottom: "1px solid #e5e7eb",
    padding: "8px 0",
  },
  itemName: {
    color: "#1a1a1a",
    fontSize: "14px",
    fontFamily: "'Noto Sans TC', 'Microsoft JhengHei', sans-serif",
    fontWeight: 500,
    margin: "4px 0",
  },
  itemDetails: {
    color: "#666666",
    fontSize: "13px",
    fontFamily: "'Noto Sans TC', 'Microsoft JhengHei', sans-serif",
    margin: "2px 0",
  },
  totalBox: {
    backgroundColor: "#faf8f5",
    border: `1px solid ${brandColors.gold}`,
    borderRadius: "8px",
    padding: "16px",
    margin: "16px 0",
  },
  totalRow: {
    color: "#333333",
    fontSize: "14px",
    fontFamily: "'Noto Sans TC', 'Microsoft JhengHei', sans-serif",
    margin: "6px 0",
  },
  totalAmount: {
    color: "#1a1a1a",
    fontSize: "18px",
    fontFamily: "'Noto Sans TC', 'Microsoft JhengHei', sans-serif",
    fontWeight: 700,
    margin: "12px 0 0 0",
  },
  notesBox: {
    backgroundColor: "#f3f4f6",
    borderRadius: "8px",
    padding: "12px",
    margin: "12px 0",
  },
  notesText: {
    color: "#4b5563",
    fontSize: "13px",
    fontFamily: "'Noto Sans TC', 'Microsoft JhengHei', sans-serif",
    fontStyle: "italic" as const,
    margin: 0,
  },
};

export function AdminNewOrder({
  orderId,
  orderNumber,
  customerName,
  customerEmail,
  customerPhone,
  orderItems,
  subtotal,
  shipping,
  total,
  paymentMethod,
  shippingAddress,
  notes,
  orderDate,
  logoUrl,
}: AdminNewOrderProps) {
  return (
    <EmailLayout
      logoUrl={logoUrl}
      preview={`新訂單 #${orderNumber} - ${customerName} - $${total.toLocaleString()}`}
      title="新訂單通知 - Black Living 黑哥居家"
    >
      <Text style={styles.header}>🛒 新訂單通知</Text>

      <Section style={styles.alertBox}>
        <Text style={styles.alertText}>
          收到新訂單 #{orderNumber}，請盡快處理！
        </Text>
      </Section>

      <Text style={styles.sectionTitle}>訂單資訊</Text>
      <Section style={styles.infoBox}>
        <Text style={styles.infoRow}>
          <strong>訂單編號：</strong>#{orderNumber}
        </Text>
        <Text style={styles.infoRow}>
          <strong>訂單日期：</strong>
          {orderDate}
        </Text>
        <Text style={styles.infoRow}>
          <strong>付款方式：</strong>
          {paymentMethod}
        </Text>
      </Section>

      <Text style={styles.sectionTitle}>客戶資訊</Text>
      <Section style={styles.infoBox}>
        <Text style={styles.infoRow}>
          <strong>姓名：</strong>
          {customerName}
        </Text>
        <Text style={styles.infoRow}>
          <strong>Email：</strong>
          {customerEmail}
        </Text>
        <Text style={styles.infoRow}>
          <strong>電話：</strong>
          {customerPhone}
        </Text>
      </Section>

      <Text style={styles.sectionTitle}>訂購商品</Text>
      <Section>
        {orderItems.map((item, index) => (
          <Section key={`item-${index}`} style={styles.itemRow}>
            <Text style={styles.itemName}>{item.name}</Text>
            <Text style={styles.itemDetails}>
              數量: {item.quantity} × ${item.price.toLocaleString()}
              {Boolean(item.size) && ` | 尺寸: ${item.size}`}
            </Text>
          </Section>
        ))}
      </Section>

      <Section style={styles.totalBox}>
        <Text style={styles.totalRow}>小計：${subtotal.toLocaleString()}</Text>
        <Text style={styles.totalRow}>運費：${shipping.toLocaleString()}</Text>
        <Text style={styles.totalAmount}>總計：${total.toLocaleString()}</Text>
      </Section>

      <Text style={styles.sectionTitle}>收件資訊</Text>
      <Section style={styles.infoBox}>
        <Text style={styles.infoRow}>
          <strong>收件人：</strong>
          {shippingAddress.name}
        </Text>
        <Text style={styles.infoRow}>
          <strong>電話：</strong>
          {shippingAddress.phone}
        </Text>
        <Text style={styles.infoRow}>
          <strong>地址：</strong>
          {shippingAddress.city}
          {shippingAddress.district}
          {shippingAddress.address}
        </Text>
      </Section>

      {Boolean(notes) && (
        <>
          <Text style={styles.sectionTitle}>客戶備註</Text>
          <Section style={styles.notesBox}>
            <Text style={styles.notesText}>{notes}</Text>
          </Section>
        </>
      )}
    </EmailLayout>
  );
}

AdminNewOrder.PreviewProps = {
  orderId: "order_123",
  orderNumber: "BL202601120001",
  customerName: "王小明",
  customerEmail: "test@example.com",
  customerPhone: "0912-345-678",
  orderItems: [
    { name: "經典雙人床墊 - 標準款", quantity: 1, price: 28000, size: "雙人" },
    { name: "記憶枕頭", quantity: 2, price: 1500 },
  ],
  subtotal: 31000,
  shipping: 0,
  total: 31000,
  paymentMethod: "銀行轉帳",
  shippingAddress: {
    name: "王小明",
    phone: "0912-345-678",
    address: "信義路五段7號",
    city: "台北市",
    district: "信義區",
  },
  notes: "請在下午送貨",
  orderDate: "2026/01/12 14:30",
  logoUrl: "https://www.blackliving.tw/blackliving-logo-zh.svg",
} as AdminNewOrderProps;

export default AdminNewOrder;

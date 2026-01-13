import { Section, Text } from "@react-email/components";
import { brandColors } from "../../components/BrandHeader";
import { EmailLayout } from "../../components/EmailLayout";
import { type OrderItem, OrderSummary } from "../../components/OrderSummary";

type PaymentCompleteProps = {
  orderId: string;
  customerName: string;
  orderItems: OrderItem[];
  subtotal: number;
  shipping: number;
  total: number;
  paymentMethod?: string;
  paymentDate?: string;
  logoUrl?: string;
};

const styles = {
  greeting: {
    color: "#1a1a1a",
    fontSize: "18px",
    fontFamily: "'Noto Sans TC', 'Microsoft JhengHei', sans-serif",
    fontWeight: 600,
    margin: "0 0 16px 0",
  },
  message: {
    color: "#333333",
    fontSize: "14px",
    fontFamily: "'Noto Sans TC', 'Microsoft JhengHei', sans-serif",
    lineHeight: "1.8",
    margin: "0 0 24px 0",
  },
  sectionTitle: {
    color: "#1a1a1a",
    fontSize: "16px",
    fontFamily: "'Crimson Text', Georgia, serif",
    fontWeight: 600,
    margin: "24px 0 16px 0",
    borderBottom: `2px solid ${brandColors.gold}`,
    paddingBottom: "8px",
  },
  statusBox: {
    backgroundColor: "#ecfdf5",
    border: "1px solid #10b981",
    borderRadius: "8px",
    padding: "20px",
    margin: "16px 0",
    textAlign: "center" as const,
  },
  statusIcon: {
    fontSize: "32px",
    margin: "0 0 8px 0",
  },
  statusText: {
    color: "#065f46",
    fontSize: "18px",
    fontFamily: "'Noto Sans TC', 'Microsoft JhengHei', sans-serif",
    fontWeight: 600,
    margin: 0,
  },
  infoRow: {
    color: "#333333",
    fontSize: "14px",
    fontFamily: "'Noto Sans TC', 'Microsoft JhengHei', sans-serif",
    margin: "8px 0",
  },
  nextSteps: {
    backgroundColor: "#faf8f5",
    border: `1px solid ${brandColors.gold}`,
    borderRadius: "8px",
    padding: "16px",
    margin: "24px 0",
  },
  nextStepsText: {
    color: "#333333",
    fontSize: "13px",
    fontFamily: "'Noto Sans TC', 'Microsoft JhengHei', sans-serif",
    lineHeight: "1.6",
    margin: 0,
  },
};

export function PaymentComplete({
  orderId,
  customerName,
  orderItems,
  subtotal,
  shipping,
  total,
  paymentMethod = "銀行轉帳",
  paymentDate,
  logoUrl,
}: PaymentCompleteProps) {
  const formattedDate =
    paymentDate ||
    new Date().toLocaleDateString("zh-TW", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });

  return (
    <EmailLayout
      logoUrl={logoUrl}
      preview={`付款確認完成！訂單編號 #${orderId} - 我們將盡快安排出貨`}
      title="付款確認 - Black Living 黑哥居家"
    >
      <Text style={styles.greeting}>{customerName} 您好，</Text>

      <Section style={styles.statusBox}>
        <Text style={styles.statusIcon}>✅</Text>
        <Text style={styles.statusText}>付款已確認</Text>
      </Section>

      <Text style={styles.message}>
        感謝您的付款！我們已收到您的款項，正在為您準備訂單。
      </Text>

      <Text style={styles.infoRow}>
        <strong>訂單編號：</strong>#{orderId}
      </Text>
      <Text style={styles.infoRow}>
        <strong>付款方式：</strong>
        {paymentMethod}
      </Text>
      <Text style={styles.infoRow}>
        <strong>確認日期：</strong>
        {formattedDate}
      </Text>

      <Text style={styles.sectionTitle}>訂單明細</Text>
      <OrderSummary
        orderItems={orderItems}
        shipping={shipping}
        subtotal={subtotal}
        total={total}
      />

      <Section style={styles.nextSteps}>
        <Text style={styles.nextStepsText}>
          📦 <strong>接下來...</strong>
          <br />
          我們將盡快處理您的訂單並安排出貨。出貨後您將收到另一封通知信，內含物流追蹤資訊。
          <br />
          <br />
          如有任何問題，歡迎聯繫我們的客服團隊。
        </Text>
      </Section>
    </EmailLayout>
  );
}

export default PaymentComplete;

import { Button, Section, Text } from "@react-email/components";
import { brandColors } from "../../components/BrandHeader";
import { EmailLayout } from "../../components/EmailLayout";
import { type OrderItem, OrderSummary } from "../../components/OrderSummary";

type PaymentReminderProps = {
  orderId: string;
  customerName: string;
  orderItems: OrderItem[];
  subtotal: number;
  shipping: number;
  total: number;
  paymentMethod: string;
  paymentLink?: string;
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
  orderIdText: {
    color: "#333333",
    fontSize: "14px",
    fontFamily: "'Noto Sans TC', 'Microsoft JhengHei', sans-serif",
    margin: "0 0 8px 0",
  },
  buttonContainer: {
    textAlign: "center" as const,
    margin: "32px 0",
  },
  button: {
    backgroundColor: brandColors.gold,
    borderRadius: "4px",
    color: "#ffffff",
    fontSize: "16px",
    fontFamily: "'Noto Sans TC', 'Microsoft JhengHei', sans-serif",
    fontWeight: 600,
    textDecoration: "none",
    textAlign: "center" as const,
    display: "inline-block",
    padding: "12px 32px",
    boxShadow: "0 2px 4px rgba(0, 0, 0, 0.1)",
  },
  notice: {
    backgroundColor: "#fffbeb",
    border: "1px solid #f59e0b",
    borderRadius: "8px",
    padding: "16px",
    margin: "24px 0",
  },
  noticeText: {
    color: "#92400e",
    fontSize: "13px",
    fontFamily: "'Noto Sans TC', 'Microsoft JhengHei', sans-serif",
    lineHeight: "1.6",
    margin: 0,
  },
};

export function PaymentReminder({
  orderId,
  customerName,
  orderItems,
  subtotal,
  shipping,
  total,
  paymentMethod,
  paymentLink,
  logoUrl,
}: PaymentReminderProps) {
  return (
    <EmailLayout
      logoUrl={logoUrl}
      preview={`訂單 #${orderId} - 付款提醒通知`}
      title="付款提醒 - Black Living 黑哥居家"
    >
      <Text style={styles.greeting}>{customerName} 您好，</Text>
      <Text style={styles.message}>
        感謝您在 Black Living 黑哥居家的訂購。
        <br />
        我們注意到您的訂單尚未完成付款。為確保您的商品能盡快安排出貨，請您儘速完成付款程序。
      </Text>

      <Text style={styles.sectionTitle}>訂單資訊</Text>
      <Text style={styles.orderIdText}>
        訂單編號: <strong>#{orderId}</strong>
      </Text>

      <OrderSummary
        orderItems={orderItems}
        shipping={shipping}
        subtotal={subtotal}
        total={total}
      />

      {paymentLink ? (
        <Section style={styles.buttonContainer}>
          <Button href={paymentLink} style={styles.button}>
            前往付款
          </Button>
        </Section>
      ) : null}

      <Section style={styles.notice}>
        <Text style={styles.noticeText}>
          若您已經完成付款，請忽略此信。
          <br />
          付款方式：{paymentMethod}
          <br />
          如有任何問題或需要協助，請隨時聯繫我們的客服團隊。
        </Text>
      </Section>
    </EmailLayout>
  );
}

export default PaymentReminder;

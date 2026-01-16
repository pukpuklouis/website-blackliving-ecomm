import { Section, Text } from "@react-email/components";
import { brandColors } from "../../components/BrandHeader";
import { EmailLayout } from "../../components/EmailLayout";
import { type OrderItem, OrderSummary } from "../../components/OrderSummary";

type BankTransferConfirmationProps = {
  orderId: string;
  customerName: string;
  orderItems: OrderItem[];
  subtotal: number;
  shipping: number;
  total: number;
  bankName: string;
  bankBranch: string;
  accountNumber: string;
  accountHolder: string;
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
  bankInfo: {
    backgroundColor: "#faf8f5",
    border: `1px solid ${brandColors.gold}`,
    borderRadius: "8px",
    padding: "20px",
    margin: "16px 0",
  },
  bankRow: {
    padding: "8px 0",
  },
  bankLabel: {
    color: "#666666",
    fontSize: "12px",
    fontFamily: "'Noto Sans TC', 'Microsoft JhengHei', sans-serif",
    margin: "0 0 4px 0",
    textTransform: "uppercase" as const,
    letterSpacing: "0.5px",
  },
  bankValue: {
    color: "#1a1a1a",
    fontSize: "16px",
    fontFamily: "'Noto Sans TC', 'Microsoft JhengHei', sans-serif",
    fontWeight: 600,
    margin: 0,
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
  orderIdText: {
    color: "#333333",
    fontSize: "14px",
    fontFamily: "'Noto Sans TC', 'Microsoft JhengHei', sans-serif",
    margin: "0 0 8px 0",
  },
};

export function BankTransferConfirmation({
  orderId,
  customerName,
  orderItems,
  subtotal,
  shipping,
  total,
  bankName,
  bankBranch,
  accountNumber,
  accountHolder,
  logoUrl,
}: BankTransferConfirmationProps) {
  return (
    <EmailLayout
      logoUrl={logoUrl}
      preview={`感謝您的訂購！訂單編號 #${orderId} - 請完成銀行轉帳付款`}
      title="訂單確認 - Black Living 黑哥居家"
    >
      <Text style={styles.greeting}>{customerName} 您好，</Text>
      <Text style={styles.message}>
        感謝您選擇 Black Living 黑哥居家！
        <br />
        您的訂單已成功建立，請於 3
        個工作日內完成轉帳付款。收到款項後，我們將立即為您安排出貨。
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

      <Text style={styles.sectionTitle}>匯款帳戶資訊</Text>
      <Section style={styles.bankInfo}>
        <Section style={styles.bankRow}>
          <Text style={styles.bankLabel}>銀行名稱</Text>
          <Text style={styles.bankValue}>{bankName}</Text>
        </Section>
        <Section style={styles.bankRow}>
          <Text style={styles.bankLabel}>分行</Text>
          <Text style={styles.bankValue}>{bankBranch}</Text>
        </Section>
        <Section style={styles.bankRow}>
          <Text style={styles.bankLabel}>帳號</Text>
          <Text style={styles.bankValue}>{accountNumber}</Text>
        </Section>
        <Section style={styles.bankRow}>
          <Text style={styles.bankLabel}>戶名</Text>
          <Text style={styles.bankValue}>{accountHolder}</Text>
        </Section>
      </Section>

      <Section style={styles.notice}>
        <Text style={styles.noticeText}>
          匯款完成後，麻煩請至官方LINE告知帳號後五碼及訂單編號{" "}
          <strong>#{orderId}</strong>，以便我們快速核對款項。
          如有任何問題，請聯繫客服。
        </Text>
      </Section>
    </EmailLayout>
  );
}

export default BankTransferConfirmation;

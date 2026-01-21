import { Section, Text } from "@react-email/components";
import { brandColors } from "../../components/BrandHeader";
import { EmailLayout } from "../../components/EmailLayout";

type AdminPaymentConfirmationProps = {
  orderId: string;
  orderNumber: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  paymentMethod: string;
  paymentAmount: number;
  paymentDate: string;
  notes?: string;
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
  successBox: {
    backgroundColor: "#d1fae5",
    border: "1px solid #10b981",
    borderRadius: "8px",
    padding: "16px",
    margin: "16px 0",
  },
  successText: {
    color: "#065f46",
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
  amountBox: {
    backgroundColor: brandColors.gold,
    borderRadius: "8px",
    padding: "20px",
    margin: "16px 0",
    textAlign: "center" as const,
  },
  amountLabel: {
    color: "#ffffff",
    fontSize: "14px",
    fontFamily: "'Noto Sans TC', 'Microsoft JhengHei', sans-serif",
    margin: "0 0 8px 0",
  },
  amountValue: {
    color: "#ffffff",
    fontSize: "28px",
    fontFamily: "'Crimson Text', Georgia, serif",
    fontWeight: 700,
    margin: 0,
  },
  notesBox: {
    backgroundColor: "#fffbeb",
    border: "1px solid #fbbf24",
    borderRadius: "8px",
    padding: "12px",
    margin: "16px 0",
  },
  notesText: {
    color: "#92400e",
    fontSize: "13px",
    fontFamily: "'Noto Sans TC', 'Microsoft JhengHei', sans-serif",
    margin: 0,
  },
};

export function AdminPaymentConfirmation({
  orderId,
  orderNumber,
  customerName,
  customerEmail,
  customerPhone,
  paymentMethod,
  paymentAmount,
  paymentDate,
  notes,
  logoUrl,
}: AdminPaymentConfirmationProps) {
  return (
    <EmailLayout
      logoUrl={logoUrl}
      preview={`付款確認 #${orderNumber} - ${customerName} - $${paymentAmount.toLocaleString()}`}
      title="付款確認通知 - Black Living 黑哥居家"
    >
      <Text style={styles.header}>💰 付款確認通知</Text>

      <Section style={styles.successBox}>
        <Text style={styles.successText}>
          ✅ 訂單 #{orderNumber} 已收到付款，請盡快安排出貨
        </Text>
      </Section>

      <Section style={styles.amountBox}>
        <Text style={styles.amountLabel}>付款金額</Text>
        <Text style={styles.amountValue}>
          NT$ {paymentAmount.toLocaleString()}
        </Text>
      </Section>

      <Text style={styles.sectionTitle}>📋 訂單資訊</Text>
      <Section style={styles.infoBox}>
        <Text style={styles.infoRow}>
          <strong>訂單編號：</strong>
          {orderNumber}
        </Text>
        <Text style={styles.infoRow}>
          <strong>訂單 ID：</strong>
          {orderId}
        </Text>
        <Text style={styles.infoRow}>
          <strong>付款方式：</strong>
          {paymentMethod}
        </Text>
        <Text style={styles.infoRow}>
          <strong>付款時間：</strong>
          {paymentDate}
        </Text>
      </Section>

      <Text style={styles.sectionTitle}>👤 客戶資訊</Text>
      <Section style={styles.infoBox}>
        <Text style={styles.infoRow}>
          <strong>客戶姓名：</strong>
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

      {Boolean(notes) && (
        <Section style={styles.notesBox}>
          <Text style={styles.notesText}>
            📝 <strong>備註：</strong>
            {notes}
          </Text>
        </Section>
      )}
    </EmailLayout>
  );
}

AdminPaymentConfirmation.PreviewProps = {
  orderId: "order_456",
  orderNumber: "BL202601120002",
  customerName: "林小美",
  customerEmail: "mei@example.com",
  customerPhone: "0923-456-789",
  paymentMethod: "銀行轉帳",
  paymentAmount: 45_000,
  paymentDate: "2026/01/12 15:30",
  notes: "客戶已確認收件地址",
  logoUrl: "https://www.blackliving.tw/blackliving-logo-zh.svg",
} as AdminPaymentConfirmationProps;

export default AdminPaymentConfirmation;

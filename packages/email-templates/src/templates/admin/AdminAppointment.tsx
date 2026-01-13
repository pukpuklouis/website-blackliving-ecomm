import { Link, Section, Text } from "@react-email/components";
import { brandColors } from "../../components/BrandHeader";
import { EmailLayout } from "../../components/EmailLayout";

type AdminAppointmentProps = {
  appointmentId: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  appointmentDate: string;
  appointmentTime: string;
  storeName: string;
  storeAddress: string;
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
  alertBox: {
    backgroundColor: "#dbeafe",
    border: "1px solid #3b82f6",
    borderRadius: "8px",
    padding: "16px",
    margin: "16px 0",
  },
  alertText: {
    color: "#1e40af",
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
  dateTimeBox: {
    backgroundColor: brandColors.gold,
    borderRadius: "8px",
    padding: "20px",
    margin: "16px 0",
    textAlign: "center" as const,
  },
  dateLabel: {
    color: "#ffffff",
    fontSize: "14px",
    fontFamily: "'Noto Sans TC', 'Microsoft JhengHei', sans-serif",
    margin: "0 0 8px 0",
  },
  dateValue: {
    color: "#ffffff",
    fontSize: "24px",
    fontFamily: "'Crimson Text', Georgia, serif",
    fontWeight: 700,
    margin: "0 0 4px 0",
  },
  timeValue: {
    color: "#ffffff",
    fontSize: "18px",
    fontFamily: "'Noto Sans TC', 'Microsoft JhengHei', sans-serif",
    fontWeight: 500,
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
  link: {
    color: brandColors.gold,
    textDecoration: "underline",
  },
};

export function AdminAppointment({
  appointmentId,
  customerName,
  customerEmail,
  customerPhone,
  appointmentDate,
  appointmentTime,
  storeName,
  storeAddress,
  notes,
  logoUrl,
}: AdminAppointmentProps) {
  return (
    <EmailLayout
      logoUrl={logoUrl}
      preview={`新預約 - ${customerName} - ${appointmentDate} ${appointmentTime}`}
      title="新預約通知 - Black Living 黑哥居家"
    >
      <Text style={styles.header}>📅 新預約通知</Text>

      <Section style={styles.alertBox}>
        <Text style={styles.alertText}>
          📌 客戶 {customerName} 已預約試躺體驗，請準備接待
        </Text>
      </Section>

      <Section style={styles.dateTimeBox}>
        <Text style={styles.dateLabel}>預約時間</Text>
        <Text style={styles.dateValue}>{appointmentDate}</Text>
        <Text style={styles.timeValue}>{appointmentTime}</Text>
      </Section>

      <Text style={styles.sectionTitle}>📋 預約資訊</Text>
      <Section style={styles.infoBox}>
        <Text style={styles.infoRow}>
          <strong>預約編號：</strong>
          {appointmentId}
        </Text>
        <Text style={styles.infoRow}>
          <strong>門市：</strong>
          {storeName}
        </Text>
        <Text style={styles.infoRow}>
          <strong>地址：</strong>
          {storeAddress}
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
          <Link href={`mailto:${customerEmail}`} style={styles.link}>
            {customerEmail}
          </Link>
        </Text>
        <Text style={styles.infoRow}>
          <strong>電話：</strong>
          <Link href={`tel:${customerPhone}`} style={styles.link}>
            {customerPhone}
          </Link>
        </Text>
      </Section>

      {Boolean(notes) && (
        <Section style={styles.notesBox}>
          <Text style={styles.notesText}>
            📝 <strong>客戶備註：</strong>
            {notes}
          </Text>
        </Section>
      )}
    </EmailLayout>
  );
}

AdminAppointment.PreviewProps = {
  appointmentId: "APT202601120003",
  customerName: "陳大明",
  customerEmail: "ming@example.com",
  customerPhone: "0934-567-890",
  appointmentDate: "2026年1月18日 (星期六)",
  appointmentTime: "10:00 - 11:00",
  storeName: "Black Living 黑哥居家 - 新北中和店",
  storeAddress: "新北市中和區景平路398號2樓",
  notes: "想了解席夢思黑標系列",
  logoUrl: "https://www.blackliving.tw/blackliving-logo-zh.svg",
} as AdminAppointmentProps;

export default AdminAppointment;

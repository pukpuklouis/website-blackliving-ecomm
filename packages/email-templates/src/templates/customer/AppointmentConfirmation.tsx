import { Link, Section, Text } from "@react-email/components";
import { brandColors } from "../../components/BrandHeader";
import { EmailLayout } from "../../components/EmailLayout";

type AppointmentConfirmationProps = {
  appointmentId: string;
  customerName: string;
  appointmentDate: string;
  appointmentTime: string;
  storeName: string;
  storeAddress: string;
  storePhone?: string;
  googleMapsUrl?: string;
  notes?: string;
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
  appointmentBox: {
    backgroundColor: "#faf8f5",
    border: `1px solid ${brandColors.gold}`,
    borderRadius: "8px",
    padding: "20px",
    margin: "16px 0",
  },
  appointmentRow: {
    padding: "8px 0",
  },
  appointmentLabel: {
    color: "#666666",
    fontSize: "12px",
    fontFamily: "'Noto Sans TC', 'Microsoft JhengHei', sans-serif",
    margin: "0 0 4px 0",
    textTransform: "uppercase" as const,
    letterSpacing: "0.5px",
  },
  appointmentValue: {
    color: "#1a1a1a",
    fontSize: "16px",
    fontFamily: "'Noto Sans TC', 'Microsoft JhengHei', sans-serif",
    fontWeight: 600,
    margin: 0,
  },
  storeBox: {
    backgroundColor: "#f9fafb",
    borderRadius: "8px",
    padding: "16px",
    margin: "16px 0",
  },
  storeText: {
    color: "#333333",
    fontSize: "14px",
    fontFamily: "'Noto Sans TC', 'Microsoft JhengHei', sans-serif",
    lineHeight: "1.6",
    margin: 0,
  },
  mapButton: {
    display: "inline-block",
    backgroundColor: brandColors.gold,
    color: "#ffffff",
    padding: "12px 24px",
    borderRadius: "6px",
    textDecoration: "none",
    fontSize: "14px",
    fontFamily: "'Noto Sans TC', 'Microsoft JhengHei', sans-serif",
    fontWeight: 600,
    marginTop: "12px",
  },
  notesBox: {
    backgroundColor: "#fffbeb",
    border: "1px solid #f59e0b",
    borderRadius: "8px",
    padding: "16px",
    margin: "24px 0",
  },
  notesText: {
    color: "#92400e",
    fontSize: "13px",
    fontFamily: "'Noto Sans TC', 'Microsoft JhengHei', sans-serif",
    lineHeight: "1.6",
    margin: 0,
  },
};

export function AppointmentConfirmation({
  appointmentId,
  customerName,
  appointmentDate,
  appointmentTime,
  storeName,
  storeAddress,
  storePhone,
  googleMapsUrl,
  notes,
  logoUrl,
}: AppointmentConfirmationProps) {
  return (
    <EmailLayout
      logoUrl={logoUrl}
      preview={`預約確認！${appointmentDate} ${appointmentTime} - ${storeName}`}
      title="預約確認 - Black Living 黑哥居家"
    >
      <Text style={styles.greeting}>{customerName} 您好，</Text>

      <Section style={styles.statusBox}>
        <Text style={styles.statusIcon}>📅</Text>
        <Text style={styles.statusText}>預約已確認</Text>
      </Section>

      <Text style={styles.message}>
        感謝您預約 Black Living 黑哥居家的試躺體驗！
        我們期待在門市與您見面，為您提供最優質的服務。
      </Text>

      <Text style={styles.sectionTitle}>預約資訊</Text>
      <Section style={styles.appointmentBox}>
        <Section style={styles.appointmentRow}>
          <Text style={styles.appointmentLabel}>預約編號</Text>
          <Text style={styles.appointmentValue}>#{appointmentId}</Text>
        </Section>
        <Section style={styles.appointmentRow}>
          <Text style={styles.appointmentLabel}>預約日期</Text>
          <Text style={styles.appointmentValue}>{appointmentDate}</Text>
        </Section>
        <Section style={styles.appointmentRow}>
          <Text style={styles.appointmentLabel}>預約時間</Text>
          <Text style={styles.appointmentValue}>{appointmentTime}</Text>
        </Section>
      </Section>

      <Text style={styles.sectionTitle}>門市資訊</Text>
      <Section style={styles.storeBox}>
        <Text style={styles.storeText}>
          <strong>{storeName}</strong>
          <br />
          {storeAddress}
          {Boolean(storePhone) && (
            <>
              <br />📞 {storePhone}
            </>
          )}
        </Text>
        {Boolean(googleMapsUrl) && (
          <Link href={googleMapsUrl} style={styles.mapButton}>
            查看 Google 地圖
          </Link>
        )}
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

AppointmentConfirmation.PreviewProps = {
  appointmentId: "APT202601120001",
  customerName: "王小明",
  appointmentDate: "2026年1月15日 (星期三)",
  appointmentTime: "14:00 - 15:00",
  storeName: "Black Living 黑哥居家 - 台北旗艦店",
  storeAddress: "台北市信義區信義路五段7號1樓",
  storePhone: "02-2345-6789",
  googleMapsUrl: "https://maps.google.com/?q=台北市信義區信義路五段7號",
  notes: "請攜帶本郵件作為預約憑證",
  logoUrl: "https://www.blackliving.tw/blackliving-logo-zh.svg",
} as AppointmentConfirmationProps;

export default AppointmentConfirmation;

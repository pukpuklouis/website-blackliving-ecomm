import { Link, Section, Text } from "@react-email/components";
import { brandColors } from "../../components/BrandHeader";
import { EmailLayout } from "../../components/EmailLayout";
import { type OrderItem, OrderSummary } from "../../components/OrderSummary";

type ShippingNotificationProps = {
  orderId: string;
  customerName: string;
  orderItems: OrderItem[];
  subtotal: number;
  shipping: number;
  total: number;
  shippingCompany?: string;
  trackingNumber?: string;
  trackingUrl?: string;
  estimatedDelivery?: string;
  shippingAddress?: {
    name: string;
    phone: string;
    address: string;
    city: string;
    district: string;
  };
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
    backgroundColor: "#eff6ff",
    border: "1px solid #3b82f6",
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
    color: "#1e40af",
    fontSize: "18px",
    fontFamily: "'Noto Sans TC', 'Microsoft JhengHei', sans-serif",
    fontWeight: 600,
    margin: 0,
  },
  trackingBox: {
    backgroundColor: "#faf8f5",
    border: `1px solid ${brandColors.gold}`,
    borderRadius: "8px",
    padding: "20px",
    margin: "16px 0",
  },
  trackingRow: {
    padding: "8px 0",
  },
  trackingLabel: {
    color: "#666666",
    fontSize: "12px",
    fontFamily: "'Noto Sans TC', 'Microsoft JhengHei', sans-serif",
    margin: "0 0 4px 0",
    textTransform: "uppercase" as const,
    letterSpacing: "0.5px",
  },
  trackingValue: {
    color: "#1a1a1a",
    fontSize: "16px",
    fontFamily: "'Noto Sans TC', 'Microsoft JhengHei', sans-serif",
    fontWeight: 600,
    margin: 0,
  },
  trackButton: {
    display: "inline-block",
    backgroundColor: brandColors.gold,
    color: "#ffffff",
    padding: "12px 24px",
    borderRadius: "6px",
    textDecoration: "none",
    fontSize: "14px",
    fontFamily: "'Noto Sans TC', 'Microsoft JhengHei', sans-serif",
    fontWeight: 600,
    marginTop: "16px",
  },
  addressBox: {
    backgroundColor: "#f9fafb",
    borderRadius: "8px",
    padding: "16px",
    margin: "16px 0",
  },
  addressText: {
    color: "#333333",
    fontSize: "14px",
    fontFamily: "'Noto Sans TC', 'Microsoft JhengHei', sans-serif",
    lineHeight: "1.6",
    margin: 0,
  },
  orderIdText: {
    color: "#666666",
    fontSize: "14px",
    fontFamily: "'Noto Sans TC', 'Microsoft JhengHei', sans-serif",
    margin: "0 0 8px 0",
  },
};

export function ShippingNotification({
  orderId,
  customerName,
  orderItems,
  subtotal,
  shipping,
  total,
  shippingCompany,
  trackingNumber,
  trackingUrl,
  estimatedDelivery,
  shippingAddress,
  logoUrl,
}: ShippingNotificationProps) {
  return (
    <EmailLayout
      logoUrl={logoUrl}
      preview={`您的訂單已出貨！訂單編號 #${orderId}`}
      title="出貨通知 - Black Living 黑哥居家"
    >
      <Text style={styles.greeting}>{customerName} 您好，</Text>

      <Section style={styles.statusBox}>
        <Text style={styles.statusIcon}>🚚</Text>
        <Text style={styles.statusText}>訂單已出貨</Text>
      </Section>

      <Text style={styles.message}>
        好消息！您的訂單已經出貨，正在運送途中。請留意收件，謝謝！
      </Text>

      {Boolean(shippingCompany || trackingNumber) && (
        <>
          <Text style={styles.sectionTitle}>物流資訊</Text>
          <Section style={styles.trackingBox}>
            {Boolean(shippingCompany) && (
              <Section style={styles.trackingRow}>
                <Text style={styles.trackingLabel}>物流公司</Text>
                <Text style={styles.trackingValue}>{shippingCompany}</Text>
              </Section>
            )}
            {Boolean(trackingNumber) && (
              <Section style={styles.trackingRow}>
                <Text style={styles.trackingLabel}>追蹤編號</Text>
                <Text style={styles.trackingValue}>{trackingNumber}</Text>
              </Section>
            )}
            {Boolean(estimatedDelivery) && (
              <Section style={styles.trackingRow}>
                <Text style={styles.trackingLabel}>預計送達</Text>
                <Text style={styles.trackingValue}>{estimatedDelivery}</Text>
              </Section>
            )}
            {Boolean(trackingUrl) && (
              <Link href={trackingUrl} style={styles.trackButton}>
                查詢物流進度
              </Link>
            )}
          </Section>
        </>
      )}

      {Boolean(shippingAddress) && (
        <>
          <Text style={styles.sectionTitle}>收件資訊</Text>
          <Section style={styles.addressBox}>
            <Text style={styles.addressText}>
              <strong>{shippingAddress?.name}</strong>
              <br />
              {shippingAddress?.phone}
              <br />
              {shippingAddress?.city}
              {shippingAddress?.district}
              {shippingAddress?.address}
            </Text>
          </Section>
        </>
      )}

      <Text style={styles.sectionTitle}>訂單明細</Text>
      <Text style={styles.orderIdText}>
        訂單編號：<strong>#{orderId}</strong>
      </Text>
      <OrderSummary
        orderItems={orderItems}
        shipping={shipping}
        subtotal={subtotal}
        total={total}
      />
    </EmailLayout>
  );
}

export default ShippingNotification;

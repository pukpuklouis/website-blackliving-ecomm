import { Column, Row, Section, Text } from "@react-email/components";

type OrderItem = {
  name: string;
  quantity: number;
  price: number;
};

type OrderSummaryProps = {
  orderItems: OrderItem[];
  subtotal: number;
  shipping?: number;
  total: number;
  currency?: string;
};

const styles = {
  container: {
    backgroundColor: "#f5f5f5",
    padding: "24px",
    borderRadius: "8px",
    margin: "24px 0",
  },
  heading: {
    color: "#1a1a1a",
    fontSize: "16px",
    fontFamily: "'Noto Sans TC', sans-serif",
    fontWeight: 600,
    margin: "0 0 16px 0",
  },
  itemRow: {
    borderBottom: "1px solid #e0e0e0",
    padding: "12px 0",
  },
  itemName: {
    color: "#333333",
    fontSize: "14px",
    fontFamily: "'Noto Sans TC', sans-serif",
    margin: 0,
  },
  itemQuantity: {
    color: "#666666",
    fontSize: "12px",
    fontFamily: "'Noto Sans TC', sans-serif",
    margin: "4px 0 0 0",
  },
  itemPrice: {
    color: "#1a1a1a",
    fontSize: "14px",
    fontFamily: "'Noto Sans TC', sans-serif",
    fontWeight: 600,
    textAlign: "right" as const,
    margin: 0,
  },
  summaryRow: {
    padding: "8px 0",
  },
  summaryLabel: {
    color: "#666666",
    fontSize: "14px",
    fontFamily: "'Noto Sans TC', sans-serif",
    margin: 0,
  },
  summaryValue: {
    color: "#1a1a1a",
    fontSize: "14px",
    fontFamily: "'Noto Sans TC', sans-serif",
    textAlign: "right" as const,
    margin: 0,
  },
  totalRow: {
    borderTop: "2px solid #C4A05F",
    padding: "16px 0 0 0",
    marginTop: "8px",
  },
  totalLabel: {
    color: "#1a1a1a",
    fontSize: "18px",
    fontFamily: "'Noto Sans TC', sans-serif",
    fontWeight: 600,
    margin: 0,
  },
  totalValue: {
    color: "#C4A05F",
    fontSize: "20px",
    fontFamily: "'Noto Sans TC', sans-serif",
    fontWeight: 700,
    textAlign: "right" as const,
    margin: 0,
  },
};

function formatCurrency(amount: number, currency = "TWD"): string {
  return new Intl.NumberFormat("zh-TW", {
    style: "currency",
    currency,
    minimumFractionDigits: 0,
  }).format(amount);
}

export function OrderSummary({
  orderItems,
  subtotal,
  shipping = 0,
  total,
  currency = "TWD",
}: OrderSummaryProps) {
  return (
    <Section style={styles.container}>
      <Text style={styles.heading}>訂單明細</Text>

      {orderItems.map((item, index) => (
        <Row key={`order-item-${item.name}-${index}`} style={styles.itemRow}>
          <Column>
            <Text style={styles.itemName}>{item.name}</Text>
            <Text style={styles.itemQuantity}>數量: {item.quantity}</Text>
          </Column>
          <Column>
            <Text style={styles.itemPrice}>
              {formatCurrency(item.price * item.quantity, currency)}
            </Text>
          </Column>
        </Row>
      ))}

      <Row style={styles.summaryRow}>
        <Column>
          <Text style={styles.summaryLabel}>小計</Text>
        </Column>
        <Column>
          <Text style={styles.summaryValue}>
            {formatCurrency(subtotal, currency)}
          </Text>
        </Column>
      </Row>

      {shipping > 0 && (
        <Row style={styles.summaryRow}>
          <Column>
            <Text style={styles.summaryLabel}>運費</Text>
          </Column>
          <Column>
            <Text style={styles.summaryValue}>
              {formatCurrency(shipping, currency)}
            </Text>
          </Column>
        </Row>
      )}

      <Row style={styles.totalRow}>
        <Column>
          <Text style={styles.totalLabel}>總計</Text>
        </Column>
        <Column>
          <Text style={styles.totalValue}>
            {formatCurrency(total, currency)}
          </Text>
        </Column>
      </Row>
    </Section>
  );
}

export type { OrderItem, OrderSummaryProps };

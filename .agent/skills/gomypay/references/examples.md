# GOMYPAY 實現範例

本文檔提供常見的 GOMYPAY 信用卡支付實現範例。

## 1. 前端提交表單 (使用系統預設頁面)

### HTML 表單範例

```html
<form action="https://n.gomypay.asia/ShuntClass.aspx" method="post">
  <input name="Send_Type" value="0">
  <input name="Pay_Mode_No" value="2">
  <input name="CustomerId" value="YOUR_ENCRYPTED_CUSTOMER_ID">
  <input name="Order_No" value="ORDER_20250126_001">
  <input name="Amount" value="1000">
  <input name="TransCode" value="00">
  <input name="Buyer_Name" value="陳小明">
  <input name="Buyer_Telm" value="0912345678">
  <input name="Buyer_Mail" value="customer@example.com">
  <input name="Buyer_Memo" value="Simmons 黑標床墊">
  <input name="TransMode" value="1">
  <input name="Installment" value="0">
  <input name="Return_url" value="https://your-site.com/payment/result">
  <input name="Callback_Url" value="https://your-api.com/api/payment/callback">
  <input name="e_return" value="1">
  <input name="Str_Check" value="YOUR_MD5_HASH">
  <button type="submit">前往付款</button>
</form>
```

## 2. API 回調處理 (Hono + Cloudflare Workers)

### 接收 JSON 回傳

```typescript
import { Hono } from 'hono';
import { env } from 'hono/adapter';

type Bindings = {
  DB: D1Database;
  GOMYPAY_CUSTOMER_ID: string;
  GOMYPAY_STR_CHECK: string;
};

const app = new Hono<{ Bindings: Bindings }>();

// GOMYPAY JSON 回調處理
app.post('/api/payment/callback', async (c) => {
  const { GOMYPAY_CUSTOMER_ID, GOMYPAY_STR_CHECK, DB } = env(c);

  try {
    const body = await c.req.json();

    // 驗證必要欄位
    const { result, e_orderno, OrderID, e_money, str_check } = body;
    if (!result || !e_orderno || !OrderID || !e_money || !str_check) {
      return c.json({ error: 'Missing required fields' }, 400);
    }

    // 計算 MD5 驗證碼
    const verifyString = `${result}${e_orderno}${GOMYPAY_CUSTOMER_ID}${e_money}${OrderID}${GOMYPAY_STR_CHECK}`;
    const expectedHash = await md5(verifyString);

    if (str_check !== expectedHash) {
      console.error('GOMYPAY callback verification failed', {
        e_orderno,
        received: str_check,
        expected: expectedHash,
      });
      return c.json({ error: 'Invalid signature' }, 403);
    }

    // 更新訂單狀態
    if (result === '1') {
      await DB.prepare(`
        UPDATE orders
        SET status = 'completed',
            payment_status = 'paid',
            gomypay_order_id = ?,
            paid_at = datetime('now')
        WHERE order_number = ?
      `).bind(OrderID, e_orderno).run();

      console.log(`Order ${e_orderno} payment completed`);
    } else {
      await DB.prepare(`
        UPDATE orders
        SET status = 'failed',
            payment_status = 'failed',
            error_message = ?
        WHERE order_number = ?
      `).bind(body.ret_msg || 'Payment failed', e_orderno).run();
    }

    // 回傳 HTTP 200 以停止重試
    return c.json({ success: true });
  } catch (error) {
    console.error('GOMYPAY callback error:', error);
    return c.json({ error: 'Internal server error' }, 500);
  }
});

// MD5 輔助函數
async function md5(string: string): Promise<string> {
  const msgBuffer = new TextEncoder().encode(string);
  const hashBuffer = await crypto.subtle.digest('MD5', msgBuffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}
```

## 3. Drizzle Schema 設計

### 訂單資料表

```sql
CREATE TABLE orders (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  order_number TEXT NOT NULL UNIQUE,
  customer_id INTEGER NOT NULL,
  total_amount INTEGER NOT NULL,

  -- GOMYPAY 相關欄位
  gomypay_order_id TEXT,
  payment_method TEXT DEFAULT 'gomypay_credit_card',
  payment_status TEXT DEFAULT 'pending', -- pending, paid, failed
  status TEXT DEFAULT 'pending', -- pending, completed, failed, cancelled

  -- 授權資訊
  authorization_code TEXT,
  card_last_four TEXT,
  transaction_fee INTEGER,

  -- 回調資訊
  callback_received_at TEXT,
  paid_at TEXT,
  error_message TEXT,

  -- 時間戳
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP,

  FOREIGN KEY (customer_id) REFERENCES customers(id)
);

CREATE INDEX idx_orders_order_number ON orders(order_number);
CREATE INDEX idx_orders_gomypay_order_id ON orders(gomypay_order_id);
CREATE INDEX idx_orders_payment_status ON orders(payment_status);
```

### Drizzle Schema 定義

```typescript
import { sqliteTable, text, integer } from 'drizzle-orm/sqlite-core';

export const orders = sqliteTable('orders', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  orderNumber: text('order_number').notNull().unique(),
  customerId: integer('customer_id').notNull().references(() => customers.id),
  totalAmount: integer('total_amount').notNull(),

  // GOMYPAY 相關欄位
  gomypayOrderId: text('gomypay_order_id'),
  paymentMethod: text('payment_method').default('gomypay_credit_card'),
  paymentStatus: text('payment_status').default('pending'), // pending, paid, failed
  status: text('status').default('pending'), // pending, completed, failed, cancelled

  // 授權資訊
  authorizationCode: text('authorization_code'),
  cardLastFour: text('card_last_four'),
  transactionFee: integer('transaction_fee'),

  // 回調資訊
  callbackReceivedAt: text('callback_received_at'),
  paidAt: text('paid_at'),
  errorMessage: text('error_message'),

  // 時間戳
  createdAt: text('created_at').default(sql`CURRENT_TIMESTAMP`),
  updatedAt: text('updated_at').default(sql`CURRENT_TIMESTAMP`),
});

export type Order = typeof orders.$inferSelect;
export type NewOrder = typeof orders.$inferInsert;
```

## 4. 創建付款請求

### 後端 API (Hono)

```typescript
import { Hono } from 'hono';
import { env } from 'hono/adapter';
import { md5 } from '../utils/crypto';

app.post('/api/payment/create', async (c) => {
  const { GOMYPAY_CUSTOMER_ID, GOMYPAY_STR_CHECK } = env(c);
  const { orderId, amount, buyer } = await c.req.json();

  // 生成交易參數
  const params = new URLSearchParams({
    Send_Type: '0',
    Pay_Mode_No: '2',
    CustomerId: GOMYPAY_CUSTOMER_ID,
    Order_No: orderId,
    Amount: amount.toString(),
    TransCode: '00',
    Buyer_Name: buyer.name,
    Buyer_Telm: buyer.phone,
    Buyer_Mail: buyer.email,
    Buyer_Memo: 'Simmons 黑標床墊',
    TransMode: '1',
    Installment: '0',
    Return_url: `${c.req.url.split('/api')[0]}/payment/result`,
    Callback_Url: `${c.req.url.split('/api')[0]}/api/payment/callback`,
    e_return: '1',
  });

  // 計算 Str_Check (如果需要)
  const strCheckValue = await md5(
    `1${orderId}${GOMYPAY_CUSTOMER_ID}${amount}`
  );
  params.append('Str_Check', strCheckValue);

  // 回傳付款網址
  const paymentUrl = `https://n.gomypay.asia/ShuntClass.aspx?${params.toString()}`;

  return c.json({
    success: true,
    paymentUrl,
    orderId,
  });
});
```

## 5. 訂單狀態查詢

### 查詢 API 整合

```typescript
app.get('/api/payment/query/:orderId', async (c) => {
  const { GOMYPAY_CUSTOMER_ID, GOMYPAY_STR_CHECK, DB } = env(c);
  const orderId = c.req.param('orderId');

  // 計算 Str_Check
  const strCheckValue = await md5(`${orderId}${GOMYPAY_CUSTOMER_ID}${GOMYPAY_STR_CHECK}`);

  // 發送查詢請求
  const response = await fetch('https://n.gomypay.asia/CallOrder.aspx', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      Order_No: orderId,
      CustomerId: GOMYPAY_CUSTOMER_ID,
      Str_Check: strCheckValue,
    }),
  });

  const result = await response.json();

  // 更新本地訂單狀態
  if (result.result === '1') {
    await DB.prepare(`
      UPDATE orders
      SET payment_status = 'paid',
          status = 'completed',
          paid_at = ?,
          authorization_code = ?,
          card_last_four = ?
      WHERE order_number = ?
    `).bind(
      `${result.p_date} ${result.p_time}`,
      result.avcode,
      result.Creditcard_No,
      orderId
    ).run();
  }

  return c.json(result);
});
```

## 6. 測試流程

### 測試環境設定

```typescript
const isTestMode = process.env.NODE_ENV === 'development';

const GOMYPAY_CONFIG = {
  testUrl: 'https://n.gomypay.asia/TestShuntClass.aspx',
  prodUrl: 'https://n.gomypay.asia/ShuntClass.aspx',
  get url() {
    return isTestMode ? this.testUrl : this.prodUrl;
  },
};
```

### 測試用例

```typescript
describe('GOMYPAY Payment', () => {
  it('should create payment request', async () => {
    const response = await app.request('/api/payment/create', {
      method: 'POST',
      body: JSON.stringify({
        orderId: 'TEST_001',
        amount: 100,
        buyer: {
          name: '測試使用者',
          phone: '0912345678',
          email: 'test@example.com',
        },
      }),
    });

    const data = await response.json();
    expect(data.success).toBe(true);
    expect(data.paymentUrl).toContain('TestShuntClass.aspx');
  });

  it('should handle callback with valid signature', async () => {
    const callbackData = {
      result: '1',
      e_orderno: 'TEST_001',
      OrderID: '2025012600000000001',
      e_money: '100',
      str_check: await md5('1TEST_001CUSTOMER_ID1002025012600000000001SECRET_KEY'),
    };

    const response = await app.request('/api/payment/callback', {
      method: 'POST',
      body: JSON.stringify(callbackData),
    });

    expect(response.status).toBe(200);
  });
});
```

## 常見問題處理

### 1. 重複回傳處理

```typescript
// 檢查訂單是否已處理
const existingOrder = await DB.prepare(`
  SELECT status FROM orders WHERE order_number = ?
`).bind(e_orderno).first();

if (existingOrder?.status === 'completed') {
  console.log(`Order ${e_orderno} already processed, skipping`);
  return c.json({ success: true, message: 'Already processed' });
}
```

### 2. 金額驗證

```typescript
const localOrder = await DB.prepare(`
  SELECT total_amount FROM orders WHERE order_number = ?
`).bind(e_orderno).first();

if (localOrder && parseInt(localOrder.total_amount) !== parseInt(e_money)) {
  console.error(`Amount mismatch for order ${e_orderno}`);
  return c.json({ error: 'Amount mismatch' }, 400);
}
```

### 3. 超時處理

```typescript
// 對於超過 10 分鐘未回傳的訂單,主動查詢
app.post('/api/payment/check-pending', async () => {
  const pendingOrders = await DB.prepare(`
    SELECT order_number FROM orders
    WHERE payment_status = 'pending'
      AND created_at > datetime('now', '-10 minutes')
  `).all();

  for (const order of pendingOrders) {
    // 呼叫查詢 API
    await fetchPaymentStatus(order.order_number);
  }

  return c.json({ success: true });
});
```

---
name: gomypay
description: GOMYPAY 金流串接實現指南 - 專注於信用卡支付整合、回調處理、訂單狀態更新、API 端點建立、資料庫設計、MD5 驗證、查詢與退貨功能。使用此 skill 實現完整的 GOMYPAY 信用卡支付流程。
---

# GOMYPAY 信用卡支付實現

## 概述

本技能提供完整的 GOMYPAY 信用卡支付串接指南,涵蓋從支付請求建立、回調處理到訂單狀態更新的完整流程。適用於需要整合台灣 GOMYPAY 金流服務的電商網站。

## 核心實現流程

### 1. 建立支付請求

#### 選擇支付頁面類型

**使用 GOMYPAY 預設頁面 (推薦)**
- 不需傳送 `CardNo`, `ExpireDate`, `CVV`
- 消費者在 GOMYPAY 頁面輸入卡號
- PCI DSS 合規,無需自行認證

**自行架構支付頁面**
- 需傳送 `CardNo`, `ExpireDate`, `CVV`
- 必須通過 PCI DSS 認證
- 僅建議特殊需求使用

#### 準備必填參數

```
Send_Type: "0" (信用卡)
Pay_Mode_No: "2"
CustomerId: 商店代號(加密32碼)
Order_No: 自訂訂單編號(最大25字)
Amount: 交易金額(最低35元)
TransCode: "00" (授權)
Buyer_Name: 消費者姓名
Buyer_Telm: 消費者手機
Buyer_Mail: 消費者 Email
Buyer_Memo: 交易內容
TransMode: "1" (一般) 或 "2" (分期)
Installment: 期數(無分期填 0)
```

#### 設定回傳方式

**三種回傳方式擇一使用:**

1. **Return_url (GET)**
   - 適合: 需要跳轉到結果頁面
   - 格式: `https://your-site.com/payment/result`

2. **e_return + Str_Check (JSON POST)**
   - 適合: API 整合,後端處理
   - 需計算 MD5 驗證碼

3. **Callback_Url (背景對帳 POST)**
   - 適合: 主要訂單狀態更新機制
   - 重試機制: 3天內最多10次
   - 建議實現作為主要更新來源

**優先順序**: JSON POST > Callback_Url > Return_url

#### API 端點

```
正式環境: https://n.gomypay.asia/ShuntClass.aspx
測試環境: https://n.gomypay.asia/TestShuntClass.aspx
```

### 2. 實現回調處理

#### MD5 驗證碼計算

```
MD5(result + e_orderno + CustomerId + Amount + OrderID + Str_Check)
```

**重要注意事項**:
- `CustomerId` 使用明碼商店代號(統編/身分證),非加密32碼
- `Amount` 信用卡用交易金額,其他支付用 `PayAmount`
- `OrderID` 使用 GOMYPAY 系統訂單編號(非自訂編號)

#### 回調處理流程

```typescript
1. 接收 POST 請求
2. 解析 JSON 參數
3. 驗證 MD5 簽章
4. 檢查訂單是否已處理(防止重複)
5. 驗證金額是否正確
6. 更新訂單狀態
7. 回傳 HTTP 200 (停止重試)
```

#### 訂單狀態更新邏輯

```typescript
if (result === "1") {
  // 支付成功
  status = "completed"
  payment_status = "paid"
  paid_at = current_timestamp
  authorization_code = avcode
  card_last_four = CardLastNum
} else {
  // 支付失敗
  status = "failed"
  payment_status = "failed"
  error_message = ret_msg
}
```

### 3. 資料庫設計

#### 訂單表必需欄位

```sql
CREATE TABLE orders (
  id INTEGER PRIMARY KEY,
  order_number TEXT UNIQUE NOT NULL,  -- 自訂訂單編號 (Order_No)
  total_amount INTEGER NOT NULL,

  -- GOMYPAY 回調資料
  gomypay_order_id TEXT,              -- 系統訂單編號 (OrderID)
  payment_status TEXT DEFAULT 'pending', -- pending, paid, failed
  status TEXT DEFAULT 'pending',      -- pending, completed, failed
  authorization_code TEXT,            -- 授權碼 (avcode)
  card_last_four TEXT,                -- 信用卡後四碼
  transaction_fee INTEGER,            -- 手續費 (e_outlay)

  -- 回調控制
  callback_received_at TEXT,          -- 回調接收時間
  paid_at TEXT,                       -- 支付完成時間
  error_message TEXT,                 -- 錯誤訊息

  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP
);
```

**重要索引**:
- `order_number` - 查詢自訂訂單
- `gomypay_order_id` - 關聯 GOMYPAY 訂單
- `payment_status` - 過濾待處理訂單

### 4. 錯誤處理與重試

#### 常見錯誤情況

**1. MD5 驗證失敗**
```
- 記錄錯誤日誌(包含接收參數)
- 回傳 HTTP 403
- 拒絕更新訂單狀態
```

**2. 金額不符**
```
- 記錄錯誤日誌
- 回傳 HTTP 400
- 聯繫客服確認
```

**3. 重複回傳**
```
- 查詢訂單當前狀態
- 若已 completed,回傳 HTTP 200
- 避免重複處理
```

**4. 網路超時**
```
- 實現訂單狀態查詢 API
- 定期主動查詢待付款訂單
- 更新逾時訂單為失敗
```

#### 退貨功能

```typescript
// 申請退貨
POST https://n.gomypay.asia/GoodReturn.aspx
{
  Order_No: "訂單編號",
  CustomerId: "商店代號",
  Str_Check: "MD5驗證碼",
  Goods_Return: "1",
  Goods_Return_Reason: "退貨原因"
}

// 取消退貨
{
  Order_No: "訂單編號",
  CustomerId: "商店代號",
  Str_Check: "MD5驗證碼",
  Goods_Return_Cancel: "1"
}
```

## 參考資源

### references/api_reference.md
包含完整的 API 參考文檔:
- 所有 API 端點
- 請求/回應參數詳細說明
- MD5 驗證碼計算規則
- 回傳欄位完整定義
- 查詢與退貨 API

### references/examples.md
提供實作範例:
- HTML 表單提交
- Hono + Cloudflare Workers 回調處理
- Drizzle ORM schema 定義
- 建立付款請求 API
- 訂單狀態查詢
- 測試用例
- 常見問題處理

## 實現檢查清單

### 支付請求建立
- [ ] 選擇合適的 API 端點(正式/測試)
- [ ] 準備所有必填參數
- [ ] 設定回傳方式(Return_url / e_return / Callback_Url)
- [ ] 計算 Str_Check (如使用 JSON 回傳)
- [ ] 實現支付網址生成邏輯

### 回調處理
- [ ] 建立回調端點
- [ ] 實現 MD5 驗證
- [ ] 防止重複處理
- [ ] 驗證金額正確性
- [ ] 更新訂單狀態
- [ ] 回傳 HTTP 200

### 資料庫
- [ ] 建立訂單資料表
- [ ] 新增 GOMYPAY 相關欄位
- [ ] 建立必要索引
- [ ] 實現 status 欄位轉換邏輯

### 錯誤處理
- [ ] MD5 驗證失敗處理
- [ ] 金額不符處理
- [ ] 重複回傳防護
- [ ] 超時訂單查詢機制

### 測試
- [ ] 測試環境流程測試
- [ ] MD5 驗證測試
- [ ] 重複回傳測試
- [ ] 金額驗證測試
- [ ] 正式環境小額測試

## 最佳實踐

### 安全性
- 永遠驗證 MD5 簽章
- 商店代號和驗證密碼使用環境變數
- 不在日誌中記錄完整信用卡資訊
- 使用 HTTPS 傳輸

### 可靠性
- 實現背景對帳作為主要狀態更新來源
- 使用資料庫交易防止競態條件
- 記錄所有回調請求用於除錯
- 實現訂單狀態查詢作為備援

### 使用者體驗
- 清楚的支付狀態提示
- 支付失敗提供具體錯誤訊息
- 保留支付結果頁面供再次查詢
- 提供訂單查詢功能

# GOMYPAY API 參考文檔

本文檔包含 GOMYPAY 金流串接的完整 API 參考資訊,專注於信用卡支付實現和回調處理。

## API 端點

### 正式環境
- 交易遞交: `https://n.gomypay.asia/ShuntClass.aspx`
- 查詢訂單: `https://n.gomypay.asia/CallOrder.aspx`
- 申請退貨: `https://n.gomypay.asia/GoodReturn.aspx`

### 測試環境
- 交易遞交: `https://n.gomypay.asia/TestShuntClass.aspx`
- 查詢訂單: `https://n.gomypay.asia/TestCallOrder.aspx`

## 信用卡交易參數

### 必填參數

| 參數名稱 | 長度限制 | 說明 |
|---------|---------|------|
| `Send_Type` | 1 | 信用卡請填 `0` |
| `Pay_Mode_No` | 1 | 付款模式請填 `2` |
| `CustomerId` | 32 | 商店代號(加密後32碼) |
| `Order_No` | 25 | 自訂交易單號 |
| `Amount` | 10 | 交易金額(最低35元) |
| `TransCode` | 2 | 交易類別請填 `00`(授權) |
| `Buyer_Name` | 20 | 消費者姓名 |
| `Buyer_Telm` | 20 | 消費者手機 |
| `Buyer_Mail` | 50 | 消費者 Email |
| `Buyer_Memo` | 500 | 消費備註(交易內容) |
| `TransMode` | 1 | 交易模式: `1`=一般, `2`=分期 |
| `Installment` | 2 | 期數,無分期請填 `0` |

### 可選參數

| 參數名稱 | 長度限制 | 說明 |
|---------|---------|------|
| `Return_url` | 100 | 授權結果回傳網址(GET) |
| `Callback_Url` | 500 | 背景對帳網址(POST) |
| `e_return` | 1 | 使用JSON回傳請填 `1` |
| `Str_Check` | 32 | 交易驗證密碼(MD5) |
| `CardToken` | 500 | 已綁定的卡片Token |

### 信用卡輸入參數(自行架構頁面)

| 參數名稱 | 長度限制 | 說明 |
|---------|---------|------|
| `CardNo` | 20 | 信用卡號 |
| `ExpireDate` | 4 | 卡片有效日期(YYMM) |
| `CVV` | 3 | 卡片認證碼 |

**重要**: 如未帶上述三個參數,系統會自動導入 GOMYPAY 預設付款頁面。

## 回調驗證

### MD5 驗證碼計算

```
MD5(result + e_orderno + CustomerId + Amount + OrderID + Str_Check)
```

**注意**:
- `CustomerId` 使用明碼商店代號(統編或身分證),非加密後32碼
- `Amount` 使用交易金額(信用卡)或實際繳費金額 `PayAmount`(超商/虛擬帳號)
- `OrderID` 使用系統訂單編號

### 驗證步驟

1. 接收回調參數
2. 重新計算 MD5 驗證碼
3. 比對 `str_check` 欄位
4. 驗證失敗應拒絕該筆交易

## JSON 回傳格式

### 成功回傳範例

```json
{
  "result": "1",
  "ret_msg": "授權成功",
  "OrderID": "2018070900000000001",
  "e_Cur": "NT",
  "e_money": "35",
  "e_date": "20180709",
  "e_time": "12:41:44",
  "e_orderno": "20180709test01",
  "e_no": "商店代號",
  "e_outlay": "2",
  "str_check": "MD5編碼",
  "bankname": "閘道銀行",
  "avcode": "012345"
}
```

### 回傳欄位說明

| 欄位名稱 | 長度 | 說明 |
|---------|-----|------|
| `result` | 1 | `0`=失敗, `1`=成功 |
| `ret_msg` | 100 | 回傳訊息 |
| `OrderID` | 19 | GOMYPAY 系統訂單編號 |
| `e_Cur` | 2 | 幣別 |
| `e_money` | 10 | 交易金額 |
| `e_date` | 8 | 交易日期(yyyyMMdd) |
| `e_time` | 8 | 交易時間(HH:mm:ss) |
| `e_orderno` | 25 | 自訂訂單編號 |
| `e_no` | 11 | 商店代號 |
| `e_outlay` | 10 | 交易總手續費 |
| `avcode` | 10 | 授權碼 |
| `str_check` | 32 | MD5 驗證碼 |
| `CardLastNum` | 4 | 信用卡號後四碼 |

## 背景對帳 (Callback_Url)

### 重試機制

- 對成功訂單,3天內發送對帳訊息
- 若未收到 HTTP 200,每5分鐘重試
- 最多重試10次
- 收到 HTTP 200 後停止重試

### 對帳參數(POST)

與交易回傳格式相同,額外包含:
- `Send_Type`: 固定為 `0`(信用卡)
- `PayAmount`: 實際繳費金額(部分付款方式)

## 訂單查詢

### 單筆查詢參數

| 參數名稱 | 長度 | 必填 | 說明 |
|---------|-----|-----|------|
| `Order_No` | 25 | 是 | 交易單號(自訂訂單編號) |
| `CustomerId` | 20 | 是 | 商店代號 |
| `Str_Check` | 32 | 是 | 交易驗證密碼 |

### 查詢回傳狀態

| result | 狀態 |
|--------|------|
| 0 | 失敗 |
| 1 | 成功 |
| 2 | 待付款 |
| 3 | 交易中斷 |

## 退貨申請

### 退貨參數

| 參數名稱 | 長度 | 必填 | 說明 |
|---------|-----|-----|------|
| `Order_No` | 25 | 是 | 交易單號 |
| `CustomerId` | 20 | 是 | 商店代號 |
| `Str_Check` | 32 | 是 | 交易驗證密碼 |
| `Goods_Return` | 1 | 是 | 退貨註記填 `1` |
| `Goods_Return_Reason` | 500 | 是 | 退貨原因 |

### 取消退貨參數

| 參數名稱 | 長度 | 必填 | 說明 |
|---------|-----|-----|------|
| `Order_No` | 25 | 是 | 交易單號 |
| `CustomerId` | 20 | 是 | 商店代號 |
| `Str_Check` | 32 | 是 | 交易驗證密碼 |
| `Goods_Return_Cancel` | 1 | 是 | 取消退貨註記填 `1` |

## 實現注意事項

### 1. 回傳方式選擇

- **Return_url**: 使用 GET 方式回傳,適合跳轉到結果頁
- **e_return + Str_Check**: 使用 JSON 格式回傳,適合 API 整合
- **Callback_Url**: 背景對帳,作為主要訂單狀態更新機制
- 同時填入時優先使用 JSON 回傳

### 2. 訂單狀態更新流程

1. 接收 `Return_url` 或 JSON 回傳(即時)
2. 接收 `Callback_Url` 背景對帳(非即時,但更可靠)
3. 對於未完成的訂單,使用查詢 API 主動查詢狀態

### 3. 測試環境差異

- 測試環境僅供流程測試
- 部分支付方式會在3秒後自動返回 callback
- 正式環境才會進行真實扣款

### 4. 錯誤處理

- 驗證 `str_check` 失敗: 拒絕交易,記錄錯誤
- 金額不符: 拒絕交易,聯繫客服
- 重複回傳: 根據 `OrderID` 和 `e_orderno` 去重
- 網路超時: 使用查詢 API 主動查詢訂單狀態

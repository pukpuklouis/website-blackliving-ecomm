這是一份經過專業整理、結構化後的 Markdown 文件，內容基於您提供的《GOMYPAY金流串接技術說明文件_1.13.2.pdf》。

我已將原始 OCR 內容中的雜訊清除，修正了錯位的表格，並將 HTML 表單與 JSON 範例代碼格式化，以便於開發人員閱讀與使用。

---

# GOMYPAY 金流串接技術說明文件

> **文件版本**: 1.13.2
> **發布日期**: 中華民國 114 年 05 月 13 日
> **承辦單位**: 台灣萬事達金流股份有限公司
> **文件屬性**: 機密文件，未經授權禁止任意形式傳播

---

## 目錄

1. [前言](https://www.google.com/search?q=%231-%E5%89%8D%E8%A8%80)
2. [交易遞交 (共通說明)](https://www.google.com/search?q=%232-%E4%BA%A4%E6%98%93%E9%81%9E%E4%BA%A4)
3. [信用卡串接 (一般/分期)](https://www.google.com/search?q=%233-%E4%BF%A1%E7%94%A8%E5%8D%A1%E4%B8%B2%E6%8E%A5-%E4%B8%80%E8%88%AC%E5%88%86%E6%9C%9F)
4. [銀聯卡串接](https://www.google.com/search?q=%234-%E9%8A%80%E8%81%AF%E5%8D%A1%E4%B8%B2%E6%8E%A5)
5. [超商條碼串接](https://www.google.com/search?q=%235-%E8%B6%85%E5%95%86%E6%A2%9D%E7%A2%BC%E4%B8%B2%E6%8E%A5)
6. [虛擬帳號串接](https://www.google.com/search?q=%236-%E8%99%9B%E6%93%AC%E5%B8%B3%E8%99%9F%E4%B8%B2%E6%8E%A5)
7. [WEBATM 串接](https://www.google.com/search?q=%237-webatm-%E4%B8%B2%E6%8E%A5)
8. [超商代碼串接](https://www.google.com/search?q=%238-%E8%B6%85%E5%95%86%E4%BB%A3%E7%A2%BC%E4%B8%B2%E6%8E%A5)
9. [申請退貨](https://www.google.com/search?q=%239-%E7%94%B3%E8%AB%8B%E9%80%80%E8%B2%A8)
10. [取消申請退貨](https://www.google.com/search?q=%2310-%E5%8F%96%E6%B6%88%E7%94%B3%E8%AB%8B%E9%80%80%E8%B2%A8)
11. [交易查詢](https://www.google.com/search?q=%2311-%E4%BA%A4%E6%98%93%E6%9F%A5%E8%A9%A2)
12. [多元支付 (行動支付)](https://www.google.com/search?q=%2312-%E5%A4%9A%E5%85%83%E6%94%AF%E4%BB%98)
13. [回傳狀態碼與參數對照](https://www.google.com/search?q=%2313-%E5%9B%9E%E5%82%B3%E7%8B%80%E6%85%8B%E7%A2%BC%E8%88%87%E5%8F%83%E6%95%B8%E5%B0%8D%E7%85%A7)

---

## 1. 前言

本手冊主要提供台灣萬事達金流 (GOMYPAY) 之特店辦理網路交易授權處理。使用 HTML 語法中的 **POST** 指令方式，提供以 URL 模式連線。

> **重要注意事項 (PCI DSS)**：
> 依國際信用卡組織規定，處理持卡人資料之網頁（即消費者卡號填寫網頁），皆須通過【PCI DSS 支付卡產業資料安全標準】認證。因此交易均需跳轉至本公司網頁供持卡人填寫。如商店因特殊需求需使用自行設計之卡號填寫網頁，請洽本公司客服協助取得認證。

---

## 2. 交易遞交

本節說明各類支付方式的串接參數與流程。

### 交易遞交網址 (通用)

* **正式網址**: `https://n.gomypay.asia/ShuntClass.aspx`
* **測試網址**: `https://n.gomypay.asia/TestShuntClass.aspx`

---

## 3. 信用卡串接 (一般/分期)

### 3.1 參數說明

| 參數名稱 | 長度 | 必填 | 說明 |
| --- | --- | --- | --- |
| **Send_Type** | 1 | 是 | 傳送型態請填 **0** (0:信用卡) |
| **Pay_Mode_No** | 1 | 是 | 付款模式請填 **2** |
| **CustomerId** | 32 | 是 | 商店代號 (法人:統編 或 加密代號32碼 / 自然人:身分證 或 加密代號32碼) |
| **Order_No** | 25 | 是 | 交易單號 (如無則自動帶入系統預設單號，若使用系統預設畫面則不可為無) |
| **Amount** | 10 | 是 | 交易金額 (最低金額 35 元) |
| **TransCode** | 2 | 是 | 交易類別請填 **00** (授權) |
| **Buyer_Name** | 20 | 是 | 消費者姓名 (不可含特殊符號及數字) |
| **Buyer_Telm** | 20 | 是 | 消費者手機 (數字，不可全形) |
| **Buyer_Mail** | 50 | 是 | 消費者 Email (不可全形) |
| **Buyer_Memo** | 500 | 是 | 消費備註 (交易內容) |
| **CardNo** | 20 | 否 | 信用卡號 (如無將自動轉入系統預設付款頁面) |
| **ExpireDate** | 4 | 否 | 卡片有效日期 (YYMM) |
| **CVV** | 3 | 否 | 卡片認證碼 |
| **TransMode** | 1 | 是 | 交易模式：一般請填 **1**、分期請填 **2** |
| **Installment** | 2 | 是 | 期數：無分期請填 **0** |
| **Return_url** | 100 | 否 | 授權結果回傳網址 (若要用 JSON 回傳請勿帶此參數；實名制 OTP 店家請填入接收網址) |
| **Callback_Url** | 500 | 否 | 背景對帳網址 (如未填寫默認不進行背景對帳) |
| **e_return** | 1 | 否 | 使用 JSON 回傳交易成功狀態請填 **1** (限非 3D 驗證) |
| **Str_Check** | 32 | 否 | 交易驗證密碼 (使用 JSON 回傳才為必填，MD5檢查) |
| **BindCard** | 1 | 否 | 綁定卡片資訊：1:綁卡, 0:不綁 (需店家開啟綁卡功能，僅限無分期) |
| **CardToken** | 500 | 否 | 使用已綁定卡片 Token 交易 (需注意 CVV 仍需手動填入，僅限無分期) |

> **備註**:
> 1. 若 `CardNo`, `ExpireDate`, `CVV`, `Buyer_Name`... 等參數未帶，系統將自動導入預設交易畫面。
> 2. `Return_url` 和 `e_return` 請擇一使用，若同時填入將優先使用 JSON 回傳。
> 
> 

### 3.2 交易遞交範例 (HTML Form)

```html
<form action="https://n.gomypay.asia/ShuntClass.aspx" method="post">
    <input name='Send_Type' value='0'>
    <input name='Pay_Mode_No' value='2'>
    <input name='CustomerId' value='商店代號'>
    <input name='Order_No' value='交易單號'>
    <input name='Amount' value='交易金額'>
    <input name='TransCode' value='00'>
    <input name='Buyer_Name' value='消費者姓名'>
    <input name='Buyer_Telm' value='消費者電話'>
    <input name='Buyer_Mail' value='消費者email'>
    <input name='Buyer_Memo' value='商品資訊'>
    <input name='TransMode' value='1'> <input name='Installment' value='0'> <input name='e_return' value='1'> <input name='Str_Check' value='交易驗證密碼'>
    <input type="submit" value="確定付款">
</form>

```

### 3.3 交易回傳訊息 (GET / JSON)

當交易完成，系統會根據設定回傳結果。

**str_check (MD5 編碼規則):**
MD5(`result` + `e_orderno` + `CustomerId(明碼)` + `Amount` + `OrderID` + `Str_Check(密碼)`)

**JSON 回傳範例:**

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
  "str_check": "MD5編碼結果",
  "bankname": "閘道銀行",
  "avcode": "012345",
  "Invoice_No": "發票號碼",
  "CardLastNum": "卡號末四碼"
}

```

### 3.4 背景對帳訊息 (Server-to-Server)

系統將對 **Callback_Url** 發送 POST 請求。

* 若回應 HTTP 200，則視為接收成功。
* 若失敗，每 5 分鐘重試一次，最多 10 次。

---

## 4. 銀聯卡串接

### 4.1 參數說明

* **Send_Type**: 請填 **1**
* **Pay_Mode_No**: 請填 **2**
* **其他參數**: 參照信用卡串接，但無分期相關參數 (`TransMode`, `Installment`)。

### 4.2 回傳訊息

只有交易成功才會進行回傳。參數結構同信用卡。

---

## 5. 超商條碼串接

### 5.1 參數說明

| 參數名稱 | 必填 | 說明 |
| --- | --- | --- |
| **Send_Type** | 是 | 請填 **2** |
| **Amount** | 是 | 最低金額 50 元，不可超過 6 萬元 |
| **Return_url** | 否 | 繳費資訊回傳網址 (與 `e_return` 擇一) |

### 5.2 交易結果回傳 (JSON 範例)

```json
{
  "Send_Type": "2",
  "result": "1",
  "ret_msg": "取號成功",
  "OrderID": "2020070100000001880",
  "e_orderno": "自訂訂單號",
  "e_payaccount": "繳費帳號",
  "LimitDate": "20200701",
  "code1": "超商條碼第一段",
  "code2": "超商條碼第二段",
  "code3": "超商條碼第三段",
  "str_check": "MD5驗證碼"
}

```

> **注意**: 繳費期限通常為今日。系統會額外 Email 通知消費者繳費條碼。

---

## 6. 虛擬帳號串接

### 6.1 參數說明

| 參數名稱 | 必填 | 說明 |
| --- | --- | --- |
| **Send_Type** | 是 | 請填 **4** |
| **Amount** | 是 | 最低金額 50 元，不可超過 6 萬元 |

### 6.2 交易結果回傳 (JSON 範例)

```json
{
  "Send_Type": "4",
  "result": "1",
  "OrderID": "...",
  "e_payaccount": "013-國泰世華-0055600701508856",
  "LimitDate": "20200701",
  "ret_msg": "取號成功",
  "str_check": "..."
}

```

---

## 7. WEBATM 串接

### 7.1 參數說明

| 參數名稱 | 必填 | 說明 |
| --- | --- | --- |
| **Send_Type** | 是 | 請填 **3** |
| **Amount** | 是 | 最低金額 50 元，不可超過 6 萬元 |
| **Return_url** | 否 | 測試環境使用 |
| **Callback_Url** | 否 | 正式環境對帳使用 |

> **備註**: WebATM 交易將以銀行預設網頁顯示結果。

---

## 8. 超商代碼串接

### 8.1 參數說明

| 參數名稱 | 必填 | 說明 |
| --- | --- | --- |
| **Send_Type** | 是 | 請填 **6** |
| **Amount** | 是 | 最低金額 50 元，不可超過 2 萬元 |
| **StoreType** | 是 | **0**:全家, **1**:OK, **2**:萊爾富, **3**:7-11 |

### 8.2 交易結果回傳 (JSON 範例)

```json
{
  "Send_Type": "6",
  "StoreType": "0",
  "result": "1",
  "ret_msg": "取號成功",
  "OrderID": "...",
  "PinCode": "GMPA2018383076",
  "str_check": "..."
}

```

> **注意**: 印單時間四家超商皆為 30 分鐘，印單後需於 30 分鐘內 (7-11 為 3 小時內) 繳費。

---

## 9. 申請退貨

* **API 網址**: `https://n.gomypay.asia/GoodReturn.aspx` (正式環境)
* **參數**: `Order_No`, `CustomerId`, `Str_Check`, `Goods_Return=1` (申請退貨), `Goods_Return_Reason` (退貨原因)。

## 10. 取消申請退貨

* **API 網址**: `https://n.gomypay.asia/GoodReturn.aspx` (正式環境)
* **參數**: `Order_No`, `CustomerId`, `Str_Check`, `Goods_Return_Cancel=1`。

---

## 11. 交易查詢

### 11.1 單筆資料查詢

* **網址**: `https://n.gomypay.asia/CallOrder.aspx`
* **必要參數**: `Order_No`, `CustomerId`, `Str_Check`
* **回傳結果**: 包含 `result` (0:失敗/1:成功/2:待付款/3:交易中斷), `pay_result` (0:未付款, 1:已付款) 等詳細資訊。

### 11.2 區間資料查詢

* **網址**: 同上。
* **必要參數**: `CreatSdate`/`CreatEdate` (建立日期起訖) **或** `PaySdate`/`PayEdate` (繳費日期起訖) 至少擇一。

---

## 12. 多元支付

此項目使用 **Raw JSON** 的 **POST** 方式串接。

### 12.1 支付類型代碼 (Send_Code)

* **9001**: 悠遊付 (EasyWallet)
* **9002**: 台灣Pay (TaiwanPay)
* **9003**: Apple Pay
* **9004**: Google Pay

### 12.2 通用參數 (JSON Request)

| 參數 | 必填 | 說明 |
| --- | --- | --- |
| **e_return** | 是 | 固定填 "1" |
| **Str_Check** | 是 | 交易驗證密碼 |
| **Send_Code** | 是 | 對應上方代碼 |
| **Send_Type** | 是 | 固定填 "9" |
| **Pay_Mode_No** | 是 | 固定填 "2" |
| **CustomerId** | 是 | 商店代號 |
| **Amount** | 是 | 金額 (>=1) |
| **Callback_Url** | 是 | 交易完成接收結果網址 |

### 12.3 請求範例 (JSON)

```json
{
  "e_return": "1",
  "Str_Check": "您的交易驗證密碼",
  "Send_Code": "9001",
  "Send_Type": "9",
  "Pay_Mode_No": "2",
  "CustomerId": "您的商店代號",
  "Amount": "100",
  "Buyer_Name": "測試人員",
  "Buyer_Telm": "0912345678",
  "Buyer_Mail": "test@example.com",
  "Buyer_Memo": "測試商品",
  "Callback_Url": "https://your-site.com/callback"
}

```

### 12.4 回傳範例 (JSON)

```json
{
  "result": "00000",
  "return_msg": "成功",
  "TM_Order_ID": "2021063000000000018",
  "Customer_Order_ID": "自訂單號",
  "redirectPaymentUrl": "QRCode或付款按鈕連結"
}

```

---

## 13. 回傳狀態碼與參數對照

### 13.1 多元支付狀態碼 (result)

| 代碼 | 說明 |
| --- | --- |
| **00000** | 成功 |
| **10001** | Amount 未填或小於 1 |
| **10002** | 必填參數中有部分未填 |
| **10005** | 查無訂單資料 |
| **10008** | Str_Check 有誤 |

### 13.2 常用回傳參數摘要

* **result**: 0:失敗, 1:成功 (多元支付使用 00000 為成功)
* **OrderID**: 系統訂單編號
* **e_orderno**: 自訂訂單編號
* **e_money**: 交易金額
* **avcode**: 授權碼 (信用卡)
* **e_payaccount**: 繳費帳號 (虛擬帳號/WebATM)
* **PinCode**: 繳費代碼 (超商代碼)
承辦單位：  台灣萬事達金流股份有限公司
台北市林森南路 4號6樓之 1
02-24286860
customer@gomypay.asia
文件撰寫人：  陳建錡、Laird
文件版本：  1.13.2

中 華 民 國  1 1 4  年  05  月  13  日 GOMYPAY 金流串接技術說明文件

# 第一項 前言
本手冊主要提供台灣萬事達金流 GOMYP AY 之特店，辦理網路交易授權處理，並使用 HTML 語法中的 POST 指令
方式，提供以 URL 模式連線。
【依國際信用卡組織規定，處理持卡人資料之網頁（即消費者卡號填寫網頁），皆須通過【PCI DSS 支付卡產業
資料安全標準】認證，所以交易均需跳轉至本公司網頁供持卡人填寫；如商店因特殊需求，需使用自行設計之卡
號填寫網頁，請洽本公司客服，本公司將協助商店取得認證。】
如有相關問題請洽服務專員或是來電本公司客服。
# 第二項 交易遞交
# 第三項 信用卡串接 (一般 /分期 )
1.交易遞交網址：
正式網址： https://n.gomypay.asia/ShuntClass.aspx
測試網址： https://n.gomypay.asia/TestShuntClass.aspx
2.交易遞交參數說明：
| 傳送參數 | 字串長度 | 必填 | 說明 |
| :--- | :--- | :--- | :--- |
| Send_Type | 長度 (1) | 是 | 傳送型態請填 0 (0.信用卡  1.銀聯卡  2.超商條碼  3.WebAtm 4.虛擬帳號  6.超商代碼 7.LinePay ) |
| Pay_Mode_No | 長度 (1) | 是 | 付款模式請填 2 |
| CustomerId | 最大長度 (32) | 是 | 商店代號 法人：統編或加密之商店代號 32碼 自然人：身分證或加密之 商店代號 32碼 |
| Order_No | 最大長度 (25) | 是 | 交易單號，如無則自動帶入系統預設交易單號 若使用系統預設交易畫面，交易單號不可為無 |
| Amount | 最大長度 (10) | 是 | 交易金額 (最低金額 35元) |
| TransCode | 長度 (2) | 是 | 交易類別請填 00(授權 ) |
| Buyer_Name | 最大長度 (20) | 是 | 消費者姓名， 不可含特殊符號及數字 ，未帶將自動轉入系統 預設付款頁面 |
| Buyer_Telm | 最大長度 (20) | 是 | 消費者手機 (數字，不可全形 ) ，未帶將自動轉入系統預設付 款頁面 |
| Buyer_Mail | 最大長度 (50) | 是 | 消費者 Email(不可全形 ) ，未帶將自動轉入系統預設付款頁 面 |

| Buyer_Memo | 最大長度 (500) | 是 | 消費備註 (交易內容 ) ，未帶將自動轉入系統預設付款頁面 |
| CardNo | 最大長度 (20) | 信用卡號，如無將自動轉入系統預設付款頁面 |
| ExpireDate | 長度 (4) | 卡片有效日期 (YYMM)  ，如無將自動轉入系統預設付款頁面 |
| CVV | 長度 (3) | 卡片認證碼，如無將自動轉入系統預設付款頁面 |
| TransMode | 長度 (1) | 是 | 交易模式一般請填 (1)、分期請填 (2) |
| Installment | 長度 (2) | 是 | 期數，無期數請填 0 Return_ url 最大長度 (100)  授權結果回傳網址：如無則自動轉入系統預設 授權頁面 |
註1:如果要用 JSON回傳請勿帶此參數
註2:如果是實名制 OTP店家，若要接回傳值，請填入接收網
址
| Callback_Url | 最大長度 (500) | 背景對帳網址 ，如未填寫默認不進行背景對帳 |
| e_return | 長度 (1) | 使用 json回傳是否交易成功 (限用非 3D驗證 ) ，請填 1 |
註1:如果要用預設交易頁面請勿帶此參數
註2:如果是實名制 OTP店家，無法使用 json接收回傳值，
故無需填入
| Str_Check | 長度 (32) | 交易驗證密碼，如果檢查不符合無法交易 (使用 Json回傳才 為必填欄位 ) |
BindCard  長度 (bit)
綁定卡片資訊功能參數 (Json串接無法使用此功能 )，
輸入 1：綁卡， 0：不綁（不輸入預設帶 0）
註 1:使用此參數時須注意 ”店家”是否有開啟”綁卡功
能”，如果沒有就不會成功
註 2:只適用於無分期
註 3:如果有帶此參數，會自動勾選綁定 功能
| CardToken | 長度 (500) | 串接網址直接帶卡片 Token，付款資訊會自動帶進信用卡欄位 (不含 CVV) |
註1:使用此參數時須注意 ”店家”是否有綁定過卡片，沒有
則不會成功
註 2:使用此參數時須注意 CVV一定要手動填入
註 3:使用此參數時請注意儲存的付款資訊 Token是否存於
該”店家”，如果沒有會出現：  找不到此卡資訊。
註 4:只適用於無分期

※註 1：只要 CardNo、ExpireDate、CVV、Buyer_Name 、Buyer_Telm、Buyer_Mail、Buyer_Memo ，有任何一個
參數未帶，系統將自動導入系統預設交易畫面
※註2：若需要回傳結果，「 Return_ url」和「e_return」兩個欄位請擇一選擇要回傳的方式，若兩個欄位同時填入將 優
先使用 Json回傳。

### 3. 交易遞交範例：
使用 Json回傳 -遞交網址：http s://n.gomypay.asia/ShuntClass.aspx
交易可以 POST表單或以 Curl遞交
```html
<META http -equiv='Content -Type' content='text/html;charset=utf -8'>
<FORM action="  http s://n.gomypay.asia/ShuntClass.aspx " method="post">
<input name=' Send_Type '  value=' 0'>
<input name=' Pay_Mode_No '  value=' 2'>
<input name=' CustomerId '  value='商店代號 '>
<input name=' Order_No '  value='交易單號 '>
<input name=' CardNo '  value='卡號 '>
<input name=' ExpireDate '  value='卡片有效日期 (YYMM) '>
<input name=' CVV ' value='卡片認證碼 '>
<input name=' TransMode ' value='交易模式  '>
<input name=' Amount ' value='交易金額 '>
<input name=' Installment ' value='期數 '>
<input name=' TransCode ' value=' 00'>
<input name=' Buyer_Name '  value='消費者姓名 '>
<input name=' Buyer_Telm '  value='消費者電話 '>
<input name=' Buyer_Mail '  value='消費者 email '>
<input name=' Buyer_Memo '  value='商品資訊 '>
<input name=' e_return '  value=' 1'>
<input name=' Str_Check '  value='交易驗證密碼 '>
<input name="button 1" type="submit" class="sub_buttom" id="button 1" value="確定付款 (請勿重複

點選 )" >
</form>
```
交易結果回傳範例：
```json
{"result":"1","ret_msg":" 授權成功
","OrderID":"201807 090000000000 1","e_Cur":"NT","e_money":"35","e_date":"20180709","e_time":"12:
41:44","e_orderno":"20180709test0 1","e_no":"商店代號 ","e_outlay":"2","str_check":" MD5編碼
","bankname":" 閘道銀行 ","avcode":" 012345 "}
```
※欄位參考請觀看第六項 交易回傳相關欄位參考
使用系統預設付款頁面 未帶回傳網址 ：
```
https://n.gomypay.asia/ShuntClass.aspx?Send_Type=0&Pay_Mode_No=2&CustomerId=80013554&
```
Order_No=自訂交易單號 (例:2018001 )
※未設定 Return_ url，故系統會以內定網頁顯示授權結果

使用系統預設付款頁面 並帶回傳網址 ：
```
https://n.gomypay.asia/ShuntClass.aspx?Send_Type=0&Pay_Mode_No=2&CustomerId=80013554&
```
Order_No=自訂交易單號 (例:2018001 )&Return_url= 回傳網址
※使用系統預設交易的店家，抬頭將為店家名稱 +”交易 -訂單編號 :”+自訂交易編號 (如下圖 )

若未設定回傳網址， 繳費成功將顯示以下畫面，訂單編號為店家自訂之訂單編號。
一般交易，自行架構網站之購物車之 交易範例：
```
https://n.gomypay.asia/ShuntClass.aspx?Send_Type=0&Pay_Mode_No=2&CustomerId=80013554&Order_No
```
=自訂交易單號 &CardNo =卡號 &ExpireDate= 到期日 &CVV=認證碼 &TransMode= 1&Amount=金額
&Installment= 0&TransCode=00&Buyer_Name= 消費者名稱 &Buyer_Mail= 消費者信箱 &Buyer_Telm= 消費者電話
&Buyer_Memo= 商品資訊
一般交易，自行架構網站之購物車 並帶回傳網址 ：
```
https://n.gomypay.asia/ShuntClass.aspx?Send_Type=0&Pay_Mode_No=2&CustomerId=80013554&Order_No
```
=自訂交易單號 &CardNo =卡號 &ExpireDate= 到期日 &CVV=認證碼 &TransMode= 1&Amount=金額
&Installment= 0&TransCode=00&Buyer_Name= 消費者名稱 &Buyer_Mail= 消費者信箱 &Buyer_Telm= 消費者電話
&Buyer_Memo= 商品資訊 &Return_url= 回傳網址

一般綁定卡片 ，使用系統預設付款頁面 (綁定付款資訊 )並帶回傳網址 ：
```
https://n.gomypay.asia/ShuntClass.aspx?Send_Type=0&Pay_Mode_No=2&CustomerId=80013554&Order_No= 自訂
```
交易單號 (例:2018001 )&Return_url= 回傳網址 &BindCard=1

一般綁定卡片交易完成後， 交易成功畫面網址上會帶上已綁定的 Token
https://n.gomypay.asia/UpdatePayment.aspx ?
Send_Type=2A25A845ABAA3A0B
&result=486EAE7DA2475FF0&OrderID=3EC0D7461C9FBE7FFB1E7EC43653CBECF0CA3F92DD78CFE2
&ret_msg=5o6I5qyK5Lqk5piT5oiQ5YqfLTAw
&AvCode=1AB48A6450522219
&Invoice_No=3DB7EB767BCE2910
&CardToken=68e92e49 -5c5d -4460 -9655 -5e68b6dc6889

一般交易綁定過卡片後傳入參數，請在網址後帶 Token
(有卡片 Token就能不需要帶 CardNo & ExpireDate )：
https://n.gomypay.asia/ShuntClass.aspx ?
Send_Type=0
&Pay_Mode_No=2
&CustomerId=24955602A01
&Order_No=Test20250123000001
&Amount=100
&TransCode=00
&Buyer_Name=%E6%B8%AC%E8%A9%A6%E4%B8%B2%E6%8E%A5%E7%94%A8
&Buyer_Telm=0912345678
&Buyer_Mail=123@gmail.com
&Buyer_Memo=%E6%B8%AC%E8%A9%A6%E4%B8%B2%E6%8E%A5
&TransMode=1
&Installment=0
&CardToken=cb8f2707 -80ee -4ebc -ad48 -832a93be84eb

帶Token參數頁面示意圖：

分期交易，自行架構網站之購物車之 交易範例：
```
https://n.gomypay.asia/ShuntClass.aspx?Send_Type=0&Pay_Mode_No=2&CustomerId=80013554&Order_No
```
=自訂交易單號 &CardNo =卡號 &ExpireDate= 到期日 &CVV=認證碼 &TransMode= 2&Amount=金額 &Installment=
期數 &TransCode=00&Buyer_Name= 消費者名稱 &Buyer_Mail= 消費者信箱 &Buyer_Telm= 消費者電話
&Buyer_Memo= 商品資訊
分期交易，自行架構網站之購物車 並帶回傳網址 ：
```
https://n.gomypay.asia/ShuntClass.aspx?Send_Type=0&Pay_Mode_No=2&CustomerId=80013554&Order_No
```
=自訂交易單號 &CardNo =卡號 &ExpireDate= 到期日 &CVV=認證碼 &TransMode= 2&Amount=金額 &Installment=
期數 &TransCode=00&Buyer_Name= 消費者名稱 &Buyer_Mail= 消費者信箱 &Buyer_Telm= 消費者電話
&Buyer_Memo= 商品資訊 &Return_url= 回傳網址
※使用分期交易的店家， 消費者之信用卡必須為 Gomypay合作之銀行才可進行分期。
### 4. 交易回傳訊息
交易訊息傳至 ReturnUrl將以 Get方式回傳以下資料
| 回傳參數 | 字串長度 | 說明 |
| :--- | :--- | :--- |
| Send_Type | 長度 (1) | 固定為 0 |
| result | 長度 (1) | 回傳結果 (0失敗  1成功 ) |
| ret_msg | 長度 (100) |  回傳訊息 |
| OrderID | 長度 (19) | 系統訂單編號 |
| e_orderno | 長度 (25) | 自訂訂單編號 |
| AvCode | 長度 (10) | 授權碼 |
| str_check | 長度 (32) | MD5 32 位元編碼，編碼前字串為：＂ 交易結果 result＂字串加＂自訂訂單 編號 e_orderno＂字串加＂明碼商店代號 (非加密後 32碼商店代 號)CustomerId＂字串加＂交易金額   Amount＂字串加＂系統訂單編號 OrderID＂字串加＂客戶資料中的交易驗證密碼  Str_Check＂字串， MD5編 碼後回傳過去，如果檢查不符合，請利用查詢功能或登入客戶後臺管理系統 確認資料是否有問題。 |
※ CustomerId 請用 (法人 )統編  or (自然人 )身分證
舉例 :

交易訊息使用 Json回傳將以 Json格式回傳以下資料  交易結果：成功、自訂訂單編號： 2020050701 、商店代號： 80013554、交
易金額： 50、系統訂單編號：  2020050700000000001 、交易驗證密碼：
2b1bef9d8ab6a81e9a2739c6ecc64ef8

此參數請帶： 1+2020050701 +80013554 +50+2020050700000000001 +
2b1bef9d8ab6a81e9a2739c6ecc64ef8 之MD5編碼
| Invoice_No | 長度 (10) | 訂單開立發票號碼 (需與本公司申請發票自動開立功能 ) |
| CardLastNum | 長度 (4) | 信用卡號後四碼 回傳參數  字串長度  說明 |
| Send_Type | 長度 (1) | 固定為 0 |
| result | 長度 (1) | 回傳結果 (0失敗  1成功 ) |
| ret_msg | 長度 (100) |  回傳訊息 |
| OrderID | 長度 (19) | 系統訂單編號 |
| e_Cur | 長度 (2) | 幣別 |
| e_money | 最大長度 (10) | 交易金額 |
| e_date | 長度 (8) | 交易日期 (yyyymmdd ) |
| e_time | 長度 (8) | 交易時間 (HH:mm:ss ) |
| e_orderno | 最大長度 (25) | 自訂訂單編號 |
| e_no | 最大長度 (11) | 商店代號 (等同於  CustomerId  ) |
| e_outlay | 最大長度 (10) | 交易總手續費 |
| avcode | 最大長度 (10) | 授權碼 str_check |

長度 (32) MD5 32 位元編碼，編碼前字串為：＂ 交易結果 result＂字串加＂自訂訂單
編號 e_orderno＂字串加＂明碼商店代號 (非加密後 32碼商店代
號)CustomerId ＂字串加＂交易金額   Amount＂字串加＂系統訂單編號
OrderID＂字串加＂客戶資料中的交易驗證密碼  Str_Check＂字串， MD5編
碼後回傳過去，如果檢查不符合，請利用查詢功能或登入客戶後臺管理系統
確認資料是否有問題。
※ CustomerId 請用 (法人 )統編  or (自然人 )身分證
舉例 :
交易結果：成功、自訂訂單編號： 2020050701 、商店代號： 80013554、交
易金額： 50、系統訂單編號：  2020050700000000001 、交易驗證密碼：
2b1bef9d8ab6a81e9a2739c6ecc64ef8
此參數請帶： 1+2020050701 +80013554 +50+2020050700000000001 +

2b1bef9d8ab6a81e9a2739c6ecc64ef8 之MD5編碼
| Invoice_No | 長度 (10) | 訂單開立發票號碼 (需與本公司申請發票自動開立功能 ) |
| CardLastNum | 長度 (4) | 信用卡號後四碼 |

### 5. 背景對帳訊息
對帳功能將消費者繳費日起算， 三日內的成功訂單，發送對帳訊息 (以POST回傳 )至客戶填寫的 Callback_Url ，若
有打通 (http code 200) ，我司將不再回傳結果，若沒打通將每 5分鐘重複發送對帳訊息，若打 10次都無 (http
code 200)結果，我司將不再回傳結果
本對帳訊息發送至： Callback_Url
| 回傳參數 | 字串長度 | 說明 |
| :--- | :--- | :--- |
| Send_Type | 長度 (1) | 固定為 0 |
| result | 長度 (1) | 回傳結果 (0失敗  1成功 ) |
| ret_msg | 最大長度 (100) | 回傳訊息 |
| OrderID | 長度 (19) | 系統訂單編號 |
| e_Cur | 長度 (2) | 幣別 |
| e_money | 最大長度 (10) | 交易金額 |
| e_date | 長度 (8) | 交易日期 (yyyymmdd ) |
| e_time | 長度 (8) | 交易時間 (HH:mm:ss ) |
| e_orderno | 最大長度 (25) | 自訂訂單編號 |
| e_no | 最大長度 (11) | 商店代號 |
| e_outlay | 最大長度 (10) | 交易總手續費 |
| avcode | 最大長度 (10) | 授權碼 str_check |

長度 (32) MD5 32 位元編碼，編碼前字串為：＂ 交易結果 result＂字串加＂自訂訂
單編號 e_orderno＂字串加＂明碼商店代號 (非加密後 32碼商店代
號)CustomerId ＂字串加＂交易金額   Amount＂字串加＂系統訂單編號
OrderID＂字串加＂客戶資料中的交易驗證密碼  Str_Check＂字串， MD5
編碼後回傳過去，如果檢查不符合，請利用查詢功能或登入客戶後臺管理
系統確認資料是否有問題。
※ CustomerId 請用 (法人 )統編  or (自然人 )身分證
舉例 :
交易結果：成功、自訂訂單編號： 2020050701 、商店代號： 80013554、
交易金額： 50、系統訂單編號：  2020050700000000001 、交易驗證密
碼： 2b1bef9d8ab6a81e9a2739c6ecc64ef8
此參數請帶：
1+2020050701 +80013554 +50+2020050700000000001 +
2b1bef9d8ab6a81e9a2739c6ecc64ef8 之MD5編碼
| Invoice_No | 長度 (10) | 訂單開立發票號碼 (需與本公司申請發票自動開立功能 ) |
| CardLastNum | 長度 (4) | 信用卡號後四碼 |

一、銀聯卡串接
### 1. 交易遞交網址：
正式網址： https://n.gomypay.asia/ShuntClass.aspx
測試網址： https://n.gomypay.asia/TestShuntClass.aspx
### 2. 交易遞交參數說明：
| 回傳參數 | 字串長度 | 說明 |
| :--- | :--- | :--- |
填 說明
| Send_Type | 長度 (1) | 是 | 傳送型態請填 1 (0.信用卡  1.銀聯卡  2.超商條碼  3.WebAtm 4.虛擬帳號  5.定期扣款  6.超商代碼 7.LinePay ) |
| Pay_Mode_No | 長度 (1) | 是 | 付款模式請填 2 |
| CustomerId | 最大長度 (20) | 是 | 商店代號 法人：統編或加密之商店代號 32碼 自然人：身分證或加密之 商店代號 32碼 |
| Order_No | 最大長度 (25) | 是 | 交易單號，如無則自動帶入系統預設交易單號 |
| Amount | 最大長度 (10) | 是 | 交易金額 |
| TransCode | 長度 (2) | 是 | 交易類別請填 00(授權 ) |
| Buyer_Name | 最大長度 (20) | 是 | 消費者姓名， 不可含特殊符號及數字 ，如無將自動轉入系統 預設付款頁面 |
| Buyer_Telm | 最大長度 (20) | 是 | 消費者手機 (數字，不可全形 ) ，如無將自動轉入系統預設付 款頁面 |
| Buyer_Mail | 最大長度 (50) | 是 | 消費者 Email(不可全形 ) ，如無將自動轉入系統預設付款頁 面 |
| Buyer_Memo | 最大長度 (500) | 是 | 消費備註 (交易內容 ) ，如無將自動轉入系統預設付款頁面 Return_ url 最大長度 (100)  授權結果回傳網址：如無則自動轉入系統預設 授權頁面 |
註:如果是實名制 OTP店家，若要接回傳值，請填入接收網
址
| Callback_Url | 最大長度 (500) | 背景對帳網址 ，如未填寫默認不進行背景對帳 |

※註：只要 Buyer_Name 、Buyer_Telm、、 Buyer_Mail、Buyer_Memo ，有任何一個參數為空白，系統將自動導入系
統預設交易畫面
### 3. 交易遞交範例：
使用系統預設付款頁面 未帶回傳網址 ：

```
https://n.gomypay.asia/ShuntClass.aspx?Send_Type=1&Pay_Mode_No=2&CustomerId=80013554&
```
Order_No=自訂交易單號 (例:2018001 )
※未設定 Return_ url，故系統會以內定網頁顯示授權結果
使用系統預設付款頁面 並帶回傳網址 ：
```
https://n.gomypay.asia/ShuntClass.aspx?Send_Type=1&Pay_Mode_No=2&CustomerId=80013554&
```
Order_No=自訂交易單號 (例:2018001 )&Return_url= 回傳網址
※使用系統預設交易的店家，抬頭將為店家名稱 +”交易 -訂單編號 :”+自訂交易編號 (如下圖 )
若未設定回傳網址， 繳費成功將顯示 系統預設畫面，訂單編號為店家自訂之訂單編號。
自行架構網站之購物車之 交易範例：
```
https://n.gomypay.asia/ShuntClass.aspx?Send_Type= 1&Pay_Mode_No=2&CustomerId=80013554&
```
Order_No=自訂交易單號 &Amount=金額 &TransCode=00&Buyer_Name= 消費者名稱 &Buyer_Mail= 消
費者信箱 &Buyer_Telm= 消費者電話 &Buyer_Memo= 商品資訊
自行架構網站之購物車 並帶回傳網址 ：
```
https://n.gomypay.asia/ShuntClass.aspx?Send_Type= 1&Pay_Mode_No=2&CustomerId=80013554&
```
Order_No=自訂交易單號 &Amount=金額 &TransCode=00&Buyer_Name= 消費者名稱 &Buyer_Mail= 消
費者信箱 &Buyer_Telm= 消費者電話 &Buyer_Memo= 商品資訊 &Return_url= 回傳網址

### 4. 交易回傳訊息 (只有成功才會進行回傳 )
交易訊息傳至 ReturnUrl將以GET方式回傳以下資料
### 5. 背景對帳訊息
對帳功能將消費者繳費日起算， 三日內的成功訂單，發送對帳訊息 (以POST回傳 )至客戶填寫的
Callback_Url ，若有打通 (http code 200) ，我司將不再回傳結果，若沒打通將每 5分鐘重複發送對帳訊息，
若打 10次都無 (http code 200) 結果，我司將不再回傳結果
| 回傳參數 | 字串長度 | 說明 |
| :--- | :--- | :--- |
| Send_Type | 長度 (1) | 固定為 1 |
| result | 長度 (1) | 回傳結果 (0失敗  1成功 )※目前銀行端只有交易成功才會回傳訊息 |
| ret_msg | 最大長度 (100) | 回傳訊息 |
| OrderID | 長度 (19) | 系統訂單編號 |
| e_orderno | 最大長度 (25) | 自訂訂單編號 |
| str_check | 長度 (32) | MD5 32 位元編碼，編碼前字串為：＂ 交易結果 result＂字串加＂自訂訂 單編號 e_orderno＂字串加＂明碼商店代號 (非加密後 32碼商店代 號)CustomerId ＂字串加＂交易金額   Amount＂字串加＂系統訂單編號 OrderID＂字串加＂客戶資料中的交易驗證密碼  Str_Check＂字串， MD5 編碼後回傳過去，如果檢查不符合，請利用查詢功能或登入客戶後臺管理 系統確認資料是否有問題。 |
※ CustomerId 請用 (法人 )統編  or (自然人 )身分證
舉例 :
交易結果：成功、自訂訂單編號： 2020050701 、商店代號： 80013554、
交易金額： 50、系統訂單編號：  2020050700000000001 、交易驗證密
碼： 2b1bef9d8ab6a81e9a2739c6ecc64ef8
此參數請帶：
1+2020050701 +80013554 +50+2020050700000000001 +
2b1bef9d8ab6a81e9a2739c6ecc64ef8 之MD5編碼
| 回傳參數 | 字串長度 | 說明 |
| :--- | :--- | :--- |
| Send_Type | 長度 (1) | 固定為 1 |
| result | 長度 (1) | 回傳結果 (0失敗  1成功 ) |
| ret_msg | 最大長度 (100) | 回傳訊息 |
| OrderID | 長度 (19) | 系統訂單編號 |
| e_Cur | 長度 (2) | 幣別 |
| e_money | 最大長度 (10) | 交易金額 |
| e_date | 長度 (8) | 交易日期 (yyyymmdd ) |

| e_time | 長度 (8) | 交易時間 (HH:mm:ss ) |
| e_orderno | 最大長度 (25) | 自訂訂單編號 |
| e_no | 最大長度 (11) | 商店代號 |
| e_outlay | 最大長度 (10) | 交易總手續費 str_check |

長度 (32) MD5 32 位元編碼，編碼前字串為：＂ 交易結果 result＂字串加＂自訂訂
單編號 e_orderno＂字串加＂明碼商店代號 (非加密後 32碼商店代
號)CustomerId ＂字串加＂交易金額   Amount＂字串加＂系統訂單編號
OrderID＂字串加＂客戶資料中的交易驗證密碼  Str_Check＂字串， MD5
編碼後回傳過去，如果檢查不符合，請利用查詢功能或登入客戶後臺管理
系統確認資料是否有問題。
※ CustomerId 請用 (法人 )統編  or (自然人 )身分證
舉例 :
交易結果：成功、自訂訂單編號： 2020050701 、商店代號： 80013554、
交易金額： 50、系統訂單編號：  2020050700000000001 、交易驗證密
碼： 2b1bef9d8ab6a81e9a2739c6ecc64ef8
此參數請帶：
1+2020050701 +80013554 +50+2020050700000000001 +
2b1bef9d8ab6a81e9a2739c6ecc64ef8 之MD5編碼

二、超商條碼串接
### 1. 交易遞交網址：
正式網址： https://n.gomypay.asia/ShuntClass.aspx
測試網址： https://n.gomypay.asia/TestShuntClass.aspx
### 2. 交易遞交參數說明：
| 回傳參數 | 字串長度 | 說明 |
| :--- | :--- | :--- |
填 說明
| Send_Type | 長度 (1) | 是 | 傳送型態請填 2 (0.信用卡  1.銀聯卡  2.超商條碼  3.WebAtm 4.虛擬帳號  5.定期扣款  6.超商代碼  7.LinePay ) |
| Pay_Mode_No | 長度 (1) | 是 | 付款模式請填 2 |
| CustomerId | 最大長度 (20) | 是 | 商店代號 法人：統編或加密之商店代號 32碼 自然人：身分證或加密之 商店代號 32碼 |
| Order_No | 最大長度 (25) | 是 | 交易單號，如無則自動帶入系統預設交易單號 |
| Amount | 最大長度 (10) | 是 | 交易金額 (最低金額 50元，不可超過 6萬元 ) |
| Buyer_Name | 最大長度 (20) | 是 | 消費者姓名，不可含特殊符號及數字 |
| Buyer_Telm | 最大長度 (20) | 是 | 消費者手機 (數字，不可全形 ) |
| Buyer_Mail | 最大長度 (50) | 是 | 消費者 Email(不可全形 ) |
| Buyer_Memo | 最大長度 (500) | 是 | 消費備註 (交易內容 ) Return_ url 最大長度 (100)  繳費資訊回傳網址：如無則自動轉入系統預設 繳費顯示頁面 |
註1:如果要用 JSON回傳請勿帶此參數
註2:如果是實名制 OTP店家，若要接回傳值，請填入接收
網址
| Callback_Url | 最大長度 (500) | 背景對帳網址，如未填寫默認不進行背景對帳 |
| e_return | 長度 (1) | 使用 json回傳繳費資訊 ，請填 1 |
註1:如果要用預設交易頁面請勿帶此參數
註2:如果是實名制 OTP店家，無法使用 json接收回傳值，
故無需填入
| Str_Check | 長度 (32) | 交易驗證密碼，如果檢查不符合無法交易 (使用 Json回傳才 為必填欄位 ) |
※註 1：繳費期限為今日
※註 2：若需要回傳繳費資訊，「 Return_ url」和「e_return」兩個欄位請擇一選擇要回傳的方式，若兩個欄位同時填
入將優先使用 Json回傳。

### 3. 交易遞交範例：
使用 Json回傳 -遞交網址：http s://n.gomypay.asia/ShuntClass.aspx
交易可以 POST表單或以 Curl遞交
```html
<META http -equiv='Content -Type' content='text/html;charset=utf -8'>
<FORM action="  http s://n.gomypay.asia/ShuntClass.aspx " method="post">
<input name=' Send_Type '  value=' 2'>
<input name=' Pay_Mode_No '  value=' 2'>
<input name=' CustomerId '  value='商店代號 '>
<input name=' Order_No '  value='交易單號 '>
<input name=' Amount ' value=' 50'>
<input name=' Buyer_Name '  value='消費者姓名 '>
<input name=' Buyer_Telm '  value='消費者電話 '>
<input name=' Buyer_Mail '  value='消費者 email '>
<input name=' Buyer_Memo '  value='商品資訊 '>
<input name=' e_return '  value=' 1'>
<input name=' Str_Check '  value='交易驗證密碼 '>
<input name="button1" type="submit" class="sub_buttom" id="button1" value=" 訂單建立 (請勿重複
點選 )" >
</form>
```
交易結果回傳範例：
```json
{"Send_Type":"2","result":"1","ret_msg":" 取號成功
","OrderID":"2020070100000001880","e_orderno":"2020070100000001880","e_payac
count":"0055600701508830","LimitDate":"20200701","code1":"0907016R5","code2":
"0055600701508830","code3":"090752000000050","str_check":" 510f7961cf88e2025
0e2cfa04e15318b"}
```

自行架構網站之購物車之 交易範例未帶回傳網址 ：
```
https://n.gomypay.asia/ShuntClass.aspx?Send_Type=2&Pay_Mode_No=2&CustomerId=80013554&
```
Order_No=自訂交易單號 (例:2018001 )&Amount =50& Buyer_Name= 消費者姓名
&Buyer_Telm=0912345678&Buyer_Mail= 信箱 &Buyer_Memo= 消費者備註
※未設定 Return_ url或e_return，故系統會以內定網頁顯示 訂單結果
自行架構網站之購物車之 交易範例並帶回傳、對帳網址：
```
https://n.gomypay.asia/ShuntClass.aspx?Send_Type=2&Pay_Mode_No=2&CustomerId=80013554&
```
Order_No=自訂交易單號 (例:2018001 )&Amount =50& Buyer_Name= 消費者姓名
&Buyer_Telm=0912345678& Buyer_Mail= 信箱 &Buyer_Memo= 消費者備註 &Return_ url=回傳網址 &
Callback_Url= 對帳網址
### 4. 交易回傳訊息
交易訊息傳至 ReturnUrl (以GET方式 )或使用 e_return(以JSON格式 )回傳以下資料
| 回傳參數 | 字串長度 | 說明 |
| :--- | :--- | :--- |
| Send_Type | 長度 (1) | 固定為 2 |
| result | 長度 (1) | 回傳結果 (0失敗  1成功 ) |
| ret_msg | 長度 (100) | 回傳訊息 (取號成功  OR 取號失敗 ) |
| OrderID | 長度 (19) | 系統編號 |
| e_orderno | 長度 (25) | 客戶自訂訂單編號 |
| e_payaccount | 長度 (16) | 繳費帳號 |
| LimitDate | 長度 (8) | 繳費期限 (yyyyMMdd ) |
| code1 | 長度 (9) | 超商繳費條碼第一段。 |
| code2 | 長度 (16) | 超商繳費條碼第二段。 |
| code3 | 長度 (15) | 超商繳費條碼第三段。 str_check |

長度 (32) MD5 32 位元編碼，編碼前字串為：＂ 回傳結果 result＂字串加＂自訂訂
單編號 e_orderno＂字串加＂明碼商店代號 (非加密後 32碼商店代
號)CustomerId ＂字串加＂交易金額   Amount＂字串加＂系統訂單編號
OrderID＂字串加＂客戶資料中的交易驗證密碼  Str_Check＂字串， MD5
編碼後回傳過去，如果檢查不符合，請利用查詢功能或登入客戶後臺管理

系統確認資料是否有問題。
※ CustomerId 請用 (法人 )統編  or (自然人 )身分證
舉例 :
交易結果：成功、自訂訂單編號： 2020050701 、商店代號：
80013554、交易金額： 50、系統訂單編號：  2020050700000000001 、
交易驗證密碼： 2b1bef9d8ab6a81e9a2739c6ecc64ef8
此參數請帶：
1+2020050701 +80013554 +50+2020050700000000001 +
2b1bef9d8ab6a81e9a2739c6ecc64ef8 之MD5編碼
※使用超商條碼繳費，可視情況建立三段條碼顯示，需符合超商繳費條碼規格 (39code)，系統將有額外 email通
知至 BuyerEmail (含繳費條碼 )。

### 5. 背景對帳訊息
對帳功能將消費者繳費日起算， 三日內的成功訂單，發送對帳訊息 (以POST回傳 )至客戶填寫的
Callback_Url ，若有打通 (http code 200) ，我司將不再回傳結果，若沒打通將每 5分鐘重複發送對帳訊息，
若打 10次都無 (http code 200) 結果，我司將不再回傳結果
本對帳訊息發送至： Callback_Url
| 回傳參數 | 字串長度 | 說明 |
| :--- | :--- | :--- |
| Send_Type | 長度 (1) | 固定為 2 |
| result | 長度 (1) | 回傳結果 (0失敗  1成功 ) |
| ret_msg | 最大長度 (100) | 回傳訊息 |
| OrderID | 長度 (19) | 系統訂單編號 |
| e_money | 最大長度 (10) | 交易金額 |
| PayAmount | 最大長度 (10) | 實際繳費金額 |
| e_date | 長度 (8) | 交易日期 (yyyymmdd ) |
| e_time | 長度 (8) | 交易時間 (HH:mm:ss ) |
| e_orderno | 最大長度 (25) | 自訂訂單編號 |
| e_payaccount | 長度 (16) | 繳費帳號 str_check |

長度 (32) MD5 32 位元編碼，編碼前字串為：＂ 交易結果 result＂字串加＂自訂訂
單編號 e_orderno＂字串加＂明碼商店代號 (非加密後 32碼商店代
號)CustomerId ＂字串加＂實際繳費金額 PayAmount ＂字串加＂系統訂單
編號 OrderID＂字串加＂客戶資料中的交易驗證密碼  Str_Check＂字串，
MD5編碼後回傳過去，如果檢查不符合，請利用查詢功能或登入客戶後臺
管理系統確認資料是否有問題。
※ CustomerId 請用 (法人 )統編  or (自然人 )身分證

三、虛擬帳號串接
### 1. 交易遞交網址：
正式網址： https://n.gomypay.asia/ShuntClass.aspx
測試網址： https://n.gomypay.asia/TestShuntClass.aspx
### 2. 交易遞交參數說明：
| 回傳參數 | 字串長度 | 說明 |
| :--- | :--- | :--- |
填 說明
| Send_Type | 長度 (1) | 是 | 傳送型態請填 4 (0.信用卡  1.銀聯卡  2.超商條碼  3.WebAtm 4.虛擬帳號  5.定期扣款  6.超商代碼  7.LinePay ) |
| Pay_Mode_No | 長度 (1) | 是 | 付款模式請填 2 |
| CustomerId | 最大長度 (20) | 是 | 商店代號 法人：統編或加密之商店代號 32碼 自然人：身分證或加密之 商店代號 32碼 |
| Order_No | 最大長度 (25) | 是 | 交易單號，如無則自動帶入系統預設交易單號 |
| Amount | 最大長度 (10) | 是 | 交易金額 (最低金額 50元，不可超過 6萬元 ) |
| Buyer_Name | 最大長度 (20) | 是 | 消費者姓名，不可含特殊符號及數字 |
| Buyer_Telm | 最大長度 (20) | 是 | 消費者手機 (數字，不可全形 ) |
| Buyer_Mail | 最大長度 (50) | 是 | 消費者 Email(不可全形 ) |
| Buyer_Memo | 最大長度 (500) | 是 | 消費備註 (交易內容 ) Return_ url 最大長度 (100)  繳費資訊回傳網址：如無則自動轉入系統預設 訂單結果頁面 |
註1:如果要用 JSON回傳請勿帶此參數
註2:如果是實名制 OTP店家，若要接回傳值，請填入接收
網址
| Callback_Url | 最大長度 (500) | 背景對帳網址 ，如未填寫默認不進行背景對帳 |
| e_return | 長度 (1) | 使用 json回傳繳費資訊 ，請填 1 |
註1:如果要用預設交易頁面請勿帶此參數
註2:如果是實名制 OTP店家，無法使用 json接收回傳值，舉例 :
交易結果：成功、自訂訂單編號： 2020050701 、商店代號： 80013554、
交易金額： 50、系統訂單編號：  2020050700000000001 、交易驗證密
碼： 2b1bef9d8ab6a81e9a2739c6ecc64ef8
此參數請帶：
1+2020050701 +80013554 +50+2020050700000000001 +
2b1bef9d8ab6a81e9a2739c6ecc64ef8 之MD5編碼

故無需填入
| Str_Check | 長度 (32) | 交易驗證密碼，如果檢查不符合無法交易 (使用 Json回傳才 為必填欄位 ) |

※註 1：繳費期限為今日
※註 2：若需要回傳繳費資訊， 「 Return_url」和「 e_return」兩個欄位請擇一 選擇要回傳的方式，若兩個欄位同時填入
將優先使用 Json回傳。

### 3. 交易遞交範例：
使用 Json回傳 -遞交網址：http s://n.gomypay.asia/ShuntClass.aspx
交易可以 POST表單或以 Curl遞交
```html
<META http -equiv='Content -Type' content='text/html;charset=utf -8'>
<FORM action="  http s://n.gomypay.asia/ShuntClass.aspx " method="post">
<input name=' Send_Type '  value=' 4'>
<input name=' Pay_Mode_No '  value=' 2'>
<input name=' CustomerId '  value='商店代號 '>
<input name=' Order_No '  value='交易單號 '>
<input name=' Amount ' value=' 50'>
<input name=' Buyer_Name '  value='消費者姓名 '>
<input name=' Buyer_Telm '  value='消費者電話 '>
<input name=' Buyer_Mail '  value='消費者 email '>
<input name=' Buyer_Memo '  value='商品資訊 '>
<input name=' e_return '  value=' 1'>
<input name=' Str_Check '  value='交易驗證密碼 '>
<input name="button1" type="submit" class="sub_buttom" id="button1" value=" 訂單建立 (請勿重複
點選 )" >
</form>
```
交易結果回傳範例：
```json
{"Send_Type":"4","result":"1","OrderID":"2020070100000001916","e_orderno":"20200
70100000001916","e_payaccount":"013 - 國泰世華  -
0055600701508856","LimitDate":"20200701","ret_msg":" 取號成功
","str_check":"7c310ed7963bd40c4d0946eb7aa05716"}
```
自行架構網站之購物車之 交易範例未帶回傳網址 ：

```
https://n.gomypay.asia/ShuntClass.aspx?Send_Type=4&Pay_Mode_No=2&CustomerId=80013554&
```
Order_No=自訂交易單號 (例:2018001 )&Amount =50& Buyer_Name= 消費者姓名
&Buyer_Telm=0912345678&Buyer_Mail= 信箱 &Buyer_Memo= 消費者備註
※未設定 Return_ url或e_return，故系統會以內定網頁顯示 訂單結果
自行架構網站之購物車之 交易範例並帶回傳、對帳網址 ：
```
https://n.gomypay.asia/ShuntClass.aspx?Send_Type=4&Pay_Mode_No=2&CustomerId=80013554&
```
Order_No=自訂交易單號 (例:2018001 )&Amount =50& Buyer_Name= 消費者姓名
&Buyer_Telm=0912345678& Buyer_Mail= 信箱 &Buyer_Memo= 消費者備註 &Return_ url=回傳網址 &
Callback_Url= 對帳網址
### 4. 交易回傳訊息
交易訊息傳至 ReturnUrl(以GET方式 )或使用 e_return(以JSON格式 )回傳以下資料
| 回傳參數 | 字串長度 | 說明 |
| :--- | :--- | :--- |
| Send_Type | 長度 (1) | 固定為 4 |
| result | 長度 (1) | 回傳結果 (0失敗  1成功 ) |
| ret_msg | 長度 (100) | 回傳訊息 (取號成功  OR 取號失敗 ) |
| OrderID | 長度 (19) | 系統編號 |
| e_orderno | 長度 (25) | 客戶自訂訂單編號 |
| e_payaccount | 長度 (32) | 繳費帳號 (含銀行代號、名稱，例 : 013 -國泰世華 -0055600701508856 ) |
| LimitDate | 長度 (8) | 繳費期限 (yyyyMMdd ) str_check |

長度 (32) MD5 32 位元編碼，編碼前字串為：＂ 交易結果 result＂字串加＂自訂訂
單編號 e_orderno＂字串加＂明碼商店代號 (非加密後 32碼商店代
號)CustomerId ＂字串加＂交易金額   Amount＂字串加＂系統訂單編號
OrderID＂字串加＂客戶資料中的交易驗證密碼  Str_Check＂字串， MD5
編碼後回傳過去，如果檢查不符合，請利用查詢功能或登入客戶後臺管理系
統確認資料是否有問題。
※ CustomerId 請用 (法人 )統編  or (自然人 )身分證
舉例 :
交易結果：成功、自訂訂單編號： 2020050701 、商店代號： 80013554、

交易金額： 50、系統訂單編號：  2020050700000000001 、交易驗證密
碼： 2b1bef9d8ab6a81e9a2739c6ecc64ef8
此參數請帶： 1+2020050701 +80013554 +50+2020050700000000001 +
2b1bef9d8ab6a81e9a2739c6ecc64ef8 之MD5編碼

### 5. 背景對帳訊息
對帳功能將消費者繳費日起算， 三日內的成功訂單，發送對帳訊息 (以POST回傳 )至客戶填寫的
Callback_Url ，若有打通 (http code 200) ，我司將不再回傳結果，若沒打通將每 5分鐘重複發送對帳訊息，
若打 10次都無 (http code 200) 結果，我司將不再回傳結果
本對帳訊息發送至： Callback_Url
| 回傳參數 | 字串長度 | 說明 |
| :--- | :--- | :--- |
| Send_Type | 長度 (1) | 固定為 4 |
| result | 長度 (1) | 回傳結果 (0失敗  1成功 ) |
| ret_msg | 最大長度 (100) | 回傳訊息 |
| OrderID | 長度 (19) | 系統訂單編號 |
| e_money | 最大長度 (10) | 交易金額 |
| PayAmount | 最大長度 (10) | 實際繳費金額 |
| e_date | 長度 (8) | 交易日期 (yyyyMMdd ) |
| e_time | 長度 (8) | 交易時間 (HH:mm:ss ) |
| e_orderno | 最大長度 (25) | 自訂訂單編號 |
| e_payaccount | 長度 (16) | 繳費帳號 (未含銀行代號、名稱，例 : 0055600701508856 ) |
| e_PayInfo | 長度 (9) | 帳號繳費資訊 (銀行代號三碼 +,+繳費帳號後五碼 ) str_check |

長度 (32) MD5 32 位元編碼，編碼前字串為：＂ 交易結果 result＂字串加＂自
訂訂單編號 e_orderno＂字串加＂明碼商店代號 (非加密後 32碼商店
代號 )CustomerId ＂字串加＂實際繳費金額 PayAmount ＂字串加＂系
統訂單編號 OrderID＂字串加＂客戶資料中的交易驗證密碼
Str_Check＂字串， MD5編碼後回傳過去，如果檢查不符合，請利用
查詢功能或登入客戶後臺管理系統確認資料是否有問題。
※ CustomerId 請用 (法人 )統編  or (自然人 )身分證
舉例 :
交易結果：成功、自訂訂單編號： 2020050701 、商店代號：
80013554、實際繳費金額： 50、系統訂單編號：
2020050700000000001 、交易驗證密碼：
2b1bef9d8ab6a81e9a2739c6ecc64ef8
此參數請帶：
1+2020050701 +80013554 +50+2020050700000000001 +
2b1bef9d8ab6a81e9a2739c6ecc64ef8 之MD5編碼

## 四、 WEBATM串接
### 1. 交易遞交網址：
正式網址： https://n.gomypay.asia/ShuntClass.aspx
測試網址： https://n.gomypay.asia/TestShuntClass.aspx
### 2. 交易遞交參數說明：
| 傳送參數 | 字串長度 | 必填 | 說明 |
| :--- | :--- | :--- | :--- |
| Send_Type | 長度 (1) | 是 | 傳送型態請填 3 (0.信用卡  1.銀聯卡  2.超商條碼  3.WebAtm 4.虛擬帳號  5.定期扣款  6.超商代碼 7.LinePay ) |
| Pay_Mode_No | 長度 (1) | 是 | 付款模式請填 2 |
| CustomerId | 最大長度 (20) | 是 | 商店代號 法人：統編或加密之商店代號 32碼 自然人：身分證或加密之 商店代號 32碼 |
| Order_No | 最大長度 (25) | 是 | 交易單號，如無則自動帶入系統預設交易單號 |
| Amount | 最大長度 (10) | 是 | 交易金額 (最低金額 50元，不可超過 6萬元 ) |
| Buyer_Name | 最大長度 (20) | 是 | 消費者姓名，不可含特殊符號及數字 |
| Buyer_Telm | 最大長度 (20) | 是 | 消費者手機 (數字，不可全形 ) |
| Buyer_Mail | 最大長度 (50) | 是 | 消費者 Email(不可全形 ) |
| Buyer_Memo | 最大長度 (500) | 是 | 消費備註 (交易內容 ) Return_ url 最大長度 (100)  交易回傳網址：如無則自動轉入系統預設訂單結果頁面 |
※此為測試環境才會用到，正式環境請帶 Callback_Url
| Callback_Url | 最大長度 (500) | 背景對帳網址 ，如未填寫默認不進行背景對帳 備註：繳費期限為今日 ### 3. 交易遞交範例： 自行架構網站之購物車之 交易範例未帶回傳網址 ： ``` https://n.gomypay.asia/ShuntClass.aspx?Send_Type=3&Pay_Mode_No=2&CustomerId=80013554& ``` Order_No=自訂交易單號 (例:2018001 )&Amount =50& Buyer_Name= 消費者姓名 &Buyer_Telm=0912345678&Buyer_Mail= 信箱 &Buyer_Memo= 消費者備註 |
※WebAtm交易將以銀行預設 網頁顯示訂單結果，由於未帶對帳網址 ，固請至系統查詢交易
自行架構網站之購物車之 交易範例並帶對帳網址 ：

```
https://n.gomypay.asia/ShuntClass.aspx?Send_Type=3&Pay_Mode_No=2&CustomerId=80013554&
```
Order_No=自訂交易單號 (例:2018001 )&Amount =50& Buyer_Name= 消費者姓名
&Buyer_Telm=0912345678& Buyer_Mail= 信箱 &Buyer_Memo= 消費者備註 &Callback_Url= 對帳網址
### 4. 交易回傳訊息 (此為測試環境使用 )
交易訊息傳至 ReturnUrl以GET方式回傳以下資料
| 回傳參數 | 字串長度 | 說明 |
| :--- | :--- | :--- |
| Send_Type | 長度 (1) | 固定為 3 |
| OrderID | 最大長度 (19) | 系統編號 |
| e_orderno | 最大長度 (25) | 客戶自訂訂單編號 |
| e_payaccount | 最大長度 (16) | 繳費帳號 |
| result | 長度 (1) | 回傳結果 (0失敗  1成功 ) |
| ret_msg | 最大長度 (100) | 回傳訊息 |
※測試環境若使用 WebAtm繳費，如有使用交易回傳 (ReturnUrl )，將會傳送交易結果至 ReturnUrl
※正式環境必須帶 Callback_Url 才會回傳此筆帳務訊息
### 5. 背景對帳訊息
對帳功能將消費者繳費日起算， 三日內的成功訂單，發送對帳訊息 (以POST回傳 )至客戶填寫的
Callback_Url ，若有打通 (http code 200) ，我司將不再回傳結果，若沒打通將每 5分鐘重複發送對帳訊息，
若打 10次都無 (http code 200) 結果，我司將不再回傳結果
本對帳訊息發送至： Callback_Url
| 回傳參數 | 字串長度 | 說明 |
| :--- | :--- | :--- |
| Send_Type | 長度 (1) | 固定為 3 |
| result | 長度 (1) | 回傳結果 (0失敗  1成功 ) |
| ret_msg | 最大長度 (100) | 回傳訊息 |
| OrderID | 長度 (19) | 系統訂單編號 |
| e_money | 最大長度 (10) | 交易金額 |
| PayAmount | 最大長度 (10) | 實際繳費金額 |
| e_date | 長度 (8) | 交易日期 (yyyyMMdd ) |
| e_time | 長度 (8) | 交易時間 (HH:mm:ss ) |
| e_orderno | 最大長度 (25) | 自訂訂單編號 |
| e_payaccount | 長度 (16) | 繳費帳號 |
| e_PayInfo | 長度 (9) | 帳號繳費資訊 (銀行代號三碼 +,+繳費帳號後五碼 ) str_check 長度 (32) MD5 32 位元編碼，編碼前字串為：＂ 交易結果 result＂字串加＂自 訂訂單編號 e_orderno＂字串加＂明碼商店代號 (非加密後 32碼商店 |

代號 )CustomerId ＂字串加＂實際繳費金額 PayAmount ＂字串加＂系
統訂單編號 OrderID＂字串加＂客戶資料中的交易驗證密碼
Str_Check＂字串， MD5編碼後回傳過去，如果檢查不符合，請利用
查詢功能或登入客戶後臺管理系統確認資料是否有問題。
※ CustomerId 請用 (法人 )統編  or (自然人 )身分證
舉例 :
交易結果：成功、自訂訂單編號： 2020050701 、商店代號：
80013554、實際繳費金額： 50、系統訂單編號：
2020050700000000001 、交易驗證密碼：
2b1bef9d8ab6a81e9a2739c6ecc64ef8
此參數請帶：
1+2020050701 +80013554 +50+2020050700000000001 +
2b1bef9d8ab6a81e9a2739c6ecc64ef8 之MD5編碼

## 五、 超商代碼串接
### 1. 交易遞交網址：
正式網址： https://n.gomypay.asia/ShuntClass.aspx
測試網址： https://n.gomypay.asia/TestShuntClass.aspx
### 2. 交易遞交參數說明：
| 傳送參數 | 字串長度 | 必填 | 說明 |
| :--- | :--- | :--- | :--- |
| Send_Type | 長度 (1) | 是 | 傳送型態請填 6 (0.信用卡  1.銀聯卡  2.超商條碼  3.WebAtm 4.虛擬帳號  5.定期扣款  6.超商代碼  7.LinePay ) |
| Pay_Mode_No | 長度 (1) | 是 | 付款模式請填 2 |
| CustomerId | 最大長度 (20) | 是 | 商店代號 法人：統編或加密之商店代號 32碼 自然人：身分證或加密之 商店代號 32碼 |
| Order_No | 最大長度 (25) | 是 | 交易單號，如無則自動帶入系統預設交易單號 |
| Amount | 最大長度 (10) | 是 | 交易金額 (最低金額 50元，不可超過 2萬元 ) |
| StoreType | 長度 (1) | 是 | 0:全家  1:ok 2:萊爾富  3:7-11 |
| Buyer_Name | 最大長度 (20) | 是 | 消費者姓名，不可含特殊符號及數字 |
| Buyer_Telm | 最大長度 (20) | 是 | 消費者手機 (數字，不可全形 ) |
| Buyer_Mail | 最大長度 (50) | 是 | 消費者 Email(不可全形 ) |
| Buyer_Memo | 最大長度 (500) | 是 | 消費備註 (交易內容 ) Return_ url 最大長度 (100)  交易回傳網址：如無則自動轉入系統預設 訂單結果頁面 |
註1:如果要用 JSON回傳請勿帶此參數
註2:如果是實名制 OTP店家，若要接回傳值，請填入接收
網址
| Callback_Url | 最大長度 (500) | 背景對帳網址 ，如未填寫默認不進行背景對帳 |
| e_return | 長度 (1) | 使用 json回傳繳費資訊 ，請填 1 |
註1:如果要用預設交易頁面請勿帶此參數
註2:如果是實名制 OTP店家，無法使用 json接收回傳值，
故無需填入
| Str_Check | 長度 (32) | 交易驗證密碼，如果檢查不符合無法交易 (使用 Json回傳才 為必填欄位 ) |

※註 1：繳費期限：印單時間四家超商皆為 30分鐘，印單後 (全家、 OK、萊爾富為 30分鐘；統一超商為 3小時內)繳費
※註 2：若需要回傳繳費資訊， 「 Return_url」和「 e_return」兩個欄位請擇一選擇要回傳的方式，若兩個欄位同時填入
將優先使用 Json回傳。

### 3. 交易遞交範例：
使用 Json回傳 -遞交網址：http s://n.gomypay.asia/ShuntClass.aspx
交易可以 POST表單或以 Curl遞交
```html
<META http -equiv='Content -Type' content='text/html;charset=utf -8'>
<FORM action="  http s://n.gomypay.asia/ShuntClass.aspx " method="post">
<input name=' Send_Type '  value=' 6'>
<input name=' Pay_Mode_No '  value=' 2'>
<input name=' CustomerId '  value='商店代號 '>
<input name=' Order_No '  value='交易單號 '>
<input name='  StoreType  ' value=' 0'>
<input name=' Amount ' value=' 50'>
<input name=' Buyer_Name '  value='消費者姓名 '>
<input name=' Buyer_Telm '  value='消費者電話 '>
<input name=' Buyer_Mail '  value='消費者 email '>
<input name=' Buyer_Memo '  value='商品資訊 '>
<input name=' e_return '  value=' 1'>
<input name=' Str_Check '  value='交易驗證密碼 '>
<input name="button1" type="submit" class="sub_buttom" id="button1" value=" 訂單建立 (請勿重複
點選 )" >
</form>
```
交易結果回傳範例：
```json
{"Send_Type":"6","StoreType":"0","result":"1","ret_msg":" 取號成功
","OrderID":"2020070100000002017","e_orderno":"2020070100000002017","PinCod
e":"GMPA2018383076","str_check":"ee65f492ca50c323697bddc301a4aecc"}
```
自行架構網站之購物車之 交易範例未帶回傳網址 ：

```
https://n.gomypay.asia/ShuntClass.aspx?Send_Type=6&Pay_Mode_No=2&CustomerId=80013554&
```
Order_No=自訂交易單號 (例:2018001 )&Amount =50& Buyer_Name= 消費者姓名
&Buyer_Telm=0912345678&Buyer_Mail= 信箱 &Buyer_Memo= 消費者備註 &StoreType=0
※未設定 Return_ url或e_return，故系統會以內定網頁顯示 訂單結果
自行架構網站之購物車之 交易範例並帶回傳、對帳網址 ：
```
https://n.gomypay.asia/ShuntClass.aspx?Send_Type=3&Pay_Mode_No=2&CustomerId=80013554&
```
Order_No=自訂交易單號 (例:2018001 )&Amount =50& Buyer_Name= 消費者姓名
&Buyer_Telm=0912345678& Buyer_Mail= 信箱 &Buyer_Memo= 消費者備註
&StoreType=0 &Return_ url=回傳網址 & Callback_Url= 對帳網址
### 4. 交易回傳訊息
交易訊息傳至 ReturnUrl(以GET方式 )或使用 e_return(以JSON格式 )回傳以下資料
| 回傳參數 | 字串長度 | 說明 |
| :--- | :--- | :--- |
| Send_Type | 長度 (1) | 固定為 6 |
| StoreType | 長度 (1) | 0:全家  1:ok 2:萊爾富  3:7-11 |
| result | 長度 (1) | 回傳結果 (0失敗  1成功 ) |
| ret_msg | 最大長度 (100) | 回傳訊息 |
| OrderID | 最大長度 (19) | 系統編號 |
| e_orderno | 最大長度 (25) | 客戶自訂訂單編號 |
| PinCode | 最大長度 (20) | 繳費代碼 str_check |

長度 (32) MD5 32 位元編碼，編碼前字串為：＂ 交易結果 result＂
字串加＂自訂訂單編號 e_orderno＂字串加＂明碼商店代
號(非加密後 32碼商店代號 )CustomerId ＂字串加＂訂單金
額Amount＂字串加＂系統訂單編號 OrderID＂字串加＂
客戶資料中的交易驗證密碼  Str_Check＂字串， MD5編碼
後回傳過去，如果檢查不符合，請利用查詢功能或登入客戶
後臺管理系統確認資料是否有問題。
※ CustomerId 請用 (法人 )統編  or (自然人 )身分證
舉例 :
交易結果：成功、自訂訂單編號： 2020050701 、商店代
號： 80013554、實際繳費金額： 50、系統訂單編號：
2020050700000000001 、交易驗證密碼：
2b1bef9d8ab6a81e9a2739c6ecc64ef8

此參數請帶：
1+2020050701 +80013554 +50+202005070000000000
1+
2b1bef9d8ab6a81e9a2739c6ecc64ef8 之MD5編碼

### 5. 背景對帳訊息
對帳功能將消費者繳費日起算， 三日內的成功訂單，發送對帳訊息 (以POST回傳 )至客戶填寫的
Callback_Url ，若有打通 (http code 200) ，我司將不再回傳結果，若沒打通將每 5分鐘重複發送對帳訊息，
若打 10次都無 (http code 200) 結果，我司將不再回傳結果
本對帳訊息發送至： Callback_Url
| 回傳參數 | 字串長度 | 說明 |
| :--- | :--- | :--- |
| Send_Type | 長度 (1) | 固定為 6 |
| StoreType | 長度 (1) | 0:全家  1:ok 2:萊爾富  3:7-11 |
| result | 長度 (1) | 回傳結果 (0失敗  1成功 ) |
| ret_msg | 最大長度 (100) | 回傳訊息 |
| OrderID | 長度 (19) | 系統訂單編號 |
| e_money | 最大長度 (10) | 交易金額 |
| PayAmount | 最大長度 (10) | 實際繳費金額 |
| e_date | 長度 (8) | 交易日期 (yyyyMMdd ) |
| e_time | 長度 (8) | 交易時間 (HH:mm:ss ) |
| e_orderno | 最大長度 (25) | 自訂訂單編號 |
| PinCode | 最大長度 (20) | 繳費代碼 |
| Barcode2 | 最大長度 (20) | 第二段序號 |
| Market_ID | 長度 (2) | FM：全家 , OK：OK, HL：萊爾富 , SE：7-11 |
| Shop_Store_Name | 最大長度 (100) | 繳費門市 +(門市地址 ) str_check |

長度 (32) MD5 32 位元編碼，編碼前字串為：＂ 交易結果 result＂字串加＂自訂
訂單編號 e_orderno＂字串加＂明碼商店代號 (非加密後 32碼商店代
號)CustomerId ＂字串加＂實際繳費金額 PayAmount ＂字串加＂系統
訂單編號 OrderID＂字串加＂客戶資料中的交易驗證密碼  Str_Check＂
字串， MD5編碼後回傳過去，如果檢查不符合，請利用查詢功能或登
入客戶後臺管理系統確認資料是否有問題。
※ CustomerId 請用 (法人 )統編  or (自然人 )身分證
舉例 :
交易結果：成功、自訂訂單編號： 2020050701 、商店代號：
80013554、實際繳費金額： 50、系統訂單編號：
2020050700000000001 、交易驗證密碼：
2b1bef9d8ab6a81e9a2739c6ecc64ef8
此參數請帶：
1+2020050701 +80013554 +50+2020050700000000001 +
2b1bef9d8ab6a81e9a2739c6ecc64ef8 之MD5編碼

# 第四項 申請退貨
### 1. 交易遞交網址 (只提供正式環境使用 )：
http s://n.gomypay.asia/GoodReturn.aspx
### 2. 交易遞交參數說明：
### 3. 交易遞交範例：
使用 Json回傳 -遞交網址：http s://n.gomypay.asia/GoodReturn.aspx
交易可以 POST表單或以 Curl遞交
```html
<META http -equiv='Content -Type' content='text/ html;charset=utf -8'>
<FORM action="  http s://n.gomypay.asia/GoodReturn.aspx  " method="post">
<input name='  Order_No  '  value='交易單號 '>
<input name=' CustomerId '  value='商店代號 '>
<input name=' Str_Check '  value='交易驗證密碼 '>
<input name='  Goods_Return  ' value=' 1'>
<input name=  Goods_Return_Reason  ' value='退貨原因 '>
<input name="button 1" type="submit" class="sub_buttom" id="button 1" value="確定退貨 (請勿重複
點選 )" >
</form>
```
交易結果回傳範例：
```json
{"result":"1","ret_msg":" 申請退貨完成 "}
| 傳送參數 | 字串長度 | 必填 | 說明 |
| :--- | :--- | :--- | :--- |
| Order_No | 最大長度 (25) | 是 | 交易單號 (自訂訂單編號 ) |
| CustomerId | 長度 (20) | 是 | 商店代號 法人：統編或加密之商店代號 32碼 自然人：身分證或加密之 商店代號 32碼 |
| Str_Check | 長度 (32) | 是 | 交易驗證密碼，如果檢查不符合無法交易 |
| Goods_Return | 長度 (1) | 是 | 退貨註記請填 1(申請退貨 ) |
| Goods_Return_Reason | 長度 (500 ) | 是 | 退貨原因 |

# 第五項 取消申請退貨
### 1. 交易遞交網址 (只提供正式環境使用 )：
http s://n.gomypay.asia/GoodReturn.aspx
### 2. 交易遞交參數說明：
### 3. 交易遞交範例：
使用 Json回傳 -遞交網址：http s://n.gomypay.asia/GoodReturn.aspx
交易可以 POST表單或以 Curl遞交
```html
<META http -equiv='Content -Type' content='text/html;charset=utf -8'>
<FORM action="  http s://n.gomypay.asia/GoodReturn.aspx  " method="post">
<input name='  Order_No  '  value='交易單號 '>
<input name=' CustomerId '  value='商店代號 '>
<input name=' Str_Check '  value='交易驗證密碼 '>
<input name=' Goods_Return_Cancel ' value=' 1'>
<input name="button 1" type="submit" class="sub_buttom" id="button 1" value="取消申請退貨 (請勿
重複點選 )" >
</form>
```
交易結果回傳範例：
```json
{"result":"1","ret_msg":" 取消申請退貨完成 "}
```
| 傳送參數 | 字串長度 | 必填 | 說明 |
| :--- | :--- | :--- | :--- |
| Order_No | 最大長度 (25) | 是 | 交易單號 (自訂訂單編號 ) |
| CustomerId | 長度 (20) | 是 | 商店代號 法人：統編或加密之商店代號 32碼 自然人：身分證或加密之 商店代號 32碼 |
| Str_Check | 長度 (20) | 是 | 交易驗證密碼，如果檢查不符合無法交易 |
| Goods_Return_Cancel | 長度 (1) | 是 | 取消申請退貨註記請填 1(取消申請退貨 ) |

# 第六項 交易查詢
一、單筆資料搜尋
### 1. 交易遞交網址：
正式網址： http s://n.gomypay.asia/ CallOrder.aspx
測試網址： https://n.gomypay.asia/TestCallOrder.aspx
### 2. 交易遞交參數說明：
### 3. 交易遞交範例：
使用 Json回傳 -遞交網址：http s://n.gomypay.asia/ CallOrder.aspx
交易可以 POST表單或以 Curl遞交
```html
<META http -equiv='Content -Type' content='text/html;charset=utf -8'>
<FORM action="  http s://n.gomypay.asia/ CallOrder.aspx " method="post">
<input name='  Order_No  '  value='交易單號 '>
<input name=' CustomerId '  value='商店代號 '>
<input name=' Str_Check '  value='交易驗證密碼 '>
<input name="button 1" type="submit" class="sub_buttom" id="button 1" value="查詢交易 (請勿重複
點選 )" >
</form>
```
| 傳送參數 | 字串長度 | 必填 | 說明 |
| :--- | :--- | :--- | :--- |
| Order_No | 最大長度 (25) | 是 | 交易單號 (自訂訂單編號 ) |
| CustomerId | 長度 (20) | 是 | 商店代號 法人：統編或加密之商店代號 32碼 自然人：身分證或加密之 商店代號 32碼 |
| Str_Check | 長度 (32) | 是 | 交易驗證密碼，如果檢查不符合無法交易 |

### 4. 交易結果回傳範例：
{
"result": "1",
"ret_msg": "已繳費 ",
"OrderID": "2019012300000000569",
"e_Cur": "NT",
"e_money": "10000",
"PayAmount": "10000",
"e_date": "20190123",
"e_time": "18:37:59",
"p_date": "20190123",
"p_time": "18:42:17",
"e_orderno": "AH15482399052114",
"e_no": "42816104A05",
"e_outlay": "26",
"bankname": "",
"avcode": "",
"Buyer_Name": "User",
"Buyer_Mail": "paymoney159@gmail.com",
"Buyer_Telm": "0900000000",
"Buyer_Memo": "此為商城虛擬商品購買，並非實體商品交易，請勿受騙上當，並請勿代他人繳款儲
值，小心觸法 ",
"Creditcard_No": "",
"Installment": "0",
"Shop_PaymentCode": "1610A8259J3291",
"Virtual_Account": "",
"e_PayInfo": "",

"Send_Type": "6",
"Goods_Return": "0",
"Goods_Return_Statu": "",
"pay_result": "1",
"LimitDate": "20190123",
"Market_ID": "FM",
"Shop_Store_Name": " 中壢興廣店（桃園市中壢區新中北路二段４８９號） "
}

### 5. 單筆資料查詢回傳 參數說明：
| 回傳參數 | 字串長度 | 說明 |
| :--- | :--- | :--- |
| result | 長度 (1) | 交易結果 (0:失敗 /1:成功 /2:待付款 /3:交易中斷 ) |
| ret_msg | 最大長度 (100) | 交易結果訊息 |
| OrderID | 長度 (19) | 訂單編號 |
| e_Cur | 長度 (2) | 幣別 |
| e_money | 最大長度 (10) | 交易金額 |
| PayAmount | 最大長度 (10) | 實際繳費金額 |
| e_date | 長度 (8) | 訂單建立日期 (yyyyMMdd ) |
| e_time | 長度 (8) | 訂單建立時間 (HH:mm:ss ) |
| p_date | 長度 (8) | 繳費日期 (yyyyMMdd ) |
| p_time | 長度 (8) | 繳費時間 (HH:mm:ss ) |
| e_orderno | 最大長度 (25) | 自訂訂單編號 |
| e_no | 最大長度 (11) | 商店代號 (等同於  CustomerId  ) |
| e_outlay | 最大長度 (10) | 交易總手續費 |
| bankname | 最大長度 (50) | 閘道銀行 |
| avcode | 最大長度 (10) | 授權碼 |
| Buyer_Name | 最大長度 (20) | 消費者名稱 |
| Buyer_Mail | 最大長度 (50) | 消費者聯絡信箱 |
| Buyer_Telm | 最大長度 (20) | 消費者聯絡電話 |
| Buyer_Memo | 最大長度 (500) | 消費備註 (交易內容 ) |
| Creditcard_No | 最大長度 (20) | 信用卡號碼 (前六後四中間打 *號) |
| Installment | 最大長度 (3) | 期數 (交易類型為信用卡時，無分期則填 0) |
| Shop_PaymentCode | 最大長度 (20) | 超商代碼 |
| Virtual_Account | 最大長度 (20) | 虛擬帳號、超商條碼 (第二段條碼 )、WebAtm (第二段條碼 ) |
| e_PayInfo | 長度 (9) | 帳號繳費資訊 (銀行代號三碼 +,+繳費帳號後五碼 ) |
| Send_Type | 長度 (1) | 傳送型態 (0.信用卡  1.銀聯卡  2.超商條碼  3.WebAtm 4. 虛擬 帳號  5.定期扣款  6.超商代碼  7.LinePay ) |
| Goods_Return | 長度 (1) | 退貨、取消交易註記 (0:無退貨狀態 /1:申請退貨 ) |
| Goods_Return_Statu | 最大長度 (100 ) | 退貨處理訊息 |
| pay_result | 長度 (1) | 回傳付款情況  (0 未付款  1 己付款 ) |
| LimitDate | 長度 (8) | 繳費期限 (yyyyMMdd) |
| Market_ID | 長度 (2) | FM：全家 , OK：OK, HL：萊爾富 , SE：7-11 |
| Shop_Store_Name | 最大長度 (100) | 繳費門市 +(門市地址 ) |

二、區間資料搜尋
### 1. 交易遞交網址：
正式網址： http s://n.gomypay.asia/ CallOrder.aspx
測試網址： https://n.gomypay.asia/TestCallOrder.aspx
### 2. 交易遞交參數說明：
※ CreatSdate 和PaySdate  至少要填一個
| 傳送參數 | 字串長度 | 必填 | 說明 |
| :--- | :--- | :--- | :--- |
| CustomerId | 長度 (20) | 是 | 商店代號 法人：統編或加密之商店代號 32碼 自然人：身分證或加密之 商店代號 32碼 |
| Str_Check | 長度 (32) | 是 | 交易驗證密碼，如果檢查不符合無法交易 |
| CreatSdate | 長度 (8) | 和 PaySdate 至少要填一 個 訂單建立日期起日 (yyyyMMdd ) |
| CreatEdate | 長度 (8) | 訂單建立日期止日 (yyyyMMdd ) |
| CreatStime | 最大長度 (2) | 訂單建立起日時間， 24小時制 (請填 0-23) |
| CreatEtime | 最大長度 (2) | 訂單建立止日時間， 24小時制 (請填 0-23) |
| PaySdate | 長度 (8) | 和 CreatSdate 至少要填一 個 訂單繳費日期起日 (yyyyMMdd ) |
| PayEdate | 長度 (8) | 訂單繳費日期止日 (yyyyMMdd ) |
| PayStime | 最大長度 (2) | 訂單繳費起日時間， 24小時制 (請填 0-23) |
| PayEtime | 最大長度 (2) | 訂單繳費止日時間， 24小時制 (請填 0-23) |

### 3. 交易遞交範例：
使用 Json回傳 -遞交網址：http s://n.gomypay.asia/ CallOrder.aspx
交易可以 POST表單或以 Curl遞交
```html
<META http -equiv='Content -Type' content='text/html;charset=utf -8'>
<FORM action="  http s://n.gomypay.asia/ CallOrder.aspx " method="post">
<input name='  Order_No  '  value='交易單號 '>
<input name=' CustomerId '  value='商店代號 '>
<input name=' Str_Check '  value='交易驗證密碼 '>
<input name= 'CreatSdate '  value='訂單起日時間 '>
<input name= 'CreatEdate '  value='訂單止日時間 '>
<input name="button 1" type="submit" class="sub_buttom" id="button 1" value="查詢區間交易 (請勿
重複點選 )" >
</form>
```

### 4. 交易結果回傳範例：
{
"check": "1",
"check_msg": " 查詢成功 ",
"Order": [
{
"result": "2",
"ret_msg": "",
"OrderID": "2022032100000000195",
"e_Cur": "NT",
"e_money": "1000",
"PayAmount": "",
"e_date": "20220321",
"e_time": "11:32:17",
"p_date": "",
"p_time": "",
"e_orderno": "20220321113215mQ73n",
"e_outlay": "17",
"avcode": "",
"Buyer_Name": " 莊雅涵 ",
"Buyer_Mail": "49bc61fb@hotmail.com",
"Buyer_Telm": "0919308401",
"Buyer_Memo": " 編號 20220321113215mQ73n",
"Creditcard_No": "",
"Installment": "",
"Shop_PaymentCode": "",
"Virtual_Account": "0055600321989068",

"e_PayInfo": "",
"Send_Type": "4",
"Goods_Return": "0",
"Goods_Return_Statu": "",
"pay_result": "0",
"LimitDate": "20220321",
"Market_ID": "",
"Store_ID": "",
"Shop_Store_Name": ""
},
{
"result": "1",
"ret_msg": "已繳費 ",
"OrderID": "2022032100000000252",
"e_Cur": "NT",
"e_money": "3000",
"PayAmount": "3000",
"e_date": "20220321",
"e_time": "13:11:33",
"p_date": "20220321",
"p_time": "13:14:15",
"e_orderno": "20220321131132x8FIG",
"e_outlay": "27",
"avcode": "",
"Buyer_Name": " 施婉婷 ",
"Buyer_Mail": "34978377e6b@icloud.com",
"Buyer_Telm": "0912957050",

"Buyer_Memo": " 編號 20220321131132x8FIG",
"Creditcard_No": "",
"Installment": "0",
"Shop_PaymentCode": "GMPA2208097968",
"Virtual_Account": "",
"e_PayInfo": "",
"Send_Type": "6",
"Goods_Return": "0",
"Goods_Return_Statu": "",
"pay_result": "1",
"LimitDate": "20220321",
"Market_ID": "SE",
"Store_ID": "138697",
"Shop_Store_Name": " 新福樂（基隆市信義區深溪路 43號45號1樓） "
}
]
}
### 5. 區間資料查詢 回傳參數說明：
| 回傳參數 | 字串長度 | 說明 |
| :--- | :--- | :--- |
| check | 長度 (1) | 查詢結果 (0:失敗 /1:成功 ) |
| check_msg | 最大長度 (100) | 查詢結果訊息 |
| result | 長度 (1) | 交易結果 (0:失敗 /1:成功 /2:待付款 /3:交易中斷 ) |
| ret_msg | 最大長度 (100) | 交易結果訊息 |
| OrderID | 長度 (19) | 訂單編號 |
| e_Cur | 長度 (2) | 幣別 |
| e_money | 最大長度 (10) | 交易金額 |
| PayAmount | 最大長度 (10) | 實際繳費金額 |
| e_date | 長度 (8) | 訂單建立日期 (yyyyMMdd ) |
| e_time | 長度 (8) | 訂單建立時間 (HH:mm:ss ) |

| p_date | 長度 (8) | 繳費日期 (yyyyMMdd ) |
| p_time | 長度 (8) | 繳費時間 (HH:mm:ss ) |
| e_orderno | 最大長度 (25) | 自訂訂單編號 |
| e_outlay | 最大長度 (10) | 交易總手續費 |
| avcode | 最大長度 (10) | 授權碼 |
| Buyer_Name | 最大長度 (20) | 消費者名稱 |
| Buyer_Mail | 最大長度 (50) | 消費者聯絡信箱 |
| Buyer_Telm | 最大長度 (20) | 消費者聯絡電話 |
| Buyer_Memo | 最大長度 (500) | 消費備註 (交易內容 ) |
| Creditcard_No | 最大長度 (20) | 信用卡號碼 (前六後四中間打 *號) |
| Installment | 最大長度 (3) | 期數 (交易類型為信用卡時，無分期則填 0) |
| Shop_PaymentCode | 最大長度 (20) | 超商代碼 |
| Virtual_Account | 最大長度 (20) | 虛擬帳號、超商條碼 (第二段條碼 )、WebAtm (第二段條碼 ) |
| e_PayInfo | 長度 (9) | 帳號繳費資訊 (銀行代號三碼 +,+繳費帳號後五碼 ) |
| Send_Type | 長度 (1) | 傳送型態 (0.信用卡  1.銀聯卡  2.超商條碼  3.WebAtm 4. 虛擬 帳號  5.定期扣款  6.超商代碼  7.LinePay ) |
| Goods_Return | 長度 (1) | 退貨、取消交易註記 (0:無退貨狀態 /1:申請退貨 ) |
| Goods_Return_Statu | 最大長度 (100 ) | 退貨處理訊息 |
| pay_result | 長度 (1) | 回傳付款情況  (0 未付款  1 己付款 ) |
| LimitDate | 長度 (8) | 繳費期限 (yyyyMMdd) |
| Market_ID | 長度 (2) | FM：全家 , OK：OK, HL：萊爾富 , SE：7-11 |
| Shop_Store_Name | 最大長度 (100) | 繳費門市 +(門市地址 ) |

# 第七項 多元支付
本項目須使用「 Raw JSON」的POST方式進行串接 (詳見 JSON範例 )，請勿使用 <form>方式遞送參數。

## 一、 【悠遊付】交易遞交
### 1. API網址：
正式網址： https://n.gomypay.asia/MPEPv1/easycard/createOrder
測試網址： https://n.gomypay.asia/MPEPt/easycard/createOrder
### 2. API請求參數說明：
| 傳送參數 | 字串長度 | 必填 | 說明 |
| :--- | :--- | :--- | :--- |
| e_return | 長度 (1) | 是 | 使用 JSON回傳交易結果，請填 1 |
| Str_Check | 長度 (32) | 是 | 交易驗證密碼，如果檢查不符合無法交易 (使用 JSON回傳時為必填欄 位) |
| Send_Code | 長度 (1) | 是 | 支付類型，請填 9001 (特店需先申請啟用線上行動支付服務 ) |
| Send_Type | 長度 (1) | 是 | 傳送型態，請填 9 |
| Pay_Mode_No | 長度 (1) | 是 | 付款模式，請填 2 |
| CustomerId | 最大長度 (32) | 是 | 商店代號 |

加密之商店代號 32碼
| Order_No | 最大長度 (25) | 否 | 特店自訂訂單編號 (如無則自動帶入系統預設訂單編號 ) |
| Amount | 最大長度 (10) | 是 | 交易金額 (最低金額 1元) |
| Buyer_Name | 最大長度 (20) | 是 | 消費者姓名 |
| Buyer_Telm | 最大長度 (20) | 是 | 消費者手機 (數字，不可全形 ) |
| Buyer_Mail | 最大長度 (50) | 是 | 消費者 Email(不可全形 ) |
| Buyer_Memo | 最大長度 (255) | 是 | 消費備註 (交易內容 ) |
| Callback_Url | 最大長度 (500) | 是 | 交易完成後接收回傳結果之網址，例如訂單完成頁 |

API結果 JSON請求範例：
{
"e_return":"1",
"Str_Check":" 台灣萬事達金流安全檢查碼 ",
"Send_Code":"9001",

"Send_Type":"9",
"Pay_Mode_No":"2",
"CustomerId":" 台灣萬事達金流加密商店代號 ",
"Amount":"1",
"Buyer_Name":" 測試人員 ",
"Buyer_Telm":"0224286860",
"Buyer_Mail":" customer@gomypay.asia ",
"Buyer_Memo":" 測試商品 ",
"Callback_Url" :"交易完成後接收回傳結果之網址 "
}
### 3. API回傳訊息
交易訊息將以 JSON格式回傳以下資料
| 回傳參數 | 字串長度 | 說明 |
| :--- | :--- | :--- |
| result | 長度 (5) | 回傳結果 (參照附件一 ) |
| return_msg | 最大長度 (100) | 回傳訊息 |
| TM_Order_ID | 長度 (19) | 台灣萬事達金流系統訂單編號 |
| Customer_Order_ID | 長度 (25) | 特店自訂訂單編號 |

| redirectPaymentUrl | 長度 (200) | QRCode付款頁連結，有效時間為 5分鐘 *測試站之 QRCode付款頁僅供流程測試， 3秒 後會自動重新導向至 Callback_Url |

API結果 JSON回傳範例：
{
"result": "00000",
"return_msg": " 成功 ",
"TM_Order_ID": "2021063000000000018",
"Customer_Order_ID": "2021063000000000018",
"redirectPaymentUrl": " 悠遊付 QRCode付款頁連結 "
}

## 二、 【台灣 Pay】交易遞交
### 1. API網址：
正式網址： https://n.gomypay.asia/MPEPv1/twpay/createOrder
測試網址： https://n.gomypay.asia/MPEPt/twpay/createOrder
### 2. API請求參數說明：
| 傳送參數 | 字串長度 | 必填 | 說明 |
| :--- | :--- | :--- | :--- |
| e_return | 長度 (1) | 是 | 使用 JSON回傳交易結果，請填 1 |

| Str_Check | 長度 (32) | 是 | 交易驗證密碼，如果檢查不符合無法交易 (使用 JSON回傳時為必填欄 位) |
| Send_Code | 長度 (1) | 是 | 支付類型，請填 9002 (特店需先申請啟用線上行動支付服務 ) |
| Send_Type | 長度 (1) | 是 | 傳送型態，請填 9 |
| Pay_Mode_No | 長度 (1) | 是 | 付款模式，請填 2 |
| CustomerId | 最大長度 (32) | 是 | 商店代號 加密之商店代號 32碼 |
| Order_No | 最大長度 (25) | 否 | 特店自訂訂單編號，如無則自動帶入系統預設訂單編號 |
| Amount | 最大長度 (10) | 是 | 交易金額 (最低金額 1元) |
| Buyer_Name | 最大長度 (20) | 是 | 消費者姓名 |
| Buyer_Telm | 最大長度 (20) | 是 | 消費者手機 (數字，不可全形 ) |
| Buyer_Mail | 最大長度 (50) | 是 | 消費者 Email(不可全形 ) |
| Buyer_Memo | 最大長度 (255) | 是 | 消費備註 (交易內容 ) |

| Callback_Url | 最大長度 (500) | 是 | 交易完成後接收回傳結果之網址，例如訂單完成頁 |

API結果 JSON請求範例：
{
"e_return":"1",
"Str_Check":" 台灣萬事達金流安全檢查碼 ",
"Send_Code":"9002",
"Send_Type":"9",
"Pay_Mode_No":"2",
"CustomerId":" 台灣萬事達金流加密商店代號 ",
"Amount":"1",
"Buyer_Name":" 測試人員 ",
"Buyer_Telm":"0224286860",
"Buyer_Mail":" customer@gomypay.asia ",
"Buyer_Memo":" 測試商品 ",
"Callback_Url" :"交易完成後接收回傳結果之網址 "
}
### 3. API回傳訊息
交易訊息將以 JSON格式回傳以下資料

| 回傳參數 | 字串長度 | 說明 |
| :--- | :--- | :--- |
| result | 長度 (5) | 回傳結果 (參照附件一 ) |
| return_msg | 最大長度 (100) | 回傳訊息 |
| TM_Order_ID | 長度 (19) | 台灣萬事達金流系統訂單編號 |
| Customer_Order_ID | 長度 (25) | 特店自訂訂單編號 |
| redirectPaymentUrl | 長度 (200) | QRCode付款頁連結 付款流程 : ### 1. 消費者須先下載台灣 Pay App ### 2. 綁定金融卡或銀行帳戶至台灣 Pay App ### 3. 使用台灣 Pay App掃描 QRCode付款 *測試站之 QRCode付款頁僅供流程測試， 3秒 後會自動重新導向至 Callback_Url |

API結果 JSON回傳範例：
{
"result": "00000",
"return_msg": " 成功 ",
"TM_Order_ID": "2021063000000000018",
"Customer_Order_ID": "2021063000000000018",
"redirectPaymentUrl": " 台灣 Pay QRCode付款頁連結 "

}

## 三、 【Apple Pay】交易遞交
### 3. API網址：
正式網址： https://n.gomypay.asia/MPEPv1/applepay/createOrder
測試網址： https://n.gomypay.asia/MPEPt/applepay/createOrder
### 4. API請求參數說明：
| 傳送參數 | 字串長度 | 必填 | 說明 |
| :--- | :--- | :--- | :--- |
| e_return | 長度 (1) | 是 | 使用 JSON回傳交易結果，請填 1 |
| Str_Check | 長度 (32) | 是 | 交易驗證密碼，如果檢查不符合無法交易 (使用 JSON回傳時為必填欄 位) |
| Send_Code | 長度 (1) | 是 | 支付類型，請填 9003 (特店需先申請啟用線上行動支付服務 ) |
| Send_Type | 長度 (1) | 是 | 傳送型態，請填 9 |
| Pay_Mode_No | 長度 (1) | 是 | 付款模式，請填 2 |
| CustomerId | 最大長度 (32) | 是 | 商店代號 |

加密之商店代號 32碼
| Order_No | 最大長度 (25) | 否 | 特店自訂訂單編號，如無則自動帶入系統預設訂單編號 |
| Amount | 最大長度 (10) | 是 | 交易金額 (最低金額 1元) |
| Buyer_Name | 最大長度 (20) | 是 | 消費者姓名 |
| Buyer_Telm | 最大長度 (20) | 是 | 消費者手機 (數字，不可全形 ) |
| Buyer_Mail | 最大長度 (50) | 是 | 消費者 Email(不可全形 ) |
| Buyer_Memo | 最大長度 (255) | 是 | 消費備註 (交易內容 ) |
| Callback_Url | 最大長度 (500) | 是 | 交易完成後接收回傳結果之網址，例如訂單完成頁 |

API結果 JSON請求範例：
{
"e_return":"1",
"Str_Check":" 台灣萬事達金流安全檢查碼 ",
"Send_Code":"9003",
"Send_Type":"9",

"Pay_Mode_No":"2",
"CustomerId":" 台灣萬事達金流加密商店代號 ",
"Amount":"1",
"Buyer_Name":" 測試人員 ",
"Buyer_Telm":"0224286860",
"Buyer_Mail":" customer@gomypay.asia ",
"Buyer_Memo":" 測試商品 ",
"Callback_Url" :"交易完成後接收回傳結果之網址 "
}
### 3. API回傳訊息
交易訊息將以 JSON格式回傳以下資料
| 回傳參數 | 字串長度 | 說明 |
| :--- | :--- | :--- |
| result | 長度 (5) | 回傳結果 (參照附件一 ) |
| return_msg | 最大長度 (100) | 回傳訊息 |
| TM_Order_ID | 長度 (19) | 台灣萬事達金流系統訂單編號 |
| Customer_Order_ID | 長度 (25) | 特店自訂訂單編號 |
| redirectPaymentUrl | 長度 (200) | QRCode付款頁連結 |

付款流程 :
### 1. 消費者須先綁定信用卡至 Apple Pay
### 2. 使用 iOS裝置相機掃描 QRCode
### 3. 使用 Safari瀏覽器前往 Apple Pay付款
按鈕頁
### 4. 點擊按鈕付款
*測試站之 Apple Pay付款按鈕頁僅供流程測
試， 3秒後會自動重新導向至 Callback_Url

API結果 JSON回傳範例：
{
"result": "00000",
"return_msg": " 成功 ",
"TM_Order_ID": "2021063000000000018",
"Customer_Order_ID": "2021063000000000018",
"redirectPaymentUrl": "Apple Pay 按鈕付款網址 "
}

## 四、 【Google Pay】交易遞交
### 5. API網址：
正式網址： https://n.gomypay.asia/MPEPv1/googlepay/createOrder
測試網址： https://n.gomypay.asia/MPEPt/googlepay/createOrder
### 6. API請求參數說明：

| 傳送參數 | 字串長度 | 必填 | 說明 |
| :--- | :--- | :--- | :--- |
| e_return | 長度 (1) | 是 | 使用 JSON回傳交易結果，請填 1 |
| Str_Check | 長度 (32) | 是 | 交易驗證密碼，如果檢查不符合無法交易 (使用 JSON回傳時為必填欄 位) |
| Send_Code | 長度 (1) | 是 | 支付類型，請填 9004 (特店需先申請啟用線上行動支付服務 ) |
| Send_Type | 長度 (1) | 是 | 傳送型態，請填 9 |
| Pay_Mode_No | 長度 (1) | 是 | 付款模式，請填 2 |
| CustomerId | 最大長度 (32) | 是 | 商店代號 加密之商店代號 32碼 |
| Order_No | 最大長度 (25) | 否 | 特店自訂訂單編號，如無則自動帶入系統預設訂單編號 |
| Amount | 最大長度 (10) | 是 | 交易金額 (最低金額 1元) |
| Buyer_Name | 最大長度 (20) | 是 | 消費者姓名 |
| Buyer_Telm | 最大長度 (20) | 是 | 消費者手機 (數字，不可全形 ) |

| Buyer_Mail | 最大長度 (50) | 是 | 消費者 Email(不可全形 ) |
| Buyer_Memo | 最大長度 (255) | 是 | 消費備註 (交易內容 ) |
| Callback_Url | 最大長度 (500) | 是 | 交易完成後接收回傳結果之網址，例如訂單完成頁 |

API結果 JSON請求範例：
{
"e_return":"1",
"Str_Check":" 台灣萬事達金流安全檢查碼 ",
"Send_Code":"9004",
"Send_Type":"9",
"Pay_Mode_No":"2",
"CustomerId":" 台灣萬事達金流加密商店代號 ",
"Amount":"1",
"Buyer_Name":" 測試人員 ",
"Buyer_Telm":"0224286860",
"Buyer_Mail":" customer@gomypay.asia ",
"Buyer_Memo":" 測試商品 ",
"Callback_Url" :"交易完成後接收回傳結果之網址 "
}

### 3. API回傳訊息
交易訊息將以 JSON格式回傳以下資料
| 回傳參數 | 字串長度 | 說明 |
| :--- | :--- | :--- |
| result | 長度 (5) | 回傳結果 (參照附件一 ) |
| return_msg | 最大長度 (100) | 回傳訊息 |
| TM_Order_ID | 長度 (19) | 台灣萬事達金流系統訂單編號 |
| Customer_Order_ID | 長度 (25) | 特店自訂訂單編號 |
| redirectPaymentUrl | 長度 (200) | QRCode付款頁連結 付款流程 : ### 1. 消費者須先綁定信用卡至 Google Pay ### 2. 使用 iOS或Android裝置相機掃描 QRCode ### 3. 前往 Google Pay 付款按鈕頁 ### 4. 點擊按鈕付款 *測試站之 Google Pay 付款按鈕頁僅供流程測 試， 3秒後會自動重新導向至 Callback_Url |

API結果 JSON回傳範例：

{
"result": "00000",
"return_msg": " 成功 ",
"TM_Order_ID": "2021063000000000018",
"Customer_Order_ID": "2021063000000000018",
"redirectPaymentUrl": "Google Pay 按鈕付款網址 "
}

## 五、 回傳狀態碼對應表
本表只適用多元支付交易。

result  return_msg
00000  成功
10001  Amount未填或小於 1
10002  必填參數中有部分未填
10003  特店此支付方式手續費設定為 0
10004  閘道未啟用  或 手續費為 0
10005  查無訂單資料

10006  查無特店帳號
10007  CustomerId 有誤
10008  Str_Check有誤
10009  特店帳號未啟用
10010  eReturn有誤或未填
10011  Send_Code 有誤或未填
10012  Send_Type有誤或未填
10013  Pay_Mode_No 有誤或未填
10014  Callback_Url 有誤或未填

# 第八項 交易回傳相關欄位參考
## 一、 參數對照說明

信用卡 (單筆 /分期 )、銀聯卡
回傳參數  說明
Send_Type  傳送型態 (0.信用卡  1.銀聯卡  2.超商條碼  3.WebAtm 4. 虛擬帳號  5.定期扣
款 6.超商代碼  7.LinePay )
result  回傳結果 (0失敗  1成功 )
ret_msg  回傳訊息
OrderID  系統訂單編號
e_Cur  幣別
e_money  交易金額
e_date  交易日期
e_time  交易時間
e_orderno  自訂訂單編號
e_no  商店代號
e_outlay  交易總手續費
avcode  授權碼
CardLastNum  信用卡號後四碼
超商條碼
回傳參數  說明
Send_Type  傳送型態 (0.信用卡  1.銀聯卡  2.超商條碼  3.WebAtm 4. 虛擬帳號  5.定期扣
款 6.超商代碼  7.LinePay )
OrderID  系統訂單編號
e_orderno  自訂訂單編號
交易回傳欄位
e_payaccount  繳費帳號
LimitDate  繳費期限 (yyyyMMdd )
code1  超商繳費調碼第一段。
code2  超商繳費調碼第二段。
code3  超商繳費調碼第三段。
對帳回傳欄位
result  回傳結果 (0失敗  1成功 )
ret_msg  回傳訊息
e_money  交易金額
PayAmount  實際繳費金額
e_date  交易日期

e_time  交易時間
虛擬帳號
回傳參數  說明
Send_Type  傳送型態 (0.信用卡  1.銀聯卡  2.超商條碼  3.WebAtm 4. 虛擬帳號  5.定期扣
款 6.超商代碼  7.LinePay )
OrderID  系統訂單編號
e_orderno  自訂訂單編號
交易回傳欄位
e_payaccount  繳費帳號
LimitDate  繳費期限 (yyyyMMdd )
對帳回傳欄位
result  回傳結果 (0失敗  1成功 )
ret_msg  回傳訊息
e_money  交易金額
PayAmount  實際繳費金額
e_date  交易日期
e_time  交易時間
WebAtm
回傳參數  說明
Send_Type  傳送型態 (0.信用卡  1.銀聯卡  2.超商條碼  3.WebAtm 4. 虛擬帳號  5.定期扣
款 6.超商代碼  7.LinePay )
OrderID  系統訂單編號
e_orderno  自訂訂單編號
result  回傳結果 (0失敗  1成功 )
ret_msg  回傳訊息
交易回傳欄位
e_payaccount  繳費帳號
對帳回傳欄位
e_money  交易金額
PayAmount  實際繳費金額
e_date  交易日期
e_time  交易時間
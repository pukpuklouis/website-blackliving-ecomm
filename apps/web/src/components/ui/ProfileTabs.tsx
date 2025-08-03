import React from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@blackliving/ui';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@blackliving/ui';
import { Button } from '@blackliving/ui';
import { Input } from '@blackliving/ui';
import { Label } from '@blackliving/ui';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@blackliving/ui';
import { Badge } from '@blackliving/ui';

interface ProfileTabsProps {
  className?: string;
}

export default function ProfileTabs({ className }: ProfileTabsProps) {
  return (
    <Tabs defaultValue="profile" className={`space-y-6 ${className || ''}`}>
      <TabsList className="grid w-full grid-cols-4">
        <TabsTrigger value="profile">基本資料</TabsTrigger>
        <TabsTrigger value="addresses">地址管理</TabsTrigger>
        <TabsTrigger value="payment">付款方式</TabsTrigger>
        <TabsTrigger value="security">安全設定</TabsTrigger>
      </TabsList>

      <TabsContent value="profile" className="space-y-6">
        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <div>
                <CardTitle>基本資料</CardTitle>
                <CardDescription>管理您的個人基本資訊</CardDescription>
              </div>
              <Badge id="sync-indicator" variant="secondary" className="text-green-600 bg-green-50 border-green-200 hidden">
                <span className="inline-block w-2 h-2 bg-green-500 rounded-full mr-2"></span>
                已同步
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div id="loading" className="text-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
              <p className="mt-4 text-muted-foreground">載入中...</p>
            </div>

            <div id="not-authenticated" className="text-center py-12 hidden">
              <p className="text-muted-foreground mb-4">請先登入您的帳號</p>
              <Button asChild>
                <a href="/login">前往登入</a>
              </Button>
            </div>

            <form id="profile-form" className="space-y-6 hidden">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="name">姓名 *</Label>
                  <Input
                    id="name"
                    name="name"
                    type="text"
                    required
                    placeholder="請輸入您的姓名"
                  />
                  <div id="name-error" className="text-sm text-destructive hidden"></div>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="email">電子郵件</Label>
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    disabled
                    className="bg-muted"
                  />
                  <div id="email-error" className="text-sm text-destructive hidden"></div>
                  <p className="text-xs text-muted-foreground">電子郵件地址無法修改</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="phone">手機號碼</Label>
                  <Input
                    id="phone"
                    name="phone"
                    type="tel"
                    placeholder="0912345678"
                    maxLength={10}
                  />
                  <div id="phone-error" className="text-sm text-destructive hidden"></div>
                  <p className="text-xs text-muted-foreground">台灣手機號碼格式：09xxxxxxxx</p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="birthday">生日</Label>
                  <Input
                    id="birthday"
                    name="birthday"
                    type="date"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="gender">性別</Label>
                  <Select name="gender">
                    <SelectTrigger id="gender">
                      <SelectValue placeholder="請選擇性別" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="male">男性</SelectItem>
                      <SelectItem value="female">女性</SelectItem>
                      <SelectItem value="other">其他</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="contactPreference">聯絡偏好</Label>
                  <Select name="contactPreference">
                    <SelectTrigger id="contactPreference">
                      <SelectValue placeholder="選擇聯絡方式" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="email">電子郵件</SelectItem>
                      <SelectItem value="phone">電話</SelectItem>
                      <SelectItem value="sms">簡訊</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div id="message" className="hidden p-4 rounded-lg border"></div>
              
              <div className="flex gap-3 pt-4">
                <Button type="submit" id="update-btn" className="flex items-center gap-2">
                  <span id="update-text">更新資料</span>
                  <div id="update-spinner" className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin hidden"></div>
                </Button>
                <Button type="button" id="reset-btn" variant="outline">
                  重設
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </TabsContent>

      {/* Address Management Tab */}
      <TabsContent value="addresses" className="space-y-6">
        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <div>
                <CardTitle>地址管理</CardTitle>
                <CardDescription>管理您的收貨地址與帳單地址</CardDescription>
              </div>
              <Button id="add-address-btn">
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4"></path>
                </svg>
                新增地址
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div id="addresses-loading" className="text-center py-8">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary mx-auto"></div>
              <p className="mt-2 text-sm text-muted-foreground">載入地址中...</p>
            </div>

            <div id="addresses-empty" className="text-center py-12 text-muted-foreground hidden">
              <svg className="w-12 h-12 mx-auto mb-4 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"></path>
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"></path>
              </svg>
              <p>尚未新增任何地址</p>
              <p className="text-sm">新增地址以便快速結帳</p>
            </div>

            <div id="addresses-list" className="space-y-4 hidden">
              {/* Addresses will be populated here */}
            </div>
          </CardContent>
        </Card>

        {/* Address Form Modal */}
        <div id="address-modal" className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center hidden">
          <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 id="address-modal-title" className="text-lg font-semibold">新增地址</h3>
              <Button id="close-address-modal" variant="ghost" className="p-2">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
                </svg>
              </Button>
            </div>

            <form id="address-form" className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="address-name">收件人姓名 *</Label>
                  <Input
                    id="address-name"
                    name="name"
                    type="text"
                    required
                    placeholder="請輸入收件人姓名"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="address-phone">聯絡電話 *</Label>
                  <Input
                    id="address-phone"
                    name="phone"
                    type="tel"
                    required
                    placeholder="0912345678"
                    maxLength={10}
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="address-city">縣市 *</Label>
                  <Select name="city">
                    <SelectTrigger id="address-city">
                      <SelectValue placeholder="選擇縣市" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="台北市">台北市</SelectItem>
                      <SelectItem value="新北市">新北市</SelectItem>
                      <SelectItem value="桃園市">桃園市</SelectItem>
                      <SelectItem value="台中市">台中市</SelectItem>
                      <SelectItem value="台南市">台南市</SelectItem>
                      <SelectItem value="高雄市">高雄市</SelectItem>
                      <SelectItem value="基隆市">基隆市</SelectItem>
                      <SelectItem value="新竹市">新竹市</SelectItem>
                      <SelectItem value="嘉義市">嘉義市</SelectItem>
                      <SelectItem value="新竹縣">新竹縣</SelectItem>
                      <SelectItem value="苗栗縣">苗栗縣</SelectItem>
                      <SelectItem value="彰化縣">彰化縣</SelectItem>
                      <SelectItem value="南投縣">南投縣</SelectItem>
                      <SelectItem value="雲林縣">雲林縣</SelectItem>
                      <SelectItem value="嘉義縣">嘉義縣</SelectItem>
                      <SelectItem value="屏東縣">屏東縣</SelectItem>
                      <SelectItem value="宜蘭縣">宜蘭縣</SelectItem>
                      <SelectItem value="花蓮縣">花蓮縣</SelectItem>
                      <SelectItem value="台東縣">台東縣</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="address-district">區域 *</Label>
                  <Input
                    id="address-district"
                    name="district"
                    type="text"
                    required
                    placeholder="例：中正區"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="address-postal">郵遞區號</Label>
                  <Input
                    id="address-postal"
                    name="postalCode"
                    type="text"
                    placeholder="例：100"
                    maxLength={5}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="address-street">詳細地址 *</Label>
                <Input
                  id="address-street"
                  name="street"
                  type="text"
                  required
                  placeholder="請輸入詳細地址（路段、巷弄、號碼）"
                />
              </div>

              <div className="flex items-center space-x-2">
                <input type="checkbox" id="address-default" name="isDefault" className="w-4 h-4" />
                <Label htmlFor="address-default" className="text-sm">設為預設地址</Label>
              </div>

              <div className="space-y-2">
                <Label htmlFor="address-notes">備註</Label>
                <Input
                  id="address-notes"
                  name="notes"
                  type="text"
                  placeholder="例：公司地址、住家門口有管理員"
                />
              </div>

              <div id="address-form-message" className="hidden p-3 rounded border text-sm"></div>

              <div className="flex gap-3 pt-4">
                <Button type="submit" id="save-address-btn" className="flex-1">
                  <span id="save-address-text">儲存地址</span>
                  <div id="save-address-spinner" className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin ml-2 hidden"></div>
                </Button>
                <Button type="button" id="cancel-address-btn" variant="outline">
                  取消
                </Button>
              </div>
            </form>
          </div>
        </div>
      </TabsContent>

      {/* Payment Methods Tab */}
      <TabsContent value="payment" className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>付款方式與優惠</CardTitle>
            <CardDescription>聯繫客服取得更好的報價與付款選項</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Line@ Contact Card */}
            <div className="border-2 border-green-200 bg-green-50 rounded-lg p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 bg-green-500 rounded-lg flex items-center justify-center">
                    <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M19.365 9.863c.349 0 .63.285.63.631 0 .345-.281.63-.63.63H17.61v1.125h1.755c.349 0 .63.283.63.63 0 .344-.281.629-.63.629h-2.386c-.345 0-.627-.285-.627-.629V8.108c0-.345.282-.63.63-.63h2.386c.346 0 .627.285.627.63 0 .349-.281.63-.63.63H17.61v1.125h1.755zm-3.855 3.016c0 .27-.174.51-.432.596-.064.021-.133.031-.199.031-.211 0-.391-.09-.51-.25l-2.443-3.317v2.94c0 .344-.279.629-.631.629-.346 0-.626-.285-.626-.629V8.108c0-.27.173-.51.43-.595.06-.023.136-.033.194-.033.195 0 .375.104.495.254l2.462 3.33V8.108c0-.345.282-.63.63-.63.345 0 .63.285.63.63v4.771zm-5.741 0c0 .344-.282.629-.631.629-.345 0-.627-.285-.627-.629V8.108c0-.345.282-.63.63-.63.346 0 .628.285.628.63v4.771zm-2.466.629H4.917c-.345 0-.63-.285-.63-.629V8.108c0-.345.285-.63.63-.63.348 0 .63.285.63.63v4.141h1.756c.348 0 .629.283.629.63 0 .344-.282.629-.629.629M24 10.314C24 4.943 18.615.572 12 .572S0 4.943 0 10.314c0 4.811 4.27 8.842 10.035 9.608.391.082.923.258 1.058.59.12.301.079.766.038 1.08l-.164 1.02c-.045.301-.24 1.186 1.049.645 1.291-.539 6.916-4.078 9.436-6.975C23.176 14.393 24 12.458 24 10.314"/>
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-green-800">聯繫專業客服</h3>
                    <p className="text-green-700">透過 Line@ 獲得專屬優惠報價</p>
                  </div>
                </div>
                <Button asChild className="bg-green-600 hover:bg-green-700 text-white">
                  <a href="https://line.me/R/ti/p/@blackliving" target="_blank" rel="noopener noreferrer">
                    <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M19.365 9.863c.349 0 .63.285.63.631 0 .345-.281.63-.63.63H17.61v1.125h1.755c.349 0 .63.283.63.63 0 .344-.281.629-.63.629h-2.386c-.345 0-.627-.285-.627-.629V8.108c0-.345.282-.63.63-.63h2.386c.346 0 .627.285.627.63 0 .349-.281.63-.63.63H17.61v1.125h1.755zm-3.855 3.016c0 .27-.174.51-.432.596-.064.021-.133.031-.199.031-.211 0-.391-.09-.51-.25l-2.443-3.317v2.94c0 .344-.279.629-.631.629-.346 0-.626-.285-.626-.629V8.108c0-.27.173-.51.43-.595.06-.023.136-.033.194-.033.195 0 .375.104.495.254l2.462 3.33V8.108c0-.345.282-.63.63-.63.345 0 .63.285.63.63v4.771zm-5.741 0c0 .344-.282.629-.631.629-.345 0-.627-.285-.627-.629V8.108c0-.345.282-.63.63-.63.346 0 .628.285.628.63v4.771zm-2.466.629H4.917c-.345 0-.63-.285-.63-.629V8.108c0-.345.285-.63.63-.63.348 0 .63.285.63.63v4.141h1.756c.348 0 .629.283.629.63 0 .344-.282.629-.629.629M24 10.314C24 4.943 18.615.572 12 .572S0 4.943 0 10.314c0 4.811 4.27 8.842 10.035 9.608.391.082.923.258 1.058.59.12.301.079.766.038 1.08l-.164 1.02c-.045.301-.24 1.186 1.049.645 1.291-.539 6.916-4.078 9.436-6.975C23.176 14.393 24 12.458 24 10.314"/>
                    </svg>
                    聯繫客服
                  </a>
                </Button>
              </div>
              <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                <div className="flex items-center text-green-700">
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                  </svg>
                  專業產品諮詢
                </div>
                <div className="flex items-center text-green-700">
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                  </svg>
                  客製化優惠方案
                </div>
                <div className="flex items-center text-green-700">
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                  </svg>
                  免費到府試躺
                </div>
              </div>
            </div>

            {/* Payment Methods Section */}
            <div>
              <h3 className="text-lg font-semibold mb-4">可用付款方式</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="border rounded-lg p-4 flex items-center space-x-3">
                  <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                    <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"></path>
                    </svg>
                  </div>
                  <div>
                    <h4 className="font-medium">信用卡付款</h4>
                    <p className="text-sm text-muted-foreground">Visa、Mastercard、JCB</p>
                  </div>
                </div>

                <div className="border rounded-lg p-4 flex items-center space-x-3">
                  <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                    <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1"></path>
                    </svg>
                  </div>
                  <div>
                    <h4 className="font-medium">銀行轉帳</h4>
                    <p className="text-sm text-muted-foreground">ATM 轉帳、網路銀行</p>
                  </div>
                </div>

                <div className="border rounded-lg p-4 flex items-center space-x-3">
                  <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
                    <svg className="w-5 h-5 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z"></path>
                    </svg>
                  </div>
                  <div>
                    <h4 className="font-medium">貨到付款</h4>
                    <p className="text-sm text-muted-foreground">現金付款給配送人員</p>
                  </div>
                </div>

                <div className="border rounded-lg p-4 flex items-center space-x-3">
                  <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                    <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 14l6-6m-5.5.5h.01m4.99 5h.01M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16l3.5-2 3.5 2 3.5-2 3.5 2zM10 8.5a.5.5 0 11-1 0 .5.5 0 011 0zm5 5a.5.5 0 11-1 0 .5.5 0 011 0z"></path>
                    </svg>
                  </div>
                  <div>
                    <h4 className="font-medium">分期付款</h4>
                    <p className="text-sm text-muted-foreground">信用卡分期、無息分期</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Special Offers */}
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
              <div className="flex items-start space-x-3">
                <div className="w-8 h-8 bg-amber-500 rounded-full flex items-center justify-center flex-shrink-0">
                  <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                  </svg>
                </div>
                <div>
                  <h4 className="font-medium text-amber-800 mb-1">特別優惠</h4>
                  <p className="text-sm text-amber-700 mb-2">
                    透過 Line@ 客服諮詢，享有以下專屬優惠：
                  </p>
                  <ul className="text-sm text-amber-700 space-y-1">
                    <li>• 床墊優惠價格諮詢</li>
                    <li>• 免費到府試躺服務</li>
                    <li>• 客製化分期付款方案</li>
                    <li>• 舊床回收折抵優惠</li>
                  </ul>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </TabsContent>

      {/* Security Settings Tab */}
      <TabsContent value="security" className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>安全設定</CardTitle>
            <CardDescription>管理您的帳號安全與登入設定</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div>
                  <h4 className="font-medium">變更密碼</h4>
                  <p className="text-sm text-muted-foreground">更新您的帳號密碼</p>
                </div>
                <Button variant="outline" id="change-password-btn">
                  變更密碼
                </Button>
              </div>
              
              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 flex items-center justify-center">
                    <svg className="w-6 h-6" viewBox="0 0 24 24">
                      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                    </svg>
                  </div>
                  <div>
                    <h4 className="font-medium">社群帳號連結</h4>
                    <p className="text-sm text-muted-foreground">管理您的 Google 登入連結</p>
                  </div>
                </div>
                <div id="social-connections">
                  <Badge variant="secondary" className="bg-green-100 text-green-800 border-green-200">
                    <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 24 24">
                      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                    </svg>
                    Google 已連結
                  </Badge>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Change Password Modal */}
        <div id="password-modal" className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center hidden">
          <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">變更密碼</h3>
              <Button id="close-password-modal" variant="ghost" className="p-2">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
                </svg>
              </Button>
            </div>

            <form id="password-form" className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="current-password">目前密碼 *</Label>
                <Input
                  id="current-password"
                  name="currentPassword"
                  type="password"
                  required
                  placeholder="請輸入目前密碼"
                />
                <div id="current-password-error" className="text-sm text-destructive hidden"></div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="new-password">新密碼 *</Label>
                <Input
                  id="new-password"
                  name="newPassword"
                  type="password"
                  required
                  placeholder="請輸入新密碼"
                />
                <div id="new-password-error" className="text-sm text-destructive hidden"></div>
                <p className="text-xs text-muted-foreground">密碼須包含至少 8 個字符，包括大小寫字母和數字</p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirm-password">確認新密碼 *</Label>
                <Input
                  id="confirm-password"
                  name="confirmPassword"
                  type="password"
                  required
                  placeholder="請再次輸入新密碼"
                />
                <div id="confirm-password-error" className="text-sm text-destructive hidden"></div>
              </div>

              <div id="password-form-message" className="hidden p-3 rounded border text-sm"></div>

              <div className="flex gap-3 pt-4">
                <Button type="submit" id="save-password-btn" className="flex-1">
                  <span id="save-password-text">更新密碼</span>
                  <div id="save-password-spinner" className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin ml-2 hidden"></div>
                </Button>
                <Button type="button" id="cancel-password-btn" variant="outline">
                  取消
                </Button>
              </div>
            </form>
          </div>
        </div>
      </TabsContent>
    </Tabs>
  );
}
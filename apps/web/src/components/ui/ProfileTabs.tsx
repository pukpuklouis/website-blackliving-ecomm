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
            <div id="addresses-list" className="space-y-4">
              <div className="text-center py-12 text-muted-foreground">
                <svg className="w-12 h-12 mx-auto mb-4 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"></path>
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"></path>
                </svg>
                <p>尚未新增任何地址</p>
                <p className="text-sm">新增地址以便快速結帳</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </TabsContent>

      {/* Payment Methods Tab */}
      <TabsContent value="payment" className="space-y-6">
        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <div>
                <CardTitle>付款方式</CardTitle>
                <CardDescription>管理您的付款方式，快速安全結帳</CardDescription>
              </div>
              <Button id="add-payment-btn">
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4"></path>
                </svg>
                新增付款方式
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div id="payment-methods-list" className="space-y-4">
              <div className="text-center py-12 text-muted-foreground">
                <svg className="w-12 h-12 mx-auto mb-4 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"></path>
                </svg>
                <p>尚未新增任何付款方式</p>
                <p className="text-sm">新增信用卡或其他付款方式</p>
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
                <div>
                  <h4 className="font-medium">社群帳號連結</h4>
                  <p className="text-sm text-muted-foreground">管理您的 Google 登入連結</p>
                </div>
                <div id="social-connections">
                  <Badge variant="secondary">Google 已連結</Badge>
                </div>
              </div>
              
              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div>
                  <h4 className="font-medium">登入記錄</h4>
                  <p className="text-sm text-muted-foreground">查看最近的登入活動</p>
                </div>
                <Button variant="outline" id="login-history-btn">
                  查看記錄
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </TabsContent>
    </Tabs>
  );
}
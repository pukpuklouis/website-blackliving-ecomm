import { useState, useEffect } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Button,
  Input,
  Label,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Textarea,
  Switch,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
  Badge,
  Separator,
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@blackliving/ui';
// Tree-shakable Lucide imports
import Settings from '@lucide/react/settings';
import Users from '@lucide/react/users';
import Globe from '@lucide/react/globe';
import CreditCard from '@lucide/react/credit-card';
import Shield from '@lucide/react/shield';
import Save from '@lucide/react/save';
import RefreshCw from '@lucide/react/refresh-cw';
import AlertTriangle from '@lucide/react/alert-triangle';
import CheckCircle from '@lucide/react/check-circle';
import { toast } from 'sonner';
import { useEnvironment } from '../contexts/EnvironmentContext';

interface AdminUser {
  id: string;
  email: string;
  name: string;
  role: 'super_admin' | 'admin' | 'editor' | 'viewer';
  lastLogin?: Date;
  createdAt: Date;
}

interface WebsiteSettings {
  siteTitle: string;
  siteDescription: string;
  contactEmail: string;
  contactPhone: string;
  businessHours: string;
  address: string;
  socialLinks: {
    facebook?: string;
    instagram?: string;
    line?: string;
  };
}

interface PaymentSettings {
  bankAccounts: Array<{
    id: string;
    bankName: string;
    accountNumber: string;
    accountHolder: string;
    isActive: boolean;
  }>;
  paymentGateways: Array<{
    id: string;
    provider: string;
    isActive: boolean;
    config: Record<string, any>;
  }>;
}

interface LogisticsSettings {
  shippingMethods: Array<{
    id: string;
    name: string;
    carrier: string;
    price: number;
    estimatedDays: number;
    isActive: boolean;
  }>;
  warehouseAddress: string;
  returnPolicy: string;
}

interface AuditLog {
  id: string;
  userId: string;
  userEmail: string;
  action: string;
  resource: string;
  oldValue?: any;
  newValue?: any;
  timestamp: Date;
  ipAddress: string;
}

export default function SettingsManagement() {
  const { PUBLIC_API_URL } = useEnvironment();
  const API_BASE = PUBLIC_API_URL;

  // State management
  const [activeTab, setActiveTab] = useState('permissions');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Permissions state
  const [adminUsers, setAdminUsers] = useState<AdminUser[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);

  // Website settings state
  const [websiteSettings, setWebsiteSettings] = useState<WebsiteSettings>({
    siteTitle: '',
    siteDescription: '',
    contactEmail: '',
    contactPhone: '',
    businessHours: '',
    address: '',
    socialLinks: {},
  });

  // Payment & Logistics settings state
  const [paymentSettings, setPaymentSettings] = useState<PaymentSettings>({
    bankAccounts: [],
    paymentGateways: [],
  });

  const [logisticsSettings, setLogisticsSettings] = useState<LogisticsSettings>({
    shippingMethods: [],
    warehouseAddress: '',
    returnPolicy: '',
  });

  // Load all settings on mount
  useEffect(() => {
    loadAllSettings();
  }, []);

  const loadAllSettings = async () => {
    try {
      setLoading(true);
      await Promise.all([
        loadAdminUsers(),
        loadWebsiteSettings(),
        loadPaymentSettings(),
        loadLogisticsSettings(),
        loadAuditLogs(),
      ]);
    } catch (error) {
      console.error('Failed to load settings:', error);
      toast.error('載入設定失敗');
    } finally {
      setLoading(false);
    }
  };

  const loadAdminUsers = async () => {
    try {
      const response = await fetch(`${API_BASE}/api/admin/settings/admin-users`, {
        credentials: 'include',
      });
      if (response.ok) {
        const result = await response.json();
        setAdminUsers(result.data || []);
      }
    } catch (error) {
      console.error('Failed to load admin users:', error);
    }
  };

  const loadWebsiteSettings = async () => {
    try {
      const response = await fetch(`${API_BASE}/api/admin/settings/website`, {
        credentials: 'include',
      });
      if (response.ok) {
        const result = await response.json();
        setWebsiteSettings(result.data || websiteSettings);
      }
    } catch (error) {
      console.error('Failed to load website settings:', error);
    }
  };

  const loadPaymentSettings = async () => {
    try {
      const response = await fetch(`${API_BASE}/api/admin/settings/payment`, {
        credentials: 'include',
      });
      if (response.ok) {
        const result = await response.json();
        setPaymentSettings(result.data || paymentSettings);
      }
    } catch (error) {
      console.error('Failed to load payment settings:', error);
    }
  };

  const loadLogisticsSettings = async () => {
    try {
      const response = await fetch(`${API_BASE}/api/admin/settings/logistics`, {
        credentials: 'include',
      });
      if (response.ok) {
        const result = await response.json();
        setLogisticsSettings(result.data || logisticsSettings);
      }
    } catch (error) {
      console.error('Failed to load logistics settings:', error);
    }
  };

  const loadAuditLogs = async () => {
    try {
      const response = await fetch(`${API_BASE}/api/admin/settings/audit-logs?limit=50`, {
        credentials: 'include',
      });
      if (response.ok) {
        const result = await response.json();
        setAuditLogs(result.data || []);
      }
    } catch (error) {
      console.error('Failed to load audit logs:', error);
    }
  };

  // Save functions
  const saveWebsiteSettings = async () => {
    try {
      setSaving(true);
      const response = await fetch(`${API_BASE}/api/admin/settings/website`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(websiteSettings),
      });

      if (response.ok) {
        toast.success('網站設定已儲存');
        await loadAuditLogs(); // Refresh audit logs
      } else {
        throw new Error('Failed to save website settings');
      }
    } catch (error) {
      console.error('Failed to save website settings:', error);
      toast.error('儲存網站設定失敗');
    } finally {
      setSaving(false);
    }
  };

  const savePaymentSettings = async () => {
    try {
      setSaving(true);
      const response = await fetch(`${API_BASE}/api/admin/settings/payment`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(paymentSettings),
      });

      if (response.ok) {
        toast.success('支付設定已儲存');
        await loadAuditLogs();
      } else {
        throw new Error('Failed to save payment settings');
      }
    } catch (error) {
      console.error('Failed to save payment settings:', error);
      toast.error('儲存支付設定失敗');
    } finally {
      setSaving(false);
    }
  };

  const saveLogisticsSettings = async () => {
    try {
      setSaving(true);
      const response = await fetch(`${API_BASE}/api/admin/settings/logistics`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(logisticsSettings),
      });

      if (response.ok) {
        toast.success('物流設定已儲存');
        await loadAuditLogs();
      } else {
        throw new Error('Failed to save logistics settings');
      }
    } catch (error) {
      console.error('Failed to save logistics settings:', error);
      toast.error('儲存物流設定失敗');
    } finally {
      setSaving(false);
    }
  };

  const updateUserRole = async (userId: string, newRole: AdminUser['role']) => {
    try {
      const response = await fetch(`${API_BASE}/api/admin/settings/admin-users/${userId}/role`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ role: newRole }),
      });

      if (response.ok) {
        toast.success('使用者權限已更新');
        await loadAdminUsers();
        await loadAuditLogs();
      } else {
        throw new Error('Failed to update user role');
      }
    } catch (error) {
      console.error('Failed to update user role:', error);
      toast.error('更新使用者權限失敗');
    }
  };

  const removeAdminUser = async (userId: string) => {
    try {
      const response = await fetch(`${API_BASE}/api/admin/settings/admin-users/${userId}`, {
        method: 'DELETE',
        credentials: 'include',
      });

      if (response.ok) {
        toast.success('管理員權限已移除');
        await loadAdminUsers();
        await loadAuditLogs();
      } else {
        throw new Error('Failed to remove admin user');
      }
    } catch (error) {
      console.error('Failed to remove admin user:', error);
      toast.error('移除管理員權限失敗');
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div className="h-7 w-40 bg-gray-200 rounded animate-pulse" />
          <div className="h-9 w-28 bg-gray-200 rounded animate-pulse" />
        </div>
        <div className="space-y-3">
          <div className="h-10 w-full bg-gray-200 rounded animate-pulse" />
          <div className="h-72 w-full bg-gray-200 rounded animate-pulse" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-foreground">系統設定</h1>
          <p className="text-foreground/60 mt-2">管理系統配置、權限和營運設定</p>
        </div>
        <Button onClick={loadAllSettings} disabled={loading}>
          <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
          重新載入
        </Button>
      </div>

      {/* Settings Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="permissions" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            權限管理
          </TabsTrigger>
          <TabsTrigger value="website" className="flex items-center gap-2">
            <Globe className="h-4 w-4" />
            網站設定
          </TabsTrigger>
          <TabsTrigger value="payment" className="flex items-center gap-2">
            <CreditCard className="h-4 w-4" />
            支付設定
          </TabsTrigger>
          <TabsTrigger value="logistics" className="flex items-center gap-2">
            <Settings className="h-4 w-4" />
            物流設定
          </TabsTrigger>
          <TabsTrigger value="audit" className="flex items-center gap-2">
            <Shield className="h-4 w-4" />
            稽核日誌
          </TabsTrigger>
        </TabsList>

        {/* Permissions Tab */}
        <TabsContent value="permissions" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                管理員權限管理
              </CardTitle>
              <CardDescription>
                管理系統管理員的使用者權限和角色分配
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>使用者</TableHead>
                    <TableHead>角色</TableHead>
                    <TableHead>最後登入</TableHead>
                    <TableHead>建立時間</TableHead>
                    <TableHead>操作</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {adminUsers.map((user) => (
                    <TableRow key={user.id}>
                      <TableCell>
                        <div>
                          <div className="font-medium">{user.name}</div>
                          <div className="text-sm text-muted-foreground">{user.email}</div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Select
                          value={user.role}
                          onValueChange={(value: AdminUser['role']) => updateUserRole(user.id, value)}
                        >
                          <SelectTrigger className="w-32">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="super_admin">超級管理員</SelectItem>
                            <SelectItem value="admin">管理員</SelectItem>
                            <SelectItem value="editor">編輯者</SelectItem>
                            <SelectItem value="viewer">檢視者</SelectItem>
                          </SelectContent>
                        </Select>
                      </TableCell>
                      <TableCell>
                        {user.lastLogin ? new Date(user.lastLogin).toLocaleString('zh-TW') : '從未登入'}
                      </TableCell>
                      <TableCell>
                        {new Date(user.createdAt).toLocaleString('zh-TW')}
                      </TableCell>
                      <TableCell>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="destructive" size="sm">
                              移除權限
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle className="flex items-center gap-2">
                                <AlertTriangle className="h-5 w-5 text-red-500" />
                                確認移除管理員權限
                              </AlertDialogTitle>
                              <AlertDialogDescription>
                                確定要移除 {user.name} 的管理員權限嗎？此操作將記錄在稽核日誌中。
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>取消</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() => removeAdminUser(user.id)}
                                className="bg-red-600 hover:bg-red-700"
                              >
                                確認移除
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Website Settings Tab */}
        <TabsContent value="website" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Globe className="h-5 w-5" />
                網站基本設定
              </CardTitle>
              <CardDescription>
                管理網站標題、聯絡資訊和營業時間等基本資訊
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="siteTitle">網站標題 *</Label>
                  <Input
                    id="siteTitle"
                    value={websiteSettings.siteTitle}
                    onChange={(e) => setWebsiteSettings(prev => ({ ...prev, siteTitle: e.target.value }))}
                    placeholder="Black Living 寢具精品"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="contactEmail">聯絡信箱 *</Label>
                  <Input
                    id="contactEmail"
                    type="email"
                    value={websiteSettings.contactEmail}
                    onChange={(e) => setWebsiteSettings(prev => ({ ...prev, contactEmail: e.target.value }))}
                    placeholder="service@blackliving.com.tw"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="siteDescription">網站描述</Label>
                <Textarea
                  id="siteDescription"
                  value={websiteSettings.siteDescription}
                  onChange={(e) => setWebsiteSettings(prev => ({ ...prev, siteDescription: e.target.value }))}
                  rows={3}
                  placeholder="台灣頂級寢具品牌，提供高品質床墊、寢具配件等產品..."
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="contactPhone">聯絡電話</Label>
                  <Input
                    id="contactPhone"
                    value={websiteSettings.contactPhone}
                    onChange={(e) => setWebsiteSettings(prev => ({ ...prev, contactPhone: e.target.value }))}
                    placeholder="02-1234-5678"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="businessHours">營業時間</Label>
                  <Input
                    id="businessHours"
                    value={websiteSettings.businessHours}
                    onChange={(e) => setWebsiteSettings(prev => ({ ...prev, businessHours: e.target.value }))}
                    placeholder="週一至週五 09:00-18:00"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="address">地址</Label>
                <Textarea
                  id="address"
                  value={websiteSettings.address}
                  onChange={(e) => setWebsiteSettings(prev => ({ ...prev, address: e.target.value }))}
                  rows={2}
                  placeholder="台北市中山區..."
                />
              </div>

              <Separator />

              <div className="space-y-4">
                <h4 className="font-medium">社群媒體連結</h4>
                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="facebook">Facebook</Label>
                    <Input
                      id="facebook"
                      value={websiteSettings.socialLinks.facebook || ''}
                      onChange={(e) => setWebsiteSettings(prev => ({
                        ...prev,
                        socialLinks: { ...prev.socialLinks, facebook: e.target.value }
                      }))}
                      placeholder="https://facebook.com/blackliving"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="instagram">Instagram</Label>
                    <Input
                      id="instagram"
                      value={websiteSettings.socialLinks.instagram || ''}
                      onChange={(e) => setWebsiteSettings(prev => ({
                        ...prev,
                        socialLinks: { ...prev.socialLinks, instagram: e.target.value }
                      }))}
                      placeholder="https://instagram.com/blackliving"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="line">LINE</Label>
                    <Input
                      id="line"
                      value={websiteSettings.socialLinks.line || ''}
                      onChange={(e) => setWebsiteSettings(prev => ({
                        ...prev,
                        socialLinks: { ...prev.socialLinks, line: e.target.value }
                      }))}
                      placeholder="@blackliving"
                    />
                  </div>
                </div>
              </div>

              <div className="flex justify-end">
                <Button onClick={saveWebsiteSettings} disabled={saving}>
                  <Save className="h-4 w-4 mr-2" />
                  {saving ? '儲存中...' : '儲存設定'}
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Payment Settings Tab */}
        <TabsContent value="payment" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="h-5 w-5" />
                支付設定
              </CardTitle>
              <CardDescription>
                管理銀行帳戶和支付閘道設定
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <h4 className="font-medium">銀行帳戶</h4>
                {paymentSettings.bankAccounts.length === 0 ? (
                  <p className="text-muted-foreground">尚未設定銀行帳戶</p>
                ) : (
                  <div className="space-y-2">
                    {paymentSettings.bankAccounts.map((account) => (
                      <div key={account.id} className="flex items-center justify-between p-3 border rounded">
                        <div>
                          <div className="font-medium">{account.bankName}</div>
                          <div className="text-sm text-muted-foreground">
                            {account.accountHolder} - {account.accountNumber}
                          </div>
                        </div>
                        <Badge variant={account.isActive ? 'secondary' : 'outline'}>
                          {account.isActive ? '啟用' : '停用'}
                        </Badge>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <Separator />

              <div className="space-y-4">
                <h4 className="font-medium">支付閘道</h4>
                {paymentSettings.paymentGateways.length === 0 ? (
                  <p className="text-muted-foreground">尚未設定支付閘道</p>
                ) : (
                  <div className="space-y-2">
                    {paymentSettings.paymentGateways.map((gateway) => (
                      <div key={gateway.id} className="flex items-center justify-between p-3 border rounded">
                        <div>
                          <div className="font-medium">{gateway.provider}</div>
                          <div className="text-sm text-muted-foreground">
                            設定項目: {Object.keys(gateway.config).length} 項
                          </div>
                        </div>
                        <Badge variant={gateway.isActive ? 'secondary' : 'outline'}>
                          {gateway.isActive ? '啟用' : '停用'}
                        </Badge>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="flex justify-end">
                <Button onClick={savePaymentSettings} disabled={saving}>
                  <Save className="h-4 w-4 mr-2" />
                  {saving ? '儲存中...' : '儲存設定'}
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Logistics Settings Tab */}
        <TabsContent value="logistics" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5" />
                物流設定
              </CardTitle>
              <CardDescription>
                管理運送方式和倉庫設定
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <h4 className="font-medium">運送方式</h4>
                {logisticsSettings.shippingMethods.length === 0 ? (
                  <p className="text-muted-foreground">尚未設定運送方式</p>
                ) : (
                  <div className="space-y-2">
                    {logisticsSettings.shippingMethods.map((method) => (
                      <div key={method.id} className="flex items-center justify-between p-3 border rounded">
                        <div>
                          <div className="font-medium">{method.name}</div>
                          <div className="text-sm text-muted-foreground">
                            {method.carrier} - NT${method.price} - {method.estimatedDays} 天
                          </div>
                        </div>
                        <Badge variant={method.isActive ? 'secondary' : 'outline'}>
                          {method.isActive ? '啟用' : '停用'}
                        </Badge>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <Separator />

              <div className="space-y-4">
                <h4 className="font-medium">倉庫資訊</h4>
                <div className="space-y-2">
                  <Label htmlFor="warehouseAddress">倉庫地址</Label>
                  <Textarea
                    id="warehouseAddress"
                    value={logisticsSettings.warehouseAddress}
                    onChange={(e) => setLogisticsSettings(prev => ({ ...prev, warehouseAddress: e.target.value }))}
                    rows={3}
                    placeholder="倉庫地址..."
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="returnPolicy">退貨政策</Label>
                  <Textarea
                    id="returnPolicy"
                    value={logisticsSettings.returnPolicy}
                    onChange={(e) => setLogisticsSettings(prev => ({ ...prev, returnPolicy: e.target.value }))}
                    rows={4}
                    placeholder="退貨政策說明..."
                  />
                </div>
              </div>

              <div className="flex justify-end">
                <Button onClick={saveLogisticsSettings} disabled={saving}>
                  <Save className="h-4 w-4 mr-2" />
                  {saving ? '儲存中...' : '儲存設定'}
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Audit Tab */}
        <TabsContent value="audit" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                設定變更稽核日誌
              </CardTitle>
              <CardDescription>
                查看所有設定變更的歷史記錄和安全事件
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>時間</TableHead>
                    <TableHead>使用者</TableHead>
                    <TableHead>操作</TableHead>
                    <TableHead>資源</TableHead>
                    <TableHead>IP 位址</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {auditLogs.map((log) => (
                    <TableRow key={log.id}>
                      <TableCell>
                        {new Date(log.timestamp).toLocaleString('zh-TW')}
                      </TableCell>
                      <TableCell>
                        <div>
                          <div className="font-medium">{log.userEmail}</div>
                          <div className="text-sm text-muted-foreground">ID: {log.userId}</div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{log.action}</Badge>
                      </TableCell>
                      <TableCell>{log.resource}</TableCell>
                      <TableCell className="font-mono text-sm">{log.ipAddress}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
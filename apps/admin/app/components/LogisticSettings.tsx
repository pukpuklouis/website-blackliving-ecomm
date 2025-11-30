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
    Separator,
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@blackliving/ui';
import { Settings, Save, Plus, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { useEnvironment } from '../contexts/EnvironmentContext';

interface RemoteZone {
    id: string;
    city: string;
    district?: string;
    surcharge: number;
}

interface LogisticsSettings {
    baseFee: number;
    freeShippingThreshold: number;
    remoteZones: RemoteZone[];
}

export default function LogisticSettings() {
    const { PUBLIC_API_URL } = useEnvironment();
    const API_BASE = PUBLIC_API_URL;

    const [settings, setSettings] = useState<LogisticsSettings>({
        baseFee: 0,
        freeShippingThreshold: 0,
        remoteZones: [],
    });
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        loadSettings();
    }, []);

    const loadSettings = async () => {
        try {
            setLoading(true);
            const response = await fetch(`${API_BASE}/api/settings/logistic_settings`, {
                credentials: 'include',
            });
            if (response.ok) {
                const result = await response.json();
                setSettings(result.data || {
                    baseFee: 0,
                    freeShippingThreshold: 0,
                    remoteZones: [],
                });
            } else if (response.status === 404) {
                setSettings({
                    baseFee: 150,
                    freeShippingThreshold: 3000,
                    remoteZones: [],
                });
            }
        } catch (error) {
            console.error('Failed to load logistics settings:', error);
            toast.error('載入物流設定失敗');
        } finally {
            setLoading(false);
        }
    };

    const saveSettings = async () => {
        try {
            setSaving(true);
            const response = await fetch(`${API_BASE}/api/settings/logistic_settings`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify(settings),
            });

            if (response.ok) {
                toast.success('物流設定已儲存');
            } else {
                throw new Error('Failed to save settings');
            }
        } catch (error) {
            console.error('Failed to save logistics settings:', error);
            toast.error('儲存物流設定失敗');
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return <div className="p-8 text-center">載入中...</div>;
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <Settings className="h-5 w-5" />
                    物流設定
                </CardTitle>
                <CardDescription>
                    管理運費計算規則與偏遠地區加價
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
                <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <Label htmlFor="baseFee">基本運費 (NT$)</Label>
                        <Input
                            id="baseFee"
                            type="number"
                            min="0"
                            value={settings.baseFee}
                            onChange={(e) => setSettings(prev => ({ ...prev, baseFee: parseInt(e.target.value) || 0 }))}
                        />
                        <p className="text-sm text-muted-foreground">未達免運門檻時的運費</p>
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="freeShippingThreshold">免運門檻 (NT$)</Label>
                        <Input
                            id="freeShippingThreshold"
                            type="number"
                            min="0"
                            value={settings.freeShippingThreshold}
                            onChange={(e) => setSettings(prev => ({ ...prev, freeShippingThreshold: parseInt(e.target.value) || 0 }))}
                        />
                        <p className="text-sm text-muted-foreground">訂單金額達到此門檻即享免運</p>
                    </div>
                </div>

                <Separator />

                <div className="space-y-4">
                    <div className="flex justify-between items-center">
                        <div>
                            <h4 className="font-medium">偏遠地區加價</h4>
                            <p className="text-sm text-muted-foreground">設定特定區域的額外運費（即使達免運門檻仍需收取）</p>
                        </div>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                                const newZone: RemoteZone = {
                                    id: crypto.randomUUID(),
                                    city: '',
                                    district: '',
                                    surcharge: 0
                                };
                                setSettings(prev => ({
                                    ...prev,
                                    remoteZones: [...prev.remoteZones, newZone]
                                }));
                            }}
                        >
                            <Plus className="h-4 w-4 mr-2" />
                            新增區域
                        </Button>
                    </div>

                    {settings.remoteZones.length === 0 ? (
                        <div className="text-center py-8 border-2 border-dashed rounded-lg text-muted-foreground">
                            尚未設定偏遠地區
                        </div>
                    ) : (
                        <div className="border rounded-lg overflow-hidden">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>縣市</TableHead>
                                        <TableHead>區域 (選填)</TableHead>
                                        <TableHead>加收運費 (NT$)</TableHead>
                                        <TableHead className="w-[100px]">操作</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {settings.remoteZones.map((zone, index) => (
                                        <TableRow key={zone.id}>
                                            <TableCell>
                                                <Input
                                                    value={zone.city}
                                                    onChange={(e) => {
                                                        const newZones = [...settings.remoteZones];
                                                        newZones[index].city = e.target.value;
                                                        setSettings(prev => ({ ...prev, remoteZones: newZones }));
                                                    }}
                                                    placeholder="例如：花蓮縣"
                                                />
                                            </TableCell>
                                            <TableCell>
                                                <Input
                                                    value={zone.district || ''}
                                                    onChange={(e) => {
                                                        const newZones = [...settings.remoteZones];
                                                        newZones[index].district = e.target.value;
                                                        setSettings(prev => ({ ...prev, remoteZones: newZones }));
                                                    }}
                                                    placeholder="例如：秀林鄉"
                                                />
                                            </TableCell>
                                            <TableCell>
                                                <Input
                                                    type="number"
                                                    min="0"
                                                    value={zone.surcharge}
                                                    onChange={(e) => {
                                                        const newZones = [...settings.remoteZones];
                                                        newZones[index].surcharge = parseInt(e.target.value) || 0;
                                                        setSettings(prev => ({ ...prev, remoteZones: newZones }));
                                                    }}
                                                />
                                            </TableCell>
                                            <TableCell>
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    className="text-red-500 hover:text-red-700 hover:bg-red-50"
                                                    onClick={() => {
                                                        const newZones = settings.remoteZones.filter(z => z.id !== zone.id);
                                                        setSettings(prev => ({ ...prev, remoteZones: newZones }));
                                                    }}
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                </Button>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </div>
                    )}
                </div>

                <div className="flex justify-end">
                    <Button onClick={saveSettings} disabled={saving}>
                        <Save className="h-4 w-4 mr-2" />
                        {saving ? '儲存中...' : '儲存設定'}
                    </Button>
                </div>
            </CardContent>
        </Card>
    );
}

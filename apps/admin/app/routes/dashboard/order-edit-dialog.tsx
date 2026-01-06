import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  Button,
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  Input,
  Label,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
  Textarea,
} from "@blackliving/ui";
import { useState } from "react";
import type { Order } from "./order-details-dialog";

type OrderEditDialogProps = {
  order: Order | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (orderId: string, data: OrderEditData) => Promise<void>;
};

type OrderEditData = {
  customerInfo?: {
    name: string;
    email: string;
    phone: string;
  };
  shippingAddress?: {
    name: string;
    phone: string;
    address: string;
    city: string;
    district: string;
    postalCode: string;
  };
  adminNotes?: string;
  trackingNumber?: string;
  shippingCompany?: string;
  notes?: string;
};

export function OrderEditDialog({
  order,
  open,
  onOpenChange,
  onSave,
}: OrderEditDialogProps) {
  const [saving, setSaving] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  // Customer info state
  const [customerName, setCustomerName] = useState("");
  const [customerEmail, setCustomerEmail] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");

  // Shipping address state
  const [shippingName, setShippingName] = useState("");
  const [shippingPhone, setShippingPhone] = useState("");
  const [shippingAddress, setShippingAddress] = useState("");
  const [shippingCity, setShippingCity] = useState("");
  const [shippingDistrict, setShippingDistrict] = useState("");
  const [shippingPostalCode, setShippingPostalCode] = useState("");

  // Other state
  const [trackingNumber, setTrackingNumber] = useState("");
  const [shippingCompany, setShippingCompany] = useState("");
  const [adminNotes, setAdminNotes] = useState("");
  const [notes, setNotes] = useState("");

  // Initialize form when order changes
  const initializeForm = () => {
    if (order) {
      setCustomerName(order.customerInfo.name);
      setCustomerEmail(order.customerInfo.email);
      setCustomerPhone(order.customerInfo.phone);

      if (order.shippingAddress) {
        setShippingName(order.shippingAddress.name);
        setShippingPhone(order.shippingAddress.phone);
        setShippingAddress(order.shippingAddress.address);
        setShippingCity(order.shippingAddress.city);
        setShippingDistrict(order.shippingAddress.district);
        setShippingPostalCode(order.shippingAddress.postalCode);
      }

      setTrackingNumber(order.trackingNumber ?? "");
      setShippingCompany(order.shippingCompany ?? "");
      setAdminNotes(order.adminNotes ?? "");
      setNotes(order.notes ?? "");
    }
  };

  // Handle dialog open state change
  const handleOpenChange = (newOpen: boolean) => {
    if (newOpen) {
      initializeForm();
    }
    onOpenChange(newOpen);
  };

  const handleSave = async () => {
    if (!order) {
      return;
    }

    setSaving(true);
    try {
      const data: OrderEditData = {
        customerInfo: {
          name: customerName,
          email: customerEmail,
          phone: customerPhone,
        },
        shippingAddress: {
          name: shippingName,
          phone: shippingPhone,
          address: shippingAddress,
          city: shippingCity,
          district: shippingDistrict,
          postalCode: shippingPostalCode,
        },
        adminNotes,
        trackingNumber,
        shippingCompany,
        notes,
      };

      await onSave(order.id, data);
      onOpenChange(false);
    } finally {
      setSaving(false);
    }
  };

  if (!order) {
    return null;
  }

  return (
    <>
      <Dialog onOpenChange={handleOpenChange} open={open}>
        <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto">
          <DialogHeader>
            <DialogTitle>編輯訂單 - {order.orderNumber}</DialogTitle>
          </DialogHeader>

          <Tabs className="w-full" defaultValue="customer">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="customer">客戶資訊</TabsTrigger>
              <TabsTrigger value="shipping">配送資訊</TabsTrigger>
              <TabsTrigger value="notes">備註</TabsTrigger>
            </TabsList>

            {/* Customer Info Tab */}
            <TabsContent className="space-y-4" value="customer">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="customerName">客戶姓名</Label>
                  <Input
                    id="customerName"
                    onChange={(e) => setCustomerName(e.target.value)}
                    value={customerName}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="customerEmail">電子郵件</Label>
                  <Input
                    id="customerEmail"
                    onChange={(e) => setCustomerEmail(e.target.value)}
                    type="email"
                    value={customerEmail}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="customerPhone">電話</Label>
                  <Input
                    id="customerPhone"
                    onChange={(e) => setCustomerPhone(e.target.value)}
                    value={customerPhone}
                  />
                </div>
              </div>
            </TabsContent>

            {/* Shipping Tab */}
            <TabsContent className="space-y-4" value="shipping">
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="shippingName">收件人姓名</Label>
                    <Input
                      id="shippingName"
                      onChange={(e) => setShippingName(e.target.value)}
                      value={shippingName}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="shippingPhone">收件人電話</Label>
                    <Input
                      id="shippingPhone"
                      onChange={(e) => setShippingPhone(e.target.value)}
                      value={shippingPhone}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="shippingAddress">地址</Label>
                  <Input
                    id="shippingAddress"
                    onChange={(e) => setShippingAddress(e.target.value)}
                    value={shippingAddress}
                  />
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="shippingCity">城市</Label>
                    <Input
                      id="shippingCity"
                      onChange={(e) => setShippingCity(e.target.value)}
                      value={shippingCity}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="shippingDistrict">區域</Label>
                    <Input
                      id="shippingDistrict"
                      onChange={(e) => setShippingDistrict(e.target.value)}
                      value={shippingDistrict}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="shippingPostalCode">郵遞區號</Label>
                    <Input
                      id="shippingPostalCode"
                      onChange={(e) => setShippingPostalCode(e.target.value)}
                      value={shippingPostalCode}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="shippingCompany">物流公司</Label>
                    <Input
                      id="shippingCompany"
                      onChange={(e) => setShippingCompany(e.target.value)}
                      placeholder="例：黑貓宅急便"
                      value={shippingCompany}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="trackingNumber">追蹤編號</Label>
                    <Input
                      id="trackingNumber"
                      onChange={(e) => setTrackingNumber(e.target.value)}
                      placeholder="輸入物流追蹤號碼"
                      value={trackingNumber}
                    />
                  </div>
                </div>
              </div>
            </TabsContent>

            {/* Notes Tab */}
            <TabsContent className="space-y-4" value="notes">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="notes">客戶備註</Label>
                  <Textarea
                    id="notes"
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="客戶留言或特殊需求"
                    rows={3}
                    value={notes}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="adminNotes">管理員備註</Label>
                  <Textarea
                    id="adminNotes"
                    onChange={(e) => setAdminNotes(e.target.value)}
                    placeholder="僅內部可見的備註"
                    rows={3}
                    value={adminNotes}
                  />
                </div>
              </div>
            </TabsContent>
          </Tabs>

          <DialogFooter>
            <Button onClick={() => onOpenChange(false)} variant="outline">
              取消
            </Button>
            <Button disabled={saving} onClick={() => setShowConfirm(true)}>
              {saving ? "儲存中..." : "儲存變更"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Save Confirmation Dialog */}
      <AlertDialog onOpenChange={setShowConfirm} open={showConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>確認儲存變更</AlertDialogTitle>
            <AlertDialogDescription>
              確定要儲存對訂單 {order.orderNumber} 的變更嗎？
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>取消</AlertDialogCancel>
            <AlertDialogAction onClick={handleSave}>確認儲存</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

export type { OrderEditData };

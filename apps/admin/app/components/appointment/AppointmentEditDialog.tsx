import {
  Button,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  Input,
  Label,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Switch,
  Textarea,
} from "@blackliving/ui";
import type { Appointment } from "../../routes/dashboard/types";

type AppointmentEditDialogProps = {
  appointment: Appointment | null;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  editFormData: Partial<Appointment>;
  setEditFormData: (data: Partial<Appointment>) => void;
  onSave: () => void;
};

export function AppointmentEditDialog({
  appointment,
  isOpen,
  onOpenChange,
  editFormData,
  setEditFormData,
  onSave,
}: AppointmentEditDialogProps) {
  if (!appointment) return null;

  return (
    <Dialog onOpenChange={onOpenChange} open={isOpen}>
      <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>編輯預約 - {appointment.appointmentNumber}</DialogTitle>
          <DialogDescription>修改預約資訊與管理備註</DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>客戶姓名</Label>
              <Input
                onChange={(e) =>
                  setEditFormData((prev) => ({
                    ...prev,
                    customerInfo: {
                      ...prev.customerInfo!,
                      name: e.target.value,
                    },
                  }))
                }
                value={editFormData.customerInfo?.name || ""}
              />
            </div>
            <div className="space-y-2">
              <Label>聯絡電話</Label>
              <Input
                onChange={(e) =>
                  setEditFormData((prev) => ({
                    ...prev,
                    customerInfo: {
                      ...prev.customerInfo!,
                      phone: e.target.value,
                    },
                  }))
                }
                value={editFormData.customerInfo?.phone || ""}
              />
            </div>
            <div className="space-y-2">
              <Label>Email</Label>
              <Input
                onChange={(e) =>
                  setEditFormData((prev) => ({
                    ...prev,
                    customerInfo: {
                      ...prev.customerInfo!,
                      email: e.target.value,
                    },
                  }))
                }
                value={editFormData.customerInfo?.email || ""}
              />
            </div>
            <div className="space-y-2">
              <Label>門市地點</Label>
              <Select
                onValueChange={(value: any) =>
                  setEditFormData((prev) => ({
                    ...prev,
                    storeLocation: value,
                  }))
                }
                value={editFormData.storeLocation}
              >
                <SelectTrigger>
                  <SelectValue placeholder="選擇門市" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="zhonghe">中和店</SelectItem>
                  <SelectItem value="zhongli">中壢店</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>預約日期</Label>
              <Input
                onChange={(e) =>
                  setEditFormData((prev) => ({
                    ...prev,
                    preferredDate: e.target.value,
                  }))
                }
                type="date"
                value={editFormData.preferredDate || ""}
              />
            </div>
            <div className="space-y-2">
              <Label>預約時段</Label>
              <Select
                onValueChange={(value: any) =>
                  setEditFormData((prev) => ({
                    ...prev,
                    preferredTime: value,
                  }))
                }
                value={editFormData.preferredTime}
              >
                <SelectTrigger>
                  <SelectValue placeholder="選擇時段" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="morning">上午</SelectItem>
                  <SelectItem value="afternoon">下午</SelectItem>
                  <SelectItem value="evening">晚上</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>服務人員</Label>
              <Input
                onChange={(e) =>
                  setEditFormData((prev) => ({
                    ...prev,
                    staffAssigned: e.target.value,
                  }))
                }
                placeholder="未指派"
                value={editFormData.staffAssigned || ""}
              />
            </div>
            <div className="space-y-2">
              <Label>狀態</Label>
              <Select
                onValueChange={(value: any) =>
                  setEditFormData((prev) => ({ ...prev, status: value }))
                }
                value={editFormData.status}
              >
                <SelectTrigger>
                  <SelectValue placeholder="選擇狀態" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pending">待確認</SelectItem>
                  <SelectItem value="confirmed">已確認</SelectItem>
                  <SelectItem value="completed">已完成</SelectItem>
                  <SelectItem value="cancelled">已取消</SelectItem>
                  <SelectItem value="no_show">未到場</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label>客戶備註</Label>
            <Textarea
              onChange={(e) =>
                setEditFormData((prev) => ({
                  ...prev,
                  notes: e.target.value,
                }))
              }
              value={editFormData.notes || ""}
            />
          </div>

          <div className="space-y-2">
            <Label>管理員備註</Label>
            <Textarea
              className="bg-blue-50/50"
              onChange={(e) =>
                setEditFormData((prev) => ({
                  ...prev,
                  adminNotes: e.target.value,
                }))
              }
              value={editFormData.adminNotes || ""}
            />
          </div>

          <div className="flex items-center space-x-2 pt-2">
            <Switch
              checked={editFormData.followUpRequired}
              id="followUp"
              onCheckedChange={(checked) =>
                setEditFormData((prev) => ({
                  ...prev,
                  followUpRequired: checked,
                }))
              }
            />
            <Label htmlFor="followUp">需要後續追蹤</Label>
          </div>

          {editFormData.followUpRequired && (
            <div className="space-y-2">
              <Label>追蹤備註</Label>
              <Textarea
                className="bg-amber-50/50"
                onChange={(e) =>
                  setEditFormData((prev) => ({
                    ...prev,
                    followUpNotes: e.target.value,
                  }))
                }
                value={editFormData.followUpNotes || ""}
              />
            </div>
          )}
        </div>

        <div className="flex justify-end gap-2">
          <Button onClick={() => onOpenChange(false)} variant="outline">
            取消
          </Button>
          <Button onClick={onSave}>儲存變更</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

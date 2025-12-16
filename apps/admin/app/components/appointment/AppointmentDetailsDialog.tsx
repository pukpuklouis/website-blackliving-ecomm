import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
  Badge,
  Button,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  Label,
  Switch,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@blackliving/ui";
import { Calendar, Clock, MapPin } from "@lucide/react";
import type { Appointment } from "../../routes/dashboard/types";
import {
  purposeLabels,
  statusColors,
  statusLabels,
  storeLabels,
  timeLabels,
} from "../../routes/dashboard/types";

type AppointmentDetailsDialogProps = {
  appointment: Appointment | null;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirmAppointment: (
    appointmentId: string,
    confirmedDateTime: string
  ) => void;
};

export function AppointmentDetailsDialog({
  appointment,
  isOpen,
  onOpenChange,
  onConfirmAppointment,
}: AppointmentDetailsDialogProps) {
  if (!appointment) {
    return null;
  }

  return (
    <Dialog onOpenChange={onOpenChange} open={isOpen}>
      <DialogContent className="max-h-[90vh] max-w-4xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>預約詳情 - {appointment.appointmentNumber}</DialogTitle>
          <DialogDescription>查看完整的預約資訊與服務狀態</DialogDescription>
        </DialogHeader>

        <Tabs className="w-full" defaultValue="details">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="details">預約資訊</TabsTrigger>
            <TabsTrigger value="service">服務記錄</TabsTrigger>
            <TabsTrigger value="followup">後續追蹤</TabsTrigger>
          </TabsList>

          <TabsContent className="space-y-4" value="details">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <h4 className="mb-2 font-medium">客戶資訊</h4>
                <div className="space-y-1 text-sm">
                  <p>
                    <span className="text-gray-600">姓名：</span>
                    {appointment.customerInfo?.name || "未知"}
                  </p>
                  <p>
                    <span className="text-gray-600">電話：</span>
                    {appointment.customerInfo.phone}
                  </p>
                  {appointment.customerInfo.email && (
                    <p>
                      <span className="text-gray-600">Email：</span>
                      {appointment.customerInfo.email}
                    </p>
                  )}
                </div>
              </div>
              <div>
                <h4 className="mb-2 font-medium">預約狀態</h4>
                <Badge
                  className={`text-white ${statusColors[appointment.status]}`}
                >
                  {statusLabels[appointment.status]}
                </Badge>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <h4 className="mb-2 font-medium">門市地點</h4>
                <Badge
                  className="flex w-fit items-center gap-1"
                  variant="outline"
                >
                  <MapPin className="h-3 w-3" />
                  {storeLabels[appointment.storeLocation]}
                </Badge>
              </div>
              <div>
                <h4 className="mb-2 font-medium">拜訪目的</h4>
                <Badge variant="secondary">
                  {purposeLabels[appointment.visitPurpose]}
                </Badge>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <h4 className="mb-2 font-medium">希望日期時間</h4>
                <div className="text-sm">
                  <p className="flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
                    {new Date(appointment.preferredDate).toLocaleDateString(
                      "zh-TW"
                    )}
                  </p>
                  <p className="mt-1 flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    {timeLabels[appointment.preferredTime]}
                  </p>
                </div>
              </div>
              <div>
                <h4 className="mb-2 font-medium">確認時間</h4>
                <p className="text-sm">
                  {appointment.confirmedDateTime
                    ? new Date(appointment.confirmedDateTime).toLocaleString(
                        "zh-TW"
                      )
                    : "尚未確認"}
                </p>
              </div>
            </div>

            {appointment.productInterest.length > 0 && (
              <div>
                <h4 className="mb-2 font-medium">感興趣的產品</h4>
                <div className="flex flex-wrap gap-2">
                  {appointment.productInterest.map((product, index) => (
                    <Badge key={`${product}-${index}`} variant="outline">
                      {product}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {appointment.notes && (
              <div>
                <h4 className="mb-2 font-medium">客戶備註</h4>
                <p className="rounded-lg bg-gray-50 p-3 text-gray-600 text-sm">
                  {appointment.notes}
                </p>
              </div>
            )}

            {appointment.adminNotes && (
              <div>
                <h4 className="mb-2 font-medium">管理員備註</h4>
                <p className="rounded-lg bg-blue-50 p-3 text-gray-600 text-sm">
                  {appointment.adminNotes}
                </p>
              </div>
            )}
          </TabsContent>

          <TabsContent className="space-y-4" value="service">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <h4 className="mb-2 font-medium">指派服務人員</h4>
                <p className="text-sm">
                  {appointment.staffAssigned || "尚未指派"}
                </p>
              </div>
              <div>
                <h4 className="mb-2 font-medium">實際到店時間</h4>
                <p className="text-sm">
                  {appointment.actualVisitTime
                    ? new Date(appointment.actualVisitTime).toLocaleString(
                        "zh-TW"
                      )
                    : "尚未到店"}
                </p>
              </div>
            </div>

            <div>
              <h4 className="mb-2 font-medium">完成時間</h4>
              <p className="text-sm">
                {appointment.completedAt
                  ? new Date(appointment.completedAt).toLocaleString("zh-TW")
                  : "尚未完成"}
              </p>
            </div>

            {appointment.status === "pending" && (
              <div className="flex justify-end">
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button>確認預約</Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>確認預約</AlertDialogTitle>
                      <AlertDialogDescription>
                        確定要確認這個預約嗎？請先與客戶聯繫確認時間。
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>取消</AlertDialogCancel>
                      <AlertDialogAction
                        onClick={() =>
                          onConfirmAppointment(
                            appointment.id,
                            appointment.preferredDate
                          )
                        }
                      >
                        確認預約
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            )}
          </TabsContent>

          <TabsContent className="space-y-4" value="followup">
            <div className="flex items-center space-x-2">
              <Switch checked={appointment.followUpRequired} disabled />
              <Label>需要後續追蹤</Label>
            </div>

            {appointment.followUpNotes && (
              <div>
                <h4 className="mb-2 font-medium">追蹤備註</h4>
                <p className="rounded-lg bg-amber-50 p-3 text-gray-600 text-sm">
                  {appointment.followUpNotes}
                </p>
              </div>
            )}

            <div className="text-gray-500 text-sm">
              <p>
                建立時間：
                {new Date(appointment.createdAt).toLocaleString("zh-TW")}
              </p>
              <p>
                最後更新：
                {new Date(appointment.updatedAt).toLocaleString("zh-TW")}
              </p>
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}

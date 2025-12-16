import { Card, CardContent } from "@blackliving/ui";
import { AlertCircle, CheckCircle, Users, XCircle } from "lucide-react";
import type { Appointment } from "../../routes/dashboard/types";

type AppointmentStatsCardsProps = {
  appointments: Appointment[];
};

export function AppointmentStatsCards({
  appointments,
}: AppointmentStatsCardsProps) {
  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-5">
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center">
            <AlertCircle className="h-8 w-8 text-yellow-500" />
            <div className="ml-4">
              <p className="font-medium text-gray-600 text-sm">待確認</p>
              <p className="font-bold text-2xl">
                {appointments.filter((a) => a.status === "pending").length}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center">
            <CheckCircle className="h-8 w-8 text-blue-500" />
            <div className="ml-4">
              <p className="font-medium text-gray-600 text-sm">已確認</p>
              <p className="font-bold text-2xl">
                {appointments.filter((a) => a.status === "confirmed").length}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center">
            <CheckCircle className="h-8 w-8 text-green-500" />
            <div className="ml-4">
              <p className="font-medium text-gray-600 text-sm">已完成</p>
              <p className="font-bold text-2xl">
                {appointments.filter((a) => a.status === "completed").length}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center">
            <XCircle className="h-8 w-8 text-red-500" />
            <div className="ml-4">
              <p className="font-medium text-gray-600 text-sm">未到場</p>
              <p className="font-bold text-2xl">
                {appointments.filter((a) => a.status === "no_show").length}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center">
            <Users className="h-8 w-8 text-purple-500" />
            <div className="ml-4">
              <p className="font-medium text-gray-600 text-sm">需追蹤</p>
              <p className="font-bold text-2xl">
                {appointments.filter((a) => a.followUpRequired).length}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Input,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@blackliving/ui";
import type { Table } from "@tanstack/react-table";
import { Filter, Search } from "lucide-react";

import type { Appointment } from "../../routes/dashboard/types";

type AppointmentFiltersProps = {
  globalFilter: string;
  setGlobalFilter: (value: string) => void;
  table: Table<Appointment>;
};

export function AppointmentFilters({
  globalFilter,
  setGlobalFilter,
  table,
}: AppointmentFiltersProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Filter className="h-5 w-5" />
          篩選與搜尋
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute top-3 left-3 h-4 w-4 text-gray-400" />
              <Input
                className="pl-10"
                onChange={(e) => setGlobalFilter(e.target.value)}
                placeholder="搜尋預約編號、客戶姓名、電話..."
                value={globalFilter}
              />
            </div>
          </div>
          <Select
            onValueChange={(value) => {
              const column = table.getColumn("status");
              if (column) {
                if (value === "all") {
                  column.setFilterValue("");
                } else {
                  column.setFilterValue(value);
                }
              }
            }}
            value={
              (table.getColumn("status")?.getFilterValue() as string) ?? ""
            }
          >
            <SelectTrigger className="w-48">
              <SelectValue placeholder="篩選狀態" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">全部狀態</SelectItem>
              <SelectItem value="pending">待確認</SelectItem>
              <SelectItem value="confirmed">已確認</SelectItem>
              <SelectItem value="completed">已完成</SelectItem>
              <SelectItem value="cancelled">已取消</SelectItem>
              <SelectItem value="no_show">未到場</SelectItem>
            </SelectContent>
          </Select>
          <Select
            onValueChange={(value) => {
              const column = table.getColumn("storeLocation");
              if (column) {
                if (value === "all") {
                  column.setFilterValue("");
                } else {
                  column.setFilterValue(value);
                }
              }
            }}
            value={
              (table.getColumn("storeLocation")?.getFilterValue() as string) ??
              ""
            }
          >
            <SelectTrigger className="w-32">
              <SelectValue placeholder="門市" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">全部門市</SelectItem>
              <SelectItem value="zhonghe">中和店</SelectItem>
              <SelectItem value="zhongli">中壢店</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </CardContent>
    </Card>
  );
}

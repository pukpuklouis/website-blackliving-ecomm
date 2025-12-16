export type CustomerInfo = {
  name: string;
  phone: string;
  email?: string;
};

export type Appointment = {
  id: string;
  appointmentNumber: string;
  userId?: string;
  customerInfo: CustomerInfo;
  storeLocation: "zhonghe" | "zhongli";
  preferredDate: string;
  preferredTime: "morning" | "afternoon" | "evening";
  confirmedDateTime?: Date;
  productInterest: string[];
  visitPurpose: "trial" | "consultation" | "pricing";
  status: "pending" | "confirmed" | "completed" | "cancelled" | "no_show";
  notes: string;
  adminNotes: string;
  staffAssigned?: string;
  actualVisitTime?: Date;
  completedAt?: Date;
  followUpRequired: boolean;
  followUpNotes: string;
  createdAt: Date;
  updatedAt: Date;
};

export const statusLabels = {
  pending: "待確認",
  confirmed: "已確認",
  completed: "已完成",
  cancelled: "已取消",
  no_show: "未到場",
};

export const statusColors = {
  pending: "bg-yellow-500",
  confirmed: "bg-blue-500",
  completed: "bg-green-500",
  cancelled: "bg-gray-500",
  no_show: "bg-red-500",
};

export const storeLabels = {
  zhonghe: "中和店",
  zhongli: "中壢店",
};

export const timeLabels = {
  morning: "上午 (09:00-12:00)",
  afternoon: "下午 (13:00-17:00)",
  evening: "晚上 (18:00-21:00)",
};

export const purposeLabels = {
  trial: "試躺體驗",
  consultation: "產品諮詢",
  pricing: "價格洽談",
};

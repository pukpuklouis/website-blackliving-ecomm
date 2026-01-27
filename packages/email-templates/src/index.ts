// Components
// biome-ignore lint/performance/noBarrelFile: false positive
export { BrandHeader, brandColors } from "./components/BrandHeader";
export { EmailLayout } from "./components/EmailLayout";
export { Footer } from "./components/Footer";
export {
  type OrderItem,
  OrderSummary,
  type OrderSummaryProps,
} from "./components/OrderSummary";
// Admin Templates
export { AdminAppointment } from "./templates/admin/AdminAppointment";
export { AdminNewOrder } from "./templates/admin/AdminNewOrder";
export { AdminPaymentConfirmation } from "./templates/admin/AdminPaymentConfirmation";
// Customer Templates
export { AppointmentConfirmation } from "./templates/customer/AppointmentConfirmation";
export { BankTransferConfirmation } from "./templates/customer/BankTransferConfirmation";
export { PaymentComplete } from "./templates/customer/PaymentComplete";
export { PaymentReminder } from "./templates/customer/PaymentReminder";
export { ShippingNotification } from "./templates/customer/ShippingNotification";

export enum AppointmentStatus {
  Scheduled = 'scheduled',
  Confirmed = 'confirmed',
  Cancelled = 'cancelled',
  Completed = 'completed',
}

export interface Appointment {
  id: string;
  customerId: string;
  appointmentDate: string;
  status: AppointmentStatus;
  notes?: string;
}

export interface AppointmentBooking {
  customerId: string;
  appointmentDate: string;
  notes?: string;
}

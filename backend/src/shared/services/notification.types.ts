export interface MaintenanceNotificationDetails {
  vehicle: string;
  date: string;
  description: string;
  clientEmail: string;
}

export interface PaymentReminderDetails {
  amount: string | number;
  dueDate: string;
  description: string;
  clientEmail: string;
}

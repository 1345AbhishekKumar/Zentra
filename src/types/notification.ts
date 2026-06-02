export interface NotificationSettings {
  globalEnabled: boolean;
  advanceNoticeDays: number[];       // e.g. [7, 30, 90] — how many days before expiry to notify
  customNoticeDays?: number[];       // user added custom day options
  reminderTime?: string;             // time to send reminders, e.g. "09:00"
}


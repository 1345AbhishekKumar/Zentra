export interface NotificationSettings {
  globalEnabled: boolean;
  advanceNoticeDays: number[];       // e.g. [7, 30, 90] — how many days before expiry to notify
}

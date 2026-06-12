export type TimeString = string & { readonly __brand?: never };

export function createTimeString(time: string): TimeString {
  const regex = /^\d{1,2}:\d{2}$/;
  if (!regex.test(time)) {
    throw new Error(`Invalid time format: ${time}. Expected HH:MM`);
  }
  const [hStr, mStr] = time.split(":");
  const hours = parseInt(hStr, 10);
  const minutes = parseInt(mStr, 10);
  if (hours < 0 || hours > 23 || minutes < 0 || minutes > 59) {
    throw new Error(`Invalid time values: ${time}. Hours must be 0-23 and minutes 0-59`);
  }
  return time as unknown as TimeString;
}

export interface NotificationSettings {
  globalEnabled: boolean;
  advanceNoticeDays: number[];       // e.g. [7, 30, 90] — how many days before expiry to notify
  customNoticeDays?: number[];       // user added custom day options
  reminderTime?: TimeString;         // time to send reminders, e.g. "09:00"
}


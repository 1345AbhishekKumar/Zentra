import { Platform } from "react-native";
import { useDocumentStore } from "@/store/documentStore";
import {
  cancelAllNotifications,
  scheduleDocumentNotifications,
} from "@/lib/notifications";

const DEFAULT_CHIPS = [7, 14, 30, 60, 90] as const;
const DEFAULT_REMINDER_TIME = "09:00";

/**
 * Encapsulates all notification-related logic for the profile screen:
 * advance notice chip toggling, custom day management, reminder time, and global toggle.
 */
export function useProfileNotifications() {
  const {
    documents,
    notificationSettings,
    updateNotificationSettings,
  } = useDocumentStore();

  const reminderTime = notificationSettings.reminderTime || DEFAULT_REMINDER_TIME;

  /** Reschedule notifications for all enabled documents with the given days/time. */
  const rescheduleAll = async (days: number[], time: string) => {
    const promises = documents
      .filter((doc) => doc.notificationsEnabled)
      .map((doc) => scheduleDocumentNotifications(doc, days, time));
    await Promise.all(promises);
  };

  /** Toggle a single advance-notice day chip on/off. */
  const handleToggleChip = async (day: number) => {
    const currentDays = notificationSettings.advanceNoticeDays || [];
    const updatedDays = currentDays.includes(day)
      ? currentDays.filter((d) => d !== day)
      : [...currentDays, day].sort((a, b) => a - b);

    updateNotificationSettings({ advanceNoticeDays: updatedDays });

    if (notificationSettings.globalEnabled) {
      await rescheduleAll(updatedDays, reminderTime);
    }
  };

  /** Remove a user-created custom day chip. */
  const handleRemoveCustomDay = async (day: number) => {
    const updatedCustom = (notificationSettings.customNoticeDays || []).filter((d) => d !== day);
    const updatedAdvance = (notificationSettings.advanceNoticeDays || []).filter((d) => d !== day);

    updateNotificationSettings({
      customNoticeDays: updatedCustom,
      advanceNoticeDays: updatedAdvance,
    });

    if (notificationSettings.globalEnabled) {
      await rescheduleAll(updatedAdvance, reminderTime);
    }
  };

  /** Add a custom day value (or activate a default chip if it matches). */
  const handleAddCustomDay = async (daysVal: number) => {
    const currentAdvance = notificationSettings.advanceNoticeDays || [];
    const currentCustom = notificationSettings.customNoticeDays || [];

    // If it matches a default chip, just activate it
    if ((DEFAULT_CHIPS as readonly number[]).includes(daysVal)) {
      if (!currentAdvance.includes(daysVal)) {
        const updatedAdvance = [...currentAdvance, daysVal].sort((a, b) => a - b);
        updateNotificationSettings({ advanceNoticeDays: updatedAdvance });
        if (notificationSettings.globalEnabled) {
          await rescheduleAll(updatedAdvance, reminderTime);
        }
      }
      return;
    }

    const updatedCustom = currentCustom.includes(daysVal)
      ? currentCustom
      : [...currentCustom, daysVal].sort((a, b) => a - b);

    const updatedAdvance = currentAdvance.includes(daysVal)
      ? currentAdvance
      : [...currentAdvance, daysVal].sort((a, b) => a - b);

    updateNotificationSettings({
      customNoticeDays: updatedCustom,
      advanceNoticeDays: updatedAdvance,
    });

    if (notificationSettings.globalEnabled) {
      await rescheduleAll(updatedAdvance, reminderTime);
    }
  };

  /** Handle global notification toggle. */
  const handleGlobalToggle = async (enabled: boolean) => {
    updateNotificationSettings({ globalEnabled: enabled });
    if (!enabled) {
      await cancelAllNotifications();
    } else {
      await rescheduleAll(
        notificationSettings.advanceNoticeDays,
        reminderTime,
      );
    }
  };

  /** Save a new reminder time and reschedule. */
  const handleSaveTime = async (time24: string) => {
    updateNotificationSettings({ reminderTime: time24 });
    if (notificationSettings.globalEnabled) {
      await rescheduleAll(notificationSettings.advanceNoticeDays, time24);
    }
  };

  /** Whether the native time picker should open (not on web). */
  const canOpenNativeTimePicker = Platform.OS !== "web";

  /** Format 24h time to 12h display string. */
  const formatReminderTime = (time24: string): string => {
    if (!time24) return "9:00 AM";
    const [h24Str, m24Str] = time24.split(":");
    const h24 = parseInt(h24Str, 10);
    const period = h24 >= 12 ? "PM" : "AM";
    let h12 = h24 % 12;
    if (h12 === 0) h12 = 12;
    return `${h12}:${m24Str} ${period}`;
  };

  /** Build the combined chip list (defaults + custom, sorted). */
  const getCombinedChips = (): number[] => {
    const customChips = notificationSettings.customNoticeDays || [];
    return Array.from(
      new Set([...DEFAULT_CHIPS, ...customChips])
    ).sort((a, b) => a - b);
  };

  /** Check if a day is a default chip (not user-created). */
  const isDefaultChip = (day: number): boolean =>
    (DEFAULT_CHIPS as readonly number[]).includes(day);

  return {
    notificationSettings,
    reminderTime,
    handleToggleChip,
    handleRemoveCustomDay,
    handleAddCustomDay,
    handleGlobalToggle,
    handleSaveTime,
    canOpenNativeTimePicker,
    formatReminderTime,
    getCombinedChips,
    isDefaultChip,
  };
}

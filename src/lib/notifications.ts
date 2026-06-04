import { ZentraDocument, NotificationSettings } from "@/types";
import { parseISO, subDays } from "date-fns";
import * as Device from "expo-device";
import * as Notifications from "expo-notifications";
import { Platform } from "react-native";

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
    priority: Notifications.AndroidNotificationPriority.MAX,
  }),
});

/**
 * Requests notification permissions from the user. Returns true if granted.
 * Must be called on a real device (expo-device check included).
 */
export async function requestPermissions(): Promise<boolean> {
  try {
    if (Platform.OS === "android") {
      await Notifications.setNotificationChannelAsync("zentra-alerts", {
        name: "Zentra Expiry Alerts",
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: "#4F46E5",
      });
    }

    if (!Device.isDevice) {
      console.log("[Notifications] Permissions skipped: not a physical device. Simulating granted status.");
      return true;
    }

    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== "granted") {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    return finalStatus === "granted";
  } catch (error) {
    console.error("[Notifications] Failed to request permissions:", error);
    return false;
  }
}

/**
 * Checks current permission status without requesting. Returns true if granted.
 */
export async function hasPermission(): Promise<boolean> {
  try {
    if (!Device.isDevice) {
      return true;
    }
    const { status } = await Notifications.getPermissionsAsync();
    return status === "granted";
  } catch (error) {
    console.error("[Notifications] Failed to check permissions:", error);
    return false;
  }
}

/**
 * Schedules local notifications for a document based on advanceNoticeDays.
 * Cancels any existing notifications for that document ID first.
 * Each trigger fires at 9:00 AM local time on the calculated date.
 */
export async function scheduleDocumentNotifications(
  doc: ZentraDocument,
  advanceNoticeDays: number[],
  reminderTime: string = "09:00",
): Promise<void> {
  try {
    // First cancel any existing notifications for this document
    await cancelDocumentNotifications(doc.id);

    // If notifications are not enabled, stop here
    if (!doc.notificationsEnabled) {
      return;
    }

    // Ensure the notification channel is created on Android
    if (Platform.OS === "android") {
      await Notifications.setNotificationChannelAsync("zentra-alerts", {
        name: "Zentra Expiry Alerts",
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: "#4F46E5",
      });
    }

    // Check permissions before scheduling, request dynamically if not yet granted
    let hasPerm = await hasPermission();
    if (!hasPerm) {
      hasPerm = await requestPermissions();
    }
    if (!hasPerm) {
      console.log(
        "[Notifications] Cannot schedule: notification permissions not granted.",
      );
      return;
    }

    const expiryDate = parseISO(doc.expiryDate);
    const [hoursStr, minutesStr] = reminderTime.split(":");
    const hours = parseInt(hoursStr, 10);
    const minutes = parseInt(minutesStr, 10);

    for (const daysBeforeExpiry of advanceNoticeDays) {
      const triggerDate = subDays(expiryDate, daysBeforeExpiry);
      // Fire at custom time
      triggerDate.setHours(hours, minutes, 0, 0);

      // Skip if trigger date is in the past
      if (triggerDate.getTime() <= Date.now()) {
        continue;
      }

      const identifier = `${doc.id}-${daysBeforeExpiry}d`;

      await Notifications.scheduleNotificationAsync({
        identifier,
        content: {
          title: `📄 ${doc.name} expiring soon`,
          body: `Your document expires in ${daysBeforeExpiry} days. Tap to review.`,
          data: { documentId: doc.id },
        },
        trigger: {
          type: Notifications.SchedulableTriggerInputTypes.DATE,
          date: triggerDate,
          channelId: "zentra-alerts",
        },
      });
    }
  } catch (error) {
    console.error(
      `[Notifications] Failed to schedule notifications for document ${doc.id}:`,
      error,
    );
  }
}

/**
 * Cancels all scheduled notifications for a specific document ID.
 */
export async function cancelDocumentNotifications(
  documentId: string,
): Promise<void> {
  try {
    const scheduled = await Notifications.getAllScheduledNotificationsAsync();
    for (const notification of scheduled) {
      if (notification.identifier.startsWith(`${documentId}-`)) {
        await Notifications.cancelScheduledNotificationAsync(
          notification.identifier,
        );
      }
    }
  } catch (error) {
    console.error(
      `[Notifications] Failed to cancel notifications for document ${documentId}:`,
      error,
    );
  }
}

/**
 * Cancels ALL scheduled notifications for the app.
 */
export async function cancelAllNotifications(): Promise<void> {
  try {
    await Notifications.cancelAllScheduledNotificationsAsync();
  } catch (error) {
    console.error("[Notifications] Failed to cancel all notifications:", error);
  }
}



/**
 * Compiles all potential notification triggers, sorts them chronologically (soonest first),
 * and schedules the top 48 triggers with the OS.
 */
export async function syncAllNotifications(
  documents: ZentraDocument[],
  settings: NotificationSettings,
): Promise<void> {
  try {
    // 1. Cancel all currently scheduled notifications to avoid duplicates and orphans
    await cancelAllNotifications();

    // 2. If notifications are globally disabled, stop here
    if (!settings.globalEnabled) {
      console.log("[Notifications] Global notifications are disabled. Queue cleared.");
      return;
    }

    // Ensure the notification channel is created on Android
    if (Platform.OS === "android") {
      await Notifications.setNotificationChannelAsync("zentra-alerts", {
        name: "Zentra Expiry Alerts",
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: "#4F46E5",
      });
    }

    // 3. Compile all future triggers
    const now = Date.now();
    const [hoursStr, minutesStr] = (settings.reminderTime || "09:00").split(":");
    const hours = parseInt(hoursStr, 10);
    const minutes = parseInt(minutesStr, 10);

    interface NotificationTrigger {
      doc: ZentraDocument;
      daysBeforeExpiry: number;
      triggerDate: Date;
    }

    const triggers: NotificationTrigger[] = [];

    for (const doc of documents) {
      // Skip soft-deleted documents or those with notifications disabled
      if (doc.isDeleted || !doc.notificationsEnabled) {
        continue;
      }

      const expiryDate = parseISO(doc.expiryDate);

      // Use the global advanceNoticeDays
      for (const daysBeforeExpiry of settings.advanceNoticeDays) {
        const triggerDate = subDays(expiryDate, daysBeforeExpiry);
        triggerDate.setHours(hours, minutes, 0, 0);

        // Only schedule if the trigger is in the future
        if (triggerDate.getTime() > now) {
          triggers.push({
            doc,
            daysBeforeExpiry,
            triggerDate,
          });
        }
      }
    }

    // 4. Sort chronologically (soonest first)
    triggers.sort((a, b) => a.triggerDate.getTime() - b.triggerDate.getTime());

    // 5. Truncate to top 48 triggers to prevent hitting OS queue limits
    const slicedTriggers = triggers.slice(0, 48);

    if (slicedTriggers.length === 0) {
      console.log("[Notifications] No future notifications to schedule.");
      return;
    }

    // 6. Check permissions
    let hasPerm = await hasPermission();
    if (!hasPerm) {
      hasPerm = await requestPermissions();
    }
    if (!hasPerm) {
      console.warn("[Notifications] Cannot schedule: notification permissions not granted.");
      return;
    }

    console.log(`[Notifications] Scheduling ${slicedTriggers.length} of ${triggers.length} total triggers`);

    // 7. Schedule with the OS
    for (const trigger of slicedTriggers) {
      const { doc, daysBeforeExpiry, triggerDate } = trigger;
      const identifier = `${doc.id}-${daysBeforeExpiry}d`;

      await Notifications.scheduleNotificationAsync({
        identifier,
        content: {
          title: `📄 ${doc.name} expiring soon`,
          body: `Your document expires in ${daysBeforeExpiry} days. Tap to review.`,
          data: { documentId: doc.id },
        },
        trigger: {
          type: Notifications.SchedulableTriggerInputTypes.DATE,
          date: triggerDate,
          channelId: "zentra-alerts",
        },
      });
    }
  } catch (error) {
    console.error("[Notifications] Failed to sync notifications queue:", error);
  }
}

/**
 * Wrapper for expo-notifications received listener.
 */
export function addNotificationReceivedListener(
  listener: (notification: any) => void
): { remove: () => void } {
  return Notifications.addNotificationReceivedListener(listener);
}

/**
 * Wrapper for expo-notifications response received listener.
 */
export function addNotificationResponseReceivedListener(
  listener: (response: any) => void
): { remove: () => void } {
  return Notifications.addNotificationResponseReceivedListener(listener);
}

/**
 * Wrapper for expo-notifications getting the last response.
 */
export async function getLastNotificationResponse(): Promise<any> {
  return await Notifications.getLastNotificationResponseAsync();
}

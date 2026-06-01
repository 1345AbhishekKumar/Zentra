import { ZentraDocument } from "@/types";
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
  }),
});

/**
 * Requests notification permissions from the user. Returns true if granted.
 * Must be called on a real device (expo-device check included).
 */
export async function requestPermissions(): Promise<boolean> {
  try {
    if (!Device.isDevice) {
      console.log("[Notifications] Permissions skipped: not a physical device.");
      return false;
    }

    if (Platform.OS === "android") {
      await Notifications.setNotificationChannelAsync("default", {
        name: "default",
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: "#4F46E5",
      });
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
      return false;
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
): Promise<void> {
  try {
    // First cancel any existing notifications for this document
    await cancelDocumentNotifications(doc.id);

    // If notifications are not enabled, stop here
    if (!doc.notificationsEnabled) {
      return;
    }

    // Check permissions before scheduling
    const hasPerm = await hasPermission();
    if (!hasPerm) {
      console.log(
        "[Notifications] Cannot schedule: notification permissions not granted.",
      );
      return;
    }

    const expiryDate = parseISO(doc.expiryDate);

    for (const daysBeforeExpiry of advanceNoticeDays) {
      const triggerDate = subDays(expiryDate, daysBeforeExpiry);
      // Fire at 9:00 AM local time
      triggerDate.setHours(9, 0, 0, 0);

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
 * Returns the full list of all scheduled notification requests.
 */
export async function getScheduledNotifications(): Promise<
  Notifications.NotificationRequest[]
> {
  try {
    return await Notifications.getAllScheduledNotificationsAsync();
  } catch (error) {
    console.error("[Notifications] Failed to get scheduled notifications:", error);
    return [];
  }
}

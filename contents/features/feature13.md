Read AGENTS.md first and follow it strictly.

## Task — lib/notifications.ts + Expo Notifications Setup

Create `lib/notifications.ts` — the single module for all notification logic in Zentra. No screen or component may call Expo Notifications APIs directly; everything routes through this file.

**Steps:**

1. Install `expo-notifications` and `expo-device` if not already installed.

2. Configure the notification handler in `lib/notifications.ts` at module level:

```ts
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});
```

3. Export the following functions:

```ts
// Requests notification permissions from the user. Returns true if granted.
// Must be called on a real device (expo-device check included).
requestPermissions(): Promise<boolean>

// Checks current permission status without requesting. Returns true if granted.
hasPermission(): Promise<boolean>

// Schedules local notifications for a document based on advanceNoticeDays.
// Cancels any existing notifications for that document ID first.
// Each trigger fires at 9:00 AM local time on the calculated date.
scheduleDocumentNotifications(
  doc: ZentraDocument,
  advanceNoticeDays: number[]
): Promise<void>

// Cancels all scheduled notifications for a specific document ID.
cancelDocumentNotifications(documentId: string): Promise<void>

// Cancels ALL scheduled notifications for the app.
cancelAllNotifications(): Promise<void>

// Returns the list of all currently scheduled notification identifiers.
getScheduledNotifications(): Promise<Notifications.NotificationRequest[]>
```

4. Notification identifier convention: use `${documentId}-${daysBeforeExpiry}d` as the identifier for each scheduled notification. This allows targeted cancellation per document.

5. Notification content format:
   - **Title**: `"📄 {document.name} expiring soon"`
   - **Body**: `"Your document expires in {N} days. Tap to review."`

6. All scheduling calculations must use `lib/date.ts` functions — do not duplicate date logic here.

Do not call `scheduleDocumentNotifications` from this file — it will be called from the store and Add Document flow in later features.
Do not create any screens, components, or Zustand actions.
Do not modify any existing file from feature1 through feature6.
All notification logic must be local — no push notification servers, no FCM, no APNs tokens sent anywhere.

### Check when done
- `lib/notifications.ts` exists and exports all 5 functions listed above
- `requestPermissions()` returns a boolean without crashing on simulator (simulator returns false gracefully)
- Notification identifiers follow the `${documentId}-${daysBeforeExpiry}d` convention
- `bunx tsc --noEmit` passes
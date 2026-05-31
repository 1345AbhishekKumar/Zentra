Read AGENTS.md first and follow it strictly.

## Task — NotificationToggle Component + Per-Document Notification Management

Build the `NotificationToggle` component and wire per-document notification scheduling so that toggling notifications on a document correctly schedules or cancels its reminders.

**Steps:**

1. Create `components/NotificationToggle.tsx`:
   - Props: `documentId: string`, `enabled: boolean`, `onToggle: (enabled: boolean) => void`
   - Renders a labeled row: "Notifications" label (left) + native Switch toggle (right)
   - When toggled ON: check permission with `hasPermission()` from `lib/notifications.ts`
     - If no permission: call `requestPermissions()`. If still denied after request, show an alert: "Please enable notifications in your device settings to receive expiry reminders." and revert the toggle
     - If permission granted: call `onToggle(true)`
   - When toggled OFF: call `onToggle(false)`
   - Switch active color: `Colors.accent` (`#4F46E5`)

2. Add `NotificationToggle` to the Document Details screen (`app/document/[id].tsx`):
   - Place it in the Information section, below the expiry date row
   - `onToggle` handler should:
     - Call `toggleNotification(doc.id)` from the store
     - If toggling ON: call `scheduleDocumentNotifications(doc, notificationSettings.advanceNoticeDays)` from `lib/notifications.ts`
     - If toggling OFF: call `cancelDocumentNotifications(doc.id)` from `lib/notifications.ts`

3. Also update the `AddDocumentForm` (`components/AddDocumentForm.tsx`) to use `NotificationToggle` instead of a plain Switch — replace the existing toggle with the new component so the permission check is consistent everywhere.

4. Add a global notifications toggle to the Profile tab (`app/(tabs)/profile.tsx`):
   - Show a "Global Notifications" row with `NotificationToggle`
   - This toggle controls `notificationSettings.globalEnabled` via `updateNotificationSettings`
   - When global notifications are turned OFF: call `cancelAllNotifications()` from `lib/notifications.ts`
   - When turned ON: reschedule notifications for all documents where `notificationsEnabled === true` by mapping over `documents[]` and calling `scheduleDocumentNotifications` for each

Do not build any other Profile screen content — only the global notification toggle row.
Do not modify any screen other than `app/document/[id].tsx`, `components/AddDocumentForm.tsx`, and `app/(tabs)/profile.tsx`.
Do not touch the store shape or lib files.

### Check when done
- Toggling notifications ON for a document on the Details screen schedules notifications via Expo Notifications
- Toggling OFF cancels those notifications
- If notification permission is denied, the toggle reverts and shows an alert
- Global toggle in Profile cancels or reschedules all document notifications correctly
- `bunx tsc --noEmit` passes
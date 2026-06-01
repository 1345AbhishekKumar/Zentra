Read AGENTS.md first and follow it strictly.

## Task — Notification Deep Linking

Wire notification tap handling so that when a user taps an expiry reminder notification (from the background or killed state), the app opens directly to the relevant Document Details screen.

**Steps:**

1. In `app/_layout.tsx`, add two Expo Notifications listeners inside a `useEffect`:

   ```ts
   // Listener A — app is foregrounded when notification arrives
   const foregroundSub = Notifications.addNotificationReceivedListener(notification => {
     // Optional: update the bell badge dot on Home screen
     // No navigation — user is already in the app
   });

   // Listener B — user taps a notification (background or killed state)
   const responseSub = Notifications.addNotificationResponseReceivedListener(response => {
     const documentId = response.notification.request.content.data?.documentId as string | undefined;
     if (documentId) {
       router.push(`/document/${documentId}`);
     }
   });

   return () => {
     foregroundSub.remove();
     responseSub.remove();
   };
   ```

   Clean up both subscriptions in the `useEffect` return.

2. Update `lib/notifications.ts` — `scheduleDocumentNotifications()`:
   - Add a `data` field to each notification's content:
     ```ts
     data: { documentId: doc.id }
     ```
   - This is the payload the tap listener reads to navigate.

3. Handle the **killed state** (app was fully closed when notification was tapped):
   - Use `Notifications.getLastNotificationResponseAsync()` to check for a pending response on cold start
   - Call this in `app/_layout.tsx` after the store has hydrated (`_hasHydrated === true`) and Clerk is loaded
   - If a response exists and contains a `documentId`, navigate to `/document/${documentId}` using `router.replace`

4. Guard the navigation: before navigating, verify the `documentId` exists in `documents[]` from the store. If the document was deleted, skip navigation silently.

Do not modify the notification scheduling logic beyond adding the `data` field.
Do not change any screen other than `app/_layout.tsx` and `lib/notifications.ts`.
Do not touch the store shape, auth, or any tab screen.
The `data` field addition is backwards-compatible — existing scheduled notifications without it will simply not deep-link (no crash).

### Check when done
- Tapping a notification while app is backgrounded navigates to the correct Document Details screen
- Tapping a notification from a killed-state cold start navigates correctly after hydration
- If the document no longer exists, no navigation occurs and no crash
- `bunx tsc --noEmit` passes
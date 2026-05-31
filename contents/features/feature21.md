Read AGENTS.md first and follow it strictly.

## Task — Profile Screen (Merged with Settings)

Replace the placeholder Profile tab (`app/(tabs)/profile.tsx`) with a complete, single-destination screen that covers user identity, app stats, notification preferences, app lock, and account actions. There is no separate Settings screen — everything lives here.

Delete `app/settings.tsx` if it was created in a previous feature. All settings content moves into this screen.

---

### Layout (top to bottom)

**1. User Card**
- Circle avatar: user's initials (first + last initial), accent background (`#4F46E5`), white text, 64px diameter
- If Clerk provides a `profileImageUrl`, render it with `Image` instead of initials
- Display name (bold, large) + email (secondary text) below avatar
- No "Edit Profile" link — profile editing is Clerk-managed, not in-app

**2. Stats Row**
Three stat boxes in a horizontal row, white background, rounded-xl, subtle shadow:
- **Total** — `documents.length`
- **Expiring Soon** — documents where `expiryUrgency(doc.expiryDate)` is `"critical"` or `"warning"`
- **Favorites** — `documents.filter(d => d.isFavorite).length`

Each box: number (bold, accent color) + label (small, secondary text).

**3. My Content section** (section label: bold, secondary background separator)

| Row | Icon | Action |
|---|---|---|
| Favorites | heart-outline | `router.push("/favorites")` |
| Expiry Alerts | notifications-outline | `router.push("/alerts")` |

**4. Notifications section**

- **Global Notifications** — `NotificationToggle` component
  - Controls `notificationSettings.globalEnabled` via `updateNotificationSettings`
  - Toggle OFF → `cancelAllNotifications()` from `lib/notifications.ts`
  - Toggle ON → reschedule all documents where `notificationsEnabled === true`

- **Remind me before expiry** — advance notice chips
  - Horizontal scrollable row of selectable pills: 7d · 14d · 30d · 60d · 90d
  - Multi-select. Active: accent background + white text. Inactive: white + border.
  - Reflects `notificationSettings.advanceNoticeDays`
  - On change: `updateNotificationSettings({ advanceNoticeDays: [...selected] })` then reschedule all enabled documents

- **Notification time** — display-only row: "Reminders sent at 9:00 AM" with an info icon. No edit.

**5. Security section**

- **App Lock** — single row with a chevron → `router.push("/app-lock")`
- Show current lock status as a sub-label: "On" or "Off" in secondary text

**6. Data section**

- **Delete All Documents** — red text row, trash icon
  - `Alert.alert("Delete All Data", "This permanently deletes all documents and cannot be undone.", [Cancel, Delete])`
  - On confirm: `cancelAllNotifications()` then `clearAllData()` from store

**7. About section**

- App version row: read from `expo-constants` (`Constants.expoConfig?.version`). Display-only.
- Tagline row: "Private. Local. Yours." — secondary text, no action, shield icon.

**8. Sign Out button**
- Full-width, white background, red text (`Colors.error`), rounded-xl, subtle shadow
- `Alert.alert("Sign Out", "Are you sure?", [Cancel, Sign Out])`
- On confirm: `useAuth().signOut()` → `setUser(null)` from store → `router.replace("/(auth)/sign-in")`
- Document data is NOT cleared on sign out

---

### Store changes required

Add `clearAllData` action to `store/documentStore.ts` if not already present:
```ts
clearAllData: () => set({ documents: [], collections: [] })
```

---

Do not create `app/settings.tsx` — it does not exist in this version of Zentra.
Do not modify `app/favorites.tsx`, `app/alerts.tsx`, 
Do not change `lib/notifications.ts`, `lib/date.ts`, or `lib/share.ts`.
Do not touch any other tab screen (Home, Documents, Expiring Soon).
Do not modify `NotificationToggle` component — use it as-is.
Preserve the tab bar from feature4 exactly.

### Check when done
- Stats row shows correct live counts from the store
- Global notifications toggle cancels / reschedules correctly
- Advance notice chips update `notificationSettings.advanceNoticeDays` and reschedule all enabled documents

- Delete All Documents wipes store and clears notifications
- Sign out clears Clerk session and redirects to sign-in without clearing document data
- App version displays correctly from `expo-constants`
- `bunx tsc --noEmit` passes
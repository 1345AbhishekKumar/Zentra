Read AGENTS.md first and follow it strictly.

## Task — Full Profile Screen

Build the complete Profile tab screen (`app/(tabs)/profile.tsx`). Replace the placeholder with a real user profile, stats, and menu.

**Layout (top to bottom):**

1. **User Card (top section)**
   - Avatar: circle with the user's initials (first + last name initial), accent background (`#4F46E5`), white text, 64px
   - If Clerk provides a `profileImageUrl`, use `Image` component to show the real photo
   - User's display name (bold, large) below the avatar
   - User's email in secondary text
   - "Edit Profile" text link (accent color) — tapping opens an Alert telling the user "Profile editing is managed via Clerk" (no in-app edit form needed)

2. **Stats Row**
   - 3 stat boxes in a horizontal row:
     - Total Documents (count of `documents[]`)
     - Expiring Soon (count of docs with urgency `critical` or `warning`)
     - Favorites (count of `documents.filter(d => d.isFavorite)`)
   - Each box: number (bold, large, accent color) + label (small, secondary)
   - White background, rounded-xl, subtle shadow

3. **Menu List (rows with icon + label + chevron)**

   Section: "My Content"
   - ⭐ Favorites → navigate to `app/favorites.tsx`
   - 📁 Collections → navigate to `app/(tabs)/collections` (switch tab)
   - 🔔 Alerts → navigate to `app/alerts.tsx`

   Section: "Preferences"
   - 🔔 Notifications → navigate to `app/settings.tsx` (feature23)
   - 🔒 App Lock → navigate to `app/app-lock.tsx` (feature24)

   Section: "Support"
   - ℹ️ About Zentra → show a small modal or alert with app version, tagline "Private. Local. Yours."
   - 🚪 Sign Out → confirm dialog → call `signOut()` from Clerk's `useAuth` hook → clear local user from store → navigate to `/(auth)/sign-in`

4. Sign out behavior:
   - Show `Alert.alert("Sign Out", "Are you sure?", [Cancel, Sign Out])`
   - On confirm: call `useAuth().signOut()`, then call `setUser(null)` from the store
   - Navigate to `/(auth)/sign-in` using `router.replace`
   - Do NOT clear `documents[]` or any document data on sign out — local data persists

Do not build Settings or App Lock screens — those are feature23 and feature24.
Do not modify any other tab screen.
Do not touch lib files, store shape (beyond `setUser`), or auth setup.
Preserve the `NotificationToggle` global row that was added in feature12 — move it into the Preferences section as the Notifications row, or replace it with the Settings navigation row.

### Check when done
- User avatar shows initials (or photo if Clerk provides one)
- All 3 stats display the correct counts from the store
- All menu rows navigate to the correct screen
- Sign out clears the Clerk session and redirects to sign-in
- Document data is NOT cleared on sign out
- `bunx tsc --noEmit` passes
Read AGENTS.md first and follow it strictly.

## Task — App Lock (Biometric + PIN)

Add an optional app lock using device biometrics (Face ID / fingerprint) or PIN. When enabled, the user must authenticate every time the app comes to the foreground.

**Steps:**

1. Install `expo-local-authentication` if not already present (included in Expo managed workflow).

2. Create `app/app-lock.tsx` — the App Lock settings screen:
   - **Header**: back arrow + "App Lock" title
   - **Toggle row**: "Require authentication to open Zentra" — `NotificationToggle`-style row with a Switch
   - **Biometrics info row** (only visible when lock is enabled):
     - Show what authentication method is available on the device: "Face ID", "Fingerprint", or "Device PIN"
     - Use `LocalAuthentication.supportedAuthenticationTypesAsync()` to detect
   - **Test button** (only visible when lock is enabled): "Test Authentication" — triggers the auth prompt immediately so the user can verify it works
   - **Info text**: "If biometrics are unavailable, your device PIN will be used as a fallback."

3. Persist the lock preference in AsyncStorage under the key `"zentra_app_lock_enabled"` (boolean string). Do NOT store this in Zustand — it must be readable before the store hydrates.

4. Create `hooks/useAppLock.ts`:
   - Reads `"zentra_app_lock_enabled"` from AsyncStorage
   - Exposes: `isLockEnabled: boolean`, `enableLock: () => void`, `disableLock: () => void`, `authenticate: () => Promise<boolean>`
   - `authenticate()` calls `LocalAuthentication.authenticateAsync({ promptMessage: "Unlock Zentra", fallbackLabel: "Use PIN" })`

5. In `app/_layout.tsx`, add foreground lock enforcement:
   - Use `AppState` from React Native to detect when the app returns to the foreground (`"active"` after `"background"` or `"inactive"`)
   - When the app comes to foreground AND `isLockEnabled === true`: show a full-screen lock overlay (a `Modal` with `visible` prop)
   - The overlay: Zentra logo/name centered, "Unlock Zentra" button (accent color) that calls `authenticate()`
   - If authentication succeeds: hide the overlay
   - If authentication fails or is cancelled: keep the overlay visible (do not close the app)
   - Do NOT show the lock overlay on the onboarding or auth screens

6. Wire from Profile: the "App Lock" row in `app/(tabs)/profile.tsx` navigates to `app/app-lock.tsx`.

Do not use Clerk for the lock — this is purely `expo-local-authentication`.
Do not store any document data in the lock logic.
Do not modify the store shape.
Do not show the lock screen during the initial app launch — only on foreground transitions after the user has opened the app at least once and the store has hydrated.
Do not touch lib files, the Documents screen, Collections, or Settings.

### Check when done
- Enabling app lock from `app/app-lock.tsx` persists the preference in AsyncStorage
- Returning the app from the background triggers the biometric/PIN prompt when lock is enabled
- Successful auth hides the lock overlay
- Failed/cancelled auth keeps the overlay visible
- Disabling lock from the settings screen turns off the foreground enforcement immediately
- `bunx tsc --noEmit` passes
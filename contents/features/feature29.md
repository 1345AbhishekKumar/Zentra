Read AGENTS.md first and follow it strictly.

## Task — Privacy Policy Screen

Build a Privacy Policy screen for Zentra in Profile screen. Required for App Store and Play Store submission.

**Steps:**

1. Create `app/privacy-policy.tsx` — a scrollable screen displaying Zentra's privacy policy.

2. Header:
   - Back arrow (left) + "Privacy Policy" title (centered, bold)
   - Last updated date below the title in secondary text: "Last updated: June 2025"

3. Content — write the full privacy policy as a scrollable `ScrollView` with styled sections. Use the following structure and content (tailored to Zentra's privacy-first, local-only architecture):

   **Section 1 — Our Commitment**
   Zentra is built on a simple promise: your data never leaves your device. We do not collect, transmit, store, or process any of your personal information or document data on any server.

   **Section 2 — What We Store and Where**
   All document names, expiry dates, categories, notes, and attached files are stored exclusively in your device's local storage (AsyncStorage). Nothing is synced to the cloud, shared with third parties, or accessible to Zentra or anyone else.

   **Section 3 — Authentication**
   We use Clerk for user authentication. Clerk stores your email address and authentication credentials on their servers solely for the purpose of verifying your identity when you sign in. No document data is ever shared with Clerk. Please refer to Clerk's privacy policy for details on how they handle authentication data.

   **Section 4 — Notifications**
   Expiry reminders are scheduled locally on your device using your operating system's notification system. No notification data is sent to any external server.

   **Section 5 — Permissions**
   Zentra may request access to your camera, photo library, and local files solely to allow you to attach documents. These files are stored on your device and never uploaded anywhere.

   **Section 6 — App Lock & Biometrics**
   If you enable App Lock, your biometric data (Face ID, fingerprint) is processed entirely by your device's operating system. Zentra never accesses or stores biometric data.

   **Section 7 — Children's Privacy**
   Zentra is not directed at children under the age of 13. We do not knowingly collect any data from children.

   **Section 8 — Changes to This Policy**
   If we update this policy, the new version will be available within the app. Continued use of Zentra after changes constitutes acceptance of the updated policy.

   **Section 9 — Contact**
   If you have questions about this privacy policy, contact us at: support@zentra.app

4. Styling:
   - Section headers: bold, `Colors.primaryText`, 16px
   - Body text: `Colors.secondaryText`, 14px, line height 22
   - Section spacing: 24px between sections
   - Outer padding: 20px horizontal

5. Add "Privacy Policy" entry point in `app/(tabs)/profile.tsx` under the About section (below the app version row).

Do not hardcode the support email in multiple places — define it as `constants/app.ts` → `export const APP_SUPPORT_EMAIL = "support@zentra.app"` and use it here and in the Contact feature.
Do not modify any other screen beyond adding the navigation row in Profile.
Do not touch store, lib files, or auth.

### Check when done
- Privacy Policy row appears in Profile screen
- Screen is fully scrollable with all 9 sections visible
- Back navigation works correctly
- `bunx tsc --noEmit` passes
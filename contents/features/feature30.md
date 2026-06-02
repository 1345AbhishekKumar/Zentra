Read AGENTS.md first and follow it strictly.

## Task — Terms of Service Screen

Build a Terms of Service screen for Zentra in profile screen like privacy screen. Required for App Store and Play Store submission.

**Steps:**

1. Create `app/terms-of-service.tsx` — a scrollable screen displaying Zentra's terms.

2. Header:
   - Back arrow + "Terms of Service" title (centered, bold)
   - "Last updated: June 2025" in secondary text below

3. Content — write the full Terms of Service as a scrollable `ScrollView` with the following sections:

   **Section 1 — Acceptance of Terms**
   By downloading and using Zentra, you agree to these Terms of Service. If you do not agree, do not use the app.

   **Section 2 — Description of Service**
   Zentra is a local document expiry tracker. It helps you keep track of important document expiry dates and notifies you before they expire. All data is stored locally on your device.

   **Section 3 — User Responsibilities**
   You are responsible for maintaining the accuracy of the document information you enter. Zentra is a reminder tool — it is your responsibility to take action on expiring documents. Zentra is not liable for any consequences arising from missed document expirations.

   **Section 4 — Account**
   You must create an account via Clerk to use Zentra. You are responsible for keeping your login credentials secure. You may delete your account at any time from the Profile screen.

   **Section 5 — Intellectual Property**
   Zentra and all associated content, branding, and code are the property of the Zentra team. You may not copy, modify, or distribute the app without explicit permission.

   **Section 6 — Disclaimer of Warranties**
   Zentra is provided "as is" without warranties of any kind. We do not guarantee the app will be error-free or uninterrupted.

   **Section 7 — Limitation of Liability**
   To the fullest extent permitted by law, Zentra shall not be liable for any indirect, incidental, or consequential damages arising from use of the app.

   **Section 8 — Changes to Terms**
   We may update these terms at any time. Continued use after changes constitutes acceptance of the updated terms.

   **Section 9 — Governing Law**
   These terms are governed by the laws of the jurisdiction in which Zentra operates.

   **Section 10 — Contact**
   For questions, contact: support@zentra.app (use `APP_SUPPORT_EMAIL` from `constants/app.ts`)

4. Styling: identical to the Privacy Policy screen — same font sizes, spacing, section header style, and padding.

5. Add "Terms of Service" entry point in `app/(tabs)/profile.tsx` under the About section, directly below the Privacy Policy row.

6. Also add both Privacy Policy and Terms of Service links on the sign-up screen (`app/(auth)/sign-up.tsx`):
   - Below the "Create Account" button: small text "By creating an account, you agree to our [Terms of Service] and [Privacy Policy]"
   - Each link is tappable and navigates to the respective screen
   - Use `Colors.accent` for the link text, 12px font size

Do not create a new `constants/app.ts` if it was already created in the Privacy Policy feature — just add to it.
Do not modify any other screen beyond Profile and sign-up.
Do not touch store, lib files, or auth logic.

### Check when done
- Terms of Service row appears in Profile below Privacy Policy
- Screen is fully scrollable with all 10 sections
- Sign-up screen shows the legal links below the CTA button
- Both links navigate to their respective screens
- `bunx tsc --noEmit` passes
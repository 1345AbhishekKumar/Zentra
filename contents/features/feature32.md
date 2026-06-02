Read AGENTS.md first and follow it strictly.

## Task — Help / FAQ Screen

Build a Help & FAQ screen so users can find answers to common questions without leaving the app  in prfile screen like privacy screen.

**Steps:**

1. Create `app/help.tsx` — a searchable FAQ screen.

2. Header:
   - Back arrow + "Help & FAQ" title (centered, bold)
   - Search bar below the header — filters FAQ items by question text as the user types (local `useState`, no store)

3. FAQ content — define the questions and answers as a static array in the file (no external fetch):

   ```ts
   const FAQ_ITEMS = [
     {
       question: "How do I add a document?",
       answer: "Tap the + button on the Home or Documents screen. Fill in the document name, category, expiry date, and optionally attach a file."
     },
     {
       question: "Where is my data stored?",
       answer: "All your data is stored locally on your device using AsyncStorage. Nothing is uploaded to any server or cloud service."
     },
     {
       question: "How do notifications work?",
       answer: "Zentra schedules local reminders on your device based on the advance notice days you set (e.g. 7, 30, 90 days before expiry). These are processed entirely on-device."
     },
     {
       question: "What happens if I delete the app?",
       answer: "All your document data will be lost as it is stored locally. Export your data from the Profile screen before uninstalling."
     },
     {
       question: "Can I recover a deleted document?",
       answer: "Deleted documents are moved to Recently Deleted and are recoverable for 30 days. After 30 days they are permanently removed."
     },
     {
       question: "How do I set up App Lock?",
       answer: "Go to Profile → App Lock and enable it. You can use Face ID, fingerprint, or your device PIN."
     },
     {
       question: "Why am I not receiving notifications?",
       answer: "Check that notifications are enabled in Profile → Notifications and that Zentra has notification permission in your device settings."
     },
     {
       question: "Can I use Zentra on multiple devices?",
       answer: "Currently Zentra is local-only. Your data does not sync between devices. Each device has its own independent document vault."
     },
     {
       question: "How do I export my data?",
       answer: "Go to Profile → Export Data. You can export a JSON file of all your document metadata (not the attached files themselves)."
     },
     {
       question: "Is Zentra free?",
       answer: "Yes, Zentra is free to use."
     },
   ]
   ```

4. Each FAQ item renders as an **accordion row**:
   - Question text (bold, `Colors.primaryText`)
   - Chevron icon (right side) — rotates 90° when expanded (use `Animated.Value` or simple state toggle)
   - Answer text reveals below on tap (with smooth height animation or simple `useState` toggle with no animation if animation is complex)
   - Divider line between items

5. Search filters `FAQ_ITEMS` by question text using `useMemo`. If no results match: show `EmptyState` with title "No results" and message "Try different keywords."

6. Below the FAQ list, add a "Still need help?" section:
   - "Contact Support" row → opens the device mail app with `Linking.openURL(\`mailto:${APP_SUPPORT_EMAIL}\`)` pre-addressed
   - Icon: mail-outline, accent color

7. Add "Help & FAQ" entry point in `app/(tabs)/profile.tsx` under the Support section (above Privacy Policy and Terms).

Do not fetch FAQ content remotely — static array only, privacy-first.
Do not modify any screen other than `app/(tabs)/profile.tsx` (adding the navigation row).
Do not touch store, lib files, or auth.

### Check when done
- FAQ screen loads with all 10 items
- Tapping an item expands/collapses the answer
- Searching filters items correctly
- "Contact Support" opens the mail app
- Empty state shows when search has no matches
- `bunx tsc --noEmit` passes
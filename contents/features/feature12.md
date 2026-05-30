Read AGENTS.md first and follow it strictly.

## Task — Add Document Screen + AddDocumentForm

Build the Add Document screen (`app/add-document.tsx`) and `AddDocumentForm` component. This is how users enter a document into Zentra.

**Steps:**

1. Create `app/add-document.tsx` — a modal-style screen that opens from the FAB on the Home screen. Update the FAB's `onPress` in `app/(tabs)/index.tsx` to navigate to this route using `router.push("/add-document")`.

2. Create `components/AddDocumentForm.tsx` with the following fields:

   | Field | Input type | Notes |
   |---|---|---|
   | Document Name | Text input | Required. e.g. "Passport.pdf" |
   | Category | Picker / segmented control | Personal, Work, Finance, Health, Other |
   | File Type | Picker | PDF, Image, Doc, Other |
   | Expiry Date | Date picker | Use a simple text input with "YYYY-MM-DD" format for now (a proper date picker component can be added in a future polish pass) |
   | Size Label | Text input | Optional. e.g. "2.4 MB" — display only |
   | Notes | Multiline text input | Optional |
   | Notifications | Toggle switch | Default: on. Maps to `notificationsEnabled` on the document |

3. On submit:
   - Validate that Document Name and Expiry Date are filled
   - Generate a UUID for `id` using `crypto.randomUUID()` or a simple timestamp-based ID
   - Set `createdAt` and `updatedAt` to `new Date().toISOString()`
   - Call `addDocument(newDoc)` from `useDocumentStore`
   - If `notificationsEnabled` is true AND global notifications are enabled, call `scheduleDocumentNotifications(newDoc, notificationSettings.advanceNoticeDays)` from `lib/notifications.ts`
   - Navigate back after saving

4. Form validation: show inline error messages below each required field if empty on submit attempt. Use `Colors.error` for error text.

5. Style the screen as a bottom sheet or full-screen modal with:
   - Header: "Add Document" title + close/cancel button (top-right)
   - Submit button: full-width, accent color, "Save Document" label
   - Use NativeWind for all styling

Do not implement file picker / camera / gallery upload in this feature — the `localUri` field can be left empty for now.
Do not modify the store, lib files, or any tab screen other than updating the FAB `onPress` in `index.tsx`.
Do not change ExpiryBadge or DocumentCard.
Do not add new dependencies for the date picker — plain text input only for now.

### Check when done
- FAB on Home screen navigates to Add Document screen
- Submitting a valid form adds the document to the store and it appears in the Home screen lists
- Submitting an empty form shows inline validation errors
- Notifications are scheduled if `notificationsEnabled` is true
- `bunx tsc --noEmit` passes
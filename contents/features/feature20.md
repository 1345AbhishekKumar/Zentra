Read AGENTS.md first and follow it strictly.

## Task — Edit Document Screen

Add the ability to edit an existing document's details. Tapping the three-dot menu on the Document Details screen exposes an "Edit" option that opens this screen.

**Steps:**

1. Create `app/edit-document/[id].tsx` — a screen that looks identical to Add Document but pre-filled with the existing document's data.

2. Reuse `components/AddDocumentForm.tsx` by adding an `initialValues?: Partial<ZentraDocument>` prop:
   - If `initialValues` is provided, pre-fill all form fields with those values
   - The submit button label changes from "Save Document" to "Update Document"
   - On submit: call `updateDocument(id, updatedFields)` from the store instead of `addDocument`
   - Set `updatedAt` to `new Date().toISOString()` on every update

3. Wire the three-dot menu on `app/document/[id].tsx`:
   - Replace the decorative `...` icon with a functional `TouchableOpacity`
   - On press: show an `ActionSheet` / `Alert.alert` with options:
     - ✏️ **Edit** → navigate to `app/edit-document/[id]`
     - 🗑 **Delete** → confirm dialog → call `deleteDocument(id)` → navigate back
     - Cancel
   - Remove the separate "Delete Document" row from the actions list (it now lives in the three-dot menu)

4. After a successful update:
   - Call `scheduleDocumentNotifications` or `cancelDocumentNotifications` from `lib/notifications.ts` based on the document's `notificationsEnabled` state — the expiry date may have changed, so notifications must be rescheduled
   - Navigate back to `app/document/[id].tsx`

5. The `FilePickerButton` from feature16 should appear in the edit form. If the document already has a `localUri`, show it pre-populated in the picker (display name + size label).

Do not modify `components/AddDocumentForm.tsx` structure beyond adding `initialValues` prop and edit-mode submit behavior.
Do not change the store shape.
Do not touch any tab screen or the onboarding flow.
Do not change `lib/date.ts` or `lib/notifications.ts`.
Preserve all existing constraints from feature11 — the form behavior for new documents must be unchanged.

### Check when done
- Tapping `...` on Document Details shows Edit / Delete options
- Edit opens the form pre-filled with all existing document fields
- Submitting the edit updates the document in the store and reflects immediately on the Details screen
- Notifications are rescheduled after an edit if enabled
- Delete from the three-dot menu works identically to the previous delete row
- `bunx tsc --noEmit` passes
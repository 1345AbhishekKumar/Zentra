Read AGENTS.md first and follow it strictly.

## Task — Recently Deleted (Soft Delete with 30-Day Recovery)

Replace hard delete with a soft delete system. Deleted documents move to a "Recently Deleted" bin and are permanently removed after 30 days.

**Steps:**

1. Update `types/document.ts` — add two optional fields to `ZentraDocument`:
   ```ts
   deletedAt?: string;      // ISO datetime string — set when soft-deleted
   isDeleted?: boolean;     // true when in the trash
   ```

2. Update `store/documentStore.ts`:
   - Rename `deleteDocument(id)` → it now sets `isDeleted: true` and `deletedAt: new Date().toISOString()` instead of removing the document from the array
   - Add `restoreDocument(id: string)` — sets `isDeleted: false`, clears `deletedAt`
   - Add `permanentlyDeleteDocument(id: string)` — actually removes the document from the array and calls `cancelDocumentNotifications(id)`
   - Add `purgeExpiredTrash()` — removes all documents where `isDeleted === true` and `deletedAt` is more than 30 days ago. Call this once on app start inside `app/_layout.tsx` after hydration.
   - Update all store selectors and computed values (e.g. `upcomingExpirations`, `recomputeUpcoming`) to filter out `isDeleted === true` documents

3. Create `app/recently-deleted.tsx`:

   **Header:** Back arrow + "Recently Deleted" title + document count badge

   **Info bar**: "Documents are permanently deleted after 30 days."

   **Document list:**
   - Shows all `documents.filter(d => d.isDeleted === true)`
   - Each row: document name, category, original expiry date, days remaining until permanent deletion ("Deleted N days ago · Permanent in N days")
   - Swipe left on each row:
     - 🔄 **Restore** (green) → `restoreDocument(id)` + reschedule notifications if `notificationsEnabled` was true
     - 🗑 **Delete Forever** (red) → confirm dialog → `permanentlyDeleteDocument(id)`

   **"Empty Trash" button** at the bottom:
   - Full-width, red border, red text, "Delete All Permanently"
   - Confirm dialog: "This will permanently delete all N documents. This cannot be undone."
   - On confirm: call `permanentlyDeleteDocument` for each item in the trash

   **Empty state:** `EmptyState` with icon "trash-outline", title "Trash is empty", message "Deleted documents appear here for 30 days."

4. Add "Recently Deleted" row in `app/(tabs)/profile.tsx` under the Data section (above Export Data). Show the trash item count as a badge if > 0.

5. Update all delete call sites (swipe actions in Documents screen, three-dot menu in Document Details, delete category folder) — they already call `deleteDocument(id)` which is now a soft delete. No call site changes needed beyond verifying they use the store action.

Do not change `cancelDocumentNotifications` call behavior — it still fires on `permanentlyDeleteDocument` only, not soft delete.
Do not show soft-deleted documents anywhere in the app except `app/recently-deleted.tsx`.
Do not modify lib files or auth.

### Check when done
- Deleting a document moves it to Recently Deleted, not removes it
- Restoring a document brings it back to all lists immediately
- "Delete Forever" permanently removes the document
- `purgeExpiredTrash()` runs on app start and removes items older than 30 days
- Soft-deleted documents do not appear in Home, Documents, Alerts, or Favorites screens
- `bunx tsc --noEmit` passes
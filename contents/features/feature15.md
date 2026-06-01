Read AGENTS.md first and follow it strictly.

## Task — Expiry Alerts / Notification Center (Bell Icon)

Wire the notification bell icon on the Home screen to a real Alerts screen that shows all documents expiring soon, grouped by urgency.

**Steps:**

1. Create `app/alerts.tsx` — an Alerts / Expiry Center screen.

2. Layout:
   - **Header**: back arrow + "Expiry Alerts" title + a "Mark all read" text button (right side, accent color)
   - **Summary bar**: 3 stat pills in a row showing counts:
     - 🔴 Expired (count)
     - 🟠 Critical — ≤7 days (count)
     - 🟡 Warning — ≤30 days (count)
     - Use `expiryUrgency()` from `lib/date.ts` to classify each document
   - **Grouped list**: documents grouped into sections:
     - Section 1: "Expired" — documents past their expiry date
     - Section 2: "This Week" — expires within 7 days
     - Section 3: "This Month" — expires within 8–30 days
     - Section 4: "Next 3 Months" — expires within 31–90 days
     - Each section header: label + count. Hide the section entirely if count is 0.
   - **Each alert row**:
     - File type icon (color-coded)
     - Document name (bold)
     - `ExpiryBadge` (from feature11)
     - Expiry date formatted via `lib/date.ts formatDate()`
     - Tapping the row navigates to `app/document/[id]`
   - **Empty state**: `EmptyState` with icon "checkmark-circle-outline", title "All clear!", message "No documents expiring in the next 90 days"

3. Wire the bell icon on the Home screen (`app/(tabs)/index.tsx`):
   - The badge dot should show if there are any documents in the "Expired" or "Critical" urgency groups
   - Tapping the bell navigates to `app/alerts.tsx`

4. Add a local `useState<Set<string>>` for "read" alert IDs:
   - Tapping a row marks it as read (remove the dot/highlight)
   - "Mark all read" clears all unread indicators
   - This read state is local to the session — it resets on app restart (do not persist)

Do not implement real push notification inbox — this is a local computed view of the store.
Do not modify the store shape.
Do not change `lib/date.ts` or `lib/notifications.ts`.
Do not touch any tab screen other than wiring the bell icon in `app/(tabs)/index.tsx`.

### Check when done
- Bell icon on Home shows a badge dot when expired or critical documents exist
- Tapping bell opens Alerts screen
- Documents are correctly grouped into the 4 urgency sections
- Tapping a row navigates to Document Details
- Empty state shows when no documents expire within 90 days
- `bunx tsc --noEmit` passes
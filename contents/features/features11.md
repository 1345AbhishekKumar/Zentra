Read AGENTS.md first and follow it strictly.

## Task — Document Details Screen + ExpiryBadge Component

Build the Document Details screen (`app/document/[id].tsx`) and the `ExpiryBadge` component. This screen shows all information about a single document and its expiry status.

**Layout (top to bottom):**

1. **Navigation Header**
   - Back arrow (left) — navigates back
   - Title: "Document Details" — centered, bold
   - Three-dot menu icon (right) — decorative for now

2. **Document Icon + Name Block**
   - Large file type icon (64px, accent background, rounded-xl) centered
   - Document name below (large, bold, centered)
   - Sub-text: file type label + size (e.g. "PDF Document • 2.4 MB") in secondary color

3. **ExpiryBadge** (`components/ExpiryBadge.tsx`)
   - A pill/badge showing the expiry status of the document
   - Props: `expiryDate: string`
   - Uses `expiryUrgency()` and `expiryLabel()` from `lib/date.ts`
   - Urgency colors:
     - `expired`: red background, red text — "Expired"
     - `critical`: red/orange background — "Expires in N days"
     - `warning`: amber background — "Expires in N days"
     - `safe`: green background — "Expires in N days"
   - Place the badge prominently below the document name block

4. **Information Section**
   - Section header: "Information" (bold)
   - Rows (label left, value right):
     - Type: e.g. "PDF Document"
     - Size: e.g. "2.4 MB"
     - Added on: formatted date from `lib/date.ts formatDate()`
     - Expiry Date: formatted date
     - Location: the category name
   - Light divider lines between rows

5. **Actions Section**
   - Share (icon + label row)
   - Download (icon + label row)
   - Add to Favorites (icon + label row, heart icon — calls `toggleFavorite` from store)
   - Move (icon + label row)
   - Delete Document (icon + label row, trash icon in red `Colors.error`) — calls `deleteDocument` from store and navigates back

**Data:** Read the document from the store using `useDocumentStore` with the `id` from `useLocalSearchParams()`.

Use NativeWind for all styling. Use `lib/date.ts` for all date display.

Do not build Share, Download, or Move functionality — those actions are decorative rows for now (log to console on press).
Do not implement the three-dot menu.
Do not modify any screen other than `app/document/[id].tsx`.
Do not touch `app/(tabs)/` screens, the store, or auth.
Preserve ExpiryBadge as a standalone component — do not inline its logic into the screen.

### Reference
A design image of the Document Details screen is attached. Match the layout, icon treatment, information rows, and action list exactly.

### Check when done
- Screen loads correctly when navigated from Documents list
- ExpiryBadge shows the correct color based on expiry urgency
- Delete Document removes the doc from the store and navigates back
- Add to Favorites toggles correctly and reflects immediately
- `bunx tsc --noEmit` passes
Read AGENTS.md first and follow it strictly.

## Task — Documents List Screen (Search + Filter Tabs + Category Folders)

Build the Documents tab screen (`app/(tabs)/documents.tsx`). This screen shows all documents organized by category, with search and file-type filter tabs.

**Layout (top to bottom):**

1. **Screen Header**
   - Title: "Documents" — large, bold, left-aligned
   - Right: grid-view and list-view toggle icons (store the active view in local `useState` — no Zustand)

2. **Search Bar**
   - Same style as the Home screen search bar
   - Functional inline search: filter `documents[]` from the store by document name as the user types
   - Use local `useState` for the query string

3. **Filter Tabs (horizontal scroll)**
   - Pills: All · PDF · Images · Docs · Others
   - Active pill: accent background (`#4F46E5`), white text
   - Inactive pill: white background, secondary text, border
   - Selecting a tab filters the document list by `fileType`
   - "All" shows everything

4. **Category Folders (when no search query and "All" tab is active)**
   - Show category rows: Personal, Work, Finance, Health, Other
   - Each row: folder icon (accent color), category name, item count (e.g. "24 items"), chevron right
   - Tapping a category row filters the list to that category (use local state)

5. **Document List (when search is active OR a filter tab other than "All" is selected)**
   - Use `DocumentCard` component (`components/DocumentCard.tsx`) for each row
   - Each card: file type icon (colored), document name, size + date added, star/favorite icon
   - Tapping a document navigates to the Document Details screen (stub route `app/document/[id].tsx` — create the file but leave it as a placeholder)
   - Tapping the star icon calls `toggleFavorite(id)` from the store

6. **Create `components/DocumentCard.tsx`**
   - Props: `doc: ZentraDocument`, `onPress: () => void`, `onFavoritePress: () => void`
   - Renders file icon (color-coded by fileType), name, size, date, favorite star
   - Use `ExpiryBadge` component if document is expiring soon (ExpiryBadge is implemented in feature11 (Document Details Screen + ExpiryBadge Component) — leave a stub import for now)

All filtering logic lives in the component using `useMemo`. No new store selectors needed.
Use NativeWind for all styling. No StyleSheet except for shadows.

Do not build the Document Details screen content — the route file is a placeholder only.
Do not modify `app/(tabs)/index.tsx` or any other existing screen.
Do not touch the store, lib files, or auth.
Preserve the tab bar from feature4 exactly.

### Reference

A design image of the Documents screen is attached. Match the layout, folder rows, pill tabs, document list rows, and icon color coding exactly.

### Check when done

- Typing in search filters the document list in real time
- Tapping a filter pill updates the list correctly
- Tapping a category folder filters to that category
- Tapping a document row navigates to `app/document/[id]`
- Favorite icon toggles correctly and persists via the store

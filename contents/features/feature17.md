Read AGENTS.md first and follow it strictly.

## Task — Empty States, Loading States & Error States

Polish all screens with proper empty states, loading indicators, and error feedback. This is the final feature before the app is considered v1 complete.

**Steps:**

1. **Create `components/EmptyState.tsx`**
   - Props: `icon: string` (Ionicons name), `title: string`, `message: string`, `actionLabel?: string`, `onAction?: () => void`
   - Centered layout: large icon (accent color, 48px), bold title, secondary message, optional accent-colored CTA button
   - Reusable across all screens

2. **Home Screen (`app/(tabs)/index.tsx`) — empty states:**
   - If `documents[]` is empty: show `EmptyState` with title "No documents yet", message "Add your first document to get started", action "Add Document" → navigates to add screen
   - Quick Access section: hide entirely if fewer than 1 document exists

3. **Documents Screen (`app/(tabs)/documents.tsx`) — empty states:**
   - If `documents[]` is empty: show `EmptyState` with title "Your vault is empty", message "Start by adding a document"
   - If search returns no results: show `EmptyState` with title "No results found", message "Try a different search term"
   - If a category filter returns no results: show `EmptyState` with title "No {category} documents", message "Add a document to this category"

4. **Document Details Screen (`app/document/[id].tsx`) — not found state:**
   - If `id` param doesn't match any document in the store (e.g. after deletion with stale navigation): show `EmptyState` with title "Document not found" and a "Go back" action

5. **Loading state (store hydration):**
   - Zustand + AsyncStorage may take a moment to rehydrate on cold start
   - Add a `_hasHydrated` flag to the store (use Zustand's `onRehydrateStorage` callback)
   - In `app/_layout.tsx`, show a centered `ActivityIndicator` (accent color) until `_hasHydrated` is `true`
   - This prevents a flash of empty state before data loads

6. **Form validation feedback (`components/AddDocumentForm.tsx`):**
   - Already has inline validation errors from feature11 — verify they use `Colors.error` and appear directly below the relevant field

Do not add any new screens or routes.
Do not modify the store shape beyond adding `_hasHydrated`.
Do not touch lib files, auth, or the tab bar.
Do not add new dependencies — use existing Ionicons and NativeWind only.

### Check when done
- Home screen shows EmptyState when store is empty
- Documents screen shows correct empty state for each scenario (empty, no search results, no category results)
- Cold start shows an ActivityIndicator until the store has rehydrated
- Document Details shows "not found" state gracefully instead of crashing
- No TypeScript errors (`bunx tsc --noEmit` passes)
- `bunx expo start` runs cleanly with no warnings about missing components
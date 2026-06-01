Read AGENTS.md first and follow it strictly.

## Task — Global Search Screen

Build a real global search screen that the Home screen's search bar navigates to. Searches across document names, categories, notes, and expiry dates in one place.

First check if we already have the search system; if we do, improve it.


**Steps:**

1. Create `app/search.tsx` — a full-screen search experience.

2. On mount: auto-focus the search input using a `useRef` and `input.current?.focus()` inside a `useEffect`.

3. Header:
   - Back arrow (left) — navigates back
   - Search input (flex-fill, auto-focused) — placeholder: "Search documents..."
   - Clear button (X icon, right side) — only visible when query is not empty, clears the input

4. **Search logic** (all local, no API):

   Filter `documents` from the store using `useMemo`. A document matches if the query string (case-insensitive) appears in any of:
   - `doc.name`
   - `doc.category`
   - `doc.notes`
   - `formatDate(doc.expiryDate)` from `lib/date.ts` (e.g. searching "May" finds docs expiring in May)

   ```ts
   const results = useMemo(() => {
     if (!query.trim()) return [];
     const q = query.toLowerCase();
     return documents.filter(doc =>
       doc.name.toLowerCase().includes(q) ||
       doc.category.toLowerCase().includes(q) ||
       (doc.notes ?? "").toLowerCase().includes(q) ||
       formatDate(doc.expiryDate).toLowerCase().includes(q)
     );
   }, [query, documents]);
   ```

5. **States:**
   - **Empty query** (no text typed yet): show "Recent Searches" section (last 5 searches stored in local `useState`, persisted in AsyncStorage under `"zentra_recent_searches"`)
   - **Query typed, results found**: show matching `DocumentCard` rows with the matching text highlighted (bold the matching substring in the document name)
   - **Query typed, no results**: show `EmptyState` with title "No results for "{query}"", message "Try searching by name, category, or expiry month"

6. **Recent searches:**
   - On each search (when the user stops typing for 300ms debounce): save the query to recent searches (max 5, deduplicated)
   - Tapping a recent search populates the input
   - "Clear" link (right of section header) clears recent searches from state and AsyncStorage

7. Wire the Home screen search bar: update `app/(tabs)/index.tsx` — tapping the search bar calls `router.push("/search")` (was already stubbed this way).

Do not build search inside any tab screen — this dedicated screen is the only place.
Do not modify `DocumentCard` internals for the highlight — render the highlight inline in the search results list.
Do not change store shape, lib files, or auth.
Do not touch the Documents screen search (it remains a local filter within that screen).

### Check when done
- Tapping the Home screen search bar opens `app/search.tsx` with auto-focused input
- Typing searches across name, category, notes, and expiry date
- Results render correctly with matching document rows
- Empty query shows recent searches
- Recent searches persist across sessions via AsyncStorage
- No results state shows correct empty state
- `bunx tsc --noEmit` passes
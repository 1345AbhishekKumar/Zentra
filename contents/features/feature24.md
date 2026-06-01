Read AGENTS.md first and follow it strictly.

## Task — Sort Control on Documents Screen

Add a sort control to the Documents screen so users can order their document list by name, expiry date, or date added.

**Steps:**

1. In `app/(tabs)/documents.tsx`, add a sort control row between the filter tabs and the document list / category folders.

2. The sort control is a horizontal row of 3 text-pill buttons:
   - **Name** (A → Z)
   - **Expiry** (soonest first)
   - **Date Added** (newest first)

   Active pill: accent background (`#4F46E5`), white text, rounded-full.
   Inactive pill: transparent background, secondary text, no border.
   Default active: "Date Added".

   Store the selected sort in local `useState<"name" | "expiry" | "added">`. No Zustand needed.

3. Apply the sort using `useMemo` on the filtered document list (after search and filter tab are applied):

   ```ts
   const sortedDocs = useMemo(() => {
     const filtered = /* existing filter logic */;
     if (sort === "name") return [...filtered].sort((a, b) => a.name.localeCompare(b.name));
     if (sort === "expiry") return sortByExpiry(filtered); // from lib/date.ts
     return [...filtered].sort((a, b) =>
       new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
     );
   }, [documents, searchQuery, activeFilter, activeCategory, sort]);
   ```

4. The sort control is **hidden** when the category folder view is active (no search, "All" tab selected, no category drilled into). It only appears when a list of `DocumentCard` rows is being shown.

5. When the sort is "Expiry", add a subtle `ExpiryBadge` inline on each `DocumentCard` row — call it with `doc.expiryDate`. This makes the sort visually meaningful at a glance.

Do not change `DocumentCard` component props — the `ExpiryBadge` addition is rendered inside the Documents screen's list render, not inside `DocumentCard` itself. If `DocumentCard` already has an `ExpiryBadge` stub from feature9, wire it here.
Do not modify any other screen.
Do not touch the store, lib files, or auth.
Do not change the search or filter tab behavior from feature9.

### Check when done
- Sort pills appear when a document list is visible (not when category folders are shown)
- "Name" sort orders documents A→Z correctly
- "Expiry" sort orders by soonest expiry using `sortByExpiry()`
- "Date Added" sort orders by `createdAt` descending
- Sort + search + filter tab all compose correctly together
- `bunx tsc --noEmit` passes
Read AGENTS.md first and follow it strictly.

Implement the home screen UI based on the attached design. the existing NativeWind/global.css design utilities.


@assets/images/home.png



## Task — Dashboard / Home Screen

Build the Home tab screen (`app/(tabs)/index.tsx`). This is the first real screen of Zentra and the most important first impression.

**Layout (top to bottom):**

1. **DashboardHeader** (`components/DashboardHeader.tsx`)
   - App name "Memora" or "Zentra" in accent color (`#4F46E5`), bold, top-left
   - Notification bell icon top-right (with a blue badge dot if there are upcoming expirations)
   - Below: "Hello, {user.displayName}" in large bold text
   - Sub-text: "Good to see you again!" in secondary text color

2. **Search Bar**
   - Rounded pill shape, light gray background (`Colors.accentSoft` or `#F3F4F6`)
   - Placeholder: "Search documents, folders..."
   - Search icon on the left, accent-colored search button icon on the right
   - Tapping the search bar navigates to Documents tab (do not build inline search here)

3. **Quick Access section**
   - Section header: "Quick Access" (bold) + "See all" link (accent color, right-aligned)
   - Horizontal scroll row of document shortcut cards
   - Show the 3 most recently added documents from the store
   - Each card: document type icon, document name (truncated), file type + size
   - Card style: white background, rounded-xl, subtle shadow

4. **Recent Documents section**
   - Section header: "Recent Documents" (bold)
   - Vertical list of the 4 most recently added documents
   - Each row: file type icon (colored by type — red for PDF, gray for doc, green for image), document name, date added + size, three-dot menu icon
   - Tapping a row navigates to the Document Details screen (stub route for now)

5. **FAB (Floating Action Button)**
   - Accent-colored (`#4F46E5`) circular button, bottom-right
   - `+` icon in white
   - Tapping navigates to the Add Document screen (stub route for now)

**Data:** Read `documents` from `useDocumentStore`. Sort by `createdAt` descending for Recent Documents.

Use `lib/date.ts` for any date display. Use NativeWind for all styling.

Do not build the search functionality — tapping the search bar navigates to Documents tab only.
Do not build the three-dot menu actions — the icon is decorative for now.
Do not modify any files outside `app/(tabs)/index.tsx` and `components/DashboardHeader.tsx`.
Do not touch the store, lib files, or auth flow.
Preserve the tab bar from feature4 exactly.

### Reference
A design image of the Home screen is attached. Match the layout, spacing, card styles, typography hierarchy, and color usage exactly.

### Check when done
- Header shows the user's display name from Clerk (`useUser().user.firstName`)
- Quick Access renders the 3 most recent documents (or fewer if store has less)
- Recent Documents renders up to 4 most recent documents
- FAB is visible and fixed to bottom-right above the tab bar
- Screen scrolls smoothly when content overflows
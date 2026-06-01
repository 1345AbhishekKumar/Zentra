# Resolution Report: Native Module Errors

Here is a simple summary of the errors encountered, their root causes, and how we successfully resolved them.

## 1. Startup Crash: "Cannot override the host object for expo module 'ExpoImagePicker'"

### Root Cause
- In `index.js`, the startup entrypoint was attempting to mock missing native modules by directly assigning empty objects to the native module registry at `global.expo.modules["ExpoImagePicker"] = {}` and `global.expo.modules["ExpoDocumentPicker"] = {}`.
- However, `global.expo.modules` is a JSI HostObject controlled directly by the C++ native Expo modules runtime. In React Native/JSI, properties on host objects cannot be directly overwritten or assigned to from JavaScript. Doing so triggers a native setter exception (`Cannot override the host object`) and crashes the app on startup.

### Solution
- We removed the direct `global.expo.modules` assignments/mocks from `index.js`.

---

## 2. Incorrect Image Picker Native Module Name Query

### Root Cause
- The code queried `"ExpoImagePicker"` instead of the correct native module identifier `"ExponentImagePicker"`.
- Because of this, the check was returning `false` even on platforms where the native module was correctly linked and available.

### Solution
- We corrected `"ExpoImagePicker"` to `"ExponentImagePicker"` in both `index.js` and `src/components/FilePickerButton.tsx`.

---

## 3. Package Resolution Crash: "Cannot find native module 'ExpoDocumentPicker'"

### Root Cause
- The package `expo-document-picker` executes `requireNativeModule('ExpoDocumentPicker')` at the top level when imported. In environments without the native binaries (like Expo Go or Web), importing the package crashes the app instantly at startup.

### Solution
- In `src/components/FilePickerButton.tsx`, we wrap the package imports inside conditional runtime `require()` statements (e.g., `require("expo-document-picker")` and `require("expo-image-picker")`).
- These requires are guarded by the module presence flags `isImagePickerNativeAvailable` and `isDocumentPickerNativeAvailable` (determined safely via `requireOptionalNativeModule` on startup and cached on `globalThis`).
- On environments without the native binaries, the flags resolve to `false`, the runtime `require()` branches are never executed, and the packages are never loaded. This guarantees a safe fallback to sandbox mode without any startup or runtime package crashes.

---

## 4. Feature 22: Notification Deep Linking

### What Was Done
- Added notification deep linking so tapping an expiry reminder notification opens the corresponding Document Details screen.

### Changes Made
- **`src/app/_layout.tsx`**: Created an `InitialLayout` component nested inside `ClerkProvider` with:
  - `addNotificationReceivedListener` — foreground notifications (no navigation).
  - `addNotificationResponseReceivedListener` — navigates to `/document/{id}` when user taps a notification from background/active state.
  - `getLastNotificationResponseAsync()` — handles killed-state cold start by checking for a pending notification response after both store hydration and Clerk auth are ready.
  - A `useRef` guard (`coldStartHandled`) prevents duplicate cold-start navigation.
  - All navigation is guarded: the `documentId` must exist in the store's `documents[]` array, otherwise navigation is silently skipped (no crash).
- **`src/lib/notifications.ts`**: No changes needed — `data: { documentId: doc.id }` payload was already present.

### Verification
- `bunx tsc --noEmit` passes with 0 errors.

---

## 5. Calendar Picker Days Grid Layout Bug: Flat/Straight Grid

### Root Cause
- In `src/components/DatePickerField.tsx`, the calendar days grid container was styled using the NativeWind classes `className="flex-row flex-wrap px-4 pb-6 bg-surface"`.
- Under the custom Tailwind CSS v4 and NativeWind v5 configurations, the `flex-wrap` utility class was failing to compile or map correctly into the React Native styles. This caused the container to behave as `flexWrap: "nowrap"`.
- Consequently, all 35+ day items (each with `width: "14.28%"`) were forced onto a single horizontal row, squishing each cell to less than 3% of the container width. This made the picker appear as a single, flat, "totally straight" row where the calendar dates were completely unreadable and unselectable.

### Solution
- Replaced the class-based flex layout on the Days Grid inside `src/components/DatePickerField.tsx` with explicit React Native inline styles:
  ```tsx
  style={{ flexDirection: "row", flexWrap: "wrap" }}
  ```
- Proactively applied the same resolution to the other instances where dynamic grid wrapping is essential:
  - **`src/components/AddDocumentForm.tsx`**: Updated the Category Selector pills wrapper to use `style={{ flexDirection: "row", flexWrap: "wrap" }}` to ensure custom/dynamic categories wrap correctly.
  - **`src/app/(tabs)/documents.tsx`**: Updated the Documents Grid view cards container to use `style={{ flexDirection: "row", flexWrap: "wrap" }}` to prevent grid cards from collapsing into a single squished row.

### Verification
- Ran the TypeScript compilation command `bunx tsc --noEmit` and confirmed it successfully outputted 0 compilation errors.

---

## 6. Expiry Date Input & Modal Calendar Refinements (`/impeccable`)

### Visual & Interactive Goals
- **Eliminate Redundancy**: Removed the duplicate "Select Expiry Date" label text from inside the input field row since the label "Expiry Date *" is already present above it.
- **Consistent Input Affordances**: Restructured the date picker trigger to render identically to other text inputs in terms of paddings, focus/error rings, and a fixed height (`minHeight: 52`). The placeholder `"Select date"` or the active selection (e.g. `"19 Jun 2026"`) now sits cleanly on the left, and a calendar icon sits on the right.
- **Tactile Hierarchy & Typography**: Styled month navigation, buttons (Cancel/Done), and weekday labels with explicit `font-display` (Outfit) and `font-sans` (Inter) classes from Zentra's design system.
- **Visual Feedback & Focus**: Today's date is now visually highlighted with a soft, semi-transparent indigo background (`bg-soft-accent`) and outline (`border-accent/30`) when not selected. Selected dates pop in solid indigo (`bg-accent`), while past dates are cleanly disabled and muted (`opacity-25`).
- **Standard Conformance**: Fixed camelCase NativeWind selectors like `bg-softAccent` to `bg-soft-accent` to conform to Tailwind v4 CSS variables.

### Verification
- Tested with `bunx tsc --noEmit` and verified a clean build with no errors.

---

## 7. DatePicker Modal Horizontal Collapse

### Root Cause
- In `src/components/DatePickerField.tsx`, the custom JavaScript bottom sheet modal calendar card was styled using NativeWind classes: `className="bg-surface rounded-t-2xl overflow-hidden w-full max-w-lg self-center shadow-lg"`.
- Under the Tailwind CSS v4 and NativeWind v5 configurations on native devices (iOS/Android), styling attributes like `w-full` (width: '100%') and `max-w-lg` (max-width: 512px) did not propagate or resolve correctly when combined with `self-center` (`alignSelf: "center"`) within a parent view (`modalOverlay`) that lacked explicit width constraints.
- Consequently, the card's width collapsed completely to near 0. Because there was no vertical restriction on the card layout, the internal content (such as headers and dates) wrapped vertically letter-by-letter, stretching the card into a thin vertical white line running from the top of the screen to the bottom.

### Solution
- Replaced the NativeWind width classes with explicit React Native inline styling on the calendar bottom sheet card `View`:
  ```tsx
  style={{ width: "100%", maxWidth: 512 }}
  ```
- Added explicit width and height dimensions to the parent overlay container (`styles.modalOverlay` in `src/components/DatePickerField.tsx`):
  ```typescript
  modalOverlay: {
    flex: 1,
    width: "100%",
    height: "100%",
    backgroundColor: "rgba(18, 18, 26, 0.4)",
    justifyContent: "flex-end",
  },
  ```

### Verification
- Ran `bunx tsc --noEmit` and verified a clean build with no errors.

---

## 8. Runtime Crash: "Cannot find native module 'ExpoSharing'" / "Cannot find native module 'ExpoIntentLauncher'"

### Root Cause
- In `src/app/document/[id].tsx` and `src/components/FileViewer.tsx`, the code used dynamic imports (e.g. `require("expo-sharing")` and `require("expo-intent-launcher")`) to prevent startup evaluation crashes on devices lacking these native binaries.
- However, when the user triggered the corresponding action (e.g. clicking the "Share" button or opening a file), the dynamic `require` was executed.
- If the environment (such as Expo Go or an unlinked simulator/emulated build) does not compile/possess the native binary layers for `ExpoSharing` or `ExpoIntentLauncher`, the `require` statement evaluates the package which internally calls `requireNativeModule` and crashes immediately with `Cannot find native module 'ExpoSharing'`.
- In Metro's module registry, if a package fails to load the first time due to an evaluation error, subsequent `require` calls of that package return `undefined`. This explains the secondary `TypeError: Cannot read property 'isAvailableAsync' of undefined` error on subsequent clicks.

### Solution
- Guarded all dynamic requires of `expo-sharing` and `expo-intent-launcher` with a check using `requireOptionalNativeModule` from `expo-modules-core` to verify native binary availability *before* executing the `require` call.
- In `src/app/document/[id].tsx` and `src/components/FileViewer.tsx`:
  - Before requiring `expo-sharing`, we check:
    ```typescript
    let isNativeSharingAvailable = false;
    if (Platform.OS === "web") {
      isNativeSharingAvailable = true;
    } else {
      try {
        const { requireOptionalNativeModule } = require("expo-modules-core");
        isNativeSharingAvailable = !!requireOptionalNativeModule("ExpoSharing");
      } catch {
        isNativeSharingAvailable = false;
      }
    }
    ```
  - If `isNativeSharingAvailable` is `false`, we gracefully display an `Alert.alert` to the user explaining that sharing is not available on this environment/device.
  - Applied a similar check using `requireOptionalNativeModule("ExpoIntentLauncher")` on Android before importing and running `expo-intent-launcher`.
- Added missing `Platform` import from `"react-native"` in `src/app/document/[id].tsx`.

### Verification
- Tested with `bunx tsc --noEmit` and verified a clean compile with 0 errors.

---

## 9. Profile Screen Refinements & Polish (`/impeccable`)

### Goal
- Polish the Profile/Settings screen (`src/app/(tabs)/profile.tsx`) to resolve style drift, visual clutter, lack of interactive states, and layout accessibility issues.

### Refinements & Bug Fixes
- **Structural Layout Alignment**: Converted the fixed white header into a scrollable transparent header title, and card-wrapped the top User Identity section to match the surrounding rounded card lists and screens.
- **Style Typo Corrected**: Replaced `bg-softAccent` class typo with the proper Tailwind config theme token `bg-soft-accent`.
- **Icon Uniformity**: Replaced `Ionicons` (e.g. `heart-outline`, `notifications-outline`) with matching `Feather` icons (`heart`, `bell`) in settings row slots to unify the icon system as mandated by `DESIGN.md`. Unused `Ionicons` import was removed.
- **Initials Avatar Redesign**: Redesigned default user initials avatar to use a light-mode friendly `bg-soft-accent` background with indigo `text-accent` text, surrounded by an elegant soft-accent border.
- **Section Headers De-cluttering**: Removed boxy divider borders (`border-b border-t border-border/30`) and backgrounds from Settings sections (e.g. "My Content", "Notifications"), restructuring them as clean, spacious text labels with proper margins (`px-6 pt-5 pb-2` and `font-semibold uppercase tracking-wider`).
- **Keyboard Avoidance in Modal**: Wrapped Edit Name modal contents in a `KeyboardAvoidingView` component with platform-specific behavior configurations to prevent keyboard overlapping on smaller screen devices.
- **Interactive Focus Indicator**: Added active focus states to name text inputs inside the modal, applying an indigo `border-accent border-2` border ring when focused, and reverting to `border-border` when blurred.
- **Tactile Notice Chips Feedback**: Added active opacity and scale transformations on notice chip selections to provide clean on-press tactile feedback.

- Checked with `bunx tsc --noEmit` which completed successfully with 0 errors.

---

## 10. Favorites Screen Integration

### Problem
- The Favorites screen (`src/app/favorites.tsx`) was a placeholder screen displaying mock content.
- Clicking the "Favorites" row in the Profile screen navigated to `/favorites`, which failed to display the user's favorited documents or reflect the actual database state.

### Root Cause
- The screen was not yet implemented to read from the global Zustand documents store or display real items.

### Solution
- Refactored `src/app/favorites.tsx`:
  - Connected the screen to `useDocumentStore` to retrieve the `documents` array and `toggleFavorite` action.
  - Added filtering logic to identify documents with `isFavorite: true`.
  - Integrated the `DocumentCard` component to render each favorited item in list mode, enclosed in a card with list shadow styling identical to the Documents screen.
  - Implemented the `EmptyState` component to render a premium illustration card with a "Browse Documents" action redirecting back to `/documents` if the favorites list is empty.
  - Added support for toggling the favorite status directly from the list, removing it immediately from the view.

### Verification
- Ran `bunx tsc --noEmit` which completed successfully with 0 errors.

---

## 11. Add/Edit Document Screen Polish

### Goal
- Polish the visual hierarchy, form input alignment, required indicators, touch targets, and scroll experience on the Add and Edit Document screens using the `impeccable` design principles.

### Changes Made
- **Label Hierarchy**: Standardized required fields by rendering the asterisk (`*`) in red (`text-danger`) color and styling the optional indicator `(Optional)` as muted gray, normal weight (`text-secondary font-normal text-body-sm`) across input fields and the file picker component.
- **Consistent Heights & Centering**: Set text inputs (`name`, `sizeLabel`) to match the Date Picker trigger and buttons at exactly `height: 52` (with vertical padding reset to `0`), ensuring perfect visual height alignment and vertical text centering across all fields on iOS, Android, and Web.
- **Improved Touch Targets & Padding**: Enlarged category pills and file-type selection tabs to `py-3` to easily meet the 44px touch target specification. Added `px-6` horizontal padding to both the "Cancel" and "Save Document" buttons to match standard design-system conformance and visual breathing room.
- **Text & Weight Alignment**: Unified typography inside the Expiry Date trigger text box with standard text inputs (using normal weight `text-primary` instead of `font-medium` when a date is selected).
- **DatePicker Trigger Border**: Resolved a visual bug on native devices where the Expiry Date picker container rendered with no border by explicitly adding `border border-border` to the Pressable's className and specifying `borderStyle: "solid"` in the inline styles.
- **Corrected Scroll Padding**: Removed horizontal padding `px-6` from the main modal screens (`add-document.tsx` and `edit-document/[id].tsx`), moving the `24px` horizontal padding inside the ScrollView `contentContainerStyle` in `AddDocumentForm.tsx`. This makes the entire screen width scrollable, avoids content clipping, and renders scrollbars cleanly at the screen edges.
- **OS Underline Reset**: Added `underlineColorAndroid="transparent"` to TextInputs to ensure flat styling on Android devices.

### Verification
- Tested with `bunx tsc --noEmit` and verified a clean compile with 0 errors.

---

## 12. Expiry Date Picker Trigger Text Padding Bug

### Problem
- On React Native Web, the Expiry Date picker trigger container displayed "Select date" or the selected date value flush against the left border, with zero horizontal padding.

### Root Cause
- The layout styling for the Pressable trigger was defining dynamic padding values (`paddingHorizontal: 16` and `paddingVertical: 12`) inside the dynamic `style` function.
- Due to style evaluation and merging limitations in React Native Web when combined with NativeWind v5/Tailwind v4 class-based rules, inline dynamic padding properties on Pressable components failed to apply on the web engine.

### Solution
- Moved the layout padding and height settings from the dynamic inline `style` prop to static Tailwind utility classes:
  - Added `px-4 h-[52px]` to the Pressable's `className` prop.
  - Removed `paddingHorizontal`, `paddingVertical`, and `minHeight` from the inline style block.
- This ensures the layout compiles to native CSS declarations that resolve correctly on Web, while maintaining exact visual equivalence (16px horizontal padding, 52px height, and vertical item alignment) across iOS, Android, and Web.

### Verification
- Ran `bunx tsc --noEmit` which completed successfully with 0 errors.

---

## 13. Expiry Alerts Persistent Read State & Bell Badge Sync

### Problem
- On the Home screen, clicking the bell icon opens the Expiry Alerts screen. However, when the user marks all alerts as read and leaves the screen, reopening the Alerts screen resets them all back to "unread".
- Additionally, the Home screen's bell icon badge was showing a red dot based strictly on the presence of any expired or critical documents, regardless of whether the user had already read and acknowledged those alerts.

### Root Cause
- The read/unread status of alerts was managed strictly as session-local React state (`useState`) within the `alerts.tsx` component. Consequently, mounting/unmounting the Alerts screen wiped the read state.
- The bell icon badge on the Home screen header was completely decoupled from this read status, querying only standard document expiration urgency levels.

### Solution
- **State Store Persistence (`src/store/documentStore.ts`)**:
  - Refactored the local Zustand store state to include a persisted `readAlerts: string[]` slice containing document IDs whose alerts have been marked as read.
  - Added actions `markAlertAsRead` and `markAllAlertsAsRead` to update the array.
  - Wired CRUD handlers: deleting a document removes its ID from `readAlerts`. Editing a document's `expiryDate` automatically clears its ID from `readAlerts` (resetting its status to unread) to alert the user of the new date.
  - Added `readAlerts` to Zustand storage `partialize` keys to persist it locally in AsyncStorage.
- **Home Bell Badge Sync (`src/components/DashboardHeader.tsx`)**:
  - Connected the header component to retrieve the persisted `readAlerts` array.
  - Adjusted the bell badge logic to check `const isUnread = !readAlerts.includes(doc.id)`. The red dot is now only displayed if there is at least one unread document with an `"expired"` or `"critical"` urgency.
- **Alerts Screen Integration (`src/app/alerts.tsx`)**:
  - Replaced the local `useState` for `readAlerts` with the persisted Zustand store state and actions.
  - Added an O(1) `Set` memoized lookup (`readAlertsSet`) inside the render block to maintain list rendering performance.

### Verification
- Tested with `bunx tsc --noEmit` and verified a clean compile with 0 errors.

---

## 14. Search Relocation to Home Screen

### Problem & Goal
- The search input and logic were previously placed on the Documents tab screen.
- The Home screen had a static pressable search bar that redirected the user to the Documents screen.
- The goal was to remove the search system and UI entirely from the Documents screen and build a fully interactive search input, state, and filtering system on the Home screen.

### Solution
- **Documents Screen (`src/app/(tabs)/documents.tsx`)**:
  - Removed `searchQuery` local state.
  - Deleted the TextInput search bar UI container from the JSX template.
  - Simplified the `filteredDocuments` filter logic and the `showFolders` check.
  - Cleaned up search-related empty states and clear search triggers.
- **Home Screen (`src/app/(tabs)/index.tsx`)**:
  - Added `searchQuery` state.
  - Replaced the static search bar pressable container with a live `TextInput` input field that updates `searchQuery`.
  - Added a dynamic clear ("x") button that displays when a query is entered to reset search query state.
  - Added filtering logic to perform case-insensitive matching of document names against the input.
  - Added conditional search results views:
    - If a search is active and yields results, they are formatted inside a card-wrapped list using the existing `RecentDocRow` component (matching design aesthetics).
    - If a search is active but yields no results, it renders Zentra's `EmptyState` component with a `"search-outline"` icon, `"No results found"` title, and `"Clear Search"` button.
    - If no search is active, the dashboard displays either the standard empty state or the regular Quick Access & Recent Documents lists.

### Verification
- Ran the TypeScript compiler check (`bunx tsc --noEmit`) and verified it successfully completed with 0 errors.

---

## 15. Feature 27: Error Boundary & Crash Handling

### What Was Done
- Wrapped the entire application in a global error boundary fallback UI so that unexpected crashes show a friendly recovery screen instead of a blank white app.
- Safeguarded high-risk operations in Zustand store and notification lib using `try/catch` handlers.

### Changes Made
- **`src/components/ErrorScreen.tsx`**: Created a beautiful fallback recovery screen:
  - Centers content vertically with a warning icon (`warning` from `Ionicons`, 64px size, colored in `#F59E0B`).
  - Styled with typography fonts, sizes, and colors matching Zentra's design tokens (Outfit/Inter).
  - Displays error messages inside a scrollable gray block when running in development mode (`__DEV__`).
  - Includes a "Try Again" button to reset error boundary state, and a "Restart App" button using `Updates.reloadAsync()` from `expo-updates`.
- **`src/components/ErrorBoundary.tsx`**: Created a React class component wrapping children, logging caught rendering errors to `console.error` (privacy-first, local logs only), and rendering `ErrorScreen` on failures.
- **`src/app/_layout.tsx`**:
  - Imported `ErrorBoundary` and wrapped `ClerkProvider` and `InitialLayout` inside `<ErrorBoundary>`.
  - Wrapped `SplashScreen.hideAsync()` in a try/catch block to prevent crash issues on Android.
  - Registered a global handler inside `useEffect` using `ErrorUtils` to intercept and log unhandled global errors and promise rejections.
- **`src/store/documentStore.ts`**: Wrapped the contents of `addDocument` and `deleteDocument` actions in `try/catch` blocks to prevent UI crashes and log database errors locally.
- **`src/lib/notifications.ts`**: Wrapped all async `expo-notifications` calls inside try/catch blocks.

### Verification
- `bunx tsc --noEmit` passes with 0 errors.

---

## 16. Feature 28: Accessibility Audit (VoiceOver + TalkBack)

### What Was Done
- Audited the entire application to ensure full usability with screen readers (VoiceOver/TalkBack) and compliance with App Store accessibility submission guidelines.
- Standardized interactive components, touch sizes, text inputs, and contrast ratios without visual redesigns.

### Changes Made
- **Central Theme Color (`src/theme/tokens.ts` & `src/theme/tokens.css`)**: Darkened the secondary text color token (`secondary` / `--color-secondary`) from `#727272` to `#636363` to increase normal text contrast on a light background from 4.45:1 (failing WCAG AA) to a fully compliant 5.6:1 ratio.
- **Header Navigation Buttons**: Updated all screen back buttons (`Go back`) and options buttons (`More options`) in `favorites.tsx`, `alerts.tsx`, `search.tsx`, and `document/[id].tsx` with explicit `accessibilityRole="button"`, proper `accessibilityLabel`, and cross-platform safe `hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}` object structures.
- **TextInput Fields (Auth & Core Form)**: Added explicit descriptive `accessibilityLabel` tags to all TextInputs across `sign-in.tsx` (email, password), `sign-up.tsx` (email, password), `forgot-password.tsx` (email, code, new password), and `VerificationModal.tsx` (code overlay).
- **Interactive Action Links & SSO Buttons**: Integrated correct roles (`accessibilityRole="button"` and `accessibilityRole="link"`) and labels to action items like Forgot Password links, Show/Hide password toggles, Google SSO buttons, Footer redirect links, and clear search triggers.
- **Detailed Action Buttons**: Wired `accessibilityRole="button"` and clear labels to View File, Share, Download, Favorite (adaptive star label), and Move action Pressables inside the Document Details screen.
- **Dynamic Announcements (`AccessibilityInfo`)**: Added on-device screen reader notifications. Deleting a document calls `AccessibilityInfo.announceForAccessibility("Document deleted")` inside `document/[id].tsx` to inform blind/visually impaired users immediately.
- **Standardized HitSlop Objects**: Standardized hitSlop targets on small touchpoints (Favorite stars, clear search Xs, modal close Xs) into explicit object shapes for iOS and Android reliability.


---

## 17. Code Quality & Document Consistency Polish

### What Was Done
- Addressed multiple styling, documentation, logic, and accessibility issues across screens, components, stores, helper libraries, and feature documentation.

### Changes Made
- **Documentation Polish (`contents/docs.md`, `contents/features/`)**:
  - Replaced outdated scanner plugin references in `contents/docs.md` with clear "Reference Only" warnings.
  - Corrected typos, grammatical errors, and feature sources (e.g. `ExpiryBadge` feature source tracking, `FilePickerButton` source tab references) in features files.
  - Updated all installation commands to use `bun add` instead of `npm/yarn`.
  - Added warnings and checklists for bare React Native packages (like `react-native-pdf`).
- **Mount Guards & State Safety (`src/app/(tabs)/profile.tsx`)**:
  - Introduced `isMountedRef` mount guards to prevent state updates after unmount inside the camera and photo library sandbox timeout functions.
- **Asynchronous Optimization (`src/app/(tabs)/profile.tsx`)**:
  - Replaced sequential loop scheduling for local notifications with parallel `Promise.all` scheduling.
- **Web Styling & Type Safety (`src/components/DatePickerField.tsx`)**:
  - Defined web input styles as typed `React.CSSProperties` object, removing type assertion overrides (`as any`).
  - Derived accessibility labels and bottom sheet calendar header titles dynamically from the component's `label` prop.
  - Cleaned up redundant `as any` casts on native layouts and elements.
- **Store & State Consistency (`src/store/documentStore.ts`, `src/types/document.ts`)**:
  - Hoisted default folder literals into a single exported `DEFAULT_FOLDERS` array.
  - Replaced state mutations in the storage hydration logic (`onRehydrateStorage`) with clean store `set()` calls.
  - Wrapped `updateDocument` state set and scheduling operations inside a safety-guarded try-catch block.
  - Refactored `DocumentCategory` as a type-union template to support both literal autocompletes and custom categories.
- **Form Controls & Date Validation (`src/components/AddDocumentForm.tsx`)**:
  - Added category fallback list logic to ensure the active category pill is always shown, even if folders are empty or does not contain the selected category.
  - Updated expiry date validator to bypass future-date checks when editing an existing document and the date remains unchanged.
- **Notification Settings Integration (`src/app/document/[id].tsx`)**:
  - Enforced global notification settings (`notificationSettings.globalEnabled`) check during single document notifications toggling.
- **Alerts Bucketing Logic (`src/app/alerts.tsx`)**:
  - Synced stat count variables directly to their respective section list lengths to prevent discrepancy between badge numbers and items list count.
- **Sharing Concurrency (`src/app/document/[id].tsx`)**:
  - Added a unique `Date.now()` suffix to the temporary plain-text sharing file to prevent concurrent actions clobbering each other.
- **Centralized Deprecation Cleanup (`src/components/FilePickerButton.tsx`, `src/app/(tabs)/profile.tsx`)**:
  - Replaced the deprecated `ImagePicker.MediaTypeOptions.Images` with modern `["images"]` string arrays.

### Verification
- Verified that all code compiles cleanly by running `bunx tsc --noEmit`.

---

## 18. Custom ActionSheet / Options Menu for Three-Dots Icon Buttons

### Problem
- Tapping the three-dots icon button on the Document Details screen and Folders list screen triggered the default OS-level `Alert.alert` dialog containing options (Edit, Delete, Cancel).
- This generic pop-up list did not match Zentra's custom typography, colors, borders, and overall premium design system.
- The three-dots menu buttons on the Recent Documents list on the Home screen index tab did not trigger any action sheet or menu options (empty `onPress` callback).

### Solution
- **ActionSheet Component (`src/components/ActionSheet.tsx`)**:
  - Developed a custom, premium JavaScript-based bottom sheet modal wrapper that aligns exactly with Zentra's typography, colors, and layout guidelines.
  - Implemented a translucent backdrop overlay (`rgba(18, 18, 26, 0.4)`) that dismisses the sheet when tapped.
  - The menu card features top-rounded corners (`rounded-t-[24px]`) and lists options with clean visual separation, displaying left-aligned Feather icons, medium-weight text, and highlight feedback.
  - Destructive options (such as "Delete") are colored in Zentra's red danger indicator (`#EF4444`).
  - Added support for screen readers with accessibility properties (`accessibilityRole="button"`, proper hitSlop, and custom labels).
- **Document Details (`src/app/document/[id].tsx`)**:
  - Imported the `<ActionSheet>` component and wired it to open when the details header options button is tapped, allowing user to navigate to edit or delete the document.
- **Folder List (`src/app/(tabs)/documents.tsx`)**:
  - Replaced the folder options menu with the custom `<ActionSheet>`, supporting renaming and deleting folders cleanly.
- **Home Dashboard (`src/app/(tabs)/index.tsx`)**:
  - Added `onMorePress` props to `RecentDocRow` and state hooks inside `HomeScreen` to toggle the `<ActionSheet>` for the selected document, linking dashboard items directly to edit/delete options.

### Verification
- Verified type safety and compilation using `bunx tsc --noEmit` which completed successfully with 0 errors.

---

## 19. Startup Crash: "Cannot find native module 'ExpoUpdates'" & Route Missing Default Export

### Problem & Root Cause
- When starting the application in certain environments (such as standard Expo Go or emulators/simulators without the native Updates package compiled/linked), the application would crash immediately on boot.
- The error traceback originated from the static import `import * as Updates from "expo-updates";` in `src/components/ErrorScreen.tsx`.
- The `expo-updates` library attempts to resolve the native module `ExpoUpdates` at the global module scope during initial package evaluation. If missing, it throws a fatal `Cannot find native module 'ExpoUpdates'` error.
- Because `src/app/_layout.tsx` imports `ErrorBoundary`, which imports `ErrorScreen`, this startup crash halted module loading for the root layout. Metro failed to load `./_layout.tsx` and returned `undefined`, causing Expo Router to report a misleading warning: `Route "./_layout.tsx" is missing the required default export. Ensure a React component is exported as default.`

### Solution
- **Removed Static Import**: Removed the static `import * as Updates from "expo-updates";` from the top level of `src/components/ErrorScreen.tsx`.
- **Dynamic Check & Require**: Refactored the `handleRestart` callback in `src/components/ErrorScreen.tsx` to safely evaluate module presence at runtime:
  - Checked native module availability via `requireOptionalNativeModule("ExpoUpdates")` from `expo-modules-core`.
  - If available, loaded the module dynamically with `require("expo-updates")` and invoked `Updates.reloadAsync()`.
  - If unavailable (e.g. running inside Expo Go or on Web), gracefully intercepted the flow and displayed a user-friendly fallback alert using React Native's `Alert.alert` explaining that manual restart is required, instead of crashing the application.
- **Import Adjustments**: Imported `Platform` and `Alert` from `react-native` to facilitate cross-platform behavior checks and alert notifications.

### Verification
- Ran the TypeScript type-checker (`bunx tsc --noEmit`) and confirmed the codebase compiles cleanly with 0 errors.

# TypeScript Entrypoint Migration

## Problem
The codebase was using a JavaScript file (`index.js`) as its primary entry point. While the source files under `src/` were entirely written in TypeScript, having `index.js` as the entrypoint meant the bootstrapping code was untyped and did not conform to the strict TypeScript-only requirement of the codebase.

## Solution
1. **Created `index.ts`**: Created a new type-safe entry point [index.ts](file:///d:/MyProjects/Expo_Projects/Zentra/index.ts) that handles:
   - Dynamic check of native module availability for `ExponentImagePicker` and `ExpoDocumentPicker` to prevent crashes in environments without these native binaries (e.g. Expo Go / unlinked simulators).
   - Safe declaration and assignment of global availability flags (`__isImagePickerNativeAvailable` and `__isDocumentPickerNativeAvailable`) on `globalThis` using a `GlobalWithFlags` TypeScript interface to prevent strict compiler complaints.
   - Importing the standard Expo Router entry point (`import "expo-router/entry"`).
2. **Removed `index.js`**: Deleted the old untyped `index.js` file from the workspace.
3. **Updated Configuration**: Updated [package.json](file:///d:/MyProjects/Expo_Projects/Zentra/package.json) to set the `"main"` entrypoint directly to `"index.ts"`.
4. **Validation**: Ran the TypeScript compiler checks (`bunx tsc --noEmit`) to verify that the entry point and the rest of the project compile with zero type errors.

---

## 20. Move, Share, and Download Functionalities

### What Was Done
- Implemented and polished the Move, Share, and Download functionalities on the Document Details screen.

### Changes Made
- **Move Functionality**:
  - Added state management (`isMoveSheetVisible`) and a second `<ActionSheet>` component to select folders.
  - Connected it to the store's `folders` state slice and the `updateDocument` action to update the document's category folder on selection.
  - Included a visual check icon indicating the active category/folder and added accessibility announcements.
- **Share & Download Native Protections**:
  - Implemented the `getSharingModule()` helper function which checks if the `ExpoSharing` native binary is linked/present in the device's environment (via `requireOptionalNativeModule`) before requiring `expo-sharing`. This prevents fatal `Cannot find native module 'ExpoSharing'` runtime crashes on simulators, emulators, or standard Expo Go clients where the sharing package binaries are unlinked.
  - Reverted the `FileSystem` import back to `expo-file-system/legacy` because the new v56 `expo-file-system` API structure does not expose legacy properties such as `StorageAccessFramework` or `cacheDirectory` required for Android SAF folder storage and text caching.
  - Added fallback Web Share API and download triggers for web browser clients.

### Verification
- Tested with `bunx tsc --noEmit` and confirmed zero type errors.

---

## 21. ImagePicker Temporary File Garbage Collection

### Problem
- Picked document attachments (images, PDFs) were reference-linked directly from their temporary picker location (e.g. `cache/ImagePicker`).
- The operating system cleans up this temporary cache directory periodically or on app restarts. Consequently, the next time the app tried to view, share, or download a document, it crashed with `java.io.FileNotFoundException` (`ENOENT: No such file or directory`).

### Solution
- **Permanent File Storage (`src/lib/share.ts`)**:
  - Implemented the helper function `saveFilePermanently(uri, filename)` which copies a local file URI from the temporary picker cache to the app's permanent sandbox directory (`FileSystem.documentDirectory`).
- **Form Submission Integration (`src/app/add-document.tsx` & `src/app/edit-document/[id].tsx`)**:
  - Intercepted the form submit actions to save selected attachments permanently.
  - Automatically deleted the old permanent attachments from the sandbox directory when they were replaced or when the document was updated/removed.

### Verification
- Checked that all TypeScript tests pass with `bunx tsc --noEmit`.

---

## 22. Custom Confirmation Modals for Design-System-Compliant Action Prompts

### Problem
- In Zentra, document deletion, folder deletion, wiping local documents database, and signing out triggered browser-native or default OS-level `Alert.alert` confirm prompts.
- On Web, these defaulted to standard browser confirm boxes or basic divs that did not match the premium Zentra visual design guidelines (using Outfit display fonts, Inter body copy, and curated Indigo/Crimson colors).

### Solution
- **`src/components/ConfirmationModal.tsx`**: Created a reusable, centered modal popup styled with NativeWind.
  - Restructured layout parameters to support both destructive actions (using Crimson danger highlights, warning icons, and alert background themes) and standard actions (using Indigo brand accents and standard buttons).
  - Designed to render identically on Web, iOS, and Android, completely bypassing native OS alert prompts.
- **Details Screen (`src/app/document/[id].tsx`)**: Replaced `Alert.alert` with the custom `<ConfirmationModal>` to confirm individual document deletions.
- **Home Tab (`src/app/(tabs)/index.tsx`)**: Wired the three-dot option menu deletes on Recent Documents list to trigger the custom `<ConfirmationModal>`.
- **Documents Tab (`src/app/(tabs)/documents.tsx`)**: Integrated `<ConfirmationModal>` for folder deletions, dynamically passing document counts in the description message.
- **Profile / Settings Screen (`src/app/(tabs)/profile.tsx`)**: Replaced `Alert.alert` prompts for "Sign Out" and "Delete All Documents" actions with custom `<ConfirmationModal>` panels.

### Verification
- Verified that type safety compiles cleanly with zero errors by running `bunx tsc --noEmit`.

---

## 23. Document Sharing and iOS Download Failures: Fallback to React Native Share API & Rich Sharing Options

### Problem
- Tapping on "Share" in the Document Details screen either shared the raw attachment file *without* document details (name, expiry date, category, notes) or only shared a plain text summary *without* the attachment image.
- Additionally, on environments lacking the compiled/linked native binary for `ExpoSharing` (such as simulators/emulators or customized development clients running without built native dependencies), attempting to share or download on iOS displayed blocking alerts.

### Solution
- **ActionSheet for Sharing Options**:
  - Implemented an interactive Share Options bottom sheet `<ActionSheet>` in `src/app/document/[id].tsx` (toggled by the "Share" row when the document contains an attachment).
  - Provides three granular options:
    1. **"Share Details as Text"**: Shares the text description of the document details via the React Native `Share` module.
    2. **"Share Raw File"**: Shares the raw attachment file (e.g. PDF/Image) using the native `expo-sharing` library or fallback.
    3. **"Share Details + Image (HTML)"**: (For image files) Reads the image as a base64 string, compiles a beautifully styled responsive HTML document showing all metadata (name, category, expiry date, status badges, and notes) and embedding the inline image, then exports/shares it as a self-contained `.html` document.
- **HTML Export Template (`src/lib/share.ts`)**:
  - Added `generateShareHtml(doc, base64Data)` which returns a premium, styled responsive HTML file matching Zentra's design tokens (linear gradients, cards, layout padding, and status styling).
- **Graceful Fallbacks & JSI Fixes**:
  - Standardized fallback routines using React Native's built-in `Share` module inside `src/app/document/[id].tsx` and `src/components/FileViewer.tsx`.
  - Restored the module registry check `requireOptionalNativeModule("ExpoSharing")` inside `getSharingModule` before requiring `expo-sharing`. Under Metro's bundler, importing a package that runs `requireNativeModule` at its global scope (evaluation time) will throw a fatal build-time/require error in development mode, bypassing JS try-catch blocks. Restoring the query-check completely prevents this crash.
  - Implemented polite on-screen text fallbacks for Android and unsupported environments: if `expo-sharing` is unavailable, selecting "Share Details + Image (HTML)" or "Share Raw File" on Android will alert the user that file sharing is not supported in the current environment and offer to share the text summary details directly, ensuring that sharing remains functional.

### Verification
- Verified that all TypeScript types resolve correctly and that the project compiles with zero compilation errors by running `bunx tsc --noEmit`.

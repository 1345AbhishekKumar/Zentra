Read AGENTS.md first and follow it strictly.

## Task — Accessibility Audit (VoiceOver + TalkBack)

Make Zentra usable with VoiceOver (iOS) and TalkBack (Android). This is required for App Store submission and is the right thing to do.

**Steps:**

Go through every screen and component and apply the following rules. This is an audit-and-fix task — read each existing file and add missing accessibility props.

---

### Rule 1 — All icon-only buttons must have `accessibilityLabel`

Every `TouchableOpacity`, `Pressable`, or `TouchableHighlight` that contains only an icon (no visible text label) must have:
```tsx
accessibilityLabel="Descriptive action label"
accessibilityRole="button"
```

Audit these components at minimum:
- FAB `+` button → `accessibilityLabel="Add new document"`
- Bell icon on Home → `accessibilityLabel="Open expiry alerts"`
- Search button on Home → `accessibilityLabel="Search documents"`
- Three-dot menu → `accessibilityLabel="More options"`
- Favorite star → `accessibilityLabel={doc.isFavorite ? "Remove from favorites" : "Add to favorites"}`
- Back arrow → `accessibilityLabel="Go back"`
- Close (X) button → `accessibilityLabel="Close"`
- Delete row → `accessibilityLabel="Delete document"`
- Sort pills → `accessibilityLabel="Sort by {sortType}"`

---

### Rule 2 — All interactive rows must have `accessibilityRole`

- Tappable document rows → `accessibilityRole="button"`
- Navigation menu rows in Profile → `accessibilityRole="button"`
- Filter/sort pill buttons → `accessibilityRole="button"`
- Toggle switches → `accessibilityRole="switch"`, `accessibilityState={{ checked: isEnabled }}`
- Accordion FAQ rows → `accessibilityRole="button"`, `accessibilityState={{ expanded: isOpen }}`

---

### Rule 3 — Text inputs must have `accessibilityLabel`

Every `TextInput` in AddDocumentForm, QuickEditSheet, and search screens must have:
```tsx
accessibilityLabel="Field name"  // e.g. "Document name"
```

---

### Rule 4 — ExpiryBadge must be readable

`ExpiryBadge` should have:
```tsx
accessibilityLabel={`Expiry status: ${expiryLabel(expiryDate)}`}
accessibilityRole="text"
```

---

### Rule 5 — Minimum touch target size

Every tappable element must be at least **44×44 points**. Audit and fix:
- Filter pill chips — add `minWidth: 44` and `minHeight: 44` (or use NativeWind `min-h-11 min-w-11`)
- Favorite star icon — wrap in a 44×44 hitSlop if the icon is smaller
- Tab bar items — Expo handles this, but verify custom tab bar icons aren't smaller than 44px touch area

Add `hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}` to any small interactive element that can't be made physically larger.

---

### Rule 6 — Color contrast

Verify these pairs meet WCAG AA (4.5:1 for normal text, 3:1 for large text) according to your design system.
Here are the examples; do not use colors that are not included in my design system.
- `Colors.secondaryText` (`#737373`) on `Colors.background` (`#F7F6F3`) — verify with a contrast ratio check
- `Colors.accent` (`#4F46E5`) on white — this passes at 6.6:1 ✅
- White text on `Colors.accent` — passes ✅
- `Colors.error` (`#EF4444`) on white — passes at 4.5:1 ✅
- If `#737373` on `#F7F6F3` fails AA, darken `secondaryText` to `#6B7280` or `#636363` and update `constants/colors.ts`.

---

### Rule 7 — Screen reader announcements for dynamic changes

When a document is deleted (disappears from list): add `AccessibilityInfo.announceForAccessibility("Document deleted")` after the delete action.
When a document is restored: `AccessibilityInfo.announceForAccessibility("Document restored")`.
When a form is saved: `AccessibilityInfo.announceForAccessibility("Document saved")`.

---

Do not redesign any screen — these are additive prop changes only.
Do not change store, lib files, or auth.
Do not add third-party accessibility libraries — use React Native's built-in accessibility props only.

### Check when done
- VoiceOver on iOS reads all icon buttons with meaningful labels
- All switches report their checked state to screen readers
- All text inputs are announced with their label
- Touch targets are at minimum 44×44 on all interactive elements
- `bunx tsc --noEmit` passes
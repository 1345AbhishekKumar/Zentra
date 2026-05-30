Read AGENTS.md first and follow it strictly.

## Task — Bottom Tab Navigation (Home, Documents, Collections, Profile)

Build the bottom tab bar for Zentra with four tabs: Home, Documents, Collections, and Profile. Each tab gets a placeholder screen for now — real content comes in later features.

**Steps:**

1. Update `app/(tabs)/_layout.tsx` to render a `<Tabs>` navigator with four tabs:

   | Tab | Route | Icon (outlined style) |
   |---|---|---|
   | Home | `app/(tabs)/index.tsx` | home icon |
   | Documents | `app/(tabs)/documents.tsx` | document/file icon |
   | Collections | `app/(tabs)/collections.tsx` | grid/folder icon |
   | Profile | `app/(tabs)/profile.tsx` | person/user icon |

2. Tab bar styling (match the Zentra design):
   - Tab bar border top: `1px solid Colors.border`
   - Label font: small, 11px, medium weight

3. Create placeholder screens for each tab. Each placeholder should show only the screen title centered — no real content yet:
   - `app/(tabs)/index.tsx` → title: "Home"
   - `app/(tabs)/documents.tsx` → title: "Documents"
   - `app/(tabs)/collections.tsx` → title: "Collections"
   - `app/(tabs)/profile.tsx` → title: "Profile"

4. Use NativeWind for all tab bar and screen styling.

5. Icons: use `@expo/vector-icons` (already included in Expo managed workflow). Use `Ionicons` or `Feather` — outlined style, 24px size.

Do not implement any real screen content — placeholders only.
Do not modify the auth flow or `app/_layout.tsx` from feature3.
Do not touch `constants/`, `types/`, Zustand, or AsyncStorage.
Do not add any new npm packages — use only what Expo provides.

### Reference
A design image showing the bottom tab bar is attached. Match the tab bar appearance exactly: icon + label stacked, active tab uses accent color `#4F46E5`, inactive uses `#737373`.

### Check when done
- All four tabs are tappable and navigate to their placeholder screens
- Active tab icon and label render in `#4F46E5`
- Tab bar background is white with a top border
- No TypeScript errors
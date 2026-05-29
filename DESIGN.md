---
version: alpha
name: Zentra Design System
description: A premium, clean, and highly secure design system tailored for a local-first mobile document vault application.
colors:
  primary: "#111111"
  secondary: "#727272"
  accent: "#4F46E5"
  soft-accent: "#EEF2FF"
  success: "#22C55E"
  warning: "#F59E0B"
  danger: "#EF4444"
  surface: "#FFFFFF"
  background: "#F7F6F9"
  border: "#E5E7EB"
gradients:
  flat: "Flat color system — no gradients used for layout elements."
typography:
  display:
    fontFamily: "SF Pro Rounded"
    fontSize: "32px"
    fontWeight: "700"
    lineHeight: "1.2"
    letterSpacing: "-0.02em"
  h1:
    fontFamily: "SF Pro Rounded"
    fontSize: "24px"
    fontWeight: "700"
    lineHeight: "1.25"
    letterSpacing: "-0.015em"
  h2:
    fontFamily: "SF Pro Rounded"
    fontSize: "18px"
    fontWeight: "600"
    lineHeight: "1.3"
    letterSpacing: "-0.01em"
  body-lg:
    fontFamily: "Inter"
    fontSize: "16px"
    fontWeight: "500"
    lineHeight: "1.4"
    letterSpacing: "0"
  body-md:
    fontFamily: "Inter"
    fontSize: "14px"
    fontWeight: "400"
    lineHeight: "1.4"
    letterSpacing: "0"
  body-sm:
    fontFamily: "Inter"
    fontSize: "13px"
    fontWeight: "400"
    lineHeight: "1.4"
    letterSpacing: "0"
  caption:
    fontFamily: "Inter"
    fontSize: "12px"
    fontWeight: "400"
    lineHeight: "1.5"
    letterSpacing: "0.01em"
  button:
    fontFamily: "SF Pro Rounded"
    fontSize: "16px"
    fontWeight: "600"
    lineHeight: "1.2"
    letterSpacing: "0.02em"
    textTransform: "none"
spacing:
  base: "8px"
  xs: "4px"
  sm: "8px"
  md: "12px"
  lg: "16px"
  xl: "24px"
  "2xl": "32px"
  "3xl": "48px"
grid:
  columns: 4
  gutter: "16px"
  margin: "20px"
shadows:
  sm:
    offsetX: "0px"
    offsetY: "1px"
    blur: "2px"
    spread: "0px"
    color: "rgba(0,0,0,0.05)"
  md:
    offsetX: "0px"
    offsetY: "4px"
    blur: "10px"
    spread: "-1px"
    color: "rgba(0,0,0,0.08)"
  lg:
    offsetX: "0px"
    offsetY: "10px"
    blur: "20px"
    spread: "-3px"
    color: "rgba(0,0,0,0.12)"
  fab:
    offsetX: "0px"
    offsetY: "6px"
    blur: "16px"
    spread: "0px"
    color: "rgba(79, 70, 229, 0.3)"
borders:
  width:
    thin: "1px"
    default: "1px"
    thick: "2px"
    focus: "2px"
  style:
    default: "solid"
  color:
    default: "{colors.border}"
    focus: "{colors.accent}"
opacity:
  disabled: "0.4"
  muted: "0.6"
  overlay: "0.4"
z-index:
  base: 0
  sticky: 10
  fab: 50
  bottom-nav: 100
  overlay: 200
  modal: 300
  toast: 400
rounded:
  none: "0px"
  sm: "4px"
  md: "8px"
  lg: "12px"
  xl: "16px"
  "2xl": "24px"
  full: "9999px"
motion:
  duration:
    fast: "150ms"
    default: "300ms"
    slow: "500ms"
  easing:
    default: "cubic-bezier(0.4, 0, 0.2, 1)"
    spring: "cubic-bezier(0.25, 1, 0.5, 1)"
components:
  button-primary:
    backgroundColor: "{colors.accent}"
    textColor: "#FFFFFF"
    rounded: "{rounded.xl}"
    height: "52px"
    typography: "{typography.button}"
    paddingX: "24px"
  button-secondary:
    backgroundColor: "transparent"
    textColor: "{colors.accent}"
    rounded: "{rounded.xl}"
    height: "52px"
    borderWidth: "1px"
    borderColor: "{colors.accent}"
    typography: "{typography.button}"
  search-input:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.primary}"
    placeholderColor: "{colors.secondary}"
    rounded: "{rounded.xl}"
    height: "48px"
    paddingX: "16px"
    borderWidth: "1px"
    borderColor: "{colors.border}"
  quick-access-card:
    backgroundColor: "{colors.surface}"
    rounded: "{rounded.xl}"
    padding: "16px"
    shadow: "{shadows.sm}"
  document-list-item:
    backgroundColor: "{colors.surface}"
    rounded: "{rounded.xl}"
    padding: "12px 16px"
    borderWidth: "1px"
    borderColor: "{colors.border}"
  category-tab:
    backgroundColor: "{colors.surface}"
    activeBackgroundColor: "{colors.accent}"
    textColor: "{colors.secondary}"
    activeTextColor: "#FFFFFF"
    rounded: "{rounded.full}"
    paddingX: "16px"
    paddingY: "8px"
  floating-action-button:
    backgroundColor: "{colors.accent}"
    rounded: "{rounded.full}"
    width: "56px"
    height: "56px"
    shadow: "{shadows.fab}"
---

# Zentra Premium Vault Design System

## Overview
Zentra is a premium, privacy-first mobile document vault that empowers users to securely manage on-device document expirations. The aesthetic is designed to feel **clean**, **trustworthy**, **modern**, and **focused**. To instill confidence in data security, the visual layout prioritizes spacious content structures, highly-readable typography hierarchies, and a calming indigo-accented color palette. Rounded corners, subtle card shadows, and tactile button states provide an interface that feels responsive, friendly, and premium.

---

## Colors
The color system utilizes a clean, light-mode palette by default, emphasizing clarity and security with high-contrast neutral texts and functional color states.

* **Primary / Accent** (`#4F46E5`): The signature indigo color representing security and modern reliability. Used for major actions, active indicators, and prominent UI highlights.
* **Soft Accent** (`#EEF2FF`): A faint, soothing blue-indigo tint used as a background overlay for badges, highlighted profile circles, and soft container borders.
* **Neutral Background** (`#F7F6F9`): A custom light lavender-gray background designed to reduce harsh glare while making white surface cards stand out cleanly.
* **Neutral Surface** (`#FFFFFF`): Absolute white. Applied to interactive cards, input fields, modals, and navigation bars to establish visual depth.
* **Primary Text** (`#111111`): A rich, near-black charcoal color applied to page titles, file names, and active settings text to guarantee maximum contrast and readability.
* **Secondary Text** (`#727272`): A neutral dark gray utilized for document metadata, disabled states, placeholder strings, and helper text.
* **Success** (`#22C55E`): A clear forest-green representing safe, verified states, and active items.
* **Warning / Alert** (`#F59E0B`): A warm orange-amber utilized for imminent expiry alerts, storage threshold warnings, and action triggers.
* **Danger / Destructive** (`#EF4444`): A crimson red dedicated strictly to irreversible destructive operations such as document deletion or logging out.

---

## Gradients
* **Flat Color System**: Layout panels, cards, and buttons use solid colors to emphasize accessibility and visual consistency. Gradients are omitted from standard components but are permitted in localized decorative illustrations (e.g. onboarding screen illustrations).

---

## Typography
Zentra relies on a clean, modern typography system combining a rounded sans-serif font for structural headers and a highly-legible geometric sans-serif font for metadata and content.

* **SF Pro Rounded** (or a clean system equivalent, e.g. **Outfit** or **Inter Rounded**): Reserved for headers, button text, and titles to lend a friendly and premium character to navigation elements.
* **Inter** (or standard system sans-serif): Applied to body copy, table list details, and forms to maximize clarity.

### Typography Hierarchy

* `display` (~32px, Bold, Line Height 1.2, Letter Spacing -0.02em): Large landing messages (e.g., onboarding screens).
* `h1` (~24px, Bold, Line Height 1.25, Letter Spacing -0.015em): Primary screen title headers (e.g., "Memora", "Documents", "Profile").
* `h2` (~18px, Semi-Bold, Line Height 1.3, Letter Spacing -0.01em): Section subtitles (e.g., "Quick Access", "Recent Documents").
* `body-lg` (~16px, Medium, Line Height 1.4): Important primary copy, name listings, and file title labels.
* `body-md` (~14px, Regular, Line Height 1.4): Standard readable body text, category labels, and details.
* `body-sm` (~13px, Regular, Line Height 1.4): Unmarked sub-text, instructions, or small details.
* `caption` (~12px, Regular, Line Height 1.5, Letter Spacing 0.01em): Timestamp details, metadata labels, and helper text underneath form fields.
* `button` (~16px, Semi-Bold, Line Height 1.2, Letter Spacing 0.02em): Prominent button labels.

---

## Layout
The spatial grid uses a strict **8px base spacing scale** to maintain consistent spacing proportions throughout the application. All vertical margins, padding, and alignments map directly to the scale to prevent arbitrary spacing gaps.

* **Spacing Scale**:
  - `4px (xs)`: Tight spacing (e.g. text label to input spacing).
  - `8px (sm)`: Medium tight (e.g. interior badge padding, small text rows).
  - `12px (md)`: Medium (e.g. gap between card contents, list items).
  - `16px (lg)`: Standard base (e.g. inner padding of lists and quick access cards).
  - `24px (xl)`: Screen gutter padding (horizontal constraints around screen layout).
  - `32px (2xl)`: Large gutter (e.g. margins between headers and first main sections).
  - `48px (3xl)`: Large blocks (e.g. hero section gaps, modal boundaries).

---

## Grid
The interface utilizes a flexible responsive layout system optimized for standard mobile screen bounds:

* **Margin**: `20px` or `24px` horizontal gutters on screens.
* **Gutter**: `16px` for layout grids.
* **Quick Access Grid**: A 2-column grid layout with equal height cells and a `16px` gutter spacing.

---

## Elevation & Depth
Elevation is simulated through soft, natural drop-shadows combined with tonal shifts against the background to avoid heavy, muddy interface blocks.

* `shadows.sm`: Minimal elevation. Used for quick-access cards and secondary items.
* `shadows.md`: Base elevation. Applied to active input elements and standard screen cards.
* `shadows.lg`: High elevation. Applied to deep-linked modal sheets and slide-up dialog boxes.
* `shadows.fab`: A colored, localized glowing shadow wrapping the floating action button (`rgba(79, 70, 229, 0.3)`) to draw user attention to creation options.

---

## Borders
Stroke limits are kept minimal to avoid visual noise, relying on solid borders primarily for structure and interactive states.

* **Border Width**:
  - Thin/Default: `1px` (for divider lines, card borders, and static inputs).
  - Focus state: `2px` (used to draw clear focus surrounding active input fields).
* **Border Style**: `solid`
* **Border Color**:
  - Default: Light Gray (`#E5E7EB`).
  - Focus: Indigo Accent (`#4F46E5`).
  - Active toggle borders: Medium Dark Gray (`#E5E7EB`).

---

## Opacity
Opacity values represent states of interactivity:

* `opacity.disabled` (`0.4`): Applied to disabled buttons, input elements, or unselectable actions.
* `opacity.muted` (`0.6`): Used on secondary subheadings or descriptive helper elements.
* `opacity.overlay` (`0.4`): Dimming level applied to background overlay elements behind active modal components.

---

## Z-Index
stacking order layers are carefully mapped to keep active layers structured:

* `0`: Base background layer.
* `10`: Raised lists, floating elements, or sticky text headers.
* `50`: Floating Action Button (FAB).
* `100`: Bottom navigation tab bar.
* `200`: Modal scrim/backdrop overlays.
* `300`: Active foreground modal layers.
* `400`: Toasts and push notifications banners.

---

## Shapes
The application shape language employs soft, friendly corner radiuses to convey accessibility and modern design:

* `rounded-xl` (`12px`): Applied to quick access grid cards, text inputs, search fields, and buttons.
* `rounded-2xl` (`16px`): Primary card layouts and list containers.
* `rounded-3xl` (`24px`): Top corners of slide-up bottom sheets or full-sized modal panels.
* `rounded-full` (`9999px`): Badges, category pill tabs, profile image avatars, and circular FAB actions.

---

## Motion
Animations simulate natural material physics to provide feedback for user choices.

* **Animations Inferred by Style**:
  - **Bottom sheets**: Slide-up from bottom boundary over `300ms` using standard Bezier transition easing.
  - **Buttons / Actions**: Hover fade states (`150ms` opacity change) and active press down feedback scaling effects.
  - **Tabs**: Smooth sliding underline selector following the active category badge.

---

## Icons
* **Icon Style**: Clean, outline icons with a moderate stroke weight (1.5px or 2px) to match typography weights. A uniform icon library like **Lucide** or **Feather Icons** should be used.
* **Sizing**:
  - Tab Bar Icons: `24px`
  - Action / Buttons: `20px`
  - Badge / Status Indicators: `16px`
* **Color Rule**: Icons must inherit the primary text color (`#111111`) or secondary text color (`#727272`) unless acting as an accent (indigo `#4F46E5`), positive flag (green `#22C55E`), or warning (orange `#F59E0B`).

---

## Layout Structure
The primary application utilizes a standard mobile structure containing a header panel, scrollable list elements, and a bottom navigation layout.

### Home Screen Anatomy
```
┌──────────────────────────────────────────┐
│  STATUS BAR  (Carrier | Time | Battery)   │
├──────────────────────────────────────────┤
│  Hello, Abhishek                  [Logo] │
│  Search documents, folders...     [Go]   │
├──────────────────────────────────────────┤
│  QUICK ACCESS                 ( See All) │
│  ┌──────────────┐     ┌──────────────┐   │
│  │ Passport     │     │ Insurance    │   │
│  │ PDF  2.4 MB  │     │ PDF  1.2 MB  │   │
│  └──────────────┘     └──────────────┘   │
├──────────────────────────────────────────┤
│  RECENT DOCUMENTS                        │
│  ┌─────────────────────────────────────┐ │
│  │ [Icon] Driving License.pdf  [Arrow] │ │
│  │        Today • 2.4 MB               │ │
│  ├─────────────────────────────────────┤ │
│  │ [Icon] Tax Return 2024.pdf  [Arrow] │ │
│  │        Yesterday • 3.2 MB           │ │
│  └─────────────────────────────────────┘ │
├──────────────────────────────────[ + ]───┤ (FAB)
│  [Home]  [Docs]    [Collects]    [Profile]│ (Bottom Nav)
└──────────────────────────────────────────┘
```

### Document Detail Screen Anatomy
```
┌──────────────────────────────────────────┐
│  [Back]         Document Details         │
├──────────────────────────────────────────┤
│                                          │
│                  [ PDF ]                 │
│               Passport.pdf               │
│               PDF • 2.4 MB               │
│                                          │
├──────────────────────────────────────────┤
│  Information                             │
│  Type                      PDF Document  │
│  Size                            2.4 MB  │
│  Added on                   19 May 2024  │
│  Location                      Personal  │
├──────────────────────────────────────────┤
│  [Share Icon] Share                      │
│  [Down Icon]  Download                   │
│  [Star Icon]  Add to Favorites           │
│  [Move Icon]  Move                       │
│  [Trash]      Delete Document            │
└──────────────────────────────────────────┘
```

---

## Components

### 1. Primary Button (`button-primary`)
Standard full-width button for driving the primary application flow.
* **Default**: background `#4F46E5`, text `#FFFFFF`, height `52px`, font-weight `600`, radius `12px`.
* **Pressed**: background `#3B31C4` (darkened accent, inferred active state).
* **Disabled**: opacity `0.4`, background `#4F46E5` (non-interactive).

### 2. Category Tab Badge (`category-tab`)
Small pill-shaped container to cycle through list categories.
* **Default**: background `#FFFFFF`, border `1px solid #E5E7EB`, text `#727272`, rounded `full`.
* **Active**: background `#4F46E5`, text `#FFFFFF`, rounded `full`.

### 3. Quick Access Card (`quick-access-card`)
Grid card mapping document types.
* **Default**: background `#FFFFFF`, padding `16px`, rounded `12px`, shadow `shadows.sm`. Contains a category icon in a circular background matching the category context.

### 4. Floating Action Button (`floating-action-button`)
High prominence FAB representing document upload triggers.
* **Default**: background `#4F46E5`, rounded `full`, width `56px`, height `56px`, elevation `shadows.fab`. Contains a centered white `+` plus icon.

### 5. Document List Item (`document-list-item`)
Horizontal list elements displaying file details.
* **Default**: background `#FFFFFF`, vertical padding `12px`, horizontal padding `16px`, rounded `12px`, thin bottom border or card wrap.

---

## Do's and Don'ts

* **DO** use the unified indigo primary color (`#4F46E5`) to focus interactive layouts and call-to-actions.
* **DON'T** mix different typography systems. Strictly limit font usage to **SF Pro Rounded** for titles and **Inter** for descriptions/tables.
* **DO** prioritize generous card-based layouts and paddings over dense borders to outline content areas.
* **DON'T** hardcode colors outside the style guide list. All colors must link to tokens (e.g. `#111111`, `#727272`).
* **DO** keep destructive actions (like "Delete") distinct using the functional red danger indicator (`#EF4444`).
* **DON'T** utilize gradients for interface card elements or action button backgrounds. Keep styling flat and clean.
* **DO** ensure the Floating Action Button matches the shadow style guide (`shadows.fab`) to highlight creation flows.
* **DON'T** allow items to sit flush with screen edges. Maintain a strict `20px` or `24px` outer layout padding margin on all screens.

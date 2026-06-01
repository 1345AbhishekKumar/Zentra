Read AGENTS.md first and follow it strictly.
Read DESIGN.md for theme tokens, colors, and component conventions before implementing.

## Task — Proper Date Picker (Replace Placeholder in AddDocumentForm)

Replace the plain text date input in `AddDocumentForm` with a real native date picker. This is a targeted component upgrade — nothing else changes.

**Steps:**

1. Run `bun add @react-native-community/datetimepicker` (the standard Expo-compatible date picker).

2. Create `components/DatePickerField.tsx`:
   - Props: `label: string`, `value: string` (ISO date string or empty), `onChange: (date: string) => void`, `error?: string`
   - Renders a tappable row:
     - Label on the left
     - Selected date formatted via `formatDate()` from `lib/date.ts` on the right (or "Select date" placeholder in secondary color if empty)
     - Calendar icon on the far right (accent color)
   - On tap: shows the native `DateTimePicker` modal
   - **iOS**: show inline in a modal bottom sheet with "Done" and "Cancel" buttons
   - **Android**: show the system date picker dialog directly (it auto-dismisses)
   - Selected date is stored as an ISO 8601 string (`"YYYY-MM-DD"`) via `onChange`
   - If `error` is provided, show it in `Colors.error` below the row

3. In `components/AddDocumentForm.tsx`, replace the existing expiry date text input with `<DatePickerField>`. Wire it to the same form state. Keep all other fields unchanged.

4. Minimum selectable date: today. Do not allow selecting a date in the past.

Do not modify any screen other than `components/AddDocumentForm.tsx`.
Do not change `app/add-document.tsx`, the store, lib files, or any tab screen.
Do not change the form validation logic — only the input component for expiry date changes.
Do not touch `app/document/[id].tsx` or `feature10`'s output.

### Check when done
- Tapping the expiry date field opens the native date picker on both iOS and Android
- Selecting a date populates it correctly as an ISO string in form state
- The formatted date displays correctly in the field after selection
- Past dates cannot be selected
- Error message appears below the field on submit if no date is selected
- `bunx tsc --noEmit` passes
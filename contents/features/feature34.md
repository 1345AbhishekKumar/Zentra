Read AGENTS.md first and follow it strictly.

## Task — Import / Restore from Backup

Let users restore their document metadata from a previously exported Zentra JSON backup file.

**Steps:**

1. Create `app/import-data.tsx`:

   **Header:** Back arrow + "Import Data" title (centered, bold)

   **Layout:**

   - **Warning card** (amber background, rounded-xl):
     - Warning icon
     - "Importing will merge with your existing documents. Duplicate document IDs will be skipped."

   - **Import options** — two rows:
     - 📄 **Import from File** — opens `DocumentPicker.getDocumentAsync({ type: "application/json" })`
     - 📋 **Paste JSON** — expands a multiline `TextInput` where the user can paste raw JSON

   - **Preview section** (only shown after a file is selected or JSON is pasted and validated):
     - "N documents found in backup"
     - Breakdown: "N new · N already exist (will be skipped)"
     - List of first 5 document names as a preview

   - **Import button**: full-width, accent color, "Import Documents" — only shown after valid JSON is loaded

2. Import logic:
   - Parse the JSON and validate it has a `documents` array
   - For each document in the backup:
     - If `doc.id` already exists in the store → skip (no overwrite)
     - If `doc.id` is new → call `addDocument(doc)` from the store
     - Set `notificationsEnabled: false` on all imported documents by default (user re-enables manually — no stale notification scheduling from old data)
   - After import: show Alert "Import complete. N documents added, N skipped."

3. Error handling:
   - Invalid JSON → Alert "This file doesn't appear to be a valid Zentra backup."
   - Empty documents array → Alert "No documents found in this backup file."
   - File picker cancelled → do nothing

4. Add "Import Data" row in `app/(tabs)/profile.tsx` under the Data section (below Export Data, above Delete All Documents).

**Privacy rule:** The import reads only the JSON file the user explicitly selects. No network access. No auto-import from any source.

Do not overwrite existing documents — merge only, skipping duplicates by ID.
Do not schedule notifications for imported documents — `notificationsEnabled` is always set to `false` on import.
Do not modify any screen other than `app/(tabs)/profile.tsx`.
Do not change lib files or the store shape.

### Check when done
- Selecting a valid Zentra JSON backup shows a preview of documents to import
- Importing merges documents correctly — new IDs added, existing IDs skipped
- All imported documents have `notificationsEnabled: false`
- Invalid JSON shows an error alert
- "Import Data" row appears in Profile
- `bunx tsc --noEmit` passes
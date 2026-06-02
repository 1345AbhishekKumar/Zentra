Read AGENTS.md first and follow it strictly.

## Task — Export Data

Let users export all their document metadata as a JSON file they can save or share. This is their personal backup — no attached file contents, metadata only.

**Steps:**

1. Create `app/export-data.tsx`:

   **Header:** Back arrow + "Export Data" title (centered, bold)

   **Layout:**
   - **Info card**: white background, rounded-xl, subtle shadow
     - Shield icon (accent color, 32px)
     - Title: "Your data, your backup"
     - Body: "Export a JSON file containing all your document names, categories, and expiry dates. Attached files are not included — only metadata."

   - **What's included section**:
     - ✅ Document names
     - ✅ Categories and expiry dates
     - ✅ Notes
     - ✅ Notification settings
     - ❌ Attached files (stored locally only)

   - **Export summary row**: "N documents · N collections" in secondary text

   - **Export button**: full-width, accent color, "Export as JSON"

2. On "Export as JSON":
   - Build the export object:
     ```ts
     const exportData = {
       exportedAt: new Date().toISOString(),
       appVersion: Constants.expoConfig?.version,
       documents: documents.map(doc => ({
         id: doc.id,
         name: doc.name,
         category: doc.category,
         fileType: doc.fileType,
         expiryDate: doc.expiryDate,
         createdAt: doc.createdAt,
         updatedAt: doc.updatedAt,
         sizeLabel: doc.sizeLabel,
         notificationsEnabled: doc.notificationsEnabled,
         isFavorite: doc.isFavorite,
         notes: doc.notes,
         // localUri intentionally excluded — file paths are device-specific
       })),
       notificationSettings,
     };
     ```
   - Serialize to JSON: `JSON.stringify(exportData, null, 2)`
   - Write to cache dir: `FileSystem.writeAsStringAsync(FileSystem.cacheDirectory + "zentra_backup.json", json)`
   - Share the file: `Sharing.shareAsync(filePath, { mimeType: "application/json", dialogTitle: "Export Zentra Data" })`
   - After sharing completes: optionally delete the temp file from cache

3. Add "Export Data" row in `app/(tabs)/profile.tsx` under the Data section (above "Delete All Documents").

**Privacy rule:** `localUri` is explicitly excluded from the export. The export contains only metadata the user entered themselves.

Do not add an import flow in this feature — that is a separate feature.
Do not modify any screen other than `app/(tabs)/profile.tsx`.
Do not change the store shape or lib files.

### Check when done
- Export Data screen shows the correct document and collection counts from the store
- Tapping "Export as JSON" produces a valid JSON file and opens the system share sheet
- `localUri` is NOT present in the exported JSON
- "Export Data" row appears in Profile
- `bunx tsc --noEmit` passes
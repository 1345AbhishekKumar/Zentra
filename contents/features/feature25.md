Read AGENTS.md first and follow it strictly.

## Task — Share Document

Wire the "Share" action row on the Document Details screen using `expo-sharing`.

**Steps:**

1. `expo-sharing` is already part of the Expo managed workflow — no install needed. Import it as `import * as Sharing from "expo-sharing"`.

2. In `app/document/[id].tsx`, wire the "Share" action row's `onPress`:

   **Case A — document has a `localUri` (file is attached):**
   - Check if the file still exists: `await FileSystem.getInfoAsync(doc.localUri)`
   - If it exists: call `await Sharing.shareAsync(doc.localUri, { mimeType: mimeTypeFor(doc.fileType), dialogTitle: doc.name })`
   - If it does not exist: show Alert "The attached file could not be found on your device."
   - If `Sharing.isAvailableAsync()` returns false (simulator limitation): show Alert "Sharing is not available on this device."

   **Case B — document has no `localUri` (metadata only):**
   - Build a plain text summary of the document and share it as a `.txt` file:
     ```
     Document: {name}
     Category: {category}
     Expiry Date: {formatted expiryDate}
     Notes: {notes or "None"}
     ```
   - Write this to a temp file using `FileSystem.writeAsStringAsync(FileSystem.cacheDirectory + "zentra_share.txt", content)`
   - Share the temp file with `Sharing.shareAsync()`
   - Delete the temp file after sharing completes (fire-and-forget, no crash if delete fails)

3. Create a small helper in `lib/share.ts`:
   - `mimeTypeFor(fileType: DocumentFileType): string` — maps `"pdf"` → `"application/pdf"`, `"image"` → `"image/jpeg"`, `"doc"` → `"application/msword"`, `"other"` → `"application/octet-stream"`
   - `buildDocumentSummary(doc: ZentraDocument): string` — builds the plain text summary string

**Privacy rule:** Only the file the user explicitly attached (their own file, already on their device) is shared. No data is sent to Zentra servers. The share sheet is the OS-native system share dialog.

Do not modify any screen other than `app/document/[id].tsx`.
Do not add `lib/share.ts` logic inline into the screen — it belongs in `lib/`.
Do not touch the store, notifications, or any other lib file.

### Check when done
- Tapping "Share" on a document with an attached file opens the system share sheet with that file
- Tapping "Share" on a metadata-only document shares a readable `.txt` summary
- Missing file shows an alert instead of crashing
- `bunx tsc --noEmit` passes
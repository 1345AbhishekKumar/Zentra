Read AGENTS.md first and follow it strictly.

## Task — Document File Viewer (PDF + Image Preview)

Let users view the file they attached to a document. Tapping a "View File" button on the Document Details screen opens the file in an appropriate viewer.

**Steps:**

1. Install `expo-file-system` (already in Expo managed workflow) and `react-native-pdf` for PDF rendering.

   > Note: `react-native-pdf` requires a bare or dev-client workflow. If the project is still in Expo Go managed workflow, use `expo-sharing` to open the file externally in the device's default viewer instead, and skip the in-app PDF renderer. Choose based on the current project setup.

2. Create `components/FileViewer.tsx`:

   **If using in-app viewer:**
   - For `fileType === "pdf"`: render `react-native-pdf` `<Pdf>` component in a full-screen modal
     - Source: `{ uri: doc.localUri }`
     - Show page count ("Page N of M") in the modal header
     - Close button (top-right X)
   - For `fileType === "image"`: render a full-screen `Image` in a modal with pinch-to-zoom using `react-native-gesture-handler` (already in Expo)
     - Close button (top-right X)
   - For `fileType === "doc"` or `"other"`: fall through to external viewer (see below)

   **External viewer fallback (for unsupported types or Expo Go):**
   - Use `IntentLauncher` (Android) or `Sharing.shareAsync` (iOS) to open the file in the device's default app
   - Wrap in a try/catch — if the file URI is no longer valid (file deleted from device), show an Alert: "File no longer available. The document record will remain."

3. In `app/document/[id].tsx`:
   - Add a "View File" button row to the actions list (above Share)
   - Only render this row if `doc.localUri` is not empty
   - Icon: `eye-outline`
   - On press: open `FileViewer` with the document

4. Guard against stale URIs:
   - Before opening, check if the file still exists using `FileSystem.getInfoAsync(doc.localUri)`
   - If `exists === false`: show Alert "The attached file could not be found. It may have been moved or deleted from your device." Do not navigate.

Do not add a viewer to any screen other than `app/document/[id].tsx`.
Do not change the store, lib files, or any tab screen.
Do not modify `AddDocumentForm` or the file picker from feature16.
The "View File" row must not appear if `doc.localUri` is empty or undefined.

### Check when done
- "View File" row only appears when a file is attached
- PDF opens in the in-app viewer (or external app if Expo Go)
- Image opens in a full-screen modal with pinch-to-zoom
- Stale/missing URI shows an alert instead of crashing
- `bunx tsc --noEmit` passes
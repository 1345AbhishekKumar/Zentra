Read AGENTS.md first and follow it strictly.

## Task — File Upload (Camera, Gallery, Document Picker)

Add the ability to attach a real file to a document entry. The file stays on-device — no upload to any server, ever.

**Steps:**

1. Run `bun add expo-image-picker expo-document-picker`.

2. Create `components/FilePickerButton.tsx`:
   - Props: `onFilePicked: (result: PickedFile) => void`, `currentUri?: string`
   - Define a local type:
     ```ts
     interface PickedFile {
       uri: string;
       name: string;
       mimeType: string;
       sizeLabel: string; // e.g. "2.4 MB"
       fileType: DocumentFileType; // mapped from mimeType
     }
     ```
   - Renders a dashed-border upload zone:
     - If no file selected: upload icon + "Attach a file" label + "Optional" sub-text
     - If file selected: file icon (color-coded by type) + file name + size label + ✕ remove button
   - On tap (when no file selected): show an `ActionSheet` / `Alert.alert` with 3 options:
     - 📷 **Camera** — `launchCameraAsync`, images only
     - 🖼 **Photo Library** — `launchImageLibraryAsync`, images only
     - 📄 **Browse Files** — `DocumentPicker.getDocumentAsync`, all file types
   - After picking:
     - Compute `sizeLabel` from the file size in bytes (format as KB or MB)
     - Infer `fileType` from mimeType: `image/*` → `"image"`, `application/pdf` → `"pdf"`, `application/msword` / `application/vnd.openxmlformats-officedocument.*` → `"doc"`, everything else → `"other"`
     - Call `onFilePicked(result)`

3. In `components/AddDocumentForm.tsx`:
   - Add `<FilePickerButton>` above the Notes field
   - On file picked: set `localUri`, `sizeLabel`, and `fileType` in form state automatically
   - The file name field can be auto-populated from the picked file name if the user hasn't typed a name yet

4. Request permissions correctly:
   - Camera: `ImagePicker.requestCameraPermissionsAsync()`
   - Photo library: `ImagePicker.requestMediaLibraryPermissionsAsync()`
   - If permission denied: show an alert directing the user to device settings

**Privacy rule (mandatory):** The file's `localUri` is stored in AsyncStorage as-is. It is never read, processed, uploaded, or sent anywhere. Zentra treats it as an opaque local reference.

Do not modify any screen other than `components/AddDocumentForm.tsx`.
Do not touch the store shape — `localUri` field already exists on `ZentraDocument`.
Do not add image preview or PDF viewer in this feature — that is a future polish task.
Do not change `app/document/[id].tsx` or any tab screen.

### Check when done
- Tapping the file picker shows Camera / Photo Library / Browse Files options
- Picking a file populates `localUri`, `sizeLabel`, and `fileType` in the form
- File name auto-fills if the name field is empty
- Permission denied shows an alert with settings redirect
- bunx tsc --noEmit` passes
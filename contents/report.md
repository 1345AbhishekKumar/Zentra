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

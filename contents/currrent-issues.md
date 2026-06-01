# Current Issues

## Native Module Missing: ExpoDocumentPicker

**Status:** Requires native rebuild

The native module `ExpoDocumentPicker` is not available because the native projects need to be regenerated after adding plugins (`expo-secure-store`, `@clerk/expo`, `expo-document-picker`, `expo-image-picker`) to `app.json`.

### Fix

Run the following to regenerate native projects:

```bash
npx expo prebuild --clean
```

Then rebuild the app:

```bash
npx expo run:android
# or
npx expo run:ios
```

### Workaround

The `index.js` entry file currently uses `requireOptionalNativeModule` to check native module availability at startup and stores the result in `globalThis`. This workaround should be removed after the native rebuild is completed.

### Original Error

```
Error: Cannot find native module 'ExpoDocumentPicker'
```

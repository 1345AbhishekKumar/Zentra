import { requireOptionalNativeModule } from "expo-modules-core";

// TODO: Remove this workaround after running `npx expo prebuild --clean` to rebuild native projects.
// Check native availability at the very start of application bundle execution
const isImagePickerNativeAvailable = !!requireOptionalNativeModule("ExponentImagePicker");
const isDocumentPickerNativeAvailable = !!requireOptionalNativeModule("ExpoDocumentPicker");

interface GlobalWithFlags {
  __isImagePickerNativeAvailable?: boolean;
  __isDocumentPickerNativeAvailable?: boolean;
}

const globalAny = globalThis as unknown as GlobalWithFlags;
globalAny.__isImagePickerNativeAvailable = isImagePickerNativeAvailable;
globalAny.__isDocumentPickerNativeAvailable = isDocumentPickerNativeAvailable;

// Now load the actual Expo Router entry point
import "expo-router/entry";

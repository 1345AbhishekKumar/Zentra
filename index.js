import { requireOptionalNativeModule } from "expo-modules-core";

// Check native availability at the very start of application bundle execution
const isImagePickerNativeAvailable = !!requireOptionalNativeModule("ExponentImagePicker");
const isDocumentPickerNativeAvailable = !!requireOptionalNativeModule("ExpoDocumentPicker");

const globalAny = globalThis;
globalAny.__isImagePickerNativeAvailable = isImagePickerNativeAvailable;
globalAny.__isDocumentPickerNativeAvailable = isDocumentPickerNativeAvailable;

// Now load the actual Expo Router entry point
import "expo-router/entry";

import * as FileSystem from "expo-file-system/legacy";
import { Platform } from "react-native";

export const StorageAccessFramework = FileSystem.StorageAccessFramework;

/**
 * Returns the app's sandboxed permanent document directory.
 */
export function getDocumentDirectory(): string | null {
  return FileSystem.documentDirectory;
}

/**
 * Returns the app's temporary cache directory.
 */
export function getCacheDirectory(): string | null {
  return FileSystem.cacheDirectory;
}

/**
 * Resolves a unique cache path for a filename.
 */
export function getCacheUri(filename: string): string {
  const cacheDir = getCacheDirectory();
  return cacheDir ? `${cacheDir}${filename}` : "";
}

/**
 * Resolves a content:// URI from a file:// URI on Android.
 */
export async function getContentUri(uri: string): Promise<string> {
  if (Platform.OS === "android") {
    return await FileSystem.getContentUriAsync(uri);
  }
  return uri;
}

/**
 * Check if a file or directory exists at the given URI.
 */
export async function fileExists(uri: string): Promise<boolean> {
  if (Platform.OS === "web") return false;
  if (!uri) return false;
  try {
    const info = await FileSystem.getInfoAsync(uri);
    return info.exists;
  } catch {
    return false;
  }
}

/**
 * Ensures a directory exists, creating it recursively if needed.
 */
export async function ensureDirectoryExists(directoryUri: string): Promise<void> {
  if (Platform.OS === "web") return;
  try {
    const dirInfo = await FileSystem.getInfoAsync(directoryUri);
    if (!dirInfo.exists) {
      await FileSystem.makeDirectoryAsync(directoryUri, { intermediates: true });
    }
  } catch (error) {
    console.warn(`[fileStorage] Failed to ensure directory: ${directoryUri}`, error);
  }
}

/**
 * Saves a file permanently from a temporary/cache path to the app's permanent document directory.
 * Returns the new permanent file:// URI.
 */
export async function saveFile(uri?: string, filename?: string): Promise<string | undefined> {
  if (!uri) return undefined;
  if (Platform.OS === "web") return uri;
  if (!uri.startsWith("file://") && !uri.startsWith("/")) {
    return uri;
  }

  try {
    const permanentDirectory = getDocumentDirectory();
    if (!permanentDirectory) return uri;

    // Check if it's already in the permanent directory
    if (uri.startsWith(permanentDirectory)) {
      return uri;
    }

    await ensureDirectoryExists(permanentDirectory);

    // Generate a unique permanent filename to prevent collisions
    const fileExtension = uri.split(".").pop() || "";
    const cleanName = (filename || `doc_${Date.now()}`).replace(/[^a-zA-Z0-9_.-]/g, "_");
    const uniqueName = cleanName.includes(".") ? cleanName : `${cleanName}.${fileExtension}`;
    const destinationUri = `${permanentDirectory}${Date.now()}_${uniqueName}`;

    // Copy the file
    await FileSystem.copyAsync({
      from: uri,
      to: destinationUri,
    });

    console.log("[fileStorage] Saved temporary file permanently at:", destinationUri);
    return destinationUri;
  } catch (error) {
    console.error("[fileStorage] Failed to save file permanently:", error);
    return uri; // Fallback to original URI if copy fails
  }
}

/**
 * Deletes a file at the given URI.
 */
export async function deleteFile(uri: string): Promise<void> {
  if (Platform.OS === "web") return;
  if (!uri) return;

  const permanentDirectory = getDocumentDirectory();
  const cacheDirectory = getCacheDirectory();

  // For safety, only delete files residing inside the app's document or cache directory
  const isInAppDir =
    (permanentDirectory && uri.startsWith(permanentDirectory)) ||
    (cacheDirectory && uri.startsWith(cacheDirectory));

  if (!isInAppDir) {
    console.warn(`[fileStorage] Skipping delete for file outside of app storage: ${uri}`);
    return;
  }

  try {
    await FileSystem.deleteAsync(uri, { idempotent: true });
    console.log(`[fileStorage] Deleted file: ${uri}`);
  } catch (error) {
    console.warn(`[fileStorage] Failed to delete file: ${uri}`, error);
  }
}

/**
 * Reads a local file's content as a Base64-encoded string.
 */
export async function readBase64(uri: string): Promise<string> {
  if (Platform.OS === "web") return "";
  try {
    return await FileSystem.readAsStringAsync(uri, {
      encoding: FileSystem.EncodingType.Base64,
    });
  } catch (error) {
    throw new Error(
      `[fileStorage] Failed to read base64 from URI: ${uri}. Original error: ${
        error instanceof Error ? error.message : String(error)
      }`
    );
  }
}

/**
 * Reads a local file's content as a plain text string.
 */
export async function readString(uri: string): Promise<string> {
  if (Platform.OS === "web") return "";
  try {
    return await FileSystem.readAsStringAsync(uri, {
      encoding: FileSystem.EncodingType.UTF8,
    });
  } catch (error) {
    throw new Error(
      `[fileStorage] Failed to read string from URI: ${uri}. Original error: ${
        error instanceof Error ? error.message : String(error)
      }`
    );
  }
}

/**
 * Writes a plain text string to a local file.
 */
export async function writeString(uri: string, content: string): Promise<void> {
  if (Platform.OS === "web") return;
  await FileSystem.writeAsStringAsync(uri, content, {
    encoding: FileSystem.EncodingType.UTF8,
  });
}

/**
 * Writes a Base64 string to a local file.
 */
export async function writeBase64(uri: string, base64: string): Promise<void> {
  if (Platform.OS === "web") return;
  await FileSystem.writeAsStringAsync(uri, base64, {
    encoding: FileSystem.EncodingType.Base64,
  });
}

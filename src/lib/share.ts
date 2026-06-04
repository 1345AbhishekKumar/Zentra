import { ZentraDocument, DocumentFileType, NotificationSettings } from "@/types";
import { formatDate } from "./date";
import { Platform, Share } from "react-native";
import { showAlert } from "@/store/alertStore";
import {
  deleteFile,
  fileExists,
  getCacheUri,
  readBase64,
  writeString,
  StorageAccessFramework,
} from "./fileStorage";
import type * as SharingType from "expo-sharing";
import { requireOptionalNativeModule } from "expo-modules-core";

// Modular Imports
import { mimeTypeFor } from "./share/mime";
import { generateShareHtml } from "./share/htmlTemplate";

/**
 * Builds a plain text summary of a document's metadata
 */
export function buildDocumentSummary(doc: ZentraDocument): string {
  const formattedExpiry = formatDate(doc.expiryDate);
  const notes = doc.notes?.trim() || "None";

  return [
    `Document: ${doc.name}`,
    `Category: ${doc.category}`,
    `Expiry Date: ${formattedExpiry}`,
    `Notes: ${notes}`,
  ].join("\n");
}

/**
 * Safely resolves the expo-sharing module if available on native.
 */
const getSharingModule = (): typeof SharingType | null => {
  if (Platform.OS === "web") {
    return null;
  }
  try {
    const isAvailable = !!requireOptionalNativeModule("ExpoSharing");
    if (isAvailable) {
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      return require("expo-sharing");
    }
  } catch {
    // Native module not available
  }
  return null;
};

/**
 * Shares plain text.
 */
export async function shareText(title: string, message: string): Promise<void> {
  try {
    if (Platform.OS === "web") {
      if (navigator.share) {
        await navigator.share({ title, text: message });
      } else {
        showAlert("Sharing Not Supported", "Your browser does not support sharing.", "warning");
      }
      return;
    }
    await Share.share({ title, message });
  } catch (error) {
    console.error("[shareText] Failed to share text:", error);
  }
}

/**
 * Shares a local file attachment.
 */
export async function shareFile(uri: string, filename: string, fileType: DocumentFileType): Promise<void> {
  try {
    const exists = await fileExists(uri);
    if (!exists) {
      showAlert("File Not Found", "The attached file could not be found.", "error");
      return;
    }

    if (Platform.OS === "web") {
      showAlert("Not Supported", "Web sharing of files is not fully supported in this environment.", "warning");
      return;
    }

    const Sharing = getSharingModule();
    const isSharingAvailable = Sharing ? await Sharing.isAvailableAsync() : false;
    if (Sharing && isSharingAvailable) {
      await Sharing.shareAsync(uri, {
        mimeType: mimeTypeFor(fileType, uri),
        dialogTitle: filename,
      });
    } else {
      // Fallback to React Native Share API
      if (Platform.OS === "ios") {
        await Share.share({ url: uri });
      } else {
        showAlert(
          "File Sharing Unavailable",
          "Sharing raw files is not supported on this environment/device.",
          "warning"
        );
      }
    }
  } catch (error) {
    console.error("[shareFile] Failed to share file:", error);
    showAlert("Sharing Failed", "An error occurred while sharing the file.", "error");
  }
}

/**
 * Reads a local file's content, generates a styled HTML page with details and base64-encoded image,
 * and shares/downloads the resulting HTML file.
 */
export async function shareDocumentDetailsHtml(doc: ZentraDocument): Promise<void> {
  if (!doc.localUri) return;
  try {
    const exists = await fileExists(doc.localUri);
    if (!exists) {
      showAlert("File Not Found", "The attached file could not be found.", "error");
      return;
    }

    // Read image as base64
    const base64Data = await readBase64(doc.localUri);
    const htmlContent = generateShareHtml(doc, base64Data);

    if (Platform.OS === "web") {
      // Web - Download the HTML file
      const element = document.createElement("a");
      const file = new Blob([htmlContent], { type: "text/html" });
      element.href = URL.createObjectURL(file);
      element.download = `${doc.name.replace(/\.[^/.]+$/, "")}_details.html`;
      document.body.appendChild(element);
      element.click();
      document.body.removeChild(element);
      return;
    }

    const Sharing = getSharingModule();
    const isSharingAvailable = Sharing ? await Sharing.isAvailableAsync() : false;
    const tempUri = getCacheUri(`${doc.name.replace(/\.[^/.]+$/, "")}_details.html`);
    await writeString(tempUri, htmlContent);

    if (Sharing && isSharingAvailable) {
      await Sharing.shareAsync(tempUri, {
        mimeType: "text/html",
        dialogTitle: `${doc.name} Details`,
      });
    } else {
      if (Platform.OS === "ios") {
        await Share.share({ url: tempUri });
      } else {
        const summary = buildDocumentSummary(doc);
        showAlert(
          "Rich Sharing Unavailable",
          "HTML/Image sharing is not supported in this environment. Would you like to share the document details as text instead?",
          "info",
          [
            { text: "Cancel", style: "cancel" },
            {
              text: "Share Text",
              onPress: () => shareText(doc.name, summary),
            },
          ]
        );
      }
    }

    // Clean up temp file
    await deleteFile(tempUri);
  } catch (error) {
    console.error("[shareDocumentDetailsHtml] Failed:", error);
    showAlert("Error", "Failed to generate document export.", "error");
  }
}

/**
 * Saves/downloads the document locally (Android SAF directory select, iOS Share save-to-files, Web anchor download).
 */
export async function downloadDocument(doc: ZentraDocument): Promise<void> {
  try {
    if (Platform.OS === "web") {
      if (doc.localUri) {
        const element = document.createElement("a");
        element.href = doc.localUri;
        element.download = doc.name;
        document.body.appendChild(element);
        element.click();
        document.body.removeChild(element);
      } else {
        const summary = buildDocumentSummary(doc);
        const element = document.createElement("a");
        const file = new Blob([summary], { type: "text/plain" });
        element.href = URL.createObjectURL(file);
        element.download = `${doc.name.replace(/\.[^/.]+$/, "")}_details.txt`;
        document.body.appendChild(element);
        element.click();
        document.body.removeChild(element);
      }
      showAlert("Success", "Document downloaded successfully!", "success");
      return;
    }

    // Android download using SAF
    if (Platform.OS === "android") {
      try {
        const permissions = await StorageAccessFramework.requestDirectoryPermissionsAsync();
        if (!permissions.granted) {
          showAlert("Permission Denied", "Cannot save file without folder permissions.", "error");
          return;
        }

        let fileUri = doc.localUri;
        let mimeType = doc.localUri ? mimeTypeFor(doc.fileType, doc.localUri) : "text/plain";
        let fileName = doc.name;

        if (!fileUri) {
          const summary = buildDocumentSummary(doc);
          const tempUri = getCacheUri(`zentra_download_${Date.now()}.txt`);
          await writeString(tempUri, summary);
          fileUri = tempUri;
          fileName = `${doc.name.replace(/\.[^/.]+$/, "")}_details.txt`;
        }

        const fileContent = await readBase64(fileUri);

        const createdFileUri = await StorageAccessFramework.createFileAsync(
          permissions.directoryUri,
          fileName,
          mimeType
        );

        // SAF requires base64 writing on Android. Since this is SAF-specific, we write using fileStorage
        const FileSystem = await import("expo-file-system/legacy");
        await FileSystem.writeAsStringAsync(createdFileUri, fileContent, {
          encoding: FileSystem.EncodingType.Base64,
        });

        if (!doc.localUri) {
          await deleteFile(fileUri);
        }

        showAlert("Success", "Document saved to your selected folder.", "success");
      } catch (error) {
        console.error("Android download failed:", error);
        const Sharing = getSharingModule();
        if (doc.localUri && Sharing) {
          await Sharing.shareAsync(doc.localUri);
        } else {
          showAlert("Error", "Failed to download document.", "error");
        }
      }
    } else {
      // iOS download using share sheet / save to files
      const Sharing = getSharingModule();
      const isSharingAvailable = Sharing ? await Sharing.isAvailableAsync() : false;

      if (Sharing && isSharingAvailable) {
        if (doc.localUri) {
          await Sharing.shareAsync(doc.localUri, { UTI: "public.item" });
        } else {
          const summary = buildDocumentSummary(doc);
          const tempUri = getCacheUri(`${doc.name.replace(/\.[^/.]+$/, "")}_details.txt`);
          await writeString(tempUri, summary);

          await Sharing.shareAsync(tempUri, { UTI: "public.text" });

          await deleteFile(tempUri);
        }
      } else {
        // Fallback to React Native's built-in Share module on iOS
        try {
          if (doc.localUri) {
            await Share.share({ url: doc.localUri });
          } else {
            const summary = buildDocumentSummary(doc);
            await Share.share({ title: doc.name, message: summary });
          }
        } catch (error) {
          console.error("RN Share fallback for iOS download failed:", error);
          showAlert("Error", "Save/Share is not available on this device.", "error");
        }
      }
    }
  } catch (error) {
    console.error("[downloadDocument] Failed:", error);
    showAlert("Error", "Failed to download document.", "error");
  }
}

/**
 * Generates a JSON backup file and shares it.
 */
export async function exportBackup(
  documents: ZentraDocument[],
  notificationSettings: NotificationSettings,
  appVersion: string = "1.0.0",
): Promise<void> {
  try {
    const exportData = {
      exportedAt: new Date().toISOString(),
      appVersion,
      documents: documents.map((doc) => ({
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
        isDeleted: doc.isDeleted,
        deletedAt: doc.deletedAt,
      })),
      notificationSettings,
    };

    const json = JSON.stringify(exportData, null, 2);

    // Web Flow
    if (Platform.OS === "web") {
      const element = document.createElement("a");
      const file = new Blob([json], { type: "application/json" });
      element.href = URL.createObjectURL(file);
      element.download = "zentra_backup.json";
      document.body.appendChild(element);
      element.click();
      document.body.removeChild(element);
      showAlert("Success", "Backup file downloaded successfully!", "success");
      return;
    }

    // Native Flow
    const tempPath = getCacheUri("zentra_backup.json");
    await writeString(tempPath, json);

    const Sharing = getSharingModule();
    const isSharingAvailable = Sharing ? await Sharing.isAvailableAsync() : false;

    if (Sharing && isSharingAvailable) {
      await Sharing.shareAsync(tempPath, {
        mimeType: "application/json",
        dialogTitle: "Export Zentra Data",
      });
    } else {
      // Fallback to React Native Share API for native platforms
      await Share.share({
        message: json,
        title: "Zentra Backup Data",
      });
    }

    // Cleanup cache file
    await deleteFile(tempPath);
  } catch (error) {
    console.error("[exportBackup] Failed to export backup:", error);
    showAlert("Export Failed", "An error occurred while generating or sharing your backup.", "error");
  }
}

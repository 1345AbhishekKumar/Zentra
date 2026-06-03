import { ZentraDocument, DocumentFileType, NotificationSettings } from "@/types";
import { formatDate, daysUntilExpiry, isExpired } from "./date";
import { Alert, Platform, Share } from "react-native";
import * as FileSystem from "expo-file-system/legacy";
import type * as SharingType from "expo-sharing";
import { requireOptionalNativeModule } from "expo-modules-core";

/**
 * Derives the MIME type for an image from its file extension.
 * Falls back to 'image/*' for unknown extensions.
 */
function imageMimeFromUri(uri?: string): string {
  if (!uri) return "image/*";
  const ext = uri.split(".").pop()?.toLowerCase();
  const mimeMap: Record<string, string> = {
    png: "image/png",
    jpg: "image/jpeg",
    jpeg: "image/jpeg",
    gif: "image/gif",
    webp: "image/webp",
    heic: "image/heic",
    heif: "image/heif",
    bmp: "image/bmp",
    svg: "image/svg+xml",
  };
  return (ext && mimeMap[ext]) || "image/*";
}

/**
 * Maps DocumentFileType to its corresponding MIME type string.
 * For images, pass the file URI to derive the correct subtype.
 */
export function mimeTypeFor(fileType: DocumentFileType, uri?: string): string {
  switch (fileType) {
    case "pdf":
      return "application/pdf";
    case "image":
      return imageMimeFromUri(uri);
    case "doc":
      return "application/msword";
    case "other":
    default:
      return "application/octet-stream";
  }
}

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
 * Generates a styled HTML document containing document details and the embedded base64 image.
 */
export function generateShareHtml(doc: ZentraDocument, base64Data: string): string {
  const formattedExpiry = formatDate(doc.expiryDate);
  const notes = doc.notes?.trim() || "None";
  const mime = mimeTypeFor(doc.fileType, doc.localUri);
  
  // Calculate expiry status
  const days = daysUntilExpiry(doc.expiryDate);
  const isOverdue = isExpired(doc.expiryDate);
  let statusLabel = "Active";
  let statusColor = "#10B981"; // green
  if (isOverdue) {
    statusLabel = "Expired";
    statusColor = "#EF4444"; // red
  } else if (days <= 30) {
    statusLabel = "Expiring Soon";
    statusColor = "#F59E0B"; // amber
  }

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${doc.name} - Zentra Vault</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      background-color: #F9FAFB;
      color: #111827;
      margin: 0;
      padding: 20px;
    }
    .card {
      background-color: #FFFFFF;
      border-radius: 16px;
      border: 1px solid #E5E7EB;
      max-width: 600px;
      margin: 0 auto;
      overflow: hidden;
      box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -1px rgba(0, 0, 0, 0.02);
    }
    .header {
      background: linear-gradient(135deg, #4F46E5 0%, #3730A3 100%);
      color: #FFFFFF;
      padding: 24px;
      text-align: center;
    }
    .header h1 {
      margin: 0;
      font-size: 22px;
      font-weight: 700;
      letter-spacing: -0.025em;
    }
    .header p {
      margin: 6px 0 0 0;
      font-size: 13px;
      opacity: 0.9;
    }
    .content {
      padding: 24px;
    }
    .grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 16px;
      margin-bottom: 24px;
    }
    .field {
      border-bottom: 1px solid #F3F4F6;
      padding-bottom: 8px;
    }
    .label {
      font-size: 11px;
      color: #6B7280;
      text-transform: uppercase;
      font-weight: 600;
      letter-spacing: 0.05em;
      margin-bottom: 4px;
    }
    .value {
      font-size: 15px;
      font-weight: 500;
    }
    .status-badge {
      display: inline-block;
      padding: 2px 8px;
      border-radius: 9999px;
      color: #FFFFFF;
      font-size: 12px;
      font-weight: 600;
    }
    .notes-section {
      background-color: #F9FAFB;
      border: 1px solid #F3F4F6;
      border-radius: 12px;
      padding: 16px;
      margin-bottom: 24px;
    }
    .image-section {
      text-align: center;
      margin-top: 12px;
    }
    .image-section img {
      max-width: 100%;
      height: auto;
      border-radius: 12px;
      border: 1px solid #E5E7EB;
      box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.05);
    }
    .footer {
      text-align: center;
      padding: 16px;
      font-size: 11px;
      color: #9CA3AF;
      border-top: 1px solid #F3F4F6;
    }
  </style>
</head>
<body>
  <div class="card">
    <div class="header">
      <h1>Zentra Document Vault</h1>
      <p>Secure Local Document Export</p>
    </div>
    <div class="content">
      <div class="grid">
        <div class="field">
          <div class="label">Document Name</div>
          <div class="value">${doc.name}</div>
        </div>
        <div class="field">
          <div class="label">Category</div>
          <div class="value">${doc.category}</div>
        </div>
        <div class="field">
          <div class="label">Expiry Date</div>
          <div class="value">${formattedExpiry}</div>
        </div>
        <div class="field">
          <div class="label">Status</div>
          <div class="value">
            <span class="status-badge" style="background-color: ${statusColor};">${statusLabel}</span>
          </div>
        </div>
      </div>
      <div class="notes-section">
        <div class="label">Notes</div>
        <div class="value" style="font-weight: normal; font-size: 14px; white-space: pre-wrap; color: #374151;">${notes}</div>
      </div>
      <div class="image-section">
        <div class="label" style="margin-bottom: 12px; text-align: left;">Attached Document Image</div>
        <img src="data:${mime};base64,${base64Data}" alt="Document Attachment" />
      </div>
    </div>
    <div class="footer">
      Generated securely on-device by Zentra • Privacy-First Expiry Tracking
    </div>
  </div>
</body>
</html>`;
}

/**
 * Copies a local file from a temporary cache path to the app's permanent document directory.
 * Returns the new permanent file:// URI, or the original URI if not a local file or copy fails.
 */
export async function saveFilePermanently(uri?: string, filename?: string): Promise<string | undefined> {
  if (!uri) return undefined;
  if (Platform.OS === "web") return uri;
  if (!uri.startsWith("file://") && !uri.startsWith("/")) {
    // Remote URI (sandbox mode)
    return uri;
  }

  try {
    const permanentDirectory = FileSystem.documentDirectory;
    if (!permanentDirectory) return uri;

    // Check if it's already in the permanent directory
    if (uri.startsWith(permanentDirectory)) {
      return uri;
    }

    // Ensure the permanent directory exists
    const dirInfo = await FileSystem.getInfoAsync(permanentDirectory);
    if (!dirInfo.exists) {
      await FileSystem.makeDirectoryAsync(permanentDirectory, { intermediates: true });
    }

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

    console.log("[saveFilePermanently] Saved temporary file permanently at:", destinationUri);
    return destinationUri;
  } catch (error) {
    console.error("[saveFilePermanently] Failed to copy temporary file:", error);
    return uri; // Fallback to original URI if copy fails
  }
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
        Alert.alert("Sharing Not Supported", "Your browser does not support sharing.");
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
    const fileInfo = await FileSystem.getInfoAsync(uri);
    if (!fileInfo.exists) {
      Alert.alert("File Not Found", "The attached file could not be found.");
      return;
    }

    if (Platform.OS === "web") {
      Alert.alert("Not Supported", "Web sharing of files is not fully supported in this environment.");
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
        Alert.alert(
          "File Sharing Unavailable",
          "Sharing raw files is not supported on this environment/device."
        );
      }
    }
  } catch (error) {
    console.error("[shareFile] Failed to share file:", error);
    Alert.alert("Sharing Failed", "An error occurred while sharing the file.");
  }
}

/**
 * Reads a local file's content, generates a styled HTML page with details and base64-encoded image,
 * and shares/downloads the resulting HTML file.
 */
export async function shareDocumentDetailsHtml(doc: ZentraDocument): Promise<void> {
  if (!doc.localUri) return;
  try {
    const fileInfo = await FileSystem.getInfoAsync(doc.localUri);
    if (!fileInfo.exists) {
      Alert.alert("File Not Found", "The attached file could not be found.");
      return;
    }

    // Read image as base64
    const base64Data = await FileSystem.readAsStringAsync(doc.localUri, {
      encoding: FileSystem.EncodingType.Base64,
    });
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
    const tempUri = FileSystem.cacheDirectory + `${doc.name.replace(/\.[^/.]+$/, "")}_details.html`;
    await FileSystem.writeAsStringAsync(tempUri, htmlContent);

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
        Alert.alert(
          "Rich Sharing Unavailable",
          "HTML/Image sharing is not supported in this environment. Would you like to share the document details as text instead?",
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
    try {
      await FileSystem.deleteAsync(tempUri, { idempotent: true });
    } catch (err) {
      console.warn("Failed to delete temp HTML share file:", err);
    }
  } catch (error) {
    console.error("[shareDocumentDetailsHtml] Failed:", error);
    Alert.alert("Error", "Failed to generate document export.");
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
      Alert.alert("Success", "Document downloaded successfully!");
      return;
    }

    // Android download using SAF
    if (Platform.OS === "android") {
      try {
        const permissions = await FileSystem.StorageAccessFramework.requestDirectoryPermissionsAsync();
        if (!permissions.granted) {
          Alert.alert("Permission Denied", "Cannot save file without folder permissions.");
          return;
        }

        let fileUri = doc.localUri;
        let mimeType = doc.localUri ? mimeTypeFor(doc.fileType, doc.localUri) : "text/plain";
        let fileName = doc.name;

        if (!fileUri) {
          const summary = buildDocumentSummary(doc);
          const tempUri = FileSystem.cacheDirectory + `zentra_download_${Date.now()}.txt`;
          await FileSystem.writeAsStringAsync(tempUri, summary);
          fileUri = tempUri;
          fileName = `${doc.name.replace(/\.[^/.]+$/, "")}_details.txt`;
        }

        const fileContent = await FileSystem.readAsStringAsync(fileUri, {
          encoding: FileSystem.EncodingType.Base64,
        });

        const createdFileUri = await FileSystem.StorageAccessFramework.createFileAsync(
          permissions.directoryUri,
          fileName,
          mimeType
        );

        await FileSystem.writeAsStringAsync(createdFileUri, fileContent, {
          encoding: FileSystem.EncodingType.Base64,
        });

        if (!doc.localUri) {
          try {
            await FileSystem.deleteAsync(fileUri, { idempotent: true });
          } catch (err) {
            console.warn("Failed to delete temp download file:", err);
          }
        }

        Alert.alert("Success", "Document saved to your selected folder.");
      } catch (error) {
        console.error("Android download failed:", error);
        const Sharing = getSharingModule();
        if (doc.localUri && Sharing) {
          await Sharing.shareAsync(doc.localUri);
        } else {
          Alert.alert("Error", "Failed to download document.");
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
          const tempUri = FileSystem.cacheDirectory + `${doc.name.replace(/\.[^/.]+$/, "")}_details.txt`;
          await FileSystem.writeAsStringAsync(tempUri, summary);

          await Sharing.shareAsync(tempUri, { UTI: "public.text" });

          try {
            await FileSystem.deleteAsync(tempUri, { idempotent: true });
          } catch (err) {
            console.warn("Failed to delete temp download file:", err);
          }
        }
      } else {
        // Fallback to React Native's Share API on iOS
        try {
          if (doc.localUri) {
            await Share.share({ url: doc.localUri });
          } else {
            const summary = buildDocumentSummary(doc);
            await Share.share({ title: doc.name, message: summary });
          }
        } catch (error) {
          console.error("RN Share fallback for iOS download failed:", error);
          Alert.alert("Error", "Save/Share is not available on this device.");
        }
      }
    }
  } catch (error) {
    console.error("[downloadDocument] Failed:", error);
    Alert.alert("Error", "Failed to download document.");
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
      Alert.alert("Success", "Backup file downloaded successfully!");
      return;
    }

    // Native Flow
    const tempPath = FileSystem.cacheDirectory + "zentra_backup.json";
    await FileSystem.writeAsStringAsync(tempPath, json);

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
    try {
      await FileSystem.deleteAsync(tempPath, { idempotent: true });
    } catch (err) {
      console.warn("Failed to delete temp backup file:", err);
    }
  } catch (error) {
    console.error("[exportBackup] Failed to export backup:", error);
    Alert.alert("Export Failed", "An error occurred while generating or sharing your backup.");
  }
}


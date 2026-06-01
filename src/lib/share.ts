import { ZentraDocument, DocumentFileType } from "@/types";
import { formatDate, daysUntilExpiry, isExpired } from "./date";
import { Platform } from "react-native";
import * as FileSystem from "expo-file-system/legacy";

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

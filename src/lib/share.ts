import { ZentraDocument, DocumentFileType } from "@/types";
import { formatDate } from "./date";

/**
 * Maps DocumentFileType to its corresponding MIME type string
 */
export function mimeTypeFor(fileType: DocumentFileType): string {
  switch (fileType) {
    case "pdf":
      return "application/pdf";
    case "image":
      return "image/jpeg";
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

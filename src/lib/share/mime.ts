import { DocumentFileType } from "@/types";

export function imageMimeFromUri(uri?: string): string {
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

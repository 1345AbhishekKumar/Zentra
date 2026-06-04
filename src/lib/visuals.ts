import { colors } from "@/theme/tokens";
import { DocumentFileType } from "@/types";
import { Feather } from "@expo/vector-icons";
import React from "react";

export type FeatherIcon = React.ComponentProps<typeof Feather>["name"];

export interface DocVisuals {
  iconName: FeatherIcon;
  iconColor: string;
  bgColor: string;
}

export const NAME_RULES: { match: string; visuals: DocVisuals }[] = [
  {
    match: "passport",
    visuals: {
      iconName: "globe",
      iconColor: colors.accent,
      bgColor: "#EEF2FF",
    },
  },
  {
    match: "insurance",
    visuals: {
      iconName: "shield",
      iconColor: colors.accent,
      bgColor: "#EEF2FF",
    },
  },
  {
    match: "certificate",
    visuals: { iconName: "award", iconColor: "#7C3AED", bgColor: "#F5F3FF" },
  },
  {
    match: "license",
    visuals: {
      iconName: "credit-card",
      iconColor: "#3B82F6",
      bgColor: "#EFF6FF",
    },
  },
  {
    match: "driving",
    visuals: {
      iconName: "credit-card",
      iconColor: "#3B82F6",
      bgColor: "#EFF6FF",
    },
  },
];

export function getDocVisuals(
  name: string,
  category: string,
  fileType: string,
): DocVisuals {
  const lower = name.toLowerCase();
  for (const rule of NAME_RULES) {
    if (lower.includes(rule.match)) return rule.visuals;
  }
  if (fileType === "pdf")
    return {
      iconName: "file-text",
      iconColor: colors.danger,
      bgColor: "#FEF2F2",
    };
  if (fileType === "image")
    return { iconName: "image", iconColor: colors.success, bgColor: "#F0FDF4" };
  if (category === "Finance")
    return {
      iconName: "dollar-sign",
      iconColor: "#10B981",
      bgColor: "#ECFDF5",
    };
  return { iconName: "file", iconColor: colors.secondary, bgColor: "#F5F5F5" };
}

export function getFileVisuals(fileType: DocumentFileType): DocVisuals {
  switch (fileType) {
    case "pdf":
      return {
        iconName: "file-text",
        iconColor: colors.danger,
        bgColor: "#FEF2F2",
      };
    case "image":
      return {
        iconName: "image",
        iconColor: colors.success,
        bgColor: "#F0FDF4",
      };
    case "doc":
      return {
        iconName: "file-text",
        iconColor: "#3B82F6",
        bgColor: "#EFF6FF",
      };
    case "other":
    default:
      return {
        iconName: "file",
        iconColor: colors.warning,
        bgColor: "#FEF3C7",
      };
  }
}

export function getFileTypeLabel(fileType: string): string {
  switch (fileType) {
    case "pdf":
      return "PDF Document";
    case "image":
      return "Image File";
    case "doc":
      return "Word Document";
    case "other":
    default:
      return "Document File";
  }
}

export function getFileTypeFromMime(mimeType: string): DocumentFileType {
  if (mimeType.startsWith("image/")) return "image";
  if (mimeType === "application/pdf") return "pdf";
  if (
    mimeType === "application/msword" ||
    mimeType.startsWith("application/vnd.openxmlformats-officedocument")
  ) {
    return "doc";
  }
  return "other";
}

export function getFileTypeFromUri(uri: string, mimeType?: string): DocumentFileType {
  if (mimeType) {
    const type = getFileTypeFromMime(mimeType);
    if (type !== "other") return type;
  }
  const ext = uri.split(".").pop()?.toLowerCase();
  if (ext === "pdf") return "pdf";
  if (["jpg", "jpeg", "png", "gif", "webp", "heic"].includes(ext || "")) return "image";
  if (["doc", "docx", "rtf", "txt"].includes(ext || "")) return "doc";
  return "other";
}

export function formatBytes(bytes?: number): string {
  if (!bytes || bytes <= 0) return "Unknown size";
  const kb = bytes / 1024;
  if (kb < 1024) return `${kb.toFixed(1)} KB`;
  const mb = kb / 1024;
  return `${mb.toFixed(1)} MB`;
}

import { colors } from "@/theme/tokens";
import { DocumentFileType } from "@/types";
import { Feather } from "@expo/vector-icons";
import { requireOptionalNativeModule } from "expo-modules-core";
import React from "react";
import { Linking, Text, View } from "react-native";
import ScalePressable from "./ScalePressable";
import { getFileVisuals } from "@/lib/visuals";
import { showAlert } from "@/store/alertStore";

export interface PickedFile {
  uri: string;
  name: string;
  mimeType: string;
  sizeLabel: string;
  fileType: DocumentFileType;
}

interface FilePickerButtonProps {
  onFilePicked: (result: PickedFile | null) => void;
  currentUri?: string;
  fileName?: string;
  fileSizeLabel?: string;
  fileType?: DocumentFileType;
}

// Check native availability using the global flags registered at startup in index.js.
// We fallback to checking via requireOptionalNativeModule if the entrypoint flags are missing (e.g. in tests).
const isImagePickerNativeAvailable =
  typeof (globalThis as any).__isImagePickerNativeAvailable === "boolean"
    ? (globalThis as any).__isImagePickerNativeAvailable
    : !!requireOptionalNativeModule("ExponentImagePicker");

const isDocumentPickerNativeAvailable =
  typeof (globalThis as any).__isDocumentPickerNativeAvailable === "boolean"
    ? (globalThis as any).__isDocumentPickerNativeAvailable
    : !!requireOptionalNativeModule("ExpoDocumentPicker");

// Safely require expo-image-picker to prevent startup and runtime crashes on missing native modules
const safeRequireImagePicker = () => {
  if (!isImagePickerNativeAvailable) {
    return null;
  }
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const ImagePicker = require("expo-image-picker");
    if (
      ImagePicker &&
      typeof ImagePicker.requestCameraPermissionsAsync === "function" &&
      typeof ImagePicker.launchCameraAsync === "function"
    ) {
      return ImagePicker as typeof import("expo-image-picker");
    }
  } catch {
    // Native module not registered in this binary
  }
  return null;
};

// Safely require expo-document-picker to prevent startup and runtime crashes on missing native modules
const safeRequireDocumentPicker = () => {
  if (!isDocumentPickerNativeAvailable) {
    return null;
  }
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const DocumentPicker = require("expo-document-picker");
    if (DocumentPicker && typeof DocumentPicker.getDocumentAsync === "function") {
      return DocumentPicker as typeof import("expo-document-picker");
    }
  } catch {
    // Native module not registered in this binary
  }
  return null;
};

function getFileTypeFromMime(mimeType: string): DocumentFileType {
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

function getFileTypeFromUri(uri: string, mimeType?: string): DocumentFileType {
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

function formatBytes(bytes?: number): string {
  if (!bytes || bytes <= 0) return "Unknown size";
  const kb = bytes / 1024;
  if (kb < 1024) return `${kb.toFixed(1)} KB`;
  const mb = kb / 1024;
  return `${mb.toFixed(1)} MB`;
}

export default function FilePickerButton({
  onFilePicked,
  currentUri,
  fileName,
  fileSizeLabel,
  fileType,
}: FilePickerButtonProps) {

  const requestCameraPermission = async () => {
    try {
      const ImagePicker = safeRequireImagePicker();
      if (!ImagePicker) return false;
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== "granted") {
        showAlert(
          "Camera Permission Required",
          "Zentra needs access to your camera to capture photos. Please enable it in your device Settings.",
          "warning",
          [
            { text: "Cancel", style: "cancel" },
            { text: "Settings", onPress: () => Linking.openSettings() },
          ]
        );
        return false;
      }
      return true;
    } catch (error) {
      console.error("Failed to request camera permission:", error);
      return false;
    }
  };

  const requestMediaLibraryPermission = async () => {
    try {
      const ImagePicker = safeRequireImagePicker();
      if (!ImagePicker) return false;
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== "granted") {
        showAlert(
          "Photo Library Permission Required",
          "Zentra needs access to your photo library to select photos. Please enable it in your device Settings.",
          "warning",
          [
            { text: "Cancel", style: "cancel" },
            { text: "Settings", onPress: () => Linking.openSettings() },
          ]
        );
        return false;
      }
      return true;
    } catch (error) {
      console.error("Failed to request media library permission:", error);
      return false;
    }
  };

  const handleCamera = async () => {
    try {
      const ImagePicker = safeRequireImagePicker();
      if (!ImagePicker) {
        showAlert(
          "Sandbox Mode",
          "Native camera is not available in this environment. A simulated document photo has been attached for testing.",
          "info"
        );
        onFilePicked({
          uri: "https://images.unsplash.com/photo-1554415707-6e8cfc93fe23?w=500",
          name: `camera_capture_${Date.now()}.jpg`,
          mimeType: "image/jpeg",
          sizeLabel: "1.5 MB",
          fileType: "image",
        });
        return;
      }

      const hasPermission = await requestCameraPermission();
      if (!hasPermission) return;

      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ["images"],
        allowsEditing: true,
        quality: 0.8,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const asset = result.assets[0];
        const uri = asset.uri;
        const name = asset.fileName || uri.split("/").pop() || `camera_${Date.now()}.jpg`;
        const mimeType = asset.mimeType || "image/jpeg";
        const inferredFileType = getFileTypeFromUri(uri, mimeType);
        const sizeLabel = formatBytes(asset.fileSize);

        onFilePicked({
          uri,
          name,
          mimeType,
          sizeLabel,
          fileType: inferredFileType,
        });
      }
    } catch (error) {
      console.error("Camera capture failed:", error);
      showAlert("Capture Failed", "An error occurred while opening the camera.", "error");
    }
  };

  const handlePhotoLibrary = async () => {
    try {
      const ImagePicker = safeRequireImagePicker();
      if (!ImagePicker) {
        showAlert(
          "Sandbox Mode",
          "Native photo library is not available in this environment. A simulated photo library image has been attached for testing.",
          "info"
        );
        onFilePicked({
          uri: "https://images.unsplash.com/photo-1568602471122-7832951cc4c5?w=500",
          name: `photo_library_${Date.now()}.jpg`,
          mimeType: "image/jpeg",
          sizeLabel: "1.2 MB",
          fileType: "image",
        });
        return;
      }

      const hasPermission = await requestMediaLibraryPermission();
      if (!hasPermission) return;

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ["images"],
        allowsEditing: true,
        quality: 0.8,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const asset = result.assets[0];
        const uri = asset.uri;
        const name = asset.fileName || uri.split("/").pop() || `photo_${Date.now()}.jpg`;
        const mimeType = asset.mimeType || "image/jpeg";
        const inferredFileType = getFileTypeFromUri(uri, mimeType);
        const sizeLabel = formatBytes(asset.fileSize);

        onFilePicked({
          uri,
          name,
          mimeType,
          sizeLabel,
          fileType: inferredFileType,
        });
      }
    } catch (error) {
      console.error("Photo library picking failed:", error);
      showAlert("Selection Failed", "An error occurred while opening the photo library.", "error");
    }
  };

  const handleDocumentPicker = async () => {
    try {
      const DocumentPicker = safeRequireDocumentPicker();
      if (!DocumentPicker) {
        showAlert(
          "Sandbox Mode",
          "Native file browser is not available in this environment. A simulated PDF document has been attached for testing.",
          "info"
        );
        onFilePicked({
          uri: "simulated_document.pdf",
          name: "Sample_Passport.pdf",
          mimeType: "application/pdf",
          sizeLabel: "2.4 MB",
          fileType: "pdf",
        });
        return;
      }

      const result = await DocumentPicker.getDocumentAsync({
        type: "*/*",
        copyToCacheDirectory: true,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const asset = result.assets[0];
        const uri = asset.uri;
        const name = asset.name || "document";
        const mimeType = asset.mimeType || "application/octet-stream";
        const inferredFileType = getFileTypeFromUri(uri, mimeType);
        const sizeLabel = formatBytes(asset.size);

        onFilePicked({
          uri,
          name,
          mimeType,
          sizeLabel,
          fileType: inferredFileType,
        });
      }
    } catch (error) {
      console.error("Document picking failed:", error);
      showAlert("Picking Failed", "An error occurred while opening the document browser.", "error");
    }
  };

  const showAttachmentMenu = () => {
    showAlert(
      "Attach File",
      "Select a source for your file attachment",
      "info",
      [
        { text: "📷 Camera", onPress: handleCamera },
        { text: "🖼 Photo Library", onPress: handlePhotoLibrary },
        { text: "📄 Browse Files", onPress: handleDocumentPicker },
        { text: "Cancel", style: "cancel" },
      ]
    );
  };

  const handleRemove = () => {
    onFilePicked(null);
  };

  // If we have a selected file
  if (currentUri) {
    const resolvedFileType = fileType || getFileTypeFromUri(currentUri);
    const { iconName, iconColor, bgColor } = getFileVisuals(resolvedFileType);

    return (
      <View className="mb-4">
        <Text className="text-body-md text-primary font-semibold mb-2">
          Attached File
        </Text>
        <View className="flex-row items-center bg-surface border border-border/80 rounded-xl p-4 justify-between">
          <View className="flex-row items-center flex-1 mr-3">
            <View
              className="w-12 h-12 rounded-xl items-center justify-center mr-3"
              style={{ backgroundColor: bgColor }}
            >
              <Feather name={iconName} size={24} color={iconColor} />
            </View>
            <View className="flex-1">
              <Text
                numberOfLines={1}
                ellipsizeMode="middle"
                className="text-body-md text-primary font-semibold"
              >
                {fileName || "Attached File"}
              </Text>
              <Text className="text-caption text-secondary mt-0.5">
                {fileSizeLabel || "Unknown size"}
              </Text>
            </View>
          </View>
          <ScalePressable
            onPress={handleRemove}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            accessibilityRole="button"
            accessibilityLabel="Remove attached file"
            className="w-8 h-8 rounded-full items-center justify-center bg-background active:bg-border/40"
          >
            <Feather name="x" size={18} color={colors.secondary} />
          </ScalePressable>
        </View>
      </View>
    );
  }

  // Empty state with dashed borders
  return (
    <View className="mb-4">
      <Text className="text-body-md text-primary font-semibold mb-2">
        Attachment <Text className="text-secondary font-normal text-body-sm">(Optional)</Text>
      </Text>
      <ScalePressable
        onPress={showAttachmentMenu}
        accessibilityRole="button"
        accessibilityLabel="Attach a file"
        className="w-full border-2 border-dashed border-border/80 bg-surface rounded-xl p-6 items-center justify-center active:opacity-90"
      >
        <Feather name="paperclip" size={24} color={colors.secondary} />
        <Text className="text-body-md text-primary font-semibold mt-2">
          Attach a file
        </Text>
        <Text className="text-caption text-secondary mt-1">
          Support images, PDFs, docs
        </Text>
      </ScalePressable>
    </View>
  );
}


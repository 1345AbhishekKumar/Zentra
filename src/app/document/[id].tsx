import ExpiryBadge from "@/components/ExpiryBadge";
import EmptyState from "@/components/EmptyState";
import FileViewer from "@/components/FileViewer";
import NotificationToggle from "@/components/NotificationToggle";
import ActionSheet from "@/components/ActionSheet";
import ConfirmationModal from "@/components/ConfirmationModal";
import { formatDate } from "@/lib/date";
import {
  cancelDocumentNotifications,
  scheduleDocumentNotifications,
} from "@/lib/notifications";
import { useDocumentStore } from "@/store/documentStore";
import { colors } from "@/theme/tokens";
import { useUser } from "@clerk/expo";
import { Feather, Ionicons } from "@expo/vector-icons";
import { format, parseISO } from "date-fns";
import * as FileSystem from "expo-file-system/legacy";
import type * as SharingType from "expo-sharing";
import { buildDocumentSummary, mimeTypeFor, generateShareHtml } from "@/lib/share";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useState } from "react";
import {
    AccessibilityInfo,
    Alert,
    Platform,
    Pressable,
    ScrollView,
    Share,
    StyleSheet,
    Text,
    View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const getSharingModule = (): typeof SharingType | null => {
  if (Platform.OS === "web") {
    return null;
  }
  try {
    const { requireOptionalNativeModule } = require("expo-modules-core");
    const isAvailable = !!requireOptionalNativeModule("ExpoSharing");
    if (isAvailable) {
      return require("expo-sharing");
    }
  } catch {
    // Native module not available
  }
  return null;
};

type FeatherIcon = React.ComponentProps<typeof Feather>["name"];

interface FileVisuals {
  iconName: FeatherIcon;
  iconColor: string;
  bgColor: string;
}

function getFileVisuals(fileType: string): FileVisuals {
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

function getFileTypeLabel(fileType: string): string {
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

export default function DocumentDetailsScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { user: clerkUser } = useUser();
  const {
    documents,
    toggleFavorite,
    deleteDocument,
    toggleNotification,
    notificationSettings,
    folders,
    updateDocument,
  } = useDocumentStore();
  const insets = useSafeAreaInsets();
  const [fileViewerVisible, setFileViewerVisible] = useState(false);
  const [isActionSheetVisible, setIsActionSheetVisible] = useState(false);
  const [isMoveSheetVisible, setIsMoveSheetVisible] = useState(false);
  const [isDeleteModalVisible, setIsDeleteModalVisible] = useState(false);
  const [isShareSheetVisible, setIsShareSheetVisible] = useState(false);
  const goBack = () => {
    if (router.canGoBack()) {
      router.back();
      return;
    }
    router.replace("/(tabs)");
  };

  // Find the active document
  const doc = documents.find((d) => d.id === id);

  if (!doc) {
    return (
      <View
        className="flex-1 justify-center items-center p-6"
        style={{ backgroundColor: colors.background }}
      >
        <EmptyState
          icon="alert-circle-outline"
          title="Document not found"
          message="This document may have been deleted or does not exist."
          actionLabel="Go back"
          onAction={goBack}
        />
      </View>
    );
  }

  const visuals = getFileVisuals(doc.fileType);
  const typeLabel = getFileTypeLabel(doc.fileType);
  const sizeLabel = doc.sizeLabel || "1.0 MB";

  // Dynamic user name formatting with neutral fallback
  const fullName =
    `${clerkUser?.firstName || ""} ${clerkUser?.lastName || ""}`.trim();
  const creatorName = fullName || "Unknown";

  // Date formatting helpers
  const formatDateTime = (dateStr: string) => {
    try {
      return format(parseISO(dateStr), "d MMM yyyy, hh:mm a");
    } catch {
      return dateStr;
    }
  };

  const formattedAdded = formatDateTime(doc.createdAt);
  const formattedModified = formatDateTime(doc.updatedAt);
  const formattedExpiry = formatDate(doc.expiryDate);

  // Actions
  const handleViewFile = async () => {
    if (!doc.localUri) return;
    try {
      const info = await FileSystem.getInfoAsync(doc.localUri);
      if (!info.exists) {
        Alert.alert(
          "File Not Found",
          "The attached file could not be found. It may have been moved or deleted from your device.",
        );
        return;
      }
      setFileViewerVisible(true);
    } catch {
      Alert.alert(
        "File Not Found",
        "The attached file could not be found. It may have been moved or deleted from your device.",
      );
    }
  };

  const shareTextOnly = async () => {
    setIsShareSheetVisible(false);
    try {
      const summary = buildDocumentSummary(doc);
      if (Platform.OS === "web") {
        if (navigator.share) {
          await navigator.share({
            title: doc.name,
            text: summary,
          });
        } else {
          Alert.alert("Sharing Not Supported", "Your browser does not support sharing.");
        }
        return;
      }
      await Share.share({
        title: doc.name,
        message: summary,
      });
    } catch (error) {
      console.error("Text sharing failed:", error);
    }
  };

  const shareFileOnly = async () => {
    setIsShareSheetVisible(false);
    if (!doc.localUri) return;
    try {
      const fileInfo = await FileSystem.getInfoAsync(doc.localUri);
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
        await Sharing.shareAsync(doc.localUri, {
          mimeType: mimeTypeFor(doc.fileType, doc.localUri),
          dialogTitle: doc.name,
        });
      } else {
        // Fallback to React Native Share API
        if (Platform.OS === "ios") {
          await Share.share({
            url: doc.localUri,
          });
        } else {
          const summary = buildDocumentSummary(doc);
          Alert.alert(
            "File Sharing Unavailable",
            "Sharing raw files is not supported on this environment/device. Would you like to share the document details as text instead?",
            [
              { text: "Cancel", style: "cancel" },
              {
                text: "Share Text",
                onPress: async () => {
                  try {
                    await Share.share({
                      title: doc.name,
                      message: summary,
                    });
                  } catch (err) {
                    console.error("RN Share fallback failed:", err);
                  }
                },
              },
            ]
          );
        }
      }
    } catch (error) {
      console.error("File sharing failed:", error);
    }
  };

  const shareDetailsWithImageHtml = async () => {
    setIsShareSheetVisible(false);
    if (!doc.localUri) return;
    try {
      const fileInfo = await FileSystem.getInfoAsync(doc.localUri);
      if (!fileInfo.exists) {
        Alert.alert("File Not Found", "The attached file could not be found.");
        return;
      }

      const Sharing = getSharingModule();
      const isSharingAvailable = Sharing ? await Sharing.isAvailableAsync() : false;

      if (!isSharingAvailable) {
        const summary = buildDocumentSummary(doc);
        if (Platform.OS === "ios") {
          // On iOS, try to write HTML and share via RN Share (since iOS Share supports file URLs)
          try {
            const base64Data = await FileSystem.readAsStringAsync(doc.localUri, {
              encoding: FileSystem.EncodingType.Base64,
            });
            const htmlContent = generateShareHtml(doc, base64Data);
            const tempUri = FileSystem.cacheDirectory + `${doc.name.replace(/\.[^/.]+$/, "")}_details.html`;
            await FileSystem.writeAsStringAsync(tempUri, htmlContent);

            await Share.share({
              url: tempUri,
            });

            try {
              await FileSystem.deleteAsync(tempUri, { idempotent: true });
            } catch (err) {
              console.warn("Failed to delete temp HTML share file:", err);
            }
          } catch (error) {
            console.error("RN Share fallback for HTML on iOS failed:", error);
            await Share.share({
              title: doc.name,
              message: summary,
            });
          }
        } else {
          // On Android / Web, fallback to sharing text summary directly
          Alert.alert(
            "Rich Sharing Unavailable",
            "HTML/Image sharing is not supported in this environment/device. Would you like to share the document details as text instead?",
            [
              { text: "Cancel", style: "cancel" },
              {
                text: "Share Text",
                onPress: async () => {
                  try {
                    await Share.share({
                      title: doc.name,
                      message: summary,
                    });
                  } catch (err) {
                    console.error("RN Share fallback failed:", err);
                  }
                },
              },
            ]
          );
        }
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

      // Native - write to temp HTML file
      const tempUri = FileSystem.cacheDirectory + `${doc.name.replace(/\.[^/.]+$/, "")}_details.html`;
      await FileSystem.writeAsStringAsync(tempUri, htmlContent);

      if (Sharing) {
        await Sharing.shareAsync(tempUri, {
          mimeType: "text/html",
          dialogTitle: `${doc.name} Details`,
        });
      }

      // Clean up temp file (fire-and-forget)
      try {
        await FileSystem.deleteAsync(tempUri, { idempotent: true });
      } catch (err) {
        console.warn("Failed to delete temp HTML share file:", err);
      }
    } catch (error) {
      console.error("HTML sharing failed:", error);
      Alert.alert("Error", "Failed to generate document export.");
    }
  };

  const handleSharePress = () => {
    if (doc.localUri) {
      setIsShareSheetVisible(true);
    } else {
      shareTextOnly();
    }
  };

  const handleDownload = async () => {
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
              await Share.share({
                url: doc.localUri,
              });
            } else {
              const summary = buildDocumentSummary(doc);
              await Share.share({
                title: doc.name,
                message: summary,
              });
            }
          } catch (error) {
            console.error("RN Share fallback for iOS download failed:", error);
            Alert.alert("Error", "Save/Share is not available on this device.");
          }
        }
      }
    } catch (error) {
      console.error("Failed to download document:", error);
      Alert.alert("Error", "Failed to download document.");
    }
  };

  const handleMove = () => {
    setIsMoveSheetVisible(true);
  };

  const handleDelete = () => {
    setIsDeleteModalVisible(true);
  };

  const handleConfirmDelete = async () => {
    await cancelDocumentNotifications(doc.id);
    deleteDocument(doc.id);
    AccessibilityInfo.announceForAccessibility("Document deleted");
    goBack();
  };

  const showOptions = () => {
    setIsActionSheetVisible(true);
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      {/* Navigation Header */}
      <View
        className="flex-row justify-between items-center px-6 pb-4 bg-surface border-b border-border/20"
        style={{ paddingTop: insets.top > 0 ? insets.top : 16 }}
      >
        <Pressable
          onPress={goBack}
          hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
          accessibilityRole="button"
          accessibilityLabel="Go back"
          className="w-10 h-10 items-center justify-center rounded-full active:bg-background"
        >
          <Feather name="arrow-left" size={24} color={colors.primary} />
        </Pressable>
        <Text className="text-h2 text-primary font-bold">Document Details</Text>
        <Pressable
          onPress={showOptions}
          hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
          accessibilityRole="button"
          accessibilityLabel="More options"
          className="w-10 h-10 items-center justify-center rounded-full active:bg-background"
        >
          <Feather name="more-horizontal" size={24} color={colors.primary} />
        </Pressable>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{
          paddingHorizontal: 24,
          paddingBottom: 60 + insets.bottom,
        }}
      >
        {/* Document Icon + Name Block */}
        <View
          className="bg-surface rounded-2xl p-6 items-center border border-border/40 mt-6 shadow-sm"
          style={styles.cardShadow}
        >
          <View
            className="w-20 h-20 rounded-2xl items-center justify-center mb-4"
            style={{ backgroundColor: visuals.bgColor }}
          >
            <Feather
              name={visuals.iconName}
              size={38}
              color={visuals.iconColor}
            />
          </View>
          <Text
            numberOfLines={2}
            className="text-h1 text-primary text-center font-bold px-2 mb-1"
          >
            {doc.name}
          </Text>
          <Text className="text-body-md text-secondary text-center mb-4">
            {typeLabel} • {sizeLabel}
          </Text>

          {/* ExpiryBadge - prominently placed */}
          <ExpiryBadge expiryDate={doc.expiryDate} hideSafe={false} />
        </View>

        {/* Information Section */}
        <View className="mt-8">
          <Text className="text-h2 text-primary font-bold mb-4">
            Information
          </Text>
          <View className="bg-surface rounded-2xl border border-border/40 overflow-hidden px-4">
            <View className="flex-row justify-between items-center py-4 border-b border-border/30">
              <View className="flex-row items-center">
                <Feather
                  name="file-text"
                  size={16}
                  color="#8A8A8F"
                  style={styles.infoIcon}
                />
                <Text className="text-body-md text-secondary">Type</Text>
              </View>
              <Text className="text-body-md text-primary font-medium">
                {typeLabel}
              </Text>
            </View>

            <View className="flex-row justify-between items-center py-4 border-b border-border/30">
              <View className="flex-row items-center">
                <Feather
                  name="database"
                  size={16}
                  color="#8A8A8F"
                  style={styles.infoIcon}
                />
                <Text className="text-body-md text-secondary">Size</Text>
              </View>
              <Text className="text-body-md text-primary font-medium">
                {sizeLabel}
              </Text>
            </View>

            <View className="flex-row justify-between items-center py-4 border-b border-border/30">
              <View className="flex-row items-center">
                <Feather
                  name="calendar"
                  size={16}
                  color="#8A8A8F"
                  style={styles.infoIcon}
                />
                <Text className="text-body-md text-secondary">Added on</Text>
              </View>
              <Text className="text-body-md text-primary font-medium">
                {formattedAdded}
              </Text>
            </View>

            <View className="flex-row justify-between items-center py-4 border-b border-border/30">
              <View className="flex-row items-center">
                <Feather
                  name="clock"
                  size={16}
                  color="#8A8A8F"
                  style={styles.infoIcon}
                />
                <Text className="text-body-md text-secondary">Expiry Date</Text>
              </View>
              <Text className="text-body-md text-primary font-medium">
                {formattedExpiry}
              </Text>
            </View>

            <View className="flex-row justify-between items-center py-4 border-b border-border/30">
              <NotificationToggle
                documentId={doc.id}
                enabled={doc.notificationsEnabled}
                onToggle={async (enabled) => {
                  toggleNotification(doc.id);
                  if (enabled) {
                    if (notificationSettings.globalEnabled) {
                      await scheduleDocumentNotifications(
                        { ...doc, notificationsEnabled: true },
                        notificationSettings.advanceNoticeDays,
                        notificationSettings.reminderTime || "09:00",
                      );
                    }
                  } else {
                    await cancelDocumentNotifications(doc.id);
                  }
                }}
                label="Notifications"
                icon="bell"
                iconSize={16}
                iconColor="#8A8A8F"
                textClassName="text-body-md text-secondary"
                className="flex-row items-center justify-between w-full"
              />
            </View>

            <View className="flex-row justify-between items-center py-4 border-b border-border/30">
              <View className="flex-row items-center">
                <Feather
                  name="folder"
                  size={16}
                  color="#8A8A8F"
                  style={styles.infoIcon}
                />
                <Text className="text-body-md text-secondary">Location</Text>
              </View>
              <View className="bg-softAccent px-3 py-1 rounded-md">
                <Text className="text-caption text-accent font-semibold">
                  {doc.category}
                </Text>
              </View>
            </View>

            <View className="flex-row justify-between items-center py-4 border-b border-border/30">
              <View className="flex-row items-center">
                <Feather
                  name="edit-3"
                  size={16}
                  color="#8A8A8F"
                  style={styles.infoIcon}
                />
                <Text className="text-body-md text-secondary">Modified on</Text>
              </View>
              <Text className="text-body-md text-primary font-medium">
                {formattedModified}
              </Text>
            </View>

            <View className="flex-row justify-between items-center py-4">
              <View className="flex-row items-center">
                <Feather
                  name="user"
                  size={16}
                  color="#8A8A8F"
                  style={styles.infoIcon}
                />
                <Text className="text-body-md text-secondary">Created by</Text>
              </View>
              <Text className="text-body-md text-primary font-medium">
                {creatorName}
              </Text>
            </View>
          </View>
        </View>

        {/* Actions Section */}
        <View className="mt-8">
          <View className="bg-surface rounded-2xl border border-border/40 overflow-hidden">
            {/* View File — only shown when a file is attached */}
            {doc.localUri ? (
              <Pressable
                onPress={handleViewFile}
                accessibilityRole="button"
                accessibilityLabel="View attached file"
                className="flex-row items-center px-4 py-4 border-b border-border/30 active:bg-background"
              >
                <Feather name="eye" size={20} color={colors.accent} />
                <Text className="text-body-lg text-accent ml-3 font-semibold">
                  View File
                </Text>
              </Pressable>
            ) : null}

            <Pressable
              onPress={handleSharePress}
              accessibilityRole="button"
              accessibilityLabel="Share document"
              className="flex-row items-center px-4 py-4 border-b border-border/30 active:bg-background"
            >
              <Feather name="share-2" size={20} color={colors.primary} />
              <Text className="text-body-lg text-primary ml-3 font-semibold">
                Share
              </Text>
            </Pressable>

            <Pressable
              onPress={handleDownload}
              accessibilityRole="button"
              accessibilityLabel="Download document"
              className="flex-row items-center px-4 py-4 border-b border-border/30 active:bg-background"
            >
              <Feather name="download" size={20} color={colors.primary} />
              <Text className="text-body-lg text-primary ml-3 font-semibold">
                Download
              </Text>
            </Pressable>

            <Pressable
              onPress={() => toggleFavorite(doc.id)}
              accessibilityRole="button"
              accessibilityLabel={doc.isFavorite ? "Remove from Favorites" : "Add to Favorites"}
              className="flex-row items-center px-4 py-4 border-b border-border/30 active:bg-background"
            >
              <Ionicons
                name={doc.isFavorite ? "heart" : "heart-outline"}
                size={22}
                color={doc.isFavorite ? colors.danger : colors.primary}
              />
              <Text
                className={`text-body-lg ml-3 font-semibold ${
                  doc.isFavorite ? "text-danger" : "text-primary"
                }`}
              >
                {doc.isFavorite ? "Remove from Favorites" : "Add to Favorites"}
              </Text>
            </Pressable>

            <Pressable
              onPress={handleMove}
              accessibilityRole="button"
              accessibilityLabel="Move document"
              className="flex-row items-center px-4 py-4 active:bg-background"
            >
              <Feather name="folder-plus" size={20} color={colors.primary} />
              <Text className="text-body-lg text-primary ml-3 font-semibold">
                Move
              </Text>
            </Pressable>
          </View>
        </View>
      </ScrollView>

      {/* File Viewer Modal */}
      {doc.localUri ? (
        <FileViewer
          visible={fileViewerVisible}
          onClose={() => setFileViewerVisible(false)}
          localUri={doc.localUri}
          fileType={doc.fileType}
          fileName={doc.name}
        />
      ) : null}

      {/* Options Action Sheet */}
      <ActionSheet
        visible={isActionSheetVisible}
        onClose={() => setIsActionSheetVisible(false)}
        title="Document Options"
        options={[
          {
            label: "Edit Document",
            icon: "edit-2",
            onPress: () => router.push(`/edit-document/${doc.id}` as never),
          },
          {
            label: "Delete Document",
            icon: "trash-2",
            isDestructive: true,
            onPress: handleDelete,
          },
        ]}
      />

      {/* Move Action Sheet */}
      <ActionSheet
        visible={isMoveSheetVisible}
        onClose={() => setIsMoveSheetVisible(false)}
        title="Move to Folder"
        options={folders.map((folder) => ({
          label: folder,
          icon: folder === doc.category ? ("check" as const) : ("folder" as const),
          onPress: () => {
            updateDocument(doc.id, { category: folder });
            AccessibilityInfo.announceForAccessibility(`Document moved to ${folder}`);
            Alert.alert("Document Moved", `Successfully moved to "${folder}"`);
          },
        }))}
      />

      {/* Share Options Action Sheet */}
      <ActionSheet
        visible={isShareSheetVisible}
        onClose={() => setIsShareSheetVisible(false)}
        title="Share Document"
        options={[
          {
            label: "Share Details as Text",
            icon: "align-left" as const,
            onPress: shareTextOnly,
          },
          {
            label: `Share Raw ${doc.fileType.toUpperCase()} File`,
            icon: "file" as const,
            onPress: shareFileOnly,
          },
          ...(doc.fileType === "image"
            ? [
                {
                  label: "Share Details + Image (HTML)",
                  icon: "file-text" as const,
                  onPress: shareDetailsWithImageHtml,
                },
              ]
            : []),
        ]}
      />

      {/* Delete Confirmation Modal */}
      <ConfirmationModal
        visible={isDeleteModalVisible}
        onClose={() => setIsDeleteModalVisible(false)}
        onConfirm={handleConfirmDelete}
        title="Delete Document"
        message="Are you sure you want to permanently delete this document from your vault? This action cannot be undone."
        confirmLabel="Delete"
        isDestructive
      />
    </View>
  );
}

const styles = StyleSheet.create({
  cardShadow: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
  },
  infoIcon: {
    marginRight: 12,
  },
});

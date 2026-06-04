import ExpiryBadge from "@/components/ExpiryBadge";
import EmptyState from "@/components/EmptyState";
import FileViewer from "@/components/FileViewer";
import ActionSheet from "@/components/ActionSheet";
import ConfirmationModal from "@/components/ConfirmationModal";
import { formatDate, formatDateTime } from "@/lib/date";
import { useDocumentStore } from "@/store/documentStore";
import { colors } from "@/theme/tokens";
import { useUser } from "@clerk/expo";
import { Feather, Ionicons } from "@expo/vector-icons";
import { fileExists } from "@/lib/fileStorage";
import { buildDocumentSummary, shareText, shareFile, shareDocumentDetailsHtml, downloadDocument } from "@/lib/share";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useState } from "react";
import {
  AccessibilityInfo,
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { getFileVisuals, getFileTypeLabel } from "@/lib/visuals";
import DocumentInfoList from "@/components/DocumentInfoList";

export default function DocumentDetailsScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { user: clerkUser } = useUser();
  const {
    documents,
    toggleFavorite,
    deleteDocument,
    toggleNotification,
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

  // Find the active document (excluding soft-deleted ones)
  const doc = documents.find((d) => d.id === id && !d.isDeleted);

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

  const formattedAdded = formatDateTime(doc.createdAt);
  const formattedModified = formatDateTime(doc.updatedAt);
  const formattedExpiry = formatDate(doc.expiryDate);

  // Actions
  const handleViewFile = async () => {
    if (!doc.localUri) return;
    try {
      const exists = await fileExists(doc.localUri);
      if (!exists) {
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
    const summary = buildDocumentSummary(doc);
    await shareText(doc.name, summary);
  };

  const shareFileOnly = async () => {
    setIsShareSheetVisible(false);
    if (!doc.localUri) return;
    await shareFile(doc.localUri, doc.name, doc.fileType);
  };

  const shareDetailsWithImageHtml = async () => {
    setIsShareSheetVisible(false);
    await shareDocumentDetailsHtml(doc);
  };

  const handleSharePress = () => {
    if (doc.localUri) {
      setIsShareSheetVisible(true);
    } else {
      shareTextOnly();
    }
  };

  const handleDownload = async () => {
    await downloadDocument(doc);
  };

  const handleMove = () => {
    setIsMoveSheetVisible(true);
  };

  const handleDelete = () => {
    setIsDeleteModalVisible(true);
  };

  const handleConfirmDelete = async () => {
    await deleteDocument(doc.id);
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
        <DocumentInfoList
          doc={doc}
          typeLabel={typeLabel}
          sizeLabel={sizeLabel}
          formattedAdded={formattedAdded}
          formattedExpiry={formattedExpiry}
          formattedModified={formattedModified}
          creatorName={creatorName}
          toggleNotification={toggleNotification}
        />

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
});

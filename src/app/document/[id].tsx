import ExpiryBadge from "@/components/ExpiryBadge";
import EmptyState from "@/components/EmptyState";
import NotificationToggle from "@/components/NotificationToggle";
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
import { useLocalSearchParams, useRouter } from "expo-router";
import React from "react";
import {
    Alert,
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

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
  } = useDocumentStore();
  const insets = useSafeAreaInsets();
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
  const handleShare = () => {
    console.log("Share pressed for document:", doc.id);
    Alert.alert("Share", "Sharing option is decorative for now.");
  };

  const handleDownload = () => {
    console.log("Download pressed for document:", doc.id);
    Alert.alert("Download", "Download option is decorative for now.");
  };

  const handleMove = () => {
    console.log("Move pressed for document:", doc.id);
    Alert.alert("Move", "Move option is decorative for now.");
  };

  const handleDelete = () => {
    Alert.alert(
      "Delete Document",
      "Are you sure you want to permanently delete this document from your vault?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            await cancelDocumentNotifications(doc.id);
            deleteDocument(doc.id);
            goBack();
          },
        },
      ],
    );
  };

  const showOptions = () => {
    Alert.alert(
      "Document Options",
      undefined,
      [
        {
          text: "✏️ Edit",
          onPress: () => router.push(`/edit-document/${doc.id}` as never),
        },
        {
          text: "🗑 Delete",
          style: "destructive",
          onPress: handleDelete,
        },
        { text: "Cancel", style: "cancel" },
      ],
      { cancelable: true },
    );
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
          hitSlop={12}
          accessibilityLabel="Go back"
          className="w-10 h-10 items-center justify-center rounded-full active:bg-background"
        >
          <Feather name="arrow-left" size={24} color={colors.primary} />
        </Pressable>
        <Text className="text-h2 text-primary font-bold">Document Details</Text>
        <Pressable
          onPress={showOptions}
          hitSlop={12}
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
                    await scheduleDocumentNotifications(
                      { ...doc, notificationsEnabled: true },
                      notificationSettings.advanceNoticeDays,
                    );
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
            <Pressable
              onPress={handleShare}
              className="flex-row items-center px-4 py-4 border-b border-border/30 active:bg-background"
            >
              <Feather name="share-2" size={20} color={colors.primary} />
              <Text className="text-body-lg text-primary ml-3 font-semibold">
                Share
              </Text>
            </Pressable>

            <Pressable
              onPress={handleDownload}
              className="flex-row items-center px-4 py-4 border-b border-border/30 active:bg-background"
            >
              <Feather name="download" size={20} color={colors.primary} />
              <Text className="text-body-lg text-primary ml-3 font-semibold">
                Download
              </Text>
            </Pressable>

            <Pressable
              onPress={() => toggleFavorite(doc.id)}
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

import React, { useMemo, useState, useEffect } from "react";
import {
  View,
  Text,
  Pressable,
  ScrollView,
  StyleSheet,
  Platform,
  AccessibilityInfo,
} from "react-native";
import { useRouter } from "expo-router";
import { Feather } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useDocumentStore } from "@/store/documentStore";
import { colors } from "@/theme/tokens";
import { formatDate, daysSinceDate } from "@/lib/date";
import EmptyState from "@/components/EmptyState";
import ConfirmationModal from "@/components/ConfirmationModal";
import { ZentraDocument } from "@/types";
import { getFileVisuals } from "@/lib/visuals";
import Swipeable from "react-native-gesture-handler/Swipeable";
import { GestureHandlerRootView } from "react-native-gesture-handler";

export default function RecentlyDeletedScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const {
    documents,
    restoreDocument,
    permanentlyDeleteDocument,
  } = useDocumentStore();

  const [isDeleteForeverModalVisible, setIsDeleteForeverModalVisible] = useState(false);
  const [docToDeleteForever, setDocToDeleteForever] = useState<ZentraDocument | null>(null);
  const [isEmptyTrashModalVisible, setIsEmptyTrashModalVisible] = useState(false);
  const [screenReaderEnabled, setScreenReaderEnabled] = useState(false);

  useEffect(() => {
    let isMounted = true;
    AccessibilityInfo.isScreenReaderEnabled().then((enabled) => {
      if (isMounted) {
        setScreenReaderEnabled(enabled);
      }
    });

    const subscription = AccessibilityInfo.addEventListener(
      "screenReaderChanged",
      (enabled) => {
        if (isMounted) {
          setScreenReaderEnabled(enabled);
        }
      }
    );

    return () => {
      isMounted = false;
      subscription.remove();
    };
  }, []);

  // Filter out soft-deleted documents
  const deletedDocs = useMemo(() => {
    return documents.filter((doc) => doc.isDeleted === true);
  }, [documents]);

  const goBack = () => {
    if (router.canGoBack()) {
      router.back();
      return;
    }
    router.replace("/(tabs)/profile");
  };

  const handleRestore = (id: string, name: string) => {
    restoreDocument(id);
    AccessibilityInfo.announceForAccessibility(`Restored ${name}`);
  };

  const triggerDeleteForever = (doc: ZentraDocument) => {
    setDocToDeleteForever(doc);
    setIsDeleteForeverModalVisible(true);
  };

  const handleConfirmDeleteForever = () => {
    if (!docToDeleteForever) return;
    permanentlyDeleteDocument(docToDeleteForever.id);
    AccessibilityInfo.announceForAccessibility(`Permanently deleted ${docToDeleteForever.name}`);
    setDocToDeleteForever(null);
  };

  const triggerEmptyTrash = () => {
    setIsEmptyTrashModalVisible(true);
  };

  const handleConfirmEmptyTrash = () => {
    deletedDocs.forEach((doc) => {
      permanentlyDeleteDocument(doc.id);
    });
    AccessibilityInfo.announceForAccessibility("Trashed cleared completely");
  };

  const renderSwipeRightActions = (doc: ZentraDocument) => {
    return (
      <View className="flex-row">
        {/* Restore Button */}
        <Pressable
          onPress={() => handleRestore(doc.id, doc.name)}
          className="bg-[#22C55E] items-center justify-center w-20 h-full active:opacity-90"
          accessibilityRole="button"
          accessibilityLabel={`Restore ${doc.name}`}
        >
          <Feather name="refresh-cw" size={20} color="white" />
          <Text className="text-[12px] text-white font-bold font-display mt-1">
            Restore
          </Text>
        </Pressable>

        {/* Delete Forever Button */}
        <Pressable
          onPress={() => triggerDeleteForever(doc)}
          className="bg-danger items-center justify-center w-20 h-full active:opacity-90"
          accessibilityRole="button"
          accessibilityLabel={`Permanently delete ${doc.name}`}
        >
          <Feather name="trash-2" size={20} color="white" />
          <Text className="text-[12px] text-white font-bold font-display mt-1">
            Delete
          </Text>
        </Pressable>
      </View>
    );
  };

  return (
    <GestureHandlerRootView style={{ flex: 1, backgroundColor: colors.background }}>
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
        <View className="flex-row items-center gap-2">
          <Text className="text-h2 text-primary font-bold">Recently Deleted</Text>
          {deletedDocs.length > 0 && (
            <View className="bg-accent rounded-full px-2 py-0.5 justify-center items-center">
              <Text className="text-white text-[11px] font-bold font-display">
                {deletedDocs.length}
              </Text>
            </View>
          )}
        </View>
        <View className="w-10 h-10" />
      </View>

      {deletedDocs.length > 0 ? (
        <View className="flex-1">
          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{
              paddingBottom: 40 + insets.bottom,
            }}
          >
            {/* Info notice bar */}
            <View className="px-6 mt-4 mb-4">
              <View
                className="flex-row items-center p-4 rounded-2xl border"
                style={{ backgroundColor: "#EEF2FF", borderColor: "#EEF2FF" }}
              >
                <Feather name="info" size={18} color={colors.accent} />
                <Text className="text-body-md text-primary ml-3 flex-1 font-medium">
                  Documents are permanently deleted after 30 days.
                </Text>
              </View>
            </View>

            {/* Document list card wrap */}
            <View
              className="mx-6 bg-surface border border-border/40 overflow-hidden rounded-2xl"
              style={styles.listShadow}
            >
              {deletedDocs.map((doc, index) => {
                const { iconName, iconColor, bgColor } = getFileVisuals(doc.fileType);
                const isLast = index === deletedDocs.length - 1;

                // Relative times calculations
                const daysDeleted = doc.deletedAt ? daysSinceDate(doc.deletedAt) : 0;
                const daysRemaining = Math.max(0, 30 - daysDeleted);
                const deletedLabel = `Deleted ${daysDeleted} ${daysDeleted === 1 ? "day" : "days"} ago · Permanent in ${daysRemaining} ${daysRemaining === 1 ? "day" : "days"}`;

                const rowContent = (
                  <View
                    className="flex-row items-center px-4 py-4 bg-surface active:bg-background border-b border-border/40"
                    style={isLast ? { borderBottomWidth: 0 } : undefined}
                  >
                    {/* Icon */}
                    <View
                      className="w-11 h-11 rounded-xl items-center justify-center"
                      style={{ backgroundColor: bgColor }}
                    >
                      <Feather name={iconName} size={22} color={iconColor} />
                    </View>

                    {/* Metadata details */}
                    <View className="flex-1 ml-3 mr-2">
                      <Text
                        numberOfLines={1}
                        className="text-body-lg text-primary font-semibold"
                      >
                        {doc.name}
                      </Text>
                      <Text className="text-caption text-secondary mt-0.5" numberOfLines={1}>
                        Folder: {doc.category} · Expiry: {formatDate(doc.expiryDate)}
                      </Text>
                      <Text className="text-caption text-accent/80 font-medium mt-0.5">
                        {deletedLabel}
                      </Text>
                    </View>

                    {/* Direct buttons on Web/Accessibility for better UX */}
                    {(Platform.OS === "web" || screenReaderEnabled) && (
                      <View className="flex-row gap-2">
                        <Pressable
                          onPress={() => handleRestore(doc.id, doc.name)}
                          accessibilityRole="button"
                          accessibilityLabel={`Restore ${doc.name}`}
                          className="bg-soft-accent px-3 py-1.5 rounded-lg active:opacity-80"
                        >
                          <Text className="text-caption text-accent font-semibold">Restore</Text>
                        </Pressable>
                        <Pressable
                          onPress={() => triggerDeleteForever(doc)}
                          accessibilityRole="button"
                          accessibilityLabel={`Permanently delete ${doc.name}`}
                          className="bg-red-50 px-3 py-1.5 rounded-lg active:opacity-80"
                        >
                          <Text className="text-caption text-danger font-semibold">Delete</Text>
                        </Pressable>
                      </View>
                    )}
                  </View>
                );

                // Render swipable wrapper on native mobile devices
                if (Platform.OS !== "web") {
                  return (
                    <Swipeable
                      key={doc.id}
                      renderRightActions={() => renderSwipeRightActions(doc)}
                      containerStyle={styles.swipeContainer}
                    >
                      {rowContent}
                    </Swipeable>
                  );
                }

                return <React.Fragment key={doc.id}>{rowContent}</React.Fragment>;
              })}
            </View>
          </ScrollView>

          {/* Empty Trash Button at the bottom */}
          <View className="px-6 py-4 bg-surface border-t border-border/20">
            <Pressable
              onPress={triggerEmptyTrash}
              accessibilityRole="button"
              accessibilityLabel="Delete all permanently"
              className="w-full h-[52px] border border-danger rounded-xl items-center justify-center active:bg-danger/5"
            >
              <Text className="text-body-lg text-danger font-semibold font-display">
                Delete All Permanently
              </Text>
            </Pressable>
          </View>
        </View>
      ) : (
        <EmptyState
          icon="trash-outline"
          title="Trash is empty"
          message="Deleted documents appear here for 30 days."
        />
      )}

      {/* Delete Forever Confirmation Modal */}
      <ConfirmationModal
        visible={isDeleteForeverModalVisible}
        onClose={() => {
          setIsDeleteForeverModalVisible(false);
          setDocToDeleteForever(null);
        }}
        onConfirm={handleConfirmDeleteForever}
        title="Delete Permanently"
        message={`This will permanently remove "${docToDeleteForever?.name}" from your device. This cannot be undone.`}
        confirmLabel="Delete Forever"
        isDestructive
      />

      {/* Empty Trash Confirmation Modal */}
      <ConfirmationModal
        visible={isEmptyTrashModalVisible}
        onClose={() => setIsEmptyTrashModalVisible(false)}
        onConfirm={handleConfirmEmptyTrash}
        title="Empty Trash"
        message={`This will permanently delete all ${deletedDocs.length} documents. This cannot be undone.`}
        confirmLabel="Delete All"
        isDestructive
      />
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  listShadow: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 4,
    elevation: 1,
  },
  swipeContainer: {
    backgroundColor: colors.background,
  },
});

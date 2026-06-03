import React, { useState } from "react";
import {
  View,
  Text,
  Pressable,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  Alert,
  Platform,
  Share,
} from "react-native";
import { useRouter } from "expo-router";
import { Feather } from "@expo/vector-icons";
import { colors } from "@/theme/tokens";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useDocumentStore } from "@/store/documentStore";
import Constants from "expo-constants";
import * as FileSystem from "expo-file-system/legacy";
import type * as SharingType from "expo-sharing";
import { requireOptionalNativeModule } from "expo-modules-core";

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

export default function ExportDataScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { documents, folders, notificationSettings } = useDocumentStore();
  const [isExporting, setIsExporting] = useState(false);

  const goBack = () => {
    if (router.canGoBack()) {
      router.back();
      return;
    }
    router.replace("/(tabs)/profile");
  };

  const handleExport = async () => {
    setIsExporting(true);
    try {
      const exportData = {
        exportedAt: new Date().toISOString(),
        appVersion: Constants.expoConfig?.version || "1.0.0",
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
        setIsExporting(false);
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
      console.error("Export failed:", error);
      Alert.alert("Export Failed", "An error occurred while generating or sharing your backup.");
    } finally {
      setIsExporting(false);
    }
  };

  const totalDocs = documents.length;
  const totalFolders = folders.length;

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      {/* Navigation Header */}
      <View
        className="px-6 pb-2 flex-row items-center justify-between"
        style={{ paddingTop: insets.top > 0 ? insets.top : 16 }}
      >
        <Pressable
          onPress={goBack}
          hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
          accessibilityRole="button"
          accessibilityLabel="Go back"
          className="w-10 h-10 items-center justify-center rounded-full active:bg-surface/50"
        >
          <Feather name="arrow-left" size={24} color={colors.primary} />
        </Pressable>
        <Text className="text-h2 text-primary font-bold text-center flex-1 font-display">
          Export Data
        </Text>
        <View className="w-10 h-10" />
      </View>

      <ScrollView
        contentContainerStyle={{ flexGrow: 1, paddingBottom: insets.bottom + 24 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Info Card */}
        <View className="px-6 mt-4">
          <View
            className="bg-surface rounded-2xl p-6 items-center border border-border/40"
            style={styles.cardShadow}
          >
            <View 
              className="w-16 h-16 rounded-full items-center justify-center mb-4"
              style={{ backgroundColor: colors.softAccent }}
            >
              <Feather name="shield" size={32} color={colors.accent} />
            </View>
            <Text className="text-h2 text-primary font-bold text-center font-display">
              Your data, your backup
            </Text>
            <Text className="text-body-md text-secondary text-center mt-2 leading-5">
              Export a JSON file containing all your document names, categories, and expiry dates. Attached files are not included — only metadata.
            </Text>
          </View>
        </View>

        {/* What's Included Card */}
        <View className="px-6 mt-4">
          <View
            className="bg-surface rounded-2xl border border-border/40 p-5"
            style={styles.cardShadow}
          >
            <Text className="text-body-sm text-secondary font-semibold uppercase tracking-wider mb-4">
              What{"'"}s Included
            </Text>

            <View className="gap-3">
              <View className="flex-row items-center">
                <Feather name="check-circle" size={18} color={colors.success} />
                <Text className="text-body-md text-primary ml-3 font-medium">
                  Document names
                </Text>
              </View>
              <View className="flex-row items-center">
                <Feather name="check-circle" size={18} color={colors.success} />
                <Text className="text-body-md text-primary ml-3 font-medium">
                  Categories & expiry dates
                </Text>
              </View>
              <View className="flex-row items-center">
                <Feather name="check-circle" size={18} color={colors.success} />
                <Text className="text-body-md text-primary ml-3 font-medium">
                  Notes
                </Text>
              </View>
              <View className="flex-row items-center">
                <Feather name="check-circle" size={18} color={colors.success} />
                <Text className="text-body-md text-primary ml-3 font-medium">
                  Notification settings
                </Text>
              </View>
              <View className="flex-row items-center">
                <Feather name="x-circle" size={18} color={colors.danger} />
                <Text className="text-body-md text-secondary ml-3 font-medium">
                  Attached files (stored locally only)
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* Export summary & CTA button at the bottom */}
        <View className="flex-1 justify-end px-6 mt-8">
          <View className="items-center mb-4">
            <Text className="text-body-md text-secondary font-medium">
              {totalDocs} {totalDocs === 1 ? "document" : "documents"} · {totalFolders} {totalFolders === 1 ? "collection" : "collections"}
            </Text>
          </View>

          <Pressable
            onPress={handleExport}
            disabled={isExporting}
            accessibilityRole="button"
            accessibilityLabel="Export as JSON"
            className="w-full bg-accent h-[52px] rounded-xl items-center justify-center active:opacity-90 flex-row gap-2"
          >
            {isExporting ? (
              <ActivityIndicator color="#FFFFFF" size="small" />
            ) : (
              <>
                <Feather name="download" size={18} color="#FFFFFF" />
                <Text className="text-body-lg text-white font-semibold font-display">
                  Export as JSON
                </Text>
              </>
            )}
          </Pressable>
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
});

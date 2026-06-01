import AddDocumentForm from "@/components/AddDocumentForm";
import EmptyState from "@/components/EmptyState";
import {
  cancelDocumentNotifications,
  scheduleDocumentNotifications,
} from "@/lib/notifications";
import { useDocumentStore } from "@/store/documentStore";
import { colors } from "@/theme/tokens";
import { ZentraDocument } from "@/types";
import { Feather } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import React from "react";
import { AccessibilityInfo, KeyboardAvoidingView, Platform, Pressable, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { saveFilePermanently } from "@/lib/share";
import * as FileSystem from "expo-file-system/legacy";

export default function EditDocumentScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { documents, folders, updateDocument, notificationSettings } = useDocumentStore();

  const doc = documents.find((d) => d.id === id);

  const goBack = () => {
    if (router.canGoBack()) {
      router.back();
      return;
    }
    router.replace("/(tabs)");
  };

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

  const handleFormSubmit = async (updatedDoc: ZentraDocument) => {
    // 1. Save file permanently if there is a new attachment
    if (updatedDoc.localUri && updatedDoc.localUri !== doc.localUri) {
      const permanentUri = await saveFilePermanently(updatedDoc.localUri, updatedDoc.name);
      if (permanentUri) {
        updatedDoc.localUri = permanentUri;
      }
    }

    // 2. Clean up old file if it was replaced or removed
    if (doc.localUri && doc.localUri !== updatedDoc.localUri) {
      const permanentDirectory = FileSystem.documentDirectory;
      if (permanentDirectory && doc.localUri.startsWith(permanentDirectory)) {
        try {
          await FileSystem.deleteAsync(doc.localUri, { idempotent: true });
          console.log("[EditDocument] Deleted old permanent file:", doc.localUri);
        } catch (e) {
          console.warn("Failed to delete old local file:", e);
        }
      }
    }

    // 3. Update the document details in the global state
    updateDocument(doc.id, updatedDoc);
    AccessibilityInfo.announceForAccessibility("Document saved");

    // 2. Manage device alerts coordination
    if (updatedDoc.notificationsEnabled && notificationSettings.globalEnabled) {
      try {
        await scheduleDocumentNotifications(
          updatedDoc,
          notificationSettings.advanceNoticeDays,
        );
      } catch (err) {
        console.error("Failed to reschedule document notifications:", err);
      }
    } else {
      try {
        await cancelDocumentNotifications(doc.id);
      } catch (err) {
        console.error("Failed to cancel document notifications:", err);
      }
    }

    // 3. Navigate back to details screen
    goBack();
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      className="flex-1"
      style={{ backgroundColor: colors.background }}
    >
      <View
        className="flex-row justify-between items-center px-6 pb-4 bg-surface border-b border-border/20"
        style={{ paddingTop: insets.top > 0 ? insets.top : 16 }}
      >
        <Text className="text-h1 text-primary font-bold">Edit Document</Text>
        <Pressable
          onPress={goBack}
          hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
          accessibilityRole="button"
          accessibilityLabel="Close edit document modal"
          className="w-10 h-10 items-center justify-center rounded-full active:bg-background"
        >
          <Feather name="x" size={24} color={colors.primary} />
        </Pressable>
      </View>

      <View className="flex-1 pt-2">
        <AddDocumentForm
          onSubmit={handleFormSubmit}
          onCancel={goBack}
          initialValues={doc}
          folders={folders}
        />
      </View>
    </KeyboardAvoidingView>
  );
}

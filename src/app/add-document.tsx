import React from "react";
import { View, Text, Pressable, KeyboardAvoidingView, Platform } from "react-native";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import { useDocumentStore } from "@/store/documentStore";
import { scheduleDocumentNotifications } from "@/lib/notifications";
import AddDocumentForm from "@/components/AddDocumentForm";
import { colors } from "@/theme/tokens";
import { ZentraDocument } from "@/types";

export default function AddDocumentScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { addDocument, notificationSettings } = useDocumentStore();

  const handleFormSubmit = async (newDoc: ZentraDocument) => {
    // 1. Persist the document in the local store
    addDocument(newDoc);

    // 2. Schedule notifications on the device if enabled
    if (newDoc.notificationsEnabled && notificationSettings.globalEnabled) {
      try {
        await scheduleDocumentNotifications(
          newDoc,
          notificationSettings.advanceNoticeDays
        );
      } catch (err) {
        console.error("Failed to schedule document notifications:", err);
      }
    }

    // 3. Navigate back to previous screen
    router.back();
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
        <Text className="text-h1 text-primary font-bold">Add Document</Text>
        <Pressable
          onPress={() => router.back()}
          hitSlop={12}
          accessibilityRole="button"
          accessibilityLabel="Close add document modal"
          className="w-10 h-10 items-center justify-center rounded-full active:bg-background"
        >
          <Feather name="x" size={24} color={colors.primary} />
        </Pressable>
      </View>

      <View className="flex-1 px-6 pt-5">
        <AddDocumentForm onSubmit={handleFormSubmit} onCancel={() => router.back()} />
      </View>
    </KeyboardAvoidingView>
  );
}

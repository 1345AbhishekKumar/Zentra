import { colors } from "@/theme/tokens";
import { Ionicons } from "@expo/vector-icons";
import React from "react";
import { Pressable, Text, View, Platform, Alert } from "react-native";

interface ErrorScreenProps {
  error: Error | null;
  onReset: () => void;
}

export default function ErrorScreen({ error, onReset }: ErrorScreenProps) {
  const handleRestart = async () => {
    let isUpdatesAvailable = false;
    if (Platform.OS !== "web") {
      try {
        const { requireOptionalNativeModule } = require("expo-modules-core");
        isUpdatesAvailable = !!requireOptionalNativeModule("ExpoUpdates");
      } catch {
        isUpdatesAvailable = false;
      }
    }

    if (isUpdatesAvailable) {
      try {
        const Updates = require("expo-updates");
        await Updates.reloadAsync();
      } catch (e) {
        console.error("Failed to reload app via Updates.reloadAsync:", e);
        Alert.alert(
          "Restart Failed",
          "Could not restart the app automatically. Please restart it manually."
        );
      }
    } else {
      Alert.alert(
        "Restart Unsupported",
        "App restart is not supported in this environment. Please close and reopen the app manually."
      );
    }
  };

  return (
    <View
      className="flex-1 justify-center items-center px-6"
      style={{ backgroundColor: colors.background }}
    >
      <View
        className="w-20 h-20 rounded-full items-center justify-center mb-6"
        style={{ backgroundColor: colors.softAccent }}
      >
        <Ionicons name="warning" size={48} color={colors.warning} />
      </View>

      <Text className="text-h1 text-primary text-center font-bold font-display mb-2">
        Something went wrong
      </Text>

      <Text className="text-body-md text-secondary text-center px-6 mb-6 leading-5">
        Zentra ran into an unexpected error. Your data is safe.
      </Text>

      {__DEV__ && error?.message && (
        <View className="w-full bg-surface border border-border rounded-xl p-4 mb-6">
          <Text className="text-caption text-secondary font-mono text-left leading-4">
            {error.message}
          </Text>
        </View>
      )}

      <View className="w-full gap-3">
        <Pressable
          onPress={onReset}
          accessibilityRole="button"
          className="bg-accent h-[52px] rounded-xl items-center justify-center active:opacity-95 px-6"
        >
          <Text className="text-button text-white font-semibold">
            Try Again
          </Text>
        </Pressable>

        <Pressable
          onPress={handleRestart}
          accessibilityRole="button"
          className="h-[52px] border border-border rounded-xl items-center justify-center bg-surface active:bg-background px-6"
        >
          <Text className="text-button text-secondary font-semibold">
            Restart App
          </Text>
        </Pressable>
      </View>
    </View>
  );
}

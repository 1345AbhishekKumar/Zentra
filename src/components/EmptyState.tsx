import { colors } from "@/theme/tokens";
import { Ionicons } from "@expo/vector-icons";
import React from "react";
import { Pressable, Text, View } from "react-native";

interface EmptyStateProps {
  icon: React.ComponentProps<typeof Ionicons>["name"];
  title: string;
  message: string;
  actionLabel?: string;
  onAction?: () => void;
}

export default function EmptyState({
  icon,
  title,
  message,
  actionLabel,
  onAction,
}: EmptyStateProps) {
  return (
    <View className="flex-1 items-center justify-center py-16 px-6">
      <View
        className="w-20 h-20 rounded-full items-center justify-center mb-6"
        style={{ backgroundColor: colors.softAccent }}
      >
        <Ionicons name={icon} size={48} color={colors.accent} />
      </View>
      <Text className="text-h2 text-primary text-center font-bold">{title}</Text>
      <Text className="text-body-md text-secondary text-center mt-2 px-6 leading-5">
        {message}
      </Text>
      {actionLabel && onAction && (
        <Pressable
          onPress={onAction}
          accessibilityRole="button"
          className="bg-accent px-6 py-3 rounded-xl active:opacity-90 mt-6"
        >
          <Text className="text-button text-white font-semibold">
            {actionLabel}
          </Text>
        </Pressable>
      )}
    </View>
  );
}

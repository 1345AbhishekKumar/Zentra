import React from "react";
import { View, Text, StyleSheet } from "react-native";

interface ProfileMenuSectionProps {
  title: string;
  children: React.ReactNode;
}

export default function ProfileMenuSection({ title, children }: ProfileMenuSectionProps) {
  return (
    <View className="mt-4">
      <View className="px-6 pt-5 pb-2">
        <Text className="text-body-sm text-secondary font-semibold uppercase tracking-wider">
          {title}
        </Text>
      </View>
      <View className="px-6 mt-1">
        <View
          className="bg-surface rounded-2xl border border-border/40 overflow-hidden"
          style={styles.cardShadow}
        >
          {children}
        </View>
      </View>
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

import React from "react";
import { View, Text, Pressable, StyleSheet } from "react-native";
import { useUser } from "@clerk/expo";
import { Feather } from "@expo/vector-icons";
import { useDocumentStore } from "@/store/documentStore";
import { colors } from "@/theme/tokens";

export default function DashboardHeader() {
  const { user } = useUser();
  const upcomingCount = useDocumentStore(
    (state) => state.upcomingExpirations.length
  );

  const displayName = user?.firstName || "User";

  return (
    <View className="w-full flex-col pt-3 pb-5">
      {/* Top row: Brand name + Bell */}
      <View className="w-full flex-row justify-between items-center">
        <Text
          className="text-h1 text-accent"
          accessibilityRole="header"
        >
          Zentra
        </Text>

        <Pressable
          className="relative w-11 h-11 rounded-full items-center justify-center active:bg-soft-accent"
          accessibilityLabel={`Notifications${upcomingCount > 0 ? `, ${upcomingCount} upcoming` : ""}`}
          accessibilityRole="button"
        >
          <Feather name="bell" size={24} color={colors.primary} />
          {upcomingCount > 0 && (
            <View
              className="absolute top-0.5 right-0.5 bg-accent rounded-full items-center justify-center border-2 border-white"
              style={styles.badge}
            >
              <Text
                className="text-white font-bold text-center"
                style={styles.badgeText}
              >
                {upcomingCount > 9 ? "9+" : upcomingCount}
              </Text>
            </View>
          )}
        </Pressable>
      </View>

      {/* Greeting */}
      <View className="mt-3">
        <Text className="text-h1 text-primary" style={styles.greeting}>
          Hello, {displayName}
        </Text>
        <Text className="text-body-md text-secondary mt-1">
          Good to see you again!
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  greeting: {
    fontSize: 26,
    lineHeight: 32,
    letterSpacing: -0.4,
  },
  badge: {
    minWidth: 20,
    height: 20,
    paddingHorizontal: 4,
  },
  badgeText: {
    fontSize: 10,
    lineHeight: 12,
  },
});

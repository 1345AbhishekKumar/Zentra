import React from "react";
import { View, Text, Pressable, StyleSheet } from "react-native";
import { useUser } from "@clerk/expo";
import { Feather } from "@expo/vector-icons";
import { useDocumentStore } from "@/store/documentStore";
import { colors } from "@/theme/tokens";
import { useRouter } from "expo-router";
import { expiryUrgency } from "@/lib/date";

export default function DashboardHeader() {
  const { user } = useUser();
  const router = useRouter();
  const documents = useDocumentStore((state) => state.documents);
  const readAlerts = useDocumentStore((state) => state.readAlerts || []);

  const hasExpiredOrCritical = React.useMemo(() => {
    return documents.some((doc) => {
      if (doc.isDeleted) return false;
      const urgency = expiryUrgency(doc.expiryDate);
      const isUnread = !readAlerts.includes(doc.id);
      return (urgency === "expired" || urgency === "critical") && isUnread;
    });
  }, [documents, readAlerts]);

  const displayName = user?.firstName || "User";

  return (
    <View className="w-full flex-col pt-6 pb-5">
      {/* Top row: Brand name + Bell */}
      <View className="w-full flex-row justify-between items-center">
        <Text
          className="text-h1 text-accent"
          accessibilityRole="header"
        >
          Zentra
        </Text>

        <Pressable
          onPress={() => router.push("/alerts")}
          className="relative w-11 h-11 rounded-full items-center justify-center active:bg-soft-accent"
          accessibilityLabel="Open expiry alerts"
          accessibilityRole="button"
        >
          <Feather name="bell" size={24} color={colors.primary} />
          {hasExpiredOrCritical && (
            <View
              className="absolute top-1 right-1 w-3 h-3 bg-danger rounded-full border border-white"
            />
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
});

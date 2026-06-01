import React, { useMemo } from "react";
import { View, Text, Pressable, ScrollView, StyleSheet } from "react-native";
import { useRouter } from "expo-router";
import { Feather } from "@expo/vector-icons";
import { colors } from "@/theme/tokens";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useDocumentStore } from "@/store/documentStore";
import { daysUntilExpiry, formatDate, expiryUrgency, sortByExpiry } from "@/lib/date";
import ExpiryBadge from "@/components/ExpiryBadge";
import EmptyState from "@/components/EmptyState";
import { ZentraDocument } from "@/types";

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

export default function AlertsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const {
    documents,
    readAlerts = [],
    markAlertAsRead,
    markAllAlertsAsRead,
  } = useDocumentStore();

  // Memoize Set for fast O(1) lookups
  const readAlertsSet = useMemo(() => new Set(readAlerts), [readAlerts]);

  const goBack = () => {
    if (router.canGoBack()) {
      router.back();
      return;
    }
    router.replace("/(tabs)");
  };

  // Grouping documents based on expiry time limits
  const expiredDocs = sortByExpiry(
    documents.filter((doc) => daysUntilExpiry(doc.expiryDate) < 0)
  );
  
  const thisWeekDocs = sortByExpiry(
    documents.filter((doc) => {
      const days = daysUntilExpiry(doc.expiryDate);
      return days >= 0 && days <= 7;
    })
  );

  const thisMonthDocs = sortByExpiry(
    documents.filter((doc) => {
      const days = daysUntilExpiry(doc.expiryDate);
      return days >= 8 && days <= 30;
    })
  );

  const next3MonthsDocs = sortByExpiry(
    documents.filter((doc) => {
      const days = daysUntilExpiry(doc.expiryDate);
      return days >= 31 && days <= 90;
    })
  );

  const allListedDocs = [
    ...expiredDocs,
    ...thisWeekDocs,
    ...thisMonthDocs,
    ...next3MonthsDocs,
  ];

  const totalAlertsCount = allListedDocs.length;
  const hasUnread = allListedDocs.some((doc) => !readAlertsSet.has(doc.id));

  // Compute stat counts using the same bucketing logic as the list sections
  const expiredCount = expiredDocs.length;
  const criticalCount = thisWeekDocs.length;
  const warningCount = thisMonthDocs.length;

  const handlePressRow = (docId: string) => {
    markAlertAsRead(docId);
    router.push({
      pathname: "/document/[id]",
      params: { id: docId },
    } as never);
  };

  const handleMarkAllRead = () => {
    const allIds = allListedDocs.map((doc) => doc.id);
    markAllAlertsAsRead(allIds);
  };

  const renderSection = (title: string, docs: ZentraDocument[]) => {
    if (docs.length === 0) return null;
    return (
      <View className="mb-6">
        <Text className="text-h2 font-bold text-primary mb-3">
          {title} ({docs.length})
        </Text>
        <View className="gap-2.5">
          {docs.map((doc) => {
            const { iconName, iconColor, bgColor } = getFileVisuals(doc.fileType);
            const isUnread = !readAlertsSet.has(doc.id);
            return (
              <Pressable
                key={doc.id}
                onPress={() => handlePressRow(doc.id)}
                accessibilityRole="button"
                accessibilityLabel={`Document ${doc.name}. Expiry state: ${isUnread ? "Unread" : "Read"}`}
                className="flex-row items-center px-4 py-3.5 bg-surface border border-border/50 rounded-2xl active:opacity-90"
                style={({ pressed }) => [
                  styles.rowShadow,
                  pressed && styles.pressedScale,
                ]}
              >
                {/* Unread indicator dot */}
                {isUnread && (
                  <View className="w-2.5 h-2.5 rounded-full bg-accent mr-3" />
                )}

                {/* File Icon */}
                <View
                  className="w-11 h-11 rounded-xl items-center justify-center"
                  style={{ backgroundColor: bgColor }}
                >
                  <Feather name={iconName} size={20} color={iconColor} />
                </View>

                {/* Name & Expiry Date */}
                <View className="flex-1 ml-3 mr-2">
                  <Text
                    numberOfLines={1}
                    className="text-body-lg text-primary font-bold"
                  >
                    {doc.name}
                  </Text>
                  <Text className="text-caption text-secondary mt-0.5">
                    Expires {formatDate(doc.expiryDate)}
                  </Text>
                </View>

                {/* Expiry Badge */}
                <ExpiryBadge expiryDate={doc.expiryDate} />
              </Pressable>
            );
          })}
        </View>
      </View>
    );
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      {/* Navigation Header */}
      <View
        className="flex-row justify-between items-center px-6 pb-4 bg-surface border-b border-border/30"
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

        <Text className="text-h2 text-primary font-bold">Expiry Alerts</Text>

        <Pressable
          onPress={handleMarkAllRead}
          disabled={!hasUnread || totalAlertsCount === 0}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          accessibilityRole="button"
          accessibilityLabel="Mark all alerts as read"
          className={hasUnread && totalAlertsCount > 0 ? "active:opacity-70" : "opacity-40"}
        >
          <Text className="text-body-md text-accent font-semibold">
            Mark all read
          </Text>
        </Pressable>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 24, paddingTop: 20, paddingBottom: 40 }}
      >
        {/* Summary Bar (3 stat pills in a row) */}
        <View className="flex-row gap-3 mb-6">
          {/* Expired Pill */}
          <View
            className="flex-1 bg-surface border border-border/50 rounded-2xl p-3 items-center justify-center"
            style={styles.rowShadow}
          >
            <View className="flex-row items-center gap-1.5 mb-1">
              <View className="w-2 h-2 rounded-full" style={{ backgroundColor: colors.danger }} />
              <Text className="text-caption text-secondary">Expired</Text>
            </View>
            <Text className="text-h1 font-bold text-primary">{expiredCount}</Text>
          </View>

          {/* Critical Pill */}
          <View
            className="flex-1 bg-surface border border-border/50 rounded-2xl p-3 items-center justify-center"
            style={styles.rowShadow}
          >
            <View className="flex-row items-center gap-1.5 mb-1">
              <View className="w-2 h-2 rounded-full" style={{ backgroundColor: "#F97316" }} />
              <Text className="text-caption text-secondary">Critical</Text>
            </View>
            <Text className="text-h1 font-bold text-primary">{criticalCount}</Text>
          </View>

          {/* Warning Pill */}
          <View
            className="flex-1 bg-surface border border-border/50 rounded-2xl p-3 items-center justify-center"
            style={styles.rowShadow}
          >
            <View className="flex-row items-center gap-1.5 mb-1">
              <View className="w-2 h-2 rounded-full" style={{ backgroundColor: colors.warning }} />
              <Text className="text-caption text-secondary">Warning</Text>
            </View>
            <Text className="text-h1 font-bold text-primary">{warningCount}</Text>
          </View>
        </View>

        {/* Grouped list of alerts or empty state */}
        {totalAlertsCount === 0 ? (
          <EmptyState
            icon="checkmark-circle-outline"
            title="All clear!"
            message="No documents expiring in the next 90 days"
          />
        ) : (
          <>
            {renderSection("Expired", expiredDocs)}
            {renderSection("This Week", thisWeekDocs)}
            {renderSection("This Month", thisMonthDocs)}
            {renderSection("Next 3 Months", next3MonthsDocs)}
          </>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  rowShadow: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 3,
    elevation: 1,
  },
  pressedScale: {
    transform: [{ scale: 0.98 }],
  },
});

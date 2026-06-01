import DashboardHeader from "@/components/DashboardHeader";
import EmptyState from "@/components/EmptyState";
import { formatDate } from "@/lib/date";
import { useDocumentStore } from "@/store/documentStore";
import { colors } from "@/theme/tokens";
import { ZentraDocument } from "@/types";
import { Feather } from "@expo/vector-icons";
import { isToday, isYesterday, parseISO } from "date-fns";
import { useRouter } from "expo-router";
import React, { useMemo, useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";

// ---------------------------------------------------------------------------
// Icon/color mapping by document name, then file type, then category
// ---------------------------------------------------------------------------
type FeatherIcon = React.ComponentProps<typeof Feather>["name"];

interface DocVisuals {
  iconName: FeatherIcon;
  iconColor: string;
  bgColor: string;
}

const NAME_RULES: { match: string; visuals: DocVisuals }[] = [
  {
    match: "passport",
    visuals: {
      iconName: "globe",
      iconColor: colors.accent,
      bgColor: "#EEF2FF",
    },
  },
  {
    match: "insurance",
    visuals: {
      iconName: "shield",
      iconColor: colors.accent,
      bgColor: "#EEF2FF",
    },
  },
  {
    match: "certificate",
    visuals: { iconName: "award", iconColor: "#7C3AED", bgColor: "#F5F3FF" },
  },
  {
    match: "license",
    visuals: {
      iconName: "credit-card",
      iconColor: "#3B82F6",
      bgColor: "#EFF6FF",
    },
  },
  {
    match: "driving",
    visuals: {
      iconName: "credit-card",
      iconColor: "#3B82F6",
      bgColor: "#EFF6FF",
    },
  },
];

function getDocVisuals(
  name: string,
  _category: string,
  fileType: string,
): DocVisuals {
  const lower = name.toLowerCase();
  for (const rule of NAME_RULES) {
    if (lower.includes(rule.match)) return rule.visuals;
  }
  if (fileType === "pdf")
    return {
      iconName: "file-text",
      iconColor: colors.danger,
      bgColor: "#FEF2F2",
    };
  if (fileType === "image")
    return { iconName: "image", iconColor: colors.success, bgColor: "#F0FDF4" };
  if (_category === "Finance")
    return {
      iconName: "dollar-sign",
      iconColor: "#10B981",
      bgColor: "#ECFDF5",
    };
  return { iconName: "file", iconColor: colors.secondary, bgColor: "#F5F5F5" };
}

// ---------------------------------------------------------------------------
// Date formatting
// ---------------------------------------------------------------------------
function formatAddedDate(dateStr: string): string {
  try {
    const date = parseISO(dateStr);
    if (isToday(date)) return "Today";
    if (isYesterday(date)) return "Yesterday";
    return formatDate(dateStr);
  } catch {
    return "Recent";
  }
}

// ---------------------------------------------------------------------------
// Quick Access Card
// ---------------------------------------------------------------------------
function QuickAccessCard({
  doc,
  onPress,
}: {
  doc: ZentraDocument;
  onPress: () => void;
}) {
  const { iconName, iconColor, bgColor } = getDocVisuals(
    doc.name,
    doc.category,
    doc.fileType,
  );
  const label = doc.name.replace(/\.[^/.]+$/, "");
  const meta = `${doc.fileType.toUpperCase()} • ${doc.sizeLabel || "1.0 MB"}`;

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`Open ${doc.name}`}
      className="bg-surface rounded-2xl p-4 mr-3 active:opacity-90"
      style={({ pressed }) => [
        styles.quickCard,
        pressed && styles.pressedScale,
      ]}
    >
      <View
        className="w-11 h-11 rounded-full items-center justify-center mb-3"
        style={{ backgroundColor: bgColor }}
      >
        <Feather name={iconName} size={20} color={iconColor} />
      </View>
      <Text numberOfLines={1} className="text-body-lg text-primary">
        {label}
      </Text>
      <Text className="text-caption text-secondary mt-1">{meta}</Text>
    </Pressable>
  );
}

// ---------------------------------------------------------------------------
// Recent Document Row
// ---------------------------------------------------------------------------
function RecentDocRow({
  doc,
  isLast,
  onPress,
}: {
  doc: ZentraDocument;
  isLast: boolean;
  onPress: () => void;
}) {
  const { iconName, iconColor, bgColor } = getDocVisuals(
    doc.name,
    doc.category,
    doc.fileType,
  );
  const meta = `${formatAddedDate(doc.createdAt)} • ${doc.sizeLabel || "1.0 MB"}`;

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`Open ${doc.name}`}
      className="flex-row items-center px-4 py-3 active:bg-background"
      style={!isLast ? styles.rowBorder : undefined}
    >
      <View
        className="w-11 h-11 rounded-xl items-center justify-center"
        style={{ backgroundColor: bgColor }}
      >
        <Feather name={iconName} size={20} color={iconColor} />
      </View>

      <View className="flex-1 ml-3 mr-2">
        <Text numberOfLines={1} className="text-body-lg text-primary">
          {doc.name}
        </Text>
        <Text className="text-caption text-secondary mt-0.5">{meta}</Text>
      </View>

      <Pressable
        onPress={() => {}}
        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        accessibilityRole="button"
        accessibilityLabel={`More options for ${doc.name}`}
        className="w-9 h-9 rounded-full items-center justify-center active:bg-soft-accent"
      >
        <Feather name="more-horizontal" size={20} color={colors.secondary} />
      </Pressable>
    </Pressable>
  );
}

// ---------------------------------------------------------------------------
// Home Screen
// ---------------------------------------------------------------------------
export default function HomeScreen() {
  const router = useRouter();
  const { documents, addDocument } = useDocumentStore();

  const sorted = useMemo(() => {
    return [...documents].sort((a, b) =>
      b.createdAt.localeCompare(a.createdAt),
    );
  }, [documents]);

  const recentDocs = useMemo(() => {
    return sorted.slice(0, 4);
  }, [sorted]);

  const quickAccessDocs = useMemo(() => {
    return sorted
      .filter(
        (doc) =>
          doc.isFavorite && !recentDocs.some((recent) => recent.id === doc.id),
      )
      .slice(0, 4);
  }, [sorted, recentDocs]);

  const canSeedDemo = __DEV__;

  // Seed demo data for verification
  const seedDemoData = React.useCallback(() => {
    if (!canSeedDemo) return;
    const now = Date.now();
    const day = 24 * 60 * 60 * 1000;
    const mocks: ZentraDocument[] = [
      {
        id: "demo-1",
        name: "Driving License.pdf",
        category: "Other",
        fileType: "pdf",
        sizeLabel: "2.4 MB",
        expiryDate: "2027-05-15",
        createdAt: new Date(now).toISOString(),
        updatedAt: new Date(now).toISOString(),
        notificationsEnabled: true,
        isFavorite: false,
      },
      {
        id: "demo-2",
        name: "Tax Return 2024.pdf",
        category: "Finance",
        fileType: "pdf",
        sizeLabel: "1.8 MB",
        expiryDate: "2026-10-31",
        createdAt: new Date(now - day).toISOString(),
        updatedAt: new Date(now - day).toISOString(),
        notificationsEnabled: true,
        isFavorite: false,
      },
      {
        id: "demo-3",
        name: "Bank Statement.pdf",
        category: "Finance",
        fileType: "pdf",
        sizeLabel: "2.1 MB",
        expiryDate: "2026-08-20",
        createdAt: new Date(now - 18 * day).toISOString(),
        updatedAt: new Date(now - 18 * day).toISOString(),
        notificationsEnabled: true,
        isFavorite: false,
      },
      {
        id: "demo-4",
        name: "Adhaar Card.png",
        category: "Personal",
        fileType: "image",
        sizeLabel: "1.3 MB",
        expiryDate: "2031-12-31",
        createdAt: new Date(now - 20 * day).toISOString(),
        updatedAt: new Date(now - 20 * day).toISOString(),
        notificationsEnabled: true,
        isFavorite: false,
      },
      {
        id: "demo-5",
        name: "Passport.pdf",
        category: "Personal",
        fileType: "pdf",
        sizeLabel: "2.4 MB",
        expiryDate: "2032-04-12",
        createdAt: new Date(now - 23 * day).toISOString(),
        updatedAt: new Date(now - 23 * day).toISOString(),
        notificationsEnabled: true,
        isFavorite: false,
      },
      {
        id: "demo-6",
        name: "Insurance.pdf",
        category: "Finance",
        fileType: "pdf",
        sizeLabel: "1.8 MB",
        expiryDate: "2026-11-20",
        createdAt: new Date(now - 22 * day).toISOString(),
        updatedAt: new Date(now - 22 * day).toISOString(),
        notificationsEnabled: true,
        isFavorite: false,
      },
      {
        id: "demo-7",
        name: "Certificates.pdf",
        category: "Work",
        fileType: "pdf",
        sizeLabel: "1.2 MB",
        expiryDate: "2028-09-10",
        createdAt: new Date(now - 21 * day).toISOString(),
        updatedAt: new Date(now - 21 * day).toISOString(),
        notificationsEnabled: true,
        isFavorite: false,
      },
    ];

    mocks.forEach((m) => {
      if (!documents.some((d) => d.id === m.id)) addDocument(m);
    });
  }, [canSeedDemo, documents, addDocument]);

  // ------------------------------------------------------------------
  // Render
  // ------------------------------------------------------------------
  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <View className="flex-1 relative">
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 100 }}
        >
          {/* Header */}
          <View className="px-6">
            <DashboardHeader />
          </View>

          {/* Search bar */}
          <Pressable
            onPress={() => router.push("/search" as any)}
            accessibilityRole="button"
            accessibilityLabel="Search documents"
            className="px-6 mb-6 active:opacity-90"
            style={({ pressed }) => [pressed && styles.pressedScale]}
          >
            <View className="flex-row items-center bg-surface rounded-full border border-border pl-4 pr-1.5 py-1.5 h-12">
              <Feather name="search" size={18} color={colors.secondary} />
              <Text className="flex-1 text-body-md text-secondary ml-3">
                Search documents...
              </Text>
              <View
                className="w-9 h-9 rounded-xl bg-accent items-center justify-center"
                style={styles.searchBtnShadow}
              >
                <Feather name="search" size={15} color="#FFFFFF" />
              </View>
            </View>
          </Pressable>

          {documents.length === 0 ? (
            // ---------------------------------------------------------------
            // Empty state
            // ---------------------------------------------------------------
            <View className="px-6 pb-12">
              <EmptyState
                icon="document-text-outline"
                title="No documents yet"
                message="Add your first document to get started"
                actionLabel="Add Document"
                onAction={() => router.push("/add-document" as never)}
              />
              {canSeedDemo && (
                <View className="px-6 -mt-2">
                  <Pressable
                    onPress={seedDemoData}
                    accessibilityRole="button"
                    className="w-full h-[52px] bg-surface border border-border rounded-xl items-center justify-center active:bg-background"
                    style={({ pressed }) => [pressed && styles.pressedScale]}
                  >
                    <Text className="text-button text-accent font-semibold">
                      Load Demo Documents
                    </Text>
                  </Pressable>
                </View>
              )}
            </View>
          ) : (
            // ---------------------------------------------------------------
            // Dashboard content
            // ---------------------------------------------------------------
            <>
              {/* Quick Access */}
              {quickAccessDocs.length > 0 && (
                <View className="mb-8">
                  <View className="flex-row justify-between items-center px-6 mb-4">
                    <Text className="text-h2 text-primary font-semibold">Quick Access</Text>
                    <Pressable
                      onPress={() => router.navigate("/(tabs)/documents")}
                      accessibilityRole="button"
                      hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                      className="active:opacity-70"
                    >
                      <Text className="text-body-md text-accent font-semibold">
                        See all
                      </Text>
                    </Pressable>
                  </View>

                  <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={{ paddingHorizontal: 24 }}
                  >
                    {quickAccessDocs.map((doc) => (
                      <QuickAccessCard
                        key={doc.id}
                        doc={doc}
                        onPress={() =>
                          router.push({
                            pathname: "/document/[id]",
                            params: { id: doc.id },
                          } as never)
                        }
                      />
                    ))}
                  </ScrollView>
                </View>
              )}

              {/* Recent Documents */}
              <View className="px-6 mb-6">
                <Text className="text-h2 text-primary mb-4 font-semibold">
                  Recent Documents
                </Text>

                <View
                  className="bg-surface rounded-2xl overflow-hidden"
                  style={styles.recentCard}
                >
                  {recentDocs.map((doc, i) => (
                    <RecentDocRow
                      key={doc.id}
                      doc={doc}
                      isLast={i === recentDocs.length - 1}
                      onPress={() =>
                        router.push({
                          pathname: "/document/[id]",
                          params: { id: doc.id },
                        } as never)
                      }
                    />
                  ))}
                </View>
              </View>
            </>
          )}
        </ScrollView>

        {/* FAB */}
        <View className="absolute bottom-5 right-6" style={styles.fabWrap}>
          <Pressable
            onPress={() => router.push("/add-document" as never)}
            accessibilityRole="button"
            accessibilityLabel="Add new document"
            className="floating-action-button active:opacity-90"
            style={({ pressed }) => [
              pressed && { transform: [{ scale: 0.94 }] },
            ]}
          >
            <Feather name="plus" size={26} color="#FFFFFF" />
          </Pressable>
        </View>
      </View>
    </View>
  );
}

// ---------------------------------------------------------------------------
// Styles that cannot be expressed via NativeWind (shadows, borders, z-index)
// ---------------------------------------------------------------------------
const styles = StyleSheet.create({
  quickCard: {
    width: 140,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
    elevation: 1,
    borderWidth: 1,
    borderColor: "#F0F0F2",
  },
  pressedScale: {
    transform: [{ scale: 0.98 }],
  },
  searchBtnShadow: {
    shadowColor: colors.accent,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 2,
  },
  recentCard: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
    borderWidth: 1,
    borderColor: "#F0F0F2",
  },
  rowBorder: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "#F0F0F2",
  },
  fabWrap: {
    zIndex: 50,
  },
});

import DashboardHeader from "@/components/DashboardHeader";
import EmptyState from "@/components/EmptyState";
import { formatDate } from "@/lib/date";
import { useDocumentStore } from "@/store/documentStore";
import { colors } from "@/theme/tokens";
import { ZentraDocument } from "@/types";
import { Feather } from "@expo/vector-icons";
import { isToday, isYesterday, parseISO } from "date-fns";
import { useRouter } from "expo-router";
import ActionSheet from "@/components/ActionSheet";
import ConfirmationModal from "@/components/ConfirmationModal";
import { cancelDocumentNotifications } from "@/lib/notifications";
import React, { useMemo, useState } from "react";
import * as FileSystem from "expo-file-system/legacy";
import {
  AccessibilityInfo,
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";

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
  isSelectionMode = false,
  isSelected = false,
  onLongPress,
}: {
  doc: ZentraDocument;
  onPress: () => void;
  isSelectionMode?: boolean;
  isSelected?: boolean;
  onLongPress?: () => void;
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
      onLongPress={onLongPress}
      delayLongPress={200}
      accessibilityRole="button"
      accessibilityLabel={`Open ${doc.name}`}
      className="bg-surface rounded-2xl p-4 mr-3 active:opacity-90"
      style={({ pressed }) => [
        styles.quickCard,
        pressed && styles.pressedScale,
      ]}
    >
      <View className="flex-row justify-between items-start mb-3">
        <View
          className="w-11 h-11 rounded-full items-center justify-center"
          style={{ backgroundColor: bgColor }}
        >
          <Feather name={iconName} size={20} color={iconColor} />
        </View>
        {isSelectionMode && (
          <View className="w-8 h-8 items-center justify-center">
            <Feather
              name={isSelected ? "check-circle" : "circle"}
              size={20}
              color={isSelected ? colors.accent : "#B3B3B3"}
            />
          </View>
        )}
      </View>
      <Text numberOfLines={1} className="text-body-lg text-primary font-semibold">
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
  onMorePress,
  isSelectionMode = false,
  isSelected = false,
  onLongPress,
}: {
  doc: ZentraDocument;
  isLast: boolean;
  onPress: () => void;
  onMorePress: () => void;
  isSelectionMode?: boolean;
  isSelected?: boolean;
  onLongPress?: () => void;
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
      onLongPress={onLongPress}
      delayLongPress={200}
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
        <Text numberOfLines={1} className="text-body-lg text-primary font-medium">
          {doc.name}
        </Text>
        <Text className="text-caption text-secondary mt-0.5">{meta}</Text>
      </View>

      {isSelectionMode ? (
        <View className="w-9 h-9 items-center justify-center mr-1">
          <Feather
            name={isSelected ? "check-circle" : "circle"}
            size={22}
            color={isSelected ? colors.accent : "#B3B3B3"}
          />
        </View>
      ) : (
        <Pressable
          onPress={onMorePress}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          accessibilityRole="button"
          accessibilityLabel={`More options for ${doc.name}`}
          className="w-9 h-9 rounded-full items-center justify-center active:bg-soft-accent"
        >
          <Feather name="more-horizontal" size={20} color={colors.secondary} />
        </Pressable>
      )}
    </Pressable>
  );
}

// ---------------------------------------------------------------------------
// Home Screen
// ---------------------------------------------------------------------------
export default function HomeScreen() {
  const router = useRouter();
  const {
    documents,
    addDocument,
    deleteDocument,
    deleteMultipleDocuments,
  } = useDocumentStore();
  const [selectedDoc, setSelectedDoc] = useState<ZentraDocument | null>(null);
  const [isDeleteModalVisible, setIsDeleteModalVisible] = useState(false);
  const [docToDelete, setDocToDelete] = useState<ZentraDocument | null>(null);

  // Selection state
  const [isSelectionMode, setIsSelectionMode] = useState(false);
  const [selectedDocumentIds, setSelectedDocumentIds] = useState<Set<string>>(new Set());
  const [isBulkDeleteModalVisible, setIsBulkDeleteModalVisible] = useState(false);

  const toggleDocumentSelection = (id: string) => {
    setSelectedDocumentIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const handleStartSelectionWithDoc = (id: string) => {
    setIsSelectionMode(true);
    setSelectedDocumentIds(new Set([id]));
  };

  const handleExitSelection = () => {
    setIsSelectionMode(false);
    setSelectedDocumentIds(new Set());
  };

  const handleConfirmBulkDelete = async () => {
    try {
      const docIds = Array.from(selectedDocumentIds);

      // 1. Cancel notifications for each selected document
      await Promise.all(docIds.map((id) => cancelDocumentNotifications(id)));

      // 2. Delete local files for each selected document
      const permanentDirectory = FileSystem.documentDirectory;
      for (const id of docIds) {
        const doc = documents.find((d) => d.id === id);
        if (doc?.localUri && permanentDirectory && doc.localUri.startsWith(permanentDirectory)) {
          try {
            await FileSystem.deleteAsync(doc.localUri, { idempotent: true });
          } catch (e) {
            console.warn("Failed to delete file on bulk delete:", e);
          }
        }
      }

      // 3. Call store actions
      if (docIds.length > 0) {
        deleteMultipleDocuments(docIds);
      }

      // 4. Update accessibility announcements and state
      AccessibilityInfo.announceForAccessibility(`Deleted ${docIds.length} documents`);
    } catch (error) {
      console.error("Bulk delete failed:", error);
    } finally {
      setIsBulkDeleteModalVisible(false);
      handleExitSelection();
    }
  };

  const handleDeleteDoc = (doc: ZentraDocument) => {
    setDocToDelete(doc);
    setIsDeleteModalVisible(true);
  };

  const handleConfirmDelete = async () => {
    if (!docToDelete) return;
    await cancelDocumentNotifications(docToDelete.id);
    deleteDocument(docToDelete.id);
    AccessibilityInfo.announceForAccessibility("Document deleted");
    setDocToDelete(null);
  };

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
            onPress={() => {
              if (!isSelectionMode) {
                router.push("/search" as any);
              }
            }}
            accessibilityRole="button"
            accessibilityLabel="Search documents"
            className={`px-6 mb-6 active:opacity-90 ${isSelectionMode ? "opacity-40" : ""}`}
            style={({ pressed }) => [pressed && !isSelectionMode && styles.pressedScale]}
            disabled={isSelectionMode}
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
                        isSelectionMode={isSelectionMode}
                        isSelected={selectedDocumentIds.has(doc.id)}
                        onPress={() => {
                          if (isSelectionMode) {
                            toggleDocumentSelection(doc.id);
                          } else {
                            router.push({
                              pathname: "/document/[id]",
                              params: { id: doc.id },
                            } as never);
                          }
                        }}
                        onLongPress={() => handleStartSelectionWithDoc(doc.id)}
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
                      isSelectionMode={isSelectionMode}
                      isSelected={selectedDocumentIds.has(doc.id)}
                      onPress={() => {
                        if (isSelectionMode) {
                          toggleDocumentSelection(doc.id);
                        } else {
                          router.push({
                            pathname: "/document/[id]",
                            params: { id: doc.id },
                          } as never);
                        }
                      }}
                      onLongPress={() => handleStartSelectionWithDoc(doc.id)}
                      onMorePress={() => setSelectedDoc(doc)}
                    />
                  ))}
                </View>
              </View>
            </>
          )}
        </ScrollView>

        {/* FAB */}
        {!isSelectionMode && (
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
        )}

        {/* Sticky/Floating Bottom Selection Action Bar */}
        {isSelectionMode && (
          <View
            style={styles.bottomBarShadow}
            className="absolute bottom-5 left-6 right-6 bg-surface border border-border/60 rounded-2xl p-4 flex-row justify-between items-center z-[200]"
          >
            <View>
              <Text className="text-body-md text-primary font-bold">
                {selectedDocumentIds.size} file{selectedDocumentIds.size !== 1 ? "s" : ""} selected
              </Text>
            </View>
            <View className="flex-row gap-2">
              <Pressable
                onPress={handleExitSelection}
                accessibilityRole="button"
                accessibilityLabel="Cancel selection mode"
                className="bg-background border border-border px-4 py-2.5 rounded-xl active:opacity-75 min-h-11 justify-center"
              >
                <Text className="text-body-md font-semibold text-primary">Cancel</Text>
              </Pressable>
              <Pressable
                onPress={() => {
                  if (selectedDocumentIds.size === 0) {
                    Alert.alert("Nothing Selected", "Please select at least one document to delete.");
                    return;
                  }
                  setIsBulkDeleteModalVisible(true);
                }}
                accessibilityRole="button"
                accessibilityLabel="Delete selected documents"
                className="bg-danger px-4 py-2.5 rounded-xl flex-row items-center active:opacity-75 min-h-11 justify-center"
              >
                <Feather name="trash-2" size={16} color="white" />
                <Text className="text-body-md font-semibold text-white ml-2 font-semibold">Delete</Text>
              </Pressable>
            </View>
          </View>
        )}
      </View>

      {/* Options Action Sheet */}
      <ActionSheet
        visible={selectedDoc !== null}
        onClose={() => setSelectedDoc(null)}
        title={selectedDoc ? `Options: ${selectedDoc.name}` : "Document Options"}
        options={
          selectedDoc
            ? [
                {
                  label: "Edit Document",
                  icon: "edit-2",
                  onPress: () => router.push(`/edit-document/${selectedDoc.id}` as never),
                },
                {
                  label: "Delete Document",
                  icon: "trash-2",
                  isDestructive: true,
                  onPress: () => handleDeleteDoc(selectedDoc),
                },
              ]
            : []
        }
      />

      {/* Delete Confirmation Modal */}
      <ConfirmationModal
        visible={isDeleteModalVisible}
        onClose={() => {
          setIsDeleteModalVisible(false);
          setDocToDelete(null);
        }}
        onConfirm={handleConfirmDelete}
        title="Delete Document"
        message="Are you sure you want to permanently delete this document from your vault? This action cannot be undone."
        confirmLabel="Delete"
        isDestructive
      />

      {/* Bulk Delete Confirmation Modal */}
      <ConfirmationModal
        visible={isBulkDeleteModalVisible}
        onClose={() => setIsBulkDeleteModalVisible(false)}
        onConfirm={handleConfirmBulkDelete}
        title="Delete Selected Documents"
        message={`Are you sure you want to permanently delete the selected ${selectedDocumentIds.size} document(s)? All associated notifications and files will be removed. This action cannot be undone.`}
        confirmLabel="Delete"
        isDestructive
      />
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
  bottomBarShadow: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
});

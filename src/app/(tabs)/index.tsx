import DashboardHeader from "@/components/DashboardHeader";
import EmptyState from "@/components/EmptyState";
import { sortByExpiry } from "@/lib/date";
import { useDocumentStore } from "@/store/documentStore";
import { colors } from "@/theme/tokens";
import { ZentraDocument } from "@/types";
import { Feather } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import ActionSheet from "@/components/ActionSheet";
import ConfirmationModal from "@/components/ConfirmationModal";
import ScalePressable from "@/components/ScalePressable";
import React, { useMemo, useState } from "react";
import { seedMockData } from "@/lib/seed";
import {
  AccessibilityInfo,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { showAlert } from "@/store/alertStore";
import { useDocumentSelection } from "@/hooks/useDocumentSelection";
import QuickAccessCard from "@/components/QuickAccessCard";
import RecentDocRow from "@/components/RecentDocRow";

export default function HomeScreen() {
  const router = useRouter();
  const {
    documents,
    deleteDocument,
  } = useDocumentStore();

  const [selectedDoc, setSelectedDoc] = useState<ZentraDocument | null>(null);
  const [isDeleteModalVisible, setIsDeleteModalVisible] = useState(false);
  const [docToDelete, setDocToDelete] = useState<ZentraDocument | null>(null);

  // Hook for selection mode
  const {
    isSelectionMode,
    selectedDocumentIds,
    isBulkDeleteModalVisible,
    setIsBulkDeleteModalVisible,
    toggleDocumentSelection,
    handleStartSelectionWithDoc,
    handleExitSelection,
    handleConfirmBulkDelete,
  } = useDocumentSelection();

  React.useEffect(() => {
    console.log("[Zentra Debug] Store documents count:", documents.length);
    const state = useDocumentStore.getState();
    console.log("[Zentra Debug] Store folders:", state.folders);
    console.log("[Zentra Debug] Store active documents:", documents.filter(d => !d.isDeleted).length);
  }, [documents]);

  const handleDeleteDoc = (doc: ZentraDocument) => {
    setDocToDelete(doc);
    setIsDeleteModalVisible(true);
  };

  const handleConfirmDelete = async () => {
    if (!docToDelete) return;
    await deleteDocument(docToDelete.id);
    AccessibilityInfo.announceForAccessibility("Document deleted");
    setDocToDelete(null);
  };

  // Sorting state
  const [sort, setSort] = useState<"expiry" | "added">("expiry");

  const sorted = useMemo(() => {
    const activeDocs = documents.filter((doc) => !doc.isDeleted);
    if (sort === "expiry") {
      return sortByExpiry(activeDocs);
    }
    return activeDocs.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }, [documents, sort]);

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
  const seedDemoData = React.useCallback(async () => {
    if (!canSeedDemo) return;
    try {
      await seedMockData();
      AccessibilityInfo.announceForAccessibility("Demo documents loaded successfully");
    } catch (err) {
      console.warn("Failed to seed demo data:", err);
      showAlert("Seeding Failed", "Could not load demo documents.", "error");
    }
  }, [canSeedDemo]);

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
          <ScalePressable
            onPress={() => {
              if (!isSelectionMode) {
                router.push("/search" as any);
              }
            }}
            accessibilityRole="button"
            accessibilityLabel="Search documents"
            className={`px-6 mb-6 active:opacity-90 ${isSelectionMode ? "opacity-40" : ""}`}
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
          </ScalePressable>

          {sorted.length === 0 ? (
            // Empty state
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
                  <ScalePressable
                    onPress={seedDemoData}
                    accessibilityRole="button"
                    className="w-full h-[52px] bg-surface border border-border rounded-xl items-center justify-center active:bg-background"
                  >
                    <Text className="text-button text-accent font-semibold">
                      Load Demo Documents
                    </Text>
                  </ScalePressable>
                </View>
              )}
            </View>
          ) : (
            // Dashboard content
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

              {/* Recent Documents / Upcoming Expirations */}
              <View className="px-6 mb-6">
                <View className="flex-row justify-between items-center mb-4">
                  <Text className="text-h2 text-primary font-semibold">
                    {sort === "expiry" ? "Upcoming Expirations" : "Recent Documents"}
                  </Text>
                  {!isSelectionMode && (
                    <View className="flex-row bg-soft-accent rounded-full p-0.5">
                      <Pressable
                        onPress={() => setSort("expiry")}
                        accessibilityRole="button"
                        accessibilityLabel="Sort by nearest expiry date"
                        className={`px-3 py-1 rounded-full ${sort === "expiry" ? "bg-accent" : "bg-transparent"}`}
                      >
                        <Text className={`text-caption font-semibold ${sort === "expiry" ? "text-white" : "text-secondary"}`}>
                          Expiry
                        </Text>
                      </Pressable>
                      <Pressable
                        onPress={() => setSort("added")}
                        accessibilityRole="button"
                        accessibilityLabel="Sort by date added"
                        className={`px-3 py-1 rounded-full ${sort === "added" ? "bg-accent" : "bg-transparent"}`}
                      >
                        <Text className={`text-caption font-semibold ${sort === "added" ? "text-white" : "text-secondary"}`}>
                          Recent
                        </Text>
                      </Pressable>
                    </View>
                  )}
                </View>

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
                      sortMode={sort}
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
            <ScalePressable
              onPress={() => router.push("/add-document" as never)}
              accessibilityRole="button"
              accessibilityLabel="Add new document"
              className="floating-action-button active:opacity-90"
              activeScale={0.94}
            >
              <Feather name="plus" size={26} color="#FFFFFF" />
            </ScalePressable>
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
              <ScalePressable
                onPress={handleExitSelection}
                accessibilityRole="button"
                accessibilityLabel="Cancel selection mode"
                className="bg-background border border-border px-4 py-2.5 rounded-xl active:opacity-75 min-h-11 justify-center"
              >
                <Text className="text-body-md font-semibold text-primary">Cancel</Text>
              </ScalePressable>
              <ScalePressable
                onPress={() => {
                  if (selectedDocumentIds.size === 0) {
                    showAlert("Nothing Selected", "Please select at least one document to delete.", "warning");
                    return;
                  }
                  setIsBulkDeleteModalVisible(true);
                }}
                accessibilityRole="button"
                accessibilityLabel="Delete selected documents"
                className="bg-danger px-4 py-2.5 rounded-xl flex-row items-center active:opacity-75 min-h-11 justify-center"
              >
                <Feather name="trash-2" size={16} color="white" />
                <Text className="text-body-md font-semibold text-white ml-2">Delete</Text>
              </ScalePressable>
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

const styles = StyleSheet.create({
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

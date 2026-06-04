import DocumentCard from "@/components/DocumentCard";
import EmptyState from "@/components/EmptyState";
import ActionSheet from "@/components/ActionSheet";
import ConfirmationModal from "@/components/ConfirmationModal";
import { sortByExpiry } from "@/lib/date";
import { useDocumentStore } from "@/store/documentStore";
import { colors } from "@/theme/tokens";
import { DocumentCategory } from "@/types";
import { Feather } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useMemo, useState } from "react";
import ScalePressable from "@/components/ScalePressable";
import { seedMockData } from "@/lib/seed";
import {
  AccessibilityInfo,
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useDocumentSelection } from "@/hooks/useDocumentSelection";
import FolderModal from "@/components/FolderModal";

export default function DocumentsScreen() {
  const router = useRouter();
  const {
    documents,
    folders,
    addFolder,
    renameFolder,
    deleteFolder,
    toggleFavorite,
  } = useDocumentStore();

  // Custom hook for selection mode
  const {
    isSelectionMode,
    selectedDocumentIds,
    selectedFolderNames,
    isBulkDeleteModalVisible,
    setIsBulkDeleteModalVisible,
    toggleDocumentSelection,
    toggleFolderSelection,
    handleStartSelectionWithDoc,
    handleStartSelectionWithFolder,
    handleExitSelection,
    handleConfirmBulkDelete,
  } = useDocumentSelection();

  // Local UI State
  const [selectedTab, setSelectedTab] = useState<
    "All" | "PDF" | "Images" | "Docs" | "Others"
  >("All");
  const [selectedCategory, setSelectedCategory] =
    useState<DocumentCategory | null>(null);
  const [viewMode, setViewMode] = useState<"list" | "grid">("list");
  const [sort, setSort] = useState<"name" | "expiry" | "added">("expiry");

  // Folder Dialog Modal State
  const [isFolderModalVisible, setIsFolderModalVisible] = useState(false);
  const [folderModalMode, setFolderModalMode] = useState<"create" | "rename">("create");
  const [targetFolderName, setTargetFolderName] = useState("");
  const [selectedFolderOptions, setSelectedFolderOptions] = useState<string | null>(null);
  const [isDeleteFolderModalVisible, setIsDeleteFolderModalVisible] = useState(false);
  const [folderToDelete, setFolderToDelete] = useState<string | null>(null);

  // Folder CRUD Save Handler
  const handleSaveFolder = (name: string) => {
    if (folderModalMode === "create") {
      const success = addFolder(name);
      if (!success) {
        Alert.alert("Folder Exists", "A folder with this name already exists.");
        return;
      }
    } else {
      const success = renameFolder(targetFolderName, name);
      if (!success) {
        Alert.alert("Folder Exists", "A folder with this name already exists.");
        return;
      }
    }
    setIsFolderModalVisible(false);
  };

  // Calculate category folder item counts dynamically (excluding soft-deleted documents)
  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    folders.forEach((f) => {
      counts[f] = 0;
    });
    documents.forEach((doc) => {
      if (doc.isDeleted) return; // Ignore soft-deleted documents
      if (counts[doc.category] !== undefined) {
        counts[doc.category]++;
      } else {
        // Fallback for documents in deleted folders
        if (counts["Other"] !== undefined) {
          counts["Other"]++;
        }
      }
    });
    return counts;
  }, [documents, folders]);

  const openFolderModal = (folderName: string | null) => {
    if (folderName) {
      setFolderModalMode("rename");
      setTargetFolderName(folderName);
    } else {
      setFolderModalMode("create");
      setTargetFolderName("");
    }
    setIsFolderModalVisible(true);
  };

  const handleFolderOptions = (folderName: string) => {
    setSelectedFolderOptions(folderName);
  };

  const triggerFolderDelete = (folderName: string) => {
    setFolderToDelete(folderName);
    setIsDeleteFolderModalVisible(true);
  };

  const handleConfirmDeleteFolder = () => {
    if (!folderToDelete) return;
    deleteFolder(folderToDelete);
    if (selectedCategory === folderToDelete) {
      setSelectedCategory(null);
    }
    setFolderToDelete(null);
  };

  // Combined documents filtering logic (excluding soft-deleted documents)
  const filteredDocuments = useMemo(() => {
    return documents.filter((doc) => {
      if (doc.isDeleted) return false; // Ignore soft-deleted documents

      // 1. File Type filter tab
      if (selectedTab !== "All") {
        const tabToTypeMap: Record<string, string> = {
          PDF: "pdf",
          Images: "image",
          Docs: "doc",
          Others: "other",
        };
        if (doc.fileType !== tabToTypeMap[selectedTab]) {
          return false;
        }
      }

      // 2. Category folder filter
      if (selectedCategory) {
        if (doc.category !== selectedCategory) {
          return false;
        }
      }

      return true;
    });
  }, [documents, selectedTab, selectedCategory]);

  // Sort filtered documents based on selected sort option
  const sortedDocuments = useMemo(() => {
    if (sort === "name") {
      return [...filteredDocuments].sort((a, b) => a.name.localeCompare(b.name));
    }
    if (sort === "expiry") {
      return sortByExpiry(filteredDocuments);
    }
    return [...filteredDocuments].sort((a, b) =>
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  }, [filteredDocuments, sort]);

  // Determine whether to show the Category Folders layout
  // Only show when selected tab is "All" and no category is selected
  const showFolders =
    selectedTab === "All" &&
    selectedCategory === null;

  const renderEmptyState = () => {
    const activeDocsCount = documents.filter((d) => !d.isDeleted).length;
    if (activeDocsCount === 0) {
      return (
        <View className="px-6 pb-12">
          <EmptyState
            icon="document-text-outline"
            title="Your vault is empty"
            message="Start by adding a document"
            actionLabel="Add Document"
            onAction={() => router.push("/add-document" as never)}
          />
          {__DEV__ && (
            <View className="px-6 -mt-2">
              <ScalePressable
                onPress={async () => {
                  try {
                    await seedMockData();
                    AccessibilityInfo.announceForAccessibility("Demo documents loaded successfully");
                  } catch (err) {
                    console.warn("Failed to seed demo data:", err);
                    Alert.alert("Seeding Failed", "Could not load demo documents.");
                  }
                }}
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
      );
    }
    if (selectedCategory) {
      return (
        <EmptyState
          icon="folder-outline"
          title={`No ${selectedCategory} documents`}
          message="Add a document to this category"
          actionLabel="Clear Category"
          onAction={() => setSelectedCategory(null)}
        />
      );
    }
    return (
      <EmptyState
        icon="document-text-outline"
        title="No documents found"
        message="No matches found for your current filters."
        actionLabel="Clear Filters"
        onAction={() => {
          setSelectedTab("All");
          setSelectedCategory(null);
        }}
      />
    );
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <View className="flex-1 relative">
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 120 }}
        >
          {/* Header */}
          <View className="flex-row justify-between items-center px-6 pt-6 mb-5">
            <Text className="text-h1 text-primary font-bold">Documents</Text>
            <View className="flex-row items-center gap-3">
              <ScalePressable
                onPress={() => setViewMode("grid")}
                accessibilityLabel="Grid view"
                accessibilityRole="button"
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                className={`w-11 h-11 items-center justify-center rounded-xl ${
                  viewMode === "grid" ? "bg-soft-accent" : "bg-transparent"
                }`}
              >
                <Feather
                  name="grid"
                  size={20}
                  color={viewMode === "grid" ? colors.accent : colors.secondary}
                />
              </ScalePressable>
              <ScalePressable
                onPress={() => setViewMode("list")}
                accessibilityLabel="List view"
                accessibilityRole="button"
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                className={`w-11 h-11 items-center justify-center rounded-xl ${
                  viewMode === "list" ? "bg-soft-accent" : "bg-transparent"
                }`}
              >
                <Feather
                  name="list"
                  size={20}
                  color={viewMode === "list" ? colors.accent : colors.secondary}
                />
              </ScalePressable>
            </View>
          </View>

          {/* Filter Tabs (Horizontal Scroll) */}
          <View className="mb-6">
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ paddingHorizontal: 24 }}
            >
              {(["All", "PDF", "Images", "Docs", "Others"] as const).map(
                (tab) => {
                  const isActive = selectedTab === tab;
                  return (
                    <ScalePressable
                      key={tab}
                      onPress={() => {
                        setSelectedTab(tab);
                        // Clear category filter when switching tabs to ensure clean results
                        if (selectedCategory && tab !== "All") {
                          setSelectedCategory(null);
                        }
                      }}
                      accessibilityRole="button"
                      accessibilityState={{ selected: isActive }}
                      className={`mr-2.5 px-5 rounded-full border min-h-11 min-w-11 justify-center ${
                        isActive
                          ? "bg-accent border-accent"
                          : "bg-surface border-border"
                      }`}
                    >
                      <Text
                        className={`text-body-md font-semibold ${
                          isActive ? "text-white" : "text-secondary"
                        }`}
                      >
                        {tab}
                      </Text>
                    </ScalePressable>
                  );
                },
              )}
            </ScrollView>
          </View>

          {/* Sort Control Row */}
          {!showFolders && (
            <View className="px-6 mb-6 flex-row items-center justify-start gap-2">
              {(["name", "expiry", "added"] as const).map((type) => {
                const isActive = sort === type;
                const label =
                  type === "name"
                    ? "Name"
                    : type === "expiry"
                    ? "Expiry"
                    : "Date Added";
                return (
                  <ScalePressable
                    key={type}
                    onPress={() => setSort(type)}
                    accessibilityRole="button"
                    accessibilityLabel={`Sort by ${type}`}
                    accessibilityState={{ selected: isActive }}
                    className={`px-4 rounded-full border min-h-11 justify-center ${
                      isActive
                        ? "bg-accent border-accent"
                        : "bg-surface border-border"
                    }`}
                  >
                    <Text
                      className={`text-body-md font-semibold ${
                        isActive ? "text-white" : "text-secondary"
                      }`}
                    >
                      {label}
                    </Text>
                  </ScalePressable>
                );
              })}
            </View>
          )}

          {/* Active Folder/Category Header Indicator */}
          {selectedCategory && (
            <View className="px-6 mb-5">
              <View className="flex-row items-center justify-between bg-soft-accent px-4 py-2.5 rounded-xl border border-accent/10">
                <View className="flex-row items-center">
                  <Feather name="folder" size={16} color={colors.accent} />
                  <Text className="text-body-md text-primary font-semibold ml-2">
                    Category: {selectedCategory}
                  </Text>
                </View>
                <ScalePressable
                  onPress={() => setSelectedCategory(null)}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                  accessibilityRole="button"
                  accessibilityLabel="Go back to folder list"
                  className="flex-row items-center bg-surface border border-border/60 rounded-xl px-3 py-1.5 active:bg-border/20 min-h-11 justify-center"
                >
                  <Feather
                    name="arrow-left"
                    size={14}
                    color={colors.secondary}
                  />
                  <Text className="text-body-sm text-secondary ml-1 font-semibold">
                    Back
                  </Text>
                </ScalePressable>
              </View>
            </View>
          )}

          {/* Category Folders layout */}
          {showFolders && (
            <View className="px-6 mb-6">
              {/* Folders Section Title & Create Button */}
              <View className="flex-row justify-between items-center mb-3">
                <Text className="text-h2 text-primary font-semibold">Folders</Text>
                <ScalePressable
                  onPress={() => openFolderModal(null)}
                  accessibilityRole="button"
                  accessibilityLabel="Create new folder"
                  className="flex-row items-center bg-soft-accent px-3 rounded-lg active:opacity-80 min-h-11 justify-center"
                >
                  <Feather name="plus" size={14} color={colors.accent} />
                  <Text className="text-caption text-accent ml-1 font-semibold">
                    New Folder
                  </Text>
                </ScalePressable>
              </View>

              <View
                className="bg-surface rounded-2xl border border-border/40 overflow-hidden"
                style={styles.foldersShadow}
              >
                {folders.map((folderName, index) => {
                  const count = categoryCounts[folderName] || 0;
                  const isLast = index === folders.length - 1;
                  const isFolderSelected = selectedFolderNames.has(folderName);
                  return (
                    <View
                      key={folderName}
                      className="flex-row items-center border-b border-border/40"
                      style={isLast ? { borderBottomWidth: 0 } : undefined}
                    >
                      <ScalePressable
                        onPress={() => {
                          if (isSelectionMode) {
                            toggleFolderSelection(folderName);
                          } else {
                            setSelectedCategory(folderName);
                          }
                        }}
                        onLongPress={() => handleStartSelectionWithFolder(folderName)}
                        delayLongPress={200}
                        accessibilityRole="button"
                        accessibilityLabel={`Folder: ${folderName}, ${count} ${count === 1 ? "item" : "items"}`}
                        className={`flex-1 flex-row items-center px-4 py-4 active:bg-background ${
                          isSelectionMode && isFolderSelected ? "bg-soft-accent/30" : ""
                        }`}
                        activeScale={0.98}
                      >
                        <View className="w-11 h-11 rounded-xl bg-soft-accent items-center justify-center">
                          <Feather
                            name="folder"
                            size={22}
                            color={colors.accent}
                          />
                        </View>
                        <View className="flex-1 ml-3">
                          <Text className="text-body-lg text-primary font-semibold">
                            {folderName}
                          </Text>
                          <Text className="text-caption text-secondary mt-0.5">
                            {count} {count === 1 ? "item" : "items"}
                          </Text>
                        </View>
                      </ScalePressable>
                      {isSelectionMode ? (
                        <ScalePressable
                          onPress={() => toggleFolderSelection(folderName)}
                          hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
                          accessibilityRole="button"
                          accessibilityLabel={`Select folder ${folderName}`}
                          className="w-12 h-12 items-center justify-center mr-2 rounded-full active:bg-border/20"
                        >
                          <Feather
                            name={isFolderSelected ? "check-circle" : "circle"}
                            size={22}
                            color={isFolderSelected ? colors.accent : colors.secondary}
                          />
                        </ScalePressable>
                      ) : (
                        <View className="flex-row items-center pr-3">
                          <ScalePressable
                            onPress={() => handleFolderOptions(folderName)}
                            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
                            accessibilityRole="button"
                            accessibilityLabel={`More options for folder ${folderName}`}
                            className="w-10 h-10 items-center justify-center rounded-full active:bg-border/25 mr-1"
                          >
                            <Feather name="more-vertical" size={18} color={colors.secondary} />
                          </ScalePressable>
                          <ScalePressable
                            onPress={() => setSelectedCategory(folderName)}
                            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                            accessibilityRole="button"
                            accessibilityLabel={`Open folder ${folderName}`}
                            className="w-8 h-10 items-center justify-center"
                          >
                            <Feather name="chevron-right" size={20} color={colors.secondary} />
                          </ScalePressable>
                        </View>
                      )}
                    </View>
                  );
                })}
              </View>
            </View>
          )}

          {/* Documents Section Header */}
          {showFolders && sortedDocuments.length > 0 && (
            <View className="px-6 mb-3 mt-2">
              <Text className="text-h2 text-primary font-semibold">
                All Files
              </Text>
            </View>
          )}

          {/* Documents List or Grid View */}
          {sortedDocuments.length > 0 ? (
            viewMode === "grid" ? (
              <View
                className="px-4"
                style={{ flexDirection: "row", flexWrap: "wrap" }}
              >
                {sortedDocuments.map((doc) => (
                  <View key={doc.id} style={{ width: "50%" }}>
                    <DocumentCard
                      doc={doc}
                      viewMode="grid"
                      isSelectionMode={isSelectionMode}
                      isSelected={selectedDocumentIds.has(doc.id)}
                      hideExpirySafe={sort !== "expiry"}
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
                      onFavoritePress={() => toggleFavorite(doc.id)}
                    />
                  </View>
                ))}
              </View>
            ) : (
              <View
                className="mx-6 bg-surface border border-border/40 overflow-hidden rounded-2xl"
                style={styles.listShadow}
              >
                {sortedDocuments.map((doc, idx) => (
                  <View key={doc.id}>
                    <DocumentCard
                      doc={doc}
                      viewMode="list"
                      isSelectionMode={isSelectionMode}
                      isSelected={selectedDocumentIds.has(doc.id)}
                      hideExpirySafe={sort !== "expiry"}
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
                      onFavoritePress={() => toggleFavorite(doc.id)}
                    />
                  </View>
                ))}
              </View>
            )
          ) : (
            renderEmptyState()
          )}
        </ScrollView>

        {/* Floating Action Button (FAB) */}
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
                {selectedFolderNames.size > 0 && `${selectedFolderNames.size} folder${selectedFolderNames.size !== 1 ? "s" : ""}`}
                {selectedFolderNames.size > 0 && selectedDocumentIds.size > 0 && " & "}
                {selectedDocumentIds.size > 0 && `${selectedDocumentIds.size} file${selectedDocumentIds.size !== 1 ? "s" : ""}`}
                {selectedFolderNames.size === 0 && selectedDocumentIds.size === 0 && "0 items"} selected
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
                  if (selectedDocumentIds.size === 0 && selectedFolderNames.size === 0) {
                    Alert.alert("Nothing Selected", "Please select at least one item to delete.");
                    return;
                  }
                  setIsBulkDeleteModalVisible(true);
                }}
                accessibilityRole="button"
                accessibilityLabel="Delete selected items"
                className="bg-danger px-4 py-2.5 rounded-xl flex-row items-center active:opacity-75 min-h-11 justify-center"
              >
                <Feather name="trash-2" size={16} color="white" />
                <Text className="text-body-md font-semibold text-white ml-2">Delete</Text>
              </ScalePressable>
            </View>
          </View>
        )}
      </View>

      {/* Folder Create/Rename Custom Modal */}
      <FolderModal
        visible={isFolderModalVisible}
        onClose={() => setIsFolderModalVisible(false)}
        mode={folderModalMode}
        initialName={targetFolderName}
        onSave={handleSaveFolder}
      />

      {/* Folder Options Action Sheet */}
      <ActionSheet
        visible={selectedFolderOptions !== null}
        onClose={() => setSelectedFolderOptions(null)}
        title={selectedFolderOptions ? `Manage Folder: ${selectedFolderOptions}` : "Folder Options"}
        options={
          selectedFolderOptions
            ? [
                {
                  label: "Rename Folder",
                  icon: "edit-2",
                  onPress: () => openFolderModal(selectedFolderOptions),
                },
                {
                  label: "Delete Folder",
                  icon: "trash-2",
                  isDestructive: true,
                  onPress: () => triggerFolderDelete(selectedFolderOptions),
                },
              ]
            : []
        }
      />

      {/* Delete Folder Confirmation Modal */}
      <ConfirmationModal
        visible={isDeleteFolderModalVisible}
        onClose={() => {
          setIsDeleteFolderModalVisible(false);
          setFolderToDelete(null);
        }}
        onConfirm={handleConfirmDeleteFolder}
        title="Delete Folder"
        message={
          folderToDelete
            ? (categoryCounts[folderToDelete] || 0) > 0
              ? `Are you sure you want to delete the folder "${folderToDelete}"? The ${categoryCounts[folderToDelete]} document(s) inside will be moved to the "Other" folder.`
              : `Are you sure you want to delete the folder "${folderToDelete}"?`
            : ""
        }
        confirmLabel="Delete"
        isDestructive
      />

      {/* Bulk Delete Confirmation Modal */}
      <ConfirmationModal
        visible={isBulkDeleteModalVisible}
        onClose={() => setIsBulkDeleteModalVisible(false)}
        onConfirm={handleConfirmBulkDelete}
        title="Delete Selected Items"
        message={`Are you sure you want to permanently delete the selected ${
          selectedFolderNames.size > 0 ? `${selectedFolderNames.size} folder(s)` : ""
        }${selectedFolderNames.size > 0 && selectedDocumentIds.size > 0 ? " and " : ""}${
          selectedDocumentIds.size > 0 ? `${selectedDocumentIds.size} document(s)` : ""
        }? All associated notifications and files will be removed. This action cannot be undone.`}
        confirmLabel="Delete"
        isDestructive
      />
    </View>
  );
}

const styles = StyleSheet.create({
  foldersShadow: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 3,
    elevation: 1,
  },
  listShadow: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 3,
    elevation: 1,
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

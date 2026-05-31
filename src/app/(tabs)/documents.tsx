import DocumentCard from "@/components/DocumentCard";
import EmptyState from "@/components/EmptyState";
import { useDocumentStore } from "@/store/documentStore";
import { colors } from "@/theme/tokens";
import { DocumentCategory } from "@/types";
import { Feather } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useMemo, useState } from "react";
import {
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    View,
} from "react-native";

const CATEGORIES: { name: DocumentCategory; label: string }[] = [
  { name: "Personal", label: "Personal" },
  { name: "Work", label: "Work" },
  { name: "Finance", label: "Finance" },
  { name: "Health", label: "Health" },
  { name: "Other", label: "Other" },
];

export default function DocumentsScreen() {
  const router = useRouter();
  const { documents, toggleFavorite } = useDocumentStore();

  // Local UI State
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTab, setSelectedTab] = useState<
    "All" | "PDF" | "Images" | "Docs" | "Others"
  >("All");
  const [selectedCategory, setSelectedCategory] =
    useState<DocumentCategory | null>(null);
  const [viewMode, setViewMode] = useState<"list" | "grid">("list");

  // Calculate category folder item counts dynamically
  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = {
      Personal: 0,
      Work: 0,
      Finance: 0,
      Health: 0,
      Other: 0,
    };
    documents.forEach((doc) => {
      if (counts[doc.category] !== undefined) {
        counts[doc.category]++;
      }
    });
    return counts;
  }, [documents]);

  // Combined documents filtering logic
  const filteredDocuments = useMemo(() => {
    return documents.filter((doc) => {
      // 1. Search Query filter (case-insensitive name check)
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        if (!doc.name.toLowerCase().includes(query)) {
          return false;
        }
      }

      // 2. File Type filter tab
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

      // 3. Category folder filter
      if (selectedCategory) {
        if (doc.category !== selectedCategory) {
          return false;
        }
      }

      return true;
    });
  }, [documents, searchQuery, selectedTab, selectedCategory]);

  // Sort filtered documents by creation date descending (latest first)
  const sortedDocuments = useMemo(() => {
    return [...filteredDocuments].sort((a, b) =>
      b.createdAt.localeCompare(a.createdAt),
    );
  }, [filteredDocuments]);

  // Determine whether to show the Category Folders layout
  // Only show when there is no search query, selected tab is "All", and no category is selected
  const showFolders =
    searchQuery.trim() === "" &&
    selectedTab === "All" &&
    selectedCategory === null;

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
              <Pressable
                onPress={() => setViewMode("grid")}
                accessibilityLabel="Grid view"
                className={`w-9 h-9 items-center justify-center rounded-lg ${
                  viewMode === "grid" ? "bg-soft-accent" : "bg-transparent"
                }`}
              >
                <Feather
                  name="grid"
                  size={20}
                  color={viewMode === "grid" ? colors.accent : "#727272"}
                />
              </Pressable>
              <Pressable
                onPress={() => setViewMode("list")}
                accessibilityLabel="List view"
                className={`w-9 h-9 items-center justify-center rounded-lg ${
                  viewMode === "list" ? "bg-soft-accent" : "bg-transparent"
                }`}
              >
                <Feather
                  name="list"
                  size={20}
                  color={viewMode === "list" ? colors.accent : "#727272"}
                />
              </Pressable>
            </View>
          </View>

          {/* Search bar */}
          <View className="px-6 mb-6">
            <View className="flex-row items-center bg-surface rounded-xl border border-border px-4 py-1">
              <Feather name="search" size={18} color={colors.secondary} />
              <TextInput
                value={searchQuery}
                onChangeText={(text) => {
                  setSearchQuery(text);
                  // Clearing category filter if typing to search across all folders
                  if (selectedCategory && text !== "") {
                    setSelectedCategory(null);
                  }
                }}
                placeholder="Search documents..."
                placeholderTextColor={colors.secondary}
                className="flex-1 text-body-md text-primary ml-3 h-11"
              />
              {searchQuery.length > 0 && (
                <Pressable
                  onPress={() => setSearchQuery("")}
                  hitSlop={8}
                  className="w-8 h-8 items-center justify-center"
                >
                  <Feather name="x" size={16} color={colors.secondary} />
                </Pressable>
              )}
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
                    <Pressable
                      key={tab}
                      onPress={() => {
                        setSelectedTab(tab);
                        // Clear category filter when switching tabs to ensure clean results
                        if (selectedCategory && tab !== "All") {
                          setSelectedCategory(null);
                        }
                      }}
                      className={`mr-2.5 px-5 py-2.5 rounded-full border ${
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
                    </Pressable>
                  );
                },
              )}
            </ScrollView>
          </View>

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
                <Pressable
                  onPress={() => setSelectedCategory(null)}
                  hitSlop={8}
                  className="flex-row items-center bg-surface border border-border/60 rounded-lg px-2 py-1 active:bg-border/20"
                >
                  <Feather
                    name="arrow-left"
                    size={12}
                    color={colors.secondary}
                  />
                  <Text className="text-caption text-secondary ml-1 font-medium">
                    Back
                  </Text>
                </Pressable>
              </View>
            </View>
          )}

          {/* Category Folders layout */}
          {showFolders && (
            <View className="px-6 mb-6">
              <View
                className="bg-surface rounded-2xl border border-border/40 overflow-hidden"
                style={styles.foldersShadow}
              >
                {CATEGORIES.map((cat, index) => {
                  const count = categoryCounts[cat.name] || 0;
                  const isLast = index === CATEGORIES.length - 1;
                  return (
                    <Pressable
                      key={cat.name}
                      onPress={() => setSelectedCategory(cat.name)}
                      className="flex-row items-center px-4 py-4 active:bg-background border-b border-border/40"
                      style={isLast ? { borderBottomWidth: 0 } : undefined}
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
                          {cat.label}
                        </Text>
                        <Text className="text-caption text-secondary mt-0.5">
                          {count} {count === 1 ? "item" : "items"}
                        </Text>
                      </View>
                      <Feather name="chevron-right" size={20} color="#B3B3B3" />
                    </Pressable>
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
              <View className="flex-row flex-wrap px-4">
                {sortedDocuments.map((doc) => (
                  <View key={doc.id} style={{ width: "50%" }}>
                    <DocumentCard
                      doc={doc}
                      viewMode="grid"
                      onPress={() =>
                        router.push({
                          pathname: "/document/[id]",
                          params: { id: doc.id },
                        } as never)
                      }
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
                  <DocumentCard
                    key={doc.id}
                    doc={doc}
                    viewMode="list"
                    onPress={() =>
                      router.push({
                        pathname: "/document/[id]",
                        params: { id: doc.id },
                      } as never)
                    }
                    onFavoritePress={() => toggleFavorite(doc.id)}
                  />
                ))}
              </View>
            )
          ) : (
            (() => {
              if (documents.length === 0) {
                return (
                  <EmptyState
                    icon="document-text-outline"
                    title="Your vault is empty"
                    message="Start by adding a document"
                    actionLabel="Add Document"
                    onAction={() => router.push("/add-document" as never)}
                  />
                );
              }
              if (searchQuery.trim()) {
                return (
                  <EmptyState
                    icon="search-outline"
                    title="No results found"
                    message="Try a different search term"
                    actionLabel="Clear Search"
                    onAction={() => setSearchQuery("")}
                  />
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
                    setSearchQuery("");
                    setSelectedTab("All");
                    setSelectedCategory(null);
                  }}
                />
              );
            })()
          )}
        </ScrollView>

        {/* Floating Action Button (FAB) */}
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
});

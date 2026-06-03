import React, { useState, useEffect, useRef, useMemo } from "react";
import {
  View,
  Text,
  TextInput,
  Pressable,
  ScrollView,
  StyleSheet,
} from "react-native";
import { useRouter } from "expo-router";
import { Feather, Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { isToday, isYesterday, parseISO } from "date-fns";

import { useDocumentStore } from "@/store/documentStore";
import { formatDate } from "@/lib/date";
import { colors } from "@/theme/tokens";
import EmptyState from "@/components/EmptyState";
import ExpiryBadge from "@/components/ExpiryBadge";
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

// Custom text highlighter to bold the matching substring
function HighlightedText({ text, query }: { text: string; query: string }) {
  if (!query.trim()) {
    return (
      <Text numberOfLines={1} className="text-body-lg text-primary font-medium">
        {text}
      </Text>
    );
  }

  const escapedQuery = query.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const regex = new RegExp(`(${escapedQuery})`, "gi");
  const parts = text.split(regex);

  return (
    <Text numberOfLines={1} className="text-body-lg text-primary font-medium">
      {parts.map((part, index) => {
        const isMatch = part.toLowerCase() === query.toLowerCase();
        return (
          <Text
            key={index}
            className={isMatch ? "font-bold text-primary" : "font-medium text-primary"}
            style={isMatch ? { fontWeight: "700" } : { fontWeight: "500" }}
          >
            {part}
          </Text>
        );
      })}
    </Text>
  );
}

export default function SearchScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const inputRef = useRef<TextInput>(null);

  const { documents, toggleFavorite } = useDocumentStore();
  const [query, setQuery] = useState("");
  const [recentSearches, setRecentSearches] = useState<string[]>([]);

  // 1. Load recent searches on mount
  useEffect(() => {
    const loadRecent = async () => {
      try {
        const stored = await AsyncStorage.getItem("zentra_recent_searches");
        if (stored) {
          const parsed = JSON.parse(stored);
          if (Array.isArray(parsed) && parsed.every((item) => typeof item === "string")) {
            setRecentSearches(parsed);
          }
        }
      } catch (error) {
        console.error("Failed to load recent searches", error);
      }
    };
    loadRecent();
  }, []);

  // 2. Focus input on mount
  useEffect(() => {
    inputRef.current?.focus();
    // Re-verify focus after a brief delay for transition smoothness
    const timer = setTimeout(() => {
      inputRef.current?.focus();
    }, 150);
    return () => clearTimeout(timer);
  }, []);

  // 3. Save search query to history (max 5, deduplicated)
  const saveSearchQuery = (searchQuery: string) => {
    const trimmed = searchQuery.trim();
    if (!trimmed) return;

    setRecentSearches((prev) => {
      const filtered = prev.filter(
        (item) => item.toLowerCase() !== trimmed.toLowerCase()
      );
      const updated = [trimmed, ...filtered].slice(0, 5);
      void AsyncStorage.setItem(
        "zentra_recent_searches",
        JSON.stringify(updated)
      );
      return updated;
    });
  };

  const handleSearchSubmit = () => {
    saveSearchQuery(query);
  };

  // 4. Debounce: Save search query to history when user stops typing for 300ms
  useEffect(() => {
    const trimmed = query.trim();
    if (!trimmed) return;

    const timer = setTimeout(() => {
      saveSearchQuery(trimmed);
    }, 300);

    return () => clearTimeout(timer);
  }, [query]);

  // 4. Search logic: filters documents by name, category, notes, and expiryDate formatted via formatDate
  const searchResults = useMemo(() => {
    const trimmed = query.trim();
    if (!trimmed) return [];
    const q = trimmed.toLowerCase();

    return documents.filter((doc) => {
      if (doc.isDeleted) return false;
      const formattedExpiry = formatDate(doc.expiryDate).toLowerCase();
      return (
        doc.name.toLowerCase().includes(q) ||
        doc.category.toLowerCase().includes(q) ||
        (doc.notes ?? "").toLowerCase().includes(q) ||
        formattedExpiry.includes(q)
      );
    });
  }, [query, documents]);

  const handleClearRecent = async () => {
    setRecentSearches([]);
    try {
      await AsyncStorage.removeItem("zentra_recent_searches");
    } catch (error) {
      console.error("Failed to clear recent searches", error);
    }
  };

  const handleRecentPress = (item: string) => {
    setQuery(item);
    inputRef.current?.focus();
  };

  const goBack = () => {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace("/(tabs)");
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      {/* Navigation & Search Header */}
      <View
        className="flex-row items-center px-6 pb-4 bg-surface border-b border-border/20"
        style={{ paddingTop: insets.top > 0 ? insets.top : 16 }}
      >
        <Pressable
          onPress={goBack}
          hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
          accessibilityRole="button"
          accessibilityLabel="Go back"
          className="w-10 h-10 items-center justify-center rounded-full active:bg-background mr-2"
        >
          <Feather name="arrow-left" size={24} color={colors.primary} />
        </Pressable>

        {/* Input Wrapper */}
        <View className="flex-1 flex-row items-center bg-background rounded-full border border-border px-3 py-1.5 h-10">
          <Feather name="search" size={16} color={colors.secondary} />
          <TextInput
            ref={inputRef}
            value={query}
            onChangeText={setQuery}
            placeholder="Search documents..."
            placeholderTextColor={colors.secondary}
            accessibilityLabel="Search documents"
            className="flex-1 text-body-md text-primary ml-2 h-9"
            style={{ paddingVertical: 0 }}
            autoCapitalize="none"
            autoCorrect={false}
            returnKeyType="search"
            onSubmitEditing={handleSearchSubmit}
          />
          {query.length > 0 && (
            <Pressable
              onPress={() => setQuery("")}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              accessibilityRole="button"
              accessibilityLabel="Clear search query"
              className="w-8 h-8 items-center justify-center rounded-full active:bg-border/20"
            >
              <Feather name="x" size={16} color={colors.secondary} />
            </Pressable>
          )}
        </View>
      </View>

      {/* Screen Content */}
      <ScrollView
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{
          paddingVertical: 24,
          paddingBottom: 40 + insets.bottom,
        }}
      >
        {!query.trim() ? (
          // Recent Searches State
          recentSearches.length > 0 ? (
            <View className="mx-6">
              <View className="flex-row justify-between items-center mb-4">
                <Text className="text-h2 text-primary font-bold">Recent Searches</Text>
                <Pressable
                  onPress={handleClearRecent}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                  accessibilityRole="button"
                  accessibilityLabel="Clear recent search history"
                  className="active:opacity-75"
                >
                  <Text className="text-body-md text-accent font-semibold">Clear</Text>
                </Pressable>
              </View>

              <View
                className="bg-surface border border-border/40 overflow-hidden rounded-2xl"
                style={styles.listShadow}
              >
                {recentSearches.map((item, index) => (
                  <Pressable
                    key={index}
                    onPress={() => handleRecentPress(item)}
                    accessibilityRole="button"
                    accessibilityLabel={`Search for ${item}`}
                    className="flex-row items-center px-4 py-3 bg-surface active:bg-background border-b border-border/40"
                    style={
                      index === recentSearches.length - 1
                        ? { borderBottomWidth: 0 }
                        : undefined
                    }
                  >
                    <Feather name="clock" size={16} color={colors.secondary} />
                    <Text className="text-body-lg text-primary flex-1 ml-3 font-medium">
                      {item}
                    </Text>
                    <Feather name="arrow-up-left" size={16} color={colors.secondary} />
                  </Pressable>
                ))}
              </View>
            </View>
          ) : null
        ) : searchResults.length > 0 ? (
          // Search Results List
          <View className="mx-6">
            <Text className="text-h2 text-primary mb-4 font-bold">
              Search Results ({searchResults.length})
            </Text>
            <View
              className="bg-surface border border-border/40 overflow-hidden rounded-2xl"
              style={styles.listShadow}
            >
              {searchResults.map((doc, index) => {
                const { iconName, iconColor, bgColor } = getFileVisuals(doc.fileType);
                const dateStr = formatAddedDate(doc.createdAt);
                const sizeStr = doc.sizeLabel || "1.0 MB";

                return (
                  <Pressable
                    key={doc.id}
                    onPress={() => {
                      saveSearchQuery(query);
                      router.push({
                        pathname: "/document/[id]",
                        params: { id: doc.id },
                      } as never);
                    }}
                    accessibilityRole="button"
                    accessibilityLabel={`Open ${doc.name}`}
                    className="flex-row items-center px-4 py-3 bg-surface active:bg-background border-b border-border/40"
                    style={
                      index === searchResults.length - 1
                        ? { borderBottomWidth: 0 }
                        : undefined
                    }
                  >
                    {/* Visual Icon */}
                    <View
                      className="w-11 h-11 rounded-xl items-center justify-center"
                      style={{ backgroundColor: bgColor }}
                    >
                      <Feather name={iconName} size={22} color={iconColor} />
                    </View>

                    {/* Metadata Content */}
                    <View className="flex-1 ml-3 mr-2">
                      <HighlightedText text={doc.name} query={query} />
                      <View className="flex-row items-center flex-wrap gap-2 mt-0.5">
                        <Text className="text-caption text-secondary">
                          {sizeStr} • {dateStr}
                        </Text>
                        <ExpiryBadge expiryDate={doc.expiryDate} hideSafe={true} />
                      </View>
                    </View>

                    {/* Favorite Button */}
                    <Pressable
                      onPress={() => toggleFavorite(doc.id)}
                      hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
                      accessibilityRole="button"
                      accessibilityLabel={
                        doc.isFavorite ? "Remove from favorites" : "Add to favorites"
                      }
                      className="w-9 h-9 rounded-full items-center justify-center active:bg-border/20"
                    >
                      <Ionicons
                        name={doc.isFavorite ? "star" : "star-outline"}
                        size={20}
                        color={doc.isFavorite ? colors.warning : colors.secondary}
                      />
                    </Pressable>
                  </Pressable>
                );
              })}
            </View>
          </View>
        ) : (
          // Empty State
          <EmptyState
            icon="search-outline"
            title={`No results for "${query}"`}
            message="Try searching by name, category, or expiry month"
          />
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  listShadow: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 3,
    elevation: 1,
  },
});

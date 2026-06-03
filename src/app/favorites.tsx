import React from "react";
import { View, Text, Pressable, ScrollView, StyleSheet } from "react-native";
import { useRouter } from "expo-router";
import { Feather } from "@expo/vector-icons";
import { colors } from "@/theme/tokens";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useDocumentStore } from "@/store/documentStore";
import DocumentCard from "@/components/DocumentCard";
import EmptyState from "@/components/EmptyState";

export default function FavoritesScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { documents, toggleFavorite } = useDocumentStore();

  const goBack = () => {
    if (router.canGoBack()) {
      router.back();
      return;
    }
    router.replace("/(tabs)");
  };

  const favoriteDocs = documents.filter((doc) => doc.isFavorite && !doc.isDeleted);

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      {/* Navigation Header */}
      <View
        className="flex-row justify-between items-center px-6 pb-4 bg-surface border-b border-border/20"
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
        <Text className="text-h2 text-primary font-bold">Favorites</Text>
        <View className="w-10 h-10" />
      </View>

      {favoriteDocs.length > 0 ? (
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{
            paddingVertical: 24,
            paddingBottom: 40 + insets.bottom,
          }}
        >
          <View
            className="mx-6 bg-surface border border-border/40 overflow-hidden rounded-2xl"
            style={styles.listShadow}
          >
            {favoriteDocs.map((doc) => (
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
        </ScrollView>
      ) : (
        <EmptyState
          icon="star-outline"
          title="No Favorites Yet"
          message="Tap the star icon on any document to save it here for quick access."
          actionLabel="Browse Documents"
          onAction={() => router.replace("/(tabs)/documents")}
        />
      )}
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


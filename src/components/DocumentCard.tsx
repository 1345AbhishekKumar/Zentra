import { formatAddedDate } from "@/lib/date";
import { colors } from "@/theme/tokens";
import { ZentraDocument } from "@/types";
import { Feather, Ionicons } from "@expo/vector-icons";
import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import ExpiryBadge from "./ExpiryBadge";
import ScalePressable from "./ScalePressable";
import { getFileVisuals } from "@/lib/visuals";

interface DocumentCardProps {
  doc: ZentraDocument;
  viewMode?: "list" | "grid";
  onPress: () => void;
  onFavoritePress: () => void;
  isSelectionMode?: boolean;
  isSelected?: boolean;
  onLongPress?: () => void;
  hideExpirySafe?: boolean;
}

export default function DocumentCard({
  doc,
  viewMode = "list",
  onPress,
  onFavoritePress,
  isSelectionMode = false,
  isSelected = false,
  onLongPress,
  hideExpirySafe = true,
}: DocumentCardProps) {
  const { iconName, iconColor, bgColor } = getFileVisuals(doc.fileType);
  const dateStr = formatAddedDate(doc.createdAt);
  const sizeStr = doc.sizeLabel || "1.0 MB";

  if (viewMode === "grid") {
    return (
      <ScalePressable
        onPress={onPress}
        onLongPress={onLongPress}
        delayLongPress={200}
        accessibilityRole="button"
        accessibilityLabel={`Open ${doc.name}`}
        className="bg-surface rounded-2xl p-4 border border-border/60 active:opacity-90 flex-1 m-1.5"
        style={styles.cardShadow}
      >
        <View className="flex-row justify-between items-start mb-3">
          <View
            className="w-11 h-11 rounded-xl items-center justify-center"
            style={{ backgroundColor: bgColor }}
          >
            <Feather name={iconName} size={22} color={iconColor} />
          </View>
          {isSelectionMode ? (
            <View className="w-8 h-8 items-center justify-center">
              <Feather
                name={isSelected ? "check-circle" : "circle"}
                size={20}
                color={isSelected ? colors.accent : colors.secondary}
              />
            </View>
          ) : (
            <Pressable
              onPress={onFavoritePress}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              accessibilityRole="button"
              accessibilityLabel={
                doc.isFavorite ? "Remove from favorites" : "Add to favorites"
              }
              className="w-8 h-8 rounded-full items-center justify-center bg-transparent active:bg-border/20"
            >
              <Ionicons
                name={doc.isFavorite ? "star" : "star-outline"}
                size={18}
                color={doc.isFavorite ? colors.warning : colors.secondary}
              />
            </Pressable>
          )}
        </View>

        <Text
          numberOfLines={1}
          className="text-body-lg text-primary font-semibold mb-1"
        >
          {doc.name}
        </Text>

        <Text className="text-caption text-secondary mb-2">
          {sizeStr} • {dateStr}
        </Text>

        <View className="self-start">
          <ExpiryBadge expiryDate={doc.expiryDate} hideSafe={hideExpirySafe} />
        </View>
      </ScalePressable>
    );
  }

  // List view mode (Default)
  return (
    <ScalePressable
      onPress={onPress}
      onLongPress={onLongPress}
      delayLongPress={200}
      accessibilityRole="button"
      accessibilityLabel={`Open ${doc.name}`}
      className="flex-row items-center px-4 py-3 bg-surface active:bg-background border-b border-border/40"
    >
      <View
        className="w-11 h-11 rounded-xl items-center justify-center"
        style={{ backgroundColor: bgColor }}
      >
        <Feather name={iconName} size={22} color={iconColor} />
      </View>

      <View className="flex-1 ml-3 mr-2">
        <Text
          numberOfLines={1}
          className="text-body-lg text-primary font-medium"
        >
          {doc.name}
        </Text>
        <View className="flex-row items-center flex-wrap gap-2 mt-0.5">
          <Text className="text-caption text-secondary">
            {sizeStr} • {dateStr}
          </Text>
          <ExpiryBadge expiryDate={doc.expiryDate} hideSafe={hideExpirySafe} />
        </View>
      </View>

      {isSelectionMode ? (
        <View className="w-9 h-9 items-center justify-center mr-1">
          <Feather
            name={isSelected ? "check-circle" : "circle"}
            size={22}
            color={isSelected ? colors.accent : colors.secondary}
          />
        </View>
      ) : (
        <Pressable
          onPress={onFavoritePress}
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
      )}
    </ScalePressable>
  );
}

const styles = StyleSheet.create({
  cardShadow: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
    elevation: 1,
  },
});

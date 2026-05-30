import React from "react";
import { View, Text, Pressable, StyleSheet } from "react-native";
import { Feather } from "@expo/vector-icons";
import { ZentraDocument } from "@/types";
import { colors } from "@/theme/tokens";
import { formatDate } from "@/lib/date";
import ExpiryBadge from "./ExpiryBadge";
import { parseISO, isToday, isYesterday } from "date-fns";

interface DocumentCardProps {
  doc: ZentraDocument;
  viewMode?: "list" | "grid";
  onPress: () => void;
  onFavoritePress: () => void;
}

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
        iconColor: colors.danger, // #EF4444
        bgColor: "#FEF2F2",
      };
    case "image":
      return {
        iconName: "image",
        iconColor: colors.success, // #22C55E
        bgColor: "#F0FDF4",
      };
    case "doc":
      return {
        iconName: "file-text",
        iconColor: "#3B82F6", // Blue
        bgColor: "#EFF6FF",
      };
    case "other":
    default:
      return {
        iconName: "file",
        iconColor: colors.warning, // #F59E0B
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

export default function DocumentCard({
  doc,
  viewMode = "list",
  onPress,
  onFavoritePress,
}: DocumentCardProps) {
  const { iconName, iconColor, bgColor } = getFileVisuals(doc.fileType);
  const dateStr = formatAddedDate(doc.createdAt);
  const sizeStr = doc.sizeLabel || "1.0 MB";

  if (viewMode === "grid") {
    return (
      <Pressable
        onPress={onPress}
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
          <Pressable
            onPress={onFavoritePress}
            hitSlop={8}
            accessibilityLabel={doc.isFavorite ? "Remove from favorites" : "Add to favorites"}
            className="w-8 h-8 rounded-full items-center justify-center bg-transparent active:bg-border/20"
          >
            <Feather
              name="star"
              size={18}
              color={doc.isFavorite ? "#F59E0B" : colors.secondary}
              className={doc.isFavorite ? "fill-[#F59E0B]" : ""}
              style={doc.isFavorite ? { transform: [{ scale: 1.05 }] } : undefined}
            />
          </Pressable>
        </View>

        <Text numberOfLines={1} className="text-body-lg text-primary font-semibold mb-1">
          {doc.name}
        </Text>

        <Text className="text-caption text-secondary mb-2">
          {sizeStr} • {dateStr}
        </Text>

        <View className="self-start">
          <ExpiryBadge expiryDate={doc.expiryDate} hideSafe={true} />
        </View>
      </Pressable>
    );
  }

  // List view mode (Default)
  return (
    <Pressable
      onPress={onPress}
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
        <Text numberOfLines={1} className="text-body-lg text-primary font-medium">
          {doc.name}
        </Text>
        <View className="flex-row items-center flex-wrap gap-2 mt-0.5">
          <Text className="text-caption text-secondary">
            {sizeStr}  •  {dateStr}
          </Text>
          <ExpiryBadge expiryDate={doc.expiryDate} hideSafe={true} />
        </View>
      </View>

      <Pressable
        onPress={onFavoritePress}
        hitSlop={12}
        accessibilityLabel={doc.isFavorite ? "Remove from favorites" : "Add to favorites"}
        className="w-9 h-9 rounded-full items-center justify-center active:bg-border/20"
      >
        <Feather
          name="star"
          size={20}
          color={doc.isFavorite ? "#F59E0B" : "#B3B3B3"}
          className={doc.isFavorite ? "fill-[#F59E0B]" : ""}
        />
      </Pressable>
    </Pressable>
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

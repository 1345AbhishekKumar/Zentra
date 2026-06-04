import React from "react";
import { View, Text, Pressable, StyleSheet } from "react-native";
import { Feather } from "@expo/vector-icons";
import { colors } from "@/theme/tokens";
import { ZentraDocument } from "@/types";
import ScalePressable from "@/components/ScalePressable";
import ExpiryBadge from "@/components/ExpiryBadge";
import { getDocVisuals } from "@/lib/visuals";
import { formatAddedDate } from "@/lib/date";

interface RecentDocRowProps {
  doc: ZentraDocument;
  isLast: boolean;
  onPress: () => void;
  onMorePress: () => void;
  isSelectionMode?: boolean;
  isSelected?: boolean;
  onLongPress?: () => void;
  sortMode?: "added" | "expiry";
}

export default function RecentDocRow({
  doc,
  isLast,
  onPress,
  onMorePress,
  isSelectionMode = false,
  isSelected = false,
  onLongPress,
  sortMode = "expiry",
}: RecentDocRowProps) {
  const { iconName, iconColor, bgColor } = getDocVisuals(
    doc.name,
    doc.category,
    doc.fileType,
  );
  const meta = `${formatAddedDate(doc.createdAt)} • ${doc.sizeLabel || "1.0 MB"}`;

  return (
    <ScalePressable
      onPress={onPress}
      onLongPress={onLongPress}
      delayLongPress={200}
      accessibilityRole="button"
      accessibilityLabel={`Open ${doc.name}`}
      className="flex-row items-center px-4 py-3 active:bg-background"
      style={!isLast ? styles.rowBorder : undefined}
      activeScale={0.98}
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
        <View className="flex-row items-center flex-wrap gap-2 mt-0.5">
          <Text className="text-caption text-secondary">{meta}</Text>
          {sortMode === "expiry" && (
            <ExpiryBadge expiryDate={doc.expiryDate} hideSafe={false} />
          )}
        </View>
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
    </ScalePressable>
  );
}

const styles = StyleSheet.create({
  rowBorder: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "#F0F0F2",
  },
});

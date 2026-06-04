import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { Feather } from "@expo/vector-icons";
import { colors } from "@/theme/tokens";
import { ZentraDocument } from "@/types";
import ScalePressable from "@/components/ScalePressable";
import { getDocVisuals } from "@/lib/visuals";

interface QuickAccessCardProps {
  doc: ZentraDocument;
  onPress: () => void;
  isSelectionMode?: boolean;
  isSelected?: boolean;
  onLongPress?: () => void;
}

export default function QuickAccessCard({
  doc,
  onPress,
  isSelectionMode = false,
  isSelected = false,
  onLongPress,
}: QuickAccessCardProps) {
  const { iconName, iconColor, bgColor } = getDocVisuals(
    doc.name,
    doc.category,
    doc.fileType,
  );
  const label = doc.name.replace(/\.[^/.]+$/, "");
  const meta = `${doc.fileType.toUpperCase()} • ${doc.sizeLabel || "1.0 MB"}`;

  return (
    <ScalePressable
      onPress={onPress}
      onLongPress={onLongPress}
      delayLongPress={200}
      accessibilityRole="button"
      accessibilityLabel={`Open ${doc.name}`}
      className="bg-surface rounded-2xl p-4 mr-3 active:opacity-90"
      style={styles.quickCard}
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
    </ScalePressable>
  );
}

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
});

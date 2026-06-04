import React from "react";
import { View, Text, Pressable, ScrollView } from "react-native";
import { Feather } from "@expo/vector-icons";
import { colors } from "@/theme/tokens";

interface NotificationChipsProps {
  chips: number[];
  selectedDays: number[];
  onToggle: (day: number) => void;
  onRemoveCustom: (day: number) => void;
  onAddCustom: () => void;
  isDefaultChip: (day: number) => boolean;
}

export default function NotificationChips({
  chips,
  selectedDays,
  onToggle,
  onRemoveCustom,
  onAddCustom,
  isDefaultChip,
}: NotificationChipsProps) {
  return (
    <View className="px-4 py-4 border-b border-border/30">
      <Text className="text-body-md font-medium text-primary mb-3">
        Remind me before expiry
      </Text>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ gap: 8, paddingRight: 16 }}
      >
        {chips.map((day) => {
          const isSelected = selectedDays.includes(day);
          const isCustom = !isDefaultChip(day);

          return (
            <View
              key={day}
              className={`flex-row items-center rounded-full border min-h-11 ${
                isSelected
                  ? "bg-accent border-accent"
                  : "bg-surface border-border"
              }`}
            >
              <Pressable
                onPress={() => onToggle(day)}
                accessibilityRole="button"
                accessibilityLabel={`Toggle ${day} days reminder`}
                accessibilityState={{ selected: isSelected }}
                className={`justify-center rounded-full ${
                  isCustom ? "pl-4 pr-2 py-2.5" : "px-4 py-2.5"
                }`}
                style={({ pressed }) => [pressed && { opacity: 0.8 }]}
              >
                <Text
                  className={`text-body-md font-semibold ${
                    isSelected ? "text-white" : "text-primary"
                  }`}
                >
                  {day}d
                </Text>
              </Pressable>

              {isCustom && (
                <Pressable
                  onPress={() => onRemoveCustom(day)}
                  accessibilityRole="button"
                  accessibilityLabel={`Remove custom ${day} days reminder`}
                  className="pr-3 pl-1 py-2.5 justify-center rounded-r-full"
                  hitSlop={{ top: 10, bottom: 10, left: 5, right: 10 }}
                >
                  <Feather
                    name="x"
                    size={12}
                    color={isSelected ? "#FFFFFF" : colors.secondary}
                  />
                </Pressable>
              )}
            </View>
          );
        })}

        {/* Add Custom Chip */}
        <Pressable
          onPress={onAddCustom}
          accessibilityRole="button"
          accessibilityLabel="Add custom reminder days"
          className="px-4 rounded-full border border-dashed border-accent bg-soft-accent min-h-11 justify-center items-center flex-row gap-1"
          style={({ pressed }) => [pressed && { opacity: 0.8 }]}
        >
          <Feather name="plus" size={14} color={colors.accent} />
          <Text className="text-body-md font-semibold text-accent">
            Custom
          </Text>
        </Pressable>
      </ScrollView>
    </View>
  );
}

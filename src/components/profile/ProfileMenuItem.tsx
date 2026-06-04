import React from "react";
import { View, Text, Pressable } from "react-native";
import { Feather } from "@expo/vector-icons";
import { colors } from "@/theme/tokens";

type FeatherIconName = React.ComponentProps<typeof Feather>["name"];

interface ProfileMenuItemProps {
  icon: FeatherIconName;
  label: string;
  onPress: () => void;
  /** Icon and label color override. Defaults to colors.primary. */
  iconColor?: string;
  /** Text color class override. Defaults to "text-primary". */
  textColorClass?: string;
  /** Font weight class override. Defaults to "font-medium". */
  fontWeightClass?: string;
  /** Subtitle text shown below the label. */
  subtitle?: string;
  /** Badge content shown before the chevron. */
  badge?: React.ReactNode;
  /** Whether this item shows a bottom border. Defaults to false. */
  showBorder?: boolean;
}

export default function ProfileMenuItem({
  icon,
  label,
  onPress,
  iconColor = colors.primary,
  textColorClass = "text-primary",
  fontWeightClass = "font-medium",
  subtitle,
  badge,
  showBorder = false,
}: ProfileMenuItemProps) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={label}
      className={`flex-row items-center px-4 py-4 active:bg-background/50 ${
        showBorder ? "border-b border-border/30" : ""
      }`}
    >
      <Feather name={icon} size={20} color={iconColor} />
      {subtitle ? (
        <View className="ml-3 flex-1">
          <Text className={`text-body-lg ${fontWeightClass} ${textColorClass}`}>
            {label}
          </Text>
          <Text className="text-caption text-secondary mt-0.5 font-medium">
            {subtitle}
          </Text>
        </View>
      ) : (
        <Text className={`text-body-lg ml-3 ${fontWeightClass} flex-1 ${textColorClass}`}>
          {label}
        </Text>
      )}
      {badge}
      <Feather name="chevron-right" size={18} color="#C7C7CC" />
    </Pressable>
  );
}

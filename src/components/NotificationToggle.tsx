import React from "react";
import { View, Text, Switch, Alert, StyleSheet } from "react-native";
import { colors } from "@/theme/tokens";
import { hasPermission, requestPermissions } from "@/lib/notifications";
import { Feather } from "@expo/vector-icons";

type FeatherIconName = React.ComponentProps<typeof Feather>["name"];

interface NotificationToggleProps {
  documentId: string;
  enabled: boolean;
  onToggle: (enabled: boolean) => void;
  label?: string;
  icon?: FeatherIconName;
  iconSize?: number;
  iconColor?: string;
  textClassName?: string;
  className?: string;
}

export default function NotificationToggle({
  documentId,
  enabled,
  onToggle,
  label = "Notifications",
  icon,
  iconSize = 16,
  iconColor = "#8A8A8F",
  textClassName = "text-body-md text-secondary",
  className = "flex-row items-center justify-between w-full",
}: NotificationToggleProps) {
  const handleToggle = async (value: boolean) => {
    if (value) {
      const hasPerm = await hasPermission();
      if (!hasPerm) {
        const granted = await requestPermissions();
        if (!granted) {
          Alert.alert(
            "Notifications Disabled",
            "Please enable notifications in your device settings to receive expiry reminders."
          );
          return;
        }
      }
      onToggle(true);
    } else {
      onToggle(false);
    }
  };

  return (
    <View className={className}>
      <View className="flex-row items-center flex-1 mr-4">
        {icon && (
          <Feather
            name={icon}
            size={iconSize}
            color={iconColor}
            style={styles.iconMargin}
          />
        )}
        <Text className={textClassName}>{label}</Text>
      </View>
      <Switch
        value={enabled}
        onValueChange={handleToggle}
        trackColor={{ false: "#E5E7EB", true: colors.accent }}
        thumbColor={enabled ? "#FFFFFF" : "#F3F4F6"}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  iconMargin: {
    marginRight: 12,
  },
});

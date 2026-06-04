import React from "react";
import { View } from "react-native";
import { Feather } from "@expo/vector-icons";
import { colors } from "@/theme/tokens";

export type StatusType =
  | "success"
  | "error"
  | "warning"
  | "info"
  | "question"
  | "destructive";

interface StatusCircleProps {
  type: StatusType;
  size?: number;
  iconSize?: number;
}

export default function StatusCircle({
  type,
  size = 64,
  iconSize = 28,
}: StatusCircleProps) {
  let iconName: React.ComponentProps<typeof Feather>["name"] = "info";
  let iconColor = colors.accent;
  let iconBgColor = colors.accent + "1A";

  switch (type) {
    case "success":
      iconName = "check";
      iconColor = colors.success;
      iconBgColor = colors.success + "1A";
      break;
    case "error":
      iconName = "x";
      iconColor = colors.danger;
      iconBgColor = colors.danger + "1A";
      break;
    case "warning":
      iconName = "alert-triangle";
      iconColor = colors.warning;
      iconBgColor = colors.warning + "1A";
      break;
    case "destructive":
      iconName = "alert-triangle";
      iconColor = colors.danger;
      iconBgColor = colors.danger + "1A";
      break;
    case "question":
      iconName = "help-circle";
      iconColor = colors.accent;
      iconBgColor = colors.accent + "1A";
      break;
    case "info":
    default:
      iconName = "info";
      iconColor = colors.accent;
      iconBgColor = colors.accent + "1A";
      break;
  }

  return (
    <View
      style={{
        width: size,
        height: size,
        borderRadius: size / 2,
        backgroundColor: iconBgColor,
        alignItems: "center",
        justifyContent: "center",
      }}
      className="items-center justify-center"
    >
      <Feather name={iconName} size={iconSize} color={iconColor} />
    </View>
  );
}

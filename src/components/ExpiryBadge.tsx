import { expiryLabel, expiryUrgency } from "@/lib/date";
import { colors } from "@/theme/tokens";
import { Feather } from "@expo/vector-icons";
import React from "react";
import { Text, View } from "react-native";

interface ExpiryBadgeProps {
  expiryDate: string;
  hideSafe?: boolean;
}

export default function ExpiryBadge({
  expiryDate,
  hideSafe = false,
}: ExpiryBadgeProps) {
  const urgency = expiryUrgency(expiryDate);
  const label = expiryLabel(expiryDate);

  if (urgency === "safe" && hideSafe) {
    return null;
  }

  let bgClass = "";
  let textClass = "";
  let iconName: React.ComponentProps<typeof Feather>["name"] = "alert-circle";

  switch (urgency) {
    case "expired":
      bgClass = "bg-danger/10";
      textClass = "text-danger";
      iconName = "x-circle";
      break;
    case "critical":
      bgClass = "bg-danger/10";
      textClass = "text-danger font-semibold";
      iconName = "alert-triangle";
      break;
    case "warning":
      bgClass = "bg-warning/10";
      textClass = "text-warning font-semibold";
      iconName = "alert-circle";
      break;
    case "safe":
      bgClass = "bg-success/10";
      textClass = "text-success font-semibold";
      iconName = "check-circle";
      break;
    default:
      return null;
  }

  // Format label text: e.g. "Expired" or "Expires in 5 days" or "Expires today"
  let labelText = label;
  if (label === "Today" || label === "Tomorrow") {
    labelText = `Expires ${label.toLowerCase()}`;
  } else if (label.startsWith("In ")) {
    labelText = `Expires ${label.toLowerCase()}`;
  } else if (label !== "Expired") {
    labelText = `Expires ${label}`;
  }

  const colorMap: Record<typeof urgency, string> = {
    expired: colors.danger,
    critical: colors.danger,
    warning: colors.warning,
    safe: colors.success,
  };
  const resolvedColor = colorMap[urgency] || colors.secondary;

  return (
    <View
      accessible={true}
      accessibilityRole="text"
      accessibilityLabel={`Expiry status: ${expiryLabel(expiryDate)}`}
      className={`flex-row items-center px-2 py-0.5 rounded-full ${bgClass}`}
    >
      <Feather
        name={iconName}
        size={12}
        color={resolvedColor}
        className="mr-1"
      />
      <Text className={`text-caption ${textClass}`}>{labelText}</Text>
    </View>
  );
}

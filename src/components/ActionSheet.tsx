import React from "react";
import { Modal, Pressable, StyleSheet, Text, View } from "react-native";
import { Feather } from "@expo/vector-icons";
import { colors } from "@/theme/tokens";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import ScalePressable from "./ScalePressable";

type FeatherIconName = React.ComponentProps<typeof Feather>["name"];

interface ActionOption {
  label: string;
  icon: FeatherIconName;
  onPress: () => void;
  isDestructive?: boolean;
}

interface ActionSheetProps {
  visible: boolean;
  onClose: () => void;
  title?: string;
  options: ActionOption[];
}

export default function ActionSheet({
  visible,
  onClose,
  title,
  options,
}: ActionSheetProps) {
  const insets = useSafeAreaInsets();

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        {/* Click backdrop to dismiss */}
        <Pressable style={styles.flexOne} onPress={onClose} />

        {/* Bottom Sheet Card */}
        <View
          className="bg-surface rounded-t-[24px] overflow-hidden self-center shadow-lg w-full"
          style={{ maxWidth: 512 }}
        >
          {/* Header */}
          {title && (
            <View className="px-6 py-4 border-b border-border/40 bg-background items-center">
              <Text className="text-body-lg text-primary font-bold font-display">
                {title}
              </Text>
            </View>
          )}

          {/* Options */}
          <View className="px-4 py-2 bg-surface">
            {options.map((option, index) => {
              const isLast = index === options.length - 1;
              return (
                <ScalePressable
                  key={index}
                  onPress={() => {
                    onClose();
                    // Small delay to let modal close before action to avoid navigation issues
                    setTimeout(() => {
                      option.onPress();
                    }, 100);
                  }}
                  accessibilityRole="button"
                  accessibilityLabel={option.label}
                  className={`flex-row items-center px-4 py-4 active:bg-background ${
                    !isLast ? "border-b border-border/40" : ""
                  }`}
                >
                  <Feather
                    name={option.icon}
                    size={20}
                    color={option.isDestructive ? colors.danger : colors.primary}
                  />
                  <Text
                    className={`text-body-lg ml-3 font-semibold ${
                      option.isDestructive ? "text-danger" : "text-primary"
                    }`}
                  >
                    {option.label}
                  </Text>
                </ScalePressable>
              );
            })}
          </View>

          {/* Cancel button */}
          <View className="px-4 pb-4 bg-surface">
            <ScalePressable
              onPress={onClose}
              accessibilityRole="button"
              accessibilityLabel="Cancel"
              className="w-full bg-background border border-border py-4 rounded-xl items-center justify-center active:opacity-75 min-h-[52px]"
            >
              <Text className="text-body-lg font-bold text-primary font-display font-semibold">
                Cancel
              </Text>
            </ScalePressable>
          </View>

          {/* Safe Area spacer */}
          <View
            style={{
              height: Math.max(insets.bottom, 16),
              backgroundColor: colors.surface,
            }}
          />
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    width: "100%",
    height: "100%",
    backgroundColor: "rgba(18, 18, 26, 0.4)",
    justifyContent: "flex-end",
  },
  flexOne: {
    flex: 1,
  },
});

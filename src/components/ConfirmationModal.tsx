import React from "react";
import { Modal, Pressable, StyleSheet, Text, View } from "react-native";
import { Feather } from "@expo/vector-icons";
import { colors } from "@/theme/tokens";

interface ConfirmationModalProps {
  visible: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  isDestructive?: boolean;
}

export default function ConfirmationModal({
  visible,
  onClose,
  onConfirm,
  title,
  message,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  isDestructive = false,
}: ConfirmationModalProps) {
  const iconName = isDestructive ? "alert-triangle" : "help-circle";
  const iconColor = isDestructive ? colors.danger : colors.accent;
  const iconBgColor = isDestructive ? "#FEF2F2" : "#EEF2FF";
  const confirmBtnBgClass = isDestructive ? "bg-danger" : "bg-accent";

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay} className="flex-1 items-center justify-center px-6">
        <View 
          className="bg-surface w-full p-6 rounded-2xl border border-border/40 items-center shadow-lg"
          style={{ maxWidth: 340 }}
        >
          {/* Circular Header Icon */}
          <View 
            className="w-16 h-16 rounded-full items-center justify-center mb-4"
            style={{ backgroundColor: iconBgColor }}
          >
            <Feather name={iconName} size={28} color={iconColor} />
          </View>

          {/* Title */}
          <Text className="text-h2 text-primary font-bold text-center mb-2 font-display">
            {title}
          </Text>

          {/* Description Message */}
          <Text className="text-body-md text-secondary text-center mb-6 leading-relaxed">
            {message}
          </Text>

          {/* Action Buttons */}
          <View className="flex-row w-full gap-3">
            <Pressable
              onPress={onClose}
              accessibilityRole="button"
              accessibilityLabel={cancelLabel}
              className="flex-1 bg-background border border-border py-3.5 rounded-xl items-center justify-center active:opacity-75 min-h-[48px]"
            >
              <Text className="text-body-md font-bold text-primary font-display">
                {cancelLabel}
              </Text>
            </Pressable>
            <Pressable
              onPress={() => {
                onClose();
                // Brief delay to allow modal dismiss animations to finish cleanly
                setTimeout(() => {
                  onConfirm();
                }, 100);
              }}
              accessibilityRole="button"
              accessibilityLabel={confirmLabel}
              className={`flex-1 py-3.5 rounded-xl items-center justify-center active:opacity-85 min-h-[48px] ${confirmBtnBgClass}`}
            >
              <Text className="text-body-md font-bold text-white font-display">
                {confirmLabel}
              </Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(18, 18, 26, 0.4)",
  },
});

import React, { useEffect, useRef } from "react";
import { Modal, StyleSheet, Text, View } from "react-native";
import ScalePressable from "./ScalePressable";
import StatusCircle from "./StatusCircle";

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
  const confirmBtnBgClass = isDestructive ? "bg-danger" : "bg-accent";
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (!visible && timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
  }, [visible]);

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
          <View className="mb-4">
            <StatusCircle type={isDestructive ? "destructive" : "question"} />
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
            <ScalePressable
              onPress={onClose}
              accessibilityRole="button"
              accessibilityLabel={cancelLabel}
              className="flex-1 bg-background border border-border py-3.5 rounded-xl items-center justify-center active:opacity-75 min-h-[48px]"
            >
              <Text className="text-body-md text-primary font-display font-semibold">
                {cancelLabel}
              </Text>
            </ScalePressable>
            <ScalePressable
              onPress={() => {
                onClose();
                if (timeoutRef.current) clearTimeout(timeoutRef.current);
                timeoutRef.current = setTimeout(() => {
                  onConfirm();
                }, 100);
              }}
              accessibilityRole="button"
              accessibilityLabel={confirmLabel}
              className={`flex-1 py-3.5 rounded-xl items-center justify-center active:opacity-85 min-h-[48px] ${confirmBtnBgClass}`}
            >
              <Text className="text-body-md text-white font-display font-semibold">
                {confirmLabel}
              </Text>
            </ScalePressable>
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

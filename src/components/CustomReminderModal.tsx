import React, { useState } from "react";
import {
  View,
  Text,
  Modal,
  TextInput,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import ScalePressable from "@/components/ScalePressable";
import { colors } from "@/theme/tokens";
import { showAlert } from "@/store/alertStore";

interface CustomReminderModalProps {
  visible: boolean;
  onClose: () => void;
  onAdd: (days: number) => void;
}

export default function CustomReminderModal({ visible, onClose, onAdd }: CustomReminderModalProps) {
  const [customDaysInput, setCustomDaysInput] = useState("");

  const handleAdd = () => {
    const daysVal = parseInt(customDaysInput.trim(), 10);
    if (isNaN(daysVal) || daysVal <= 0 || daysVal > 365) {
      showAlert("Validation Error", "Please enter a valid number of days between 1 and 365.", "warning");
      return;
    }
    onAdd(daysVal);
    setCustomDaysInput("");
  };

  const handleCancel = () => {
    setCustomDaysInput("");
    onClose();
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={handleCancel}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={{ flex: 1 }}
      >
        <View style={{ flex: 1, backgroundColor: "rgba(0, 0, 0, 0.4)" }} className="flex-1 items-center justify-center px-6">
          <View className="bg-surface w-full p-6 rounded-2xl border border-border/40" style={{
            shadowColor: "#000",
            shadowOffset: { width: 0, height: 1 },
            shadowOpacity: 0.04,
            shadowRadius: 4,
            elevation: 1,
          }}>
            <Text className="text-h2 text-primary font-bold mb-2">Add Custom Reminder</Text>
            <Text className="text-body-md text-secondary mb-4">
              Enter the number of days before expiry to receive a reminder alert.
            </Text>

            <TextInput
              value={customDaysInput}
              onChangeText={setCustomDaysInput}
              keyboardType="number-pad"
              accessibilityLabel="Number of days before expiry"
              className="w-full bg-background border border-border rounded-xl px-4 py-3 text-body-lg text-primary mb-6"
              placeholder="e.g. 15"
              placeholderTextColor={colors.secondary}
              autoFocus
            />

            <View className="flex-row gap-3">
              <ScalePressable
                onPress={handleCancel}
                accessibilityRole="button"
                accessibilityLabel="Cancel adding custom reminder"
                className="flex-1 bg-background border border-border py-3 rounded-xl items-center justify-center active:opacity-75 min-h-11"
              >
                <Text className="text-body-lg font-semibold text-primary">Cancel</Text>
              </ScalePressable>
              <ScalePressable
                onPress={handleAdd}
                accessibilityRole="button"
                accessibilityLabel="Add custom reminder day"
                className="flex-1 bg-accent py-3 rounded-xl items-center justify-center active:opacity-75 min-h-11"
              >
                <Text className="text-body-lg font-semibold text-white">Add</Text>
              </ScalePressable>
            </View>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

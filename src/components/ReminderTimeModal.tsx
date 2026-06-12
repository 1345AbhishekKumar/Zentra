import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  Modal,
  Pressable,
} from "react-native";
import { Feather } from "@expo/vector-icons";
import { colors } from "@/theme/tokens";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import ScalePressable from "@/components/ScalePressable";

interface ReminderTimeModalProps {
  visible: boolean;
  onClose: () => void;
  onConfirm: (time24: string) => void;
  currentTime24: string;
}

export default function ReminderTimeModal({
  visible,
  onClose,
  onConfirm,
  currentTime24,
}: ReminderTimeModalProps) {
  const insets = useSafeAreaInsets();
  const [selectedHour, setSelectedHour] = useState(9);
  const [selectedMinute, setSelectedMinute] = useState(0);
  const [selectedPeriod, setSelectedPeriod] = useState<"AM" | "PM">("AM");

  useEffect(() => {
    if (visible) {
      const time = currentTime24 || "09:00";
      const [h24, m24] = time.split(":").map(Number);
      const period = h24 >= 12 ? "PM" : "AM";
      let h12 = h24 % 12;
      if (h12 === 0) h12 = 12;

      const timer = setTimeout(() => {
        setSelectedHour(h12);
        setSelectedMinute(m24);
        setSelectedPeriod(period);
      }, 0);
      return () => clearTimeout(timer);
    }
  }, [visible, currentTime24]);

  const handleConfirm = () => {
    let h24 = selectedHour;
    if (selectedPeriod === "PM" && h24 !== 12) {
      h24 += 12;
    } else if (selectedPeriod === "AM" && h24 === 12) {
      h24 = 0;
    }
    const time24 = `${h24.toString().padStart(2, "0")}:${selectedMinute.toString().padStart(2, "0")}`;
    onConfirm(time24);
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={{ flex: 1, backgroundColor: "rgba(0, 0, 0, 0.4)", justifyContent: "flex-end" }}>
        {/* Backdrop click cancels */}
        <Pressable className="flex-1" onPress={onClose} />

        {/* Bottom Sheet Card */}
        <View
          className="bg-surface rounded-t-2xl overflow-hidden self-center shadow-lg"
          style={{ width: "100%", maxWidth: 512 }}
        >
          {/* Toolbar */}
          <View className="flex-row items-center justify-between px-6 py-4 border-b border-border bg-background">
            <ScalePressable
              onPress={onClose}
              hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
              accessibilityRole="button"
              accessibilityLabel="Cancel time selection"
            >
              <Text className="text-body-md text-secondary font-semibold font-display">
                Cancel
              </Text>
            </ScalePressable>
            <Text className="text-body-lg text-primary font-bold font-display">
              Reminder Time
            </Text>
            <ScalePressable
              onPress={handleConfirm}
              hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
              accessibilityRole="button"
              accessibilityLabel="Confirm time selection"
            >
              <Text className="text-body-md text-accent font-bold font-display">
                Done
              </Text>
            </ScalePressable>
          </View>

          {/* Time Picker Controls */}
          <View className="flex-row justify-center items-center py-8 bg-surface gap-6">
            {/* Hours Selector */}
            <View className="items-center">
              <Pressable
                onPress={() => setSelectedHour((prev) => (prev === 12 ? 1 : prev + 1))}
                accessibilityRole="button"
                accessibilityLabel="Increment hour"
                className="w-12 h-10 items-center justify-center rounded-lg active:bg-soft-accent"
              >
                <Feather name="chevron-up" size={24} color={colors.accent} />
              </Pressable>
              <Text className="text-display text-primary font-bold my-1 w-16 text-center font-display">
                {selectedHour.toString().padStart(2, "0")}
              </Text>
              <Pressable
                onPress={() => setSelectedHour((prev) => (prev === 1 ? 12 : prev - 1))}
                accessibilityRole="button"
                accessibilityLabel="Decrement hour"
                className="w-12 h-10 items-center justify-center rounded-lg active:bg-soft-accent"
              >
                <Feather name="chevron-down" size={24} color={colors.accent} />
              </Pressable>
            </View>

            {/* Colon */}
            <Text className="text-display text-primary font-bold mb-4 font-display">:</Text>

            {/* Minutes Selector */}
            <View className="items-center">
              <Pressable
                onPress={() => setSelectedMinute((prev) => (prev === 59 ? 0 : prev + 1))}
                accessibilityRole="button"
                accessibilityLabel="Increment minute"
                className="w-12 h-10 items-center justify-center rounded-lg active:bg-soft-accent"
              >
                <Feather name="chevron-up" size={24} color={colors.accent} />
              </Pressable>
              <Text className="text-display text-primary font-bold my-1 w-16 text-center font-display">
                {selectedMinute.toString().padStart(2, "0")}
              </Text>
              <Pressable
                onPress={() => setSelectedMinute((prev) => (prev === 0 ? 59 : prev - 1))}
                accessibilityRole="button"
                accessibilityLabel="Decrement minute"
                className="w-12 h-10 items-center justify-center rounded-lg active:bg-soft-accent"
              >
                <Feather name="chevron-down" size={24} color={colors.accent} />
              </Pressable>
            </View>

            {/* Period AM/PM */}
            <View className="flex-col gap-2 ml-4">
              <Pressable
                onPress={() => setSelectedPeriod("AM")}
                accessibilityRole="button"
                accessibilityLabel="Select AM"
                accessibilityState={{ selected: selectedPeriod === "AM" }}
                className={`px-4 py-2 rounded-lg border items-center justify-center ${
                  selectedPeriod === "AM"
                    ? "bg-accent border-accent"
                    : "bg-surface border-border"
                }`}
              >
                <Text
                  className={`text-body-md font-bold ${
                    selectedPeriod === "AM" ? "text-white" : "text-primary"
                  }`}
                >
                  AM
                </Text>
              </Pressable>
              <Pressable
                onPress={() => setSelectedPeriod("PM")}
                accessibilityRole="button"
                accessibilityLabel="Select PM"
                accessibilityState={{ selected: selectedPeriod === "PM" }}
                className={`px-4 py-2 rounded-lg border items-center justify-center ${
                  selectedPeriod === "PM"
                    ? "bg-accent border-accent"
                    : "bg-surface border-border"
                }`}
              >
                <Text
                  className={`text-body-md font-bold ${
                    selectedPeriod === "PM" ? "text-white" : "text-primary"
                  }`}
                >
                  PM
                </Text>
              </Pressable>
            </View>
          </View>

          {/* Safe Area space spacer */}
          <View style={{ height: Math.max(insets.bottom, 24), backgroundColor: colors.surface }} />
        </View>
      </View>
    </Modal>
  );
}

import React, { useState } from "react";
import {
  View,
  Text,
  Pressable,
  Platform,
  Modal,
  StyleSheet,
} from "react-native";
import { Feather } from "@expo/vector-icons";
import { colors } from "@/theme/tokens";
import { formatDate } from "@/lib/date";
import {
  format,
  parseISO,
  startOfToday,
  isValid,
  addMonths,
  subMonths,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  isSameDay,
  isSameMonth,
  isBefore,
} from "date-fns";
import { useSafeAreaInsets } from "react-native-safe-area-context";

interface DatePickerFieldProps {
  label: string;
  value: string; // ISO date string "YYYY-MM-DD" or empty
  onChange: (date: string) => void;
  error?: string;
}

export default function DatePickerField({
  label,
  value,
  onChange,
  error,
}: DatePickerFieldProps) {
  const insets = useSafeAreaInsets();
  const [showModal, setShowModal] = useState(false);

  // Parse value to Date or fallback to today
  const getInitialDate = () => {
    if (value) {
      const parsed = parseISO(value);
      if (isValid(parsed)) return parsed;
    }
    return startOfToday();
  };

  // Temp date for calendar selection before tapping "Done"
  const [tempDate, setTempDate] = useState<Date>(getInitialDate);
  // Month currently being navigated/viewed in the calendar
  const [currentMonth, setCurrentMonth] = useState<Date>(getInitialDate);

  const handleTap = () => {
    if (Platform.OS === "web") {
      return;
    }
    const initial = getInitialDate();
    setTempDate(initial);
    setCurrentMonth(initial);
    setShowModal(true);
  };

  const handleCancel = () => {
    setShowModal(false);
  };

  const handleDone = () => {
    const formatted = format(tempDate, "yyyy-MM-dd");
    onChange(formatted);
    setShowModal(false);
  };

  const isFocused = showModal;

  // Grid calculation helpers for current viewed month
  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(monthStart);
  const gridStart = startOfWeek(monthStart, { weekStartsOn: 0 }); // Sunday
  const gridEnd = endOfWeek(monthEnd, { weekStartsOn: 0 }); // Saturday
  const daysGrid = eachDayOfInterval({ start: gridStart, end: gridEnd });

  return (
    <View className="mb-4">
      {/* Label above the row wrapper to align with other form fields */}
      <Text className="text-body-md text-primary font-semibold mb-2">
        {label}
      </Text>

      <Pressable
        onPress={handleTap}
        className="bg-surface rounded-xl flex-row items-center justify-between w-full relative"
        style={({ pressed }) => [
          {
            borderWidth: isFocused ? 2 : 1,
            borderColor: error
              ? colors.danger
              : isFocused
                ? colors.accent
                : colors.border,
            paddingHorizontal: isFocused ? 15 : 16,
            paddingVertical: isFocused ? 11 : 12,
          },
          (pressed && Platform.OS !== "web" && styles.pressedScale) as any,
        ]}
      >
        <Text className="text-body-md text-secondary font-medium">
          Select Expiry Date
        </Text>

        <View className="flex-row items-center">
          <Text
            className={`text-body-md font-medium mr-2 ${
              value ? "text-primary" : "text-secondary"
            }`}
          >
            {value ? formatDate(value) : "Select date"}
          </Text>
          <Feather name="calendar" size={20} color={colors.accent} />
        </View>

        {/* Web Native HTML date input overlay */}
        {Platform.OS === "web" && (
          <input
            type="date"
            value={value}
            min={format(startOfToday(), "yyyy-MM-dd")}
            onChange={(e) => onChange(e.target.value)}
            style={styles.webInputOverlay as any}
          />
        )}
      </Pressable>

      {/* Error Message */}
      {error && (
        <Text className="text-caption text-danger mt-1.5 font-medium">
          {error}
        </Text>
      )}

      {/* Custom JavaScript Bottom Sheet Date Picker Modal */}
      {Platform.OS !== "web" && (
        <Modal
          visible={showModal}
          transparent
          animationType="slide"
          onRequestClose={handleCancel}
        >
          <View style={styles.modalOverlay as any}>
            {/* Click backdrop to dismiss */}
            <Pressable style={styles.flexOne as any} onPress={handleCancel} />

            {/* Bottom Sheet Card */}
            <View className="bg-surface rounded-t-3xl overflow-hidden w-full max-w-lg self-center shadow-lg">
              {/* Toolbar */}
              <View className="flex-row items-center justify-between px-6 py-4 border-b border-border bg-background">
                <Pressable onPress={handleCancel} hitSlop={12}>
                  <Text className="text-body-md text-secondary font-semibold">
                    Cancel
                  </Text>
                </Pressable>
                <Text className="text-body-lg text-primary font-bold">
                  Expiry Date
                </Text>
                <Pressable onPress={handleDone} hitSlop={12}>
                  <Text className="text-body-md text-accent font-semibold">
                    Done
                  </Text>
                </Pressable>
              </View>

              {/* Month Navigation */}
              <View className="flex-row items-center justify-between px-6 py-4 bg-surface">
                <Pressable
                  onPress={() => setCurrentMonth(subMonths(currentMonth, 1))}
                  className="p-2 rounded-full active:bg-softAccent"
                  hitSlop={8}
                >
                  <Feather name="chevron-left" size={24} color={colors.primary} />
                </Pressable>
                <Text className="text-body-lg text-primary font-bold">
                  {format(currentMonth, "MMMM yyyy")}
                </Text>
                <Pressable
                  onPress={() => setCurrentMonth(addMonths(currentMonth, 1))}
                  className="p-2 rounded-full active:bg-softAccent"
                  hitSlop={8}
                >
                  <Feather name="chevron-right" size={24} color={colors.primary} />
                </Pressable>
              </View>

              {/* Weekday headers */}
              <View className="flex-row px-4 py-2 bg-surface">
                {["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"].map((dayName, idx) => (
                  <Text
                    key={idx}
                    className="text-caption text-secondary font-semibold text-center flex-1"
                  >
                    {dayName}
                  </Text>
                ))}
              </View>

              {/* Days Grid */}
              <View className="flex-row flex-wrap px-4 pb-6 bg-surface">
                {daysGrid.map((day, idx) => {
                  const isCurrentMonth = isSameMonth(day, currentMonth);
                  const isPast = isBefore(day, startOfToday());
                  const isSelected = isSameDay(day, tempDate);

                  return (
                    <View
                      key={idx}
                      style={{ width: "14.28%", aspectRatio: 1 }}
                      className="items-center justify-center p-1"
                    >
                      <Pressable
                        disabled={isPast}
                        onPress={() => setTempDate(day)}
                        className={`w-10 h-10 rounded-full items-center justify-center ${
                          isSelected
                            ? "bg-accent"
                            : isPast
                              ? "opacity-30"
                              : "active:bg-softAccent"
                        }`}
                        style={({ pressed }) =>
                          pressed && !isPast && !isSelected
                            ? { backgroundColor: colors.softAccent }
                            : {}
                        }
                      >
                        <Text
                          className={`text-body-md font-semibold ${
                            isSelected
                              ? "text-white"
                              : isPast
                                ? "text-secondary"
                                : isCurrentMonth
                                  ? "text-primary"
                                  : "text-secondary opacity-50"
                          }`}
                        >
                          {format(day, "d")}
                        </Text>
                      </Pressable>
                    </View>
                  );
                })}
              </View>

              {/* Safe Area spacer */}
              <View style={{ height: Math.max(insets.bottom, 24), backgroundColor: colors.surface }} />
            </View>
          </View>
        </Modal>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  pressedScale: {
    transform: [{ scale: 0.98 }],
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(18, 18, 26, 0.4)",
    justifyContent: "flex-end",
  },
  flexOne: {
    flex: 1,
  },
  webInputOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    opacity: 0,
    width: "100%",
    height: "100%",
    cursor: "pointer",
  } as any,
});

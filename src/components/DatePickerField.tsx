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
import ScalePressable from "./ScalePressable";

interface DatePickerFieldProps {
  label: string;
  value: string; // ISO date string "YYYY-MM-DD" or empty
  onChange: (date: string) => void;
  error?: string;
}

const webInputStyle: React.CSSProperties = {
  position: "absolute",
  top: 0,
  left: 0,
  right: 0,
  bottom: 0,
  opacity: 0,
  width: "100%",
  height: "100%",
  cursor: "pointer",
};

export default function DatePickerField({
  label,
  value,
  onChange,
  error,
}: DatePickerFieldProps) {
  const insets = useSafeAreaInsets();
  const [showModal, setShowModal] = useState(false);

  const isRequired = label.endsWith("*");
  const displayLabel = isRequired ? label.slice(0, -1).trim() : label;

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
        {displayLabel} {isRequired && <Text className="text-danger">*</Text>}
      </Text>

      <ScalePressable
        onPress={handleTap}
        accessibilityRole="button"
        accessibilityLabel={`${displayLabel}: ${value ? formatDate(value) : "Not selected"}`}
        className="bg-surface rounded-xl flex-row items-center justify-between w-full relative border border-border px-4 h-[52px]"
        style={({ pressed }) => [
          {
            borderWidth: isFocused ? 2 : 1,
            borderColor: error
              ? colors.danger
              : isFocused
                ? colors.accent
                : colors.border,
            borderStyle: "solid",
          },
        ]}
      >
        <Text
          className={`text-body-md ${
            value ? "text-primary" : "text-secondary"
          }`}
        >
          {value ? formatDate(value) : "Select date"}
        </Text>

        <Feather
          name="calendar"
          size={20}
          color={value ? colors.accent : colors.secondary}
        />

        {/* Web Native HTML date input overlay */}
        {Platform.OS === "web" && (
          <input
            type="date"
            value={value}
            min={format(startOfToday(), "yyyy-MM-dd")}
            onChange={(e) => onChange(e.target.value)}
            style={webInputStyle}
          />
        )}
      </ScalePressable>

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
          <View style={styles.modalOverlay}>
            {/* Click backdrop to dismiss */}
            <Pressable style={styles.flexOne} onPress={handleCancel} />

            {/* Bottom Sheet Card */}
            <View
              className="bg-surface rounded-t-2xl overflow-hidden self-center shadow-lg"
              style={{ width: "100%", maxWidth: 512 }}
            >
              {/* Toolbar */}
              <View className="flex-row items-center justify-between px-6 py-4 border-b border-border bg-background">
                <ScalePressable
                  onPress={handleCancel}
                  hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
                  accessibilityRole="button"
                  accessibilityLabel="Cancel date selection"
                >
                  <Text className="text-body-md text-secondary font-semibold font-display">
                    Cancel
                  </Text>
                </ScalePressable>
                <Text className="text-body-lg text-primary font-bold font-display">
                  {displayLabel}
                </Text>
                <ScalePressable
                  onPress={handleDone}
                  hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
                  accessibilityRole="button"
                  accessibilityLabel="Confirm date selection"
                >
                  <Text className="text-body-md text-accent font-bold font-display">
                    Done
                  </Text>
                </ScalePressable>
              </View>

              {/* Month Navigation */}
              <View className="flex-row items-center justify-between px-6 py-4 bg-surface">
                <ScalePressable
                  onPress={() => setCurrentMonth(subMonths(currentMonth, 1))}
                  className="w-10 h-10 items-center justify-center rounded-full active:bg-soft-accent"
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                  accessibilityRole="button"
                  accessibilityLabel="Previous month"
                >
                  <Feather name="chevron-left" size={24} color={colors.primary} />
                </ScalePressable>
                <Text className="text-h2 text-primary font-bold font-display">
                  {format(currentMonth, "MMMM yyyy")}
                </Text>
                <ScalePressable
                  onPress={() => setCurrentMonth(addMonths(currentMonth, 1))}
                  className="w-10 h-10 items-center justify-center rounded-full active:bg-soft-accent"
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                  accessibilityRole="button"
                  accessibilityLabel="Next month"
                >
                  <Feather name="chevron-right" size={24} color={colors.primary} />
                </ScalePressable>
              </View>

              {/* Weekday headers */}
              <View className="flex-row px-4 py-2 bg-surface">
                {["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"].map((dayName, idx) => (
                  <Text
                    key={idx}
                    className="text-caption text-secondary font-semibold text-center flex-1 font-sans"
                  >
                    {dayName}
                  </Text>
                ))}
              </View>

              {/* Days Grid */}
              <View
                className="px-4 pb-6 bg-surface"
                style={{ flexDirection: "row", flexWrap: "wrap" }}
              >
                {daysGrid.map((day, idx) => {
                  const isCurrentMonth = isSameMonth(day, currentMonth);
                  const isPast = isBefore(day, startOfToday());
                  const isSelected = isSameDay(day, tempDate);
                  const isTodayDate = isSameDay(day, startOfToday());

                  return (
                    <View
                      key={idx}
                      style={{ width: "14.28%", aspectRatio: 1 }}
                      className="items-center justify-center p-1"
                    >
                      <ScalePressable
                        disabled={isPast}
                        onPress={() => setTempDate(day)}
                        accessibilityRole="button"
                        accessibilityLabel={format(day, "d MMMM yyyy")}
                        accessibilityState={{ disabled: isPast, selected: isSelected }}
                        activeScale={0.93}
                        className={`w-10 h-10 rounded-full items-center justify-center ${
                          isSelected
                            ? "bg-accent shadow-sm"
                            : isPast
                              ? "opacity-25"
                              : isTodayDate
                                ? "bg-soft-accent border border-accent/30"
                                : "active:bg-soft-accent"
                        }`}
                      >
                        <Text
                          className={`text-body-md font-semibold font-display ${
                            isSelected
                              ? "text-white"
                              : isPast
                                ? "text-secondary"
                                : isTodayDate
                                  ? "text-accent font-bold"
                                  : isCurrentMonth
                                    ? "text-primary"
                                    : "text-secondary opacity-50"
                          }`}
                        >
                          {format(day, "d")}
                        </Text>
                      </ScalePressable>
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

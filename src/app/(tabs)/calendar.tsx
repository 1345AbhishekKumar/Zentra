import { useState, useMemo, useCallback } from "react";
import { View, Text, ScrollView, StyleSheet, AccessibilityInfo } from "react-native";
import { Feather } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import {
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  isSameDay,
  isSameMonth,
  addMonths,
  subMonths,
  format,
  parseISO,
  isToday,
} from "date-fns";
import { useDocumentStore } from "@/store/documentStore";
import { colors } from "@/theme/tokens";
import DocumentCard from "@/components/DocumentCard";
import ScalePressable from "@/components/ScalePressable";
import EmptyState from "@/components/EmptyState";
import { ZentraDocument } from "@/types";
import { daysUntilExpiry } from "@/lib/date";

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export default function CalendarScreen() {
  const router = useRouter();
  const { documents, toggleFavorite } = useDocumentStore();
  const [currentMonth, setCurrentMonth] = useState<Date>(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(new Date());

  // Get active (non-deleted) documents
  const activeDocuments = useMemo(() => {
    return documents.filter((doc) => !doc.isDeleted);
  }, [documents]);

  // Navigate months
  const handlePrevMonth = () => {
    setCurrentMonth((prev) => subMonths(prev, 1));
    setSelectedDate(null);
    AccessibilityInfo.announceForAccessibility("Navigated to previous month");
  };

  const handleNextMonth = () => {
    setCurrentMonth((prev) => addMonths(prev, 1));
    setSelectedDate(null);
    AccessibilityInfo.announceForAccessibility("Navigated to next month");
  };

  const handleToday = () => {
    const today = new Date();
    setCurrentMonth(today);
    setSelectedDate(today);
    AccessibilityInfo.announceForAccessibility("Snapped back to today");
  };

  // Grid dates calculation
  const daysGrid = useMemo(() => {
    const monthStart = startOfMonth(currentMonth);
    const monthEnd = endOfMonth(monthStart);
    const gridStart = startOfWeek(monthStart, { weekStartsOn: 0 }); // Sunday
    const gridEnd = endOfWeek(monthEnd, { weekStartsOn: 0 });

    return eachDayOfInterval({ start: gridStart, end: gridEnd });
  }, [currentMonth]);

  // Helper to filter documents expiring on a specific date (YYYY-MM-DD)
  const getDocsForDate = useCallback((date: Date) => {
    const dateStr = format(date, "yyyy-MM-dd");
    return activeDocuments.filter((doc) => doc.expiryDate === dateStr);
  }, [activeDocuments]);

  // Helper to filter documents expiring in a specific month
  const getDocsForMonth = useCallback((monthDate: Date) => {
    return activeDocuments.filter((doc) => {
      try {
        const docDate = parseISO(doc.expiryDate);
        return isSameMonth(docDate, monthDate);
      } catch {
        return false;
      }
    });
  }, [activeDocuments]);

  // Calculate urgency color for a day
  const getUrgencyColor = (docs: ZentraDocument[]) => {
    if (docs.length === 0) return null;

    let highestUrgency: "expired" | "critical" | "warning" | "safe" = "safe";

    for (const doc of docs) {
      const days = daysUntilExpiry(doc.expiryDate);
      if (days < 0) {
        return colors.danger; // Expired -> Red
      } else if (days <= 7) {
        highestUrgency = "critical"; // Critical -> Red
      } else if (days <= 30 && highestUrgency !== "critical") {
        highestUrgency = "warning"; // Warning -> Orange
      }
    }

    if (highestUrgency === "critical") return colors.danger;
    if (highestUrgency === "warning") return colors.warning;
    return colors.success; // Safe -> Green
  };

  // Expiry documents matching current filter selection
  const listDocs = useMemo(() => {
    if (selectedDate) {
      return getDocsForDate(selectedDate);
    }
    return getDocsForMonth(currentMonth);
  }, [selectedDate, currentMonth, getDocsForDate, getDocsForMonth]);

  // Sort list soonest first
  const sortedListDocs = useMemo(() => {
    return [...listDocs].sort((a, b) =>
      compareDatesAscending(a.expiryDate, b.expiryDate)
    );
  }, [listDocs]);

  // Helper for asc sorting
  function compareDatesAscending(a: string, b: string) {
    try {
      return parseISO(a).getTime() - parseISO(b).getTime();
    } catch {
      return 0;
    }
  }

  // Header Title
  const listTitle = selectedDate
    ? `Expiries on ${format(selectedDate, "d MMM yyyy")}`
    : `Expiries in ${format(currentMonth, "MMMM yyyy")}`;

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 60 }}
      >
        {/* Screen Header */}
        <View className="flex-row justify-between items-center px-6 pt-6 mb-5">
          <Text className="text-h1 text-primary font-bold">Calendar</Text>
          <ScalePressable
            onPress={handleToday}
            accessibilityRole="button"
            accessibilityLabel="Jump to today"
            className="bg-surface border border-border/80 px-4 py-2 rounded-xl active:bg-background flex-row items-center justify-center min-h-[40px]"
          >
            <Feather name="clock" size={14} color={colors.accent} />
            <Text className="text-body-sm font-semibold text-accent ml-1.5">
              Today
            </Text>
          </ScalePressable>
        </View>

        {/* Month Selector Row */}
        <View className="px-6 mb-4">
          <View
            className="flex-row justify-between items-center bg-surface border border-border/40 rounded-2xl px-4 py-3"
            style={styles.cardShadow}
          >
            <ScalePressable
              onPress={handlePrevMonth}
              accessibilityRole="button"
              accessibilityLabel="Previous month"
              className="w-10 h-10 items-center justify-center rounded-xl bg-background border border-border/30 active:bg-border/20"
            >
              <Feather name="chevron-left" size={20} color={colors.primary} />
            </ScalePressable>

            <View className="flex-row items-center gap-2.5">
              <Text className="text-h2 text-primary font-bold">
                {format(currentMonth, "MMMM yyyy")}
              </Text>
              {selectedDate !== null && (
                <ScalePressable
                  onPress={() => setSelectedDate(null)}
                  className="bg-softAccent px-3 py-1 rounded-full border border-accent/5 active:opacity-75"
                >
                  <Text className="text-caption text-accent font-semibold">
                    View Month
                  </Text>
                </ScalePressable>
              )}
            </View>

            <ScalePressable
              onPress={handleNextMonth}
              accessibilityRole="button"
              accessibilityLabel="Next month"
              className="w-10 h-10 items-center justify-center rounded-xl bg-background border border-border/30 active:bg-border/20"
            >
              <Feather name="chevron-right" size={20} color={colors.primary} />
            </ScalePressable>
          </View>
        </View>

        {/* Calendar Card */}
        <View className="px-6 mb-6">
          <View
            className="bg-surface border border-border/40 rounded-2xl p-4"
            style={styles.cardShadow}
          >
            {/* Weekdays Header */}
            <View className="flex-row justify-between border-b border-border/20 pb-2 mb-2">
              {WEEKDAYS.map((day) => (
                <View key={day} className="flex-1 items-center">
                  <Text className="text-caption font-semibold text-secondary">
                    {day}
                  </Text>
                </View>
              ))}
            </View>

            {/* Days Grid */}
            <View className="flex-row flex-wrap">
              {daysGrid.map((date, index) => {
                const isCurrentMonthDay = isSameMonth(date, currentMonth);
                const isSelected = selectedDate && isSameDay(date, selectedDate);
                const isTodayDay = isToday(date);
                const dayDocs = getDocsForDate(date);
                const dotColor = getUrgencyColor(dayDocs);

                return (
                  <View
                    key={date.toISOString()}
                    className="w-[14.28%] aspect-square items-center justify-center p-0.5 relative"
                  >
                    <ScalePressable
                      onPress={() => {
                        setSelectedDate(date);
                        AccessibilityInfo.announceForAccessibility(
                          `Selected ${format(date, "d MMMM yyyy")}, ${
                            dayDocs.length
                          } expiries`
                        );
                      }}
                      accessibilityRole="button"
                      accessibilityState={{ selected: !!isSelected }}
                      className={`w-9 h-9 items-center justify-center rounded-full ${
                        isSelected
                          ? "bg-accent"
                          : isTodayDay
                          ? "border border-accent/80"
                          : "bg-transparent"
                      }`}
                      activeScale={0.9}
                    >
                      <Text
                        className={`text-body-md font-semibold ${
                          isSelected
                            ? "text-white font-bold"
                            : isTodayDay
                            ? "text-accent font-bold"
                            : isCurrentMonthDay
                            ? "text-primary"
                            : "text-secondary/40"
                        }`}
                      >
                        {format(date, "d")}
                      </Text>
                    </ScalePressable>

                    {/* Expiry Event Marker Dot */}
                    {dotColor && (
                      <View
                        className="w-1.5 h-1.5 rounded-full absolute bottom-1.5"
                        style={{ backgroundColor: dotColor }}
                      />
                    )}
                  </View>
                );
              })}
            </View>
          </View>
        </View>

        {/* Section List Header */}
        <View className="px-6 flex-row justify-between items-center mb-3">
          <Text className="text-h2 text-primary font-semibold">
            {listTitle}
          </Text>
          <Text className="text-caption text-secondary font-medium">
            {sortedListDocs.length} {sortedListDocs.length === 1 ? "file" : "files"}
          </Text>
        </View>

        {/* Document list cards */}
        {sortedListDocs.length > 0 ? (
          <View
            className="mx-6 bg-surface border border-border/40 overflow-hidden rounded-2xl"
            style={styles.cardShadow}
          >
            {sortedListDocs.map((doc) => (
              <View key={doc.id}>
                <DocumentCard
                  doc={doc}
                  viewMode="list"
                  onPress={() => {
                    router.push({
                      pathname: "/document/[id]",
                      params: { id: doc.id },
                    } as never);
                  }}
                  onFavoritePress={() => toggleFavorite(doc.id)}
                />
              </View>
            ))}
          </View>
        ) : (
          <View className="mx-6">
            <EmptyState
              icon="calendar-outline"
              title="No expiries scheduled"
              message={
                selectedDate
                  ? "There are no documents expiring on this specific date."
                  : "There are no documents expiring in this entire month."
              }
            />
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  cardShadow: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 5,
    elevation: 2,
  },
});

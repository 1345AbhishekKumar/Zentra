import React, { useState, useMemo } from "react";
import {
  View,
  Text,
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
  Linking,
} from "react-native";
import { useRouter } from "expo-router";
import { Feather, Ionicons } from "@expo/vector-icons";
import { colors } from "@/theme/tokens";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { APP_SUPPORT_EMAIL } from "@/constants/app";
import EmptyState from "@/components/EmptyState";

const FAQ_ITEMS = [
  {
    question: "How do I add a document?",
    answer: "Tap the + button on the Home or Documents screen. Fill in the document name, category, expiry date, and optionally attach a file.",
  },
  {
    question: "Where is my data stored?",
    answer: "All your data is stored locally on your device using AsyncStorage. Nothing is uploaded to any server or cloud service.",
  },
  {
    question: "How do notifications work?",
    answer: "Zentra schedules local reminders on your device based on the advance notice days you set (e.g. 7, 30, 90 days before expiry). These are processed entirely on-device.",
  },
  {
    question: "What happens if I delete the app?",
    answer: "All your document data will be lost as it is stored locally. Export your data from the Profile screen before uninstalling.",
  },
  {
    question: "Can I recover a deleted document?",
    answer: "Deleted documents are moved to Recently Deleted and are recoverable for 30 days. After 30 days they are permanently removed.",
  },
  {
    question: "How do I set up App Lock?",
    answer: "Go to Profile → App Lock and enable it. You can use Face ID, fingerprint, or your device PIN.",
  },
  {
    question: "Why am I not receiving notifications?",
    answer: "Check that notifications are enabled in Profile → Notifications and that Zentra has notification permission in your device settings.",
  },
  {
    question: "Can I use Zentra on multiple devices?",
    answer: "Currently Zentra is local-only. Your data does not sync between devices. Each device has its own independent document vault.",
  },
  {
    question: "How do I export my data?",
    answer: "Go to Profile → Export Data. You can export a JSON file of all your document metadata (not the attached files themselves).",
  },
  {
    question: "Is Zentra free?",
    answer: "Yes, Zentra is free to use.",
  },
];

export default function HelpScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [searchQuery, setSearchQuery] = useState("");
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});

  const goBack = () => {
    if (router.canGoBack()) {
      router.back();
      return;
    }
    router.replace("/(tabs)/profile");
  };

  const toggleExpand = (question: string) => {
    setExpanded((prev) => ({
      ...prev,
      [question]: !prev[question],
    }));
  };

  const handleContactSupport = async () => {
    const url = `mailto:${APP_SUPPORT_EMAIL}`;
    try {
      const supported = await Linking.canOpenURL(url);
      if (supported) {
        await Linking.openURL(url);
      } else {
        console.warn("Mail client not available");
      }
    } catch (err) {
      console.error("Error opening mail client:", err);
    }
  };

  const filteredFaqs = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) return FAQ_ITEMS;
    return FAQ_ITEMS.filter((item) =>
      item.question.toLowerCase().includes(query)
    );
  }, [searchQuery]);

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      {/* Top Header & Search Area */}
      <View className="bg-background pb-3">
        {/* Top Header Row with Back Button */}
        <View
          className="px-6 pb-2 flex-row items-center justify-between"
          style={{ paddingTop: insets.top > 0 ? insets.top : 16 }}
        >
          <Pressable
            onPress={goBack}
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
            accessibilityRole="button"
            accessibilityLabel="Go back"
            className="w-10 h-10 items-center justify-center rounded-full active:bg-surface/50"
          >
            <Feather name="arrow-left" size={24} color={colors.primary} />
          </Pressable>
          <Text className="text-h2 text-primary font-bold text-center flex-1">
            Help & FAQ
          </Text>
          {/* Empty view for spacing balance */}
          <View className="w-10 h-10" />
        </View>

        {/* Search Bar Row below header */}
        <View className="px-6 mt-1">
          <View
            className="flex-row items-center bg-surface rounded-full border border-border px-3 py-1.5 h-10"
            style={styles.searchShadow}
          >
            <Feather name="search" size={16} color={colors.secondary} />
            <TextInput
              value={searchQuery}
              onChangeText={setSearchQuery}
              placeholder="Search questions..."
              placeholderTextColor={colors.secondary}
              accessibilityLabel="Search help questions"
              className="flex-1 text-body-md text-primary ml-2 h-9"
              style={{ paddingVertical: 0 }}
              autoCapitalize="none"
              autoCorrect={false}
            />
            {searchQuery.length > 0 && (
              <Pressable
                onPress={() => setSearchQuery("")}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                accessibilityRole="button"
                accessibilityLabel="Clear search query"
                className="w-8 h-8 items-center justify-center rounded-full active:bg-border/20"
              >
                <Feather name="x" size={16} color={colors.secondary} />
              </Pressable>
            )}
          </View>
        </View>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{
          flexGrow: 1,
          paddingTop: 8,
        }}
        keyboardShouldPersistTaps="handled"
      >
        {/* Policy Card Container */}
        <View
          className="flex-1 bg-surface rounded-t-[32px] px-6 py-8 border-t border-x border-border/40"
          style={styles.cardShadow}
        >
          {filteredFaqs.length > 0 ? (
            <View>
              {filteredFaqs.map((item, index) => {
                const isExpanded = !!expanded[item.question];
                const isLast = index === filteredFaqs.length - 1;
                return (
                  <View
                    key={item.question}
                    className={!isLast ? "border-b border-border/30" : ""}
                  >
                    <Pressable
                      onPress={() => toggleExpand(item.question)}
                      className="flex-row items-center justify-between py-4 active:bg-background/50"
                      accessibilityRole="button"
                      accessibilityLabel={item.question}
                      accessibilityState={{ expanded: isExpanded }}
                    >
                      <Text className="text-body-lg text-primary font-bold flex-1 pr-4">
                        {item.question}
                      </Text>
                      <Feather
                        name="chevron-right"
                        size={18}
                        color={colors.secondary}
                        style={{
                          transform: [{ rotate: isExpanded ? "90deg" : "0deg" }],
                        }}
                      />
                    </Pressable>
                    {isExpanded && (
                      <View className="pb-4">
                        <Text className="text-body-md text-secondary leading-6">
                          {item.answer}
                        </Text>
                      </View>
                    )}
                  </View>
                );
              })}
            </View>
          ) : (
            <EmptyState
              icon="search-outline"
              title="No results"
              message="Try different keywords."
            />
          )}

          {/* Still need help? Section */}
          <View className="mt-8 mb-6">
            <Text className="text-body-sm text-secondary font-semibold uppercase tracking-wider mb-3">
              Still need help?
            </Text>

            <View
              className="bg-surface rounded-2xl border border-border/40 overflow-hidden"
              style={styles.cardShadow}
            >
              <Pressable
                onPress={handleContactSupport}
                accessibilityRole="button"
                accessibilityLabel="Contact Support"
                className="flex-row items-center px-4 py-4 active:bg-background/50"
              >
                <Ionicons name="mail-outline" size={20} color={colors.accent} />
                <Text className="text-body-lg ml-3 font-medium flex-1 text-primary">
                  Contact Support
                </Text>
                <Feather name="chevron-right" size={18} color="#C7C7CC" />
              </Pressable>
            </View>
          </View>

          {/* Spacing at bottom */}
          <View style={{ height: Math.max(insets.bottom, 24) }} />
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  cardShadow: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },
  searchShadow: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
    elevation: 1,
  },
});

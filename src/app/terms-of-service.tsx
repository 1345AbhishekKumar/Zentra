import React from "react";
import {
  View,
  Text,
  Pressable,
  ScrollView,
  StyleSheet,
  Linking,
} from "react-native";
import { useRouter } from "expo-router";
import { Feather } from "@expo/vector-icons";
import { colors } from "@/theme/tokens";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { APP_SUPPORT_EMAIL } from "@/constants/app";

export default function TermsOfServiceScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const goBack = () => {
    if (router.canGoBack()) {
      router.back();
      return;
    }
    router.replace("/(tabs)/profile");
  };

  const handleEmailPress = async () => {
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

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
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
        {/* Empty view for spacing balance */}
        <View className="w-10 h-10" />
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{
          flexGrow: 1,
          paddingTop: 8,
        }}
      >
        {/* Large Screen Title */}
        <View className="px-6 pb-6">
          <Text className="text-display text-primary font-bold leading-tight">
            Terms of Service
          </Text>
        </View>

        {/* Policy Card Container */}
        <View
          className="flex-1 bg-surface rounded-t-[32px] px-6 py-8 border-t border-x border-border/40"
          style={styles.cardShadow}
        >
          <View className="gap-6">
            {/* Zentra Terms of Service Header */}
            <View className="mb-2">
              <Text className="text-h1 text-primary font-bold uppercase tracking-tight">
                Zentra Terms of Service
              </Text>
              <Text className="text-body-md text-secondary mt-1">
                Effective date: June 2025
              </Text>
            </View>

            {/* Commitment Highlight Summary Block */}
            <View className="gap-2">
              <Text className="text-primary text-[14px] font-semibold leading-[20px] font-sans">
                These Terms of Service govern your use of Zentra. By using Zentra, you agree to these terms.
              </Text>
              <Text className="text-primary text-[14px] font-semibold leading-[20px] font-sans">
                We will:
              </Text>
              <View className="pl-4 gap-2">
                <View className="flex-row items-start">
                  <Text className="text-secondary text-[14px] leading-[22px] mr-2">•</Text>
                  <Text className="text-secondary text-[14px] leading-[22px] flex-1 font-sans">
                    provide you with a reliable, local document expiry alert system;
                  </Text>
                </View>
                <View className="flex-row items-start">
                  <Text className="text-secondary text-[14px] leading-[22px] mr-2">•</Text>
                  <Text className="text-secondary text-[14px] leading-[22px] flex-1 font-sans">
                    respect your data privacy by storing all document details locally;
                  </Text>
                </View>
                <View className="flex-row items-start">
                  <Text className="text-secondary text-[14px] leading-[22px] mr-2">•</Text>
                  <Text className="text-secondary text-[14px] leading-[22px] flex-1 font-sans">
                    never send your vault files or personal data off-device.
                  </Text>
                </View>
              </View>
            </View>

            {/* Divider line */}
            <View className="border-t border-border/30 my-1" />

            {/* Section 1 */}
            <View>
              <Text className="text-body-lg text-primary font-bold mb-2">
                1. Acceptance of terms
              </Text>
              <Text className="text-secondary text-[14px] leading-[22px] font-sans">
                By downloading and using Zentra, you agree to these Terms of
                Service. If you do not agree, do not use the app.
              </Text>
            </View>

            {/* Section 2 */}
            <View>
              <Text className="text-body-lg text-primary font-bold mb-2">
                2. Description of service
              </Text>
              <Text className="text-secondary text-[14px] leading-[22px] font-sans">
                Zentra is a local document expiry tracker. It helps you keep track
                of important document expiry dates and notifies you before they
                expire. All data is stored locally on your device.
              </Text>
            </View>

            {/* Section 3 */}
            <View>
              <Text className="text-body-lg text-primary font-bold mb-2">
                3. User responsibilities
              </Text>
              <Text className="text-secondary text-[14px] leading-[22px] font-sans">
                You are responsible for maintaining the accuracy of the document
                information you enter. Zentra is a reminder tool — it is your
                responsibility to take action on expiring documents. Zentra is not
                liable for any consequences arising from missed document
                expirations.
              </Text>
            </View>

            {/* Section 4 */}
            <View>
              <Text className="text-body-lg text-primary font-bold mb-2">
                4. Account
              </Text>
              <Text className="text-secondary text-[14px] leading-[22px] font-sans">
                You must create an account via Clerk to use Zentra. You are
                responsible for keeping your login credentials secure. You may
                delete your account at any time from the Profile screen.
              </Text>
            </View>

            {/* Section 5 */}
            <View>
              <Text className="text-body-lg text-primary font-bold mb-2">
                5. Intellectual property
              </Text>
              <Text className="text-secondary text-[14px] leading-[22px] font-sans">
                Zentra and all associated content, branding, and code are the
                property of the Zentra team. You may not copy, modify, or
                distribute the app without explicit permission.
              </Text>
            </View>

            {/* Section 6 */}
            <View>
              <Text className="text-body-lg text-primary font-bold mb-2">
                6. Disclaimer of warranties
              </Text>
              <Text className="text-secondary text-[14px] leading-[22px] font-sans">
                Zentra is provided "as is" without warranties of any kind. We do
                not guarantee the app will be error-free or uninterrupted.
              </Text>
            </View>

            {/* Section 7 */}
            <View>
              <Text className="text-body-lg text-primary font-bold mb-2">
                7. Limitation of liability
              </Text>
              <Text className="text-secondary text-[14px] leading-[22px] font-sans">
                To the fullest extent permitted by law, Zentra shall not be liable
                for any indirect, incidental, or consequential damages arising
                from use of the app.
              </Text>
            </View>

            {/* Section 8 */}
            <View>
              <Text className="text-body-lg text-primary font-bold mb-2">
                8. Changes to terms
              </Text>
              <Text className="text-secondary text-[14px] leading-[22px] font-sans">
                We may update these terms at any time. Continued use after changes
                constitutes acceptance of the updated terms.
              </Text>
            </View>

            {/* Section 9 */}
            <View>
              <Text className="text-body-lg text-primary font-bold mb-2">
                9. Governing law
              </Text>
              <Text className="text-secondary text-[14px] leading-[22px] font-sans">
                These terms are governed by the laws of the jurisdiction in which
                Zentra operates.
              </Text>
            </View>

            {/* Section 10 */}
            <View>
              <Text className="text-body-lg text-primary font-bold mb-2">
                10. Contact
              </Text>
              <Text className="text-secondary text-[14px] leading-[22px] font-sans">
                For questions, contact:{" "}
                <Text
                  className="text-accent font-semibold underline"
                  onPress={handleEmailPress}
                  accessibilityRole="link"
                  accessibilityLabel={`Send email to ${APP_SUPPORT_EMAIL}`}
                >
                  {APP_SUPPORT_EMAIL}
                </Text>
              </Text>
            </View>

            {/* Spacing at bottom */}
            <View style={{ height: Math.max(insets.bottom, 24) }} />
          </View>
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
});

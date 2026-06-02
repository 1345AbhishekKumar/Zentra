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

export default function PrivacyPolicyScreen() {
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
            Privacy Policy
          </Text>
        </View>

        {/* Policy Card Container */}
        <View
          className="flex-1 bg-surface rounded-t-[32px] px-6 py-8 border-t border-x border-border/40"
          style={styles.cardShadow}
        >
          <View className="gap-6">
            {/* Zentra Privacy Notice Header */}
            <View className="mb-2">
              <Text className="text-h1 text-primary font-bold uppercase tracking-tight">
                Zentra Privacy Notice
              </Text>
              <Text className="text-body-md text-secondary mt-1">
                Effective date: June 2025
              </Text>
            </View>

            {/* Commitment Highlight Summary Block */}
            <View className="gap-2">
              <Text className="text-primary text-[14px] font-semibold leading-[20px] font-sans">
                {"We're committed to protecting and respecting your privacy."}
              </Text>
              <Text className="text-primary text-[14px] font-semibold leading-[20px] font-sans">
                We will:
              </Text>
              <View className="pl-4 gap-2">
                <View className="flex-row items-start">
                  <Text className="text-secondary text-[14px] leading-[22px] mr-2">•</Text>
                  <Text className="text-secondary text-[14px] leading-[22px] flex-1 font-sans">
                    always keep your personal data and documents safe and private on your device;
                  </Text>
                </View>
                <View className="flex-row items-start">
                  <Text className="text-secondary text-[14px] leading-[22px] mr-2">•</Text>
                  <Text className="text-secondary text-[14px] leading-[22px] flex-1 font-sans">
                    never sell, share, or transmit your document information to any server;
                  </Text>
                </View>
                <View className="flex-row items-start">
                  <Text className="text-secondary text-[14px] leading-[22px] mr-2">•</Text>
                  <Text className="text-secondary text-[14px] leading-[22px] flex-1 font-sans">
                    allow you to manage your expiry alerts and local settings at any time.
                  </Text>
                </View>
              </View>
            </View>

            {/* Divider line */}
            <View className="border-t border-border/30 my-1" />

            {/* Section 1 */}
            <View>
              <Text className="text-body-lg text-primary font-bold mb-2">
                1. Our commitment
              </Text>
              <Text className="text-secondary text-[14px] leading-[22px] font-sans">
                Zentra is built on a simple promise: your data never leaves your
                device. We do not collect, transmit, store, or process any of your
                personal information or document data on any server.
              </Text>
            </View>

            {/* Section 2 */}
            <View>
              <Text className="text-body-lg text-primary font-bold mb-2">
                2. What we store and where
              </Text>
              <Text className="text-secondary text-[14px] leading-[22px] font-sans">
                {"All document names, expiry dates, categories, notes, and attached files are stored exclusively in your device's local storage (AsyncStorage). Nothing is synced to the cloud, shared with third parties, or accessible to Zentra or anyone else."}
              </Text>
            </View>

            {/* Section 3 */}
            <View>
              <Text className="text-body-lg text-primary font-bold mb-2">
                3. Authentication
              </Text>
              <Text className="text-secondary text-[14px] leading-[22px] font-sans">
                {"We use Clerk for user authentication. Clerk stores your email address and authentication credentials on their servers solely for the purpose of verifying your identity when you sign in. No document data is ever shared with Clerk. Please refer to Clerk's privacy policy for details on how they handle authentication data."}
              </Text>
            </View>

            {/* Section 4 */}
            <View>
              <Text className="text-body-lg text-primary font-bold mb-2">
                4. Notifications
              </Text>
              <Text className="text-secondary text-[14px] leading-[22px] font-sans">
                {"Expiry reminders are scheduled locally on your device using your operating system's notification system. No notification data is sent to any external server."}
              </Text>
            </View>

            {/* Section 5 */}
            <View>
              <Text className="text-body-lg text-primary font-bold mb-2">
                5. Permissions
              </Text>
              <Text className="text-secondary text-[14px] leading-[22px] font-sans">
                Zentra may request access to your camera, photo library, and local
                files solely to allow you to attach documents. These files are
                stored on your device and never uploaded anywhere.
              </Text>
            </View>

            {/* Section 6 */}
            <View>
              <Text className="text-body-lg text-primary font-bold mb-2">
                6. App Lock & Biometrics
              </Text>
              <Text className="text-secondary text-[14px] leading-[22px] font-sans">
                {"If you enable App Lock, your biometric data (Face ID, fingerprint) is processed entirely by your device's operating system. Zentra never accesses or stores biometric data."}
              </Text>
            </View>

            {/* Section 7 */}
            <View>
              <Text className="text-body-lg text-primary font-bold mb-2">
                {"7. Children's privacy"}
              </Text>
              <Text className="text-secondary text-[14px] leading-[22px] font-sans">
                Zentra is not directed at children under the age of 13. We do not
                knowingly collect any data from children.
              </Text>
            </View>

            {/* Section 8 */}
            <View>
              <Text className="text-body-lg text-primary font-bold mb-2">
                8. Changes to this policy
              </Text>
              <Text className="text-secondary text-[14px] leading-[22px] font-sans">
                If we update this policy, the new version will be available within
                the app. Continued use of Zentra after changes constitutes
                acceptance of the updated policy.
              </Text>
            </View>

            {/* Section 9 */}
            <View>
              <Text className="text-body-lg text-primary font-bold mb-2">
                9. Contact
              </Text>
              <Text className="text-secondary text-[14px] leading-[22px] font-sans">
                If you have questions about this privacy policy, contact us at:{" "}
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

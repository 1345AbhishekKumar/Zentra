import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  Pressable,
  Switch,
  ScrollView,
  StyleSheet,
} from "react-native";
import { showAlert } from "@/store/alertStore";
import { useRouter } from "expo-router";
import { Feather } from "@expo/vector-icons";
import { colors } from "@/theme/tokens";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useAppLock, getLocalAuthModule } from "@/hooks/useAppLock";

export default function AppLockScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { isLockEnabled, enableLock, disableLock, authenticate } = useAppLock();
  const [authMethod, setAuthMethod] = useState("Device PIN");

  const goBack = () => {
    if (router.canGoBack()) {
      router.back();
      return;
    }
    router.replace("/(tabs)/profile" as any);
  };

  useEffect(() => {
    if (isLockEnabled) {
      const detectMethod = async () => {
        try {
          const LocalAuthentication = await getLocalAuthModule();
          if (!LocalAuthentication) {
            setAuthMethod("Unavailable (Sandbox)");
            return;
          }
          const hasHardware = await LocalAuthentication.hasHardwareAsync();
          const isEnrolled = await LocalAuthentication.isEnrolledAsync();
          if (!hasHardware || !isEnrolled) {
            setAuthMethod("Device PIN");
            return;
          }
          const types = await LocalAuthentication.supportedAuthenticationTypesAsync();
          if (types.includes(2)) { // FACIAL_RECOGNITION = 2
            setAuthMethod("Face ID");
          } else if (types.includes(1)) { // FINGERPRINT = 1
            setAuthMethod("Fingerprint");
          } else {
            setAuthMethod("Device PIN");
          }
        } catch (err) {
          console.error("Error detecting auth method:", err);
          setAuthMethod("Device PIN");
        }
      };
      detectMethod();
    }
  }, [isLockEnabled]);

  const handleToggleLock = async (value: boolean) => {
    if (value) {
      // Require the user to authenticate first before enabling App Lock
      const success = await authenticate();
      if (success) {
        await enableLock();
      } else {
        showAlert(
          "Authentication Failed",
          "You must authenticate to enable App Lock.",
          "error"
        );
      }
    } else {
      await disableLock();
    }
  };

  const handleTestAuth = async () => {
    const success = await authenticate();
    if (success) {
      showAlert("Authentication Successful", "App Lock is configured correctly!", "success");
    } else {
      showAlert("Authentication Failed", "Could not verify credentials.", "error");
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      {/* Navigation Header */}
      <View
        className="flex-row justify-between items-center px-6 pb-4 bg-surface border-b border-border/20"
        style={{ paddingTop: insets.top > 0 ? insets.top : 16 }}
      >
        <Pressable
          onPress={goBack}
          hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
          accessibilityRole="button"
          accessibilityLabel="Go back"
          className="w-10 h-10 items-center justify-center rounded-full active:bg-background"
        >
          <Feather name="arrow-left" size={24} color={colors.primary} />
        </Pressable>
        <Text className="text-h2 text-primary font-bold font-display">App Lock</Text>
        <View className="w-10 h-10" />
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{
          paddingVertical: 24,
          paddingBottom: 40 + insets.bottom,
        }}
      >
        <View className="mx-6">
          <View
            className="bg-surface rounded-2xl border border-border/40 overflow-hidden"
            style={styles.cardShadow}
          >
            {/* Toggle Row */}
            <View className="flex-row items-center justify-between px-4 py-4 border-b border-border/30">
              <View className="flex-1 mr-4">
                <Text className="text-body-lg font-medium text-primary">
                  Require authentication to open Zentra
                </Text>
              </View>
              <Switch
                value={isLockEnabled}
                onValueChange={handleToggleLock}
                trackColor={{ false: "#E5E7EB", true: colors.accent }}
                thumbColor={isLockEnabled ? "#FFFFFF" : "#F3F4F6"}
                accessibilityRole="switch"
                accessibilityState={{ checked: isLockEnabled }}
                accessibilityLabel="Require authentication to open Zentra"
              />
            </View>

            {/* Biometrics info row */}
            {isLockEnabled && (
              <View className="flex-row items-center justify-between px-4 py-4 bg-background/30">
                <Text className="text-body-md text-secondary">
                  Authentication Type
                </Text>
                <Text className="text-body-md text-primary font-semibold">
                  {authMethod}
                </Text>
              </View>
            )}
          </View>

          {/* Test Button & Info text */}
          {isLockEnabled && (
            <>
              <Pressable
                onPress={handleTestAuth}
                accessibilityRole="button"
                accessibilityLabel="Test Authentication"
                style={({ pressed }) => [
                  styles.buttonShadow,
                  {
                    backgroundColor: pressed ? "#3B31C4" : colors.accent,
                    opacity: pressed ? 0.9 : 1,
                  }
                ]}
                className="w-full h-[52px] rounded-xl items-center justify-center mt-6"
              >
                <Text className="text-white text-body-lg font-semibold font-display">
                  Test Authentication
                </Text>
              </Pressable>

              <Text className="text-caption text-secondary text-center mt-4 px-4 leading-5">
                If biometrics are unavailable, your device PIN will be used as a fallback.
              </Text>
            </>
          )}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  cardShadow: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
  },
  buttonShadow: {
    shadowColor: colors.accent,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 3,
  },
});

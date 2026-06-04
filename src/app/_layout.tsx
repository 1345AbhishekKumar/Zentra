import { fontAssets } from "@/theme/fonts";
import { ClerkProvider, useAuth } from "@clerk/expo";
import { tokenCache } from "@clerk/expo/token-cache";
import { useDocumentStore } from "@/store/documentStore";
import { colors } from "@/theme/tokens";
import { useFonts } from "expo-font";
import { Stack, useRouter, useSegments } from "expo-router";
import {
  addNotificationReceivedListener,
  addNotificationResponseReceivedListener,
  getLastNotificationResponse,
} from "@/lib/notifications";
import * as SplashScreen from "expo-splash-screen";
import { useEffect, useRef, useState } from "react";
import { ActivityIndicator, View, AppState, Modal, Text, Pressable, StyleSheet } from "react-native";
import "../global.css";
import ErrorBoundary from "@/components/ErrorBoundary";
import { Image } from "expo-image";
import { images } from "@/constants/images";
import { useAppLock } from "@/hooks/useAppLock";
import CustomAlert from "@/components/CustomAlert";

const publishableKey = process.env.EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY || "";
if (!publishableKey) {
  throw new Error("Missing EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY");
}

SplashScreen.preventAutoHideAsync();

/**
 * Handles notification deep linking navigation.
 * Nested inside ClerkProvider so useAuth() is available.
 */
function InitialLayout() {
  const router = useRouter();
  const { isLoaded, isSignedIn } = useAuth();
  const _hasHydrated = useDocumentStore((state) => state._hasHydrated);
  const coldStartHandled = useRef(false);
  const segments = useSegments();

  const [isLocked, setIsLocked] = useState(false);
  const { isLockEnabled, authenticate } = useAppLock();

  const appState = useRef(AppState.currentState);
  const isInitialLaunch = useRef(true);

  useEffect(() => {
    // Set initial launch to false after initial mount
    const timer = setTimeout(() => {
      isInitialLaunch.current = false;
    }, 1000);
    return () => clearTimeout(timer);
  }, []);

  // Request notification permissions on mount (registers Android channel + prompts user)
  useEffect(() => {
    const requestNotificationPermissions = async () => {
      try {
        const { requestPermissions } = await import("@/lib/notifications");
        await requestPermissions();
      } catch (err) {
        console.error("Failed to request notification permissions on mount:", err);
      }
    };
    requestNotificationPermissions();
  }, []);

  // Purge expired trash (older than 30 days) on startup after store hydration
  useEffect(() => {
    if (_hasHydrated) {
      try {
        const purgeExpiredTrash = useDocumentStore.getState().purgeExpiredTrash;
        if (purgeExpiredTrash) {
          purgeExpiredTrash();
        }
      } catch (err) {
        console.error("[RootLayout] Failed to purge expired trash on startup:", err);
      }
    }
  }, [_hasHydrated]);
  // Listener A — foreground notification received (no navigation)
  // Listener B — user taps a notification (background or active state)
  useEffect(() => {
    const foregroundSub = addNotificationReceivedListener(() => {
      // Optional: update bell badge dot on Home screen
      // No navigation — user is already in the app
    });

    const responseSub =
      addNotificationResponseReceivedListener((response) => {
        const documentId = response.notification.request.content.data
          ?.documentId as string | undefined;
        if (documentId) {
          const documents = useDocumentStore.getState().documents;
          const exists = documents.some((doc) => doc.id === documentId);
          if (exists) {
            router.push(`/document/${documentId}`);
          }
        }
      });

    return () => {
      foregroundSub.remove();
      responseSub.remove();
    };
  }, [router]);

  // Handle killed-state cold start: check for a pending notification response
  useEffect(() => {
    if (!_hasHydrated || !isLoaded || coldStartHandled.current) {
      return;
    }
    coldStartHandled.current = true;

    void (async () => {
      const lastResponse =
        await getLastNotificationResponse();
      if (!lastResponse) return;

      const documentId = lastResponse.notification.request.content.data
        ?.documentId as string | undefined;
      if (documentId) {
        const documents = useDocumentStore.getState().documents;
        const exists = documents.some((doc) => doc.id === documentId);
        if (exists) {
          router.replace(`/document/${documentId}`);
        }
      }
    })();
  }, [_hasHydrated, isLoaded, router]);

  // AppState listening for foregrounding transitions
  useEffect(() => {
    const subscription = AppState.addEventListener("change", async (nextAppState) => {
      if (
        appState.current.match(/inactive|background/) &&
        nextAppState === "active"
      ) {
        // Sync notifications when returning from background
        try {
          const { syncAllNotifications } = await import("@/lib/notifications");
          const documents = useDocumentStore.getState().documents;
          const notificationSettings = useDocumentStore.getState().notificationSettings;
          await syncAllNotifications(documents, notificationSettings);
        } catch (e) {
          console.error("[RootLayout] Failed to sync notifications on foregrounding:", e);
        }

        if (!isInitialLaunch.current) {
          const isAuthRoute = segments[0] === "(auth)";
          if (isLockEnabled && isSignedIn && !isAuthRoute) {
            setIsLocked(true);
            const success = await authenticate();
            if (success) {
              setIsLocked(false);
            }
          }
        }
      }
      appState.current = nextAppState;
    });

    return () => {
      subscription.remove();
    };
  }, [isLockEnabled, isSignedIn, segments, authenticate]);

  const handleManualUnlock = async () => {
    const success = await authenticate();
    if (success) {
      setIsLocked(false);
    }
  };

  return (
    <>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="add-document" options={{ presentation: "modal" }} />
      </Stack>

      <CustomAlert />

      <Modal
        visible={isLocked && isSignedIn && segments[0] !== "(auth)" && isLockEnabled}
        transparent={false}
        animationType="fade"
        onRequestClose={() => {
          // Keep it locked! Do not allow hardware back button to dismiss
        }}
      >
        <View className="flex-1 bg-surface items-center justify-center px-6">
          <View className="items-center mb-12">
            <Image
              source={images.logo}
              style={{ width: 120, height: 120 }}
              contentFit="contain"
            />
            <Text
              className="text-[#12121A] text-[44px] italic mt-4"
              style={{ fontFamily: "PlayfairDisplayItalic", lineHeight: 48 }}
            >
              Zentra
            </Text>
            <Text className="text-secondary text-body-md mt-2">
              Privacy-first Document Vault
            </Text>
          </View>

          <Pressable
            onPress={handleManualUnlock}
            style={styles.buttonShadow}
            className="w-full max-w-xs h-[52px] bg-accent rounded-xl items-center justify-center active:opacity-90"
          >
            <Text className="text-white text-body-lg font-semibold font-display">
              Unlock Zentra
            </Text>
          </Pressable>
        </View>
      </Modal>
    </>
  );
}

export default function RootLayout() {
  const [fontsLoaded] = useFonts(fontAssets);
  const _hasHydrated = useDocumentStore((state) => state._hasHydrated);

  useEffect(() => {
    if (fontsLoaded) {
      void (async () => {
        try {
          await SplashScreen.hideAsync();
        } catch (err) {
          console.error("[RootLayout] Failed to hide splash screen:", err);
        }
      })();
    }
  }, [fontsLoaded]);

  useEffect(() => {
    try {
      // @ts-ignore
      const originalHandler = ErrorUtils.getGlobalHandler();
      // @ts-ignore
      ErrorUtils.setGlobalHandler((error: Error, isFatal: boolean) => {
        console.error("[Global Error]", error, "Fatal:", isFatal);
        if (originalHandler) {
          originalHandler(error, isFatal);
        }
      });
    } catch (e) {
      console.error("[Global Error Handler] Failed to set ErrorUtils handler:", e);
    }
  }, []);

  if (!fontsLoaded) {
    return null;
  }

  if (!_hasHydrated) {
    return (
      <View
        style={{
          flex: 1,
          justifyContent: "center",
          alignItems: "center",
          backgroundColor: colors.background,
        }}
      >
        <ActivityIndicator size="large" color={colors.accent} />
      </View>
    );
  }

  return (
    <ErrorBoundary>
      <ClerkProvider publishableKey={publishableKey} tokenCache={tokenCache}>
        <InitialLayout />
      </ClerkProvider>
    </ErrorBoundary>
  );
}

const styles = StyleSheet.create({
  buttonShadow: {
    shadowColor: colors.accent,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 3,
  },
});

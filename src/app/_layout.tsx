import { fontAssets } from "@/theme/fonts";
import { ClerkProvider, useAuth } from "@clerk/expo";
import { tokenCache } from "@clerk/expo/token-cache";
import { useDocumentStore } from "@/store/documentStore";
import { colors } from "@/theme/tokens";
import { useFonts } from "expo-font";
import { Stack, useRouter } from "expo-router";
import * as Notifications from "expo-notifications";
import * as SplashScreen from "expo-splash-screen";
import { useEffect, useRef } from "react";
import { ActivityIndicator, View } from "react-native";
import "../global.css";
import ErrorBoundary from "@/components/ErrorBoundary";

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
  const { isLoaded } = useAuth();
  const _hasHydrated = useDocumentStore((state) => state._hasHydrated);
  const coldStartHandled = useRef(false);

  // Listener A — foreground notification received (no navigation)
  // Listener B — user taps a notification (background or active state)
  useEffect(() => {
    const foregroundSub = Notifications.addNotificationReceivedListener(() => {
      // Optional: update bell badge dot on Home screen
      // No navigation — user is already in the app
    });

    const responseSub =
      Notifications.addNotificationResponseReceivedListener((response) => {
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
        await Notifications.getLastNotificationResponseAsync();
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

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="add-document" options={{ presentation: "modal" }} />
    </Stack>
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

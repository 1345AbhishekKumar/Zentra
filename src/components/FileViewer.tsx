import { colors } from "@/theme/tokens";
import { DocumentFileType } from "@/types/document";
import { Feather } from "@expo/vector-icons";
import * as FileSystem from "expo-file-system";
import type * as SharingType from "expo-sharing";
import { requireOptionalNativeModule } from "expo-modules-core";
import { withIgnoreAppLock } from "@/hooks/useAppLock";
import { useState } from "react";
import {
  ActivityIndicator,
  Dimensions,
  Modal,
  Platform,
  Pressable,
  Share,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { showAlert } from "@/store/alertStore";
import {
  Gesture,
  GestureDetector,
  GestureHandlerRootView,
} from "react-native-gesture-handler";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get("window");

interface FileViewerProps {
  visible: boolean;
  onClose: () => void;
  localUri: string;
  fileType: DocumentFileType;
  fileName: string;
}

/**
 * Opens a file externally using the device's default app.
 * Uses IntentLauncher on Android, Sharing on iOS.
 */
async function openExternally(uri: string): Promise<void> {
  await withIgnoreAppLock(async () => {
    if (Platform.OS === "android") {
      let isIntentLauncherAvailable = false;
      try {
        isIntentLauncherAvailable = !!requireOptionalNativeModule("ExpoIntentLauncher");
      } catch {
        isIntentLauncherAvailable = false;
      }

      if (!isIntentLauncherAvailable) {
        showAlert(
          "Viewer Unavailable",
          "No internal viewer is available on this device/environment. Please install a PDF/document viewer app.",
          "warning"
        );
        return;
      }

      // Dynamically require expo-intent-launcher to avoid startup crashes on iOS/Web/Expo Go
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const IntentLauncher = require("expo-intent-launcher");
      // Convert file:// URI to content:// URI for Android
      const contentUri = await FileSystem.getContentUriAsync(uri);
      await IntentLauncher.startActivityAsync("android.intent.action.VIEW", {
        data: contentUri,
        flags: 1, // FLAG_GRANT_READ_URI_PERMISSION
      });
    } else {
      // iOS — use sharing to open in default app
      let isNativeSharingAvailable = false;
      let Sharing: typeof SharingType | null = null;
      try {
        // eslint-disable-next-line @typescript-eslint/no-require-imports
        Sharing = require("expo-sharing");
        isNativeSharingAvailable = Sharing ? await Sharing.isAvailableAsync() : false;
      } catch {
        isNativeSharingAvailable = false;
      }

      if (isNativeSharingAvailable && Sharing) {
        await Sharing.shareAsync(uri);
      } else {
        // Fallback to React Native's built-in Share module on iOS
        try {
          await Share.share({
            url: uri,
          });
        } catch (error) {
          console.error("RN Share fallback failed:", error);
          showAlert(
            "Viewer Unavailable",
            "Unable to open or share this file on this device/environment.",
            "error"
          );
        }
      }
    }
  });
}

/**
 * Full-screen image viewer with pinch-to-zoom.
 */
function ImageViewer({
  visible,
  onClose,
  uri,
  fileName,
}: {
  visible: boolean;
  onClose: () => void;
  uri: string;
  fileName: string;
}) {
  const insets = useSafeAreaInsets();

  // Shared values for pinch-to-zoom and pan
  const scale = useSharedValue(1);
  const savedScale = useSharedValue(1);
  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);
  const savedTranslateX = useSharedValue(0);
  const savedTranslateY = useSharedValue(0);

  const resetTransforms = () => {
    scale.value = withTiming(1);
    savedScale.value = 1;
    translateX.value = withTiming(0);
    translateY.value = withTiming(0);
    savedTranslateX.value = 0;
    savedTranslateY.value = 0;
  };

  const pinchGesture = Gesture.Pinch()
    .onUpdate((e) => {
      scale.value = savedScale.value * e.scale;
    })
    .onEnd(() => {
      if (scale.value < 1) {
        scale.value = withTiming(1);
        savedScale.value = 1;
        translateX.value = withTiming(0);
        translateY.value = withTiming(0);
        savedTranslateX.value = 0;
        savedTranslateY.value = 0;
      } else {
        savedScale.value = scale.value;
      }
    });

  const panGesture = Gesture.Pan()
    .onUpdate((e) => {
      if (savedScale.value > 1) {
        translateX.value = savedTranslateX.value + e.translationX;
        translateY.value = savedTranslateY.value + e.translationY;
      }
    })
    .onEnd(() => {
      savedTranslateX.value = translateX.value;
      savedTranslateY.value = translateY.value;
    });

  const doubleTapGesture = Gesture.Tap()
    .numberOfTaps(2)
    .onEnd(() => {
      if (savedScale.value > 1) {
        // Reset to 1x
        resetTransforms();
      } else {
        // Zoom to 2x
        scale.value = withTiming(2);
        savedScale.value = 2;
      }
    });

  const composedGesture = Gesture.Simultaneous(
    pinchGesture,
    panGesture,
    doubleTapGesture,
  );

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: translateX.value },
      { translateY: translateY.value },
      { scale: scale.value },
    ],
  }));

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <GestureHandlerRootView style={modalStyles.container}>
        {/* Header */}
        <View
          style={[
            modalStyles.header,
            { paddingTop: insets.top > 0 ? insets.top + 8 : 16 },
          ]}
        >
          <Text style={modalStyles.headerTitle} numberOfLines={1}>
            {fileName}
          </Text>
          <Pressable
            onPress={() => {
              resetTransforms();
              onClose();
            }}
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
            accessibilityRole="button"
            accessibilityLabel="Close viewer"
            style={modalStyles.closeButton}
          >
            <Feather name="x" size={24} color="#FFFFFF" />
          </Pressable>
        </View>

        {/* Image with gestures */}
        <GestureDetector gesture={composedGesture}>
          <Animated.Image
            source={{ uri }}
            style={[modalStyles.image, animatedStyle]}
            resizeMode="contain"
          />
        </GestureDetector>
      </GestureHandlerRootView>
    </Modal>
  );
}

/**
 * FileViewer component — handles viewing attached document files.
 *
 * - Images: full-screen modal with pinch-to-zoom
 * - PDF / Doc / Other: opens in the device's default external app
 */
export default function FileViewer({
  visible,
  onClose,
  localUri,
  fileType,
  fileName,
}: FileViewerProps) {
  const [loading, setLoading] = useState(false);

  // Images get the in-app viewer
  if (fileType === "image") {
    return (
      <ImageViewer
        visible={visible}
        onClose={onClose}
        uri={localUri}
        fileName={fileName}
      />
    );
  }

  // PDF / doc / other — open externally
  const handleOpenExternal = async () => {
    setLoading(true);
    try {
      await openExternally(localUri);
    } catch {
      showAlert(
        "Unable to Open",
        "No app is available to open this file type on your device.",
        "error"
      );
    } finally {
      setLoading(false);
      onClose();
    }
  };

  // Render a confirmation modal to prompt the user to open the file externally
  if (visible) {
    // We use a minimal "opening" modal while launching the external viewer
    return (
      <Modal
        visible={visible}
        transparent
        animationType="fade"
        onRequestClose={onClose}
        statusBarTranslucent
      >
        <View style={modalStyles.externalContainer}>
          <View style={modalStyles.externalCard}>
            {loading ? (
              <ActivityIndicator size="large" color={colors.accent} />
            ) : (
              <>
                <Feather name="external-link" size={40} color={colors.accent} />
                <Text style={modalStyles.externalTitle}>
                  Open in External App
                </Text>
                <Text style={modalStyles.externalSubtitle}>{fileName}</Text>
                <Pressable
                  onPress={handleOpenExternal}
                  accessibilityRole="button"
                  accessibilityLabel="Open file in external application"
                  style={modalStyles.externalButton}
                >
                  <Text style={modalStyles.externalButtonText}>Open File</Text>
                </Pressable>
                <Pressable
                  onPress={onClose}
                  accessibilityRole="button"
                  accessibilityLabel="Cancel opening file"
                  style={modalStyles.cancelButton}
                >
                  <Text style={modalStyles.cancelButtonText}>Cancel</Text>
                </Pressable>
              </>
            )}
          </View>
        </View>
      </Modal>
    );
  }

  return null;
}

const modalStyles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#000000",
    justifyContent: "center",
    alignItems: "center",
  },
  header: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    zIndex: 10,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingBottom: 12,
    backgroundColor: "rgba(0,0,0,0.5)",
  },
  headerTitle: {
    flex: 1,
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
    marginRight: 16,
  },
  closeButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(255,255,255,0.15)",
    alignItems: "center",
    justifyContent: "center",
  },
  image: {
    width: SCREEN_WIDTH,
    height: SCREEN_HEIGHT,
  },
  // External viewer modal styles
  externalContainer: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.4)",
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 32,
  },
  externalCard: {
    width: "100%",
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    paddingVertical: 32,
    paddingHorizontal: 24,
    alignItems: "center",
  },
  externalTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: colors.primary,
    marginTop: 16,
    marginBottom: 4,
  },
  externalSubtitle: {
    fontSize: 14,
    color: colors.secondary,
    marginBottom: 24,
    textAlign: "center",
  },
  externalButton: {
    width: "100%",
    height: 52,
    backgroundColor: colors.accent,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,
  },
  externalButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
  },
  cancelButton: {
    width: "100%",
    height: 44,
    alignItems: "center",
    justifyContent: "center",
  },
  cancelButtonText: {
    color: colors.secondary,
    fontSize: 16,
    fontWeight: "500",
  },
});

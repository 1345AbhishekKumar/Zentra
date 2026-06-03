import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  Pressable,
  ScrollView,
  Image,
  Alert,
  StyleSheet,
  Modal,
  TextInput,
  ActivityIndicator,
  Linking,
  AlertButton,
  Platform,
  KeyboardAvoidingView,
} from "react-native";
import { useUser, useAuth } from "@clerk/expo";
import { useRouter } from "expo-router";
import { Feather } from "@expo/vector-icons";
import NotificationToggle from "@/components/NotificationToggle";
import ConfirmationModal from "@/components/ConfirmationModal";
import ScalePressable from "@/components/ScalePressable";
import {
  cancelAllNotifications,
  scheduleDocumentNotifications,
} from "@/lib/notifications";
import { useDocumentStore } from "@/store/documentStore";
import { colors } from "@/theme/tokens";
import { expiryUrgency } from "@/lib/date";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Constants from "expo-constants";
import { requireOptionalNativeModule } from "expo-modules-core";
import { useAppLock } from "@/hooks/useAppLock";

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

interface GlobalWithNativeFlags {
  __isImagePickerNativeAvailable?: boolean;
}

const globalWithFlags = globalThis as GlobalWithNativeFlags;

const isImagePickerNativeAvailable =
  typeof globalWithFlags.__isImagePickerNativeAvailable === "boolean"
    ? globalWithFlags.__isImagePickerNativeAvailable
    : !!requireOptionalNativeModule("ExponentImagePicker");

const safeRequireImagePicker = () => {
  if (!isImagePickerNativeAvailable) {
    return null;
  }
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const ImagePicker = require("expo-image-picker");
    if (
      ImagePicker &&
      typeof ImagePicker.requestCameraPermissionsAsync === "function" &&
      typeof ImagePicker.launchCameraAsync === "function"
    ) {
      return ImagePicker as typeof import("expo-image-picker");
    }
  } catch {
    // Native module not registered
  }
  return null;
};

export default function ProfileScreen() {
  const { user } = useUser();
  const { signOut } = useAuth();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const {
    documents,
    setUser,
    notificationSettings,
    updateNotificationSettings,
    clearAllData,
  } = useDocumentStore();

  const isMountedRef = React.useRef(true);
  useEffect(() => {
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  const { isLockEnabled } = useAppLock();
  const [isUploading, setIsUploading] = useState(false);
  const [isNameModalVisible, setIsNameModalVisible] = useState(false);
  const [isSignOutModalVisible, setIsSignOutModalVisible] = useState(false);
  const [isDeleteAllDataModalVisible, setIsDeleteAllDataModalVisible] = useState(false);
  const [formFirstName, setFormFirstName] = useState("");
  const [formLastName, setFormLastName] = useState("");
  const [isSavingName, setIsSavingName] = useState(false);
  const [isFirstNameFocused, setIsFirstNameFocused] = useState(false);
  const [isLastNameFocused, setIsLastNameFocused] = useState(false);
  const [isCustomDaysModalVisible, setIsCustomDaysModalVisible] = useState(false);
  const [customDaysInput, setCustomDaysInput] = useState("");
  const [isTimeModalVisible, setIsTimeModalVisible] = useState(false);
  const [selectedHour, setSelectedHour] = useState(9);
  const [selectedMinute, setSelectedMinute] = useState(0);
  const [selectedPeriod, setSelectedPeriod] = useState<"AM" | "PM">("AM");

  const firstName = user?.firstName || "";
  const lastName = user?.lastName || "";

  // Calculate user initials
  const initials =
    (firstName.charAt(0) + lastName.charAt(0)).toUpperCase() ||
    user?.emailAddresses?.[0]?.emailAddress?.charAt(0)?.toUpperCase() ||
    "U";

  // Centralized user display info
  const displayName =
    user?.fullName ||
    (firstName && lastName ? `${firstName} ${lastName}` : "") ||
    user?.username ||
    "User";
  const email = user?.primaryEmailAddress?.emailAddress || "";
  const avatarUrl = user?.imageUrl;

  // Stats calculations (excluding soft-deleted documents)
  const activeDocs = documents.filter((doc) => !doc.isDeleted);
  const totalCount = activeDocs.length;
  const expiringSoonCount = activeDocs.filter((doc) => {
    const urgency = expiryUrgency(doc.expiryDate);
    return urgency === "critical" || urgency === "warning";
  }).length;
  const favoritesCount = activeDocs.filter((doc) => doc.isFavorite).length;
  const deletedDocumentsCount = documents.filter((doc) => doc.isDeleted).length;

  // Edit Name Modal trigger
  const openNameModal = () => {
    setFormFirstName(firstName);
    setFormLastName(lastName);
    setIsNameModalVisible(true);
  };

  // Edit Name Saver
  const handleSaveName = async () => {
    if (!formFirstName.trim()) {
      Alert.alert("Validation Error", "First name is required.");
      return;
    }
    try {
      setIsSavingName(true);
      await user?.update({
        firstName: formFirstName,
        lastName: formLastName,
      });
      setIsSavingName(false);
      setIsNameModalVisible(false);
    } catch (err) {
      console.error("Failed to update name:", err);
      setIsSavingName(false);
      Alert.alert("Update Failed", "An error occurred while updating your name.");
    }
  };

  // Avatar Press Options Sheet
  const handleAvatarPress = () => {
    const options: AlertButton[] = [
      { text: "📷 Take Photo", onPress: handleTakePhoto },
      { text: "🖼 Choose from Gallery", onPress: handleChooseFromGallery },
    ];

    if (user?.hasImage) {
      options.push({ text: "🗑 Remove Photo", onPress: handleRemovePhoto });
    }

    options.push({ text: "Cancel", style: "cancel" as const });

    Alert.alert("Profile Photo", "Choose an option to update your photo", options);
  };

  // Avatar Take Photo Flow
  const handleTakePhoto = async () => {
    try {
      const ImagePicker = safeRequireImagePicker();
      if (!ImagePicker) {
        Alert.alert(
          "Sandbox Mode",
          "Native camera is not available. A simulated profile photo has been applied for testing.",
          [{ text: "OK" }]
        );
        setIsUploading(true);
        setTimeout(async () => {
          try {
            await user?.setProfileImage({
              file: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150",
            });
            if (isMountedRef.current) {
              setIsUploading(false);
            }
          } catch (err) {
            console.error(err);
            if (isMountedRef.current) {
              setIsUploading(false);
              Alert.alert("Upload Failed", "Failed to update profile photo.");
            }
          }
        }, 1000);
        return;
      }

      const { status: cameraStatus } = await ImagePicker.requestCameraPermissionsAsync();
      if (cameraStatus !== "granted") {
        Alert.alert(
          "Permission Required",
          "Zentra needs access to your camera to take a photo. Please enable it in Settings.",
          [
            { text: "Cancel", style: "cancel" },
            { text: "Settings", onPress: () => Linking.openSettings() },
          ]
        );
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ["images"],
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.6,
        base64: true,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const asset = result.assets[0];
        if (asset.base64) {
          setIsUploading(true);
          const mimeType = asset.mimeType || "image/jpeg";
          const dataUri = `data:${mimeType};base64,${asset.base64}`;
          await user?.setProfileImage({
            file: dataUri,
          });
          setIsUploading(false);
        }
      }
    } catch (err) {
      console.error("Camera upload failed:", err);
      setIsUploading(false);
      Alert.alert("Upload Failed", "An error occurred while uploading your photo.");
    }
  };

  // Avatar Choose From Gallery Flow
  const handleChooseFromGallery = async () => {
    try {
      const ImagePicker = safeRequireImagePicker();
      if (!ImagePicker) {
        Alert.alert(
          "Sandbox Mode",
          "Native gallery is not available. A simulated profile photo has been applied for testing.",
          [{ text: "OK" }]
        );
        setIsUploading(true);
        setTimeout(async () => {
          try {
            await user?.setProfileImage({
              file: "https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?w=150",
            });
            if (isMountedRef.current) {
              setIsUploading(false);
            }
          } catch (err) {
            console.error(err);
            if (isMountedRef.current) {
              setIsUploading(false);
              Alert.alert("Upload Failed", "Failed to update profile photo.");
            }
          }
        }, 1000);
        return;
      }

      const { status: galleryStatus } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (galleryStatus !== "granted") {
        Alert.alert(
          "Permission Required",
          "Zentra needs access to your gallery to pick a photo. Please enable it in Settings.",
          [
            { text: "Cancel", style: "cancel" },
            { text: "Settings", onPress: () => Linking.openSettings() },
          ]
        );
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ["images"],
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.6,
        base64: true,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const asset = result.assets[0];
        if (asset.base64) {
          setIsUploading(true);
          const mimeType = asset.mimeType || "image/jpeg";
          const dataUri = `data:${mimeType};base64,${asset.base64}`;
          await user?.setProfileImage({
            file: dataUri,
          });
          setIsUploading(false);
        }
      }
    } catch (err) {
      console.error("Gallery upload failed:", err);
      setIsUploading(false);
      Alert.alert("Upload Failed", "An error occurred while uploading your photo.");
    }
  };

  // Avatar Remove Photo Flow
  const handleRemovePhoto = async () => {
    try {
      setIsUploading(true);
      await user?.setProfileImage({
        file: null,
      });
      setIsUploading(false);
    } catch (err) {
      console.error("Remove photo failed:", err);
      setIsUploading(false);
      Alert.alert("Failed to remove photo", "An error occurred while deleting your profile photo.");
    }
  };

  // Sign out confirmation handler
  const handleSignOut = () => {
    setIsSignOutModalVisible(true);
  };

  const handleConfirmSignOut = async () => {
    try {
      await signOut();
      setUser(null);
      router.replace("/(auth)/sign-in");
    } catch (err) {
      console.error("Error signing out:", err);
      Alert.alert("Error", "Failed to sign out. Please try again.");
    }
  };

  // Delete all documents confirmation handler
  const handleDeleteAllData = () => {
    setIsDeleteAllDataModalVisible(true);
  };

  const handleConfirmDeleteAllData = async () => {
    try {
      await cancelAllNotifications();
      clearAllData();
      Alert.alert("Success", "All document data has been deleted.");
    } catch (err) {
      console.error("Error deleting data:", err);
      Alert.alert("Error", "Failed to clear notifications or data.");
    }
  };

  // Toggle advance notice days chip handler
  const handleToggleChip = async (day: number) => {
    const currentDays = notificationSettings.advanceNoticeDays || [];
    let updatedDays: number[];
    if (currentDays.includes(day)) {
      updatedDays = currentDays.filter((d) => d !== day);
    } else {
      updatedDays = [...currentDays, day].sort((a, b) => a - b);
    }
    updateNotificationSettings({ advanceNoticeDays: updatedDays });

    if (notificationSettings.globalEnabled) {
      const promises = documents
        .filter((doc) => doc.notificationsEnabled)
        .map((doc) =>
          scheduleDocumentNotifications(
            doc,
            updatedDays,
            notificationSettings.reminderTime || "09:00",
          )
        );
      await Promise.all(promises);
    }
  };

  const handleRemoveCustomDay = async (day: number) => {
    const currentCustom = notificationSettings.customNoticeDays || [];
    const updatedCustom = currentCustom.filter((d) => d !== day);

    const currentAdvance = notificationSettings.advanceNoticeDays || [];
    const updatedAdvance = currentAdvance.filter((d) => d !== day);

    updateNotificationSettings({
      customNoticeDays: updatedCustom,
      advanceNoticeDays: updatedAdvance,
    });

    if (notificationSettings.globalEnabled) {
      const promises = documents
        .filter((doc) => doc.notificationsEnabled)
        .map((doc) =>
          scheduleDocumentNotifications(
            doc,
            updatedAdvance,
            notificationSettings.reminderTime || "09:00",
          )
        );
      await Promise.all(promises);
    }
  };

  const handleAddCustomDay = async () => {
    const daysVal = parseInt(customDaysInput.trim(), 10);
    if (isNaN(daysVal) || daysVal <= 0 || daysVal > 365) {
      Alert.alert("Validation Error", "Please enter a valid number of days between 1 and 365.");
      return;
    }

    const currentCustom = notificationSettings.customNoticeDays || [];
    const currentAdvance = notificationSettings.advanceNoticeDays || [];

    // Check if it already exists in defaults
    if ([7, 14, 30, 60, 90].includes(daysVal)) {
      if (!currentAdvance.includes(daysVal)) {
        const updatedAdvance = [...currentAdvance, daysVal].sort((a, b) => a - b);
        updateNotificationSettings({ advanceNoticeDays: updatedAdvance });
        if (notificationSettings.globalEnabled) {
          const promises = documents
            .filter((doc) => doc.notificationsEnabled)
            .map((doc) =>
              scheduleDocumentNotifications(
                doc,
                updatedAdvance,
                notificationSettings.reminderTime || "09:00"
              )
            );
          await Promise.all(promises);
        }
      }
      setIsCustomDaysModalVisible(false);
      setCustomDaysInput("");
      return;
    }

    const updatedCustom = currentCustom.includes(daysVal)
      ? currentCustom
      : [...currentCustom, daysVal].sort((a, b) => a - b);

    const updatedAdvance = currentAdvance.includes(daysVal)
      ? currentAdvance
      : [...currentAdvance, daysVal].sort((a, b) => a - b);

    updateNotificationSettings({
      customNoticeDays: updatedCustom,
      advanceNoticeDays: updatedAdvance,
    });

    if (notificationSettings.globalEnabled) {
      const promises = documents
        .filter((doc) => doc.notificationsEnabled)
        .map((doc) =>
          scheduleDocumentNotifications(
            doc,
            updatedAdvance,
            notificationSettings.reminderTime || "09:00"
          )
        );
      await Promise.all(promises);
    }

    setIsCustomDaysModalVisible(false);
    setCustomDaysInput("");
  };

  const openTimePicker = () => {
    if (Platform.OS === "web") {
      return;
    }
    const currentSettings = notificationSettings.reminderTime || "09:00";
    const [h24, m24] = currentSettings.split(":").map(Number);
    const period = h24 >= 12 ? "PM" : "AM";
    let h12 = h24 % 12;
    if (h12 === 0) h12 = 12;

    setSelectedHour(h12);
    setSelectedMinute(m24);
    setSelectedPeriod(period);
    setIsTimeModalVisible(true);
  };

  const handleSaveTime = async (time24: string) => {
    updateNotificationSettings({ reminderTime: time24 });

    if (notificationSettings.globalEnabled) {
      const promises = documents
        .filter((doc) => doc.notificationsEnabled)
        .map((doc) =>
          scheduleDocumentNotifications(
            doc,
            notificationSettings.advanceNoticeDays,
            time24,
          )
        );
      await Promise.all(promises);
    }
    setIsTimeModalVisible(false);
  };

  const handleConfirmTimePicker = () => {
    let h24 = selectedHour;
    if (selectedPeriod === "PM" && h24 !== 12) {
      h24 += 12;
    } else if (selectedPeriod === "AM" && h24 === 12) {
      h24 = 0;
    }
    const time24 = `${h24.toString().padStart(2, "0")}:${selectedMinute.toString().padStart(2, "0")}`;
    handleSaveTime(time24);
  };

  const formatReminderTime = (time24: string): string => {
    if (!time24) return "9:00 AM";
    const [h24Str, m24Str] = time24.split(":");
    const h24 = parseInt(h24Str, 10);
    const period = h24 >= 12 ? "PM" : "AM";
    let h12 = h24 % 12;
    if (h12 === 0) h12 = 12;
    return `${h12}:${m24Str} ${period}`;
  };

  const appVersion = Constants.expoConfig?.version || "1.0.0";

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{
          paddingBottom: 40 + insets.bottom,
        }}
      >
        {/* Header title */}
        <View className="px-6 pt-6 mb-4">
          <Text className="text-h1 text-primary font-bold">Profile</Text>
        </View>

        {/* User Card */}
        <View className="px-6">
          <View
            className="bg-surface items-center p-6 rounded-2xl border border-border/40"
            style={styles.cardShadow}
          >
            <Pressable
              onPress={handleAvatarPress}
              accessibilityRole="button"
              accessibilityLabel="Change profile photo"
              className="relative active:opacity-90"
            >
              {avatarUrl ? (
                <Image
                  source={{ uri: avatarUrl }}
                  className="w-16 h-16 rounded-full"
                  style={styles.avatarBorder}
                />
              ) : (
                <View
                  className="w-16 h-16 rounded-full items-center justify-center bg-soft-accent"
                  style={styles.avatarBorder}
                >
                  <Text className="text-accent text-h1 font-bold">{initials}</Text>
                </View>
              )}
              {/* Activity indicator overlay during upload */}
              {isUploading && (
                <View className="absolute inset-0 items-center justify-center bg-black/30 rounded-full">
                  <ActivityIndicator size="small" color="#FFFFFF" />
                </View>
              )}
              {/* Edit icon overlay */}
              <View
                className="absolute bottom-0 right-0 w-6 h-6 bg-accent border-2 border-surface rounded-full items-center justify-center"
                style={styles.editBadgeShadow}
              >
                <Feather name="camera" size={10} color="#FFFFFF" />
              </View>
            </Pressable>

            <Text className="text-h1 text-primary font-bold text-center mt-3">
              {displayName}
            </Text>
            <Text className="text-body-md text-secondary text-center mt-1">
              {email}
            </Text>

            <ScalePressable
              onPress={openNameModal}
              accessibilityRole="button"
              accessibilityLabel="Edit profile name"
              className="mt-3.5 px-4 bg-soft-accent rounded-full active:opacity-80 min-h-11 justify-center animate-scale"
            >
              <Text className="text-body-md text-accent font-semibold">
                Edit Profile
              </Text>
            </ScalePressable>
          </View>
        </View>

        {/* Stats Row */}
        <View
          className="flex-row justify-around bg-surface mx-6 mt-4 p-4 rounded-2xl border border-border/40"
          style={styles.cardShadow}
        >
          <View className="items-center flex-1">
            <Text className="text-h1 text-accent font-bold">{totalCount}</Text>
            <Text className="text-caption text-secondary mt-1 text-center font-medium">
              Total
            </Text>
          </View>
          <View className="w-px bg-border/40 h-8 self-center" />
          <View className="items-center flex-1">
            <Text className="text-h1 text-accent font-bold">
              {expiringSoonCount}
            </Text>
            <Text className="text-caption text-secondary mt-1 text-center font-medium">
              Expiring Soon
            </Text>
          </View>
          <View className="w-px bg-border/40 h-8 self-center" />
          <View className="items-center flex-1">
            <Text className="text-h1 text-accent font-bold">
              {favoritesCount}
            </Text>
            <Text className="text-caption text-secondary mt-1 text-center font-medium">
              Favorites
            </Text>
          </View>
        </View>

        {/* Section: My Content */}
        <View className="mt-4">
          <View className="px-6 pt-5 pb-2">
            <Text className="text-body-sm text-secondary font-semibold uppercase tracking-wider">
              My Content
            </Text>
          </View>
          <View className="px-6 mt-1">
            <View
              className="bg-surface rounded-2xl border border-border/40 overflow-hidden"
              style={styles.cardShadow}
            >
              <Pressable
                onPress={() => router.push("/favorites")}
                accessibilityRole="button"
                accessibilityLabel="Favorites"
                className="flex-row items-center px-4 py-4 border-b border-border/30 active:bg-background/50"
              >
                <Feather name="heart" size={20} color={colors.primary} />
                <Text className="text-body-lg ml-3 font-medium flex-1 text-primary">
                  Favorites
                </Text>
                <Feather name="chevron-right" size={18} color="#C7C7CC" />
              </Pressable>

              <Pressable
                onPress={() => router.push("/alerts")}
                accessibilityRole="button"
                accessibilityLabel="Expiry Alerts"
                className="flex-row items-center px-4 py-4 active:bg-background/50"
              >
                <Feather name="bell" size={20} color={colors.primary} />
                <Text className="text-body-lg ml-3 font-medium flex-1 text-primary">
                  Expiry Alerts
                </Text>
                <Feather name="chevron-right" size={18} color="#C7C7CC" />
              </Pressable>
            </View>
          </View>
        </View>

        {/* Section: Notifications */}
        <View className="mt-4">
          <View className="px-6 pt-5 pb-2">
            <Text className="text-body-sm text-secondary font-semibold uppercase tracking-wider">
              Notifications
            </Text>
          </View>
          <View className="px-6 mt-1">
            <View
              className="bg-surface rounded-2xl border border-border/40 overflow-hidden"
              style={styles.cardShadow}
            >
              <NotificationToggle
                documentId=""
                enabled={notificationSettings.globalEnabled}
                onToggle={async (enabled) => {
                  updateNotificationSettings({ globalEnabled: enabled });
                  if (!enabled) {
                    await cancelAllNotifications();
                  } else {
                    const promises = documents
                      .filter((doc) => doc.notificationsEnabled)
                      .map((doc) =>
                        scheduleDocumentNotifications(
                          doc,
                          notificationSettings.advanceNoticeDays,
                          notificationSettings.reminderTime || "09:00",
                        ),
                      );
                    await Promise.all(promises);
                  }
                }}
                label="Global Notifications"
                icon="bell"
                iconSize={20}
                iconColor={colors.primary}
                textClassName="text-body-lg ml-3 font-medium flex-1 text-primary"
                className="flex-row items-center px-4 py-4 w-full border-b border-border/30"
              />

              {/* Advance Notice Chips */}
              <View className="px-4 py-4 border-b border-border/30">
                <Text className="text-body-md font-medium text-primary mb-3">
                  Remind me before expiry
                </Text>
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={{ gap: 8, paddingRight: 16 }}
                >
                  {(() => {
                    const defaultChips = [7, 14, 30, 60, 90];
                    const customChips = notificationSettings.customNoticeDays || [];
                    const combinedChips = Array.from(
                      new Set([...defaultChips, ...customChips])
                    ).sort((a, b) => a - b);

                    return combinedChips.map((day) => {
                      const isSelected = notificationSettings.advanceNoticeDays.includes(day);
                      const isCustom = !defaultChips.includes(day);

                      return (
                        <View
                          key={day}
                          className={`flex-row items-center rounded-full border min-h-11 ${
                            isSelected
                              ? "bg-accent border-accent"
                              : "bg-surface border-border"
                          }`}
                        >
                          <Pressable
                            onPress={() => handleToggleChip(day)}
                            accessibilityRole="button"
                            accessibilityLabel={`Toggle ${day} days reminder`}
                            accessibilityState={{ selected: isSelected }}
                            className={`justify-center rounded-full ${
                              isCustom ? "pl-4 pr-2 py-2.5" : "px-4 py-2.5"
                            }`}
                            style={({ pressed }) => [
                              pressed && { opacity: 0.8 }
                            ]}
                          >
                            <Text
                              className={`text-body-md font-semibold ${
                                isSelected ? "text-white" : "text-primary"
                              }`}
                            >
                              {day}d
                            </Text>
                          </Pressable>

                          {isCustom && (
                            <Pressable
                              onPress={() => handleRemoveCustomDay(day)}
                              accessibilityRole="button"
                              accessibilityLabel={`Remove custom ${day} days reminder`}
                              className="pr-3 pl-1 py-2.5 justify-center rounded-r-full"
                              hitSlop={{ top: 10, bottom: 10, left: 5, right: 10 }}
                            >
                              <Feather
                                name="x"
                                size={12}
                                color={isSelected ? "#FFFFFF" : colors.secondary}
                              />
                            </Pressable>
                          )}
                        </View>
                      );
                    });
                  })()}

                  {/* Add Custom Chip */}
                  <Pressable
                    onPress={() => setIsCustomDaysModalVisible(true)}
                    accessibilityRole="button"
                    accessibilityLabel="Add custom reminder days"
                    className="px-4 rounded-full border border-dashed border-accent bg-soft-accent min-h-11 justify-center items-center flex-row gap-1"
                    style={({ pressed }) => [
                      pressed && { opacity: 0.8 }
                    ]}
                  >
                    <Feather name="plus" size={14} color={colors.accent} />
                    <Text className="text-body-md font-semibold text-accent">
                      Custom
                    </Text>
                  </Pressable>
                </ScrollView>
              </View>

              {/* Reminder time row */}
              <Pressable
                onPress={openTimePicker}
                accessibilityRole="button"
                accessibilityLabel={`Reminder time: ${formatReminderTime(notificationSettings.reminderTime || "09:00")}`}
                className="flex-row items-center px-4 py-4 w-full active:bg-background/50 relative"
              >
                <Feather name="clock" size={20} color={colors.primary} />
                <Text className="text-body-lg ml-3 flex-1 font-medium text-primary">
                  Reminder time
                </Text>
                <Text className="text-body-md text-accent font-semibold mr-1">
                  {formatReminderTime(notificationSettings.reminderTime || "09:00")}
                </Text>
                <Feather name="chevron-right" size={18} color="#C7C7CC" />

                {/* Web Native time input overlay */}
                {Platform.OS === "web" && (
                  <input
                    type="time"
                    value={notificationSettings.reminderTime || "09:00"}
                    onChange={(e) => handleSaveTime(e.target.value)}
                    style={webInputStyle}
                  />
                )}
              </Pressable>
            </View>
          </View>
        </View>

        {/* Section: Security */}
        <View className="mt-4">
          <View className="px-6 pt-5 pb-2">
            <Text className="text-body-sm text-secondary font-semibold uppercase tracking-wider">
              Security
            </Text>
          </View>
          <View className="px-6 mt-1">
            <View
              className="bg-surface rounded-2xl border border-border/40 overflow-hidden"
              style={styles.cardShadow}
            >
              <Pressable
                onPress={() => router.push("/app-lock" as any)}
                accessibilityRole="button"
                accessibilityLabel="App Lock"
                className="flex-row items-center px-4 py-4 active:bg-background/50"
              >
                <Feather name="lock" size={20} color={colors.primary} />
                <View className="ml-3 flex-1">
                  <Text className="text-body-lg font-medium text-primary">App Lock</Text>
                  <Text className="text-caption text-secondary mt-0.5 font-medium">
                    {isLockEnabled ? "On" : "Off"}
                  </Text>
                </View>
                <Feather name="chevron-right" size={18} color="#C7C7CC" />
              </Pressable>
            </View>
          </View>
        </View>

        {/* Section: Data */}
        <View className="mt-4">
          <View className="px-6 pt-5 pb-2">
            <Text className="text-body-sm text-secondary font-semibold uppercase tracking-wider">
              Data
            </Text>
          </View>
          <View className="px-6 mt-1">
            <View
              className="bg-surface rounded-2xl border border-border/40 overflow-hidden"
              style={styles.cardShadow}
            >
              <Pressable
                onPress={() => router.push("/recently-deleted")}
                accessibilityRole="button"
                accessibilityLabel="Recently Deleted"
                className="flex-row items-center px-4 py-4 border-b border-border/30 active:bg-background/50"
              >
                <Feather name="trash" size={20} color={colors.primary} />
                <Text className="text-body-lg ml-3 font-medium flex-1 text-primary">
                  Recently Deleted
                </Text>
                {deletedDocumentsCount > 0 && (
                  <View className="bg-accent rounded-full px-2 py-0.5 mr-2 justify-center items-center">
                    <Text className="text-white text-[11px] font-bold font-display">
                      {deletedDocumentsCount}
                    </Text>
                  </View>
                )}
                <Feather name="chevron-right" size={18} color="#C7C7CC" />
              </Pressable>

              <Pressable
                onPress={() => router.push("/export-data")}
                accessibilityRole="button"
                accessibilityLabel="Export Data"
                className="flex-row items-center px-4 py-4 border-b border-border/30 active:bg-background/50"
              >
                <Feather name="download" size={20} color={colors.primary} />
                <Text className="text-body-lg ml-3 font-medium flex-1 text-primary">
                  Export Data
                </Text>
                <Feather name="chevron-right" size={18} color="#C7C7CC" />
              </Pressable>

              <Pressable
                onPress={() => router.push("/import-data")}
                accessibilityRole="button"
                accessibilityLabel="Import Data"
                className="flex-row items-center px-4 py-4 border-b border-border/30 active:bg-background/50"
              >
                <Feather name="upload" size={20} color={colors.primary} />
                <Text className="text-body-lg ml-3 font-medium flex-1 text-primary">
                  Import Data
                </Text>
                <Feather name="chevron-right" size={18} color="#C7C7CC" />
              </Pressable>

              {__DEV__ && (
                <Pressable
                  onPress={async () => {
                    try {
                      // eslint-disable-next-line @typescript-eslint/no-require-imports
                      const { seedMockData } = require("@/lib/seed");
                      await seedMockData();
                      Alert.alert("Success", "Demo documents loaded successfully.");
                    } catch (err) {
                      console.warn("Failed to seed demo data:", err);
                      Alert.alert("Seeding Failed", "Could not load demo documents.");
                    }
                  }}
                  accessibilityRole="button"
                  accessibilityLabel="Seed Demo Documents"
                  className="flex-row items-center px-4 py-4 border-b border-border/30 active:bg-background/50"
                >
                  <Feather name="database" size={20} color={colors.accent} />
                  <Text className="text-body-lg ml-3 font-semibold flex-1 text-accent">
                    Seed Demo Documents
                  </Text>
                  <Feather name="chevron-right" size={18} color="#C7C7CC" />
                </Pressable>
              )}

              <Pressable
                onPress={handleDeleteAllData}
                accessibilityRole="button"
                accessibilityLabel="Delete All Documents"
                className="flex-row items-center px-4 py-4 active:bg-background/50"
              >
                <Feather name="trash-2" size={20} color={colors.danger} />
                <Text className="text-body-lg ml-3 font-semibold flex-1 text-danger">
                  Delete All Documents
                </Text>
                <Feather name="chevron-right" size={18} color="#C7C7CC" />
              </Pressable>
            </View>
          </View>
        </View>

        {/* Section: About */}
        <View className="mt-4">
          <View className="px-6 pt-5 pb-2">
            <Text className="text-body-sm text-secondary font-semibold uppercase tracking-wider">
              About
            </Text>
          </View>
          <View className="px-6 mt-1">
            <View
              className="bg-surface rounded-2xl border border-border/40 overflow-hidden"
              style={styles.cardShadow}
            >
              <View className="flex-row items-center px-4 py-4 border-b border-border/30">
                <Feather name="info" size={20} color={colors.primary} />
                <Text className="text-body-lg ml-3 font-medium flex-1 text-primary">
                  App Version
                </Text>
                <Text className="text-body-md text-secondary font-medium">{appVersion}</Text>
              </View>

              <Pressable
                onPress={() => router.push("/help")}
                accessibilityRole="button"
                accessibilityLabel="Help and FAQ"
                className="flex-row items-center px-4 py-4 border-b border-border/30 active:bg-background/50"
              >
                <Feather name="help-circle" size={20} color={colors.primary} />
                <Text className="text-body-lg ml-3 font-medium flex-1 text-primary">
                  Help & FAQ
                </Text>
                <Feather name="chevron-right" size={18} color="#C7C7CC" />
              </Pressable>

              <Pressable
                onPress={() => router.push("/privacy-policy")}
                accessibilityRole="button"
                accessibilityLabel="Privacy Policy"
                className="flex-row items-center px-4 py-4 border-b border-border/30 active:bg-background/50"
              >
                <Feather name="file-text" size={20} color={colors.primary} />
                <Text className="text-body-lg ml-3 font-medium flex-1 text-primary">
                  Privacy Policy
                </Text>
                <Feather name="chevron-right" size={18} color="#C7C7CC" />
              </Pressable>

              <Pressable
                onPress={() => router.push("/terms-of-service")}
                accessibilityRole="button"
                accessibilityLabel="Terms of Service"
                className="flex-row items-center px-4 py-4 border-b border-border/30 active:bg-background/50"
              >
                <Feather name="file-text" size={20} color={colors.primary} />
                <Text className="text-body-lg ml-3 font-medium flex-1 text-primary">
                  Terms of Service
                </Text>
                <Feather name="chevron-right" size={18} color="#C7C7CC" />
              </Pressable>

              <View className="flex-row items-center px-4 py-4">
                <Feather name="shield" size={20} color={colors.secondary} />
                <Text className="text-body-md text-secondary ml-3 flex-1 font-medium">
                  Private. Local. Yours.
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* Sign Out Button */}
        <View className="px-6 mt-8">
          <ScalePressable
            onPress={handleSignOut}
            style={styles.cardShadow}
            accessibilityRole="button"
            accessibilityLabel="Sign out of the app"
            className="w-full bg-surface py-4 rounded-xl items-center justify-center border border-border/40 active:opacity-75"
          >
            <Text className="text-body-lg font-semibold text-danger">Sign Out</Text>
          </ScalePressable>
        </View>
      </ScrollView>

      {/* Edit Name Custom Dialog Modal */}
      <Modal
        visible={isNameModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setIsNameModalVisible(false)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={{ flex: 1 }}
        >
          <View style={styles.modalOverlay} className="flex-1 items-center justify-center px-6">
            <View className="bg-surface w-full p-6 rounded-2xl border border-border/40" style={styles.cardShadow}>
              <Text className="text-h2 text-primary font-bold mb-4">Edit Profile Name</Text>

              <View className="mb-4">
                <Text className="text-body-md text-primary font-semibold mb-2">First Name</Text>
                <TextInput
                  value={formFirstName}
                  onChangeText={setFormFirstName}
                  onFocus={() => setIsFirstNameFocused(true)}
                  onBlur={() => setIsFirstNameFocused(false)}
                  accessibilityLabel="First name"
                  className={`w-full bg-background border rounded-xl px-4 py-3 text-body-lg text-primary ${
                    isFirstNameFocused ? "border-accent border-2" : "border-border"
                  }`}
                  placeholder="First name"
                  autoFocus
                  placeholderTextColor={colors.secondary}
                />
              </View>

              <View className="mb-6">
                <Text className="text-body-md text-primary font-semibold mb-2">Last Name</Text>
                <TextInput
                  value={formLastName}
                  onChangeText={setFormLastName}
                  onFocus={() => setIsLastNameFocused(true)}
                  onBlur={() => setIsLastNameFocused(false)}
                  accessibilityLabel="Last name"
                  className={`w-full bg-background border rounded-xl px-4 py-3 text-body-lg text-primary ${
                    isLastNameFocused ? "border-accent border-2" : "border-border"
                  }`}
                  placeholder="Last name"
                  placeholderTextColor={colors.secondary}
                />
              </View>

              <View className="flex-row gap-3">
                <ScalePressable
                  onPress={() => setIsNameModalVisible(false)}
                  accessibilityRole="button"
                  accessibilityLabel="Cancel editing name"
                  className="flex-1 bg-background border border-border py-3 rounded-xl items-center justify-center active:opacity-75 min-h-11"
                >
                  <Text className="text-body-lg font-semibold text-primary">Cancel</Text>
                </ScalePressable>
                <ScalePressable
                  onPress={handleSaveName}
                  disabled={isSavingName}
                  accessibilityRole="button"
                  accessibilityLabel="Save name changes"
                  className="flex-1 bg-accent py-3 rounded-xl items-center justify-center active:opacity-75 min-h-11"
                >
                  {isSavingName ? (
                    <ActivityIndicator size="small" color="#FFFFFF" />
                  ) : (
                    <Text className="text-body-lg font-semibold text-white">Save</Text>
                  )}
                </ScalePressable>
              </View>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* Sign Out Confirmation Modal */}
      <ConfirmationModal
        visible={isSignOutModalVisible}
        onClose={() => setIsSignOutModalVisible(false)}
        onConfirm={handleConfirmSignOut}
        title="Sign Out"
        message="Are you sure you want to sign out of Zentra?"
        confirmLabel="Sign Out"
        isDestructive
      />

      {/* Delete All Data Confirmation Modal */}
      <ConfirmationModal
        visible={isDeleteAllDataModalVisible}
        onClose={() => setIsDeleteAllDataModalVisible(false)}
        onConfirm={handleConfirmDeleteAllData}
        title="Delete All Data"
        message="This permanently deletes all documents from your vault and cancels all reminders. This action is irreversible."
        confirmLabel="Delete All"
        isDestructive
      />

      {/* Custom Days Input Modal */}
      <Modal
        visible={isCustomDaysModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setIsCustomDaysModalVisible(false)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={{ flex: 1 }}
        >
          <View style={styles.modalOverlay} className="flex-1 items-center justify-center px-6">
            <View className="bg-surface w-full p-6 rounded-2xl border border-border/40" style={styles.cardShadow}>
              <Text className="text-h2 text-primary font-bold mb-2">Add Custom Reminder</Text>
              <Text className="text-body-md text-secondary mb-4">
                Enter the number of days before expiry to receive a reminder alert.
              </Text>

              <TextInput
                value={customDaysInput}
                onChangeText={setCustomDaysInput}
                keyboardType="number-pad"
                accessibilityLabel="Number of days before expiry"
                className="w-full bg-background border border-border rounded-xl px-4 py-3 text-body-lg text-primary mb-6"
                placeholder="e.g. 15"
                placeholderTextColor={colors.secondary}
                autoFocus
              />

              <View className="flex-row gap-3">
                <ScalePressable
                  onPress={() => {
                    setIsCustomDaysModalVisible(false);
                    setCustomDaysInput("");
                  }}
                  accessibilityRole="button"
                  accessibilityLabel="Cancel adding custom reminder"
                  className="flex-1 bg-background border border-border py-3 rounded-xl items-center justify-center active:opacity-75 min-h-11"
                >
                  <Text className="text-body-lg font-semibold text-primary">Cancel</Text>
                </ScalePressable>
                <ScalePressable
                  onPress={handleAddCustomDay}
                  accessibilityRole="button"
                  accessibilityLabel="Add custom reminder day"
                  className="flex-1 bg-accent py-3 rounded-xl items-center justify-center active:opacity-75 min-h-11"
                >
                  <Text className="text-body-lg font-semibold text-white">Add</Text>
                </ScalePressable>
              </View>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* Custom Time Picker Bottom Sheet Modal */}
      {Platform.OS !== "web" && (
        <Modal
          visible={isTimeModalVisible}
          transparent
          animationType="slide"
          onRequestClose={() => setIsTimeModalVisible(false)}
        >
          <View style={styles.modalOverlay}>
            {/* Backdrop click cancels */}
            <Pressable className="flex-1" onPress={() => setIsTimeModalVisible(false)} />

            {/* Bottom Sheet Card */}
            <View
              className="bg-surface rounded-t-2xl overflow-hidden self-center shadow-lg"
              style={{ width: "100%", maxWidth: 512 }}
            >
              {/* Toolbar */}
              <View className="flex-row items-center justify-between px-6 py-4 border-b border-border bg-background">
                <ScalePressable
                  onPress={() => setIsTimeModalVisible(false)}
                  hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
                  accessibilityRole="button"
                  accessibilityLabel="Cancel time selection"
                >
                  <Text className="text-body-md text-secondary font-semibold font-display">
                    Cancel
                  </Text>
                </ScalePressable>
                <Text className="text-body-lg text-primary font-bold font-display">
                  Reminder Time
                </Text>
                <ScalePressable
                  onPress={handleConfirmTimePicker}
                  hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
                  accessibilityRole="button"
                  accessibilityLabel="Confirm time selection"
                >
                  <Text className="text-body-md text-accent font-bold font-display">
                    Done
                  </Text>
                </ScalePressable>
              </View>

              {/* Time Picker Controls */}
              <View className="flex-row justify-center items-center py-8 bg-surface gap-6">
                {/* Hours Selector */}
                <View className="items-center">
                  <Pressable
                    onPress={() => setSelectedHour((prev) => (prev === 12 ? 1 : prev + 1))}
                    accessibilityRole="button"
                    accessibilityLabel="Increment hour"
                    className="w-12 h-10 items-center justify-center rounded-lg active:bg-soft-accent"
                  >
                    <Feather name="chevron-up" size={24} color={colors.accent} />
                  </Pressable>
                  <Text className="text-display text-primary font-bold my-1 w-16 text-center font-display">
                    {selectedHour.toString().padStart(2, "0")}
                  </Text>
                  <Pressable
                    onPress={() => setSelectedHour((prev) => (prev === 1 ? 12 : prev - 1))}
                    accessibilityRole="button"
                    accessibilityLabel="Decrement hour"
                    className="w-12 h-10 items-center justify-center rounded-lg active:bg-soft-accent"
                  >
                    <Feather name="chevron-down" size={24} color={colors.accent} />
                  </Pressable>
                </View>

                {/* Colon */}
                <Text className="text-display text-primary font-bold mb-4 font-display">:</Text>

                {/* Minutes Selector */}
                <View className="items-center">
                  <Pressable
                    onPress={() => setSelectedMinute((prev) => (prev === 59 ? 0 : prev + 1))}
                    accessibilityRole="button"
                    accessibilityLabel="Increment minute"
                    className="w-12 h-10 items-center justify-center rounded-lg active:bg-soft-accent"
                  >
                    <Feather name="chevron-up" size={24} color={colors.accent} />
                  </Pressable>
                  <Text className="text-display text-primary font-bold my-1 w-16 text-center font-display">
                    {selectedMinute.toString().padStart(2, "0")}
                  </Text>
                  <Pressable
                    onPress={() => setSelectedMinute((prev) => (prev === 0 ? 59 : prev - 1))}
                    accessibilityRole="button"
                    accessibilityLabel="Decrement minute"
                    className="w-12 h-10 items-center justify-center rounded-lg active:bg-soft-accent"
                  >
                    <Feather name="chevron-down" size={24} color={colors.accent} />
                  </Pressable>
                </View>

                {/* Period AM/PM */}
                <View className="flex-col gap-2 ml-4">
                  <Pressable
                    onPress={() => setSelectedPeriod("AM")}
                    accessibilityRole="button"
                    accessibilityLabel="Select AM"
                    accessibilityState={{ selected: selectedPeriod === "AM" }}
                    className={`px-4 py-2 rounded-lg border items-center justify-center ${
                      selectedPeriod === "AM"
                        ? "bg-accent border-accent"
                        : "bg-surface border-border"
                    }`}
                  >
                    <Text
                      className={`text-body-md font-bold ${
                        selectedPeriod === "AM" ? "text-white" : "text-primary"
                      }`}
                    >
                      AM
                    </Text>
                  </Pressable>
                  <Pressable
                    onPress={() => setSelectedPeriod("PM")}
                    accessibilityRole="button"
                    accessibilityLabel="Select PM"
                    accessibilityState={{ selected: selectedPeriod === "PM" }}
                    className={`px-4 py-2 rounded-lg border items-center justify-center ${
                      selectedPeriod === "PM"
                        ? "bg-accent border-accent"
                        : "bg-surface border-border"
                    }`}
                  >
                    <Text
                      className={`text-body-md font-bold ${
                        selectedPeriod === "PM" ? "text-white" : "text-primary"
                      }`}
                    >
                      PM
                    </Text>
                  </Pressable>
                </View>
              </View>

              {/* Safe Area space spacer */}
              <View style={{ height: Math.max(insets.bottom, 24), backgroundColor: colors.surface }} />
            </View>
          </View>
        </Modal>
      )}
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
  avatarBorder: {
    borderWidth: 2,
    borderColor: "#EEF2FF",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.4)",
  },
  editBadgeShadow: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
});

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
import {
  cancelAllNotifications,
  scheduleDocumentNotifications,
} from "@/lib/notifications";
import { useDocumentStore } from "@/store/documentStore";
import { colors } from "@/theme/tokens";
import { expiryUrgency } from "@/lib/date";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Constants from "expo-constants";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { requireOptionalNativeModule } from "expo-modules-core";

const isImagePickerNativeAvailable =
  typeof (globalThis as any).__isImagePickerNativeAvailable === "boolean"
    ? (globalThis as any).__isImagePickerNativeAvailable
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

  const [isAppLockEnabled, setIsAppLockEnabled] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [isNameModalVisible, setIsNameModalVisible] = useState(false);
  const [formFirstName, setFormFirstName] = useState("");
  const [formLastName, setFormLastName] = useState("");
  const [isSavingName, setIsSavingName] = useState(false);
  const [isFirstNameFocused, setIsFirstNameFocused] = useState(false);
  const [isLastNameFocused, setIsLastNameFocused] = useState(false);

  useEffect(() => {
    const checkAppLock = async () => {
      try {
        const val = await AsyncStorage.getItem("zentra-app-lock-enabled");
        setIsAppLockEnabled(val === "true");
      } catch (err) {
        console.error("Error reading app lock status:", err);
      }
    };
    checkAppLock();
  }, []);

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

  // Stats calculations
  const totalCount = documents.length;
  const expiringSoonCount = documents.filter((doc) => {
    const urgency = expiryUrgency(doc.expiryDate);
    return urgency === "critical" || urgency === "warning";
  }).length;
  const favoritesCount = documents.filter((doc) => doc.isFavorite).length;

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
            setIsUploading(false);
          } catch (err) {
            console.error(err);
            setIsUploading(false);
            Alert.alert("Upload Failed", "Failed to update profile photo.");
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
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
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
            setIsUploading(false);
          } catch (err) {
            console.error(err);
            setIsUploading(false);
            Alert.alert("Upload Failed", "Failed to update profile photo.");
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
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
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
    Alert.alert(
      "Sign Out",
      "Are you sure?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Sign Out",
          style: "destructive",
          onPress: async () => {
            try {
              await signOut();
              setUser(null);
              router.replace("/(auth)/sign-in");
            } catch (err) {
              console.error("Error signing out:", err);
              Alert.alert("Error", "Failed to sign out. Please try again.");
            }
          },
        },
      ]
    );
  };

  // Delete all documents confirmation handler
  const handleDeleteAllData = () => {
    Alert.alert(
      "Delete All Data",
      "This permanently deletes all documents and cannot be undone.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              await cancelAllNotifications();
              clearAllData();
              Alert.alert("Success", "All document data has been deleted.");
            } catch (err) {
              console.error("Error deleting data:", err);
              Alert.alert("Error", "Failed to clear notifications or data.");
            }
          },
        },
      ]
    );
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
      for (const doc of documents) {
        if (doc.notificationsEnabled) {
          await scheduleDocumentNotifications(doc, updatedDays);
        }
      }
    }
  };

  const appVersion = Constants.expoConfig?.version || "1.0.0";
  const noticeChips = [7, 14, 30, 60, 90];

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{
          paddingBottom: 40 + insets.bottom,
        }}
      >
        {/* Header title */}
        <View
          className="px-6 pt-6 mb-4"
          style={{ paddingTop: insets.top > 0 ? insets.top : 16 }}
        >
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

            <Pressable
              onPress={openNameModal}
              accessibilityRole="button"
              accessibilityLabel="Edit profile name"
              className="mt-3.5 px-4 bg-soft-accent rounded-full active:opacity-80 min-h-11 justify-center"
            >
              <Text className="text-body-md text-accent font-semibold">
                Edit Profile
              </Text>
            </Pressable>
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
                    for (const doc of documents) {
                      if (doc.notificationsEnabled) {
                        await scheduleDocumentNotifications(
                          doc,
                          notificationSettings.advanceNoticeDays,
                        );
                      }
                    }
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
                  contentContainerStyle={{ gap: 8 }}
                >
                  {noticeChips.map((day) => {
                    const isSelected = notificationSettings.advanceNoticeDays.includes(day);
                    return (
                      <Pressable
                        key={day}
                        onPress={() => handleToggleChip(day)}
                        accessibilityRole="button"
                        accessibilityLabel={`Toggle ${day} days reminder`}
                        accessibilityState={{ selected: isSelected }}
                        className={`px-4 rounded-full border active:opacity-85 min-h-11 justify-center ${
                          isSelected
                            ? "bg-accent border-accent"
                            : "bg-surface border-border"
                        }`}
                        style={({ pressed }) => [
                          pressed && { transform: [{ scale: 0.96 }] }
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
                    );
                  })}
                </ScrollView>
              </View>

              {/* Sent at 9:00 AM display-only row */}
              <View className="flex-row items-center px-4 py-4 w-full">
                <Feather name="info" size={20} color={colors.secondary} />
                <Text className="text-body-md text-secondary ml-3 flex-1 font-medium">
                  Reminders sent at 9:00 AM
                </Text>
              </View>
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
                    {isAppLockEnabled ? "On" : "Off"}
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
          <Pressable
            onPress={handleSignOut}
            style={styles.cardShadow}
            accessibilityRole="button"
            accessibilityLabel="Sign out of the app"
            className="w-full bg-surface py-4 rounded-xl items-center justify-center border border-border/40 active:opacity-75"
          >
            <Text className="text-body-lg font-semibold text-danger">Sign Out</Text>
          </Pressable>
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
                <Pressable
                  onPress={() => setIsNameModalVisible(false)}
                  accessibilityRole="button"
                  accessibilityLabel="Cancel editing name"
                  className="flex-1 bg-background border border-border py-3 rounded-xl items-center justify-center active:opacity-75 min-h-11"
                >
                  <Text className="text-body-lg font-semibold text-primary">Cancel</Text>
                </Pressable>
                <Pressable
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
                </Pressable>
              </View>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
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

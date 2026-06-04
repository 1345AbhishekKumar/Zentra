import React, { useState } from "react";
import { View, Text, Pressable, ScrollView, Alert, Platform } from "react-native";
import { useUser, useAuth } from "@clerk/expo";
import { useRouter } from "expo-router";
import { Feather } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Constants from "expo-constants";

import NotificationToggle from "@/components/NotificationToggle";
import ConfirmationModal from "@/components/ConfirmationModal";
import ScalePressable from "@/components/ScalePressable";
import EditNameModal from "@/components/EditNameModal";
import CustomReminderModal from "@/components/CustomReminderModal";
import ReminderTimeModal from "@/components/ReminderTimeModal";

import {
  ProfileUserCard,
  ProfileStatsRow,
  ProfileMenuSection,
  ProfileMenuItem,
  NotificationChips,
} from "@/components/profile";

import { useDocumentStore } from "@/store/documentStore";
import { useProfilePhoto } from "@/hooks/useProfilePhoto";
import { useProfileNotifications } from "@/hooks/useProfileNotifications";
import { useAppLock } from "@/hooks/useAppLock";
import { colors } from "@/theme/tokens";
import { expiryUrgency } from "@/lib/date";
import { cancelAllNotifications } from "@/lib/notifications";

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

export default function ProfileScreen() {
  const { user } = useUser();
  const { signOut } = useAuth();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { documents, setUser, clearAllData } = useDocumentStore();
  const { isLockEnabled } = useAppLock();

  // Modals visibility
  const [isNameModalVisible, setIsNameModalVisible] = useState(false);
  const [isSignOutModalVisible, setIsSignOutModalVisible] = useState(false);
  const [isDeleteAllDataModalVisible, setIsDeleteAllDataModalVisible] = useState(false);
  const [isCustomDaysModalVisible, setIsCustomDaysModalVisible] = useState(false);
  const [isTimeModalVisible, setIsTimeModalVisible] = useState(false);

  // Hooks
  const { isUploading, handleAvatarPress } = useProfilePhoto(user);
  const {
    notificationSettings,
    reminderTime,
    handleToggleChip,
    handleRemoveCustomDay,
    handleAddCustomDay,
    handleGlobalToggle,
    handleSaveTime,
    canOpenNativeTimePicker,
    formatReminderTime,
    getCombinedChips,
    isDefaultChip,
  } = useProfileNotifications();

  // User display info
  const firstName = user?.firstName || "";
  const lastName = user?.lastName || "";
  const initials =
    (firstName.charAt(0) + lastName.charAt(0)).toUpperCase() ||
    user?.emailAddresses?.[0]?.emailAddress?.charAt(0)?.toUpperCase() ||
    "U";
  const displayName =
    user?.fullName ||
    (firstName && lastName ? `${firstName} ${lastName}` : "") ||
    user?.username ||
    "User";
  const email = user?.primaryEmailAddress?.emailAddress || "";
  const avatarUrl = user?.imageUrl;

  // Stats (excluding soft-deleted documents)
  const activeDocs = documents.filter((doc) => !doc.isDeleted);
  const totalCount = activeDocs.length;
  const expiringSoonCount = activeDocs.filter((doc) => {
    const urgency = expiryUrgency(doc.expiryDate);
    return urgency === "critical" || urgency === "warning";
  }).length;
  const favoritesCount = activeDocs.filter((doc) => doc.isFavorite).length;
  const deletedDocumentsCount = documents.filter((doc) => doc.isDeleted).length;

  // Action handlers
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

  const onSaveTime = async (time24: string) => {
    await handleSaveTime(time24);
    setIsTimeModalVisible(false);
  };

  const onAddCustomDay = async (daysVal: number) => {
    await handleAddCustomDay(daysVal);
    setIsCustomDaysModalVisible(false);
  };

  const appVersion = Constants.expoConfig?.version || "1.0.0";

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 40 + insets.bottom }}
      >
        {/* Header title */}
        <View className="px-6 pt-6 mb-4">
          <Text className="text-h1 text-primary font-bold">Profile</Text>
        </View>

        {/* User Card */}
        <ProfileUserCard
          avatarUrl={avatarUrl}
          initials={initials}
          displayName={displayName}
          email={email}
          isUploading={isUploading}
          onAvatarPress={handleAvatarPress}
          onEditPress={() => setIsNameModalVisible(true)}
        />

        {/* Stats Row */}
        <ProfileStatsRow
          stats={[
            { value: totalCount, label: "Total" },
            { value: expiringSoonCount, label: "Expiring Soon" },
            { value: favoritesCount, label: "Favorites" },
          ]}
        />

        {/* Section: My Content */}
        <ProfileMenuSection title="My Content">
          <ProfileMenuItem
            icon="heart"
            label="Favorites"
            onPress={() => router.push("/favorites")}
            showBorder
          />
          <ProfileMenuItem
            icon="bell"
            label="Expiry Alerts"
            onPress={() => router.push("/alerts")}
          />
        </ProfileMenuSection>

        {/* Section: Notifications */}
        <ProfileMenuSection title="Notifications">
          <NotificationToggle
            documentId=""
            enabled={notificationSettings.globalEnabled}
            onToggle={handleGlobalToggle}
            label="Global Notifications"
            icon="bell"
            iconSize={20}
            iconColor={colors.primary}
            textClassName="text-body-lg ml-3 font-medium flex-1 text-primary"
            className="flex-row items-center px-4 py-4 w-full border-b border-border/30"
          />

          <NotificationChips
            chips={getCombinedChips()}
            selectedDays={notificationSettings.advanceNoticeDays}
            onToggle={handleToggleChip}
            onRemoveCustom={handleRemoveCustomDay}
            onAddCustom={() => setIsCustomDaysModalVisible(true)}
            isDefaultChip={isDefaultChip}
          />

          {/* Reminder time row */}
          <Pressable
            onPress={() => {
              if (canOpenNativeTimePicker) setIsTimeModalVisible(true);
            }}
            accessibilityRole="button"
            accessibilityLabel={`Reminder time: ${formatReminderTime(reminderTime)}`}
            className="flex-row items-center px-4 py-4 w-full active:bg-background/50 relative"
          >
            <Feather name="clock" size={20} color={colors.primary} />
            <Text className="text-body-lg ml-3 flex-1 font-medium text-primary">
              Reminder time
            </Text>
            <Text className="text-body-md text-accent font-semibold mr-1">
              {formatReminderTime(reminderTime)}
            </Text>
            <Feather name="chevron-right" size={18} color="#C7C7CC" />

            {/* Web Native time input overlay */}
            {Platform.OS === "web" && (
              <input
                type="time"
                value={reminderTime}
                onChange={(e) => onSaveTime(e.target.value)}
                style={webInputStyle}
              />
            )}
          </Pressable>
        </ProfileMenuSection>

        {/* Section: Security */}
        <ProfileMenuSection title="Security">
          <ProfileMenuItem
            icon="lock"
            label="App Lock"
            subtitle={isLockEnabled ? "On" : "Off"}
            onPress={() => router.push("/app-lock" as any)}
          />
        </ProfileMenuSection>

        {/* Section: Data */}
        <ProfileMenuSection title="Data">
          <ProfileMenuItem
            icon="trash"
            label="Recently Deleted"
            onPress={() => router.push("/recently-deleted")}
            showBorder
            badge={
              deletedDocumentsCount > 0 ? (
                <View className="bg-accent rounded-full px-2 py-0.5 mr-2 justify-center items-center">
                  <Text className="text-white text-[11px] font-bold font-display">
                    {deletedDocumentsCount}
                  </Text>
                </View>
              ) : undefined
            }
          />
          <ProfileMenuItem
            icon="download"
            label="Export Data"
            onPress={() => router.push("/export-data")}
            showBorder
          />
          <ProfileMenuItem
            icon="upload"
            label="Import Data"
            onPress={() => router.push("/import-data")}
            showBorder={!!__DEV__}
          />

          {__DEV__ && (
            <ProfileMenuItem
              icon="database"
              label="Seed Demo Documents"
              iconColor={colors.accent}
              textColorClass="text-accent"
              fontWeightClass="font-semibold"
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
              showBorder
            />
          )}

          <ProfileMenuItem
            icon="trash-2"
            label="Delete All Documents"
            iconColor={colors.danger}
            textColorClass="text-danger"
            fontWeightClass="font-semibold"
            onPress={() => setIsDeleteAllDataModalVisible(true)}
          />
        </ProfileMenuSection>

        {/* Section: About */}
        <ProfileMenuSection title="About">
          <View className="flex-row items-center px-4 py-4 border-b border-border/30">
            <Feather name="info" size={20} color={colors.primary} />
            <Text className="text-body-lg ml-3 font-medium flex-1 text-primary">
              App Version
            </Text>
            <Text className="text-body-md text-secondary font-medium">{appVersion}</Text>
          </View>

          <ProfileMenuItem
            icon="help-circle"
            label="Help & FAQ"
            onPress={() => router.push("/help")}
            showBorder
          />
          <ProfileMenuItem
            icon="file-text"
            label="Privacy Policy"
            onPress={() => router.push("/privacy-policy")}
            showBorder
          />
          <ProfileMenuItem
            icon="file-text"
            label="Terms of Service"
            onPress={() => router.push("/terms-of-service")}
            showBorder
          />

          <View className="flex-row items-center px-4 py-4">
            <Feather name="shield" size={20} color={colors.secondary} />
            <Text className="text-body-md text-secondary ml-3 flex-1 font-medium">
              Private. Local. Yours.
            </Text>
          </View>
        </ProfileMenuSection>

        {/* Sign Out Button */}
        <View className="px-6 mt-8">
          <ScalePressable
            onPress={() => setIsSignOutModalVisible(true)}
            accessibilityRole="button"
            accessibilityLabel="Sign out of the app"
            className="w-full bg-surface py-4 rounded-xl items-center justify-center border border-border/40 active:opacity-75"
          >
            <Text className="text-body-lg font-semibold text-danger">Sign Out</Text>
          </ScalePressable>
        </View>
      </ScrollView>

      {/* Modals */}
      <EditNameModal
        visible={isNameModalVisible}
        onClose={() => setIsNameModalVisible(false)}
        user={user}
      />

      <ConfirmationModal
        visible={isSignOutModalVisible}
        onClose={() => setIsSignOutModalVisible(false)}
        onConfirm={handleConfirmSignOut}
        title="Sign Out"
        message="Are you sure you want to sign out of Zentra?"
        confirmLabel="Sign Out"
        isDestructive
      />

      <ConfirmationModal
        visible={isDeleteAllDataModalVisible}
        onClose={() => setIsDeleteAllDataModalVisible(false)}
        onConfirm={handleConfirmDeleteAllData}
        title="Delete All Data"
        message="This permanently deletes all documents from your vault and cancels all reminders. This action is irreversible."
        confirmLabel="Delete All"
        isDestructive
      />

      <CustomReminderModal
        visible={isCustomDaysModalVisible}
        onClose={() => setIsCustomDaysModalVisible(false)}
        onAdd={onAddCustomDay}
      />

      <ReminderTimeModal
        visible={isTimeModalVisible}
        onClose={() => setIsTimeModalVisible(false)}
        onConfirm={onSaveTime}
        currentTime24={reminderTime}
      />
    </View>
  );
}

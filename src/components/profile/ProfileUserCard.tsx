import React from "react";
import { View, Text, Pressable, Image, ActivityIndicator, StyleSheet } from "react-native";
import { Feather } from "@expo/vector-icons";
import ScalePressable from "@/components/ScalePressable";

interface ProfileUserCardProps {
  avatarUrl: string | undefined;
  initials: string;
  displayName: string;
  email: string;
  isUploading: boolean;
  onAvatarPress: () => void;
  onEditPress: () => void;
}

export default function ProfileUserCard({
  avatarUrl,
  initials,
  displayName,
  email,
  isUploading,
  onAvatarPress,
  onEditPress,
}: ProfileUserCardProps) {
  return (
    <View className="px-6">
      <View
        className="bg-surface items-center p-6 rounded-2xl border border-border/40"
        style={styles.cardShadow}
      >
        <Pressable
          onPress={onAvatarPress}
          accessibilityRole="button"
          accessibilityLabel="Change profile photo"
          className="relative active:opacity-90"
        >
          {avatarUrl ? (
            <Image
              source={{ uri: avatarUrl }}
              className="w-16 h-16 rounded-full border-2 border-soft-accent"
            />
          ) : (
            <View
              className="w-16 h-16 rounded-full items-center justify-center bg-soft-accent border-2 border-soft-accent"
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
          onPress={onEditPress}
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
  editBadgeShadow: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
});

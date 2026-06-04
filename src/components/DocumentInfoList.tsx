import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { Feather } from "@expo/vector-icons";
import { ZentraDocument } from "@/types";
import NotificationToggle from "@/components/NotificationToggle";

interface DocumentInfoListProps {
  doc: ZentraDocument;
  typeLabel: string;
  sizeLabel: string;
  formattedAdded: string;
  formattedExpiry: string;
  formattedModified: string;
  creatorName: string;
  toggleNotification: (id: string) => Promise<void>;
}

export default function DocumentInfoList({
  doc,
  typeLabel,
  sizeLabel,
  formattedAdded,
  formattedExpiry,
  formattedModified,
  creatorName,
  toggleNotification,
}: DocumentInfoListProps) {
  return (
    <View className="mt-8">
      <Text className="text-h2 text-primary font-bold mb-4">
        Information
      </Text>
      <View className="bg-surface rounded-2xl border border-border/40 overflow-hidden px-4">
        {/* Type row */}
        <View className="flex-row justify-between items-center py-4 border-b border-border/30">
          <View className="flex-row items-center">
            <Feather
              name="file-text"
              size={16}
              color="#8A8A8F"
              style={styles.infoIcon}
            />
            <Text className="text-body-md text-secondary">Type</Text>
          </View>
          <Text className="text-body-md text-primary font-medium">
            {typeLabel}
          </Text>
        </View>

        {/* Size row */}
        <View className="flex-row justify-between items-center py-4 border-b border-border/30">
          <View className="flex-row items-center">
            <Feather
              name="database"
              size={16}
              color="#8A8A8F"
              style={styles.infoIcon}
            />
            <Text className="text-body-md text-secondary">Size</Text>
          </View>
          <Text className="text-body-md text-primary font-medium">
            {sizeLabel}
          </Text>
        </View>

        {/* Added on row */}
        <View className="flex-row justify-between items-center py-4 border-b border-border/30">
          <View className="flex-row items-center">
            <Feather
              name="calendar"
              size={16}
              color="#8A8A8F"
              style={styles.infoIcon}
            />
            <Text className="text-body-md text-secondary">Added on</Text>
          </View>
          <Text className="text-body-md text-primary font-medium">
            {formattedAdded}
          </Text>
        </View>

        {/* Expiry Date row */}
        <View className="flex-row justify-between items-center py-4 border-b border-border/30">
          <View className="flex-row items-center">
            <Feather
              name="clock"
              size={16}
              color="#8A8A8F"
              style={styles.infoIcon}
            />
            <Text className="text-body-md text-secondary">Expiry Date</Text>
          </View>
          <Text className="text-body-md text-primary font-medium">
            {formattedExpiry}
          </Text>
        </View>

        {/* Notifications row */}
        <View className="flex-row justify-between items-center py-4 border-b border-border/30">
          <NotificationToggle
            documentId={doc.id}
            enabled={doc.notificationsEnabled}
            onToggle={async () => {
              await toggleNotification(doc.id);
            }}
            label="Notifications"
            icon="bell"
            iconSize={16}
            iconColor="#8A8A8F"
            textClassName="text-body-md text-secondary"
            className="flex-row items-center justify-between w-full"
          />
        </View>

        {/* Location row */}
        <View className="flex-row justify-between items-center py-4 border-b border-border/30">
          <View className="flex-row items-center">
            <Feather
              name="folder"
              size={16}
              color="#8A8A8F"
              style={styles.infoIcon}
            />
            <Text className="text-body-md text-secondary">Location</Text>
          </View>
          <View className="bg-soft-accent px-3 py-1 rounded-md">
            <Text className="text-caption text-accent font-semibold">
              {doc.category}
            </Text>
          </View>
        </View>

        {/* Modified on row */}
        <View className="flex-row justify-between items-center py-4 border-b border-border/30">
          <View className="flex-row items-center">
            <Feather
              name="edit-3"
              size={16}
              color="#8A8A8F"
              style={styles.infoIcon}
            />
            <Text className="text-body-md text-secondary">Modified on</Text>
          </View>
          <Text className="text-body-md text-primary font-medium">
            {formattedModified}
          </Text>
        </View>

        {/* Created by row */}
        <View className="flex-row justify-between items-center py-4">
          <View className="flex-row items-center">
            <Feather
              name="user"
              size={16}
              color="#8A8A8F"
              style={styles.infoIcon}
            />
            <Text className="text-body-md text-secondary">Created by</Text>
          </View>
          <Text className="text-body-md text-primary font-medium">
            {creatorName}
          </Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  infoIcon: {
    marginRight: 12,
  },
});

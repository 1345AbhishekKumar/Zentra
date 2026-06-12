import React from "react";
import { View, Text } from "react-native";
import { Feather } from "@expo/vector-icons";
import { ZentraDocument } from "@/types";
import NotificationToggle from "@/components/NotificationToggle";
import { colors } from "@/theme/tokens";

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

interface InfoRowProps {
  icon: React.ComponentProps<typeof Feather>["name"];
  label: string;
  value: React.ReactNode;
  isLast?: boolean;
}

function InfoRow({ icon, label, value, isLast = false }: InfoRowProps) {
  return (
    <View className={`flex-row justify-between items-center py-4 ${!isLast ? "border-b border-border/30" : ""}`}>
      <View className="flex-row items-center">
        <Feather
          name={icon}
          size={16}
          color={colors.secondary}
          className="mr-3"
        />
        <Text className="text-body-md text-secondary">{label}</Text>
      </View>
      {typeof value === "string" ? (
        <Text className="text-body-md text-primary font-medium">
          {value}
        </Text>
      ) : (
        value
      )}
    </View>
  );
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
      <Text className="text-h2 text-primary font-bold mb-4 font-display">
        Information
      </Text>
      <View className="bg-surface rounded-2xl border border-border/40 overflow-hidden px-4">
        {/* Type row */}
        <InfoRow icon="file-text" label="Type" value={typeLabel} />

        {/* Size row */}
        <InfoRow icon="database" label="Size" value={sizeLabel} />

        {/* Added on row */}
        <InfoRow icon="calendar" label="Added on" value={formattedAdded} />

        {/* Expiry Date row */}
        <InfoRow icon="clock" label="Expiry Date" value={formattedExpiry} />

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
            iconColor={colors.secondary}
            textClassName="text-body-md text-secondary"
            className="flex-row items-center justify-between w-full"
          />
        </View>

        {/* Location row */}
        <InfoRow
          icon="folder"
          label="Location"
          value={
            <View className="bg-soft-accent px-3 py-1 rounded-md">
              <Text className="text-caption text-accent font-semibold">
                {doc.category}
              </Text>
            </View>
          }
        />

        {/* Modified on row */}
        <InfoRow icon="edit-3" label="Modified on" value={formattedModified} />

        {/* Created by row */}
        <InfoRow icon="user" label="Created by" value={creatorName} isLast />
      </View>
    </View>
  );
}

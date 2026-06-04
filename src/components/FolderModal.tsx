import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  Modal,
  TextInput,
} from "react-native";
import ScalePressable from "@/components/ScalePressable";
import { colors } from "@/theme/tokens";
import { showAlert } from "@/store/alertStore";

interface FolderModalProps {
  visible: boolean;
  onClose: () => void;
  mode: "create" | "rename";
  initialName?: string;
  onSave: (name: string) => void;
}

export default function FolderModal({
  visible,
  onClose,
  mode,
  initialName = "",
  onSave,
}: FolderModalProps) {
  const [folderInputName, setFolderInputName] = useState("");
  const [isFolderInputFocused, setIsFolderInputFocused] = useState(false);

  useEffect(() => {
    if (visible) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setFolderInputName(mode === "rename" ? initialName : "");
    }
  }, [visible, mode, initialName]);

  const handleSave = () => {
    const name = folderInputName.trim();
    if (!name) {
      showAlert("Validation Error", "Folder name cannot be empty.", "warning");
      return;
    }
    onSave(name);
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={{ flex: 1, backgroundColor: "rgba(0, 0, 0, 0.4)" }} className="flex-1 items-center justify-center px-6">
        <View className="bg-surface w-full p-6 rounded-2xl border border-border/40" style={{
          shadowColor: "#000",
          shadowOffset: { width: 0, height: 1 },
          shadowOpacity: 0.04,
          shadowRadius: 4,
          elevation: 1,
        }}>
          <Text className="text-h2 text-primary font-bold mb-4 font-display">
            {mode === "create" ? "Create New Folder" : "Rename Folder"}
          </Text>

          <View className="mb-6">
            <Text className="text-body-md text-primary font-semibold mb-2">Folder Name</Text>
            <TextInput
              value={folderInputName}
              onChangeText={setFolderInputName}
              onFocus={() => setIsFolderInputFocused(true)}
              onBlur={() => setIsFolderInputFocused(false)}
              accessibilityLabel="Folder name"
              className={`w-full bg-background border-2 rounded-xl px-4 py-[11px] text-body-lg text-primary ${
                isFolderInputFocused ? "border-accent" : "border-border/40"
              }`}
              placeholder="e.g. Work Documents"
              autoFocus
              placeholderTextColor={colors.secondary}
            />
          </View>

          <View className="flex-row gap-3">
            <ScalePressable
              onPress={onClose}
              accessibilityRole="button"
              accessibilityLabel="Cancel folder creation or rename"
              className="flex-1 bg-background border border-border py-3.5 rounded-xl items-center justify-center active:opacity-75 min-h-[48px]"
            >
              <Text className="text-body-md font-bold text-primary font-display font-semibold">Cancel</Text>
            </ScalePressable>
            <ScalePressable
              onPress={handleSave}
              accessibilityRole="button"
              className="flex-1 bg-accent py-3.5 rounded-xl items-center justify-center active:opacity-85 min-h-[48px]"
            >
              <Text className="text-body-md font-bold text-white font-display font-semibold">
                {mode === "create" ? "Create" : "Save"}
              </Text>
            </ScalePressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}

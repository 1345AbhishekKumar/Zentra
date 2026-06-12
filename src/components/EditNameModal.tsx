import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  Modal,
  TextInput,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import ScalePressable from "@/components/ScalePressable";
import { colors } from "@/theme/tokens";
import { showAlert } from "@/store/alertStore";

interface ClerkUser {
  firstName: string | null;
  lastName: string | null;
  update: (params: { firstName: string; lastName: string }) => Promise<unknown>;
}

interface EditNameModalProps {
  visible: boolean;
  onClose: () => void;
  user: ClerkUser | null | undefined;
}

export default function EditNameModal({ visible, onClose, user }: EditNameModalProps) {
  const [formFirstName, setFormFirstName] = useState("");
  const [formLastName, setFormLastName] = useState("");
  const [isSavingName, setIsSavingName] = useState(false);
  const [isFirstNameFocused, setIsFirstNameFocused] = useState(false);
  const [isLastNameFocused, setIsLastNameFocused] = useState(false);

  useEffect(() => {
    if (visible && user) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setFormFirstName(user.firstName || "");
      setFormLastName(user.lastName || "");
    }
  }, [visible, user]);

  const handleSaveName = async () => {
    if (!formFirstName.trim()) {
      showAlert("Validation Error", "First name is required.", "warning");
      return;
    }
    try {
      setIsSavingName(true);
      await user?.update({
        firstName: formFirstName,
        lastName: formLastName,
      });
      setIsSavingName(false);
      onClose();
    } catch (err) {
      console.error("Failed to update name:", err);
      setIsSavingName(false);
      showAlert("Update Failed", "An error occurred while updating your name.", "error");
    }
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={{ flex: 1 }}
      >
        <View style={{ flex: 1, backgroundColor: "rgba(0, 0, 0, 0.4)" }} className="items-center justify-center px-6">
          <View className="bg-surface w-full p-6 rounded-2xl border border-border/40" style={{
            shadowColor: "#000",
            shadowOffset: { width: 0, height: 1 },
            shadowOpacity: 0.04,
            shadowRadius: 4,
            elevation: 1,
          }}>
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
                onPress={onClose}
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
  );
}

import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  Pressable,
  Switch,
  ScrollView,
  StyleSheet,
} from "react-native";
import { ZentraDocument, DocumentCategory, DocumentFileType } from "@/types";
import { colors } from "@/theme/tokens";
import { parseISO, isValid } from "date-fns";

interface AddDocumentFormProps {
  onSubmit: (doc: ZentraDocument) => void;
  onCancel: () => void;
}

const CATEGORIES: DocumentCategory[] = ["Personal", "Work", "Finance", "Health", "Other"];
const FILE_TYPES: { value: DocumentFileType; label: string }[] = [
  { value: "pdf", label: "PDF" },
  { value: "image", label: "Image" },
  { value: "doc", label: "Doc" },
  { value: "other", label: "Other" },
];

function getCategoryPillStyle(cat: DocumentCategory, isSelected: boolean) {
  if (!isSelected) {
    return {
      bgClass: "bg-surface border-border",
      textClass: "text-secondary",
    };
  }
  switch (cat) {
    case "Personal":
      return {
        bgClass: "bg-accent/10 border-accent",
        textClass: "text-accent",
      };
    case "Work":
      return {
        bgClass: "bg-purple-50 border-purple-500",
        textClass: "text-purple-600",
      };
    case "Finance":
      return {
        bgClass: "bg-emerald-50 border-emerald-500",
        textClass: "text-emerald-600",
      };
    case "Health":
      return {
        bgClass: "bg-rose-50 border-rose-500",
        textClass: "text-rose-600",
      };
    case "Other":
    default:
      return {
        bgClass: "bg-slate-100 border-slate-500",
        textClass: "text-slate-700",
      };
  }
}

export default function AddDocumentForm({ onSubmit, onCancel }: AddDocumentFormProps) {
  // Form State
  const [name, setName] = useState("");
  const [category, setCategory] = useState<DocumentCategory>("Personal");
  const [fileType, setFileType] = useState<DocumentFileType>("pdf");
  const [expiryDate, setExpiryDate] = useState("");
  const [sizeLabel, setSizeLabel] = useState("");
  const [notes, setNotes] = useState("");
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);

  // Active focus element state
  const [focusedField, setFocusedField] = useState<string | null>(null);

  // Errors State
  const [errors, setErrors] = useState<{ name?: string; expiryDate?: string }>({});

  const handleDateChange = (text: string) => {
    // Strip non-digits
    const cleaned = text.replace(/\D/g, "");
    let formatted = cleaned;

    if (cleaned.length > 4) {
      formatted = `${cleaned.slice(0, 4)}-${cleaned.slice(4, 6)}`;
    }
    if (cleaned.length > 6) {
      formatted = `${cleaned.slice(0, 4)}-${cleaned.slice(4, 6)}-${cleaned.slice(6, 8)}`;
    }

    setExpiryDate(formatted);
    if (errors.expiryDate) {
      setErrors((prev) => ({ ...prev, expiryDate: undefined }));
    }
  };

  const handleSave = () => {
    const newErrors: typeof errors = {};

    // Validate Name
    if (!name.trim()) {
      newErrors.name = "Document name is required.";
    }

    // Validate Expiry Date
    if (!expiryDate.trim()) {
      newErrors.expiryDate = "Expiry date is required.";
    } else {
      const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
      if (!dateRegex.test(expiryDate)) {
        newErrors.expiryDate = "Use YYYY-MM-DD format (e.g. 2026-05-30).";
      } else {
        const parsed = parseISO(expiryDate);
        if (!isValid(parsed)) {
          newErrors.expiryDate = "Please enter a valid calendar date.";
        }
      }
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    // Reset errors
    setErrors({});

    // Generate unique ID safely
    const randomId =
      typeof crypto !== "undefined" && crypto.randomUUID
        ? crypto.randomUUID()
        : `doc-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;

    const newDoc: ZentraDocument = {
      id: randomId,
      name: name.trim(),
      category,
      fileType,
      expiryDate: expiryDate.trim(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      sizeLabel: sizeLabel.trim() || undefined,
      notificationsEnabled,
      isFavorite: false,
      notes: notes.trim() || undefined,
    };

    onSubmit(newDoc);
  };

  // Helper to generate dynamic styles for interactive focus highlights without shifts
  const getInputStyles = (fieldName: string, hasError: boolean) => {
    const isFocused = focusedField === fieldName;
    return {
      borderWidth: isFocused ? 2 : 1,
      borderColor: hasError
        ? colors.danger
        : isFocused
        ? colors.accent
        : colors.border,
      paddingHorizontal: isFocused ? 15 : 16,
      paddingVertical: isFocused ? 11 : 12,
    };
  };

  return (
    <ScrollView
      showsVerticalScrollIndicator={false}
      keyboardShouldPersistTaps="handled"
      contentContainerStyle={{ paddingBottom: 40 }}
    >
      <View className="space-y-6">
        {/* Document Name */}
        <View className="mb-4">
          <Text className="text-body-md text-primary font-semibold mb-2">
            Document Name *
          </Text>
          <TextInput
            value={name}
            onChangeText={(text) => {
              setName(text);
              if (errors.name) setErrors((prev) => ({ ...prev, name: undefined }));
            }}
            onFocus={() => setFocusedField("name")}
            onBlur={() => setFocusedField(null)}
            placeholder="e.g. Passport.pdf"
            placeholderTextColor={colors.secondary}
            className="bg-surface rounded-xl text-body-md text-primary"
            style={getInputStyles("name", !!errors.name)}
          />
          {errors.name && (
            <Text className="text-caption text-danger mt-1.5 font-medium">
              {errors.name}
            </Text>
          )}
        </View>

        {/* Category Selector */}
        <View className="mb-4">
          <Text className="text-body-md text-primary font-semibold mb-2.5">
            Category
          </Text>
          <View className="flex-row flex-wrap gap-2">
            {CATEGORIES.map((cat) => {
              const isSelected = category === cat;
              const pillStyles = getCategoryPillStyle(cat, isSelected);
              return (
                <Pressable
                  key={cat}
                  onPress={() => setCategory(cat)}
                  className={`px-4 py-2.5 rounded-full border ${pillStyles.bgClass}`}
                  style={({ pressed }) => [pressed && styles.pressedScale]}
                >
                  <Text className={`text-body-md font-semibold ${pillStyles.textClass}`}>
                    {cat}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </View>

        {/* File Type Selector */}
        <View className="mb-4">
          <Text className="text-body-md text-primary font-semibold mb-2.5">
            File Type
          </Text>
          <View className="flex-row gap-2">
            {FILE_TYPES.map((type) => {
              const isSelected = fileType === type.value;
              return (
                <Pressable
                  key={type.value}
                  onPress={() => setFileType(type.value)}
                  className={`flex-1 items-center py-2.5 rounded-xl border ${
                    isSelected
                      ? "bg-accent border-accent"
                      : "bg-surface border-border"
                  }`}
                  style={({ pressed }) => [pressed && styles.pressedScale]}
                >
                  <Text
                    className={`text-body-md font-semibold ${
                      isSelected ? "text-white" : "text-secondary"
                    }`}
                  >
                    {type.label}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </View>

        {/* Expiry Date */}
        <View className="mb-4">
          <Text className="text-body-md text-primary font-semibold mb-2">
            Expiry Date *
          </Text>
          <TextInput
            value={expiryDate}
            onChangeText={handleDateChange}
            onFocus={() => setFocusedField("expiryDate")}
            onBlur={() => setFocusedField(null)}
            placeholder="YYYY-MM-DD (e.g. 2029-05-10)"
            placeholderTextColor={colors.secondary}
            maxLength={10}
            keyboardType="numeric"
            className="bg-surface rounded-xl text-body-md text-primary"
            style={getInputStyles("expiryDate", !!errors.expiryDate)}
          />
          {errors.expiryDate && (
            <Text className="text-caption text-danger mt-1.5 font-medium">
              {errors.expiryDate}
            </Text>
          )}
        </View>

        {/* Size Label */}
        <View className="mb-4">
          <Text className="text-body-md text-primary font-semibold mb-2">
            Size Label (Optional)
          </Text>
          <TextInput
            value={sizeLabel}
            onChangeText={setSizeLabel}
            onFocus={() => setFocusedField("sizeLabel")}
            onBlur={() => setFocusedField(null)}
            placeholder="e.g. 2.4 MB"
            placeholderTextColor={colors.secondary}
            className="bg-surface rounded-xl text-body-md text-primary"
            style={getInputStyles("sizeLabel", false)}
          />
        </View>

        {/* Notes */}
        <View className="mb-4">
          <Text className="text-body-md text-primary font-semibold mb-2">
            Notes (Optional)
          </Text>
          <TextInput
            value={notes}
            onChangeText={setNotes}
            onFocus={() => setFocusedField("notes")}
            onBlur={() => setFocusedField(null)}
            placeholder="Add any specific details here..."
            placeholderTextColor={colors.secondary}
            multiline
            numberOfLines={4}
            textAlignVertical="top"
            className="bg-surface rounded-xl text-body-md text-primary min-h-[90px]"
            style={getInputStyles("notes", false)}
          />
        </View>

        {/* Notification Settings Toggle */}
        <View className="flex-row items-center justify-between bg-surface rounded-xl border border-border/60 p-4 mb-6 shadow-sm">
          <View className="flex-1 mr-4">
            <Text className="text-body-lg text-primary font-semibold">
              Enable Expiry Notifications
            </Text>
            <Text className="text-caption text-secondary mt-0.5">
              Receive alerts locally on device before expiration.
            </Text>
          </View>
          <Switch
            value={notificationsEnabled}
            onValueChange={setNotificationsEnabled}
            trackColor={{ false: "#E5E7EB", true: colors.accent }}
            thumbColor={notificationsEnabled ? "#FFFFFF" : "#F3F4F6"}
          />
        </View>

        {/* Action Buttons Row */}
        <View className="flex-row gap-3 pt-2">
          <Pressable
            onPress={onCancel}
            className="flex-1 h-[52px] border border-border rounded-xl items-center justify-center bg-surface active:bg-background"
            style={({ pressed }) => [pressed && styles.pressedScale]}
          >
            <Text className="text-button text-secondary font-semibold">Cancel</Text>
          </Pressable>

          <Pressable
            onPress={handleSave}
            className="flex-2 h-[52px] bg-accent rounded-xl items-center justify-center active:opacity-95"
            style={({ pressed }) => [pressed && styles.pressedScale]}
          >
            <Text className="text-button text-white font-semibold">Save Document</Text>
          </Pressable>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  pressedScale: {
    transform: [{ scale: 0.98 }],
  },
});

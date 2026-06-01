import NotificationToggle from "@/components/NotificationToggle";
import DatePickerField from "@/components/DatePickerField";
import FilePickerButton, { PickedFile } from "@/components/FilePickerButton";
import { colors } from "@/theme/tokens";
import { DocumentCategory, DocumentFileType, ZentraDocument } from "@/types";
import { isValid, parseISO, startOfDay, startOfToday } from "date-fns";
import { useState } from "react";
import {
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    View,
} from "react-native";

interface AddDocumentFormProps {
  onSubmit: (doc: ZentraDocument) => void;
  onCancel: () => void;
  initialValues?: ZentraDocument;
  folders: string[];
}

const FILE_TYPES: { value: DocumentFileType; label: string }[] = [
  { value: "pdf", label: "PDF" },
  { value: "image", label: "Image" },
  { value: "doc", label: "Doc" },
  { value: "other", label: "Other" },
];

const FOLDER_THEMES = [
  { bgClass: "bg-accent/10 border-accent", textClass: "text-accent" }, // Indigo
  { bgClass: "bg-purple-50 border-purple-500", textClass: "text-purple-600" }, // Purple
  { bgClass: "bg-emerald-50 border-emerald-500", textClass: "text-emerald-600" }, // Green
  { bgClass: "bg-rose-50 border-rose-500", textClass: "text-rose-600" }, // Rose
  { bgClass: "bg-amber-50 border-amber-500", textClass: "text-amber-600" }, // Amber/Orange
  { bgClass: "bg-sky-50 border-sky-500", textClass: "text-sky-600" }, // Sky/Blue
  { bgClass: "bg-teal-50 border-teal-500", textClass: "text-teal-600" }, // Teal
];

function getCategoryPillStyle(
  cat: DocumentCategory,
  isSelected: boolean,
  foldersList: string[],
) {
  if (!isSelected) {
    return {
      bgClass: "bg-surface border-border",
      textClass: "text-secondary",
    };
  }
  const name = cat.toLowerCase();
  if (name === "personal") {
    return {
      bgClass: "bg-accent/10 border-accent",
      textClass: "text-accent",
    };
  }
  if (name === "work") {
    return {
      bgClass: "bg-purple-50 border-purple-500",
      textClass: "text-purple-600",
    };
  }
  if (name === "finance") {
    return {
      bgClass: "bg-emerald-50 border-emerald-500",
      textClass: "text-emerald-600",
    };
  }
  if (name === "health" || name === "medical") {
    return {
      bgClass: "bg-rose-50 border-rose-500",
      textClass: "text-rose-600",
    };
  }

  // Cyclic color schemes for dynamic folders
  const idx = foldersList.findIndex((f) => f.toLowerCase() === name);
  if (idx !== -1) {
    return FOLDER_THEMES[idx % FOLDER_THEMES.length];
  }

  return {
    bgClass: "bg-slate-100 border-slate-500",
    textClass: "text-slate-700",
  };
}

export default function AddDocumentForm({
  onSubmit,
  onCancel,
  initialValues,
  folders,
}: AddDocumentFormProps) {
  // Form State
  const [name, setName] = useState(initialValues?.name || "");
  const [category, setCategory] = useState<DocumentCategory>(
    initialValues?.category || folders[0] || "Personal",
  );
  const [fileType, setFileType] = useState<DocumentFileType>(
    initialValues?.fileType || "pdf",
  );
  const [expiryDate, setExpiryDate] = useState(initialValues?.expiryDate || "");
  const [sizeLabel, setSizeLabel] = useState(initialValues?.sizeLabel || "");
  const [notes, setNotes] = useState(initialValues?.notes || "");
  const [notificationsEnabled, setNotificationsEnabled] = useState(
    initialValues?.notificationsEnabled ?? true,
  );
  const [localUri, setLocalUri] = useState<string | undefined>(
    initialValues?.localUri || undefined,
  );
  const [fileName, setFileName] = useState<string | undefined>(
    initialValues?.localUri ? initialValues.name : undefined,
  );

  // Active focus element state
  const [focusedField, setFocusedField] = useState<string | null>(null);

  // Ensure selected category is always listed in pills even if folders is empty/doesn't have it
  const categoryList = folders.includes(category) ? folders : [...folders, category];

  // Errors State
  const [errors, setErrors] = useState<{ name?: string; expiryDate?: string }>(
    {},
  );

  const handleFilePicked = (file: PickedFile | null) => {
    if (file) {
      setLocalUri(file.uri);
      setFileName(file.name);
      setSizeLabel(file.sizeLabel);
      setFileType(file.fileType);
      if (!name.trim()) {
        setName(file.name);
        if (errors.name) {
          setErrors((prev) => ({ ...prev, name: undefined }));
        }
      }
    } else {
      setLocalUri(undefined);
      setFileName(undefined);
      setSizeLabel("");
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
        } else {
          const normalized = startOfDay(parsed);
          const todayStart = startOfToday();
          const isUnchanged = initialValues && expiryDate.trim() === initialValues.expiryDate.trim();
          if (!isUnchanged && normalized.getTime() <= todayStart.getTime()) {
            newErrors.expiryDate = "Expiry date must be in the future.";
          }
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
      id: initialValues?.id || randomId,
      name: name.trim(),
      category,
      fileType,
      expiryDate: expiryDate.trim(),
      createdAt: initialValues?.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      sizeLabel: sizeLabel.trim() || undefined,
      notificationsEnabled,
      isFavorite: initialValues?.isFavorite ?? false,
      notes: notes.trim() || undefined,
      localUri: localUri?.trim() || undefined,
    };

    onSubmit(newDoc);
  };

  // Helper to generate dynamic styles for interactive focus highlights without shifts
  const getInputStyles = (fieldName: string, hasError: boolean) => {
    const isFocused = focusedField === fieldName;
    const isMultiline = fieldName === "notes";
    return {
      borderWidth: isFocused ? 2 : 1,
      borderColor: hasError
        ? colors.danger
        : isFocused
          ? colors.accent
          : colors.border,
      paddingHorizontal: isFocused ? 15 : 16,
      ...(isMultiline
        ? { paddingVertical: isFocused ? 11 : 12, minHeight: 90 }
        : { height: 52, paddingVertical: 0 }),
    };
  };

  return (
    <ScrollView
      showsVerticalScrollIndicator={false}
      keyboardShouldPersistTaps="handled"
      contentContainerStyle={{ paddingHorizontal: 24, paddingTop: 16, paddingBottom: 40 }}
    >
      <View className="space-y-6">
        {/* Document Name */}
        <View className="mb-4">
          <Text className="text-body-md text-primary font-semibold mb-2">
            Document Name <Text className="text-danger">*</Text>
          </Text>
          <TextInput
            value={name}
            onChangeText={(text) => {
              setName(text);
              if (errors.name)
                setErrors((prev) => ({ ...prev, name: undefined }));
            }}
            onFocus={() => setFocusedField("name")}
            onBlur={() => setFocusedField(null)}
            accessibilityLabel="Document name"
            placeholder="e.g. Passport.pdf"
            placeholderTextColor={colors.secondary}
            className="bg-surface rounded-xl text-body-md text-primary"
            underlineColorAndroid="transparent"
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
          <View
            className="gap-2"
            style={{ flexDirection: "row", flexWrap: "wrap" }}
          >
            {categoryList.map((cat) => {
              const isSelected = category === cat;
              const pillStyles = getCategoryPillStyle(cat, isSelected, folders);
              return (
                <Pressable
                  key={cat}
                  onPress={() => setCategory(cat)}
                  accessibilityRole="button"
                  accessibilityLabel={`Category: ${cat}`}
                  accessibilityState={{ selected: category === cat }}
                  className={`px-4 rounded-full border min-h-11 min-w-11 justify-center ${pillStyles.bgClass}`}
                  style={({ pressed }) => [pressed && styles.pressedScale]}
                >
                  <Text
                    className={`text-body-md font-semibold ${pillStyles.textClass}`}
                  >
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
                  accessibilityRole="button"
                  accessibilityLabel={`File type: ${type.label}`}
                  accessibilityState={{ selected: isSelected }}
                  className={`flex-1 items-center rounded-xl border min-h-11 justify-center ${
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
        <DatePickerField
          label="Expiry Date *"
          value={expiryDate}
          onChange={(date) => {
            setExpiryDate(date);
            if (errors.expiryDate) {
              setErrors((prev) => ({ ...prev, expiryDate: undefined }));
            }
          }}
          error={errors.expiryDate}
        />

        {/* Size Label */}
        <View className="mb-4">
          <Text className="text-body-md text-primary font-semibold mb-2">
            Size Label <Text className="text-secondary font-normal text-body-sm">(Optional)</Text>
          </Text>
          <TextInput
            value={sizeLabel}
            onChangeText={setSizeLabel}
            onFocus={() => setFocusedField("sizeLabel")}
            onBlur={() => setFocusedField(null)}
            accessibilityLabel="Size label"
            placeholder="e.g. 2.4 MB"
            placeholderTextColor={colors.secondary}
            className="bg-surface rounded-xl text-body-md text-primary"
            underlineColorAndroid="transparent"
            style={getInputStyles("sizeLabel", false)}
          />
        </View>
        {/* File Picker */}
        <FilePickerButton
          onFilePicked={handleFilePicked}
          currentUri={localUri}
          fileName={fileName || name}
          fileSizeLabel={sizeLabel}
          fileType={fileType}
        />

        {/* Notes */}
        <View className="mb-4">
          <Text className="text-body-md text-primary font-semibold mb-2">
            Notes <Text className="text-secondary font-normal text-body-sm">(Optional)</Text>
          </Text>
          <TextInput
            value={notes}
            onChangeText={setNotes}
            onFocus={() => setFocusedField("notes")}
            onBlur={() => setFocusedField(null)}
            accessibilityLabel="Notes"
            placeholder="Add any specific details here..."
            placeholderTextColor={colors.secondary}
            multiline
            numberOfLines={4}
            textAlignVertical="top"
            className="bg-surface rounded-xl text-body-md text-primary"
            underlineColorAndroid="transparent"
            style={getInputStyles("notes", false)}
          />
        </View>

        {/* Notification Settings Toggle */}
        <View className="bg-surface rounded-xl border border-border/60 p-4 mb-6 shadow-sm">
          <NotificationToggle
            documentId=""
            enabled={notificationsEnabled}
            onToggle={setNotificationsEnabled}
            label="Enable Expiry Notifications"
            textClassName="text-body-lg text-primary font-semibold"
            className="flex-row items-center justify-between w-full"
          />
          <Text className="text-caption text-secondary mt-1.5">
            Receive alerts locally on device before expiration.
          </Text>
        </View>

        {/* Action Buttons Row */}
        <View className="flex-row gap-3 pt-2">
          <Pressable
            onPress={onCancel}
            accessibilityRole="button"
            accessibilityLabel="Cancel saving document"
            className="flex-1 h-[52px] border border-border rounded-xl items-center justify-center bg-surface active:bg-background px-6"
            style={({ pressed }) => [pressed && styles.pressedScale]}
          >
            <Text className="text-button text-secondary font-semibold">
              Cancel
            </Text>
          </Pressable>

          <Pressable
            onPress={handleSave}
            accessibilityRole="button"
            accessibilityLabel={initialValues ? "Update document details" : "Save document details"}
            className="h-[52px] bg-accent rounded-xl items-center justify-center active:opacity-95 px-6"
            style={({ pressed }) => [
              { flex: 2 },
              pressed && styles.pressedScale,
            ]}
          >
            <Text className="text-button text-white font-semibold">
              {initialValues ? "Update Document" : "Save Document"}
            </Text>
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

import React, { useState } from "react";
import {
  View,
  Text,
  Pressable,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  Platform,
  TextInput,
} from "react-native";
import { showAlert } from "@/store/alertStore";
import { useRouter } from "expo-router";
import { Feather } from "@expo/vector-icons";
import { colors } from "@/theme/tokens";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useDocumentStore } from "@/store/documentStore";
import * as FileSystem from "expo-file-system/legacy";
import { requireOptionalNativeModule } from "expo-modules-core";
import { withIgnoreAppLock } from "@/hooks/useAppLock";

const isDocumentPickerNativeAvailable =
  typeof (globalThis as any).__isDocumentPickerNativeAvailable === "boolean"
    ? (globalThis as any).__isDocumentPickerNativeAvailable
    : !!requireOptionalNativeModule("ExpoDocumentPicker");

const safeRequireDocumentPicker = () => {
  if (!isDocumentPickerNativeAvailable) {
    return null;
  }
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const DocumentPicker = require("expo-document-picker");
    if (DocumentPicker && typeof DocumentPicker.getDocumentAsync === "function") {
      return DocumentPicker as typeof import("expo-document-picker");
    }
  } catch {
    // Native module not registered
  }
  return null;
};

interface BackupFormat {
  exportedAt?: string;
  appVersion?: string;
  documents: any[];
  notificationSettings?: any;
}

export default function ImportDataScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { documents, addDocument } = useDocumentStore();
  const [isImporting, setIsImporting] = useState(false);
  const [showPasteInput, setShowPasteInput] = useState(false);
  const [pastedJson, setPastedJson] = useState("");
  const [isPasteFocused, setIsPasteFocused] = useState(false);
  const [loadedBackup, setLoadedBackup] = useState<BackupFormat | null>(null);

  const goBack = () => {
    if (router.canGoBack()) {
      router.back();
      return;
    }
    router.replace("/(tabs)/profile");
  };

  const handleParseAndPreview = (jsonText: string) => {
    try {
      const parsed = JSON.parse(jsonText);
      if (!parsed || typeof parsed !== "object" || !Array.isArray(parsed.documents)) {
        showAlert("Error", "This file doesn't appear to be a valid Zentra backup.", "error");
        return;
      }
      if (parsed.documents.length === 0) {
        showAlert("Error", "No documents found in this backup file.", "error");
        return;
      }
      // Successfully parsed and validated structure
      setLoadedBackup(parsed);
    } catch {
      showAlert("Error", "This file doesn't appear to be a valid Zentra backup.", "error");
    }
  };

  const handleImportFromFile = async () => {
    // Web Flow file selection
    if (Platform.OS === "web") {
      const input = document.createElement("input");
      input.type = "file";
      input.accept = "application/json";
      input.onchange = (e: any) => {
        const file = e.target.files?.[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (event: any) => {
          const text = event.target.result;
          handleParseAndPreview(text);
        };
        reader.readAsText(file);
      };
      input.click();
      return;
    }

    // Native Flow Document Picker
    try {
      const DocumentPicker = safeRequireDocumentPicker();
      if (!DocumentPicker) {
        showAlert(
          "Sandbox Mode",
          "Native document browser is not available in this environment. A simulated backup file has been loaded for testing.",
          "info",
          [
            {
              text: "OK",
              onPress: () => {
                const simulatedBackup = JSON.stringify({
                  exportedAt: new Date().toISOString(),
                  appVersion: "1.0.0",
                  documents: [
                    {
                      id: "simulated-id-1",
                      name: "Simulated Passport.pdf",
                      category: "Personal",
                      fileType: "pdf",
                      expiryDate: "2027-12-31",
                      createdAt: new Date().toISOString(),
                      updatedAt: new Date().toISOString(),
                      sizeLabel: "2.4 MB",
                      notificationsEnabled: true,
                      isFavorite: true,
                      notes: "Simulated passport notes",
                    },
                    {
                      id: "simulated-id-2",
                      name: "Simulated Car Insurance.jpg",
                      category: "Finance",
                      fileType: "image",
                      expiryDate: "2026-06-30",
                      createdAt: new Date().toISOString(),
                      updatedAt: new Date().toISOString(),
                      sizeLabel: "1.5 MB",
                      notificationsEnabled: false,
                      isFavorite: false,
                    },
                  ],
                });
                handleParseAndPreview(simulatedBackup);
              },
            },
          ]
        );
        return;
      }

      const result = await withIgnoreAppLock(async () => {
        return await DocumentPicker.getDocumentAsync({
          type: "application/json",
          copyToCacheDirectory: true,
        });
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const asset = result.assets[0];
        const content = await FileSystem.readAsStringAsync(asset.uri);
        handleParseAndPreview(content);
      }
    } catch (error) {
      console.error("Failed to pick backup file:", error);
      showAlert("Picking Failed", "An error occurred while opening the document browser.", "error");
    }
  };

  const handleTogglePasteJson = () => {
    setShowPasteInput(!showPasteInput);
  };

  const handlePastedJsonChange = (text: string) => {
    setPastedJson(text);
    if (!text.trim()) {
      setLoadedBackup(null);
      return;
    }
    // Attempt validation on active typing or paste
    try {
      const parsed = JSON.parse(text);
      if (parsed && typeof parsed === "object" && Array.isArray(parsed.documents)) {
        setLoadedBackup(parsed);
      } else {
        setLoadedBackup(null);
      }
    } catch {
      setLoadedBackup(null);
    }
  };

  const executeImport = async () => {
    if (!loadedBackup) return;

    setIsImporting(true);
    try {
      const backupDocs = loadedBackup.documents;
      const totalCount = backupDocs.length;

      // Filter out documents whose IDs already exist in current state
      const docsToAdd = backupDocs.filter(
        (backupDoc) => !documents.some((existing) => existing.id === backupDoc.id)
      );

      const skippedCount = totalCount - docsToAdd.length;

      // Map imported documents to have notificationsEnabled: false by default
      const processedDocs = docsToAdd.map((doc) => ({
        ...doc,
        // Ensure properties exist or fall back
        id: doc.id || `imported_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        name: doc.name || "Imported Document",
        category: doc.category || "Other",
        fileType: doc.fileType || "other",
        expiryDate: doc.expiryDate || new Date().toISOString().split("T")[0],
        createdAt: doc.createdAt || new Date().toISOString(),
        updatedAt: doc.updatedAt || new Date().toISOString(),
        notificationsEnabled: false, // Core requirement: set false on import
        isFavorite: !!doc.isFavorite,
        notes: doc.notes || "",
        isDeleted: !!doc.isDeleted,
        deletedAt: doc.deletedAt || undefined,
      }));

      // Add to store
      for (const doc of processedDocs) {
        addDocument(doc);
      }

      showAlert(
        "Import Complete",
        `Import complete. ${processedDocs.length} ${
          processedDocs.length === 1 ? "document" : "documents"
        } added, ${skippedCount} skipped.`,
        "success",
        [
          {
            text: "OK",
            onPress: () => {
              goBack();
            },
          },
        ]
      );
    } catch (error) {
      console.error("Import failed:", error);
      showAlert("Import Failed", "An error occurred while importing documents.", "error");
    } finally {
      setIsImporting(false);
    }
  };

  // Preview Calculations
  const previewDocs = loadedBackup?.documents || [];
  const totalPreviewCount = previewDocs.length;
  const newDocs = previewDocs.filter(
    (d) => d && d.id && !documents.some((existing) => existing.id === d.id)
  );
  const skippedCount = totalPreviewCount - newDocs.length;
  const firstFive = previewDocs.slice(0, 5);

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      {/* Navigation Header */}
      <View
        className="px-6 pb-2 flex-row items-center justify-between"
        style={{ paddingTop: insets.top > 0 ? insets.top : 16 }}
      >
        <Pressable
          onPress={goBack}
          hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
          accessibilityRole="button"
          accessibilityLabel="Go back"
          className="w-10 h-10 items-center justify-center rounded-full active:bg-surface/50"
        >
          <Feather name="arrow-left" size={24} color={colors.primary} />
        </Pressable>
        <Text className="text-h2 text-primary font-bold text-center flex-1 font-display">
          Import Data
        </Text>
        <View className="w-10 h-10" />
      </View>

      <ScrollView
        contentContainerStyle={{ flexGrow: 1, paddingBottom: insets.bottom + 24 }}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Warning Card */}
        <View className="px-6 mt-4">
          <View
            className="rounded-2xl p-5 border flex-row items-start gap-3"
            style={{ backgroundColor: "#FFFBEB", borderColor: "#FEF3C7" }}
          >
            <Feather name="alert-triangle" size={20} color={colors.warning} style={{ marginTop: 2 }} />
            <Text className="text-body-md text-[#B45309] font-medium flex-1 leading-5">
              Importing will merge with your existing documents. Duplicate document IDs will be skipped.
            </Text>
          </View>
        </View>

        {/* Import Options Card */}
        <View className="px-6 mt-4">
          <View
            className="bg-surface rounded-2xl border border-border/40 overflow-hidden"
            style={styles.cardShadow}
          >
            <Pressable
              onPress={handleImportFromFile}
              accessibilityRole="button"
              accessibilityLabel="Import from File"
              className="flex-row items-center px-5 py-4 border-b border-border/30 active:bg-background/50"
            >
              <Feather name="file-text" size={20} color={colors.primary} />
              <View className="ml-3 flex-1">
                <Text className="text-body-lg font-medium text-primary">Import from File</Text>
                <Text className="text-caption text-secondary mt-0.5 font-medium">
                  Select a .json backup file
                </Text>
              </View>
              <Feather name="chevron-right" size={18} color="#C7C7CC" />
            </Pressable>

            <Pressable
              onPress={handleTogglePasteJson}
              accessibilityRole="button"
              accessibilityLabel="Paste JSON"
              className="flex-row items-center px-5 py-4 active:bg-background/50"
            >
              <Feather name="clipboard" size={20} color={colors.primary} />
              <View className="ml-3 flex-1">
                <Text className="text-body-lg font-medium text-primary">Paste JSON</Text>
                <Text className="text-caption text-secondary mt-0.5 font-medium">
                  Paste raw JSON text backup
                </Text>
              </View>
              <Feather
                name="chevron-right"
                size={18}
                color="#C7C7CC"
                style={{
                  transform: [{ rotate: showPasteInput ? "90deg" : "0deg" }],
                }}
              />
            </Pressable>
          </View>
        </View>

        {/* Paste JSON Text Area */}
        {showPasteInput && (
          <View className="px-6 mt-4">
            <View
              className="bg-surface rounded-2xl border border-border/40 p-4"
              style={styles.cardShadow}
            >
              <Text className="text-body-sm text-secondary font-semibold uppercase tracking-wider mb-2">
                Paste JSON Content
              </Text>
              <TextInput
                value={pastedJson}
                onChangeText={handlePastedJsonChange}
                multiline
                numberOfLines={10}
                textAlignVertical="top"
                placeholder="Paste your backup JSON here..."
                placeholderTextColor={colors.secondary}
                accessibilityLabel="Pasted JSON content"
                className={`w-full bg-background border rounded-xl px-4 py-3 text-body-md text-primary h-48 font-mono ${
                  isPasteFocused ? "border-accent border-2" : "border-border"
                }`}
                onFocus={() => setIsPasteFocused(true)}
                onBlur={() => setIsPasteFocused(false)}
                autoCapitalize="none"
                autoCorrect={false}
              />
            </View>
          </View>
        )}

        {/* Preview Section */}
        {loadedBackup && (
          <View className="px-6 mt-4">
            <View
              className="bg-surface rounded-2xl border border-border/40 p-5"
              style={styles.cardShadow}
            >
              <Text className="text-body-sm text-secondary font-semibold uppercase tracking-wider mb-3">
                Backup Preview
              </Text>

              <Text className="text-h2 text-primary font-bold">
                {totalPreviewCount} {totalPreviewCount === 1 ? "document" : "documents"} found in backup
              </Text>
              <Text className="text-body-md text-secondary mt-1 font-medium">
                {newDocs.length} new · {skippedCount} already exist (will be skipped)
              </Text>

              <View 
                className="mt-4 border-t border-border/30 pt-3"
                style={{ gap: 8 }}
              >
                {firstFive.map((doc, idx) => {
                  if (!doc) return null;
                  const alreadyExists = documents.some((existing) => existing.id === doc.id);
                  return (
                    <View key={doc.id || idx} className="flex-row items-center justify-between">
                      <Text className="text-body-md text-primary font-medium flex-1 mr-2 font-sans" numberOfLines={1}>
                        {doc.name || "Unnamed Document"}
                      </Text>
                      {alreadyExists ? (
                        <View className="bg-border/60 px-2 py-0.5 rounded">
                          <Text className="text-[11px] text-secondary font-semibold">Exists</Text>
                        </View>
                      ) : (
                        <View className="bg-softAccent px-2 py-0.5 rounded" style={{ backgroundColor: colors.softAccent }}>
                          <Text className="text-[11px] text-accent font-semibold">New</Text>
                        </View>
                      )}
                    </View>
                  );
                })}
                {totalPreviewCount > 5 && (
                  <Text className="text-caption text-secondary mt-1 italic font-sans">
                    And {totalPreviewCount - 5} more...
                  </Text>
                )}
              </View>
            </View>
          </View>
        )}

        {/* Execute button */}
        {loadedBackup && (
          <View className="flex-1 justify-end px-6 mt-8">
            <Pressable
              onPress={executeImport}
              disabled={isImporting}
              accessibilityRole="button"
              accessibilityLabel="Import Documents"
              className="w-full bg-accent h-13 rounded-xl items-center justify-center active:opacity-90 flex-row gap-2"
            >
              {isImporting ? (
                <ActivityIndicator color="#FFFFFF" size="small" />
              ) : (
                <>
                  <Feather name="upload" size={18} color="#FFFFFF" />
                  <Text className="text-body-lg text-white font-semibold font-display">
                    Import Documents
                  </Text>
                </>
              )}
            </Pressable>
          </View>
        )}
      </ScrollView>
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
});

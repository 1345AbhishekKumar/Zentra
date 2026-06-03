import AddDocumentForm from "@/components/AddDocumentForm";
import { useDocumentStore } from "@/store/documentStore";
import { colors } from "@/theme/tokens";
import { ZentraDocument } from "@/types";
import { Feather } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import {
    AccessibilityInfo,
    KeyboardAvoidingView,
    Platform,
    Pressable,
    Text,
    View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export default function AddDocumentScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { addDocument, folders } = useDocumentStore();
  const goBack = () => {
    if (router.canGoBack()) {
      router.back();
      return;
    }
    router.replace("/(tabs)");
  };

  const handleFormSubmit = async (newDoc: ZentraDocument) => {
    // 1. Persist the document in the local store (which handles file saving and notifications)
    await addDocument(newDoc);
    AccessibilityInfo.announceForAccessibility("Document saved");

    // 2. Navigate back to previous screen
    goBack();
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      className="flex-1"
      style={{ backgroundColor: colors.background }}
    >
      <View
        className="flex-row justify-between items-center px-6 pb-4 bg-surface border-b border-border/20"
        style={{ paddingTop: insets.top > 0 ? insets.top : 16 }}
      >
        <Text className="text-h1 text-primary font-bold">Add Document</Text>
        <Pressable
          onPress={goBack}
          hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
          accessibilityRole="button"
          accessibilityLabel="Close add document modal"
          className="w-10 h-10 items-center justify-center rounded-full active:bg-background"
        >
          <Feather name="x" size={24} color={colors.primary} />
        </Pressable>
      </View>

      <View className="flex-1 pt-2">
        <AddDocumentForm
          onSubmit={handleFormSubmit}
          onCancel={goBack}
          folders={folders}
        />
      </View>
    </KeyboardAvoidingView>
  );
}


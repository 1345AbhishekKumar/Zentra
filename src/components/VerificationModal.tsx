import React, { useState, useRef } from "react";
import {
  Modal,
  View,
  Text,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
} from "react-native";
import { useRouter } from "expo-router";

interface VerificationModalProps {
  visible: boolean;
  email: string;
  onClose: () => void;
}

export function VerificationModal({
  visible,
  email,
  onClose,
}: VerificationModalProps) {
  const [code, setCode] = useState("");
  const router = useRouter();
  const inputRef = useRef<TextInput>(null);

  const handleCodeChange = (text: string) => {
    const cleaned = text.replace(/[^0-9]/g, "");
    setCode(cleaned);

    if (cleaned.length === 6) {
      setCode(""); // reset for next time if needed
      onClose();
      router.replace("/");
    }
  };

  const codeLength = 6;
  const codeArray = Array(codeLength).fill("");

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        className="flex-1"
      >
        <View
          className="flex-1 justify-center items-center px-[24px]"
          style={{ backgroundColor: "rgba(18, 18, 26, 0.4)" }}
        >
          <View 
            className="w-full max-w-sm bg-[#FFFFFF] p-[32px] rounded-[24px] border border-[#EAEAEF] items-center" 
            style={styles.cardShadow}
          >
            <Text className="text-[#12121A] text-2xl font-bold mb-[12px] text-center tracking-tight" style={{ fontFamily: "Outfit" }}>
              Check your email
            </Text>
            <Text className="text-[#6C6B7E] text-center text-[14px] mb-[32px]" style={{ fontFamily: "Inter", lineHeight: 20 }}>
              {"We've sent a 6-digit verification code to\n"}
              <Text className="text-[#12121A] font-semibold">{email}</Text>
            </Text>

            {/* OTP 6-Digit Boxes */}
            <Pressable 
              onPress={() => inputRef.current?.focus()} 
              className="flex-row justify-between w-full mb-[24px] relative" 
              style={{ gap: 8 }}
            >
              {codeArray.map((_, index) => {
                const char = code[index] || "";
                const isActive = code.length === index;
                return (
                  <View
                    key={index}
                    className="flex-1 aspect-square bg-[#F8F8FC] border rounded-xl items-center justify-center"
                    style={{
                      borderColor: isActive ? "#3525cd" : "#E2E1EC",
                      borderWidth: isActive ? 2 : 1,
                      height: 48,
                      maxWidth: 48,
                    }}
                  >
                    <Text
                      className="text-[#12121A] text-[20px] font-bold"
                      style={{ fontFamily: "Outfit" }}
                    >
                      {char}
                    </Text>
                  </View>
                );
              })}
              <TextInput
                ref={inputRef}
                value={code}
                onChangeText={handleCodeChange}
                keyboardType="number-pad"
                maxLength={6}
                autoFocus
                caretHidden
                selectionColor="transparent"
                style={StyleSheet.absoluteFillObject}
                opacity={0}
              />
            </Pressable>

            <Pressable 
              onPress={onClose} 
              style={({ pressed }) => ({
                marginTop: 16,
                padding: 8,
                opacity: pressed ? 0.6 : 1
              })}
            >
              <Text className="text-[#6C6B7E] font-medium text-[15px]" style={{ fontFamily: "Inter" }}>
                Cancel
              </Text>
            </Pressable>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  cardShadow: {
    ...Platform.select({
      ios: {
        shadowColor: "#12121A",
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.08,
        shadowRadius: 20,
      },
      android: {
        elevation: 6,
      },
      web: {
        boxShadow: "0 20px 40px rgba(18, 18, 26, 0.06)",
      } as any,
    })
  }
});


import { useSignUp } from "@clerk/expo";
import { useRouter } from "expo-router";
import { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";

interface VerificationModalProps {
  visible: boolean;
  email: string;
  onClose: () => void;
}

function BlinkingCaret() {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const interval = setInterval(() => {
      setVisible((v) => !v);
    }, 530);
    return () => clearInterval(interval);
  }, []);

  return (
    <View
      style={{
        position: "absolute",
        width: 2,
        height: 20,
        backgroundColor: "#3525cd",
        opacity: visible ? 1 : 0,
      }}
    />
  );
}

function isErrorWithErrors(
  err: unknown,
): err is { errors?: { message?: string }[] } {
  return (
    typeof err === "object" &&
    err !== null &&
    "errors" in err &&
    Array.isArray((err as any).errors)
  );
}

export function VerificationModal({
  visible,
  email,
  onClose,
}: VerificationModalProps) {
  const [code, setCode] = useState("");
  const [isValidating, setIsValidating] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [countdown, setCountdown] = useState(30);
  const [showResendFeedback, setShowResendFeedback] = useState(false);
  const [error, setError] = useState("");

  const { signUp } = useSignUp();
  const router = useRouter();
  const inputRef = useRef<TextInput>(null);
  const isLoaded = !!signUp;

  const wasVisible = useRef(false);

  useEffect(() => {
    if (!visible) {
      wasVisible.current = false;
      return;
    }

    if (!wasVisible.current) {
      wasVisible.current = true;
      setCountdown(30);
      return;
    }

    if (countdown > 0 && !isValidating && !isSuccess) {
      const timer = setTimeout(() => {
        setCountdown((c) => c - 1);
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [countdown, visible, isValidating, isSuccess]);

  const handleCodeChange = async (text: string) => {
    if (isValidating || isSuccess || !isLoaded) return;

    const cleaned = text.replace(/[^0-9]/g, "");
    setCode(cleaned);
    setError("");

    if (cleaned.length === 6) {
      setIsValidating(true);
      try {
        const result = await signUp.verifications.verifyEmailCode({
          code: cleaned,
        });

        if (result.error) {
          throw { errors: [result.error] };
        }

        if (signUp.status === "complete") {
          const finalizeResult = await signUp.finalize();
          if (finalizeResult.error) {
            throw { errors: [finalizeResult.error] };
          }
          setIsValidating(false);
          setIsSuccess(true);
          setTimeout(() => {
            onClose();
            router.replace("/");
          }, 800);
        } else {
          console.error("SignUp incomplete", signUp);
          setError("Verification incomplete. Please try again.");
          setIsValidating(false);
        }
      } catch (err: unknown) {
        if (isErrorWithErrors(err)) {
          console.error("Verification error:", JSON.stringify(err, null, 2));
          setError(err.errors?.[0]?.message || "Invalid verification code");
        } else {
          console.error("Verification error:", String(err));
          setError("Invalid verification code");
        }
        setIsValidating(false);
        setCode("");
        inputRef.current?.focus();
      }
    }
  };

  const onResend = async () => {
    try {
      const result = await signUp?.verifications.sendEmailCode();
      if (result?.error) {
        throw { errors: [result.error] };
      }
      setCountdown(30);
      setShowResendFeedback(true);
      setTimeout(() => {
        setShowResendFeedback(false);
      }, 2500);
    } catch (err: unknown) {
      if (err instanceof Error) {
        console.error("Resend error:", err.message);
      } else {
        try {
          console.error("Resend error:", JSON.stringify(err));
        } catch {
          console.error("Resend error:", String(err));
        }
      }
      setError("Failed to resend code");
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
      onShow={() => {
        setTimeout(() => {
          inputRef.current?.focus();
        }, 150);
      }}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={{ flex: 1, width: "100%", height: "100%" }}
      >
        <View
          style={{
            flex: 1,
            width: "100%",
            height: "100%",
            justifyContent: "center",
            alignItems: "center",
            backgroundColor: "rgba(18, 18, 26, 0.4)",
            paddingHorizontal: 24,
          }}
        >
          <View
            className="w-full bg-[#FFFFFF] p-[32px] rounded-[24px] border border-[#EAEAEF] items-center"
            style={[styles.cardShadow, { width: "100%", maxWidth: 384 }]}
          >
            {isSuccess ? (
              <View
                className="items-center py-[20px] w-full"
                style={{ width: "100%" }}
              >
                <View
                  style={{
                    width: 64,
                    height: 64,
                    borderRadius: 32,
                    backgroundColor: "#E8FDF0",
                    alignItems: "center",
                    justifyContent: "center",
                    borderWidth: 2,
                    borderColor: "#22C55E",
                    marginBottom: 24,
                  }}
                >
                  <Text
                    style={{
                      fontSize: 32,
                      color: "#22C55E",
                      fontWeight: "bold",
                      marginTop: -2,
                    }}
                  >
                    ✓
                  </Text>
                </View>
                <Text
                  className="text-[#12121A] text-2xl font-bold mb-[12px] text-center tracking-tight"
                  style={{ fontFamily: "Outfit" }}
                >
                  Vault Secured
                </Text>
                <Text
                  className="text-[#6C6B7E] text-center text-[14px]"
                  style={{ fontFamily: "Inter", lineHeight: 20 }}
                >
                  Decrypted local keys successfully. Opening Zentra...
                </Text>
              </View>
            ) : isValidating ? (
              <View
                className="items-center py-[20px] w-full"
                style={{ width: "100%" }}
              >
                <ActivityIndicator
                  size="large"
                  color="#3525cd"
                  style={{ marginBottom: 24 }}
                />
                <Text
                  className="text-[#12121A] text-2xl font-bold mb-[12px] text-center tracking-tight"
                  style={{ fontFamily: "Outfit" }}
                >
                  Verifying Code
                </Text>
                <Text
                  className="text-[#6C6B7E] text-center text-[14px]"
                  style={{ fontFamily: "Inter", lineHeight: 20 }}
                >
                  Creating secure on-device credentials...
                </Text>
              </View>
            ) : (
              <>
                <Text
                  className="text-[#12121A] text-2xl font-bold mb-[12px] text-center tracking-tight"
                  style={{ fontFamily: "Outfit" }}
                >
                  Check your email
                </Text>
                <Text
                  className="text-[#6C6B7E] text-center text-[14px] mb-[32px]"
                  style={{ fontFamily: "Inter", lineHeight: 20 }}
                >
                  {"We've sent a 6-digit verification code to\n"}
                  <Text className="text-[#12121A] font-semibold">{email}</Text>
                </Text>

                {/* OTP 6-Digit Boxes */}
                <Pressable
                  onPress={() => inputRef.current?.focus()}
                  accessibilityRole="button"
                  accessibilityLabel="Enter 6-digit verification code"
                  className="flex-row justify-between w-full mb-[24px] relative"
                  style={{ gap: 8, width: "100%" }}
                >
                  {codeArray.map((_, index) => {
                    const char = code[index] || "";
                    const isActive = code.length === index;
                    return (
                      <View
                        key={index}
                        className="flex-1 aspect-square bg-[#F8F8FC] border rounded-xl items-center justify-center relative"
                        style={{
                          borderColor: error
                            ? "#EF4444"
                            : isActive
                              ? "#3525cd"
                              : "#E2E1EC",
                          borderWidth: isActive || error ? 2 : 1,
                          height: 48,
                          maxWidth: 48,
                        }}
                      >
                        <Text
                          className={`text-[20px] font-bold ${error ? "text-[#EF4444]" : "text-[#12121A]"}`}
                          style={{ fontFamily: "Outfit" }}
                        >
                          {char}
                        </Text>
                        {isActive && char === "" && <BlinkingCaret />}
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
                    pointerEvents="none"
                    accessibilityLabel="Verification code"
                    style={[
                      StyleSheet.absoluteFill,
                      {
                        opacity: 0.01,
                        backgroundColor: "transparent",
                        color: "transparent",
                        fontSize: 1,
                        ...Platform.select({
                          web: {
                            caretColor: "transparent",
                            outlineWidth: 0,
                          } as any,
                        }),
                      },
                    ]}
                  />
                </Pressable>

                {error ? (
                  <Text
                    className="text-[#EF4444] text-[12px] mb-[16px] text-center"
                    style={{ fontFamily: "Inter" }}
                  >
                    {error}
                  </Text>
                ) : null}

                {/* Resend Code Section */}
                <View
                  className="mb-[16px] items-center justify-center w-full"
                  style={{ width: "100%", minHeight: 48 }}
                >
                  {countdown > 0 ? (
                    <Text
                      className="text-[#6C6B7E] text-[14px]"
                      style={{ fontFamily: "Inter" }}
                    >
                      Resend code in{" "}
                      <Text className="font-semibold">{countdown}s</Text>
                    </Text>
                  ) : (
                    <View className="items-center" style={{ gap: 4 }}>
                      <Pressable
                        onPress={onResend}
                        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                        accessibilityRole="button"
                        accessibilityLabel="Resend verification code"
                        style={({ pressed }) => ({
                          opacity: pressed ? 0.6 : 1,
                        })}
                      >
                        <Text
                          className="text-[#3525cd] font-semibold text-[14px]"
                          style={{ fontFamily: "Inter" }}
                        >
                          Resend Code
                        </Text>
                      </Pressable>
                      {showResendFeedback && (
                        <Text
                          className="text-[#22C55E] text-[12px] font-medium"
                          style={{ fontFamily: "Inter" }}
                        >
                          Code resent successfully!
                        </Text>
                      )}
                    </View>
                  )}
                </View>

                <Pressable
                  onPress={onClose}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                  accessibilityRole="button"
                  accessibilityLabel="Cancel verification"
                  style={({ pressed }) => ({
                    marginTop: 8,
                    padding: 8,
                    opacity: pressed ? 0.6 : 1,
                  })}
                >
                  <Text
                    className="text-[#6C6B7E] font-medium text-[15px]"
                    style={{ fontFamily: "Inter" }}
                  >
                    Cancel
                  </Text>
                </Pressable>
              </>
            )}
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
    }),
  },
});

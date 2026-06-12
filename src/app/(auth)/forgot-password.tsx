import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  Pressable,
  SafeAreaView,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  ActivityIndicator,
} from "react-native";
import { Image } from "expo-image";
import { Link, Stack, useRouter } from "expo-router";
import { images } from "@/constants/images";
import { colors } from "@/theme/tokens";
import { useClerk, useSignIn } from "@clerk/expo";
import { showAlert } from "@/store/alertStore";

interface ClerkErrorJSON {
  errors: {
    code?: string;
    message?: string;
    meta?: {
      paramName?: string;
    };
  }[];
}

function isClerkError(err: unknown): err is ClerkErrorJSON {
  return (
    typeof err === "object" &&
    err !== null &&
    "errors" in err &&
    Array.isArray((err as any).errors)
  );
}

export default function ForgotPassword() {
  const router = useRouter();
  const { signIn } = useSignIn();
  const isLoaded = !!signIn;
  const { setActive } = useClerk();

  const [step, setStep] = useState<"send" | "verify" | "reset">("send");
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [newPassword, setNewPassword] = useState("");

  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  // Resend Countdown
  const [countdown, setCountdown] = useState(30);
  const [showResendFeedback, setShowResendFeedback] = useState(false);

  // Focus states
  const [isEmailFocused, setIsEmailFocused] = useState(false);
  const [isCodeFocused, setIsCodeFocused] = useState(false);
  const [isPasswordFocused, setIsPasswordFocused] = useState(false);

  // Error states
  const [emailError, setEmailError] = useState("");
  const [codeError, setCodeError] = useState("");
  const [passwordError, setPasswordError] = useState("");

  useEffect(() => {
    if (step !== "verify") return;

    if (countdown > 0 && !isLoading) {
      const timer = setTimeout(() => {
        setCountdown((c) => c - 1);
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [countdown, step, isLoading]);

  const validateEmail = (val: string) => {
    if (!val.trim()) {
      return "Email is required";
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(val)) {
      return "Please enter a valid email address";
    }
    return "";
  };

  const validatePassword = (val: string) => {
    if (!val) {
      return "New password is required";
    }
    if (val.length < 6) {
      return "Password must be at least 6 characters";
    }
    return "";
  };

  const handleSendCode = async () => {
    if (!isLoaded || !signIn) return;

    const emailErr = validateEmail(email);
    setEmailError(emailErr);

    if (!emailErr) {
      setIsLoading(true);
      try {
        console.log("Creating sign-in attempt for email:", email);
        const result = await signIn.create({
          identifier: email,
        });

        if (result.error) {
          throw { errors: [result.error] };
        }

        console.log("Sending reset password code to email...");
        const sendCodeResult = await signIn.resetPasswordEmailCode.sendCode();
        if (sendCodeResult.error) {
          throw { errors: [sendCodeResult.error] };
        }

        setCountdown(30);
        setStep("verify");
      } catch (err: unknown) {
        console.error("Forgot password error:", JSON.stringify(err, null, 2));
        if (isClerkError(err)) {
          const clerkError = err.errors?.[0];
          setEmailError(clerkError?.message || "Failed to send reset code.");
        } else {
          setEmailError("Failed to send reset code. Please try again.");
        }
      } finally {
        setIsLoading(false);
      }
    }
  };

  const handleVerifyCode = async () => {
    if (!isLoaded || !signIn) return;

    if (!code.trim()) {
      setCodeError("Reset code is required");
      return;
    }

    setIsLoading(true);
    try {
      console.log("Verifying reset code...");
      const verifyResult = await signIn.resetPasswordEmailCode.verifyCode({
        code,
      });

      if (verifyResult.error) {
        throw { errors: [verifyResult.error] };
      }

      setStep("reset");
    } catch (err: unknown) {
      console.error("Verification error:", JSON.stringify(err, null, 2));
      if (isClerkError(err)) {
        const clerkError = err.errors?.[0];
        setCodeError(clerkError?.message || "Invalid verification code.");
      } else {
        setCodeError("Failed to verify code. Please try again.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetPassword = async () => {
    if (!isLoaded || !signIn) return;

    const passErr = validatePassword(newPassword);
    setPasswordError(passErr);

    if (!passErr) {
      setIsLoading(true);
      try {
        console.log("Submitting new password...");
        const result = await signIn.resetPasswordEmailCode.submitPassword({
          password: newPassword,
          signOutOfOtherSessions: true,
        });

        if (result.error) {
          throw { errors: [result.error] };
        }

        if (signIn.status === "complete") {
          await setActive({ session: signIn.createdSessionId });
          showAlert("Success", "Password reset successfully!", "success", [
            { text: "OK", onPress: () => router.replace("/") },
          ]);
        } else {
          console.error("Password reset incomplete", signIn);
          setPasswordError("Failed to complete reset flow. Please try again.");
        }
      } catch (err: unknown) {
        console.error("Password reset error:", JSON.stringify(err, null, 2));
        if (isClerkError(err)) {
          const clerkError = err.errors?.[0];
          setPasswordError(clerkError?.message || "Failed to reset password.");
        } else {
          setPasswordError("Failed to reset password. Please try again.");
        }
      } finally {
        setIsLoading(false);
      }
    }
  };

  const handleResendCode = async () => {
    if (!isLoaded || !signIn) return;

    setIsLoading(true);
    try {
      console.log("Resending verification code to:", email);
      const result = await signIn.resetPasswordEmailCode.sendCode();
      if (result.error) {
        throw { errors: [result.error] };
      }
      setCountdown(30);
      setShowResendFeedback(true);
      setTimeout(() => {
        setShowResendFeedback(false);
      }, 2500);
    } catch (err: unknown) {
      console.error("Resend code error:", JSON.stringify(err, null, 2));
      if (isClerkError(err)) {
        const clerkError = err.errors?.[0];
        setCodeError(clerkError?.message || "Failed to resend code.");
      } else {
        setCodeError("Failed to resend code. Please try again.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-surface">
      <Stack.Screen options={{ headerShown: false }} />
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        className="flex-1"
      >
        <ScrollView
          contentContainerStyle={{ flexGrow: 1, alignItems: "center", justifyContent: "center" }}
          keyboardShouldPersistTaps="handled"
        >
          <View
            className="w-full max-w-md px-6 py-8 justify-center"
            style={{ width: "100%", maxWidth: 448 }}
          >
            <View className="flex-col w-full" style={{ gap: 40, width: "100%" }}>
              {/* Header Section */}
              <View className="items-center w-full" style={{ gap: 8, width: "100%" }}>
                <View className="flex-row justify-center mb-3">
                  <Image
                    source={images.happy}
                    style={{ width: 110, height: 110 }}
                    contentFit="contain"
                  />
                </View>
                <Text
                  className="text-primary text-[44px] italic tracking-[-0.02em]"
                  style={{ fontFamily: "PlayfairDisplayItalic", lineHeight: 48 }}
                >
                  Zentra
                </Text>
                <Text
                  className="text-secondary text-[16px] text-center"
                  style={{ fontFamily: "Inter", lineHeight: 24 }}
                >
                  {step === "send"
                    ? "Reset your vault password"
                    : step === "verify"
                    ? "Enter the reset code sent to your email"
                    : "Choose a secure password for your vault"}
                </Text>
              </View>

              {/* Form Section */}
              {step === "send" && (
                <View className="flex-col w-full" style={{ gap: 20, width: "100%" }}>
                  {/* Email Field */}
                  <View className="flex-col w-full" style={{ gap: 6, width: "100%" }}>
                    <Text
                      className="text-secondary text-[10px] font-semibold uppercase tracking-wider"
                      style={{ fontFamily: "Inter", lineHeight: 14.4 }}
                    >
                      Email
                    </Text>
                    <View className="relative w-full" style={{ width: "100%" }}>
                      <TextInput
                        placeholder="hello@example.com"
                        placeholderTextColor={colors.secondary}
                        value={email}
                        onChangeText={(text) => {
                          setEmail(text);
                          if (emailError) setEmailError("");
                        }}
                        onFocus={() => setIsEmailFocused(true)}
                        onBlur={() => setIsEmailFocused(false)}
                        keyboardType="email-address"
                        autoCapitalize="none"
                        autoCorrect={false}
                        selectionColor={colors.accent}
                        accessibilityLabel="Email address"
                        className="w-full bg-surface border rounded-xl px-4 py-3 text-primary text-body-md"
                        style={{
                          fontFamily: "Inter",
                          lineHeight: 24,
                          width: "100%",
                          borderColor: emailError ? colors.danger : (isEmailFocused ? colors.accent : colors.border),
                          borderWidth: emailError || isEmailFocused ? 2 : 1,
                          paddingVertical: emailError || isEmailFocused ? 11 : 12,
                          paddingHorizontal: emailError || isEmailFocused ? 15 : 16,
                        }}
                      />
                    </View>
                    {emailError ? (
                      <Text
                        className="text-danger text-[12px] mt-[2px]"
                        style={{ fontFamily: "Inter", lineHeight: 16 }}
                      >
                        {emailError}
                      </Text>
                    ) : null}
                  </View>

                  {/* Send Button */}
                  <View className="pt-[12px] w-full" style={{ width: "100%" }}>
                    <Pressable
                      onPress={handleSendCode}
                      disabled={isLoading || !isLoaded}
                      accessibilityRole="button"
                      accessibilityLabel="Send Reset Code"
                      style={({ pressed }) => [
                        {
                          width: "100%",
                          height: 52,
                          backgroundColor: pressed ? "#3B31C4" : colors.accent,
                          borderRadius: 12,
                          alignItems: "center",
                          justifyContent: "center",
                          transform: [{ scale: pressed ? 0.98 : 1 }],
                          opacity: (isLoading || !isLoaded) ? 0.7 : 1,
                        }
                      ]}
                    >
                      {isLoading || !isLoaded ? (
                        <ActivityIndicator color="#FFFFFF" />
                      ) : (
                        <Text
                          className="text-white text-[16px] font-semibold"
                          style={{ fontFamily: "Inter", lineHeight: 24 }}
                        >
                          Send Reset Code
                        </Text>
                      )}
                    </Pressable>
                  </View>
                </View>
              )}

              {step === "verify" && (
                <View className="flex-col w-full" style={{ gap: 20, width: "100%" }}>
                  {/* Code Field */}
                  <View className="flex-col w-full" style={{ gap: 6, width: "100%" }}>
                    <Text
                      className="text-secondary text-[10px] font-semibold uppercase tracking-wider"
                      style={{ fontFamily: "Inter", lineHeight: 14.4 }}
                    >
                      Reset Code
                    </Text>
                    <View className="relative w-full" style={{ width: "100%" }}>
                      <TextInput
                        placeholder="Enter 6-digit code"
                        placeholderTextColor={colors.secondary}
                        value={code}
                        onChangeText={(text) => {
                          setCode(text);
                          if (codeError) setCodeError("");
                        }}
                        onFocus={() => setIsCodeFocused(true)}
                        onBlur={() => setIsCodeFocused(false)}
                        keyboardType="number-pad"
                        autoCapitalize="none"
                        autoCorrect={false}
                        selectionColor={colors.accent}
                        accessibilityLabel="Reset verification code"
                        className="w-full bg-surface border rounded-xl px-4 py-3 text-primary text-body-md"
                        style={{
                          fontFamily: "Inter",
                          lineHeight: 24,
                          width: "100%",
                          borderColor: codeError ? colors.danger : (isCodeFocused ? colors.accent : colors.border),
                          borderWidth: codeError || isCodeFocused ? 2 : 1,
                          paddingVertical: codeError || isCodeFocused ? 11 : 12,
                          paddingHorizontal: codeError || isCodeFocused ? 15 : 16,
                        }}
                      />
                    </View>
                    {codeError ? (
                      <Text
                        className="text-danger text-[12px] mt-[2px]"
                        style={{ fontFamily: "Inter", lineHeight: 16 }}
                      >
                        {codeError}
                      </Text>
                    ) : null}
                  </View>

                  {/* Resend Code Section */}
                  <View className="items-center justify-center w-full" style={{ width: "100%", minHeight: 48 }}>
                    {countdown > 0 ? (
                      <Text className="text-secondary text-[14px]" style={{ fontFamily: "Inter" }}>
                        Resend code in <Text className="font-semibold">{countdown}s</Text>
                      </Text>
                    ) : (
                      <View className="items-center" style={{ gap: 4 }}>
                        <Pressable
                          onPress={handleResendCode}
                          disabled={isLoading}
                          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                          accessibilityRole="button"
                          accessibilityLabel="Resend verification code"
                          style={({ pressed }) => ({
                            opacity: pressed ? 0.6 : 1,
                          })}
                        >
                          <Text className="text-accent font-semibold text-[14px]" style={{ fontFamily: "Inter" }}>
                            Resend Code
                          </Text>
                        </Pressable>
                        {showResendFeedback && (
                          <Text className="text-success text-[12px] font-medium" style={{ fontFamily: "Inter" }}>
                            Code resent successfully!
                          </Text>
                        )}
                      </View>
                    )}
                  </View>

                  {/* Verify Button */}
                  <View className="pt-[12px] w-full" style={{ width: "100%" }}>
                    <Pressable
                      onPress={handleVerifyCode}
                      disabled={isLoading || !isLoaded}
                      accessibilityRole="button"
                      accessibilityLabel="Verify Code"
                      style={({ pressed }) => [
                        {
                          width: "100%",
                          height: 52,
                          backgroundColor: pressed ? "#3B31C4" : colors.accent,
                          borderRadius: 12,
                          alignItems: "center",
                          justifyContent: "center",
                          transform: [{ scale: pressed ? 0.98 : 1 }],
                          opacity: (isLoading || !isLoaded) ? 0.7 : 1,
                        }
                      ]}
                    >
                      {isLoading || !isLoaded ? (
                        <ActivityIndicator color="#FFFFFF" />
                      ) : (
                        <Text
                          className="text-white text-[16px] font-semibold"
                          style={{ fontFamily: "Inter", lineHeight: 24 }}
                        >
                          Verify Code
                        </Text>
                      )}
                    </Pressable>
                  </View>
                </View>
              )}

              {step === "reset" && (
                <View className="flex-col w-full" style={{ gap: 20, width: "100%" }}>
                  {/* Password Field */}
                  <View className="flex-col w-full" style={{ gap: 6, width: "100%" }}>
                    <Text
                      className="text-secondary text-[10px] font-semibold uppercase tracking-wider"
                      style={{ fontFamily: "Inter", lineHeight: 14.4 }}
                    >
                      New Password
                    </Text>
                    <View className="relative w-full justify-center" style={{ width: "100%" }}>
                      <TextInput
                        placeholder="••••••••"
                        placeholderTextColor={colors.secondary}
                        value={newPassword}
                        onChangeText={(text) => {
                          setNewPassword(text);
                          if (passwordError) setPasswordError("");
                        }}
                        onFocus={() => setIsPasswordFocused(true)}
                        onBlur={() => setIsPasswordFocused(false)}
                        secureTextEntry={!showPassword}
                        selectionColor={colors.accent}
                        accessibilityLabel="New Password"
                        className="w-full bg-surface border rounded-xl pl-[16px] pr-[56px] text-primary text-body-md py-[12px]"
                        style={{
                          fontFamily: "Inter",
                          width: "100%",
                          letterSpacing: showPassword ? 0 : 4,
                          borderColor: passwordError ? colors.danger : (isPasswordFocused ? colors.accent : colors.border),
                          borderWidth: passwordError || isPasswordFocused ? 2 : 1,
                          paddingLeft: passwordError || isPasswordFocused ? 15 : 16,
                          paddingRight: 56,
                          paddingVertical: showPassword
                            ? (passwordError || isPasswordFocused ? 11 : 12)
                            : (passwordError || isPasswordFocused ? 9 : 10),
                        }}
                      />
                      <Pressable
                        onPress={() => setShowPassword(!showPassword)}
                        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                        accessibilityRole="button"
                        accessibilityLabel={showPassword ? "Hide password" : "Show password"}
                        style={({ pressed }) => ({
                          position: "absolute",
                          right: 16,
                          height: "100%",
                          justifyContent: "center",
                          opacity: pressed ? 0.6 : 1,
                        })}
                      >
                        <Text
                          className="text-accent text-[10px] font-semibold uppercase tracking-wider"
                          style={{ fontFamily: "Inter" }}
                        >
                          {showPassword ? "Hide" : "Show"}
                        </Text>
                      </Pressable>
                    </View>
                    {passwordError ? (
                      <Text
                        className="text-danger text-[12px] mt-[2px]"
                        style={{ fontFamily: "Inter", lineHeight: 16 }}
                      >
                        {passwordError}
                      </Text>
                    ) : null}
                  </View>

                  {/* Reset Password Button */}
                  <View className="pt-[12px] w-full" style={{ width: "100%" }}>
                    <Pressable
                      onPress={handleResetPassword}
                      disabled={isLoading || !isLoaded}
                      accessibilityRole="button"
                      accessibilityLabel="Reset Password"
                      style={({ pressed }) => [
                        {
                          width: "100%",
                          height: 52,
                          backgroundColor: pressed ? "#3B31C4" : colors.accent,
                          borderRadius: 12,
                          alignItems: "center",
                          justifyContent: "center",
                          transform: [{ scale: pressed ? 0.98 : 1 }],
                          opacity: (isLoading || !isLoaded) ? 0.7 : 1,
                        }
                      ]}
                    >
                      {isLoading || !isLoaded ? (
                        <ActivityIndicator color="#FFFFFF" />
                      ) : (
                        <Text
                          className="text-white text-[16px] font-semibold"
                          style={{ fontFamily: "Inter", lineHeight: 24 }}
                        >
                          Reset Password
                        </Text>
                      )}
                    </Pressable>
                  </View>
                </View>
              )}

              {/* Footer Link */}
              <View className="flex-row justify-center pt-[8px] w-full" style={{ width: "100%" }}>
                <Link href="/sign-in" asChild>
                  <Pressable
                    hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                    accessibilityRole="link"
                    accessibilityLabel="Back to Log In"
                    style={({ pressed }) => ({ opacity: pressed ? 0.6 : 1 })}
                  >
                    <Text className="text-accent text-[16px] font-semibold" style={{ fontFamily: "Inter", lineHeight: 24 }}>
                      Back to Log In
                    </Text>
                  </Pressable>
                </Link>
              </View>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

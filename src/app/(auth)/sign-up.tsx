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
  StyleSheet,
  ActivityIndicator,
} from "react-native";
import { Image } from "expo-image";
import { Link, Stack, useRouter } from "expo-router";
import { images } from "@/constants/images";
import { VerificationModal } from "@/components/VerificationModal";
import { useSignUp, useSSO } from "@clerk/expo";
import * as WebBrowser from "expo-web-browser";

export default function SignUp() {
  const router = useRouter();
  const { signUp, fetchStatus } = useSignUp();
  const { startSSOFlow } = useSSO();
  
  const isLoaded = !!signUp;
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [modalVisible, setModalVisible] = useState(false);
  const [modalKey, setModalKey] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);

  useEffect(() => {
    // Warm up the browser to improve UX
    if (Platform.OS !== "web") {
      void WebBrowser.warmUpAsync();
      return () => {
        void WebBrowser.coolDownAsync();
      };
    }
  }, []);

  // Focus states
  const [isEmailFocused, setIsEmailFocused] = useState(false);
  const [isPasswordFocused, setIsPasswordFocused] = useState(false);

  // Password visibility
  const [showPassword, setShowPassword] = useState(false);

  // Error states
  const [emailError, setEmailError] = useState("");
  const [passwordError, setPasswordError] = useState("");

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
      return "Password is required";
    }
    if (val.length < 6) {
      return "Password must be at least 6 characters";
    }
    return "";
  };

  const handleSignUp = async () => {
    console.log("handleSignUp called, isLoaded:", isLoaded);
    if (!isLoaded) return;

    const emailErr = validateEmail(email);
    const passErr = validatePassword(password);

    setEmailError(emailErr);
    setPasswordError(passErr);

    if (!emailErr && !passErr) {
      setIsLoading(true);
      try {
        console.log("Attempting sign-up for:", email);
        const result = await signUp.create({
          emailAddress: email,
          password,
        });

        if (result.error) {
          throw { errors: [result.error] };
        }

        console.log("Preparing email verification...");
        const verificationResult = await signUp.verifications.sendEmailCode();
        if (verificationResult.error) {
          throw { errors: [verificationResult.error] };
        }
        console.log("Email verification prepared, showing modal.");
        setModalKey((prev) => prev + 1);
        setModalVisible(true);
      } catch (err: any) {
        console.error("Sign-up error:", JSON.stringify(err, null, 2));
        const clerkError = err.errors?.[0];
        if (clerkError) {
          if (clerkError.code === "form_identifier_exists") {
            setEmailError("An account with this email already exists");
          } else {
            setEmailError(clerkError.message || "An error occurred during sign up");
          }
        } else {
          setEmailError("A network error occurred. Please try again.");
        }
      } finally {
        setIsLoading(false);
      }
    } else {
      console.log("Validation failed:", { emailErr, passErr });
    }
  };

  const onGoogleSignIn = async () => {
    try {
      setIsGoogleLoading(true);
      const { createdSessionId, setActive: setSSOActive } = await startSSOFlow({
        strategy: "oauth_google",
      });

      if (createdSessionId && setSSOActive) {
        await setSSOActive({ session: createdSessionId });
        router.replace("/");
      }
    } catch (err) {
      console.error("OAuth error", err);
    } finally {
      setIsGoogleLoading(false);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-[#FFFFFF]">
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
            className="w-full max-w-md px-[24px] py-[32px] justify-center" 
            style={{ width: "100%", maxWidth: 448 }}
          >
            <View className="flex-col w-full" style={{ gap: 40, width: "100%" }}>
              {/* Header Section */}
              <View className="items-center w-full" style={{ gap: 8, width: "100%" }}>
                <View className="flex-row justify-center mb-[2px]">
                  <Image
                    source={images.logo}
                    style={{ width: 100, height: 100 }}
                    contentFit="contain"
                  />
                </View>
                <Text
                  className="text-[#12121A] text-[44px] italic tracking-[-0.02em]"
                  style={{ fontFamily: "PlayfairDisplayItalic", lineHeight: 48 }}
                >
                  Zentra
                </Text>
                <Text
                  className="text-[#6C6B7E] text-[16px]"
                  style={{ fontFamily: "Inter", lineHeight: 24 }}
                >
                  Create an account
                </Text>
              </View>

              {/* Form Section */}
              <View className="flex-col w-full" style={{ gap: 20, width: "100%" }}>
                {/* Email Field */}
                <View className="flex-col w-full" style={{ gap: 6, width: "100%" }}>
                  <Text
                    className="text-[#6C6B7E] text-[10px] font-semibold uppercase tracking-wider"
                    style={{ fontFamily: "Inter", lineHeight: 14.4 }}
                  >
                    Email
                  </Text>
                  <View className="relative w-full" style={{ width: "100%" }}>
                    <TextInput
                      placeholder="hello@example.com"
                      placeholderTextColor="#A3A3A3"
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
                      selectionColor="#3525cd"
                      className="w-full bg-[#FCFCFD] border rounded-lg px-[16px] py-[12px] text-[#12121A] text-[16px]"
                      style={{ 
                        fontFamily: "Inter", 
                        lineHeight: 24, 
                        width: "100%",
                        borderColor: emailError ? "#EF4444" : (isEmailFocused ? "#3525cd" : "#E2E1EC"),
                        borderWidth: emailError || isEmailFocused ? 2 : 1,
                        paddingVertical: emailError || isEmailFocused ? 11 : 12,
                        paddingHorizontal: emailError || isEmailFocused ? 15 : 16,
                      }}
                    />
                  </View>
                  {emailError ? (
                    <Text 
                      className="text-[#EF4444] text-[12px] mt-0.5" 
                      style={{ fontFamily: "Inter", lineHeight: 16 }}
                    >
                      {emailError}
                    </Text>
                  ) : null}
                </View>

                {/* Password Field */}
                <View className="flex-col w-full" style={{ gap: 6, width: "100%" }}>
                  <Text
                    className="text-[#6C6B7E] text-[10px] font-semibold uppercase tracking-wider"
                    style={{ fontFamily: "Inter", lineHeight: 14.4 }}
                  >
                    Password
                  </Text>
                  <View className="relative w-full justify-center" style={{ width: "100%" }}>
                    <TextInput
                      placeholder="••••••••"
                      placeholderTextColor="#A3A3A3"
                      value={password}
                      onChangeText={(text) => {
                        setPassword(text);
                        if (passwordError) setPasswordError("");
                      }}
                      onFocus={() => setIsPasswordFocused(true)}
                      onBlur={() => setIsPasswordFocused(false)}
                      secureTextEntry={!showPassword}
                      selectionColor="#3525cd"
                      className={`w-full bg-[#FCFCFD] border rounded-lg pl-[16px] pr-[56px] text-[#12121A] ${
                        showPassword ? "text-[16px] py-[12px]" : "text-[16px] py-[12px]"
                      }`}
                      style={{ 
                        fontFamily: "Inter", 
                        width: "100%",
                        letterSpacing: showPassword ? 0 : 4,
                        borderColor: passwordError ? "#EF4444" : (isPasswordFocused ? "#3525cd" : "#E2E1EC"),
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
                      style={({ pressed }) => ({
                        position: "absolute",
                        right: 16,
                        height: "100%",
                        justifyContent: "center",
                        opacity: pressed ? 0.6 : 1,
                      })}
                    >
                      <Text 
                        className="text-[#3525cd] text-[10px] font-semibold uppercase tracking-wider"
                        style={{ fontFamily: "Inter" }}
                      >
                        {showPassword ? "Hide" : "Show"}
                      </Text>
                    </Pressable>
                  </View>
                  {passwordError ? (
                    <Text 
                      className="text-[#EF4444] text-[12px] mt-[2px]" 
                      style={{ fontFamily: "Inter", lineHeight: 16 }}
                    >
                      {passwordError}
                    </Text>
                  ) : null}
                </View>

                {/* Sign Up Button */}
                <View className="pt-[12px] w-full" style={{ width: "100%" }}>
                  <Pressable
                    onPress={handleSignUp}
                    disabled={isLoading || !isLoaded}
                    style={({ pressed }) => [
                      styles.buttonShadow,
                      {
                        width: "100%",
                        height: 52,
                        backgroundColor: pressed ? "#2518a3" : "#3525cd",
                        borderRadius: 16,
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
                        className="text-[#ffffff] text-[16px] font-semibold"
                        style={{ fontFamily: "Inter", lineHeight: 24 }}
                      >
                        Sign Up
                      </Text>
                    )}
                  </Pressable>
                </View>
              </View>

              {/* Clerk Captcha */}
              <View nativeID="clerk-captcha" />

              {/* Divider */}
              <View className="flex-row items-center py-[4px] w-full" style={{ width: "100%" }}>
                <View className="flex-1 border-t border-[#EAEAEF]" />
                <Text
                  className="flex-shrink-0 mx-[16px] text-[#6C6B7E] text-[12px] font-medium uppercase tracking-wider"
                  style={{ fontFamily: "Inter", lineHeight: 14.4 }}
                >
                  Or
                </Text>
                <View className="flex-1 border-t border-[#EAEAEF]" />
              </View>

              {/* Google Sign In */}
              <View className="w-full" style={{ width: "100%" }}>
                <Pressable 
                  onPress={onGoogleSignIn}
                  disabled={isGoogleLoading}
                  style={({ pressed }) => ({
                    width: "100%",
                    height: 52,
                    backgroundColor: pressed ? "#F0EFF7" : "#FFFFFF",
                    borderColor: "#E2E1EC",
                    borderWidth: 1,
                    borderRadius: 16,
                    flexDirection: "row",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: 12,
                    transform: [{ scale: pressed ? 0.98 : 1 }],
                    opacity: isGoogleLoading ? 0.7 : 1,
                  })}
                >
                  {isGoogleLoading ? (
                    <ActivityIndicator color="#3525cd" />
                  ) : (
                    <>
                      <Image
                        source={images.google}
                        style={{ width: 20, height: 20 }}
                        contentFit="contain"
                      />
                      <Text className="text-[#12121A] text-[16px]" style={{ fontFamily: "Inter", lineHeight: 24 }}>
                        Sign up with Google
                      </Text>
                    </>
                  )}
                </Pressable>
              </View>

              {/* Footer Link */}
              <View className="flex-row justify-center pt-[8px] w-full" style={{ width: "100%" }}>
                <Text
                  className="text-[#6C6B7E] text-[16px]"
                  style={{ fontFamily: "Inter", lineHeight: 24 }}
                >
                  Already have an account?{" "}
                </Text>
                <Link href="/sign-in" asChild>
                  <Pressable style={({ pressed }) => ({ opacity: pressed ? 0.6 : 1 })}>
                    <Text className="text-[#3525cd] text-[16px] font-semibold" style={{ fontFamily: "Inter", lineHeight: 24 }}>
                      Log In
                    </Text>
                  </Pressable>
                </Link>
              </View>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      <VerificationModal
        key={modalKey}
        visible={modalVisible}
        email={email}
        onClose={() => setModalVisible(false)}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  buttonShadow: {
    ...Platform.select({
      ios: {
        shadowColor: "#3525cd",
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.2,
        shadowRadius: 12,
      },
      android: {
        elevation: 4,
      },
      web: {
        boxShadow: "0 8px 24px rgba(53, 37, 205, 0.2)",
      } as any,
    })
  }
});

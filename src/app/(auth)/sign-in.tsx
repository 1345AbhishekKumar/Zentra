import { images } from "@/constants/images";
import { useClerk, useSignIn, useSSO } from "@clerk/expo";
import { Image } from "expo-image";
import { Link, Stack, useRouter } from "expo-router";
import * as WebBrowser from "expo-web-browser";
import { useEffect, useState } from "react";
import {
    ActivityIndicator,
    Alert,
    KeyboardAvoidingView,
    Platform,
    Pressable,
    SafeAreaView,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    View,
} from "react-native";

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

export default function SignIn() {
  const router = useRouter();
  const { signIn } = useSignIn();
  const { setActive } = useClerk();
  const { startSSOFlow } = useSSO();

  const isLoaded = !!signIn;
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
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

  const handleSignIn = async () => {
    console.log("handleSignIn called, isLoaded:", isLoaded);
    if (!isLoaded || !signIn) return;

    const emailErr = validateEmail(email);
    const passErr = validatePassword(password);

    setEmailError(emailErr);
    setPasswordError(passErr);

    if (!emailErr && !passErr) {
      setIsLoading(true);
      try {
        console.log("Attempting sign-in for:", email);
        const result = await signIn.create({
          identifier: email,
          password,
        });

        if (result.error) {
          throw { errors: [result.error] };
        }

        console.log("Sign-in result status:", signIn.status);
        if (signIn.status === "complete") {
          await setActive({ session: signIn.createdSessionId });
          router.replace("/");
        } else {
          console.error("Sign-in incomplete", signIn);
        }
      } catch (err: unknown) {
        console.error("Sign-in error:", JSON.stringify(err, null, 2));
        if (isClerkError(err)) {
          const clerkError = err.errors?.[0];
          if (clerkError) {
            const message = clerkError.message || "An error occurred";
            const code = clerkError.code || "";
            const paramName = clerkError.meta?.paramName || "";

            const isPasswordError =
              code.toLowerCase().includes("password") ||
              message.toLowerCase().includes("password") ||
              paramName === "password";

            const isEmailError =
              code.toLowerCase().includes("identifier") ||
              code.toLowerCase().includes("email") ||
              message.toLowerCase().includes("email") ||
              message.toLowerCase().includes("identifier") ||
              message.toLowerCase().includes("account") ||
              paramName === "identifier" ||
              paramName === "email_address";

            if (isPasswordError) {
              setPasswordError(message);
            } else if (isEmailError) {
              if (code === "form_identifier_not_found") {
                setEmailError("No account found with this email");
              } else {
                setEmailError(message);
              }
            } else {
              setEmailError(message);
            }
          } else {
            setEmailError("A network error occurred. Please try again.");
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
      Alert.alert(
        "Google Sign In Failed",
        err instanceof Error
          ? err.message
          : "An unexpected error occurred during Google sign-in.",
      );
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
          contentContainerStyle={{
            flexGrow: 1,
            alignItems: "center",
            justifyContent: "center",
          }}
          keyboardShouldPersistTaps="handled"
        >
          <View
            className="w-full max-w-md px-[24px] py-[32px] justify-center"
            style={{ width: "100%", maxWidth: 448 }}
          >
            <View
              className="flex-col w-full"
              style={{ gap: 40, width: "100%" }}
            >
              {/* Header Section */}
              <View
                className="items-center w-full"
                style={{ gap: 8, width: "100%" }}
              >
                <View className="flex-row justify-center mb-[12px]">
                  <Image
                    source={images.happy}
                    style={{ width: 110, height: 110 }}
                    contentFit="contain"
                  />
                </View>
                <Text
                  className="text-[#12121A] text-[44px] italic tracking-[-0.02em]"
                  style={{
                    fontFamily: "PlayfairDisplayItalic",
                    lineHeight: 48,
                  }}
                >
                  Zentra
                </Text>
                <Text
                  className="text-[#6C6B7E] text-[16px]"
                  style={{ fontFamily: "Inter", lineHeight: 24 }}
                >
                  Welcome Back
                </Text>
              </View>

              {/* Form Section */}
              <View
                className="flex-col w-full"
                style={{ gap: 20, width: "100%" }}
              >
                {/* Email Field */}
                <View
                  className="flex-col w-full"
                  style={{ gap: 6, width: "100%" }}
                >
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
                        borderColor: emailError
                          ? "#EF4444"
                          : isEmailFocused
                            ? "#3525cd"
                            : "#E2E1EC",
                        borderWidth: emailError || isEmailFocused ? 2 : 1,
                        paddingVertical: emailError || isEmailFocused ? 11 : 12,
                        paddingHorizontal:
                          emailError || isEmailFocused ? 15 : 16,
                      }}
                    />
                  </View>
                  {emailError ? (
                    <Text
                      className="text-[#EF4444] text-[12px] mt-[2px]"
                      style={{ fontFamily: "Inter", lineHeight: 16 }}
                    >
                      {emailError}
                    </Text>
                  ) : null}
                </View>

                {/* Password Field */}
                <View
                  className="flex-col w-full"
                  style={{ gap: 6, width: "100%" }}
                >
                  <View
                    className="flex-row items-center justify-between w-full"
                    style={{ width: "100%" }}
                  >
                    <Text
                      className="text-[#6C6B7E] text-[10px] font-semibold uppercase tracking-wider"
                      style={{ fontFamily: "Inter", lineHeight: 14.4 }}
                    >
                      Password
                    </Text>
                    <Link href="/forgot-password" asChild>
                      <Pressable
                        style={({ pressed }) => ({
                          opacity: pressed ? 0.6 : 1,
                        })}
                      >
                        <Text
                          className="text-[#3525cd] text-[10px] font-semibold uppercase tracking-wider"
                          style={{ fontFamily: "Inter", lineHeight: 14.4 }}
                        >
                          Forgot?
                        </Text>
                      </Pressable>
                    </Link>
                  </View>
                  <View
                    className="relative w-full justify-center"
                    style={{ width: "100%" }}
                  >
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
                      className="w-full bg-[#FCFCFD] border rounded-lg pl-[16px] pr-[56px] text-[#12121A] text-[16px] py-[12px]"
                      style={{
                        fontFamily: "Inter",
                        width: "100%",
                        letterSpacing: showPassword ? 0 : 4,
                        borderColor: passwordError
                          ? "#EF4444"
                          : isPasswordFocused
                            ? "#3525cd"
                            : "#E2E1EC",
                        borderWidth: passwordError || isPasswordFocused ? 2 : 1,
                        paddingLeft:
                          passwordError || isPasswordFocused ? 15 : 16,
                        paddingRight: 56,
                        paddingVertical: showPassword
                          ? passwordError || isPasswordFocused
                            ? 11
                            : 12
                          : passwordError || isPasswordFocused
                            ? 9
                            : 10,
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

                {/* Log In Button */}
                <View className="pt-[12px] w-full" style={{ width: "100%" }}>
                  <Pressable
                    onPress={handleSignIn}
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
                        opacity: isLoading || !isLoaded ? 0.7 : 1,
                      },
                    ]}
                  >
                    {isLoading || !isLoaded ? (
                      <ActivityIndicator color="#FFFFFF" />
                    ) : (
                      <Text
                        className="text-[#ffffff] text-[16px] font-semibold"
                        style={{ fontFamily: "Inter", lineHeight: 24 }}
                      >
                        Log In
                      </Text>
                    )}
                  </Pressable>
                </View>
              </View>

              {/* Divider */}
              <View
                className="flex-row items-center py-[4px] w-full"
                style={{ width: "100%" }}
              >
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
                      <Text
                        className="text-[#12121A] text-[16px]"
                        style={{ fontFamily: "Inter", lineHeight: 24 }}
                      >
                        Sign in with Google
                      </Text>
                    </>
                  )}
                </Pressable>
              </View>

              {/* Footer Link */}
              <View
                className="flex-row justify-center pt-[8px] w-full"
                style={{ width: "100%" }}
              >
                <Text
                  className="text-[#6C6B7E] text-[16px]"
                  style={{ fontFamily: "Inter", lineHeight: 24 }}
                >
                  {"Don't have an account? "}
                </Text>
                <Link href="/sign-up" asChild>
                  <Pressable
                    style={({ pressed }) => ({ opacity: pressed ? 0.6 : 1 })}
                  >
                    <Text
                      className="text-[#3525cd] text-[16px] font-semibold"
                      style={{ fontFamily: "Inter", lineHeight: 24 }}
                    >
                      Sign Up
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
    }),
  },
});

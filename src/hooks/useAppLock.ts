import { useState, useEffect } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { requireOptionalNativeModule } from "expo-modules-core";

const LOCK_KEY = "zentra_app_lock_enabled";
const listeners = new Set<() => void>();

const isLocalAuthAvailable = !!requireOptionalNativeModule("ExpoLocalAuthentication");

export const getLocalAuthModule = async () => {
  if (!isLocalAuthAvailable) return null;
  try {
    return await import("expo-local-authentication");
  } catch {
    return null;
  }
};

export function useAppLock() {
  const [isLockEnabled, setIsLockEnabled] = useState(false);

  useEffect(() => {
    const loadPreference = async () => {
      try {
        const val = await AsyncStorage.getItem(LOCK_KEY);
        setIsLockEnabled(val === "true");
      } catch (err) {
        console.error("Error reading app lock preference:", err);
      }
    };

    loadPreference();

    const listener = () => {
      void loadPreference();
    };
    listeners.add(listener);
    return () => {
      listeners.delete(listener);
    };
  }, []);

  const enableLock = async () => {
    try {
      await AsyncStorage.setItem(LOCK_KEY, "true");
      setIsLockEnabled(true);
      listeners.forEach((l) => l());
    } catch (err) {
      console.error("Error setting app lock preference:", err);
    }
  };

  const disableLock = async () => {
    try {
      await AsyncStorage.setItem(LOCK_KEY, "false");
      setIsLockEnabled(false);
      listeners.forEach((l) => l());
    } catch (err) {
      console.error("Error setting app lock preference:", err);
    }
  };

  const authenticate = async (): Promise<boolean> => {
    const LocalAuthentication = await getLocalAuthModule();
    if (!LocalAuthentication) {
      console.warn("expo-local-authentication is not available on this platform/build.");
      return true;
    }
    try {
      const result = await LocalAuthentication.authenticateAsync({
        promptMessage: "Unlock Zentra",
        fallbackLabel: "Use PIN",
      });
      return result.success;
    } catch (err) {
      console.error("Authentication failed:", err);
      return false;
    }
  };

  return {
    isLockEnabled,
    enableLock,
    disableLock,
    authenticate,
  };
}

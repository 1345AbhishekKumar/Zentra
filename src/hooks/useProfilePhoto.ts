import { useState, useEffect, useRef } from "react";
import { Linking } from "react-native";
import { requireOptionalNativeModule } from "expo-modules-core";
import { showAlert, AlertButton } from "@/store/alertStore";
import { withIgnoreAppLock } from "./useAppLock";

interface GlobalWithNativeFlags {
  __isImagePickerNativeAvailable?: boolean;
}

const globalWithFlags = globalThis as GlobalWithNativeFlags;

const isImagePickerNativeAvailable =
  typeof globalWithFlags.__isImagePickerNativeAvailable === "boolean"
    ? globalWithFlags.__isImagePickerNativeAvailable
    : !!requireOptionalNativeModule("ExponentImagePicker");

const safeRequireImagePicker = () => {
  if (!isImagePickerNativeAvailable) {
    return null;
  }
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const ImagePicker = require("expo-image-picker");
    if (
      ImagePicker &&
      typeof ImagePicker.requestCameraPermissionsAsync === "function" &&
      typeof ImagePicker.launchCameraAsync === "function"
    ) {
      return ImagePicker as typeof import("expo-image-picker");
    }
  } catch {
    // Native module not registered
  }
  return null;
};

export interface ProfilePhotoUser {
  hasImage: boolean;
  setProfileImage: (params: { file: string | null }) => Promise<unknown>;
}

export function useProfilePhoto(user: ProfilePhotoUser | null | undefined) {
  const [isUploading, setIsUploading] = useState(false);
  const isMountedRef = useRef(true);

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  const handleTakePhoto = async () => {
    try {
      const ImagePicker = safeRequireImagePicker();
      if (!ImagePicker) {
        showAlert(
          "Sandbox Mode",
          "Native camera is not available. A simulated profile photo has been applied for testing.",
          "info"
        );
        setIsUploading(true);
        setTimeout(async () => {
          try {
            await user?.setProfileImage({
              file: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150",
            });
            if (isMountedRef.current) {
              setIsUploading(false);
            }
          } catch (err) {
            console.error(err);
            if (isMountedRef.current) {
              setIsUploading(false);
              showAlert("Upload Failed", "Failed to update profile photo.", "error");
            }
          }
        }, 1000);
        return;
      }

      const { status: cameraStatus } = await ImagePicker.requestCameraPermissionsAsync();
      if (cameraStatus !== "granted") {
        showAlert(
          "Permission Required",
          "Zentra needs access to your camera to take a photo. Please enable it in Settings.",
          "warning",
          [
            { text: "Cancel", style: "cancel" },
            { text: "Settings", onPress: () => Linking.openSettings() },
          ]
        );
        return;
      }

      const result = await withIgnoreAppLock(async () => {
        return await ImagePicker.launchCameraAsync({
          mediaTypes: ["images"],
          allowsEditing: true,
          aspect: [1, 1],
          quality: 0.6,
          base64: true,
        });
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const asset = result.assets[0];
        if (asset.base64) {
          setIsUploading(true);
          const mimeType = asset.mimeType || "image/jpeg";
          const dataUri = `data:${mimeType};base64,${asset.base64}`;
          await user?.setProfileImage({
            file: dataUri,
          });
          if (isMountedRef.current) {
            setIsUploading(false);
          }
        }
      }
    } catch (err) {
      console.error("Camera upload failed:", err);
      if (isMountedRef.current) {
        setIsUploading(false);
      }
      showAlert("Upload Failed", "An error occurred while uploading your photo.", "error");
    }
  };

  const handleChooseFromGallery = async () => {
    try {
      const ImagePicker = safeRequireImagePicker();
      if (!ImagePicker) {
        showAlert(
          "Sandbox Mode",
          "Native gallery is not available. A simulated profile photo has been applied for testing.",
          "info"
        );
        setIsUploading(true);
        setTimeout(async () => {
          try {
            await user?.setProfileImage({
              file: "https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?w=150",
            });
            if (isMountedRef.current) {
              setIsUploading(false);
            }
          } catch (err) {
            console.error(err);
            if (isMountedRef.current) {
              setIsUploading(false);
              showAlert("Upload Failed", "Failed to update profile photo.", "error");
            }
          }
        }, 1000);
        return;
      }

      const { status: galleryStatus } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (galleryStatus !== "granted") {
        showAlert(
          "Permission Required",
          "Zentra needs access to your gallery to pick a photo. Please enable it in Settings.",
          "warning",
          [
            { text: "Cancel", style: "cancel" },
            { text: "Settings", onPress: () => Linking.openSettings() },
          ]
        );
        return;
      }

      const result = await withIgnoreAppLock(async () => {
        return await ImagePicker.launchImageLibraryAsync({
          mediaTypes: ["images"],
          allowsEditing: true,
          aspect: [1, 1],
          quality: 0.6,
          base64: true,
        });
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const asset = result.assets[0];
        if (asset.base64) {
          setIsUploading(true);
          const mimeType = asset.mimeType || "image/jpeg";
          const dataUri = `data:${mimeType};base64,${asset.base64}`;
          await user?.setProfileImage({
            file: dataUri,
          });
          if (isMountedRef.current) {
            setIsUploading(false);
          }
        }
      }
    } catch (err) {
      console.error("Gallery upload failed:", err);
      if (isMountedRef.current) {
        setIsUploading(false);
      }
      showAlert("Upload Failed", "An error occurred while uploading your photo.", "error");
    }
  };

  const handleRemovePhoto = async () => {
    try {
      setIsUploading(true);
      await user?.setProfileImage({
        file: null,
      });
      if (isMountedRef.current) {
        setIsUploading(false);
      }
    } catch (err) {
      console.error("Remove photo failed:", err);
      if (isMountedRef.current) {
        setIsUploading(false);
      }
      showAlert("Failed to remove photo", "An error occurred while deleting your profile photo.", "error");
    }
  };

  const handleAvatarPress = () => {
    const options: AlertButton[] = [
      { text: "📷 Take Photo", onPress: handleTakePhoto },
      { text: "🖼 Choose from Gallery", onPress: handleChooseFromGallery },
    ];

    if (user?.hasImage) {
      options.push({ text: "🗑 Remove Photo", onPress: handleRemovePhoto });
    }

    options.push({ text: "Cancel", style: "cancel" as const });
    showAlert("Profile Photo", "Choose an option to update your photo", "info", options);
  };

  return {
    isUploading,
    handleAvatarPress,
    handleTakePhoto,
    handleChooseFromGallery,
    handleRemovePhoto,
  };
}

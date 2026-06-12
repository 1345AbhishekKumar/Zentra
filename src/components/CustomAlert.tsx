import React, { useEffect, useRef } from "react";
import { Modal, StyleSheet, Text, View } from "react-native";
import { useAlertStore, hideAlert, AlertButton } from "@/store/alertStore";
import ScalePressable from "./ScalePressable";
import StatusCircle from "./StatusCircle";

export default function CustomAlert() {
  const { visible, title, message, type, buttons } = useAlertStore();

  // Button styling based on AlertType
  let defaultBtnColor = "bg-accent";
  if (type === "success") {
    defaultBtnColor = "bg-success";
  } else if (type === "error") {
    defaultBtnColor = "bg-danger";
  } else if (type === "warning") {
    defaultBtnColor = "bg-warning";
  }

  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (!visible && timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
  }, [visible]);

  if (!visible) return null;

  const getButtonStyles = (btn: AlertButton) => {
    const isCancel = btn.style === "cancel";
    const isDestructive = btn.style === "destructive";

    let btnBgClass = defaultBtnColor;
    let textClass = "text-white font-semibold";
    let borderClass = "";

    if (isCancel) {
      btnBgClass = "bg-background";
      textClass = "text-primary font-semibold";
      borderClass = "border border-border";
    } else if (isDestructive) {
      btnBgClass = "bg-danger";
      textClass = "text-white font-semibold";
    }

    return { btnBgClass, textClass, borderClass };
  };

  const handleButtonPress = (btn: AlertButton) => {
    hideAlert();
    if (btn.onPress) {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      timeoutRef.current = setTimeout(() => {
        btn.onPress?.();
      }, 100);
    }
  };

  const renderButtons = () => {
    if (!buttons || buttons.length === 0) {
      // Show default "OK" button
      return (
        <ScalePressable
          onPress={hideAlert}
          accessibilityRole="button"
          accessibilityLabel="OK"
          className={`w-full py-3.5 rounded-xl items-center justify-center active:opacity-85 min-h-[48px] ${defaultBtnColor}`}
        >
          <Text className="text-body-md font-bold text-white font-display font-semibold">
            OK
          </Text>
        </ScalePressable>
      );
    }

    if (buttons.length <= 2) {
      // Render horizontally in a row
      return (
        <View className="flex-row w-full gap-3">
          {buttons.map((btn, index) => {
            const { btnBgClass, textClass, borderClass } = getButtonStyles(btn);

            return (
              <ScalePressable
                key={index}
                onPress={() => handleButtonPress(btn)}
                accessibilityRole="button"
                accessibilityLabel={btn.text}
                className={`flex-1 py-3.5 rounded-xl items-center justify-center active:opacity-85 min-h-[48px] ${btnBgClass} ${borderClass}`}
              >
                <Text className={`text-body-md font-bold font-display ${textClass}`}>
                  {btn.text}
                </Text>
              </ScalePressable>
            );
          })}
        </View>
      );
    }

    // Render vertically in a stack for 3+ buttons
    return (
      <View className="w-full gap-2">
        {buttons.map((btn, index) => {
          const { btnBgClass, textClass, borderClass } = getButtonStyles(btn);

          return (
            <ScalePressable
              key={index}
              onPress={() => handleButtonPress(btn)}
              accessibilityRole="button"
              accessibilityLabel={btn.text}
              className={`w-full py-3 rounded-xl items-center justify-center active:opacity-85 min-h-[44px] ${btnBgClass} ${borderClass}`}
            >
              <Text className={`text-body-md font-bold font-display ${textClass}`}>
                {btn.text}
              </Text>
            </ScalePressable>
          );
        })}
      </View>
    );
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={hideAlert}
    >
      <View style={styles.modalOverlay} className="flex-1 items-center justify-center px-6">
        <View
          className="bg-surface w-full p-6 rounded-2xl border border-border/40 items-center shadow-lg"
          style={{ maxWidth: 340 }}
        >
          {/* Circular Header Icon */}
          <View className="mb-4">
            <StatusCircle type={type} />
          </View>


          {/* Title */}
          {title ? (
            <Text className="text-h2 text-primary font-bold text-center mb-2 font-display">
              {title}
            </Text>
          ) : null}

          {/* Description Message */}
          {message ? (
            <Text className="text-body-md text-secondary text-center mb-6 leading-relaxed font-body">
              {message}
            </Text>
          ) : null}

          {/* Action Buttons */}
          {renderButtons()}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(18, 18, 26, 0.4)",
  },
});

import React from "react";
import { View, ViewProps, ColorValue } from "react-native";

interface FoldieIconProps extends ViewProps {
  color?: ColorValue;
  size?: number;
  focused?: boolean;
}

export default function FoldieIcon({
  color,
  size = 24,
  focused = false,
  style,
  ...props
}: FoldieIconProps) {
  // Brand colors from the SVG design
  const trustBlue = "#3A86FF";
  const deepCharcoal = "#1A1A1A";
  const warmWhite = "#F9F9F6";

  // Tab colors matching active / inactive states
  const bodyFill = focused ? trustBlue : "transparent";
  const earFill = focused ? warmWhite : "transparent";
  const strokeColor = focused ? deepCharcoal : (color || "#737373");
  const faceColor = focused ? deepCharcoal : (color || "#737373");

  const scale = size / 512;

  return (
    <View
      style={[
        {
          width: size,
          height: size,
          justifyContent: "center",
          alignItems: "center",
        },
        style,
      ]}
      {...props}
    >
      <View
        style={{
          width: 512,
          height: 512,
          position: "absolute",
          transform: [{ scale }, { rotate: "8deg" }],
        }}
      >
        {/* Main Document Body */}
        <View
          style={{
            position: "absolute",
            left: 86,
            top: 76,
            width: 340,
            height: 380,
            borderRadius: 90,
            backgroundColor: bodyFill,
            borderWidth: 16,
            borderColor: strokeColor,
          }}
        />

        {/* Folded Corner (Ear) */}
        <View
          style={{
            position: "absolute",
            left: 340,
            top: -20,
            width: 140,
            height: 140,
            borderRadius: 40,
            backgroundColor: earFill,
            borderWidth: 16,
            borderColor: strokeColor,
            transform: [{ rotate: "20deg" }],
          }}
        />

        {/* Left Eye */}
        <View
          style={{
            position: "absolute",
            left: 178, // 200 - 22
            top: 248, // 270 - 22
            width: 44,
            height: 44,
            borderRadius: 22,
            backgroundColor: faceColor,
          }}
        />

        {/* Right Eye */}
        <View
          style={{
            position: "absolute",
            left: 290, // 312 - 22
            top: 248, // 270 - 22
            width: 44,
            height: 44,
            borderRadius: 22,
            backgroundColor: faceColor,
          }}
        />

        {/* Smile Line */}
        <View
          style={{
            position: "absolute",
            left: 210,
            top: 290,
            width: 92,
            height: 80,
            borderRadius: 46,
            borderWidth: 16,
            borderColor: "transparent",
            borderBottomColor: faceColor,
          }}
        />
      </View>
    </View>
  );
}

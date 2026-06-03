import React, { useRef } from "react";
import { Animated, Easing, Pressable, PressableProps, StyleProp, ViewStyle } from "react-native";

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export interface ScalePressableProps extends Omit<PressableProps, "style"> {
  activeScale?: number; // default 0.97
  pressInDuration?: number; // default 100ms
  pressOutDuration?: number; // default 150ms
  style?: StyleProp<ViewStyle> | ((state: { pressed: boolean }) => StyleProp<ViewStyle>);
  children?: React.ReactNode | ((state: { pressed: boolean }) => React.ReactNode);
}

export default function ScalePressable({
  children,
  style,
  activeScale = 0.97,
  pressInDuration = 100,
  pressOutDuration = 150,
  onPressIn,
  onPressOut,
  ...props
}: ScalePressableProps) {
  const scale = useRef(new Animated.Value(1)).current;

  const handlePressIn = (event: any) => {
    Animated.timing(scale, {
      toValue: activeScale,
      duration: pressInDuration,
      easing: Easing.bezier(0.23, 1, 0.32, 1),
      useNativeDriver: true,
    }).start();
    onPressIn?.(event);
  };

  const handlePressOut = (event: any) => {
    Animated.timing(scale, {
      toValue: 1,
      duration: pressOutDuration,
      easing: Easing.bezier(0.23, 1, 0.32, 1),
      useNativeDriver: true,
    }).start();
    onPressOut?.(event);
  };

  return (
    <AnimatedPressable
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      style={(state) => {
        const resolvedStyle = typeof style === "function" ? style(state) : style;
        return [
          { transform: [{ scale }] } as any,
          resolvedStyle,
        ];
      }}
      {...props}
    >
      {children}
    </AnimatedPressable>
  );
}

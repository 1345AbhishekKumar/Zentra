import { View, Text } from "react-native";
import { colors } from "@/theme/tokens";

export default function ProfileScreen() {
  return (
    <View
      className="flex-1 justify-center items-center"
      style={{ backgroundColor: colors.background }}
    >
      <Text className="text-h2 text-primary">Profile</Text>
    </View>
  );
}

import { useAuth, useUser, useClerk } from "@clerk/expo";
import { Redirect } from "expo-router";
import { Text, View, Pressable, StyleSheet, Alert } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function Index() {
  const { isSignedIn, isLoaded } = useAuth();
  const { user } = useUser();
  const { signOut } = useClerk();

  if (!isLoaded) return null;

  if (!isSignedIn) {
    return <Redirect href="/(auth)/sign-in" />;
  }

  return (
    <SafeAreaView style={styles.container}>
      <View className="flex-1 p-[24px] justify-center items-center">
        <Text className="text-[32px] font-bold text-[#12121A] mb-[8px] font-inter">Welcome to Zentra</Text>
        <Text className="text-[16px] text-[#6C6B7E] mb-[32px] font-inter">Your vault is secured.</Text>
        
        <View className="w-full bg-[#F8F8FC] p-[20px] rounded-2xl border border-[#E2E1EC] mb-[32px]">
          <Text className="text-[12px] text-[#6C6B7E] font-semibold uppercase mb-[4px] font-inter">Authenticated as:</Text>
          <Text className="text-[16px] text-[#12121A] font-medium font-inter">{user?.primaryEmailAddress?.emailAddress}</Text>
        </View>

        <Pressable 
          onPress={async () => {
            try {
              await signOut();
            } catch (err) {
              console.error("Sign out error:", err);
              Alert.alert(
                "Sign Out Failed",
                err instanceof Error ? err.message : "An error occurred during sign-out. Please try again."
              );
            }
          }}
          className="bg-[#3525cd] py-[16px] px-[32px] rounded-2xl w-full items-center"
          style={({ pressed }) => ({
            opacity: pressed ? 0.8 : 1
          })}
        >
          <Text className="text-[#FFFFFF] text-[16px] font-semibold font-inter">Sign Out</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },
});


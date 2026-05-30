import { useAuth, useUser, useClerk } from "@clerk/expo";
import { Redirect } from "expo-router";
import { Text, View, Pressable, StyleSheet } from "react-native";
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
      <View style={styles.content}>
        <Text style={styles.title}>Welcome to Zentra</Text>
        <Text style={styles.subtitle}>Your vault is secured.</Text>
        
        <View style={styles.card}>
          <Text style={styles.label}>Authenticated as:</Text>
          <Text style={styles.email}>{user?.primaryEmailAddress?.emailAddress}</Text>
        </View>

        <Pressable 
          onPress={() => signOut()}
          style={({ pressed }) => [
            styles.button,
            { opacity: pressed ? 0.8 : 1 }
          ]}
        >
          <Text style={styles.buttonText}>Sign Out</Text>
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
  content: {
    flex: 1,
    padding: 24,
    justifyContent: "center",
    alignItems: "center",
  },
  title: {
    fontSize: 32,
    fontWeight: "bold",
    color: "#12121A",
    marginBottom: 8,
    fontFamily: "Inter",
  },
  subtitle: {
    fontSize: 16,
    color: "#6C6B7E",
    marginBottom: 32,
    fontFamily: "Inter",
  },
  card: {
    width: "100%",
    backgroundColor: "#F8F8FC",
    padding: 20,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#E2E1EC",
    marginBottom: 32,
  },
  label: {
    fontSize: 12,
    color: "#6C6B7E",
    fontWeight: "600",
    textTransform: "uppercase",
    marginBottom: 4,
  },
  email: {
    fontSize: 16,
    color: "#12121A",
    fontWeight: "500",
  },
  button: {
    backgroundColor: "#3525cd",
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 16,
    width: "100%",
    alignItems: "center",
  },
  buttonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
  },
});


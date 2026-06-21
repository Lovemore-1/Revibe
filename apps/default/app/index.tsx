import { Redirect } from "expo-router";
import { AuthLoading, Authenticated, Unauthenticated } from "convex/react";
import { useQuery } from "convex/react";
import { View, ActivityIndicator } from "react-native";
import { api } from "@/convex/_generated/api";
import { AuthScreen } from "@/components/revibe/auth-screen";
import { colors } from "@/lib/revibe-theme";

export default function IndexScreen() {
  return (
    <>
      <AuthLoading>
        <LoadingScreen />
      </AuthLoading>

      <Unauthenticated>
        <AuthScreen />
      </Unauthenticated>

      <Authenticated>
        <ProfileGate />
      </Authenticated>
    </>
  );
}

function ProfileGate() {
  const profile = useQuery(api.profiles.getMine);

  // Still loading
  if (profile === undefined) return <LoadingScreen />;

  // No profile → onboarding
  if (profile === null) return <Redirect href="/onboarding" />;

  // Profile exists → main app
  return <Redirect href="/(tabs)" />;
}

function LoadingScreen() {
  return (
    <View style={{ flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: "#F8F6FF" }}>
      <ActivityIndicator size="large" color={colors.lavender} />
    </View>
  );
}

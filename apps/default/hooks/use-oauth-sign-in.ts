import { useAuthActions } from "@convex-dev/auth/react";
import * as WebBrowser from "expo-web-browser";
import * as AuthSession from "expo-auth-session";
import { Platform } from "react-native";

// Required for expo-web-browser to properly close the auth session on Android
WebBrowser.maybeCompleteAuthSession();

type OAuthProvider = "google" | "github" | "apple";

export function useOAuthSignIn() {
  const { signIn } = useAuthActions();

  const signInWith = async (provider: OAuthProvider) => {
    // On native, create a redirect URI that points back to the app
    const redirectTo =
      Platform.OS === "web"
        ? window.location.origin
        : AuthSession.makeRedirectUri({
            scheme: "revibe",
            path: "auth",
          });

    await signIn(provider, { redirectTo });
  };

  return { signInWith };
}

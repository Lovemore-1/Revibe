import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Alert,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { useAuthActions } from "@convex-dev/auth/react";
import { useOAuthSignIn } from "@/hooks/use-oauth-sign-in";
import { type ThemeColors } from "@/lib/revibe-theme";
import { useTheme, useThemedStyles } from "@/lib/theme-context";

export function AuthScreen() {
  const { signIn } = useAuthActions();
  const { signInWith } = useOAuthSignIn();
  const { colors, gradients } = useTheme();
  const styles = useThemedStyles(makeStyles);

  const [mode, setMode] = useState<"signIn" | "signUp">("signIn");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleEmailAuth = async () => {
    if (!email.trim() || !password) {
      Alert.alert("Missing fields", "Please enter your email and password.");
      return;
    }
    setLoading(true);
    try {
      await signIn("password", {
        email: email.trim().toLowerCase(),
        password,
        flow: mode,
      });
    } catch (err: any) {
      Alert.alert(
        mode === "signIn" ? "Sign in failed" : "Sign up failed",
        err.message ?? "Please check your details and try again.",
      );
    } finally {
      setLoading(false);
    }
  };

  const handleOAuth = async (provider: "google" | "apple") => {
    setLoading(true);
    try {
      await signInWith(provider);
    } catch (err: any) {
      Alert.alert("OAuth error", err.message ?? "Could not sign in.");
    } finally {
      setLoading(false);
    }
  };

  const handleGuest = async () => {
    setLoading(true);
    try {
      await signIn("anonymous");
    } catch (err: any) {
      Alert.alert("Error", err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <LinearGradient colors={gradients.app} style={styles.container}>
      <SafeAreaView style={{ flex: 1 }}>
        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior={Platform.OS === "ios" ? "padding" : undefined}
        >
          <ScrollView
            contentContainerStyle={styles.scroll}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            {/* Logo */}
            <LinearGradient
              colors={gradients.hero}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.logoBadge}
            >
              <Text style={styles.logoEmoji}>💜</Text>
            </LinearGradient>
            <Text style={styles.appName}>Revibe</Text>
            <Text style={styles.tagline}>Recovery together.</Text>

            {/* OAuth buttons */}
            <OAuthButton
              icon="logo-google"
              label="Continue with Google"
              onPress={() => handleOAuth("google")}
              disabled={loading}
            />
            {Platform.OS === "ios" && (
              <OAuthButton
                icon="logo-apple"
                label="Continue with Apple"
                onPress={() => handleOAuth("apple")}
                disabled={loading}
                dark
              />
            )}

            <View style={styles.dividerRow}>
              <View style={styles.divider} />
              <Text style={styles.dividerText}>or</Text>
              <View style={styles.divider} />
            </View>

            {/* Email / Password */}
            <TextInput
              style={styles.input}
              placeholder="Email"
              placeholderTextColor={colors.muted}
              value={email}
              onChangeText={setEmail}
              autoCapitalize="none"
              keyboardType="email-address"
              textContentType="emailAddress"
            />
            <TextInput
              style={styles.input}
              placeholder="Password"
              placeholderTextColor={colors.muted}
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              textContentType={mode === "signUp" ? "newPassword" : "password"}
            />

            {/* Submit */}
            <TouchableOpacity
              style={[styles.submitBtn, loading && { opacity: 0.6 }]}
              onPress={handleEmailAuth}
              disabled={loading}
              activeOpacity={0.85}
            >
              <LinearGradient
                colors={gradients.hero}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.submitGradient}
              >
                {loading ? (
                  <ActivityIndicator color={colors.onAccent} />
                ) : (
                  <Text style={styles.submitText}>
                    {mode === "signIn" ? "Sign In" : "Create Account"}
                  </Text>
                )}
              </LinearGradient>
            </TouchableOpacity>

            {/* Toggle sign-in / sign-up */}
            <TouchableOpacity
              style={styles.toggleBtn}
              onPress={() => setMode(mode === "signIn" ? "signUp" : "signIn")}
            >
              <Text style={styles.toggleText}>
                {mode === "signIn"
                  ? "Don't have an account? "
                  : "Already have an account? "}
                <Text style={styles.toggleLink}>
                  {mode === "signIn" ? "Sign up" : "Sign in"}
                </Text>
              </Text>
            </TouchableOpacity>

            {/* Guest / anonymous */}
            <TouchableOpacity style={styles.guestBtn} onPress={handleGuest} disabled={loading}>
              <Text style={styles.guestText}>Continue as guest</Text>
            </TouchableOpacity>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </LinearGradient>
  );
}

function OAuthButton({
  icon,
  label,
  onPress,
  disabled,
  dark,
}: {
  icon: any;
  label: string;
  onPress: () => void;
  disabled?: boolean;
  dark?: boolean;
}) {
  const { colors } = useTheme();
  const styles = useThemedStyles(makeStyles);
  return (
    <TouchableOpacity
      style={[styles.oauthBtn, dark && styles.oauthBtnDark, disabled && { opacity: 0.6 }]}
      onPress={onPress}
      disabled={disabled}
      activeOpacity={0.85}
    >
      <Ionicons name={icon} size={20} color={dark ? "#fff" : colors.ink} />
      <Text style={[styles.oauthText, dark && styles.oauthTextDark]}>{label}</Text>
    </TouchableOpacity>
  );
}

const makeStyles = (colors: ThemeColors) =>
  StyleSheet.create({
  container: { flex: 1 },
  scroll: {
    flexGrow: 1,
    alignItems: "center",
    paddingHorizontal: 24,
    paddingTop: 40,
    paddingBottom: 40,
  },

  logoBadge: {
    width: 80,
    height: 80,
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
    shadowColor: colors.lavender,
    shadowOpacity: 0.4,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 6 },
  },
  logoEmoji: { fontSize: 36 },
  appName: { fontSize: 32, fontWeight: "800", color: colors.ink, marginBottom: 6 },
  tagline: { color: colors.muted, fontSize: 15, marginBottom: 36 },

  oauthBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    width: "100%",
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: colors.soft,
    backgroundColor: colors.card,
    paddingVertical: 13,
    paddingHorizontal: 20,
    marginBottom: 10,
  },
  oauthBtnDark: {
    backgroundColor: "#1A1A1A",
    borderColor: "#1A1A1A",
  },
  oauthText: { color: colors.ink, fontWeight: "600", fontSize: 15 },
  oauthTextDark: { color: "#fff" },

  dividerRow: {
    flexDirection: "row",
    alignItems: "center",
    width: "100%",
    marginVertical: 16,
    gap: 12,
  },
  divider: { flex: 1, height: 1, backgroundColor: colors.soft },
  dividerText: { color: colors.muted, fontSize: 13 },

  input: {
    width: "100%",
    backgroundColor: colors.card,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: colors.soft,
    paddingHorizontal: 16,
    paddingVertical: 13,
    fontSize: 15,
    color: colors.ink,
    marginBottom: 10,
  },

  submitBtn: { width: "100%", borderRadius: 14, overflow: "hidden", marginTop: 4 },
  submitGradient: {
    paddingVertical: 15,
    alignItems: "center",
    justifyContent: "center",
  },
  submitText: { color: colors.onAccent, fontWeight: "700", fontSize: 16 },

  toggleBtn: { marginTop: 16 },
  toggleText: { color: colors.muted, fontSize: 14 },
  toggleLink: { color: colors.lavender, fontWeight: "700" },

  guestBtn: { marginTop: 20 },
  guestText: { color: colors.muted, fontSize: 13 },
});

import React from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  ViewStyle,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import Animated, { FadeInDown } from "react-native-reanimated";
import * as Haptics from "expo-haptics";
import { colors, gradients } from "@/lib/revibe-theme";

// ─── Helpers ──────────────────────────────────────────────────────────────────

export function impactLight() {
  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
}

// ─── Screen ───────────────────────────────────────────────────────────────────

/**
 * Root screen wrapper: gradient background + SafeAreaView.
 * Use instead of <View style={{flex:1}}> on every screen.
 */
export function Screen({ children }: { children: React.ReactNode }) {
  return (
    <LinearGradient colors={gradients.app} style={styles.screen}>
      <SafeAreaView style={styles.safeArea} edges={["top"]}>
        {children}
      </SafeAreaView>
    </LinearGradient>
  );
}

// ─── Header ───────────────────────────────────────────────────────────────────

export function Header({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <View style={styles.header}>
      <Text style={styles.headerTitle}>{title}</Text>
      {subtitle ? <Text style={styles.headerSubtitle}>{subtitle}</Text> : null}
    </View>
  );
}

// ─── Card ─────────────────────────────────────────────────────────────────────

export function Card({
  children,
  style,
}: {
  children: React.ReactNode;
  style?: ViewStyle;
}) {
  return (
    <Animated.View entering={FadeInDown.duration(300).springify()} style={[styles.card, style]}>
      {children}
    </Animated.View>
  );
}

// ─── Chip ─────────────────────────────────────────────────────────────────────

export function Chip({
  label,
  active,
  onPress,
  style,
}: {
  label: string;
  active?: boolean;
  onPress?: () => void;
  style?: ViewStyle;
}) {
  return (
    <TouchableOpacity
      style={[styles.chip, active && styles.chipActive, style]}
      onPress={() => {
        impactLight();
        onPress?.();
      }}
      activeOpacity={0.75}
    >
      <Text style={[styles.chipText, active && styles.chipTextActive]}>{label}</Text>
    </TouchableOpacity>
  );
}

// ─── PrimaryButton ────────────────────────────────────────────────────────────

export function PrimaryButton({
  title,
  onPress,
  loading,
  disabled,
  style,
}: {
  title: string;
  onPress: () => void;
  loading?: boolean;
  disabled?: boolean;
  style?: ViewStyle;
}) {
  return (
    <TouchableOpacity
      onPress={() => {
        impactLight();
        onPress();
      }}
      disabled={disabled || loading}
      activeOpacity={0.85}
      style={[styles.primaryBtnWrapper, (disabled || loading) && { opacity: 0.55 }, style]}
    >
      <LinearGradient
        colors={[colors.lavender, "#5B3FCC"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={styles.primaryBtnGradient}
      >
        {loading ? (
          <ActivityIndicator color="#fff" size="small" />
        ) : (
          <Text style={styles.primaryBtnText}>{title}</Text>
        )}
      </LinearGradient>
    </TouchableOpacity>
  );
}

// ─── StatPill ─────────────────────────────────────────────────────────────────

export function StatPill({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.statPill}>
      <Text style={styles.statPillValue}>{value}</Text>
      <Text style={styles.statPillLabel}>{label}</Text>
    </View>
  );
}

// ─── EmptyState ───────────────────────────────────────────────────────────────

export function EmptyState({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <View style={styles.emptyState}>
      <Text style={styles.emptyStateTitle}>{title}</Text>
      {subtitle ? <Text style={styles.emptyStateSub}>{subtitle}</Text> : null}
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

export const sharedStyles = StyleSheet.create({
  row: { flexDirection: "row", alignItems: "center" },
  gap8: { gap: 8 },
  gap12: { gap: 12 },
  flex1: { flex: 1 },
  textInk: { color: colors.ink },
  textMuted: { color: colors.muted },
  fontBold: { fontWeight: "700" },
});

const styles = StyleSheet.create({
  screen: { flex: 1 },
  safeArea: { flex: 1 },

  header: { paddingHorizontal: 16, paddingTop: 8, paddingBottom: 4 },
  headerTitle: { fontSize: 24, fontWeight: "800", color: colors.ink },
  headerSubtitle: { fontSize: 13, color: colors.muted, marginTop: 2 },

  card: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 16,
    marginHorizontal: 16,
    marginBottom: 8,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },

  chip: {
    borderWidth: 1.5,
    borderColor: colors.soft,
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: "#fff",
  },
  chipActive: {
    borderColor: colors.lavender,
    backgroundColor: colors.lavender + "18",
  },
  chipText: { fontSize: 13, color: colors.muted, fontWeight: "600" },
  chipTextActive: { color: colors.lavender },

  primaryBtnWrapper: {
    borderRadius: 14,
    overflow: "hidden",
    marginTop: 8,
  },
  primaryBtnGradient: {
    paddingVertical: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  primaryBtnText: { color: "#fff", fontWeight: "700", fontSize: 16 },

  statPill: {
    backgroundColor: colors.lavender + "15",
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
    alignItems: "center",
  },
  statPillValue: { fontWeight: "800", color: colors.lavender, fontSize: 18 },
  statPillLabel: { color: colors.muted, fontSize: 11, marginTop: 2 },

  emptyState: {
    alignItems: "center",
    paddingVertical: 40,
    paddingHorizontal: 32,
  },
  emptyStateTitle: { fontWeight: "700", color: colors.ink, fontSize: 16, textAlign: "center" },
  emptyStateSub: { color: colors.muted, fontSize: 14, marginTop: 6, textAlign: "center" },
});

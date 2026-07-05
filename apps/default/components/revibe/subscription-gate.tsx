import React from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { useRouter } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { useSubscription } from "@/hooks/use-subscription";
import { type ThemeColors } from "@/lib/revibe-theme";
import { useTheme, useThemedStyles } from "@/lib/theme-context";

interface SubscriptionGateProps {
  /** Content to show when the user has Pro */
  children: React.ReactNode;
  /** Short label shown in the locked state, e.g. "Advanced Analytics" */
  featureName: string;
  /** One-line description shown in the locked card */
  featureDescription?: string;
  /** If true, renders children with a blurred overlay instead of hiding them */
  overlay?: boolean;
}

/**
 * Wraps Pro-only content.  Free users see a friendly upgrade card.
 *
 * <SubscriptionGate featureName="Advanced Analytics">
 *   <AdvancedChart />
 * </SubscriptionGate>
 */
export function SubscriptionGate({
  children,
  featureName,
  featureDescription,
  overlay = false,
}: SubscriptionGateProps) {
  const { isPro, isLoading } = useSubscription();
  const router = useRouter();
  const styles = useThemedStyles(makeStyles);

  if (isLoading) return null;
  if (isPro) return <>{children}</>;

  if (overlay) {
    return (
      <View style={styles.overlayContainer}>
        <View style={styles.overlayContent}>{children}</View>
        <View style={styles.overlayMask}>
          <LockedCard
            featureName={featureName}
            featureDescription={featureDescription}
            onUpgrade={() => router.push("/subscription")}
          />
        </View>
      </View>
    );
  }

  return (
    <LockedCard
      featureName={featureName}
      featureDescription={featureDescription}
      onUpgrade={() => router.push("/subscription")}
    />
  );
}

function LockedCard({
  featureName,
  featureDescription,
  onUpgrade,
}: {
  featureName: string;
  featureDescription?: string;
  onUpgrade: () => void;
}) {
  const { colors } = useTheme();
  const styles = useThemedStyles(makeStyles);
  return (
    <View style={styles.card}>
      <LinearGradient
        colors={["#7C5CFF22", "#7C5CFF08"]}
        style={styles.cardGradient}
      >
        <View style={styles.lockRow}>
          <View style={styles.lockBadge}>
            <Ionicons name="lock-closed" size={16} color={colors.lavender} />
          </View>
          <Text style={styles.proLabel}>Revibe Pro</Text>
        </View>
        <Text style={styles.featureName}>{featureName}</Text>
        {featureDescription ? (
          <Text style={styles.featureDesc}>{featureDescription}</Text>
        ) : null}
        <TouchableOpacity style={styles.upgradeBtn} onPress={onUpgrade} activeOpacity={0.85}>
          <LinearGradient
            colors={[colors.lavender, "#5B3FCC"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.upgradeBtnGradient}
          >
            <Text style={styles.upgradeBtnText}>Upgrade to Pro</Text>
            <Ionicons name="arrow-forward" size={16} color={colors.onAccent} />
          </LinearGradient>
        </TouchableOpacity>
      </LinearGradient>
    </View>
  );
}

const makeStyles = (colors: ThemeColors) =>
  StyleSheet.create({
  card: {
    borderRadius: 16,
    overflow: "hidden",
    marginVertical: 8,
    borderWidth: 1,
    borderColor: "#7C5CFF33",
  },
  cardGradient: {
    padding: 20,
    gap: 10,
  },
  lockRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  lockBadge: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: "#7C5CFF22",
    alignItems: "center",
    justifyContent: "center",
  },
  proLabel: {
    color: colors.lavender,
    fontWeight: "700",
    fontSize: 12,
    letterSpacing: 0.5,
    textTransform: "uppercase",
  },
  featureName: {
    color: colors.ink,
    fontSize: 17,
    fontWeight: "700",
  },
  featureDesc: {
    color: colors.muted,
    fontSize: 14,
    lineHeight: 20,
  },
  upgradeBtn: {
    marginTop: 4,
    borderRadius: 12,
    overflow: "hidden",
  },
  upgradeBtnGradient: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 12,
    paddingHorizontal: 20,
  },
  upgradeBtnText: {
    color: colors.onAccent,
    fontWeight: "700",
    fontSize: 15,
  },
  overlayContainer: {
    position: "relative",
  },
  overlayContent: {
    opacity: 0.15,
  },
  overlayMask: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: "center",
    padding: 16,
  },
});

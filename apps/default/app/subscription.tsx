import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useSubscription } from "@/hooks/use-subscription";
import { colors } from "@/lib/revibe-theme";
import * as Haptics from "expo-haptics";

// ---------------------------------------------------------------------------
// Pricing
// ---------------------------------------------------------------------------
const PLANS = [
  {
    id: "monthly" as const,
    label: "Monthly",
    price: "$4.99",
    period: "/month",
    subtext: "Billed monthly",
    days: 30,
    badge: null,
  },
  {
    id: "annual" as const,
    label: "Annual",
    price: "$39.99",
    period: "/year",
    subtext: "Just $3.33/month — save 33%",
    days: 365,
    badge: "Best Value",
  },
];

const PRO_FEATURES = [
  {
    icon: "bar-chart" as const,
    title: "Advanced Journal Analytics",
    desc: "30-day mood, pain & energy trends with visual charts",
  },
  {
    icon: "chatbubbles" as const,
    title: "Unlimited Conversations",
    desc: "DM as many recovery buddies as you need",
  },
  {
    icon: "people" as const,
    title: "Priority Buddy Matching",
    desc: "Your profile shown first to relevant recovery buddies",
  },
  {
    icon: "ribbon" as const,
    title: "Pro Badge",
    desc: "Stand out with a Pro badge on your profile and posts",
  },
  {
    icon: "flash" as const,
    title: "Early Access",
    desc: "Try new Revibe features before anyone else",
  },
];

// ---------------------------------------------------------------------------
// Screen
// ---------------------------------------------------------------------------
export default function SubscriptionScreen() {
  const router = useRouter();
  const { isPro, currentPeriodEnd, cancelAtPeriodEnd } = useSubscription();
  const activateSubscription = useMutation(api.subscriptions.activateSubscription);
  const cancelSubscription = useMutation(api.subscriptions.cancelSubscription);

  const [selectedPlan, setSelectedPlan] = useState<"monthly" | "annual">("annual");
  const [loading, setLoading] = useState(false);

  // ── Handlers ───────────────────────────────────────────────────────────

  const handleSubscribe = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setLoading(true);
    try {
      /**
       * TODO: Replace this mock with RevenueCat SDK call:
       *
       *   import Purchases from "react-native-purchases";
       *   const offerings = await Purchases.getOfferings();
       *   const pkg = offerings.current?.monthly; // or .annual
       *   const { customerInfo } = await Purchases.purchasePackage(pkg);
       *   const subId = customerInfo.originalAppUserId;
       *
       * Then call activateSubscription with the real data:
       */
      const plan = PLANS.find((p) => p.id === selectedPlan)!;
      await activateSubscription({
        provider: "revenuecat",
        providerSubscriptionId: `mock_${Date.now()}`,
        periodDays: plan.days,
      });

      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Alert.alert("Welcome to Pro! 🎉", "You now have full access to all Revibe Pro features.", [
        { text: "Let's go", onPress: () => router.back() },
      ]);
    } catch (err: unknown) {
      Alert.alert("Something went wrong", (err as Error).message ?? "Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    Alert.alert(
      "Cancel Subscription?",
      "You'll keep Pro access until the end of your billing period.",
      [
        { text: "Keep Pro", style: "cancel" },
        {
          text: "Cancel Renewal",
          style: "destructive",
          onPress: async () => {
            try {
              await cancelSubscription();
              Alert.alert("Subscription cancelled", "You'll keep access until your period ends.");
            } catch {
              Alert.alert("Error", "Could not cancel. Please try again.");
            }
          },
        },
      ],
    );
  };

  // ── Render ─────────────────────────────────────────────────────────────

  return (
    <SafeAreaView style={styles.safe} edges={["top", "bottom"]}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <TouchableOpacity style={styles.closeBtn} onPress={() => router.back()}>
          <Ionicons name="close" size={22} color={colors.muted} />
        </TouchableOpacity>

        <LinearGradient
          colors={[colors.lavender, "#5B3FCC"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.heroBadge}
        >
          <Ionicons name="ribbon" size={28} color="#fff" />
        </LinearGradient>

        <Text style={styles.heroTitle}>Revibe Pro</Text>
        <Text style={styles.heroSub}>
          Everything you need to stay consistent and connected on your recovery journey.
        </Text>

        {/* Already Pro state */}
        {isPro ? (
          <View style={styles.activeCard}>
            <Ionicons name="checkmark-circle" size={20} color={colors.teal} />
            <View style={{ flex: 1 }}>
              <Text style={styles.activeTitle}>You're on Revibe Pro 🎉</Text>
              {currentPeriodEnd ? (
                <Text style={styles.activeSub}>
                  {cancelAtPeriodEnd ? "Ends" : "Renews"}{" "}
                  {new Date(currentPeriodEnd).toLocaleDateString("en-US", {
                    month: "long",
                    day: "numeric",
                    year: "numeric",
                  })}
                </Text>
              ) : null}
            </View>
          </View>
        ) : null}

        {/* Features */}
        <View style={styles.featuresCard}>
          {PRO_FEATURES.map((f, i) => (
            <View key={f.title} style={[styles.featureRow, i > 0 && styles.featureDivider]}>
              <View style={styles.featureIconBg}>
                <Ionicons name={f.icon} size={18} color={colors.lavender} />
              </View>
              <View style={styles.featureText}>
                <Text style={styles.featureTitle}>{f.title}</Text>
                <Text style={styles.featureDesc}>{f.desc}</Text>
              </View>
            </View>
          ))}
        </View>

        {/* Plan selector (only for non-Pro users) */}
        {!isPro ? (
          <>
            <Text style={styles.sectionLabel}>Choose your plan</Text>
            <View style={styles.planRow}>
              {PLANS.map((plan) => (
                <TouchableOpacity
                  key={plan.id}
                  style={[styles.planCard, selectedPlan === plan.id && styles.planCardSelected]}
                  onPress={() => {
                    setSelectedPlan(plan.id);
                    Haptics.selectionAsync();
                  }}
                  activeOpacity={0.85}
                >
                  {plan.badge ? (
                    <LinearGradient
                      colors={[colors.lavender, "#5B3FCC"]}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 0 }}
                      style={styles.planBadge}
                    >
                      <Text style={styles.planBadgeText}>{plan.badge}</Text>
                    </LinearGradient>
                  ) : null}
                  <Text style={styles.planLabel}>{plan.label}</Text>
                  <Text style={styles.planPrice}>
                    {plan.price}
                    <Text style={styles.planPeriod}>{plan.period}</Text>
                  </Text>
                  <Text style={styles.planSubtext}>{plan.subtext}</Text>
                  {selectedPlan === plan.id ? (
                    <View style={styles.planCheck}>
                      <Ionicons name="checkmark-circle" size={18} color={colors.lavender} />
                    </View>
                  ) : null}
                </TouchableOpacity>
              ))}
            </View>

            <TouchableOpacity
              style={[styles.ctaBtn, loading && styles.ctaBtnDisabled]}
              onPress={handleSubscribe}
              disabled={loading}
              activeOpacity={0.88}
            >
              <LinearGradient
                colors={[colors.lavender, "#5B3FCC"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.ctaGradient}
              >
                {loading ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <>
                    <Text style={styles.ctaText}>Start Pro</Text>
                    <Ionicons name="arrow-forward" size={18} color="#fff" />
                  </>
                )}
              </LinearGradient>
            </TouchableOpacity>

            <Text style={styles.legalText}>
              Cancel anytime. Subscription renews automatically unless cancelled at least 24 hours
              before the end of the current period.
            </Text>

            <TouchableOpacity style={styles.restoreBtn}>
              <Text style={styles.restoreText}>Restore Purchases</Text>
            </TouchableOpacity>
          </>
        ) : (
          !cancelAtPeriodEnd && (
            <TouchableOpacity style={styles.cancelLink} onPress={handleCancel}>
              <Text style={styles.cancelLinkText}>Cancel subscription</Text>
            </TouchableOpacity>
          )
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------
const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.soft },
  scroll: { flex: 1 },
  content: { padding: 24, paddingBottom: 48, alignItems: "center" },

  closeBtn: {
    alignSelf: "flex-end",
    padding: 4,
    marginBottom: 16,
  },

  heroBadge: {
    width: 72,
    height: 72,
    borderRadius: 36,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
  },
  heroTitle: {
    fontSize: 28,
    fontWeight: "800",
    color: colors.ink,
    textAlign: "center",
    marginBottom: 8,
  },
  heroSub: {
    fontSize: 15,
    color: colors.muted,
    textAlign: "center",
    lineHeight: 22,
    marginBottom: 28,
    paddingHorizontal: 16,
  },

  activeCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    backgroundColor: "#E6FFF9",
    borderRadius: 14,
    padding: 16,
    width: "100%",
    marginBottom: 24,
    borderWidth: 1,
    borderColor: colors.teal + "44",
  },
  activeTitle: { fontWeight: "700", color: colors.ink, fontSize: 15 },
  activeSub: { color: colors.muted, fontSize: 13, marginTop: 2 },

  featuresCard: {
    width: "100%",
    backgroundColor: "#fff",
    borderRadius: 18,
    overflow: "hidden",
    marginBottom: 28,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  featureRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 14,
    padding: 16,
  },
  featureDivider: {
    borderTopWidth: 1,
    borderTopColor: colors.soft,
  },
  featureIconBg: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: "#7C5CFF15",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 1,
  },
  featureText: { flex: 1 },
  featureTitle: { fontWeight: "700", color: colors.ink, fontSize: 15, marginBottom: 2 },
  featureDesc: { color: colors.muted, fontSize: 13, lineHeight: 18 },

  sectionLabel: {
    alignSelf: "flex-start",
    fontWeight: "700",
    fontSize: 13,
    color: colors.muted,
    letterSpacing: 0.5,
    textTransform: "uppercase",
    marginBottom: 12,
  },
  planRow: {
    flexDirection: "row",
    gap: 12,
    width: "100%",
    marginBottom: 20,
  },
  planCard: {
    flex: 1,
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 16,
    borderWidth: 2,
    borderColor: colors.soft,
    position: "relative",
    overflow: "hidden",
  },
  planCardSelected: {
    borderColor: colors.lavender,
    backgroundColor: "#F4F0FF",
  },
  planBadge: {
    position: "absolute",
    top: 0,
    right: 0,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderBottomLeftRadius: 8,
  },
  planBadgeText: { color: "#fff", fontSize: 10, fontWeight: "800" },
  planLabel: { color: colors.muted, fontSize: 12, fontWeight: "600", marginBottom: 6 },
  planPrice: { fontSize: 22, fontWeight: "800", color: colors.ink },
  planPeriod: { fontSize: 13, fontWeight: "400", color: colors.muted },
  planSubtext: { color: colors.muted, fontSize: 11, marginTop: 4 },
  planCheck: { position: "absolute", top: 10, left: 10 },

  ctaBtn: { width: "100%", borderRadius: 16, overflow: "hidden", marginBottom: 14 },
  ctaBtnDisabled: { opacity: 0.7 },
  ctaGradient: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 16,
  },
  ctaText: { color: "#fff", fontWeight: "800", fontSize: 17 },

  legalText: {
    color: colors.muted,
    fontSize: 11,
    textAlign: "center",
    lineHeight: 16,
    marginBottom: 12,
  },
  restoreBtn: { paddingVertical: 8 },
  restoreText: { color: colors.lavender, fontSize: 13, fontWeight: "600" },

  cancelLink: { marginTop: 20 },
  cancelLinkText: { color: colors.coral, fontSize: 14 },
});

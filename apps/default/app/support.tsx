import React, { useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useQuery } from "convex/react";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withSequence,
  withTiming,
  Easing,
} from "react-native-reanimated";
import * as Haptics from "expo-haptics";
import { api } from "@/convex/_generated/api";
import { colors, gradients } from "@/lib/revibe-theme";

/**
 * Tough-day / pain-flare support.
 *
 * A calm, no-pressure space for the hard moments in physical recovery:
 * a guided breathing exercise, a reminder of why they started, and one-tap
 * ways to reach a real person or their coach.
 */
export default function SupportScreen() {
  const router = useRouter();
  const profile = useQuery(api.profiles.getMine);

  // Breathing circle: 4s expand, 4s contract, forever.
  const scale = useSharedValue(0.55);
  useEffect(() => {
    scale.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 4000, easing: Easing.inOut(Easing.ease) }),
        withTiming(0.55, { duration: 4000, easing: Easing.inOut(Easing.ease) }),
      ),
      -1,
      false,
    );
  }, [scale]);

  const circleStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const goals = profile?.goals ?? [];

  return (
    <LinearGradient colors={gradients.calm} style={styles.root}>
      <SafeAreaView style={styles.safe} edges={["top", "bottom"]}>
        <ScrollView
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
        >
          {/* Close */}
          <TouchableOpacity style={styles.closeBtn} onPress={() => router.back()}>
            <Ionicons name="close" size={22} color={colors.muted} />
          </TouchableOpacity>

          <Text style={styles.title}>Take a breath</Text>
          <Text style={styles.subtitle}>
            Tough days are part of recovery — not a setback. Let&apos;s slow down together.
          </Text>

          {/* Breathing exercise */}
          <View style={styles.breathBox}>
            <View style={styles.breathRing}>
              <Animated.View style={[styles.breathCircle, circleStyle]}>
                <LinearGradient
                  colors={gradients.hero}
                  style={styles.breathFill}
                />
              </Animated.View>
            </View>
            <Text style={styles.breathHint}>
              Breathe in as the circle grows, out as it shrinks
            </Text>
          </View>

          {/* Why you started */}
          {goals.length > 0 && (
            <View style={styles.card}>
              <Text style={styles.cardTitle}>Remember why you started</Text>
              {goals.map((g) => (
                <View key={g} style={styles.goalRow}>
                  <Ionicons name="flag" size={15} color={colors.lavender} />
                  <Text style={styles.goalText}>{g}</Text>
                </View>
              ))}
              <Text style={styles.cardNote}>
                Every hard day you push through is progress toward this.
              </Text>
            </View>
          )}

          {/* Reach out */}
          <Text style={styles.sectionLabel}>You don&apos;t have to do this alone</Text>

          <ActionButton
            icon="sparkles"
            title="Talk to your Recovery Coach"
            subtitle="Get support any time, day or night"
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              router.replace("/coach");
            }}
            primary
          />
          <ActionButton
            icon="chatbubbles"
            title="Message a support buddy"
            subtitle="Reach someone who gets it"
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              router.replace("/messages");
            }}
          />
          <ActionButton
            icon="heart"
            title="I'm feeling steadier now"
            subtitle="Close and keep going"
            onPress={() => router.back()}
          />

          <Text style={styles.crisisNote}>
            If you&apos;re in crisis or thinking about harming yourself, please contact
            your local emergency services or a crisis line right away.
          </Text>
        </ScrollView>
      </SafeAreaView>
    </LinearGradient>
  );
}

function ActionButton({
  icon,
  title,
  subtitle,
  onPress,
  primary,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  subtitle: string;
  onPress: () => void;
  primary?: boolean;
}) {
  return (
    <TouchableOpacity
      style={[styles.action, primary && styles.actionPrimary]}
      onPress={onPress}
      activeOpacity={0.85}
    >
      <View style={[styles.actionIcon, primary && styles.actionIconPrimary]}>
        <Ionicons
          name={icon}
          size={20}
          color={primary ? "#fff" : colors.lavender}
        />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={[styles.actionTitle, primary && { color: "#fff" }]}>{title}</Text>
        <Text style={[styles.actionSub, primary && { color: "rgba(255,255,255,0.85)" }]}>
          {subtitle}
        </Text>
      </View>
      <Ionicons
        name="chevron-forward"
        size={18}
        color={primary ? "#fff" : colors.muted}
      />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  safe: { flex: 1 },
  content: { padding: 20, paddingBottom: 40 },
  closeBtn: { alignSelf: "flex-end", padding: 4 },
  title: { fontSize: 26, fontWeight: "800", color: colors.ink, marginTop: 4 },
  subtitle: { fontSize: 15, color: colors.muted, lineHeight: 22, marginTop: 6 },

  breathBox: { alignItems: "center", marginVertical: 28 },
  breathRing: {
    width: 200,
    height: 200,
    borderRadius: 100,
    borderWidth: 2,
    borderColor: colors.lavender + "33",
    alignItems: "center",
    justifyContent: "center",
  },
  breathCircle: {
    width: 180,
    height: 180,
    borderRadius: 90,
    overflow: "hidden",
  },
  breathFill: { flex: 1, borderRadius: 90 },
  breathHint: {
    color: colors.muted,
    fontSize: 13,
    marginTop: 18,
    textAlign: "center",
  },

  card: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 18,
    marginBottom: 20,
    gap: 8,
  },
  cardTitle: { fontWeight: "800", color: colors.ink, fontSize: 16, marginBottom: 4 },
  goalRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  goalText: { color: colors.ink, fontSize: 14, flex: 1 },
  cardNote: { color: colors.muted, fontSize: 13, lineHeight: 19, marginTop: 6 },

  sectionLabel: {
    fontWeight: "700",
    color: colors.ink,
    fontSize: 14,
    marginBottom: 10,
  },

  action: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    backgroundColor: "#fff",
    borderRadius: 14,
    padding: 14,
    marginBottom: 10,
  },
  actionPrimary: { backgroundColor: colors.lavender },
  actionIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.lavender + "18",
    alignItems: "center",
    justifyContent: "center",
  },
  actionIconPrimary: { backgroundColor: "rgba(255,255,255,0.25)" },
  actionTitle: { fontWeight: "700", color: colors.ink, fontSize: 15 },
  actionSub: { color: colors.muted, fontSize: 12, marginTop: 2 },

  crisisNote: {
    color: colors.muted,
    fontSize: 12,
    lineHeight: 18,
    textAlign: "center",
    marginTop: 16,
  },
});

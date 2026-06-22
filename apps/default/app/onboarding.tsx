import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { PrimaryButton, notify } from "@/components/revibe/ui";
import {
  colors,
  gradients,
  goalOptions,
  moodOptions,
  recoveryStages,
  supportGroups,
} from "@/lib/revibe-theme";

const STEPS = ["Welcome", "Injury", "Goals", "Done"] as const;

export default function OnboardingScreen() {
  const router = useRouter();
  const completeOnboarding = useMutation(api.profiles.completeOnboarding);

  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(false);

  // Form state
  const [displayName, setDisplayName] = useState("");
  const [injuryType, setInjuryType] = useState("");
  const [recoveryStage, setRecoveryStage] = useState<string>("early_rehab");
  const [emotionalState, setEmotionalState] = useState<string>("hopeful");
  const [selectedGoals, setSelectedGoals] = useState<string[]>([]);
  const [selectedGroups, setSelectedGroups] = useState<string[]>([]);

  const toggleItem = (
    item: string,
    list: string[],
    setList: (v: string[]) => void,
    max: number,
  ) => {
    if (list.includes(item)) {
      setList(list.filter((i) => i !== item));
    } else if (list.length < max) {
      setList([...list, item]);
    }
  };

  const handleNext = () => {
    if (step === 1 && !injuryType.trim()) {
      notify("Tell us about your injury", "Please describe your injury or condition.");
      return;
    }
    setStep((s) => s + 1);
  };

  const handleSubmit = async () => {
    setLoading(true);
    try {
      await completeOnboarding({
        displayName: displayName.trim() || undefined,
        injuryType: injuryType.trim(),
        recoveryStage: recoveryStage as any,
        emotionalState: emotionalState as any,
        goals: selectedGoals,
        supportGroups: selectedGroups,
      });
      router.replace("/(tabs)");
    } catch (err: any) {
      notify("Couldn't save", err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <LinearGradient colors={gradients.app} style={{ flex: 1 }}>
      <SafeAreaView style={{ flex: 1 }}>
        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior={Platform.OS === "ios" ? "padding" : undefined}
        >
          {/* Progress dots */}
          <View style={styles.progressRow}>
            {STEPS.map((_, i) => (
              <View
                key={i}
                style={[styles.progressDot, i <= step && styles.progressDotActive]}
              />
            ))}
          </View>

          <ScrollView
            contentContainerStyle={styles.scroll}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            {step === 0 && (
              <StepWelcome
                displayName={displayName}
                setDisplayName={setDisplayName}
                onNext={handleNext}
              />
            )}
            {step === 1 && (
              <StepInjury
                injuryType={injuryType}
                setInjuryType={setInjuryType}
                recoveryStage={recoveryStage}
                setRecoveryStage={setRecoveryStage}
                emotionalState={emotionalState}
                setEmotionalState={setEmotionalState}
                onNext={handleNext}
              />
            )}
            {step === 2 && (
              <StepGoals
                selectedGoals={selectedGoals}
                toggleGoal={(g) => toggleItem(g, selectedGoals, setSelectedGoals, 5)}
                selectedGroups={selectedGroups}
                toggleGroup={(g) => toggleItem(g, selectedGroups, setSelectedGroups, 5)}
                onSubmit={handleSubmit}
                loading={loading}
              />
            )}
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </LinearGradient>
  );
}

// ── Steps ──────────────────────────────────────────────────────────────────

function StepWelcome({
  displayName,
  setDisplayName,
  onNext,
}: {
  displayName: string;
  setDisplayName: (v: string) => void;
  onNext: () => void;
}) {
  return (
    <View style={styles.stepContainer}>
      <Text style={styles.stepEmoji}>👋</Text>
      <Text style={styles.stepTitle}>Welcome to Revibe</Text>
      <Text style={styles.stepSubtitle}>
        You're joining a community of people who get it. Recovery is hard — let's do it together.
      </Text>
      <Text style={styles.fieldLabel}>What should we call you? (optional)</Text>
      <TextInput
        style={styles.input}
        placeholder="Your name or nickname"
        placeholderTextColor={colors.muted}
        value={displayName}
        onChangeText={setDisplayName}
        maxLength={40}
      />
      <PrimaryButton title="Let's go →" onPress={onNext} />
    </View>
  );
}

function StepInjury({
  injuryType,
  setInjuryType,
  recoveryStage,
  setRecoveryStage,
  emotionalState,
  setEmotionalState,
  onNext,
}: any) {
  return (
    <View style={styles.stepContainer}>
      <Text style={styles.stepEmoji}>🩹</Text>
      <Text style={styles.stepTitle}>Your Recovery</Text>
      <Text style={styles.stepSubtitle}>Tell us a little about what you're recovering from.</Text>

      <Text style={styles.fieldLabel}>What's your injury or condition?</Text>
      <TextInput
        style={styles.input}
        placeholder="e.g. ACL tear, rotator cuff surgery…"
        placeholderTextColor={colors.muted}
        value={injuryType}
        onChangeText={setInjuryType}
        maxLength={80}
      />

      <Text style={styles.fieldLabel}>Where are you in your recovery?</Text>
      <View style={styles.chipGrid}>
        {recoveryStages.map((s) => (
          <TouchableOpacity
            key={s.value}
            style={[styles.optionChip, recoveryStage === s.value && styles.optionChipActive]}
            onPress={() => setRecoveryStage(s.value)}
          >
            <Text style={[styles.optionChipText, recoveryStage === s.value && styles.optionChipTextActive]}>
              {s.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <Text style={styles.fieldLabel}>How are you feeling today?</Text>
      <View style={styles.chipGrid}>
        {moodOptions.map((m) => (
          <TouchableOpacity
            key={m.value}
            style={[styles.optionChip, emotionalState === m.value && styles.optionChipActive]}
            onPress={() => setEmotionalState(m.value)}
          >
            <Text style={[styles.optionChipText, emotionalState === m.value && styles.optionChipTextActive]}>
              {m.emoji} {m.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <PrimaryButton title="Next →" onPress={onNext} />
    </View>
  );
}

function StepGoals({ selectedGoals, toggleGoal, selectedGroups, toggleGroup, onSubmit, loading }: any) {
  return (
    <View style={styles.stepContainer}>
      <Text style={styles.stepEmoji}>🎯</Text>
      <Text style={styles.stepTitle}>Your Goals</Text>
      <Text style={styles.stepSubtitle}>Select up to 5 goals and the communities you want to join.</Text>

      <Text style={styles.fieldLabel}>Recovery goals</Text>
      <View style={styles.chipGrid}>
        {goalOptions.map((g) => (
          <TouchableOpacity
            key={g}
            style={[styles.optionChip, selectedGoals.includes(g) && styles.optionChipActive]}
            onPress={() => toggleGoal(g)}
          >
            <Text style={[styles.optionChipText, selectedGoals.includes(g) && styles.optionChipTextActive]}>
              {g}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <Text style={styles.fieldLabel}>Communities (optional)</Text>
      <View style={styles.chipGrid}>
        {supportGroups.map((g) => (
          <TouchableOpacity
            key={g.value}
            style={[styles.optionChip, selectedGroups.includes(g.value) && styles.optionChipActive]}
            onPress={() => toggleGroup(g.value)}
          >
            <Text style={[styles.optionChipText, selectedGroups.includes(g.value) && styles.optionChipTextActive]}>
              {g.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <PrimaryButton title="Start my recovery →" onPress={onSubmit} loading={loading} />
    </View>
  );
}

// ── Styles ─────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  progressRow: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 8,
    paddingTop: 16,
    paddingBottom: 8,
  },
  progressDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.soft,
  },
  progressDotActive: { backgroundColor: colors.lavender },

  scroll: { flexGrow: 1, paddingHorizontal: 24, paddingBottom: 40 },

  stepContainer: { paddingTop: 24 },
  stepEmoji: { fontSize: 48, marginBottom: 12 },
  stepTitle: { fontSize: 26, fontWeight: "800", color: colors.ink, marginBottom: 8 },
  stepSubtitle: { color: colors.muted, fontSize: 15, lineHeight: 22, marginBottom: 24 },

  fieldLabel: { fontWeight: "700", color: colors.ink, fontSize: 14, marginBottom: 10, marginTop: 16 },
  input: {
    backgroundColor: "#fff",
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: colors.soft,
    paddingHorizontal: 16,
    paddingVertical: 13,
    fontSize: 15,
    color: colors.ink,
    marginBottom: 4,
  },

  chipGrid: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginBottom: 4 },
  optionChip: {
    borderWidth: 1.5,
    borderColor: colors.soft,
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 8,
    backgroundColor: "#fff",
  },
  optionChipActive: { borderColor: colors.lavender, backgroundColor: colors.lavender + "18" },
  optionChipText: { color: colors.muted, fontSize: 13, fontWeight: "600" },
  optionChipTextActive: { color: colors.lavender },
});

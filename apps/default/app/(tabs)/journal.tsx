import React, { useState, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  RefreshControl,
} from "react-native";
import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Screen, Card, PrimaryButton, notify } from "@/components/revibe/ui";
import { SubscriptionGate } from "@/components/revibe/subscription-gate";
import { colors, moodOptions } from "@/lib/revibe-theme";
import { Ionicons } from "@expo/vector-icons";

// ---------------------------------------------------------------------------
// Scale selector (1-10)
// ---------------------------------------------------------------------------
function ScaleSelector({
  label,
  value,
  onChange,
  color = colors.lavender,
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
  color?: string;
}) {
  return (
    <View style={styles.scaleContainer}>
      <Text style={styles.scaleLabel}>{label}</Text>
      <View style={styles.scaleRow}>
        {Array.from({ length: 10 }, (_, i) => i + 1).map((n) => (
          <TouchableOpacity
            key={n}
            style={[
              styles.scaleDot,
              value >= n && { backgroundColor: color },
              value === n && styles.scaleDotActive,
            ]}
            onPress={() => onChange(n)}
          />
        ))}
      </View>
      <Text style={[styles.scaleValue, { color }]}>{value}/10</Text>
    </View>
  );
}

// ---------------------------------------------------------------------------
// Journal entry row
// ---------------------------------------------------------------------------
function EntryRow({ entry }: { entry: any }) {
  const mood = moodOptions.find((m) => m.value === entry.mood);
  return (
    <View style={styles.entryRow}>
      <View style={styles.entryDateCol}>
        <Text style={styles.entryDate}>{formatDate(entry.entryDate)}</Text>
        {mood && <Text style={styles.entryMoodEmoji}>{mood.emoji}</Text>}
      </View>
      <View style={styles.entryBody}>
        <View style={styles.entryScales}>
          <Text style={styles.entryScaleText}>💪 {entry.energy}</Text>
          <Text style={styles.entryScaleText}>⚡ {entry.motivation}</Text>
          <Text style={styles.entryScaleText}>🩹 {entry.painLevel}</Text>
        </View>
        {entry.note ? <Text style={styles.entryNote} numberOfLines={2}>{entry.note}</Text> : null}
        {entry.milestone ? (
          <View style={styles.milestoneBadge}>
            <Ionicons name="trophy" size={11} color={colors.amber} />
            <Text style={styles.milestoneText}>{entry.milestone}</Text>
          </View>
        ) : null}
      </View>
    </View>
  );
}

// ---------------------------------------------------------------------------
// Stats card (Pro: 30-day trends; Free: 7-day summary)
// ---------------------------------------------------------------------------
function StatsCard({ stats }: { stats: any }) {
  if (!stats) return null;
  return (
    <Card style={styles.statsCard}>
      <Text style={styles.statsSectionTitle}>7-day averages</Text>
      <View style={styles.statsRow}>
        <StatItem label="Pain" value={stats.avgPain} color={colors.coral} />
        <StatItem label="Energy" value={stats.avgEnergy} color={colors.teal} />
        <StatItem label="Motivation" value={stats.avgMotivation} color={colors.lavender} />
      </View>

      <SubscriptionGate
        featureName="Advanced Analytics"
        featureDescription="View 30-day trends, mood charts, and recovery patterns."
      >
        {/* This content only renders for Pro users */}
        <View style={styles.advancedStatsPlaceholder}>
          <Text style={styles.advancedStatsText}>📈 30-day trends coming soon</Text>
        </View>
      </SubscriptionGate>
    </Card>
  );
}

function StatItem({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <View style={styles.statItem}>
      <Text style={[styles.statValue, { color }]}>{value.toFixed(1)}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

// ---------------------------------------------------------------------------
// Screen
// ---------------------------------------------------------------------------
export default function JournalScreen() {
  const entries = useQuery(api.journal.listMine);
  const stats = useQuery(api.journal.stats);
  const addEntry = useMutation(api.journal.addEntry);

  const [mood, setMood] = useState<string>("hopeful");
  const [pain, setPain] = useState(5);
  const [energy, setEnergy] = useState(5);
  const [motivation, setMotivation] = useState(5);
  const [note, setNote] = useState("");
  const [milestone, setMilestone] = useState("");
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const todayEntry = entries?.find((e) => e.entryDate === todayString());
  const canSubmit = !loading;

  const handleSubmit = async () => {
    setLoading(true);
    try {
      await addEntry({
        mood: mood as any,
        painLevel: pain,
        energy,
        motivation,
        note: note.trim(),
        milestone: milestone.trim() || undefined,
      });
      setNote("");
      setMilestone("");
    } catch (e: any) {
      notify("Couldn't save entry", e.message);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 600);
  }, []);

  return (
    <Screen>
      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.lavender} />
        }
      >
        <Text style={styles.screenTitle}>Daily Check-in</Text>
        <Text style={styles.screenSubtitle}>
          {todayEntry ? "You've already checked in today ✓" : "How are you feeling today?"}
        </Text>

        {/* Stats */}
        <StatsCard stats={stats} />

        {/* Check-in form */}
        <Card>
          {/* Mood chips */}
          <Text style={styles.formSectionLabel}>Mood</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.moodRow}>
            {moodOptions.map((m) => (
              <TouchableOpacity
                key={m.value}
                style={[styles.moodChip, mood === m.value && { borderColor: m.color, backgroundColor: m.color + "22" }]}
                onPress={() => setMood(m.value)}
              >
                <Text style={styles.moodChipText}>{m.emoji} {m.label}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          {/* Scales */}
          <ScaleSelector label="Pain level" value={pain} onChange={setPain} color={colors.coral} />
          <ScaleSelector label="Energy" value={energy} onChange={setEnergy} color={colors.teal} />
          <ScaleSelector label="Motivation" value={motivation} onChange={setMotivation} color={colors.lavender} />

          {/* Note */}
          <Text style={styles.formSectionLabel}>Note (optional)</Text>
          <TextInput
            style={styles.textArea}
            placeholder="What happened today? Any wins or struggles?"
            placeholderTextColor={colors.muted}
            value={note}
            onChangeText={setNote}
            multiline
            maxLength={500}
          />

          {/* Milestone */}
          <Text style={styles.formSectionLabel}>🏆 Milestone (optional)</Text>
          <TextInput
            style={styles.textInput}
            placeholder="e.g. First step without crutches!"
            placeholderTextColor={colors.muted}
            value={milestone}
            onChangeText={setMilestone}
            maxLength={100}
          />

          <PrimaryButton
            title={todayEntry ? "Update today's entry" : "Save check-in"}
            onPress={handleSubmit}
            loading={loading}
            disabled={!canSubmit}
          />
        </Card>

        {/* History */}
        <Text style={styles.historyTitle}>Recent entries</Text>
        {entries === undefined ? (
          <Card><Text style={styles.loadingText}>Loading…</Text></Card>
        ) : entries.length === 0 ? (
          <Card><Text style={styles.loadingText}>No entries yet. Start your first check-in!</Text></Card>
        ) : (
          <Card style={{ padding: 0, overflow: "hidden" }}>
            {entries.map((entry, i) => (
              <View key={entry._id} style={[i > 0 && styles.entryDivider]}>
                <EntryRow entry={entry} />
              </View>
            ))}
          </Card>
        )}
      </ScrollView>
    </Screen>
  );
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
function todayString(): string {
  return new Date().toISOString().split("T")[0];
}

function formatDate(dateStr: string): string {
  const d = new Date(dateStr + "T00:00:00");
  const today = todayString();
  const yesterday = new Date(Date.now() - 86400000).toISOString().split("T")[0];
  if (dateStr === today) return "Today";
  if (dateStr === yesterday) return "Yesterday";
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------
const styles = StyleSheet.create({
  screenTitle: { fontSize: 24, fontWeight: "800", color: colors.ink, paddingHorizontal: 16, marginTop: 8 },
  screenSubtitle: { color: colors.muted, fontSize: 13, paddingHorizontal: 16, marginBottom: 12, marginTop: 4 },

  statsCard: { marginBottom: 12 },
  statsSectionTitle: { fontWeight: "700", color: colors.ink, marginBottom: 12 },
  statsRow: { flexDirection: "row", justifyContent: "space-around", marginBottom: 12 },
  statItem: { alignItems: "center" },
  statValue: { fontSize: 24, fontWeight: "800" },
  statLabel: { color: colors.muted, fontSize: 12, marginTop: 2 },
  advancedStatsPlaceholder: {
    padding: 12,
    backgroundColor: colors.soft,
    borderRadius: 10,
    alignItems: "center",
  },
  advancedStatsText: { color: colors.muted, fontSize: 13 },

  formSectionLabel: { fontWeight: "700", color: colors.ink, fontSize: 13, marginBottom: 8, marginTop: 14 },
  moodRow: { marginBottom: 4 },
  moodChip: {
    borderWidth: 1.5,
    borderColor: colors.soft,
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginRight: 8,
  },
  moodChipText: { fontSize: 13, color: colors.ink },

  scaleContainer: { marginBottom: 8 },
  scaleLabel: { color: colors.muted, fontSize: 12, marginBottom: 6 },
  scaleRow: { flexDirection: "row", gap: 6 },
  scaleDot: {
    flex: 1,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.soft,
  },
  scaleDotActive: { transform: [{ scaleY: 1.5 }] },
  scaleValue: { fontSize: 12, fontWeight: "700", marginTop: 4 },

  textArea: {
    borderWidth: 1,
    borderColor: colors.soft,
    borderRadius: 10,
    padding: 10,
    color: colors.ink,
    fontSize: 14,
    minHeight: 72,
    textAlignVertical: "top",
    marginBottom: 4,
    backgroundColor: "#fff",
  },
  textInput: {
    borderWidth: 1,
    borderColor: colors.soft,
    borderRadius: 10,
    padding: 10,
    color: colors.ink,
    fontSize: 14,
    marginBottom: 4,
    backgroundColor: "#fff",
  },

  historyTitle: { fontWeight: "700", color: colors.ink, fontSize: 16, paddingHorizontal: 16, marginTop: 20, marginBottom: 8 },
  entryDivider: { borderTopWidth: 1, borderTopColor: colors.soft },
  entryRow: { flexDirection: "row", padding: 14, gap: 12 },
  entryDateCol: { alignItems: "center", width: 50 },
  entryDate: { fontSize: 11, fontWeight: "700", color: colors.muted, textAlign: "center" },
  entryMoodEmoji: { fontSize: 18, marginTop: 4 },
  entryBody: { flex: 1 },
  entryScales: { flexDirection: "row", gap: 10, marginBottom: 4 },
  entryScaleText: { fontSize: 12, color: colors.muted },
  entryNote: { fontSize: 13, color: colors.ink, lineHeight: 18 },
  milestoneBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: colors.amber + "22",
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 3,
    alignSelf: "flex-start",
    marginTop: 4,
  },
  milestoneText: { fontSize: 11, color: colors.amber, fontWeight: "600" },
  loadingText: { color: colors.muted, textAlign: "center", padding: 16 },
});

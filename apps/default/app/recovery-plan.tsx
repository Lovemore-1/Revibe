import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { useRouter } from "expo-router";
import { useMutation, useQuery } from "convex/react";
import { Ionicons } from "@expo/vector-icons";
import { api } from "@/convex/_generated/api";
import { Screen, Card, PrimaryButton, EmptyState, impactLight } from "@/components/revibe/ui";
import { type ThemeColors } from "@/lib/revibe-theme";
import { useTheme, useThemedStyles } from "@/lib/theme-context";

// ---------------------------------------------------------------------------
// Types (mirroring recoveryPlanValidator)
// ---------------------------------------------------------------------------
type PlanTask = { id: string; label: string; done: boolean };
type PlanPhase = { name: string; tasks: PlanTask[] };

function newTaskId(): string {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

function planProgress(phases: PlanPhase[]): { done: number; total: number; pct: number } {
  const all = phases.flatMap((p) => p.tasks);
  const done = all.filter((t) => t.done).length;
  const total = all.length;
  return { done, total, pct: total === 0 ? 0 : Math.round((done / total) * 100) };
}

// ---------------------------------------------------------------------------
// Screen
// ---------------------------------------------------------------------------
export default function RecoveryPlanScreen() {
  const router = useRouter();
  const plan = useQuery(api.recoveryPlans.getMine);
  const [editing, setEditing] = useState(false);
  const { colors } = useTheme();
  const styles = useThemedStyles(makeStyles);

  return (
    <Screen>
      {/* Header */}
      <View style={styles.navRow}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={20} color={colors.lavender} />
          <Text style={styles.backText}>Back</Text>
        </TouchableOpacity>
        {plan && !editing ? (
          <TouchableOpacity style={styles.editLink} onPress={() => setEditing(true)}>
            <Ionicons name="create-outline" size={16} color={colors.lavender} />
            <Text style={styles.editLinkText}>Edit</Text>
          </TouchableOpacity>
        ) : null}
      </View>

      {plan === undefined ? (
        <EmptyState title="Loading your plan…" />
      ) : editing || plan === null ? (
        <PlanEditor
          existing={plan ?? null}
          onDone={() => setEditing(false)}
          canCancel={plan !== null}
        />
      ) : (
        <PlanView plan={plan} />
      )}
    </Screen>
  );
}

// ---------------------------------------------------------------------------
// View mode
// ---------------------------------------------------------------------------
function PlanView({ plan }: { plan: any }) {
  const toggleTask = useMutation(api.recoveryPlans.toggleTask);
  const { colors } = useTheme();
  const styles = useThemedStyles(makeStyles);
  const { done, total, pct } = planProgress(plan.phases);

  const handleToggle = async (taskId: string) => {
    impactLight();
    try {
      await toggleTask({ taskId });
    } catch (e: any) {
      Alert.alert("Couldn't update task", e.message);
    }
  };

  return (
    <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 40 }}>
      <Text style={styles.planTitle}>{plan.title}</Text>
      {plan.source ? <Text style={styles.planSource}>From: {plan.source}</Text> : null}

      {/* Progress */}
      <Card style={styles.progressCard}>
        <View style={styles.progressHeader}>
          <Text style={styles.progressLabel}>Plan progress</Text>
          <Text style={styles.progressPct}>{pct}%</Text>
        </View>
        <View style={styles.progressBar}>
          <View style={[styles.progressFill, { width: `${pct}%` }]} />
        </View>
        <Text style={styles.progressCount}>
          {done} of {total} tasks complete
        </Text>
      </Card>

      {/* Phases */}
      {plan.phases.map((phase: PlanPhase, i: number) => (
        <Card key={`${phase.name}-${i}`}>
          <Text style={styles.phaseName}>{phase.name}</Text>
          {phase.tasks.length === 0 ? (
            <Text style={styles.phaseEmpty}>No tasks in this phase yet.</Text>
          ) : (
            phase.tasks.map((task) => (
              <TouchableOpacity
                key={task.id}
                style={styles.taskRow}
                onPress={() => handleToggle(task.id)}
                activeOpacity={0.7}
              >
                <Ionicons
                  name={task.done ? "checkbox" : "square-outline"}
                  size={22}
                  color={task.done ? colors.teal : colors.muted}
                />
                <Text style={[styles.taskLabel, task.done && styles.taskLabelDone]}>
                  {task.label}
                </Text>
              </TouchableOpacity>
            ))
          )}
        </Card>
      ))}

      {/* Notes */}
      {plan.notes ? (
        <Card>
          <Text style={styles.phaseName}>Notes from your care team</Text>
          <Text style={styles.notesText}>{plan.notes}</Text>
        </Card>
      ) : null}

      <Text style={styles.disclaimer}>
        This plan is what you entered from your physio or surgeon. It isn't medical advice from
        Revibe — always follow your care team's guidance and check with them before changing your
        plan.
      </Text>
    </ScrollView>
  );
}

// ---------------------------------------------------------------------------
// Edit mode
// ---------------------------------------------------------------------------
function PlanEditor({
  existing,
  onDone,
  canCancel,
}: {
  existing: any | null;
  onDone: () => void;
  canCancel: boolean;
}) {
  const savePlan = useMutation(api.recoveryPlans.savePlan);
  const deletePlan = useMutation(api.recoveryPlans.deletePlan);
  const { colors } = useTheme();
  const styles = useThemedStyles(makeStyles);

  const [title, setTitle] = useState<string>(existing?.title ?? "");
  const [source, setSource] = useState<string>(existing?.source ?? "");
  const [notes, setNotes] = useState<string>(existing?.notes ?? "");
  const [phases, setPhases] = useState<PlanPhase[]>(
    existing?.phases?.length
      ? existing.phases.map((p: PlanPhase) => ({ ...p, tasks: [...p.tasks] }))
      : [{ name: "", tasks: [{ id: newTaskId(), label: "", done: false }] }],
  );
  const [saving, setSaving] = useState(false);

  const updatePhase = (i: number, patch: Partial<PlanPhase>) => {
    setPhases((prev) => prev.map((p, idx) => (idx === i ? { ...p, ...patch } : p)));
  };

  const updateTask = (pi: number, ti: number, label: string) => {
    setPhases((prev) =>
      prev.map((p, idx) =>
        idx === pi
          ? { ...p, tasks: p.tasks.map((t, tIdx) => (tIdx === ti ? { ...t, label } : t)) }
          : p,
      ),
    );
  };

  const addTask = (pi: number) => {
    setPhases((prev) =>
      prev.map((p, idx) =>
        idx === pi
          ? { ...p, tasks: [...p.tasks, { id: newTaskId(), label: "", done: false }] }
          : p,
      ),
    );
  };

  const removeTask = (pi: number, ti: number) => {
    setPhases((prev) =>
      prev.map((p, idx) =>
        idx === pi ? { ...p, tasks: p.tasks.filter((_, tIdx) => tIdx !== ti) } : p,
      ),
    );
  };

  const addPhase = () => {
    setPhases((prev) => [
      ...prev,
      { name: "", tasks: [{ id: newTaskId(), label: "", done: false }] },
    ]);
  };

  const removePhase = (i: number) => {
    setPhases((prev) => prev.filter((_, idx) => idx !== i));
  };

  const handleSave = async () => {
    const cleaned = phases
      .map((p) => ({
        name: p.name.trim(),
        tasks: p.tasks.filter((t) => t.label.trim().length > 0),
      }))
      .filter((p) => p.name.length > 0 || p.tasks.length > 0);

    if (!title.trim()) {
      Alert.alert("Missing title", "Give your plan a short title, e.g. \"ACL rehab protocol\".");
      return;
    }
    if (cleaned.length === 0 || cleaned.some((p) => p.name.length === 0)) {
      Alert.alert("Phase needs a name", "Name each phase, e.g. \"Weeks 1–2: Reduce swelling\".");
      return;
    }

    setSaving(true);
    try {
      await savePlan({ title, source, notes, phases: cleaned });
      onDone();
    } catch (e: any) {
      Alert.alert("Couldn't save plan", e.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = () => {
    Alert.alert("Delete plan?", "This removes your recovery plan and its progress.", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          try {
            await deletePlan({});
            onDone();
          } catch (e: any) {
            Alert.alert("Couldn't delete", e.message);
          }
        },
      },
    ]);
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <ScrollView
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={{ paddingBottom: 60 }}
      >
        {!existing ? (
          <Card style={styles.introCard}>
            <Text style={styles.introTitle}>Add your recovery plan 📋</Text>
            <Text style={styles.introText}>
              Enter the plan your physio or surgeon gave you — phases, exercises, milestones —
              and Revibe will track your progress through it. Only enter what your care team
              prescribed; the app doesn't generate medical advice.
            </Text>
          </Card>
        ) : null}

        <Card>
          <Text style={styles.fieldLabel}>Plan title</Text>
          <TextInput
            style={styles.input}
            placeholder='e.g. "ACL rehab protocol"'
            placeholderTextColor={colors.muted}
            value={title}
            onChangeText={setTitle}
            maxLength={100}
          />
          <Text style={styles.fieldLabel}>Who prescribed it? (optional)</Text>
          <TextInput
            style={styles.input}
            placeholder='e.g. "Dr. Smith, City Physio"'
            placeholderTextColor={colors.muted}
            value={source}
            onChangeText={setSource}
            maxLength={100}
          />
        </Card>

        {phases.map((phase, pi) => (
          <Card key={pi}>
            <View style={styles.phaseHeaderRow}>
              <Text style={styles.fieldLabel}>Phase {pi + 1}</Text>
              {phases.length > 1 ? (
                <TouchableOpacity onPress={() => removePhase(pi)}>
                  <Ionicons name="trash-outline" size={18} color={colors.coral} />
                </TouchableOpacity>
              ) : null}
            </View>
            <TextInput
              style={styles.input}
              placeholder='e.g. "Weeks 1–2: Reduce swelling"'
              placeholderTextColor={colors.muted}
              value={phase.name}
              onChangeText={(name) => updatePhase(pi, { name })}
              maxLength={200}
            />
            {phase.tasks.map((task, ti) => (
              <View key={task.id} style={styles.taskEditRow}>
                <TextInput
                  style={[styles.input, styles.taskInput]}
                  placeholder='Task, e.g. "Ice 3× daily"'
                  placeholderTextColor={colors.muted}
                  value={task.label}
                  onChangeText={(label) => updateTask(pi, ti, label)}
                  maxLength={200}
                />
                <TouchableOpacity onPress={() => removeTask(pi, ti)} style={styles.taskRemoveBtn}>
                  <Ionicons name="close-circle" size={20} color={colors.muted} />
                </TouchableOpacity>
              </View>
            ))}
            <TouchableOpacity style={styles.addRow} onPress={() => addTask(pi)}>
              <Ionicons name="add-circle-outline" size={18} color={colors.lavender} />
              <Text style={styles.addRowText}>Add task</Text>
            </TouchableOpacity>
          </Card>
        ))}

        <TouchableOpacity style={styles.addPhaseBtn} onPress={addPhase}>
          <Ionicons name="add" size={18} color={colors.lavender} />
          <Text style={styles.addPhaseText}>Add phase</Text>
        </TouchableOpacity>

        <Card>
          <Text style={styles.fieldLabel}>Notes / precautions (optional)</Text>
          <TextInput
            style={[styles.input, styles.notesInput]}
            placeholder="Anything your care team said to watch out for…"
            placeholderTextColor={colors.muted}
            value={notes}
            onChangeText={setNotes}
            multiline
            maxLength={1000}
          />
        </Card>

        <View style={{ paddingHorizontal: 16 }}>
          <PrimaryButton
            title={existing ? "Save changes" : "Save my plan"}
            onPress={handleSave}
            loading={saving}
          />
          {canCancel ? (
            <TouchableOpacity style={styles.cancelBtn} onPress={onDone}>
              <Text style={styles.cancelText}>Cancel</Text>
            </TouchableOpacity>
          ) : null}
          {existing ? (
            <TouchableOpacity style={styles.deleteBtn} onPress={handleDelete}>
              <Text style={styles.deleteText}>Delete plan</Text>
            </TouchableOpacity>
          ) : null}
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------
const makeStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    navRow: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      paddingHorizontal: 12,
      paddingVertical: 8,
    },
    backBtn: { flexDirection: "row", alignItems: "center", gap: 2 },
    backText: { color: colors.lavender, fontWeight: "600", fontSize: 15 },
    editLink: { flexDirection: "row", alignItems: "center", gap: 4, padding: 4 },
    editLinkText: { color: colors.lavender, fontWeight: "700", fontSize: 14 },

    planTitle: {
      fontSize: 24,
      fontWeight: "800",
      color: colors.ink,
      paddingHorizontal: 16,
    },
    planSource: {
      color: colors.muted,
      fontSize: 13,
      paddingHorizontal: 16,
      marginTop: 2,
      marginBottom: 12,
    },

    progressCard: { marginTop: 8, marginBottom: 12 },
    progressHeader: { flexDirection: "row", justifyContent: "space-between", marginBottom: 8 },
    progressLabel: { fontWeight: "700", color: colors.ink, fontSize: 14 },
    progressPct: { fontWeight: "800", color: colors.lavender, fontSize: 14 },
    progressBar: {
      height: 8,
      backgroundColor: colors.soft,
      borderRadius: 4,
      overflow: "hidden",
    },
    progressFill: { height: "100%", backgroundColor: colors.teal, borderRadius: 4 },
    progressCount: { color: colors.muted, fontSize: 12, marginTop: 6 },

    phaseName: { fontWeight: "800", color: colors.ink, fontSize: 15, marginBottom: 10 },
    phaseEmpty: { color: colors.muted, fontSize: 13 },
    taskRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 10,
      paddingVertical: 7,
    },
    taskLabel: { flex: 1, color: colors.ink, fontSize: 14, lineHeight: 20 },
    taskLabelDone: { color: colors.muted, textDecorationLine: "line-through" },
    notesText: { color: colors.muted, fontSize: 14, lineHeight: 20 },

    disclaimer: {
      color: colors.muted,
      fontSize: 11,
      lineHeight: 16,
      textAlign: "center",
      paddingHorizontal: 24,
      marginTop: 8,
    },

    introCard: { marginTop: 4, marginBottom: 4 },
    introTitle: { fontWeight: "800", color: colors.ink, fontSize: 17, marginBottom: 6 },
    introText: { color: colors.muted, fontSize: 13, lineHeight: 19 },

    fieldLabel: { fontWeight: "700", color: colors.ink, fontSize: 13, marginBottom: 6, marginTop: 4 },
    input: {
      backgroundColor: colors.card,
      borderRadius: 10,
      borderWidth: 1,
      borderColor: colors.soft,
      paddingHorizontal: 12,
      paddingVertical: 10,
      fontSize: 14,
      color: colors.ink,
      marginBottom: 10,
    },
    notesInput: { minHeight: 80, textAlignVertical: "top" },

    phaseHeaderRow: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
    },
    taskEditRow: { flexDirection: "row", alignItems: "center", gap: 8 },
    taskInput: { flex: 1 },
    taskRemoveBtn: { marginBottom: 10 },
    addRow: { flexDirection: "row", alignItems: "center", gap: 6, paddingVertical: 4 },
    addRowText: { color: colors.lavender, fontWeight: "600", fontSize: 13 },
    addPhaseBtn: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: 6,
      marginHorizontal: 16,
      marginBottom: 8,
      paddingVertical: 12,
      borderRadius: 14,
      borderWidth: 1.5,
      borderStyle: "dashed",
      borderColor: colors.lavender + "66",
    },
    addPhaseText: { color: colors.lavender, fontWeight: "700", fontSize: 14 },

    cancelBtn: { alignItems: "center", marginTop: 14 },
    cancelText: { color: colors.muted, fontSize: 14, fontWeight: "600" },
    deleteBtn: { alignItems: "center", marginTop: 16 },
    deleteText: { color: colors.coral, fontSize: 13, fontWeight: "600" },
  });

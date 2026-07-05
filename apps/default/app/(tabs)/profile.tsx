import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  RefreshControl,
  Modal,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { useAuthActions } from "@convex-dev/auth/react";
import { useMutation, useQuery } from "convex/react";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { api } from "@/convex/_generated/api";
import { Screen, Card, StatPill } from "@/components/revibe/ui";
import { recoveryStages, type ThemeColors } from "@/lib/revibe-theme";
import { useTheme, useThemedStyles, type ThemePreference } from "@/lib/theme-context";
import { useSubscription } from "@/hooks/use-subscription";

const THEME_OPTIONS: { value: ThemePreference; label: string; icon: any }[] = [
  { value: "light", label: "Light", icon: "sunny-outline" },
  { value: "dark", label: "Dark", icon: "moon-outline" },
  { value: "system", label: "System", icon: "phone-portrait-outline" },
];

export default function ProfileScreen() {
  const { signOut } = useAuthActions();
  const router = useRouter();
  const { colors, preference, setPreference } = useTheme();
  const styles = useThemedStyles(makeStyles);
  const profile = useQuery(api.profiles.getMine);
  const journalStats = useQuery(api.journal.stats);
  const updateProfile = useMutation(api.profiles.updateProfile);
  const { isPro } = useSubscription();

  const [refreshing, setRefreshing] = useState(false);
  const [editModal, setEditModal] = useState(false);
  const [editName, setEditName] = useState("");
  const [editBio, setEditBio] = useState("");
  const [editProgress, setEditProgress] = useState("");
  const [saving, setSaving] = useState(false);

  const openEdit = () => {
    if (!profile) return;
    setEditName(profile.displayName);
    setEditBio(profile.bio);
    setEditProgress(String(profile.recoveryProgress));
    setEditModal(true);
  };

  const saveEdit = async () => {
    const progress = parseInt(editProgress, 10);
    if (isNaN(progress) || progress < 0 || progress > 100) {
      Alert.alert("Invalid progress", "Enter a number between 0 and 100.");
      return;
    }
    setSaving(true);
    try {
      await updateProfile({
        displayName: editName.trim() || (profile?.displayName ?? ""),
        bio: editBio.trim(),
        recoveryProgress: progress,
      });
      setEditModal(false);
    } catch (e: any) {
      Alert.alert("Couldn't save", e.message);
    } finally {
      setSaving(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 600);
  };

  if (!profile) {
    return (
      <Screen>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading profile…</Text>
        </View>
      </Screen>
    );
  }

  const stage = recoveryStages.find((s) => s.value === profile.recoveryStage);

  return (
    <Screen>
      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.lavender} />
        }
      >
        {/* Hero card */}
        <Card style={styles.heroCard}>
          <LinearGradient
            colors={[colors.lavender + "22", colors.pink + "11"]}
            style={styles.heroGradient}
          >
            {/* Avatar + edit button */}
            <View style={styles.avatarRow}>
              <View style={styles.avatar}>
                <Text style={styles.avatarText}>{profile.displayName[0]?.toUpperCase()}</Text>
              </View>
              <View style={styles.heroNameCol}>
                <View style={styles.nameRow}>
                  <Text style={styles.displayName}>{profile.displayName}</Text>
                  {isPro && (
                    <View style={styles.proBadge}>
                      <Ionicons name="ribbon" size={10} color={colors.onAccent} />
                      <Text style={styles.proBadgeText}>PRO</Text>
                    </View>
                  )}
                </View>
                {profile.bio ? (
                  <Text style={styles.bio}>{profile.bio}</Text>
                ) : (
                  <Text style={[styles.bio, { color: colors.muted + "88" }]}>
                    No bio yet — tap Edit to add one
                  </Text>
                )}
              </View>
              <TouchableOpacity style={styles.editBtn} onPress={openEdit}>
                <Ionicons name="create-outline" size={20} color={colors.lavender} />
              </TouchableOpacity>
            </View>

            {/* Progress bar */}
            <View style={styles.progressBarBg}>
              <View
                style={[styles.progressBarFill, { width: `${profile.recoveryProgress}%` }]}
              />
            </View>
            <Text style={styles.progressLabel}>{profile.recoveryProgress}% recovery progress</Text>
          </LinearGradient>
        </Card>

        {/* Stats */}
        <View style={styles.statsRow}>
          <StatPill label="Day streak" value={String(profile.recoveryStreak)} />
          <StatPill label="Milestones" value={String(profile.milestonesAchieved)} />
          {journalStats && <StatPill label="Avg energy" value={String(journalStats.avgEnergy)} />}
          {journalStats && <StatPill label="Avg mood" value={String(journalStats.avgPain)} />}
        </View>

        {/* Recovery info */}
        <Card>
          <InfoRow icon="bandage-outline" label="Injury" value={profile.injuryType} />
          <InfoRow icon="fitness-outline" label="Stage" value={stage?.label ?? profile.recoveryStage} />
        </Card>

        {/* Goals */}
        {profile.goals.length > 0 && (
          <Card>
            <Text style={styles.sectionTitle}>Goals</Text>
            <View style={styles.tagRow}>
              {profile.goals.map((g) => (
                <View key={g} style={styles.tag}>
                  <Text style={styles.tagText}>{g}</Text>
                </View>
              ))}
            </View>
          </Card>
        )}

        {/* Support groups */}
        {profile.supportGroups.length > 0 && (
          <Card>
            <Text style={styles.sectionTitle}>Support communities</Text>
            <View style={styles.tagRow}>
              {profile.supportGroups.map((g) => (
                <View key={g} style={[styles.tag, styles.tagPurple]}>
                  <Text style={[styles.tagText, { color: colors.lavender }]}>{g}</Text>
                </View>
              ))}
            </View>
          </Card>
        )}

        {/* Subscription */}
        <Card>
          <TouchableOpacity
            style={styles.subRow}
            onPress={() => router.push("/subscription")}
            activeOpacity={0.85}
          >
            <LinearGradient
              colors={isPro ? [colors.lavender, "#5B3FCC"] : [colors.soft, colors.soft]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.subIconBg}
            >
              <Ionicons name="ribbon" size={18} color={isPro ? colors.onAccent : colors.muted} />
            </LinearGradient>
            <View style={{ flex: 1 }}>
              <Text style={styles.subTitle}>{isPro ? "Revibe Pro" : "Upgrade to Pro"}</Text>
              <Text style={styles.subSubtitle}>
                {isPro ? "Manage your subscription" : "Unlock advanced analytics, unlimited DMs & more"}
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={16} color={colors.muted} />
          </TouchableOpacity>
        </Card>

        {/* Appearance */}
        <Card>
          <Text style={styles.sectionTitle}>Appearance</Text>
          <View style={styles.themeRow}>
            {THEME_OPTIONS.map((opt) => (
              <TouchableOpacity
                key={opt.value}
                style={[styles.themeOption, preference === opt.value && styles.themeOptionActive]}
                onPress={() => setPreference(opt.value)}
                activeOpacity={0.8}
              >
                <Ionicons
                  name={opt.icon}
                  size={16}
                  color={preference === opt.value ? colors.lavender : colors.muted}
                />
                <Text
                  style={[
                    styles.themeOptionText,
                    preference === opt.value && styles.themeOptionTextActive,
                  ]}
                >
                  {opt.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </Card>

        {/* Sign out */}
        <Card>
          <TouchableOpacity
            style={styles.signOutBtn}
            onPress={() => {
              Alert.alert("Sign out", "Are you sure you want to sign out?", [
                { text: "Cancel", style: "cancel" },
                { text: "Sign out", style: "destructive", onPress: () => signOut() },
              ]);
            }}
          >
            <Ionicons name="log-out-outline" size={18} color={colors.coral} />
            <Text style={styles.signOutText}>Sign out</Text>
          </TouchableOpacity>
        </Card>
      </ScrollView>

      {/* Edit Profile Modal */}
      <Modal visible={editModal} animationType="slide" presentationStyle="pageSheet">
        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior={Platform.OS === "ios" ? "padding" : undefined}
        >
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <TouchableOpacity onPress={() => setEditModal(false)}>
                <Text style={styles.modalCancel}>Cancel</Text>
              </TouchableOpacity>
              <Text style={styles.modalTitle}>Edit Profile</Text>
              <TouchableOpacity onPress={saveEdit} disabled={saving}>
                <Text style={[styles.modalSave, saving && { opacity: 0.5 }]}>
                  {saving ? "Saving…" : "Save"}
                </Text>
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalBody} keyboardShouldPersistTaps="handled">
              <Text style={styles.fieldLabel}>Display name</Text>
              <TextInput
                style={styles.fieldInput}
                value={editName}
                onChangeText={setEditName}
                placeholder="Your name"
                placeholderTextColor={colors.muted}
                maxLength={40}
              />

              <Text style={styles.fieldLabel}>Bio</Text>
              <TextInput
                style={[styles.fieldInput, styles.fieldInputMulti]}
                value={editBio}
                onChangeText={setEditBio}
                placeholder="Tell others about your recovery journey…"
                placeholderTextColor={colors.muted}
                multiline
                maxLength={160}
                textAlignVertical="top"
              />

              <Text style={styles.fieldLabel}>Recovery progress (0–100)</Text>
              <TextInput
                style={styles.fieldInput}
                value={editProgress}
                onChangeText={setEditProgress}
                placeholder="e.g. 55"
                placeholderTextColor={colors.muted}
                keyboardType="number-pad"
                maxLength={3}
              />
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </Screen>
  );
}

function InfoRow({ icon, label, value }: { icon: any; label: string; value: string }) {
  const { colors } = useTheme();
  const styles = useThemedStyles(makeStyles);
  return (
    <View style={styles.infoRow}>
      <Ionicons name={icon} size={16} color={colors.muted} />
      <Text style={styles.infoLabel}>{label}</Text>
      <Text style={styles.infoValue}>{value}</Text>
    </View>
  );
}

const makeStyles = (colors: ThemeColors) =>
  StyleSheet.create({
  loadingContainer: { flex: 1, alignItems: "center", justifyContent: "center" },
  loadingText: { color: colors.muted },

  heroCard: { padding: 0, overflow: "hidden" },
  heroGradient: { padding: 20 },
  avatarRow: { flexDirection: "row", alignItems: "flex-start", gap: 12, marginBottom: 14 },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.lavender + "33",
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: { color: colors.lavender, fontWeight: "800", fontSize: 22 },
  heroNameCol: { flex: 1 },
  nameRow: { flexDirection: "row", alignItems: "center", gap: 6 },
  displayName: { fontWeight: "800", color: colors.ink, fontSize: 18 },
  proBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
    backgroundColor: colors.lavender,
    borderRadius: 6,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  proBadgeText: { color: colors.onAccent, fontSize: 9, fontWeight: "800", letterSpacing: 0.5 },
  bio: { color: colors.muted, fontSize: 13, marginTop: 3 },
  editBtn: {
    padding: 6,
    backgroundColor: colors.lavender + "18",
    borderRadius: 10,
  },

  progressBarBg: {
    height: 8,
    backgroundColor: colors.card,
    borderRadius: 4,
    overflow: "hidden",
    marginBottom: 4,
  },
  progressBarFill: {
    height: "100%",
    backgroundColor: colors.lavender,
    borderRadius: 4,
  },
  progressLabel: { color: colors.muted, fontSize: 12 },

  statsRow: { flexDirection: "row", gap: 8, paddingHorizontal: 16, marginBottom: 8 },

  sectionTitle: { fontWeight: "700", color: colors.ink, fontSize: 14, marginBottom: 10 },
  tagRow: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  tag: {
    backgroundColor: colors.soft,
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  tagPurple: { backgroundColor: colors.lavender + "18" },
  tagText: { color: colors.ink, fontSize: 12, fontWeight: "600" },

  infoRow: { flexDirection: "row", alignItems: "center", gap: 8, paddingVertical: 6 },
  infoLabel: { color: colors.muted, fontSize: 14, flex: 1 },
  infoValue: { color: colors.ink, fontSize: 14, fontWeight: "600" },

  subRow: { flexDirection: "row", alignItems: "center", gap: 12 },
  subIconBg: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  subTitle: { fontWeight: "700", color: colors.ink, fontSize: 15 },
  subSubtitle: { color: colors.muted, fontSize: 12, marginTop: 2 },

  signOutBtn: { flexDirection: "row", alignItems: "center", gap: 8 },
  signOutText: { color: colors.coral, fontWeight: "600", fontSize: 15 },

  themeRow: { flexDirection: "row", gap: 8 },
  themeOption: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    borderWidth: 1.5,
    borderColor: colors.soft,
    borderRadius: 12,
    paddingVertical: 10,
  },
  themeOptionActive: {
    borderColor: colors.lavender,
    backgroundColor: colors.lavender + "18",
  },
  themeOptionText: { color: colors.muted, fontSize: 13, fontWeight: "600" },
  themeOptionTextActive: { color: colors.lavender },

  // Modal
  modalContainer: { flex: 1, backgroundColor: colors.soft },
  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 16,
    backgroundColor: colors.card,
    borderBottomWidth: 1,
    borderBottomColor: colors.soft,
  },
  modalTitle: { fontWeight: "700", color: colors.ink, fontSize: 16 },
  modalCancel: { color: colors.muted, fontSize: 15 },
  modalSave: { color: colors.lavender, fontWeight: "700", fontSize: 15 },
  modalBody: { flex: 1, padding: 20 },
  fieldLabel: {
    fontWeight: "700",
    color: colors.ink,
    fontSize: 13,
    marginBottom: 6,
    marginTop: 12,
  },
  fieldInput: {
    backgroundColor: colors.card,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.soft,
    padding: 12,
    fontSize: 15,
    color: colors.ink,
  },
  fieldInputMulti: { minHeight: 80, textAlignVertical: "top" },
});

// ─── Colors ──────────────────────────────────────────────────────────────────

export const colors = {
  /** Near-black text */
  ink: "#1A1A2E",
  /** Subdued grey for secondary text */
  muted: "#8A8FA8",
  /** Very light background / dividers */
  soft: "#F2F2F7",
  /** Primary brand purple */
  lavender: "#7C5CFF",
  /** Warm accent for likes / errors */
  coral: "#FF6B6B",
  /** Positive / energy metric */
  teal: "#4ECDC4",
  /** Soft accent */
  pink: "#FF9EB5",
  /** Info / links */
  blue: "#45B7D1",
  /** Milestones / achievements */
  amber: "#F7DC6F",
  /** Success */
  green: "#96CEB4",
};

// ─── Gradients ───────────────────────────────────────────────────────────────

export const gradients = {
  /** Full-screen app background */
  app: ["#F8F6FF", "#F2F0FF"] as [string, string],
  /** Hero card gradient */
  hero: ["#7C5CFF", "#5B3FCC"] as [string, string],
  /** Calm / journal gradient */
  calm: ["#E8F4FD", "#D6EAF8"] as [string, string],
  /** Warm sunset accent */
  sunset: ["#FF9EB5", "#FF6B6B"] as [string, string],
};

// ─── Mood options ─────────────────────────────────────────────────────────────

export const moodOptions = [
  { value: "hopeful", label: "Hopeful", emoji: "🌟", color: colors.amber },
  { value: "steady", label: "Steady", emoji: "😌", color: colors.teal },
  { value: "frustrated", label: "Frustrated", emoji: "😤", color: colors.coral },
  { value: "low", label: "Low", emoji: "😔", color: colors.muted },
  { value: "proud", label: "Proud", emoji: "🏆", color: colors.lavender },
] as const;

export type MoodValue = (typeof moodOptions)[number]["value"];

// ─── Post kinds ───────────────────────────────────────────────────────────────

export const postKinds = [
  { value: "update", label: "Update" },
  { value: "struggle", label: "Struggle" },
  { value: "win", label: "Win 🎉" },
  { value: "milestone", label: "Milestone 🏆" },
] as const;

export type PostKindValue = (typeof postKinds)[number]["value"];

// ─── Recovery stages ─────────────────────────────────────────────────────────

export const recoveryStages = [
  { value: "just_injured", label: "Just Injured" },
  { value: "post_surgery", label: "Post-Surgery" },
  { value: "early_rehab", label: "Early Rehab" },
  { value: "building_strength", label: "Building Strength" },
  { value: "returning", label: "Returning to Activity" },
] as const;

export type RecoveryStageValue = (typeof recoveryStages)[number]["value"];

// ─── Support groups ───────────────────────────────────────────────────────────

export const supportGroups = [
  { value: "acl", label: "ACL Recovery" },
  { value: "shoulder", label: "Shoulder Rehab" },
  { value: "back", label: "Back Pain" },
  { value: "surgery", label: "Post-Surgery" },
  { value: "mental", label: "Mental Wellness" },
  { value: "rehab", label: "Daily Rehab" },
] as const;

export type SupportGroupValue = (typeof supportGroups)[number]["value"];

// ─── Goal options ─────────────────────────────────────────────────────────────

export const goalOptions = [
  "Return to sport",
  "Pain-free daily life",
  "Regain full range of motion",
  "Build strength",
  "Run again",
  "Stay consistent with PT",
];

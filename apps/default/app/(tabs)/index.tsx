import React, { useState, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  RefreshControl,
  Alert,
} from "react-native";
import { useMutation, useQuery } from "convex/react";
import { useRouter } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import Animated, { FadeInDown } from "react-native-reanimated";
import { api } from "@/convex/_generated/api";
import { Screen, Card, Chip, PrimaryButton, EmptyState, impactLight } from "@/components/revibe/ui";
import { colors, gradients, moodOptions, postKinds } from "@/lib/revibe-theme";
import { Ionicons } from "@expo/vector-icons";
import type { Id } from "@/convex/_generated/dataModel";

// ---------------------------------------------------------------------------
// Types (mirroring feedPostValidator)
// ---------------------------------------------------------------------------
type Post = {
  _id: Id<"posts">;
  userId: Id<"users">;
  body: string;
  mood: string;
  kind: string;
  likeCount: number;
  commentCount: number;
  createdAt: number;
  authorName: string;
  authorInjury: string;
  authorProgress: number;
  authorIsPro: boolean;
  likedByMe: boolean;
  comments: Array<{ _id: Id<"postComments">; body: string; createdAt: number; authorName: string }>;
};

// ---------------------------------------------------------------------------
// Composer
// ---------------------------------------------------------------------------
function Composer({ onPost }: { onPost: () => void }) {
  const [body, setBody] = useState("");
  const [mood, setMood] = useState<string>("hopeful");
  const [kind, setKind] = useState<string>("update");
  const [loading, setLoading] = useState(false);
  const createPost = useMutation(api.posts.create);

  const handlePost = async () => {
    if (body.trim().length < 3) return;
    setLoading(true);
    try {
      await createPost({ body: body.trim(), mood: mood as any, kind: kind as any });
      setBody("");
      onPost();
      impactLight();
    } catch (e: any) {
      Alert.alert("Couldn't post", e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card style={styles.composerCard}>
      <Text style={styles.composerLabel}>How's your recovery today?</Text>
      <TextInput
        style={styles.composerInput}
        placeholder="Share an update, win, or struggle…"
        placeholderTextColor={colors.muted}
        value={body}
        onChangeText={setBody}
        multiline
        maxLength={500}
      />
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipRow}>
        {moodOptions.map((m) => (
          <Chip
            key={m.value}
            label={`${m.emoji} ${m.label}`}
            active={mood === m.value}
            onPress={() => setMood(m.value)}
            style={{ marginRight: 6 }}
          />
        ))}
      </ScrollView>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipRow}>
        {postKinds.map((k) => (
          <Chip
            key={k.value}
            label={k.label}
            active={kind === k.value}
            onPress={() => setKind(k.value)}
            style={{ marginRight: 6 }}
          />
        ))}
      </ScrollView>
      <PrimaryButton title="Post" onPress={handlePost} loading={loading} disabled={body.trim().length < 3} />
    </Card>
  );
}

// ---------------------------------------------------------------------------
// PostCard
// ---------------------------------------------------------------------------
function PostCard({ post }: { post: Post }) {
  const toggleLike = useMutation(api.posts.toggleLike);
  const addComment = useMutation(api.posts.addComment);
  const [commentText, setCommentText] = useState("");
  const [showComments, setShowComments] = useState(false);
  const [optimisticLiked, setOptimisticLiked] = useState<boolean | null>(null);
  const liked = optimisticLiked !== null ? optimisticLiked : post.likedByMe;

  const handleLike = async () => {
    setOptimisticLiked(!liked);
    impactLight();
    try {
      await toggleLike({ postId: post._id });
    } catch {
      setOptimisticLiked(null);
    }
  };

  const handleComment = async () => {
    if (commentText.trim().length < 2) return;
    try {
      await addComment({ postId: post._id, body: commentText.trim() });
      setCommentText("");
    } catch (e: any) {
      Alert.alert("Error", e.message);
    }
  };

  const moodOption = moodOptions.find((m) => m.value === post.mood);
  const kindOption = postKinds.find((k) => k.value === post.kind);
  const timeAgo = getTimeAgo(post.createdAt);

  return (
    <Card style={styles.postCard}>
      {/* Author row */}
      <View style={styles.postAuthorRow}>
        <View style={styles.postAvatar}>
          <Text style={styles.postAvatarText}>{post.authorName[0]?.toUpperCase()}</Text>
        </View>
        <View style={{ flex: 1 }}>
          <View style={styles.authorNameRow}>
            <Text style={styles.authorName}>{post.authorName}</Text>
            {post.authorIsPro && (
              <View style={styles.proBadge}>
                <Text style={styles.proBadgeText}>PRO</Text>
              </View>
            )}
          </View>
          <Text style={styles.authorMeta}>{post.authorInjury} · {timeAgo}</Text>
        </View>
        <View style={styles.kindBadge}>
          <Text style={styles.kindBadgeText}>{kindOption?.label ?? post.kind}</Text>
        </View>
      </View>

      {/* Body */}
      <Text style={styles.postBody}>{post.body}</Text>

      {/* Mood pill */}
      {moodOption && (
        <View style={[styles.moodPill, { backgroundColor: moodOption.color + "22" }]}>
          <Text style={styles.moodPillText}>{moodOption.emoji} {moodOption.label}</Text>
        </View>
      )}

      {/* Actions */}
      <View style={styles.postActions}>
        <TouchableOpacity style={styles.actionBtn} onPress={handleLike} activeOpacity={0.7}>
          <Ionicons
            name={liked ? "heart" : "heart-outline"}
            size={18}
            color={liked ? colors.coral : colors.muted}
          />
          <Text style={[styles.actionCount, liked && { color: colors.coral }]}>
            {post.likeCount + (optimisticLiked === true ? 1 : optimisticLiked === false ? -1 : 0)}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.actionBtn}
          onPress={() => setShowComments(!showComments)}
          activeOpacity={0.7}
        >
          <Ionicons name="chatbubble-outline" size={18} color={colors.muted} />
          <Text style={styles.actionCount}>{post.commentCount}</Text>
        </TouchableOpacity>
      </View>

      {/* Comments */}
      {showComments && (
        <View style={styles.commentsSection}>
          {post.comments.map((c) => (
            <View key={c._id} style={styles.commentRow}>
              <Text style={styles.commentAuthor}>{c.authorName}</Text>
              <Text style={styles.commentBody}>{c.body}</Text>
            </View>
          ))}
          <View style={styles.commentComposer}>
            <TextInput
              style={styles.commentInput}
              placeholder="Add a comment…"
              placeholderTextColor={colors.muted}
              value={commentText}
              onChangeText={setCommentText}
              onSubmitEditing={handleComment}
              returnKeyType="send"
            />
            <TouchableOpacity onPress={handleComment} disabled={commentText.trim().length < 2}>
              <Ionicons
                name="send"
                size={18}
                color={commentText.trim().length >= 2 ? colors.lavender : colors.muted}
              />
            </TouchableOpacity>
          </View>
        </View>
      )}
    </Card>
  );
}

// ---------------------------------------------------------------------------
// Screen
// ---------------------------------------------------------------------------
export default function HomeScreen() {
  const profile = useQuery(api.profiles.getMine);
  const posts = useQuery(api.posts.listFeed);
  const entries = useQuery(api.journal.listMine);
  const router = useRouter();
  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    // useQuery is reactive — just wait a tick for the re-render
    setTimeout(() => setRefreshing(false), 600);
  }, []);

  // ── Live rehab streak (consecutive days with a check-in) ──────────────────
  const entryDates = (entries ?? []).map((e) => e.entryDate);
  const streak = computeStreak(entryDates);
  const checkedInToday = entryDates.includes(todayStr());
  const nextMilestone = STREAK_MILESTONES.find((m) => m > streak) ?? null;
  const prevMilestone = [...STREAK_MILESTONES].reverse().find((m) => m <= streak) ?? 0;
  const milestonePct = nextMilestone
    ? Math.min(100, Math.round(((streak - prevMilestone) / (nextMilestone - prevMilestone)) * 100))
    : 100;

  return (
    <Screen>
      <ScrollView
        style={{ flex: 1 }}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={colors.lavender}
          />
        }
      >
        {/* Streak hero */}
        <Animated.View entering={FadeInDown.duration(300).springify()} style={styles.heroWrap}>
          <LinearGradient
            colors={gradients.hero}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.hero}
          >
            <View style={styles.heroTopRow}>
              <Text style={styles.heroGreeting}>
                Hey, {profile?.displayName?.split(" ")[0] ?? "there"} 👋
              </Text>
              <View style={styles.heroMilestonePill}>
                <Ionicons name="ribbon" size={13} color="#fff" />
                <Text style={styles.heroMilestoneText}>{profile?.milestonesAchieved ?? 0}</Text>
              </View>
            </View>

            <View style={styles.streakRow}>
              <Text style={styles.streakFlame}>🔥</Text>
              <View>
                <Text style={styles.streakNumber}>{streak}</Text>
                <Text style={styles.streakLabel}>
                  {streak === 0 ? "start your streak today" : "day rehab streak"}
                </Text>
              </View>
            </View>

            <View style={styles.heroProgressTrack}>
              <View style={[styles.heroProgressFill, { width: `${milestonePct}%` }]} />
            </View>
            <Text style={styles.heroProgressText}>
              {nextMilestone
                ? `${nextMilestone - streak} day${nextMilestone - streak === 1 ? "" : "s"} to your ${nextMilestone}-day milestone`
                : "You've reached every milestone — incredible 🎉"}
            </Text>

            {checkedInToday ? (
              <View style={styles.checkedInPill}>
                <Ionicons name="checkmark-circle" size={18} color="#fff" />
                <Text style={styles.checkedInText}>Checked in today — keep it going</Text>
              </View>
            ) : (
              <TouchableOpacity
                style={styles.checkInBtn}
                onPress={() => {
                  impactLight();
                  router.push("/journal");
                }}
                activeOpacity={0.85}
              >
                <Ionicons name="add-circle" size={18} color={colors.lavender} />
                <Text style={styles.checkInBtnText}>Check in today</Text>
              </TouchableOpacity>
            )}
          </LinearGradient>
        </Animated.View>

        {/* Recovery coach */}
        <TouchableOpacity
          style={styles.coachBtn}
          onPress={() => {
            impactLight();
            router.push("/coach");
          }}
          activeOpacity={0.9}
        >
          <View style={styles.coachIcon}>
            <Ionicons name="sparkles" size={18} color="#fff" />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.coachTitle}>Talk to your Recovery Coach</Text>
            <Text style={styles.coachSub}>AI support, any time you need it</Text>
          </View>
          <Ionicons name="chevron-forward" size={16} color={colors.lavender} />
        </TouchableOpacity>

        {/* Tough-day support */}
        <TouchableOpacity
          style={styles.toughDayBtn}
          onPress={() => {
            impactLight();
            router.push("/support");
          }}
          activeOpacity={0.85}
        >
          <Ionicons name="heart-circle" size={20} color={colors.coral} />
          <Text style={styles.toughDayText}>Having a tough day?</Text>
          <Ionicons name="chevron-forward" size={16} color={colors.muted} />
        </TouchableOpacity>

        <Composer onPost={() => {}} />

        {/* Feed */}
        {posts === undefined ? (
          <EmptyState title="Loading feed…" />
        ) : posts.length === 0 ? (
          <EmptyState
            title="No posts yet"
            subtitle="Be the first to share your recovery update!"
          />
        ) : (
          posts.map((post) => <PostCard key={post._id} post={post} />)
        )}
      </ScrollView>
    </Screen>
  );
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
function getTimeAgo(ts: number): string {
  const diff = Date.now() - ts;
  const m = Math.floor(diff / 60000);
  if (m < 1) return "just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

// ── Streak helpers ──────────────────────────────────────────────────────────
const STREAK_MILESTONES = [3, 7, 14, 30, 60, 90, 180, 365];

/** Today's date as YYYY-MM-DD (UTC, matching how journal entryDate is stored). */
function todayStr(): string {
  return new Date().toISOString().split("T")[0];
}

/**
 * Consecutive-day check-in streak from journal entry dates (YYYY-MM-DD).
 * Today not yet logged doesn't break the streak — it continues from yesterday
 * until a full day is missed.
 */
function computeStreak(dates: string[]): number {
  if (dates.length === 0) return 0;
  const set = new Set(dates);
  const fmt = (d: Date) => d.toISOString().split("T")[0];
  const cursor = new Date();
  if (!set.has(fmt(cursor))) {
    cursor.setUTCDate(cursor.getUTCDate() - 1);
    if (!set.has(fmt(cursor))) return 0;
  }
  let streak = 0;
  while (set.has(fmt(cursor))) {
    streak++;
    cursor.setUTCDate(cursor.getUTCDate() - 1);
  }
  return streak;
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------
const styles = StyleSheet.create({
  heroWrap: {
    marginHorizontal: 16,
    marginBottom: 12,
    borderRadius: 20,
    overflow: "hidden",
    shadowColor: colors.lavender,
    shadowOpacity: 0.25,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 4,
  },
  hero: { padding: 20 },
  heroTopRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  heroGreeting: { fontSize: 16, fontWeight: "800", color: "#fff" },
  heroMilestonePill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "rgba(255,255,255,0.2)",
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  heroMilestoneText: { color: "#fff", fontWeight: "800", fontSize: 13 },
  streakRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginTop: 16,
    marginBottom: 14,
  },
  streakFlame: { fontSize: 44 },
  streakNumber: { color: "#fff", fontSize: 44, fontWeight: "900", lineHeight: 48 },
  streakLabel: { color: "rgba(255,255,255,0.85)", fontSize: 13, marginTop: -2 },
  heroProgressTrack: {
    height: 6,
    backgroundColor: "rgba(255,255,255,0.25)",
    borderRadius: 3,
    overflow: "hidden",
  },
  heroProgressFill: { height: "100%", backgroundColor: "#fff", borderRadius: 3 },
  heroProgressText: { color: "rgba(255,255,255,0.9)", fontSize: 12, marginTop: 8 },
  checkInBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    backgroundColor: "#fff",
    borderRadius: 12,
    paddingVertical: 12,
    marginTop: 16,
  },
  checkInBtnText: { color: colors.lavender, fontWeight: "700", fontSize: 15 },
  checkedInPill: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    backgroundColor: "rgba(255,255,255,0.18)",
    borderRadius: 12,
    paddingVertical: 12,
    marginTop: 16,
  },
  checkedInText: { color: "#fff", fontWeight: "600", fontSize: 14 },

  coachBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    backgroundColor: colors.lavender + "12",
    borderRadius: 14,
    paddingVertical: 12,
    paddingHorizontal: 14,
    marginHorizontal: 16,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: colors.lavender + "33",
  },
  coachIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.lavender,
    alignItems: "center",
    justifyContent: "center",
  },
  coachTitle: { color: colors.ink, fontWeight: "700", fontSize: 14 },
  coachSub: { color: colors.muted, fontSize: 12, marginTop: 1 },

  toughDayBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "#fff",
    borderRadius: 14,
    paddingVertical: 12,
    paddingHorizontal: 14,
    marginHorizontal: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: colors.coral + "33",
  },
  toughDayText: { flex: 1, color: colors.ink, fontWeight: "700", fontSize: 14 },

  composerCard: { marginBottom: 12 },
  composerLabel: { fontWeight: "700", color: colors.ink, marginBottom: 8 },
  composerInput: {
    borderWidth: 1,
    borderColor: colors.soft,
    borderRadius: 10,
    padding: 10,
    color: colors.ink,
    fontSize: 14,
    minHeight: 72,
    textAlignVertical: "top",
    marginBottom: 8,
  },
  chipRow: { marginBottom: 8 },

  postCard: { marginBottom: 10 },
  postAuthorRow: { flexDirection: "row", alignItems: "flex-start", gap: 10, marginBottom: 10 },
  postAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.lavender + "33",
    alignItems: "center",
    justifyContent: "center",
  },
  postAvatarText: { color: colors.lavender, fontWeight: "700", fontSize: 16 },
  authorNameRow: { flexDirection: "row", alignItems: "center", gap: 6 },
  authorName: { fontWeight: "700", color: colors.ink, fontSize: 14 },
  proBadge: {
    backgroundColor: colors.lavender,
    borderRadius: 4,
    paddingHorizontal: 5,
    paddingVertical: 1,
  },
  proBadgeText: { color: "#fff", fontSize: 9, fontWeight: "800", letterSpacing: 0.5 },
  authorMeta: { color: colors.muted, fontSize: 12, marginTop: 2 },
  kindBadge: {
    backgroundColor: colors.soft,
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  kindBadgeText: { color: colors.muted, fontSize: 11, fontWeight: "600" },

  postBody: { color: colors.ink, fontSize: 15, lineHeight: 22, marginBottom: 10 },
  moodPill: {
    alignSelf: "flex-start",
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 4,
    marginBottom: 10,
  },
  moodPillText: { fontSize: 12, fontWeight: "600", color: colors.ink },

  postActions: { flexDirection: "row", gap: 16, paddingTop: 6, borderTopWidth: 1, borderTopColor: colors.soft },
  actionBtn: { flexDirection: "row", alignItems: "center", gap: 5 },
  actionCount: { color: colors.muted, fontSize: 13 },

  commentsSection: { marginTop: 10, paddingTop: 10, borderTopWidth: 1, borderTopColor: colors.soft },
  commentRow: { marginBottom: 6 },
  commentAuthor: { fontWeight: "700", color: colors.ink, fontSize: 12 },
  commentBody: { color: colors.muted, fontSize: 13, lineHeight: 18 },
  commentComposer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginTop: 8,
    borderTopWidth: 1,
    borderTopColor: colors.soft,
    paddingTop: 8,
  },
  commentInput: {
    flex: 1,
    color: colors.ink,
    fontSize: 13,
    paddingVertical: 4,
  },
});

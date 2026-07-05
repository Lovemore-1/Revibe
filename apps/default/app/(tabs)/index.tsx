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
import { api } from "@/convex/_generated/api";
import { Screen, Card, Chip, PrimaryButton, StatPill, EmptyState, impactLight } from "@/components/revibe/ui";
import { moodOptions, postKinds, type ThemeColors } from "@/lib/revibe-theme";
import { useTheme, useThemedStyles } from "@/lib/theme-context";
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
  const { colors } = useTheme();
  const styles = useThemedStyles(makeStyles);

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
  const { colors } = useTheme();
  const styles = useThemedStyles(makeStyles);

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
// Recovery plan card
// ---------------------------------------------------------------------------
function RecoveryPlanCard() {
  const plan = useQuery(api.recoveryPlans.getMine);
  const router = useRouter();
  const { colors } = useTheme();
  const styles = useThemedStyles(makeStyles);

  if (plan === undefined) return null;

  if (plan === null) {
    return (
      <Card style={styles.planCard}>
        <TouchableOpacity
          style={styles.planCtaRow}
          onPress={() => router.push("/recovery-plan")}
          activeOpacity={0.85}
        >
          <View style={styles.planIconBg}>
            <Ionicons name="clipboard-outline" size={18} color={colors.lavender} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.planCardTitle}>Add your recovery plan</Text>
            <Text style={styles.planCardSub}>
              Enter the plan from your physio or surgeon and track it here
            </Text>
          </View>
          <Ionicons name="chevron-forward" size={16} color={colors.muted} />
        </TouchableOpacity>
      </Card>
    );
  }

  const allTasks = plan.phases.flatMap((p) => p.tasks);
  const done = allTasks.filter((t) => t.done).length;
  const pct = allTasks.length === 0 ? 0 : Math.round((done / allTasks.length) * 100);
  const nextTasks = allTasks.filter((t) => !t.done).slice(0, 2);

  return (
    <Card style={styles.planCard}>
      <TouchableOpacity onPress={() => router.push("/recovery-plan")} activeOpacity={0.85}>
        <View style={styles.planCtaRow}>
          <View style={styles.planIconBg}>
            <Ionicons name="clipboard-outline" size={18} color={colors.lavender} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.planCardTitle}>{plan.title}</Text>
            <Text style={styles.planCardSub}>
              {done}/{allTasks.length} tasks · {pct}% complete
            </Text>
          </View>
          <Ionicons name="chevron-forward" size={16} color={colors.muted} />
        </View>
        <View style={styles.planProgressBar}>
          <View style={[styles.planProgressFill, { width: `${pct}%` }]} />
        </View>
        {nextTasks.map((t) => (
          <View key={t.id} style={styles.planNextRow}>
            <Ionicons name="ellipse-outline" size={12} color={colors.muted} />
            <Text style={styles.planNextText} numberOfLines={1}>
              {t.label}
            </Text>
          </View>
        ))}
      </TouchableOpacity>
    </Card>
  );
}

// ---------------------------------------------------------------------------
// Screen
// ---------------------------------------------------------------------------
export default function HomeScreen() {
  const profile = useQuery(api.profiles.getMine);
  const posts = useQuery(api.posts.listFeed);
  const [refreshing, setRefreshing] = useState(false);
  const { colors } = useTheme();
  const styles = useThemedStyles(makeStyles);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    // useQuery is reactive — just wait a tick for the re-render
    setTimeout(() => setRefreshing(false), 600);
  }, []);

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
        {/* Hero */}
        {profile && (
          <Card style={styles.heroCard}>
            <Text style={styles.heroGreeting}>
              Hey, {profile.displayName.split(" ")[0]} 👋
            </Text>
            <Text style={styles.heroTagline}>Recovery together.</Text>
            <View style={styles.heroStats}>
              <StatPill label="Day streak" value={String(profile.recoveryStreak)} />
              <StatPill label="Milestones" value={String(profile.milestonesAchieved)} />
              <StatPill label="Progress" value={`${profile.recoveryProgress}%`} />
            </View>
            {/* Progress bar */}
            <View style={styles.progressBar}>
              <View style={[styles.progressFill, { width: `${profile.recoveryProgress}%` }]} />
            </View>
          </Card>
        )}

        <RecoveryPlanCard />

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

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------
const makeStyles = (colors: ThemeColors) =>
  StyleSheet.create({
  heroCard: { marginBottom: 12 },
  heroGreeting: { fontSize: 20, fontWeight: "800", color: colors.ink },
  heroTagline: { color: colors.muted, fontSize: 13, marginTop: 2, marginBottom: 14 },
  heroStats: { flexDirection: "row", gap: 8, marginBottom: 12 },
  progressBar: {
    height: 6,
    backgroundColor: colors.soft,
    borderRadius: 3,
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    backgroundColor: colors.lavender,
    borderRadius: 3,
  },

  planCard: { marginBottom: 12 },
  planCtaRow: { flexDirection: "row", alignItems: "center", gap: 12 },
  planIconBg: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: colors.lavender + "18",
    alignItems: "center",
    justifyContent: "center",
  },
  planCardTitle: { fontWeight: "700", color: colors.ink, fontSize: 15 },
  planCardSub: { color: colors.muted, fontSize: 12, marginTop: 2 },
  planProgressBar: {
    height: 6,
    backgroundColor: colors.soft,
    borderRadius: 3,
    overflow: "hidden",
    marginTop: 10,
    marginBottom: 8,
  },
  planProgressFill: { height: "100%", backgroundColor: colors.teal, borderRadius: 3 },
  planNextRow: { flexDirection: "row", alignItems: "center", gap: 8, paddingVertical: 3 },
  planNextText: { flex: 1, color: colors.muted, fontSize: 13 },

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
  proBadgeText: { color: colors.onAccent, fontSize: 9, fontWeight: "800", letterSpacing: 0.5 },
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

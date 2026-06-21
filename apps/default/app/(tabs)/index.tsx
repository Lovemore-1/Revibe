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
import { api } from "@/convex/_generated/api";
import { Screen, Card, Chip, PrimaryButton, StatPill, EmptyState, impactLight } from "@/components/revibe/ui";
import { colors, moodOptions, postKinds } from "@/lib/revibe-theme";
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
  const [refreshing, setRefreshing] = useState(false);

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
const styles = StyleSheet.create({
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

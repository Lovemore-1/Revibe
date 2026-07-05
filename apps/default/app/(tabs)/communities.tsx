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
import { Screen, Card, Chip, PrimaryButton } from "@/components/revibe/ui";
import { moodOptions, type ThemeColors } from "@/lib/revibe-theme";
import { useTheme, useThemedStyles } from "@/lib/theme-context";
import { Ionicons } from "@expo/vector-icons";
import type { Id } from "@/convex/_generated/dataModel";

// ---------------------------------------------------------------------------
// Community card (horizontal carousel)
// ---------------------------------------------------------------------------
function CommunityCard({
  community,
  onToggle,
}: {
  community: any;
  onToggle: () => void;
}) {
  const styles = useThemedStyles(makeStyles);
  return (
    <TouchableOpacity
      style={[styles.communityCard, community.joined && styles.communityCardJoined]}
      onPress={onToggle}
      activeOpacity={0.85}
    >
      <Text style={styles.communityIcon}>{community.icon}</Text>
      <Text style={styles.communityName}>{community.name}</Text>
      <Text style={styles.communityLabel} numberOfLines={2}>{community.description}</Text>
      <View style={[styles.joinBtn, community.joined && { backgroundColor: community.accent + "33" }]}>
        <Text style={[styles.joinBtnText, community.joined && { color: community.accent }]}>
          {community.joined ? `✓ ${community.memberLabel}` : "Join"}
        </Text>
      </View>
    </TouchableOpacity>
  );
}

// ---------------------------------------------------------------------------
// Community post composer
// ---------------------------------------------------------------------------
function CommunityComposer({
  communitySlug,
  onPost,
}: {
  communitySlug: string;
  onPost: () => void;
}) {
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
      await createPost({ body: body.trim(), mood: mood as any, kind: kind as any, communitySlug });
      setBody("");
      onPost();
    } catch (e: any) {
      Alert.alert("Couldn't post", e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card style={styles.composerCard}>
      <TextInput
        style={styles.composerInput}
        placeholder="Share with this community…"
        placeholderTextColor={colors.muted}
        value={body}
        onChangeText={setBody}
        multiline
        maxLength={500}
      />
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 8 }}>
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
      <PrimaryButton
        title="Post to community"
        onPress={handlePost}
        loading={loading}
        disabled={body.trim().length < 3}
      />
    </Card>
  );
}

// ---------------------------------------------------------------------------
// Community post card
// ---------------------------------------------------------------------------
function CommunityPostCard({ post }: { post: any }) {
  const toggleLike = useMutation(api.posts.toggleLike);
  const { colors } = useTheme();
  const styles = useThemedStyles(makeStyles);
  const [optimisticLiked, setOptimisticLiked] = useState<boolean | null>(null);
  const liked = optimisticLiked !== null ? optimisticLiked : post.likedByMe;

  const handleLike = async () => {
    setOptimisticLiked(!liked);
    try {
      await toggleLike({ postId: post._id });
    } catch {
      setOptimisticLiked(null);
    }
  };

  const moodOption = moodOptions.find((m) => m.value === post.mood);

  return (
    <View style={styles.postCard}>
      <View style={styles.postAuthorRow}>
        <View style={styles.postAvatar}>
          <Text style={styles.postAvatarText}>{post.authorName[0]?.toUpperCase()}</Text>
        </View>
        <View>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
            <Text style={styles.authorName}>{post.authorName}</Text>
            {post.authorIsPro && (
              <View style={styles.proBadge}><Text style={styles.proBadgeText}>PRO</Text></View>
            )}
          </View>
          <Text style={styles.authorMeta}>{post.authorInjury}</Text>
        </View>
      </View>
      <Text style={styles.postBody}>{post.body}</Text>
      {moodOption && (
        <View style={[styles.moodPill, { backgroundColor: moodOption.color + "22" }]}>
          <Text style={styles.moodPillText}>{moodOption.emoji} {moodOption.label}</Text>
        </View>
      )}
      <TouchableOpacity style={styles.likeBtn} onPress={handleLike}>
        <Ionicons
          name={liked ? "heart" : "heart-outline"}
          size={16}
          color={liked ? colors.coral : colors.muted}
        />
        <Text style={[styles.likeCount, liked && { color: colors.coral }]}>
          {post.likeCount}
        </Text>
      </TouchableOpacity>
    </View>
  );
}

// ---------------------------------------------------------------------------
// Screen
// ---------------------------------------------------------------------------
export default function CommunitiesScreen() {
  const communities = useQuery(api.communities.list);
  const toggleMembership = useMutation(api.communities.toggleMembership);
  const { colors } = useTheme();
  const styles = useThemedStyles(makeStyles);

  const [activeCommunity, setActiveCommunity] = useState<string | null>(null);
  const activePosts = useQuery(
    api.posts.listByCommunity,
    activeCommunity ? { communitySlug: activeCommunity } : "skip",
  );
  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 600);
  }, []);

  const activeCommunityData = communities?.find((c) => c.slug === activeCommunity);

  return (
    <Screen>
      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.lavender} />
        }
      >
        <Text style={styles.screenTitle}>Communities</Text>
        <Text style={styles.screenSubtitle}>Find your people</Text>

        {/* Community carousel */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.carousel}>
          {communities?.map((c) => (
            <View key={c.slug} style={{ marginRight: 12 }}>
              <CommunityCard
                community={c}
                onToggle={() => toggleMembership({ communitySlug: c.slug })}
              />
              <TouchableOpacity
                style={[
                  styles.viewBtn,
                  activeCommunity === c.slug && styles.viewBtnActive,
                ]}
                onPress={() => setActiveCommunity(activeCommunity === c.slug ? null : c.slug)}
              >
                <Text style={[
                  styles.viewBtnText,
                  activeCommunity === c.slug && styles.viewBtnTextActive,
                ]}>
                  {activeCommunity === c.slug ? "Close" : "View feed"}
                </Text>
              </TouchableOpacity>
            </View>
          ))}
        </ScrollView>

        {/* Selected community feed */}
        {activeCommunity && activeCommunityData && (
          <>
            <Text style={styles.feedTitle}>{activeCommunityData.name} feed</Text>

            {activeCommunityData.joined && (
              <CommunityComposer communitySlug={activeCommunity} onPost={() => {}} />
            )}

            {activePosts === undefined ? (
              <Card><Text style={styles.loadingText}>Loading…</Text></Card>
            ) : activePosts.length === 0 ? (
              <Card>
                <Text style={styles.emptyText}>No posts yet.</Text>
                {activeCommunityData.joined ? (
                  <Text style={styles.emptySubtext}>Be the first to post in this community!</Text>
                ) : (
                  <Text style={styles.emptySubtext}>Join this community to see and make posts.</Text>
                )}
              </Card>
            ) : (
              <Card style={{ padding: 0, overflow: "hidden" }}>
                {activePosts.map((post, i) => (
                  <View key={post._id} style={[i > 0 && styles.postDivider]}>
                    <CommunityPostCard post={post} />
                  </View>
                ))}
              </Card>
            )}
          </>
        )}
      </ScrollView>
    </Screen>
  );
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------
const makeStyles = (colors: ThemeColors) =>
  StyleSheet.create({
  screenTitle: { fontSize: 24, fontWeight: "800", color: colors.ink, paddingHorizontal: 16, marginTop: 8 },
  screenSubtitle: { color: colors.muted, fontSize: 13, paddingHorizontal: 16, marginBottom: 12, marginTop: 4 },

  carousel: { paddingHorizontal: 16, marginBottom: 8 },
  communityCard: {
    width: 150,
    backgroundColor: colors.card,
    borderRadius: 16,
    padding: 14,
    borderWidth: 1.5,
    borderColor: colors.soft,
  },
  communityCardJoined: { borderColor: colors.lavender },
  communityIcon: { fontSize: 28, marginBottom: 6 },
  communityName: { fontWeight: "800", color: colors.ink, fontSize: 14, marginBottom: 4 },
  communityLabel: { color: colors.muted, fontSize: 11, lineHeight: 15, marginBottom: 10 },
  joinBtn: {
    backgroundColor: colors.lavender + "18",
    borderRadius: 8,
    padding: 6,
    alignItems: "center",
  },
  joinBtnText: { color: colors.lavender, fontWeight: "700", fontSize: 12 },
  viewBtn: {
    marginTop: 6,
    borderRadius: 8,
    padding: 6,
    alignItems: "center",
    backgroundColor: colors.soft,
  },
  viewBtnActive: { backgroundColor: colors.lavender },
  viewBtnText: { color: colors.muted, fontSize: 11, fontWeight: "600" },
  viewBtnTextActive: { color: colors.onAccent },

  feedTitle: { fontWeight: "800", color: colors.ink, fontSize: 18, paddingHorizontal: 16, marginTop: 20, marginBottom: 8 },
  composerCard: { marginBottom: 10 },
  composerInput: {
    borderWidth: 1,
    borderColor: colors.soft,
    borderRadius: 10,
    padding: 10,
    color: colors.ink,
    fontSize: 14,
    minHeight: 60,
    textAlignVertical: "top",
    marginBottom: 8,
  },

  postDivider: { borderTopWidth: 1, borderTopColor: colors.soft },
  postCard: { padding: 14 },
  postAuthorRow: { flexDirection: "row", alignItems: "center", gap: 10, marginBottom: 8 },
  postAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.lavender + "22",
    alignItems: "center",
    justifyContent: "center",
  },
  postAvatarText: { color: colors.lavender, fontWeight: "700", fontSize: 14 },
  authorName: { fontWeight: "700", color: colors.ink, fontSize: 14 },
  proBadge: { backgroundColor: colors.lavender, borderRadius: 4, paddingHorizontal: 5, paddingVertical: 1 },
  proBadgeText: { color: colors.onAccent, fontSize: 9, fontWeight: "800" },
  authorMeta: { color: colors.muted, fontSize: 12 },
  postBody: { color: colors.ink, fontSize: 14, lineHeight: 20, marginBottom: 8 },
  moodPill: {
    alignSelf: "flex-start",
    borderRadius: 20,
    paddingHorizontal: 8,
    paddingVertical: 3,
    marginBottom: 8,
  },
  moodPillText: { fontSize: 11, fontWeight: "600", color: colors.ink },
  likeBtn: { flexDirection: "row", alignItems: "center", gap: 5 },
  likeCount: { color: colors.muted, fontSize: 13 },

  loadingText: { color: colors.muted, textAlign: "center", padding: 16, fontSize: 14 },
  emptyText: { color: colors.ink, fontWeight: "600", textAlign: "center" },
  emptySubtext: { color: colors.muted, fontSize: 13, textAlign: "center", marginTop: 4 },
});

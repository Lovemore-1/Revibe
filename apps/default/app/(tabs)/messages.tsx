import React, { useState, useCallback, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  FlatList,
  TouchableOpacity,
  TextInput,
  RefreshControl,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { useMutation, useQuery } from "convex/react";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { api } from "@/convex/_generated/api";
import { Screen, Card } from "@/components/revibe/ui";
import { type ThemeColors } from "@/lib/revibe-theme";
import { useTheme, useThemedStyles } from "@/lib/theme-context";
import { useSubscription } from "@/hooks/use-subscription";
import type { Id } from "@/convex/_generated/dataModel";

const FREE_CONVERSATION_LIMIT = 3;

// ---------------------------------------------------------------------------
// Buddy card
// ---------------------------------------------------------------------------
function BuddyCard({ profile, onMessage }: { profile: any; onMessage: () => void }) {
  const styles = useThemedStyles(makeStyles);
  return (
    <TouchableOpacity style={styles.buddyCard} onPress={onMessage} activeOpacity={0.85}>
      <View style={styles.buddyAvatar}>
        <Text style={styles.buddyAvatarText}>{profile.displayName[0]?.toUpperCase()}</Text>
      </View>
      <View style={{ flex: 1 }}>
        <Text style={styles.buddyName}>{profile.displayName}</Text>
        <Text style={styles.buddyMeta} numberOfLines={1}>{profile.injuryType}</Text>
      </View>
      <View style={styles.progressPill}>
        <Text style={styles.progressPillText}>{profile.recoveryProgress}%</Text>
      </View>
    </TouchableOpacity>
  );
}

// ---------------------------------------------------------------------------
// Conversation row
// ---------------------------------------------------------------------------
function ConversationRow({ conv, onPress }: { conv: any; onPress: () => void }) {
  const timeAgo = getTimeAgo(conv.lastMessageAt);
  const styles = useThemedStyles(makeStyles);
  return (
    <TouchableOpacity style={styles.convRow} onPress={onPress} activeOpacity={0.85}>
      <View style={styles.convAvatar}>
        <Text style={styles.convAvatarText}>{conv.otherName[0]?.toUpperCase()}</Text>
      </View>
      <View style={{ flex: 1 }}>
        <Text style={styles.convName}>{conv.otherName}</Text>
        <Text style={styles.convPreview} numberOfLines={1}>
          {conv.lastMessagePreview || "No messages yet"}
        </Text>
      </View>
      <Text style={styles.convTime}>{timeAgo}</Text>
    </TouchableOpacity>
  );
}

// ---------------------------------------------------------------------------
// Conversation thread view
// ---------------------------------------------------------------------------
function ConversationThread({
  conversationId,
  onBack,
}: {
  conversationId: Id<"conversations">;
  onBack: () => void;
}) {
  const messages = useQuery(api.messages.getMessages, { conversationId });
  const sendMessage = useMutation(api.messages.sendMessage);
  const [body, setBody] = useState("");
  const scrollRef = useRef<ScrollView>(null);
  const { colors } = useTheme();
  const styles = useThemedStyles(makeStyles);

  const handleSend = async () => {
    const text = body.trim();
    if (!text) return;
    setBody("");
    try {
      await sendMessage({ conversationId, body: text });
      scrollRef.current?.scrollToEnd({ animated: true });
    } catch {}
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      keyboardVerticalOffset={88}
    >
      {/* Header */}
      <TouchableOpacity style={styles.threadHeader} onPress={onBack}>
        <Ionicons name="chevron-back" size={20} color={colors.lavender} />
        <Text style={styles.threadBackText}>Back</Text>
      </TouchableOpacity>

      {/* Messages */}
      <ScrollView
        ref={scrollRef}
        style={styles.messageList}
        contentContainerStyle={styles.messageListContent}
        onContentSizeChange={() => scrollRef.current?.scrollToEnd({ animated: false })}
      >
        {messages === undefined ? (
          <Text style={styles.loadingText}>Loading…</Text>
        ) : messages.length === 0 ? (
          <Text style={styles.loadingText}>No messages yet — say hello!</Text>
        ) : (
          messages.map((m) => (
            <View
              key={m._id}
              style={[styles.bubble, m.isMine ? styles.bubbleMine : styles.bubbleTheirs]}
            >
              <Text style={[styles.bubbleText, m.isMine && styles.bubbleTextMine]}>
                {m.body}
              </Text>
            </View>
          ))
        )}
      </ScrollView>

      {/* Composer */}
      <View style={styles.threadComposer}>
        <TextInput
          style={styles.threadInput}
          placeholder="Message…"
          placeholderTextColor={colors.muted}
          value={body}
          onChangeText={setBody}
          onSubmitEditing={handleSend}
          returnKeyType="send"
          multiline
        />
        <TouchableOpacity
          style={[styles.sendBtn, !body.trim() && styles.sendBtnDisabled]}
          onPress={handleSend}
          disabled={!body.trim()}
        >
          <Ionicons name="send" size={18} color={colors.onAccent} />
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

// ---------------------------------------------------------------------------
// Screen
// ---------------------------------------------------------------------------
export default function MessagesScreen() {
  const conversations = useQuery(api.messages.listConversations);
  const buddies = useQuery(api.profiles.listSupportBuddies);
  const getOrCreate = useMutation(api.messages.getOrCreateConversation);
  const { isPro } = useSubscription();
  const { colors } = useTheme();
  const styles = useThemedStyles(makeStyles);

  const [activeConvId, setActiveConvId] = useState<Id<"conversations"> | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 600);
  }, []);

  const openConversation = async (otherUserId: Id<"users">) => {
    // Free users: limit to FREE_CONVERSATION_LIMIT active conversations
    if (!isPro && conversations && conversations.length >= FREE_CONVERSATION_LIMIT) {
      const alreadyInConv = conversations.some((c) => c.otherUserId === otherUserId);
      if (!alreadyInConv) {
        // Show upgrade prompt — navigate to subscription screen
        return;
      }
    }
    try {
      const convId = await getOrCreate({ otherUserId });
      setActiveConvId(convId);
    } catch {}
  };

  // If a thread is open, show it
  if (activeConvId) {
    return (
      <Screen>
        <ConversationThread
          conversationId={activeConvId}
          onBack={() => setActiveConvId(null)}
        />
      </Screen>
    );
  }

  return (
    <Screen>
      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.lavender} />
        }
      >
        <Text style={styles.screenTitle}>Messages</Text>

        {/* Conversation limit notice for free users */}
        {!isPro && conversations !== undefined && conversations.length >= FREE_CONVERSATION_LIMIT && (
          <View style={styles.limitBanner}>
            <Ionicons name="lock-closed" size={14} color={colors.lavender} />
            <Text style={styles.limitBannerText}>
              Free plan: {FREE_CONVERSATION_LIMIT} active conversations.{" "}
              <Text style={styles.limitBannerLink}>Upgrade to Pro</Text> for unlimited DMs.
            </Text>
          </View>
        )}

        {/* Conversations */}
        <Text style={styles.sectionLabel}>Recent conversations</Text>
        {conversations === undefined ? (
          <Card><Text style={styles.loadingText}>Loading…</Text></Card>
        ) : conversations.length === 0 ? (
          <Card>
            <Text style={styles.emptyText}>No conversations yet.</Text>
            <Text style={styles.emptySubtext}>Message a recovery buddy below to get started!</Text>
          </Card>
        ) : (
          <Card style={{ padding: 0, overflow: "hidden" }}>
            {conversations.map((conv, i) => (
              <View key={conv._id} style={[i > 0 && styles.convDivider]}>
                <ConversationRow
                  conv={conv}
                  onPress={() => setActiveConvId(conv._id)}
                />
              </View>
            ))}
          </Card>
        )}

        {/* Recovery buddies */}
        <Text style={[styles.sectionLabel, { marginTop: 20 }]}>Recovery buddies</Text>
        {buddies === undefined ? (
          <Card><Text style={styles.loadingText}>Finding buddies…</Text></Card>
        ) : buddies.length === 0 ? (
          <Card><Text style={styles.loadingText}>No buddies found yet.</Text></Card>
        ) : (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.buddyRow}>
            {buddies.map((b) => (
              <BuddyCard
                key={b._id}
                profile={b}
                onMessage={() => openConversation(b.userId)}
              />
            ))}
          </ScrollView>
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
  if (m < 1) return "now";
  if (m < 60) return `${m}m`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h`;
  return `${Math.floor(h / 24)}d`;
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------
const makeStyles = (colors: ThemeColors) =>
  StyleSheet.create({
  screenTitle: { fontSize: 24, fontWeight: "800", color: colors.ink, paddingHorizontal: 16, marginTop: 8, marginBottom: 12 },

  limitBanner: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 8,
    backgroundColor: colors.lavender + "18",
    marginHorizontal: 16,
    borderRadius: 10,
    padding: 12,
    marginBottom: 12,
  },
  limitBannerText: { flex: 1, color: colors.ink, fontSize: 13, lineHeight: 18 },
  limitBannerLink: { color: colors.lavender, fontWeight: "700" },

  sectionLabel: {
    fontWeight: "700",
    fontSize: 13,
    color: colors.muted,
    textTransform: "uppercase",
    letterSpacing: 0.5,
    paddingHorizontal: 16,
    marginBottom: 8,
  },

  convDivider: { borderTopWidth: 1, borderTopColor: colors.soft },
  convRow: { flexDirection: "row", alignItems: "center", padding: 14, gap: 12 },
  convAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.lavender + "22",
    alignItems: "center",
    justifyContent: "center",
  },
  convAvatarText: { color: colors.lavender, fontWeight: "700", fontSize: 18 },
  convName: { fontWeight: "700", color: colors.ink, fontSize: 15 },
  convPreview: { color: colors.muted, fontSize: 13, marginTop: 2 },
  convTime: { color: colors.muted, fontSize: 11 },

  buddyRow: { paddingHorizontal: 16, marginBottom: 8 },
  buddyCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    backgroundColor: colors.card,
    borderRadius: 14,
    padding: 12,
    marginRight: 10,
    width: 200,
    shadowColor: "#000",
    shadowOpacity: 0.04,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 1 },
    elevation: 1,
  },
  buddyAvatar: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: colors.teal + "33",
    alignItems: "center",
    justifyContent: "center",
  },
  buddyAvatarText: { color: colors.teal, fontWeight: "700", fontSize: 16 },
  buddyName: { fontWeight: "700", color: colors.ink, fontSize: 14 },
  buddyMeta: { color: colors.muted, fontSize: 12, marginTop: 2 },
  progressPill: {
    backgroundColor: colors.lavender + "22",
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  progressPillText: { color: colors.lavender, fontSize: 11, fontWeight: "700" },

  threadHeader: { flexDirection: "row", alignItems: "center", padding: 14, gap: 4 },
  threadBackText: { color: colors.lavender, fontWeight: "600", fontSize: 15 },
  messageList: { flex: 1 },
  messageListContent: { padding: 16, gap: 8 },
  bubble: {
    maxWidth: "75%",
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 10,
    alignSelf: "flex-start",
    backgroundColor: colors.soft,
  },
  bubbleMine: { alignSelf: "flex-end", backgroundColor: colors.lavender },
  bubbleText: { fontSize: 15, color: colors.ink },
  bubbleTextMine: { color: colors.onAccent },
  threadComposer: {
    flexDirection: "row",
    alignItems: "flex-end",
    gap: 8,
    padding: 12,
    borderTopWidth: 1,
    borderTopColor: colors.soft,
    backgroundColor: colors.card,
  },
  threadInput: {
    flex: 1,
    backgroundColor: colors.soft,
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 8,
    fontSize: 15,
    color: colors.ink,
    maxHeight: 100,
  },
  sendBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: colors.lavender,
    alignItems: "center",
    justifyContent: "center",
  },
  sendBtnDisabled: { backgroundColor: colors.muted + "66" },

  loadingText: { color: colors.muted, textAlign: "center", padding: 16, fontSize: 14 },
  emptyText: { color: colors.ink, fontWeight: "600", textAlign: "center" },
  emptySubtext: { color: colors.muted, fontSize: 13, textAlign: "center", marginTop: 4 },
});

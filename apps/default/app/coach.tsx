import React, { useState, useRef, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useQuery, useAction } from "convex/react";
import { api } from "@/convex/_generated/api";
import { colors, gradients } from "@/lib/revibe-theme";
import { notify } from "@/components/revibe/ui";

/**
 * AI Recovery Coach chat. Messages persist in Convex (api.coach.listMine is
 * reactive); api.coach.send calls Claude and stores the reply.
 */
export default function CoachScreen() {
  const router = useRouter();
  const messages = useQuery(api.coach.listMine);
  const send = useAction(api.coach.send);

  const [draft, setDraft] = useState("");
  const [sending, setSending] = useState(false);
  const scrollRef = useRef<ScrollView>(null);

  useEffect(() => {
    // Scroll to newest whenever the list grows or the typing indicator shows.
    const t = setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 80);
    return () => clearTimeout(t);
  }, [messages, sending]);

  const onSend = async () => {
    const text = draft.trim();
    if (!text || sending) return;
    setDraft("");
    setSending(true);
    try {
      await send({ message: text });
    } catch (e: any) {
      const msg =
        e?.data ?? e?.message ?? "Couldn't reach the coach. Please try again.";
      notify("Coach unavailable", String(msg));
      setDraft(text); // restore so they don't lose what they typed
    } finally {
      setSending(false);
    }
  };

  return (
    <LinearGradient colors={gradients.app} style={styles.root}>
      <SafeAreaView style={styles.safe} edges={["top", "bottom"]}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.headerBtn}>
            <Ionicons name="chevron-back" size={24} color={colors.ink} />
          </TouchableOpacity>
          <View style={styles.headerCenter}>
            <View style={styles.coachAvatar}>
              <Ionicons name="sparkles" size={16} color="#fff" />
            </View>
            <View>
              <Text style={styles.headerTitle}>Recovery Coach</Text>
              <Text style={styles.headerSub}>Here for you, anytime</Text>
            </View>
          </View>
          <View style={styles.headerBtn} />
        </View>

        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior={Platform.OS === "ios" ? "padding" : undefined}
          keyboardVerticalOffset={8}
        >
          <ScrollView
            ref={scrollRef}
            style={{ flex: 1 }}
            contentContainerStyle={styles.messages}
            showsVerticalScrollIndicator={false}
          >
            {messages === undefined ? (
              <ActivityIndicator color={colors.lavender} style={{ marginTop: 40 }} />
            ) : messages.length === 0 ? (
              <Bubble
                role="assistant"
                content="Hi, I'm your recovery coach 💜 Whether you're having a tough day, need a little motivation, or just want to talk through your progress — I'm here. How are you feeling today?"
              />
            ) : (
              messages.map((m) => (
                <Bubble key={m._id} role={m.role} content={m.content} />
              ))
            )}
            {sending && <TypingBubble />}
          </ScrollView>

          {/* Composer */}
          <View style={styles.composer}>
            <TextInput
              style={styles.input}
              placeholder="Message your coach…"
              placeholderTextColor={colors.muted}
              value={draft}
              onChangeText={setDraft}
              multiline
              maxLength={4000}
              editable={!sending}
            />
            <TouchableOpacity
              style={[styles.sendBtn, (!draft.trim() || sending) && styles.sendBtnOff]}
              onPress={onSend}
              disabled={!draft.trim() || sending}
              activeOpacity={0.85}
            >
              <Ionicons name="arrow-up" size={20} color="#fff" />
            </TouchableOpacity>
          </View>

          <Text style={styles.disclaimer}>
            Your coach is an AI and not a medical professional.
          </Text>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </LinearGradient>
  );
}

function Bubble({
  role,
  content,
}: {
  role: "user" | "assistant";
  content: string;
}) {
  const mine = role === "user";
  return (
    <View style={[styles.bubbleRow, mine ? styles.rowMine : styles.rowTheirs]}>
      <View style={[styles.bubble, mine ? styles.bubbleMine : styles.bubbleTheirs]}>
        <Text style={[styles.bubbleText, mine && { color: "#fff" }]}>{content}</Text>
      </View>
    </View>
  );
}

function TypingBubble() {
  return (
    <View style={[styles.bubbleRow, styles.rowTheirs]}>
      <View style={[styles.bubble, styles.bubbleTheirs, styles.typing]}>
        <ActivityIndicator size="small" color={colors.lavender} />
        <Text style={styles.typingText}>Coach is typing…</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  safe: { flex: 1 },

  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: colors.soft,
  },
  headerBtn: { width: 40, height: 40, alignItems: "center", justifyContent: "center" },
  headerCenter: { flex: 1, flexDirection: "row", alignItems: "center", gap: 10 },
  coachAvatar: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: colors.lavender,
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: { fontWeight: "800", color: colors.ink, fontSize: 16 },
  headerSub: { color: colors.muted, fontSize: 12 },

  messages: { padding: 16, paddingBottom: 8, gap: 10 },
  bubbleRow: { flexDirection: "row" },
  rowMine: { justifyContent: "flex-end" },
  rowTheirs: { justifyContent: "flex-start" },
  bubble: {
    maxWidth: "82%",
    borderRadius: 18,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  bubbleMine: { backgroundColor: colors.lavender, borderBottomRightRadius: 4 },
  bubbleTheirs: {
    backgroundColor: "#fff",
    borderBottomLeftRadius: 4,
    shadowColor: "#000",
    shadowOpacity: 0.04,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 1,
  },
  bubbleText: { color: colors.ink, fontSize: 15, lineHeight: 21 },
  typing: { flexDirection: "row", alignItems: "center", gap: 8 },
  typingText: { color: colors.muted, fontSize: 13 },

  composer: {
    flexDirection: "row",
    alignItems: "flex-end",
    gap: 8,
    paddingHorizontal: 12,
    paddingTop: 8,
  },
  input: {
    flex: 1,
    backgroundColor: "#fff",
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    color: colors.ink,
    fontSize: 15,
    maxHeight: 120,
    borderWidth: 1,
    borderColor: colors.soft,
  },
  sendBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.lavender,
    alignItems: "center",
    justifyContent: "center",
  },
  sendBtnOff: { opacity: 0.4 },

  disclaimer: {
    color: colors.muted,
    fontSize: 11,
    textAlign: "center",
    paddingVertical: 6,
  },
});

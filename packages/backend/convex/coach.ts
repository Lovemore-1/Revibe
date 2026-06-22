import { v, ConvexError } from "convex/values";
import { internalMutation, internalQuery } from "./_generated/server";
import { internal } from "./_generated/api";
import { authQuery, authAction } from "./functions";

/**
 * AI Recovery Coach — a warm, 24/7 companion for physical-rehab recovery.
 *
 * Replies are generated locally by craftReply() — no external LLM, no API key,
 * no quota, no cost, and it can't error. It's a lightweight rule-based responder
 * tuned for rehab support.
 *
 * To upgrade to a real LLM later (Claude, Gemini, etc.), replace the craftReply
 * call in `send` with a fetch() to the provider, reading the key from
 * process.env. Everything else (history, persistence, UI) stays the same.
 */

const MAX_HISTORY = 20;

// ── Reactive history for the chat UI ─────────────────────────────────────────
export const listMine = authQuery({
  args: {},
  returns: v.array(
    v.object({
      _id: v.id("coachMessages"),
      role: v.union(v.literal("user"), v.literal("assistant")),
      content: v.string(),
      createdAt: v.number(),
    }),
  ),
  handler: async (ctx) => {
    const rows = await ctx.db
      .query("coachMessages")
      .withIndex("by_userId", (q) => q.eq("userId", ctx.user._id))
      .order("asc")
      .take(100);
    return rows.map((r) => ({
      _id: r._id,
      role: r.role,
      content: r.content,
      createdAt: r.createdAt,
    }));
  },
});

// ── Internal helpers used by the action ──────────────────────────────────────
export const record = internalMutation({
  args: {
    userId: v.id("users"),
    role: v.union(v.literal("user"), v.literal("assistant")),
    content: v.string(),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    await ctx.db.insert("coachMessages", {
      userId: args.userId,
      role: args.role,
      content: args.content,
      createdAt: Date.now(),
    });
    return null;
  },
});

export const contextFor = internalQuery({
  args: { userId: v.id("users") },
  returns: v.object({
    profile: v.union(
      v.null(),
      v.object({
        displayName: v.string(),
        injuryType: v.string(),
        recoveryStage: v.string(),
        goals: v.array(v.string()),
      }),
    ),
    history: v.array(
      v.object({
        role: v.union(v.literal("user"), v.literal("assistant")),
        content: v.string(),
      }),
    ),
  }),
  handler: async (ctx, { userId }) => {
    const profileDoc = await ctx.db
      .query("userProfiles")
      .withIndex("by_userId", (q) => q.eq("userId", userId))
      .unique();

    const rows = await ctx.db
      .query("coachMessages")
      .withIndex("by_userId", (q) => q.eq("userId", userId))
      .order("desc")
      .take(MAX_HISTORY);

    return {
      profile: profileDoc
        ? {
            displayName: profileDoc.displayName,
            injuryType: profileDoc.injuryType,
            recoveryStage: profileDoc.recoveryStage,
            goals: profileDoc.goals,
          }
        : null,
      // take(desc) gives newest-first; reverse to chronological for the model
      history: rows.reverse().map((r) => ({ role: r.role, content: r.content })),
    };
  },
});

// ── The chat action ──────────────────────────────────────────────────────────
export const send = authAction({
  args: { message: v.string() },
  returns: v.string(),
  handler: async (ctx, { message }) => {
    const text = message.trim();
    if (text.length === 0) throw new ConvexError("Message is empty.");
    if (text.length > 4000) throw new ConvexError("Message is too long.");

    // Persist the user's message first.
    await ctx.runMutation(internal.coach.record, {
      userId: ctx.user._id,
      role: "user",
      content: text,
    });

    const { profile } = await ctx.runQuery(internal.coach.contextFor, {
      userId: ctx.user._id,
    });
    const name = profile?.displayName?.split(" ")[0];

    const reply = craftReply(text, name);

    await ctx.runMutation(internal.coach.record, {
      userId: ctx.user._id,
      role: "assistant",
      content: reply,
    });

    return reply;
  },
});

// ── Local rule-based responder (free, no external LLM) ───────────────────────
function pick(arr: string[], seed: number): string {
  return arr[Math.abs(seed) % arr.length];
}

function craftReply(message: string, name?: string): string {
  const t = message.toLowerCase();
  const seed = Date.now() + message.length;
  const hi = name ? `${name}, ` : "";
  const friend = name ?? "friend";

  // Crisis — always first.
  if (
    /\b(suicid|kill myself|end (it|my life)|harm myself|don'?t want to live|self.?harm|want to die)/.test(t)
  ) {
    return "I'm really glad you reached out, and I'm genuinely concerned about you. I'm not able to help in a crisis, but you deserve immediate support — please contact your local emergency services or a crisis line right now. You don't have to go through this alone. 💜";
  }

  // Pain / physical symptoms.
  if (/\b(pain|hurt|hurts|sore|ache|aching|aches|sharp|swollen|swelling|stiff)/.test(t)) {
    return pick(
      [
        `${hi}I'm sorry you're in pain today — that's genuinely hard. Be gentle with yourself: rest, ice if it helps, and don't push through sharp pain. If it's severe or getting worse, please check in with your physio or doctor. 💜`,
        `Pain days are some of the toughest in recovery, ${friend}. Listen to your body, ease off if you need to, and remember a hard day doesn't undo your progress. Flag any sharp or worsening pain to your physiotherapist.`,
        `${hi}sore days are part of healing, even when they don't feel like it. Try gentle movement within comfort, rest when you need to, and reach out to your care team if the pain feels off. You're still moving forward.`,
      ],
      seed,
    );
  }

  // Discouraged / low mood / stuck.
  if (/\b(discourag|down|sad|depress|hopeless|giving up|give up|quit|frustrat|defeat|stuck|slow|no progress)/.test(t)) {
    return pick(
      [
        `${hi}it's completely normal to feel discouraged — recovery isn't a straight line, and the fact that you showed up today says a lot about you. Small steps still count. What's one tiny kind thing you could do for yourself right now?`,
        `Feeling stuck is so common in rehab, and it doesn't mean you're failing, ${friend}. Progress often happens quietly before you can see it. Be proud of how far you've come — you're still here, still trying.`,
        `${hi}I hear you, and those feelings are valid. Healing is slow and frustrating, but every day you keep going is a win. Try to celebrate one small thing today — even just resting well.`,
      ],
      seed,
    );
  }

  // Tired / unmotivated.
  if (/\b(tired|exhaust|no energy|drained|unmotivat|lazy|can'?t be bothered|burn(t|ed)? out)/.test(t)) {
    return pick(
      [
        `${hi}low-energy days happen, and they're okay. You don't have to do everything — even a few minutes of gentle movement, or just resting well, counts as caring for your recovery.`,
        `Rest is part of healing too, ${friend}. If motivation is low, aim for the smallest possible step. Showing up at all on a tired day is something to be proud of.`,
      ],
      seed,
    );
  }

  // Wins / positive.
  if (/\b(good|great|better|progress|win|won|proud|happy|improv|stronger|achieved|milestone|did it|feeling great)/.test(t)) {
    return pick(
      [
        `${hi}that's wonderful to hear! 🎉 Take a moment to really celebrate it — your consistency is paying off. Keep that momentum going.`,
        `Yes! That's a real win, ${friend} 💪 Progress like this is exactly what all your effort is building toward. I'm proud of you.`,
        `${hi}love hearing this! These good days are proof your hard work matters. Soak it in — you earned it.`,
      ],
      seed,
    );
  }

  // Anxious / scared.
  if (/\b(scared|afraid|anxious|anxiety|worried|worry|nervous|fear|overwhelm)/.test(t)) {
    return pick(
      [
        `${hi}it's okay to feel anxious — recovery comes with a lot of uncertainty. Try to focus on just today, and the one next step in front of you. You've handled hard things before.`,
        `Those worries are understandable, ${friend}. One day at a time is more than enough. If specific fears keep coming up, your physio can help you understand what's normal for your stage.`,
      ],
      seed,
    );
  }

  // Thanks.
  if (/\b(thank|thanks|appreciate|grateful)/.test(t)) {
    return `You're so welcome${name ? `, ${name}` : ""}. I'm always here whenever you need a boost. 💜`;
  }

  // Greeting.
  if (/^\s*(hi|hey|hello|yo|sup|good (morning|afternoon|evening))/.test(t)) {
    return `${hi}hey! 👋 It's good to hear from you. How are you feeling about your recovery today?`;
  }

  // Default.
  return pick(
    [
      `${hi}thank you for sharing that with me. Recovery is a journey and I'm here for every step. What would feel most supportive right now — talking it through, some encouragement, or a reminder of your goals?`,
      `I hear you${name ? `, ${name}` : ""}. Whatever you're facing in your recovery, you're not alone in it. Tell me a bit more about how you're feeling.`,
      `${hi}I'm here with you. Every check-in and every effort counts, even the small ones. What's on your mind about your recovery today?`,
    ],
    seed,
  );
}

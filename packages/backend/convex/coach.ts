import { v, ConvexError } from "convex/values";
import { internalMutation, internalQuery } from "./_generated/server";
import { internal } from "./_generated/api";
import { authQuery, authAction } from "./functions";

/**
 * AI Recovery Coach — a warm, 24/7 companion for physical-rehab recovery.
 *
 * Calls the Anthropic Messages API directly via fetch (no SDK dependency, so it
 * bundles cleanly into Convex). Requires the ANTHROPIC_API_KEY environment
 * variable to be set on the Convex deployment:
 *
 *   npx convex env set ANTHROPIC_API_KEY sk-ant-...
 */

// Swap to "claude-haiku-4-5" to cut cost ~5x (lower quality replies).
const COACH_MODEL = "claude-opus-4-8";
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

    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      throw new ConvexError(
        "The recovery coach isn't switched on yet. (Set ANTHROPIC_API_KEY on the Convex deployment.)",
      );
    }

    // Persist the user's message first, then build context from it.
    await ctx.runMutation(internal.coach.record, {
      userId: ctx.user._id,
      role: "user",
      content: text,
    });

    const { profile, history } = await ctx.runQuery(internal.coach.contextFor, {
      userId: ctx.user._id,
    });

    const who = profile
      ? `You are speaking with ${profile.displayName}, who is recovering from ${profile.injuryType} (stage: ${profile.recoveryStage}).${
          profile.goals.length ? ` Their goals: ${profile.goals.join(", ")}.` : ""
        }`
      : "You are speaking with a new ReVIBE member.";

    const system = [
      "You are ReVIBE's Recovery Coach — a warm, encouraging companion for someone recovering from a physical injury or surgery.",
      who,
      "Be supportive, practical, and concise (2–5 short sentences unless they ask for more). Celebrate small wins, normalise tough days, and gently encourage consistency with rehab and check-ins.",
      "You are NOT a medical professional. For pain that is severe, worsening, or concerning, or any medical decision, tell them to consult their physiotherapist or doctor. Never diagnose or prescribe.",
      "If someone expresses thoughts of self-harm or crisis, gently urge them to contact local emergency services or a crisis line right away.",
    ].join("\n\n");

    const resp = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: COACH_MODEL,
        max_tokens: 1024,
        system,
        messages: history.map((m) => ({ role: m.role, content: m.content })),
      }),
    });

    if (!resp.ok) {
      const detail = await resp.text().catch(() => "");
      console.error("Anthropic API error", resp.status, detail);
      throw new ConvexError(
        "The coach couldn't respond right now. Please try again in a moment.",
      );
    }

    const data = (await resp.json()) as {
      content?: Array<{ type: string; text?: string }>;
    };
    const reply =
      data.content
        ?.filter((b) => b.type === "text")
        .map((b) => b.text ?? "")
        .join("")
        .trim() || "I'm here with you.";

    await ctx.runMutation(internal.coach.record, {
      userId: ctx.user._id,
      role: "assistant",
      content: reply,
    });

    return reply;
  },
});

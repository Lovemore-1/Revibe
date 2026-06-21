import { v } from "convex/values";
import type { Id } from "./_generated/dataModel";
import { authMutation, authQuery } from "./functions";
import { conversationValidator, directMessageValidator } from "./model";
import { rateLimiter } from "./rateLimit";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

async function getOtherProfile(
  ctx: any,
  otherId: Id<"users">,
) {
  const profile = await ctx.db
    .query("userProfiles")
    .withIndex("by_userId", (q: any) => q.eq("userId", otherId))
    .unique();
  return {
    otherName: profile?.displayName ?? "Revibe member",
    otherInjury: profile?.injuryType ?? "Recovery journey",
    otherProgress: profile?.recoveryProgress ?? 0,
  };
}

// ---------------------------------------------------------------------------
// Queries
// ---------------------------------------------------------------------------

export const listConversations = authQuery({
  args: {},
  returns: v.array(conversationValidator),
  handler: async (ctx) => {
    const [asA, asB] = await Promise.all([
      ctx.db
        .query("conversations")
        .withIndex("by_memberAId", (q) => q.eq("memberAId", ctx.user._id))
        .order("desc")
        .take(30),
      ctx.db
        .query("conversations")
        .withIndex("by_memberBId", (q) => q.eq("memberBId", ctx.user._id))
        .order("desc")
        .take(30),
    ]);

    const all = [...asA, ...asB].sort((a, b) => b.lastMessageAt - a.lastMessageAt);

    // Deduplicate (shouldn't happen but defensive)
    const seen = new Set<string>();
    const unique = all.filter((c) => {
      if (seen.has(c._id as string)) return false;
      seen.add(c._id as string);
      return true;
    });

    const result = [];
    for (const conv of unique.slice(0, 20)) {
      const otherId = conv.memberAId === ctx.user._id ? conv.memberBId : conv.memberAId;
      const other = await getOtherProfile(ctx, otherId);
      result.push({ ...conv, otherUserId: otherId, ...other });
    }
    return result;
  },
});

export const getMessages = authQuery({
  args: { conversationId: v.id("conversations") },
  returns: v.array(directMessageValidator),
  handler: async (ctx, args) => {
    const conv = await ctx.db.get(args.conversationId);
    if (!conv) throw new Error("Conversation not found");
    if (conv.memberAId !== ctx.user._id && conv.memberBId !== ctx.user._id) {
      throw new Error("Not a member of this conversation");
    }

    const messages = await ctx.db
      .query("directMessages")
      .withIndex("by_conversationId", (q) => q.eq("conversationId", args.conversationId))
      .order("asc")
      .take(100);

    return messages.map((m) => ({
      ...m,
      isMine: m.senderId === ctx.user._id,
    }));
  },
});

// ---------------------------------------------------------------------------
// Mutations
// ---------------------------------------------------------------------------

export const getOrCreateConversation = authMutation({
  args: { otherUserId: v.id("users") },
  returns: v.id("conversations"),
  handler: async (ctx, args) => {
    if (args.otherUserId === ctx.user._id) {
      throw new Error("Cannot start a conversation with yourself");
    }

    // Canonical ordering: smaller id is always memberA
    const [memberAId, memberBId] =
      (ctx.user._id as string) < (args.otherUserId as string)
        ? [ctx.user._id, args.otherUserId]
        : [args.otherUserId, ctx.user._id];

    const existing = await ctx.db
      .query("conversations")
      .withIndex("by_memberAId_and_memberBId", (q) =>
        q.eq("memberAId", memberAId).eq("memberBId", memberBId),
      )
      .unique();

    if (existing) return existing._id;

    const now = Date.now();
    return await ctx.db.insert("conversations", {
      memberAId,
      memberBId,
      lastMessagePreview: "",
      lastMessageAt: now,
      createdAt: now,
    });
  },
});

export const sendMessage = authMutation({
  args: {
    conversationId: v.id("conversations"),
    body: v.string(),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    await rateLimiter.limit(ctx, "sendMessage", { key: ctx.user._id, throws: true });

    const conv = await ctx.db.get(args.conversationId);
    if (!conv) throw new Error("Conversation not found");
    if (conv.memberAId !== ctx.user._id && conv.memberBId !== ctx.user._id) {
      throw new Error("Not a member of this conversation");
    }

    const body = args.body.trim();
    if (body.length === 0) throw new Error("Message cannot be empty");
    if (body.length > 1000) throw new Error("Message too long (max 1000 characters)");

    const now = Date.now();
    await ctx.db.insert("directMessages", {
      conversationId: args.conversationId,
      senderId: ctx.user._id,
      body,
      createdAt: now,
    });

    await ctx.db.patch(args.conversationId, {
      lastMessagePreview: body.length > 60 ? body.slice(0, 57) + "…" : body,
      lastMessageAt: now,
    });

    return null;
  },
});

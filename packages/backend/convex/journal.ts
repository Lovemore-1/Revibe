import { v } from "convex/values";
import { authMutation, authQuery } from "./functions";
import { journalEntryValidator, moodValidator } from "./model";

export const listMine = authQuery({
  args: {},
  returns: v.array(journalEntryValidator),
  handler: async (ctx) => {
    return await ctx.db
      .query("journalEntries")
      .withIndex("by_userId", (q) => q.eq("userId", ctx.user._id))
      .order("desc")
      .take(30);
  },
});

export const stats = authQuery({
  args: {},
  returns: v.object({
    avgPain: v.number(),
    avgEnergy: v.number(),
    avgMotivation: v.number(),
    entryCount: v.number(),
  }),
  handler: async (ctx) => {
    const entries = await ctx.db
      .query("journalEntries")
      .withIndex("by_userId", (q) => q.eq("userId", ctx.user._id))
      .order("desc")
      .take(14);

    if (entries.length === 0) {
      return { avgPain: 0, avgEnergy: 0, avgMotivation: 0, entryCount: 0 };
    }

    const sum = entries.reduce(
      (acc, e) => ({
        pain: acc.pain + e.painLevel,
        energy: acc.energy + e.energy,
        motivation: acc.motivation + e.motivation,
      }),
      { pain: 0, energy: 0, motivation: 0 },
    );

    const n = entries.length;
    return {
      avgPain: Math.round((sum.pain / n) * 10) / 10,
      avgEnergy: Math.round((sum.energy / n) * 10) / 10,
      avgMotivation: Math.round((sum.motivation / n) * 10) / 10,
      entryCount: n,
    };
  },
});

export const addEntry = authMutation({
  args: {
    mood: moodValidator,
    painLevel: v.number(),
    energy: v.number(),
    motivation: v.number(),
    note: v.string(),
    milestone: v.optional(v.string()),
  },
  returns: v.id("journalEntries"),
  handler: async (ctx, args) => {
    const entryDate = new Date().toISOString().split("T")[0]; // YYYY-MM-DD
    const now = Date.now();

    // Clamp scales to 1-10
    const painLevel = Math.max(1, Math.min(10, Math.round(args.painLevel)));
    const energy = Math.max(1, Math.min(10, Math.round(args.energy)));
    const motivation = Math.max(1, Math.min(10, Math.round(args.motivation)));

    // Upsert: one entry per day per user
    const existing = await ctx.db
      .query("journalEntries")
      .withIndex("by_userId_and_entryDate", (q) =>
        q.eq("userId", ctx.user._id).eq("entryDate", entryDate),
      )
      .unique();

    if (existing) {
      await ctx.db.patch(existing._id, {
        mood: args.mood,
        painLevel,
        energy,
        motivation,
        note: args.note.trim(),
        milestone: args.milestone?.trim() || undefined,
        createdAt: now,
      });
      await updateProfileStats(ctx, args.milestone);
      return existing._id;
    }

    const id = await ctx.db.insert("journalEntries", {
      userId: ctx.user._id,
      mood: args.mood,
      painLevel,
      energy,
      motivation,
      note: args.note.trim(),
      milestone: args.milestone?.trim() || undefined,
      entryDate,
      createdAt: now,
    });

    await updateProfileStats(ctx, args.milestone);
    return id;
  },
});

async function updateProfileStats(
  ctx: any,
  milestone?: string,
) {
  const profile = await ctx.db
    .query("userProfiles")
    .withIndex("by_userId", (q: any) => q.eq("userId", ctx.user._id))
    .unique();

  if (!profile) return;

  const patch: Record<string, number> = {
    recoveryStreak: profile.recoveryStreak + 1,
    updatedAt: Date.now(),
  };

  if (milestone) {
    patch.milestonesAchieved = profile.milestonesAchieved + 1;
    // Bump progress by 2% per milestone, capped at 100
    patch.recoveryProgress = Math.min(100, profile.recoveryProgress + 2);
  }

  await ctx.db.patch(profile._id, patch);
}

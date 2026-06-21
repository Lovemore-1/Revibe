import { v } from "convex/values";
import { authMutation, authQuery } from "./functions";
import { moodValidator, profileReturnValidator, recoveryStageValidator } from "./model";
import { rateLimiter } from "./rateLimit";

function displayNameFromUser(user: { name?: string | null; email?: string | null }): string {
  return user.name ?? user.email?.split("@")[0] ?? "Revibe member";
}

export const getMine = authQuery({
  args: {},
  returns: v.union(v.null(), profileReturnValidator),
  handler: async (ctx) => {
    return await ctx.db
      .query("userProfiles")
      .withIndex("by_userId", (q) => q.eq("userId", ctx.user._id))
      .unique();
  },
});

export const completeOnboarding = authMutation({
  args: {
    displayName: v.optional(v.string()),
    injuryType: v.string(),
    recoveryStage: recoveryStageValidator,
    emotionalState: moodValidator,
    goals: v.array(v.string()),
    supportGroups: v.array(v.string()),
  },
  returns: v.id("userProfiles"),
  handler: async (ctx, args) => {
    await rateLimiter.limit(ctx, "completeOnboarding", { key: ctx.user._id, throws: true });

    const now = Date.now();
    const existing = await ctx.db
      .query("userProfiles")
      .withIndex("by_userId", (q) => q.eq("userId", ctx.user._id))
      .unique();

    const profile = {
      userId: ctx.user._id,
      displayName: args.displayName?.trim() || displayNameFromUser(ctx.user),
      bio: "",
      injuryType: args.injuryType.trim(),
      recoveryStage: args.recoveryStage,
      emotionalState: args.emotionalState,
      goals: args.goals.slice(0, 5),
      supportGroups: args.supportGroups.slice(0, 5),
      recoveryProgress: 18,
      recoveryStreak: 1,
      milestonesAchieved: 0,
      onboardedAt: existing?.onboardedAt ?? now,
      updatedAt: now,
    };

    if (existing) {
      await ctx.db.patch(existing._id, profile);
      return existing._id;
    }
    return await ctx.db.insert("userProfiles", profile);
  },
});

export const updateProfile = authMutation({
  args: {
    displayName: v.string(),
    bio: v.string(),
    recoveryProgress: v.number(),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const profile = await ctx.db
      .query("userProfiles")
      .withIndex("by_userId", (q) => q.eq("userId", ctx.user._id))
      .unique();
    if (!profile) throw new Error("Complete onboarding before editing your profile");

    await ctx.db.patch(profile._id, {
      displayName: args.displayName.trim(),
      bio: args.bio.trim(),
      recoveryProgress: Math.max(0, Math.min(100, args.recoveryProgress)),
      updatedAt: Date.now(),
    });
    return null;
  },
});

export const listSupportBuddies = authQuery({
  args: {},
  returns: v.array(profileReturnValidator),
  handler: async (ctx) => {
    // Fix: filter out current user at the query level, then take 8.
    // We use the by_userId index direction desc on _creationTime via order("desc").
    // Since there's no compound index, we take a slightly larger batch and filter.
    const all = await ctx.db
      .query("userProfiles")
      .order("desc")
      .take(50);

    return all
      .filter((p) => p.userId !== ctx.user._id)
      .slice(0, 8);
  },
});

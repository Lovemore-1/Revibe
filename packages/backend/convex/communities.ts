import { v } from "convex/values";
import { authMutation, authQuery } from "./functions";
import { communityValidator } from "./model";
import { communityData } from "./communityData";

export const list = authQuery({
  args: {},
  returns: v.array(communityValidator),
  handler: async (ctx) => {
    const memberships = await ctx.db
      .query("communityMemberships")
      .withIndex("by_userId", (q) => q.eq("userId", ctx.user._id))
      .collect();

    const joinedSlugs = new Set(memberships.map((m) => m.communitySlug));

    return communityData.map((c) => ({
      ...c,
      joined: joinedSlugs.has(c.slug),
    }));
  },
});

export const toggleMembership = authMutation({
  args: { communitySlug: v.string() },
  returns: v.boolean(),
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("communityMemberships")
      .withIndex("by_communitySlug_and_userId", (q) =>
        q.eq("communitySlug", args.communitySlug).eq("userId", ctx.user._id),
      )
      .unique();

    if (existing) {
      await ctx.db.delete(existing._id);
      return false;
    }

    await ctx.db.insert("communityMemberships", {
      userId: ctx.user._id,
      communitySlug: args.communitySlug,
      joinedAt: Date.now(),
    });
    return true;
  },
});

/**
 * Subscription management for Revibe Pro.
 *
 * Integration path (RevenueCat recommended for mobile):
 * 1. Install RevenueCat SDK in apps/default
 * 2. After a successful purchase, call `activateSubscription` with the
 *    RevenueCat originalAppUserId and entitlement details.
 * 3. Optionally, set up a RevenueCat webhook → Convex HTTP action (see
 *    the commented `handleRevenueCatWebhook` action at the bottom).
 *
 * For web / Stripe: same pattern — call `activateSubscription` from the
 * Stripe webhook handler.
 */

import { v } from "convex/values";
import type { Id } from "./_generated/dataModel";
import type { MutationCtx, QueryCtx } from "./_generated/server";
import { authMutation, authQuery } from "./functions";
import { subscriptionStatusReturnValidator, subscriptionValidator } from "./model";
import { rateLimiter } from "./rateLimit";

// ---------------------------------------------------------------------------
// Shared helper — used by posts.ts, profiles.ts, etc.
// ---------------------------------------------------------------------------

export async function getUserIsPro(
  ctx: { db: QueryCtx["db"] },
  userId: Id<"users">,
): Promise<boolean> {
  const sub = await ctx.db
    .query("subscriptions")
    .withIndex("by_userId", (q) => q.eq("userId", userId))
    .unique();
  return (
    sub !== null &&
    sub.tier === "pro" &&
    sub.status === "active" &&
    sub.currentPeriodEnd > Date.now()
  );
}

// ---------------------------------------------------------------------------
// Queries
// ---------------------------------------------------------------------------

export const getMine = authQuery({
  args: {},
  returns: subscriptionStatusReturnValidator,
  handler: async (ctx) => {
    const sub = await ctx.db
      .query("subscriptions")
      .withIndex("by_userId", (q) => q.eq("userId", ctx.user._id))
      .unique();

    const isPro =
      sub !== null &&
      sub.tier === "pro" &&
      sub.status === "active" &&
      sub.currentPeriodEnd > Date.now();

    return {
      isPro,
      tier: isPro ? ("pro" as const) : ("free" as const),
      status: sub?.status,
      currentPeriodEnd: sub?.currentPeriodEnd,
      cancelAtPeriodEnd: sub?.cancelAtPeriodEnd,
    };
  },
});

export const getDetails = authQuery({
  args: {},
  returns: v.union(v.null(), subscriptionValidator),
  handler: async (ctx) => {
    return await ctx.db
      .query("subscriptions")
      .withIndex("by_userId", (q) => q.eq("userId", ctx.user._id))
      .unique();
  },
});

// ---------------------------------------------------------------------------
// Mutations
// ---------------------------------------------------------------------------

/**
 * Called from the mobile app after RevenueCat (or Stripe) confirms a purchase.
 *
 * args.periodDays: 30 for monthly, 365 for annual.
 */
export const activateSubscription = authMutation({
  args: {
    provider: v.string(),
    providerSubscriptionId: v.string(),
    periodDays: v.number(),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    await rateLimiter.limit(ctx, "activateSubscription", { key: ctx.user._id, throws: true });

    const now = Date.now();
    const periodEnd = now + args.periodDays * 24 * 60 * 60 * 1000;

    const existing = await ctx.db
      .query("subscriptions")
      .withIndex("by_userId", (q) => q.eq("userId", ctx.user._id))
      .unique();

    if (existing) {
      await ctx.db.patch(existing._id, {
        tier: "pro",
        status: "active",
        provider: args.provider,
        providerSubscriptionId: args.providerSubscriptionId,
        currentPeriodStart: now,
        currentPeriodEnd: periodEnd,
        cancelAtPeriodEnd: false,
        updatedAt: now,
      });
    } else {
      await ctx.db.insert("subscriptions", {
        userId: ctx.user._id,
        tier: "pro",
        status: "active",
        provider: args.provider,
        providerSubscriptionId: args.providerSubscriptionId,
        currentPeriodStart: now,
        currentPeriodEnd: periodEnd,
        cancelAtPeriodEnd: false,
        createdAt: now,
        updatedAt: now,
      });
    }

    return null;
  },
});

export const cancelSubscription = authMutation({
  args: {},
  returns: v.null(),
  handler: async (ctx) => {
    const sub = await ctx.db
      .query("subscriptions")
      .withIndex("by_userId", (q) => q.eq("userId", ctx.user._id))
      .unique();

    if (!sub || sub.tier !== "pro") throw new Error("No active Pro subscription found");

    await ctx.db.patch(sub._id, {
      cancelAtPeriodEnd: true,
      updatedAt: Date.now(),
    });

    return null;
  },
});

// ---------------------------------------------------------------------------
// Internal — called by cron to expire subscriptions
// ---------------------------------------------------------------------------

export const expireStaleSubscriptions = authMutation({
  args: {},
  returns: v.number(),
  handler: async (ctx) => {
    // Note: in production, make this an internalMutation and wire it to
    // a Convex cron that runs hourly.
    const now = Date.now();
    const active = await ctx.db
      .query("subscriptions")
      .filter((q) => q.eq(q.field("status"), "active"))
      .collect();

    let expired = 0;
    for (const sub of active) {
      if (sub.currentPeriodEnd < now) {
        await ctx.db.patch(sub._id, { status: "expired", updatedAt: now });
        expired++;
      }
    }
    return expired;
  },
});

// ---------------------------------------------------------------------------
// RevenueCat webhook handler (wire this up in http.ts when ready)
// ---------------------------------------------------------------------------
//
// import { httpAction } from "./_generated/server";
// import { internal } from "./_generated/api";
//
// export const handleRevenueCatWebhook = httpAction(async (ctx, request) => {
//   const body = await request.json();
//   const event = body.event;
//
//   // Verify the Authorization header matches your RevenueCat webhook secret
//   const secret = env.REVENUECAT_WEBHOOK_SECRET;
//   if (request.headers.get("Authorization") !== secret) {
//     return new Response("Unauthorized", { status: 401 });
//   }
//
//   const userId = event.app_user_id; // map to your Convex user ID
//
//   if (event.type === "INITIAL_PURCHASE" || event.type === "RENEWAL") {
//     await ctx.runMutation(internal.subscriptions.upsertFromWebhook, {
//       providerUserId: userId,
//       periodEnd: new Date(event.expiration_at_ms).getTime(),
//     });
//   } else if (event.type === "CANCELLATION" || event.type === "EXPIRATION") {
//     await ctx.runMutation(internal.subscriptions.expireFromWebhook, {
//       providerUserId: userId,
//     });
//   }
//
//   return new Response("OK", { status: 200 });
// });

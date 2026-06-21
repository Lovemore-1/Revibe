import { defineSchema, defineTable } from "convex/server";
import { authTables } from "@convex-dev/auth/server";
import { v } from "convex/values";
import {
  moodValidator,
  recoveryStageValidator,
  subscriptionStatusValidator,
  subscriptionTierValidator,
} from "./validators";

export default defineSchema({
  ...authTables,

  userProfiles: defineTable({
    userId: v.id("users"),
    displayName: v.string(),
    bio: v.string(),
    injuryType: v.string(),
    recoveryStage: recoveryStageValidator,
    emotionalState: moodValidator,
    goals: v.array(v.string()),
    supportGroups: v.array(v.string()),
    recoveryProgress: v.number(),
    recoveryStreak: v.number(),
    milestonesAchieved: v.number(),
    onboardedAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_userId", ["userId"])
    .index("by_recoveryStage", ["recoveryStage"]),

  posts: defineTable({
    userId: v.id("users"),
    body: v.string(),
    mood: moodValidator,
    kind: v.union(
      v.literal("update"),
      v.literal("struggle"),
      v.literal("win"),
      v.literal("milestone"),
    ),
    communitySlug: v.optional(v.string()),
    imageStorageId: v.optional(v.id("_storage")),
    likeCount: v.number(),
    commentCount: v.number(),
    createdAt: v.number(),
  })
    .index("by_userId", ["userId"])
    .index("by_communitySlug", ["communitySlug"])
    .index("by_createdAt", ["createdAt"]),

  postLikes: defineTable({
    postId: v.id("posts"),
    userId: v.id("users"),
  })
    .index("by_postId_and_userId", ["postId", "userId"])
    .index("by_userId", ["userId"]),

  postComments: defineTable({
    postId: v.id("posts"),
    userId: v.id("users"),
    body: v.string(),
    createdAt: v.number(),
  }).index("by_postId", ["postId"]),

  communityMemberships: defineTable({
    userId: v.id("users"),
    communitySlug: v.string(),
    joinedAt: v.number(),
  })
    .index("by_userId", ["userId"])
    .index("by_communitySlug_and_userId", ["communitySlug", "userId"]),

  journalEntries: defineTable({
    userId: v.id("users"),
    mood: moodValidator,
    painLevel: v.number(),
    energy: v.number(),
    motivation: v.number(),
    note: v.string(),
    milestone: v.optional(v.string()),
    entryDate: v.string(),
    createdAt: v.number(),
  })
    .index("by_userId", ["userId"])
    .index("by_userId_and_entryDate", ["userId", "entryDate"]),

  conversations: defineTable({
    memberAId: v.id("users"),
    memberBId: v.id("users"),
    lastMessagePreview: v.string(),
    lastMessageAt: v.number(),
    createdAt: v.number(),
  })
    .index("by_memberAId", ["memberAId"])
    .index("by_memberBId", ["memberBId"])
    .index("by_memberAId_and_memberBId", ["memberAId", "memberBId"]),

  directMessages: defineTable({
    conversationId: v.id("conversations"),
    senderId: v.id("users"),
    body: v.string(),
    createdAt: v.number(),
  }).index("by_conversationId", ["conversationId"]),

  // ── Subscriptions ────────────────────────────────────────────────────────
  subscriptions: defineTable({
    userId: v.id("users"),
    tier: subscriptionTierValidator,
    status: subscriptionStatusValidator,
    /** "revenuecat" | "stripe" | "manual" (admin grant) */
    provider: v.string(),
    /** RevenueCat originalAppUserId or Stripe subscriptionId */
    providerSubscriptionId: v.optional(v.string()),
    currentPeriodStart: v.number(),
    currentPeriodEnd: v.number(),
    /** true = active but will not renew */
    cancelAtPeriodEnd: v.boolean(),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_userId", ["userId"])
    .index("by_providerSubscriptionId", ["providerSubscriptionId"]),
});

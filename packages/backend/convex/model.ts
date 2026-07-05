import { v } from "convex/values";
import {
  moodValidator,
  postKindValidator,
  recoveryStageValidator,
  subscriptionStatusValidator,
  subscriptionTierValidator,
} from "./validators";

// Re-export so callers don't need two imports
export { moodValidator, postKindValidator, recoveryStageValidator };

export const profileReturnValidator = v.object({
  _id: v.id("userProfiles"),
  _creationTime: v.number(),
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
});

export const commentPreviewValidator = v.object({
  _id: v.id("postComments"),
  body: v.string(),
  createdAt: v.number(),
  authorName: v.string(),
});

export const feedPostValidator = v.object({
  _id: v.id("posts"),
  _creationTime: v.number(),
  userId: v.id("users"),
  body: v.string(),
  mood: moodValidator,
  kind: postKindValidator,
  communitySlug: v.optional(v.string()),
  imageStorageId: v.optional(v.id("_storage")),
  likeCount: v.number(),
  commentCount: v.number(),
  createdAt: v.number(),
  authorName: v.string(),
  authorInjury: v.string(),
  authorProgress: v.number(),
  authorIsPro: v.boolean(),
  likedByMe: v.boolean(),
  comments: v.array(commentPreviewValidator),
});

export const communityValidator = v.object({
  slug: v.string(),
  name: v.string(),
  description: v.string(),
  memberLabel: v.string(),
  accent: v.string(),
  icon: v.string(),
  joined: v.boolean(),
});

export const journalEntryValidator = v.object({
  _id: v.id("journalEntries"),
  _creationTime: v.number(),
  userId: v.id("users"),
  mood: moodValidator,
  painLevel: v.number(),
  energy: v.number(),
  motivation: v.number(),
  note: v.string(),
  milestone: v.optional(v.string()),
  entryDate: v.string(),
  createdAt: v.number(),
});

export const conversationValidator = v.object({
  _id: v.id("conversations"),
  _creationTime: v.number(),
  memberAId: v.id("users"),
  memberBId: v.id("users"),
  lastMessagePreview: v.string(),
  lastMessageAt: v.number(),
  createdAt: v.number(),
  otherUserId: v.id("users"),
  otherName: v.string(),
  otherInjury: v.string(),
  otherProgress: v.number(),
});

export const directMessageValidator = v.object({
  _id: v.id("directMessages"),
  _creationTime: v.number(),
  conversationId: v.id("conversations"),
  senderId: v.id("users"),
  body: v.string(),
  createdAt: v.number(),
  isMine: v.boolean(),
});

export const subscriptionValidator = v.object({
  _id: v.id("subscriptions"),
  _creationTime: v.number(),
  userId: v.id("users"),
  tier: subscriptionTierValidator,
  status: subscriptionStatusValidator,
  provider: v.string(),
  providerSubscriptionId: v.optional(v.string()),
  currentPeriodStart: v.number(),
  currentPeriodEnd: v.number(),
  cancelAtPeriodEnd: v.boolean(),
  createdAt: v.number(),
  updatedAt: v.number(),
});

export const subscriptionStatusReturnValidator = v.object({
  isPro: v.boolean(),
  tier: subscriptionTierValidator,
  status: v.optional(subscriptionStatusValidator),
  currentPeriodEnd: v.optional(v.number()),
  cancelAtPeriodEnd: v.optional(v.boolean()),
});

export const recoveryPlanTaskValidator = v.object({
  id: v.string(),
  label: v.string(),
  done: v.boolean(),
});

export const recoveryPlanPhaseValidator = v.object({
  name: v.string(),
  tasks: v.array(recoveryPlanTaskValidator),
});

export const recoveryPlanValidator = v.object({
  _id: v.id("recoveryPlans"),
  _creationTime: v.number(),
  userId: v.id("users"),
  title: v.string(),
  source: v.string(),
  notes: v.string(),
  phases: v.array(recoveryPlanPhaseValidator),
  createdAt: v.number(),
  updatedAt: v.number(),
});

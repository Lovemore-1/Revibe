/**
 * Shared base validators — imported by both schema.ts and model.ts.
 * Only depends on "convex/values" so it is safe to import from schema.ts.
 */
import { v } from "convex/values";

export const moodValidator = v.union(
  v.literal("hopeful"),
  v.literal("steady"),
  v.literal("frustrated"),
  v.literal("low"),
  v.literal("proud"),
);

export const recoveryStageValidator = v.union(
  v.literal("just_injured"),
  v.literal("post_surgery"),
  v.literal("early_rehab"),
  v.literal("building_strength"),
  v.literal("returning"),
);

export const postKindValidator = v.union(
  v.literal("update"),
  v.literal("struggle"),
  v.literal("win"),
  v.literal("milestone"),
);

export const subscriptionTierValidator = v.union(
  v.literal("free"),
  v.literal("pro"),
);

export const subscriptionStatusValidator = v.union(
  v.literal("active"),
  v.literal("cancelled"),
  v.literal("expired"),
);

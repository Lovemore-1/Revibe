import { convexTest } from "convex-test";
import { expect, test } from "vitest";
import schema from "./schema";

// Uncomment and expand these tests as you build features.
// Run with: bun test (from packages/backend/)

// test("user can complete onboarding", async () => {
//   const t = convexTest(schema);
//   const userId = await t.run(async (ctx) => {
//     return await ctx.db.insert("users", { name: "Test User" });
//   });
//
//   const asUser = t.withIdentity({ subject: userId });
//   const profileId = await asUser.mutation(api.profiles.completeOnboarding, {
//     displayName: "Test User",
//     injuryType: "ACL tear",
//     recoveryStage: "early_rehab",
//     emotionalState: "hopeful",
//     goals: ["Return to sport"],
//     supportGroups: ["acl"],
//   });
//
//   expect(profileId).toBeDefined();
//   const profile = await t.run(async (ctx) => ctx.db.get(profileId));
//   expect(profile?.displayName).toBe("Test User");
// });

// test("user can create a post", async () => {
//   const t = convexTest(schema);
//   // ... setup user + profile, then create post
// });

// test("journal upserts by date", async () => {
//   const t = convexTest(schema);
//   // ... add two entries for the same date, verify only one row exists
// });

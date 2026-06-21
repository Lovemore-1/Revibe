// =============================================================================
// ROW-LEVEL SECURITY (RLS)
// =============================================================================
// Define per-table access rules to enforce data ownership at the database level.
// When integrated with functions.ts, every authQuery/authMutation automatically
// respects these rules — no manual checks needed in each handler.
//
// See: https://stack.convex.dev/row-level-security
//
// import type { DataModel } from "./_generated/dataModel";
// import type { Rules } from "convex-helpers/server/rowLevelSecurity";
// import type { Doc } from "./_generated/dataModel";
//
// export const rules: Rules<DataModel, { user: Doc<"users"> }> = {
//   userProfiles: {
//     read: async ({ user }, doc) => doc.userId === user._id,
//     modify: async ({ user }, doc) => doc.userId === user._id,
//     insert: async ({ user }, doc) => doc.userId === user._id,
//   },
//   posts: {
//     // Posts are public to read, but only the author can modify/delete
//     read: async () => true,
//     modify: async ({ user }, doc) => doc.userId === user._id,
//     insert: async ({ user }, doc) => doc.userId === user._id,
//   },
//   journalEntries: {
//     read: async ({ user }, doc) => doc.userId === user._id,
//     modify: async ({ user }, doc) => doc.userId === user._id,
//     insert: async ({ user }, doc) => doc.userId === user._id,
//   },
// };

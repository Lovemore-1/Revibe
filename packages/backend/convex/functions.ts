/**
 * Custom query/mutation/action wrappers that inject an authenticated user
 * into the context. Every authQuery and authMutation automatically enforces
 * auth — no manual getAuthUserId() calls needed in handlers.
 */
import { ConvexError } from "convex/values";
import { customAction, customMutation, customQuery } from "convex-helpers/server/customFunctions";
import { getAuthUserId } from "@convex-dev/auth/server";
import { action, mutation, query } from "./_generated/server";
import type { Doc } from "./_generated/dataModel";

type AuthCtx = { user: Doc<"users"> };

export const authQuery = customQuery(query, {
  args: {},
  input: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (userId === null) throw new ConvexError("Not authenticated");
    const user = await ctx.db.get(userId);
    if (user === null) throw new ConvexError("User record not found");
    return { ctx: { ...ctx, user } as typeof ctx & AuthCtx, args: {} };
  },
});

export const authMutation = customMutation(mutation, {
  args: {},
  input: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (userId === null) throw new ConvexError("Not authenticated");
    const user = await ctx.db.get(userId);
    if (user === null) throw new ConvexError("User record not found");
    return { ctx: { ...ctx, user } as typeof ctx & AuthCtx, args: {} };
  },
});

export const authAction = customAction(action, {
  args: {},
  input: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (userId === null) throw new ConvexError("Not authenticated");
    return {
      ctx: { ...ctx, user: { _id: userId } } as typeof ctx & {
        user: { _id: typeof userId };
      },
      args: {},
    };
  },
});

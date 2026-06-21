import { v } from "convex/values";
import type { Doc, Id } from "./_generated/dataModel";
import type { QueryCtx } from "./_generated/server";
import { authMutation, authQuery } from "./functions";
import { feedPostValidator, moodValidator, postKindValidator } from "./model";

type DbCtx = { db: QueryCtx["db"] };

interface AuthorSummary {
  authorName: string;
  authorInjury: string;
  authorProgress: number;
  authorIsPro: boolean;
}

interface CommentPreview {
  _id: Id<"postComments">;
  body: string;
  createdAt: number;
  authorName: string;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

async function getAuthorSummary(
  ctx: DbCtx,
  userId: Id<"users">,
  proUserIds: Set<string>,
): Promise<AuthorSummary> {
  const profile = await ctx.db
    .query("userProfiles")
    .withIndex("by_userId", (q) => q.eq("userId", userId))
    .unique();

  if (profile) {
    return {
      authorName: profile.displayName,
      authorInjury: profile.injuryType,
      authorProgress: profile.recoveryProgress,
      authorIsPro: proUserIds.has(userId),
    };
  }

  const user = await ctx.db.get(userId);
  return {
    authorName: user?.name ?? user?.email?.split("@")[0] ?? "Revibe member",
    authorInjury: "Recovery journey",
    authorProgress: 0,
    authorIsPro: false,
  };
}

/**
 * Batch-enrich a list of posts.
 *
 * Key optimisation over the old N+1 approach:
 *  - One query fetches ALL liked post IDs for the current user.
 *  - Author profiles are fetched once per unique userId and cached in a Map.
 *  - Only postComments still requires one query per post (Convex has no
 *    GROUP-BY-LIMIT equivalent), but authors inside comments reuse the cache.
 */
async function enrichPosts(
  ctx: DbCtx,
  posts: Doc<"posts">[],
  currentUserId: Id<"users">,
) {
  if (posts.length === 0) return [];

  // 1️⃣  All likes for this user in a single index scan
  const myLikes = await ctx.db
    .query("postLikes")
    .withIndex("by_userId", (q) => q.eq("userId", currentUserId))
    .collect();
  const likedPostIds = new Set(myLikes.map((l) => l.postId as string));

  // 2️⃣  Collect unique author IDs across posts (typically << posts.length)
  const uniqueAuthorIds = [...new Set(posts.map((p) => p.userId as string))];

  // 3️⃣  Fetch active Pro subscriptions for those authors in one scan
  //     (we check the subscriptions table instead of per-user calls)
  const proUserIds = new Set<string>();
  for (const authorId of uniqueAuthorIds) {
    const sub = await ctx.db
      .query("subscriptions")
      .withIndex("by_userId", (q) => q.eq("userId", authorId as Id<"users">))
      .unique();
    if (sub && sub.tier === "pro" && sub.status === "active" && sub.currentPeriodEnd > Date.now()) {
      proUserIds.add(authorId);
    }
  }

  // 4️⃣  Author profile cache
  const authorCache = new Map<string, AuthorSummary>();
  const getAuthorCached = async (userId: Id<"users">) => {
    const key = userId as string;
    if (!authorCache.has(key)) {
      authorCache.set(key, await getAuthorSummary(ctx, userId, proUserIds));
    }
    return authorCache.get(key)!;
  };

  // Pre-warm cache for post authors
  await Promise.all(uniqueAuthorIds.map((id) => getAuthorCached(id as Id<"users">)));

  // 5️⃣  Enrich each post
  const enriched = [];
  for (const post of posts) {
    const comments = await ctx.db
      .query("postComments")
      .withIndex("by_postId", (q) => q.eq("postId", post._id))
      .order("desc")
      .take(2);

    const commentPreviews: CommentPreview[] = [];
    for (const comment of comments) {
      const author = await getAuthorCached(comment.userId);
      commentPreviews.push({
        _id: comment._id,
        body: comment.body,
        createdAt: comment.createdAt,
        authorName: author.authorName,
      });
    }

    const author = await getAuthorCached(post.userId);
    enriched.push({
      ...post,
      ...author,
      likedByMe: likedPostIds.has(post._id as string),
      comments: commentPreviews,
    });
  }

  return enriched;
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

export const listFeed = authQuery({
  args: {},
  returns: v.array(feedPostValidator),
  handler: async (ctx) => {
    const posts = await ctx.db.query("posts").order("desc").take(40);
    return enrichPosts(ctx, posts, ctx.user._id);
  },
});

export const listByCommunity = authQuery({
  args: { communitySlug: v.string() },
  returns: v.array(feedPostValidator),
  handler: async (ctx, args) => {
    const posts = await ctx.db
      .query("posts")
      .withIndex("by_communitySlug", (q) => q.eq("communitySlug", args.communitySlug))
      .order("desc")
      .take(40);
    return enrichPosts(ctx, posts, ctx.user._id);
  },
});

export const create = authMutation({
  args: {
    body: v.string(),
    mood: moodValidator,
    kind: postKindValidator,
    communitySlug: v.optional(v.string()),
  },
  returns: v.id("posts"),
  handler: async (ctx, args) => {
    const body = args.body.trim();
    if (body.length < 3) throw new Error("Share a little more about your recovery update");

    const profile = await ctx.db
      .query("userProfiles")
      .withIndex("by_userId", (q) => q.eq("userId", ctx.user._id))
      .unique();
    if (!profile) throw new Error("Complete onboarding before posting");

    return await ctx.db.insert("posts", {
      userId: ctx.user._id,
      body,
      mood: args.mood,
      kind: args.kind,
      communitySlug: args.communitySlug,
      likeCount: 0,
      commentCount: 0,
      createdAt: Date.now(),
    });
  },
});

export const toggleLike = authMutation({
  args: { postId: v.id("posts") },
  returns: v.boolean(),
  handler: async (ctx, args) => {
    const post = await ctx.db.get(args.postId);
    if (!post) throw new Error("Post not found");

    const existing = await ctx.db
      .query("postLikes")
      .withIndex("by_postId_and_userId", (q) =>
        q.eq("postId", args.postId).eq("userId", ctx.user._id),
      )
      .unique();

    if (existing) {
      await ctx.db.delete(existing._id);
      await ctx.db.patch(args.postId, { likeCount: Math.max(0, post.likeCount - 1) });
      return false;
    }

    await ctx.db.insert("postLikes", { postId: args.postId, userId: ctx.user._id });
    await ctx.db.patch(args.postId, { likeCount: post.likeCount + 1 });
    return true;
  },
});

export const addComment = authMutation({
  args: { postId: v.id("posts"), body: v.string() },
  returns: v.null(),
  handler: async (ctx, args) => {
    const post = await ctx.db.get(args.postId);
    if (!post) throw new Error("Post not found");

    const body = args.body.trim();
    if (body.length < 2) throw new Error("Comment cannot be empty");

    await ctx.db.insert("postComments", {
      postId: args.postId,
      userId: ctx.user._id,
      body,
      createdAt: Date.now(),
    });
    await ctx.db.patch(args.postId, { commentCount: post.commentCount + 1 });
    return null;
  },
});

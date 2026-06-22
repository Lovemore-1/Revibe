/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type * as auth from "../auth.js";
import type * as coach from "../coach.js";
import type * as communities from "../communities.js";
import type * as communityData from "../communityData.js";
import type * as env from "../env.js";
import type * as functions from "../functions.js";
import type * as http from "../http.js";
import type * as journal from "../journal.js";
import type * as messages from "../messages.js";
import type * as migrations from "../migrations.js";
import type * as model from "../model.js";
import type * as posts from "../posts.js";
import type * as profiles from "../profiles.js";
import type * as rateLimit from "../rateLimit.js";
import type * as subscriptions from "../subscriptions.js";
import type * as validators from "../validators.js";

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";

declare const fullApi: ApiFromModules<{
  auth: typeof auth;
  coach: typeof coach;
  communities: typeof communities;
  communityData: typeof communityData;
  env: typeof env;
  functions: typeof functions;
  http: typeof http;
  journal: typeof journal;
  messages: typeof messages;
  migrations: typeof migrations;
  model: typeof model;
  posts: typeof posts;
  profiles: typeof profiles;
  rateLimit: typeof rateLimit;
  subscriptions: typeof subscriptions;
  validators: typeof validators;
}>;

/**
 * A utility for referencing Convex functions in your app's public API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = api.myModule.myFunction;
 * ```
 */
export declare const api: FilterApi<
  typeof fullApi,
  FunctionReference<any, "public">
>;

/**
 * A utility for referencing Convex functions in your app's internal API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = internal.myModule.myFunction;
 * ```
 */
export declare const internal: FilterApi<
  typeof fullApi,
  FunctionReference<any, "internal">
>;

export declare const components: {
  actionCache: import("@convex-dev/action-cache/_generated/component.js").ComponentApi<"actionCache">;
  migrations: import("@convex-dev/migrations/_generated/component.js").ComponentApi<"migrations">;
  rateLimiter: import("@convex-dev/rate-limiter/_generated/component.js").ComponentApi<"rateLimiter">;
  pushNotifications: import("@convex-dev/expo-push-notifications/_generated/component.js").ComponentApi<"pushNotifications">;
  workflow: import("@convex-dev/workflow/_generated/component.js").ComponentApi<"workflow">;
  agent: import("@convex-dev/agent/_generated/component.js").ComponentApi<"agent">;
  rag: import("@convex-dev/rag/_generated/component.js").ComponentApi<"rag">;
  crons: import("@convex-dev/crons/_generated/component.js").ComponentApi<"crons">;
  shardedCounter: import("@convex-dev/sharded-counter/_generated/component.js").ComponentApi<"shardedCounter">;
  aggregate: import("@convex-dev/aggregate/_generated/component.js").ComponentApi<"aggregate">;
};

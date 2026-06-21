/**
 * Type-safe backend environment variables for ReVIBE.
 *
 * Add new vars to the schema below. Never call process.env.X directly
 * outside this file.
 */

import { v } from "convex/values";

// ── Schema ──────────────────────────────────────────────────────────────────
// Add your own env vars here. Examples:
//   MY_API_KEY: v.string(),
//   MAX_ITEMS: v.number(),
//   ENABLE_FEATURE: v.boolean(),
// ────────────────────────────────────────────────────────────────────────────
const schema = {
  /** Public URL of this Convex deployment (used in auth redirects) */
  SITE_URL: v.optional(v.string()),
};

// Build the env object from process.env, validated against the schema.
function buildEnv() {
  const result: Record<string, unknown> = {};
  for (const key of Object.keys(schema)) {
    result[key] = process.env[key];
  }
  return result as {
    SITE_URL?: string;
  };
}

export const env = buildEnv();

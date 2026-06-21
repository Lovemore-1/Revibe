import { RateLimiter, MINUTE, HOUR } from "@convex-dev/rate-limiter";
import { components } from "./_generated/api";

export const rateLimiter = new RateLimiter(components.rateLimiter, {
  // Posts: max 20 per hour, burst up to 5 quickly
  createPost: { kind: "token bucket", rate: 20, period: HOUR, capacity: 5 },

  // Comments: max 30 per minute, burst up to 10
  addComment: { kind: "token bucket", rate: 30, period: MINUTE, capacity: 10 },

  // Messages: max 60 per minute, burst up to 20
  sendMessage: { kind: "token bucket", rate: 60, period: MINUTE, capacity: 20 },

  // Likes: max 100 per minute (generous — users tap fast)
  toggleLike: { kind: "token bucket", rate: 100, period: MINUTE, capacity: 30 },

  // Onboarding: 5 attempts per hour (prevent profile spam)
  completeOnboarding: { kind: "fixed window", rate: 5, period: HOUR },

  // Subscription activations: 10 per hour (prevent abuse)
  activateSubscription: { kind: "fixed window", rate: 10, period: HOUR },
});

import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";

export interface SubscriptionStatus {
  isPro: boolean;
  tier: "free" | "pro";
  status?: "active" | "cancelled" | "expired";
  currentPeriodEnd?: number;
  cancelAtPeriodEnd?: boolean;
  isLoading: boolean;
}

/**
 * Free launch phase: every user gets full access, and no paywalls, usage
 * limits, upgrade prompts, or prices are shown anywhere in the app.
 *
 * To re-enable paid Pro tiers later, set this to false and wire up a real
 * payment provider (Stripe on web / RevenueCat on native) so that
 * `subscriptions.activateSubscription` is driven by an actual purchase.
 */
const FREE_LAUNCH_MODE = true;

/**
 * Returns the current user's subscription status.
 *
 * Usage:
 *   const { isPro, isLoading } = useSubscription();
 */
export function useSubscription(): SubscriptionStatus {
  // Hook must run unconditionally even if we ignore the result below.
  const result = useQuery(api.subscriptions.getMine);

  if (FREE_LAUNCH_MODE) {
    return { isPro: true, tier: "pro", status: "active", isLoading: false };
  }

  if (result === undefined) {
    return { isPro: false, tier: "free", isLoading: true };
  }

  return { ...result, isLoading: false };
}

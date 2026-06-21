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
 * Returns the current user's subscription status.
 *
 * Usage:
 *   const { isPro, isLoading } = useSubscription();
 */
export function useSubscription(): SubscriptionStatus {
  const result = useQuery(api.subscriptions.getMine);

  if (result === undefined) {
    return { isPro: false, tier: "free", isLoading: true };
  }

  return { ...result, isLoading: false };
}

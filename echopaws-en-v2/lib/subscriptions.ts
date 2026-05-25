import Stripe from "stripe";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

export type SubscriptionRecord = {
  user_id: string;
  plan: string;
  status: string;
  stripe_customer_id: string | null;
  stripe_subscription_id: string | null;
  stripe_price_id: string | null;
  current_period_start: string | null;
  current_period_end: string | null;
  cancel_at_period_end: boolean;
  metadata: Record<string, unknown>;
};

function toIso(timestamp?: number | null) {
  if (!timestamp) return null;
  return new Date(timestamp * 1000).toISOString();
}

export function mapStripeSubscriptionToRecord(
  subscription: Stripe.Subscription,
  userId: string,
  fallbackPlan = "vip",
): SubscriptionRecord {
  const firstItem = subscription.items.data[0];
  const priceId = firstItem?.price?.id ?? null;
  const metadataPlan = subscription.metadata?.plan || fallbackPlan;

  return {
    user_id: userId,
    plan: metadataPlan,
    status: subscription.status,
    stripe_customer_id:
      typeof subscription.customer === "string" ? subscription.customer : subscription.customer?.id ?? null,
    stripe_subscription_id: subscription.id,
    stripe_price_id: priceId,
    current_period_start: toIso(subscription.items.data[0]?.current_period_start ?? null),
    current_period_end: toIso(subscription.items.data[0]?.current_period_end ?? null),
    cancel_at_period_end: subscription.cancel_at_period_end,
    metadata: subscription.metadata ?? {},
  };
}

export async function upsertSubscription(record: SubscriptionRecord) {
  const supabase = createSupabaseAdminClient();
  const { error } = await supabase.from("subscriptions").upsert(record, {
    onConflict: "stripe_subscription_id",
  });

  if (error) {
    throw error;
  }
}

export async function findUserIdByStripeCustomerId(customerId: string) {
  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase
    .from("subscriptions")
    .select("user_id")
    .eq("stripe_customer_id", customerId)
    .order("updated_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) {
    throw error;
  }

  return data?.user_id ?? null;
}

export async function findSubscriptionByUserId(userId: string) {
  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase
    .from("subscriptions")
    .select("*")
    .eq("user_id", userId)
    .order("updated_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) {
    throw error;
  }

  return data;
}
